// GeometryFactory: utilities to build line and polygon groups for geopolitical layers
import * as THREE from 'three';
import { validateRing } from './polygonNormalize';
import { normalizeOuterRingDetailed } from './pipeline/stages/normalizeStage.ts';
import { determineProjectionMode, type ProjectionMode } from './pipeline/stages/projectionStage.ts';
import { projectToTangentPlane } from './projections/tangentPlane';
import { projectPolarLambert } from './projections/polarLambert';
import { latLonToVector3 } from '../utils/latLonToVector3';
import { clearGroup } from '../utils/disposal';
import { GeometryCacheLRU, buildCacheKey } from './pipeline/stages/cacheStage';
import { hashRings } from './pipeline/utils/hashing';
import { getHoleWallPerimeterThreshold, GEO_PIPELINE_VERSION } from './pipeline/config';

export interface LineFeature {
  id: string;
  coordinates: [number, number][]; // [lng, lat]
}

export interface PolygonFeature {
  id: string;
  // First ring outer boundary; subsequent (optional) inner holes
  rings: [number, number][][]; // array of rings -> array of [lng, lat]
}

export interface BorderBuildOptions {
  radius?: number;
  elevation?: number;
  color?: number;
  opacity?: number;
}

export interface TerritoryFillOptions {
  radius?: number;
  elevation?: number;
  thickness?: number; // radial thickness to extrude outward (absolute world units)
  color?: number;
  opacity?: number;
  side?: THREE.Side;
  usePolygonOffset?: boolean;
  polygonOffsetFactor?: number;
  polygonOffsetUnits?: number;
}

interface GeometryFactoryType {
  _cache: GeometryCacheLRU;
  buildBorderLines: (features: LineFeature[], opts?: BorderBuildOptions) => THREE.Group;
  buildTerritoryPolygons: (features: PolygonFeature[], opts?: TerritoryFillOptions) => THREE.Group;
  disposeGroup: (group: THREE.Group) => void;
}

export const GeometryFactory: GeometryFactoryType = {
  _cache: new GeometryCacheLRU(300, 2_000_000),
  buildBorderLines(features: LineFeature[], opts: BorderBuildOptions = {}): THREE.Group {
    const group = new THREE.Group();
    const { radius = 100, elevation = 0.2, color = 0x00ff41, opacity = 0.85 } = opts;
    features.forEach(f => {
      if (!Array.isArray(f.coordinates) || f.coordinates.length < 2) return;
      // Align projection with Globe overlays convention: invertX=false and flip Z
      const pts = f.coordinates.map(([lng, lat]) => {
        const v = latLonToVector3(lat, lng, { radius, elevation, invertX: false });
        v.z = -v.z;
        return v;
      });
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      const line = new THREE.Line(geom, mat);
      line.name = `border:${f.id}`;
      group.add(line);
    });
    return group;
  },

  buildTerritoryPolygons(features: PolygonFeature[], opts: TerritoryFillOptions = {}): THREE.Group {
    const group = new THREE.Group();
  // Stage 1 rendering safety defaults: slight elevation epsilon and FrontSide with polygonOffset
    const {
      radius = 100,
      elevation,
      thickness = 0, // 0 keeps previous flat behavior
      color = 0x0044ff,
      opacity = 0.4,
      side = THREE.FrontSide,
      usePolygonOffset = true,
      polygonOffsetFactor = -1.5,
      polygonOffsetUnits = -1.5
    } = opts;
      // Default elevation: 0.5% of globe radius (provides stronger separation from sphere)
      const appliedElevation = typeof elevation === 'number' ? elevation : radius * 0.05; // e.g. R=100 => 0.5
    features.forEach(f => {
      if (!Array.isArray(f.rings) || f.rings.length === 0) return;
      const outer = f.rings[0];
      if (outer.length < 3) return;
      // Feature flag (URL ?geoPolyNormalize=0 to disable)
      let enableNormalization = true;
      try {
        if (typeof window !== 'undefined') {
          const sp = new URLSearchParams(window.location.search);
          if (sp.get('geoPolyNormalize') === '0') enableNormalization = false;
        }
      } catch (_err) {
        // Ignore environment/URL parsing errors (SSR etc.)
      }

      const norm: { classification: string; parts: [number, number][][]; span: number } = enableNormalization
        ? normalizeOuterRingDetailed(outer)
        : { classification: 'plain', parts: [outer], span: 0 };
      // Optional diagnostics flag
      try {
        if (typeof window !== 'undefined') {
          const sp = new URLSearchParams(window.location.search);
          if (sp.has('geoPolyDiag')) {
            console.log('[geoPolyDiag] feature', f.id, 'classification', norm.classification, 'parts', norm.parts.length, 'span', norm.span.toFixed(2));
          }
        }
      } catch (_err) { /* ignore */ }
      const outerParts = norm.parts;

      // Determine projection mode early (needed for cache key / initial build)
      let projectionMode: ProjectionMode = determineProjectionMode(norm);

      // Optional fallback flag (?geoPolyFallback=1) attempts a better projection if edge ratio too high.
      let enableFallback = false;
      try {
        if (typeof window !== 'undefined') {
          const sp = new URLSearchParams(window.location.search);
          enableFallback = sp.has('geoPolyFallback') && sp.get('geoPolyFallback') !== '0';
        }
      } catch(_err) { /* ignore */ }

      // Cache support (URL ?geoPolyCache=0 to disable)
      let enableCache = true;
      try {
        if (typeof window !== 'undefined') {
          const sp = new URLSearchParams(window.location.search);
          if (sp.get('geoPolyCache') === '0') enableCache = false;
        }
      } catch(_err) { /* ignore */ }
  const version = GEO_PIPELINE_VERSION;
      const hash = hashRings(f.rings);
      let cacheKey = buildCacheKey({ featureId: f.id, hash: `${hash}:${projectionMode}:${thickness>0?'X':'F'}`, version });
      if (enableCache) {
        const rec = GeometryFactory._cache.get(cacheKey);
        if (rec) {
          const c = new THREE.Mesh(rec.mesh.geometry, rec.mesh.material);
          c.name = `territory:${f.id}:cache`;
          group.add(c);
          return; // cached
        }
      }

      // Phase 2: hole reassignment — assign each original hole ring to exactly one outer part (best-fit) when normalization split outer boundary.
      const originalHoles = f.rings.slice(1);
      const holesPerPart = assignHolesToParts(outerParts, originalHoles);

      outerParts.forEach((outerPartRaw, partIdx) => {
        // Validation stage (Phase 3 stub) – clean duplicates / collinear points before further processing
        const val = validateRing(outerPartRaw);
        let outerPart = val.ring;
        // Diagnostics: report validation if enabled
        try {
          if (typeof window !== 'undefined') {
            const sp = new URLSearchParams(window.location.search);
            if (sp.has('geoPolyDiag') && (val.report.removedDuplicatePoints || val.report.removedCollinearPoints)) {
              console.log('[geoPolyDiag] validation', f.id, 'part', partIdx, val.report);
            }
            if (sp.has('geoPolyDiag') && val.report.selfIntersections > 0) {
              console.warn('[geoPolyDiag] self-intersections detected', f.id, 'part', partIdx, val.report.selfIntersections);
            }
          }
        } catch(_err) { /* ignore */ }
        // Unwrap within part for minor continuity adjustments
        outerPart = unwrapRing(outerPart);
  const buildStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  let geom: THREE.BufferGeometry;
        if ((projectionMode === 'tangent' || projectionMode === 'lambert')) {
          const partHoles = holesPerPart[partIdx];
            if (thickness === 0) {
              geom = projectionMode === 'tangent'
                ? buildFlatPolygonTangent(outerPart, partHoles, { radius, elevation: appliedElevation })
                : buildFlatPolygonLambert(outerPart, partHoles, { radius, elevation: appliedElevation });
            } else {
              geom = buildProjectedExtrudedPolygon(outerPart, partHoles, {
                radius,
                baseElevation: appliedElevation,
                thickness,
                mode: projectionMode
              });
            }
        } else {
          const shapePoints2D: THREE.Vector2[] = [];
          outerPart.forEach(([lng, lat]) => { shapePoints2D.push(new THREE.Vector2(lng, lat)); });
          correctWinding(shapePoints2D, /*wantCCW*/ true);
          const shape = new THREE.Shape(shapePoints2D);
          const partHoles = holesPerPart[partIdx];
          for (let i = 0; i < partHoles.length; i++) {
            let hole = partHoles[i];
            if (hole.length < 3) continue;
            hole = unwrapRing(hole);
            const path = new THREE.Path();
            const holePts: THREE.Vector2[] = [];
            hole.forEach(([lng, lat]) => { holePts.push(new THREE.Vector2(lng, lat)); });
            correctWinding(holePts, /*wantCCW*/ false);
            holePts.forEach((v, idx) => { if (idx === 0) path.moveTo(v.x, v.y); else path.lineTo(v.x, v.y); });
            shape.holes.push(path);
          }
          geom = thickness > 0
            ? buildSphericalExtrudedShape(shape, {
                segments: 32,
                radius,
                baseElevation: appliedElevation,
                thickness
              })
            : new THREE.ShapeGeometry(shape, 8);

          if (geom.getAttribute('position')) {
            const pos = geom.getAttribute('position');
            if (thickness === 0) {
              for (let i = 0; i < pos.count; i++) {
                const lng = pos.getX(i);
                const lat = pos.getY(i);
                const v3 = latLonToVector3(lat, lng, { radius, elevation: appliedElevation, invertX: false });
                pos.setXYZ(i, v3.x, v3.y, -v3.z);
              }
              pos.needsUpdate = true;
              geom.computeVertexNormals();
            }
          }
        }
        // Fallback: if enabled, non-extruded, and initial mode was legacy, evaluate edge ratio and retry with tangent if poor.
        if (enableFallback && thickness === 0 && projectionMode === 'legacy') {
          const metrics = computeCapEdgeMetrics(geom);
          if (metrics && metrics.ratio > 12) {
            // rebuild with tangent projection for this part only
            projectionMode = 'tangent';
            const partHoles = holesPerPart[partIdx];
            geom.dispose();
            geom = buildFlatPolygonTangent(outerPart, partHoles, { radius, elevation: appliedElevation });
            // Update cache key to reflect new projection choice
            cacheKey = buildCacheKey({ featureId: f.id, hash: `${hash}:${projectionMode}:${thickness>0?'X':'F'}`, version });
          }
        }

        const mat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          side,
          depthWrite: false,
          depthTest: true,
          polygonOffset: usePolygonOffset,
          polygonOffsetFactor,
          polygonOffsetUnits
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.name = `territory:${f.id}${outerParts.length > 1 ? `:part${partIdx}` : ''}`;
        group.add(mesh);
        // Insert into cache after build
        try {
          if (enableCache) {
            const posAttr = geom.getAttribute('position');
            GeometryFactory._cache.set({
              key: cacheKey,
              mesh,
              vertices: posAttr ? posAttr.count : 0,
              createdAt: performance.now(),
              lastAccess: performance.now(),
              sizeEstimate: (posAttr ? posAttr.count * 12 : 0) + (geom.getIndex() ? geom.getIndex()!.count * 4 : 0)
            });
            // If diagnostics flag for cache stats present, expose global snapshot each insertion
            try {
              if (typeof window !== 'undefined') {
                const sp = new URLSearchParams(window.location.search);
                if (sp.has('geoPolyDiagCache')) {
                  const stats = GeometryFactory._cache.getStats();
                  interface CacheStatWindow extends Window { __geoPolyCacheStats?: ReturnType<typeof GeometryFactory._cache.getStats>; }
                  (window as CacheStatWindow).__geoPolyCacheStats = stats;
                }
              }
            } catch(_err) {/* ignore */}
          }
        } catch(_err) { /* ignore cache insertion */ }
        // Diagnostics: edge / build metrics (all projection modes) when flag present
        try {
          if (typeof window !== 'undefined') {
            const sp = new URLSearchParams(window.location.search);
            if (sp.has('geoPolyDiagEdges')) {
              const metrics2 = computeCapEdgeMetrics(geom);
              if (metrics2) {
                const { ratio } = metrics2;
                const buildEnd = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                const buildMs = buildEnd - buildStart;
                const w = window as unknown as { __geoPolyDiagEdges?: Record<string, { parts: number; maxEdgeRatio: number; triangles: number; vertices: number; projection: string; extruded: boolean; maxBuildMs: number }> };
                if (!w.__geoPolyDiagEdges) w.__geoPolyDiagEdges = {};
                const rec = w.__geoPolyDiagEdges[f.id] || {
                  parts: 0,
                  maxEdgeRatio: 0,
                  triangles: 0,
                  vertices: 0,
                  projection: projectionMode,
                  extruded: thickness > 0,
                  maxBuildMs: 0
                };
                rec.parts += 1;
                rec.maxEdgeRatio = Math.max(rec.maxEdgeRatio, ratio);
                const idx = geom.getIndex();
                const posAttr = geom.getAttribute('position');
                if (idx) rec.triangles += idx.count / 3;
                if (posAttr) rec.vertices += posAttr.count;
                rec.maxBuildMs = Math.max(rec.maxBuildMs, buildMs);
                w.__geoPolyDiagEdges[f.id] = rec;
                if (ratio > 12) {
                  console.warn('[geoPolyDiagEdges] high edge ratio', f.id, 'part', partIdx, 'ratio', ratio.toFixed(2), 'proj', projectionMode);
                }
              }
            }
          }
        } catch(_err) { /* ignore metrics errors */ }
      });
    });
    return group;
  },

  disposeGroup(group: THREE.Group) {
    clearGroup(group);
  }
};

interface SphericalExtrudeOptions {
  segments: number;
  radius: number;
  baseElevation: number; // appliedElevation baseline
  thickness: number;     // outward radial thickness
}

// Build a spherical extruded polygon mesh: top + bottom (bottom flush with sphere+baseElevation) + side walls.
function buildSphericalExtrudedShape(shape: THREE.Shape, opts: SphericalExtrudeOptions): THREE.BufferGeometry {
  const { radius, baseElevation, thickness } = opts;
  // Generate 2D geometry to get faces (top cap). We'll clone it for bottom cap.
  const flat = new THREE.ShapeGeometry(shape, 16); // more segments for nicer boundary smoothing
  const pos = flat.getAttribute('position');
  const topPositions: number[] = [];
  const bottomPositions: number[] = [];
  const index = flat.getIndex();

  // Project each vertex twice: once at baseElevation, once at baseElevation+thickness
  for (let i = 0; i < pos.count; i++) {
    const lng = pos.getX(i);
    const lat = pos.getY(i);
    const baseV = latLonToVector3(lat, lng, { radius, elevation: baseElevation, invertX: false });
    const topV = latLonToVector3(lat, lng, { radius, elevation: baseElevation + thickness, invertX: false });
    // Flip Z to match globe convention
    topPositions.push(topV.x, topV.y, -topV.z);
    bottomPositions.push(baseV.x, baseV.y, -baseV.z);
  }

  // Build top and bottom faces (top uses original winding; bottom reversed)
  const topIndices = index ? Array.from(index.array) : [...Array(pos.count).keys()];
  const bottomIndices = topIndices.slice().reverse();

  // For side walls, iterate shape contour (outer ring only) and connect successive vertices.
  const contour = shape.getPoints();
  const wallPositions: number[] = [];
  const wallIndices: number[] = [];
  if (contour.length > 1) {
    const n = contour.length - 1; // last duplicates first for closed path
    let vertOffset = 0;
    for (let i = 0; i < n; i++) {
      const a = contour[i];
      const b = contour[(i + 1) % n];
      const baseA = latLonToVector3(a.y, a.x, { radius, elevation: baseElevation, invertX: false });
      const topA = latLonToVector3(a.y, a.x, { radius, elevation: baseElevation + thickness, invertX: false });
      const baseB = latLonToVector3(b.y, b.x, { radius, elevation: baseElevation, invertX: false });
      const topB = latLonToVector3(b.y, b.x, { radius, elevation: baseElevation + thickness, invertX: false });
      // Push quad (A->B) as two triangles
      wallPositions.push(
        topA.x, topA.y, -topA.z,
        topB.x, topB.y, -topB.z,
        baseB.x, baseB.y, -baseB.z,
        baseA.x, baseA.y, -baseA.z
      );
      // Indices (two triangles): (0,1,2) (2,3,0) relative to current quad
      wallIndices.push(vertOffset, vertOffset + 1, vertOffset + 2, vertOffset + 2, vertOffset + 3, vertOffset);
      vertOffset += 4;
    }
  }

  // Merge buffers
  const geom = new THREE.BufferGeometry();
  const allPositions = new Float32Array(
    topPositions.length + bottomPositions.length + wallPositions.length
  );
  allPositions.set(topPositions, 0);
  allPositions.set(bottomPositions, topPositions.length);
  allPositions.set(wallPositions, topPositions.length + bottomPositions.length);

  const topCount = topPositions.length / 3;
  const bottomCount = bottomPositions.length / 3;
  // const wallVertCount = wallPositions.length / 3; // not needed currently

  const topIdx = topIndices;
  const bottomIdx = bottomIndices.map(i => i + topCount); // shift bottom
  const wallIdx = wallIndices.map(i => i + topCount + bottomCount);
  const allIdx = new Uint32Array(topIdx.length + bottomIdx.length + wallIdx.length);
  allIdx.set(topIdx, 0);
  allIdx.set(bottomIdx, topIdx.length);
  allIdx.set(wallIdx, topIdx.length + bottomIdx.length);

  geom.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
  geom.setIndex(new THREE.BufferAttribute(allIdx, 1));
  geom.computeVertexNormals();
  // Expose cap triangle count (top face only) for diagnostics (topIdx length / 3)
  geom.userData.capTriCount = topIndices.length / 3;
  return geom;
}

// --- Helpers for large, dateline-spanning polygons ---

// Adjust ring longitudes so that successive edges never exceed 180° jump, preventing giant cross-map triangles.
function unwrapRing(ring: [number, number][]): [number, number][] {
  if (ring.length === 0) return ring;
  const result: [number, number][] = [];
  let prevLng = ring[0][0];
  let offset = 0;
  result.push([prevLng, ring[0][1]]);
  for (let i = 1; i < ring.length; i++) {
    const lng = ring[i][0];
    const lat = ring[i][1];
  const delta = lng - prevLng;
    if (delta > 180) {
      // e.g. 170 -> -170 (crossing eastward over dateline)
      offset -= 360;
    } else if (delta < -180) {
      // e.g. -170 -> 170 (crossing westward)
      offset += 360;
    }
    const adj = lng + offset;
    result.push([adj, lat]);
    prevLng = lng;
  }
  return result;
}

// Compute signed area in the current lat/lon 2D projection (simple planar area).
function signedArea(pts: THREE.Vector2[]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    area += a.x * b.y - b.x * a.y;
  }
  return area * 0.5;
}

// Ensure winding (outer CCW positive area, holes CW negative area) for more robust triangulation.
function correctWinding(pts: THREE.Vector2[], wantCCW: boolean) {
  if (pts.length < 3) return;
  const area = signedArea(pts);
  const isCCW = area > 0;
  if (wantCCW !== isCCW) pts.reverse();
}

// --- Hole Reassignment (Phase 2) ---
// Assign each hole to the outer part that contains it using ray casting in the part's unwrapped longitude domain.
function assignHolesToParts(outerParts: [number,number][][], holes: [number,number][][]): [number,number][][][] {
  const per: [number,number][][][] = outerParts.map(() => []);
  if (outerParts.length <= 1 || holes.length === 0) {
    // Trivial: all holes belong to the single part (or none if no parts)
    if (outerParts.length === 1) per[0] = holes.slice();
    return per;
  }
  // Precompute unwrapped versions and bounding boxes for each part for quicker rejection.
  const partData = outerParts.map(p => {
    const unwrapped = unwrapRing(p);
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    unwrapped.forEach(([lng, lat]) => { if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng; if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat; });
    return { unwrapped, minLng, maxLng, minLat, maxLat };
  });
  holes.forEach(holeOriginal => {
    if (holeOriginal.length < 3) return; // skip degenerate
    // If hole crosses dateline, split into sub-parts and treat each independently.
    const holeParts = splitHoleAtDateline(holeOriginal);
    holeParts.forEach(hole => {
    // Choose a test point: first vertex
    const [testLngRaw, testLat] = hole[0];
    let bestPart = -1;
    for (let pi = 0; pi < partData.length; pi++) {
      const pd = partData[pi];
      // Adjust test longitude into same domain as part by adding multiples of 360 if needed (pick variant with minimal distance to part bbox center)
      const centerLng = (pd.minLng + pd.maxLng) / 2;
      let testLng = testLngRaw;
      const delta = testLng - centerLng;
      if (delta > 180) testLng -= 360; else if (delta < -180) testLng += 360;
      // Quick bbox reject with small tolerance
      if (testLng < pd.minLng - 1 || testLng > pd.maxLng + 1 || testLat < pd.minLat - 1 || testLat > pd.maxLat + 1) continue;
      if (pointInRing(testLng, testLat, pd.unwrapped)) { bestPart = pi; break; }
    }
      if (bestPart >= 0) per[bestPart].push(hole);
      else {
        // Fallback: attach to first part to ensure hole is not lost.
        per[0].push(hole);
      }
    });
  });
  return per;
}

function pointInRing(x: number, y: number, ring: [number,number][]): boolean {
  // Ray casting algorithm (odd-even rule)
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Split a hole ring at dateline crossings similar to outer ring logic.
function splitHoleAtDateline(ring: [number,number][]): [number,number][][] {
  if (ring.length < 4) return [ring];
  const closed = ring[0][0] === ring[ring.length-1][0] && ring[0][1] === ring[ring.length-1][1];
  const work = closed ? ring.slice(0, ring.length-1) : ring.slice();
  const parts: [number,number][][] = [];
  let current: [number,number][] = [];
  const commit = () => { if (current.length) { if (current[0][0] !== current[current.length-1][0] || current[0][1] !== current[current.length-1][1]) current.push([...current[0]]); parts.push(current); current = []; } };
  for (let i = 0; i < work.length; i++) {
    const a = work[i];
    const b = work[(i+1)%work.length];
    current.push(a);
    const d = b[0]-a[0];
    if (d > 180 || d < -180) {
      const seamLon = d > 180 ? 180 : -180;
      const t = (seamLon - a[0]) / (b[0]-a[0]);
      const lat = a[1] + t * (b[1]-a[1]);
      const seam: [number,number] = [seamLon, lat];
      current.push(seam);
      commit();
      current.push(seam);
    }
  }
  commit();
  return parts.length ? parts : [ring];
}

// Build flat (non-extruded) polygon geometry using tangent plane projection.
function buildFlatPolygonTangent(outer: [number,number][], holeRings: [number,number][][], opts: { radius: number; elevation: number }): THREE.BufferGeometry {
  const { radius, elevation } = opts;
  // Collect all points (outer first, then each hole ring sequentially) for shared projection basis.
  const allPoints: { lon: number; lat: number }[] = [];
  outer.forEach(([lng, lat]) => allPoints.push({ lon: lng, lat }));
  const holeStartIndices: number[] = []; // starting index in allPoints for each hole
  holeRings.forEach(r => {
    holeStartIndices.push(allPoints.length);
    r.forEach(([lng, lat]) => allPoints.push({ lon: lng, lat }));
  });
  const proj = projectToTangentPlane(allPoints);
  // Re-slice into rings of Vector2 using projected (x,y)
  const outer2D: THREE.Vector2[] = [];
  for (let i = 0; i < outer.length; i++) {
    const p = proj.points2D[i];
    outer2D.push(new THREE.Vector2(p.x, p.y));
  }
  correctWinding(outer2D, true);
  const holes2D: THREE.Vector2[][] = [];
  for (let h = 0; h < holeRings.length; h++) {
    const ring = holeRings[h];
    if (ring.length < 3) continue;
    const start = holeStartIndices[h];
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i < ring.length; i++) {
      const p = proj.points2D[start + i];
      pts.push(new THREE.Vector2(p.x, p.y));
    }
    correctWinding(pts, false);
    holes2D.push(pts);
  }
  // Triangulate
  const faces = THREE.ShapeUtils.triangulateShape(outer2D, holes2D);
  // Build vertex array (each unique vertex once: outer + holes) and map to sphere positions directly
  const totalVerts = outer2D.length + holes2D.reduce((acc, r) => acc + r.length, 0);
  const positions = new Float32Array(totalVerts * 3);
  let writeIndex = 0;
  // Helper to write a vertex from original lat/lon at index in proj.points2D
  const writeVertex = (globalIdx: number, targetIndex: number) => {
    const p = proj.points2D[globalIdx];
    const v3 = latLonToVector3(p.lat, p.lon, { radius, elevation, invertX: false });
    positions[targetIndex*3] = v3.x;
    positions[targetIndex*3+1] = v3.y;
    positions[targetIndex*3+2] = -v3.z; // flip Z
  };
  for (let i = 0; i < outer.length; i++) writeVertex(i, writeIndex++);
  const _outerVertexCount = outer.length; // retained for future hole mapping extensions
  for (let h = 0; h < holeRings.length; h++) {
    const ring = holeRings[h];
    const start = holeStartIndices[h];
    for (let i = 0; i < ring.length; i++) writeVertex(start + i, writeIndex++);
  }
  // Build index buffer (faces reference indices relative to concatenated rings)
  const indices: number[] = [];
  faces.forEach(tri => { indices.push(tri[0], tri[1], tri[2]); });
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Lambert azimuthal equal-area (approx) projection variant for polar features.
function buildFlatPolygonLambert(outer: [number,number][], holeRings: [number,number][][], opts: { radius: number; elevation: number }): THREE.BufferGeometry {
  const { radius, elevation } = opts;
  const allPoints: { lon: number; lat: number }[] = [];
  outer.forEach(([lng, lat]) => allPoints.push({ lon: lng, lat }));
  const holeStart: number[] = [];
  holeRings.forEach(r => { holeStart.push(allPoints.length); r.forEach(([lng, lat]) => allPoints.push({ lon: lng, lat })); });
  const proj = projectPolarLambert(allPoints);
  const outer2D: THREE.Vector2[] = [];
  for (let i = 0; i < outer.length; i++) { const p = proj.points2D[i]; outer2D.push(new THREE.Vector2(p.x, p.y)); }
  correctWinding(outer2D, true);
  const holes2D: THREE.Vector2[][] = [];
  for (let h = 0; h < holeRings.length; h++) {
    const ring = holeRings[h]; if (ring.length < 3) continue;
    const start = holeStart[h]; const pts: THREE.Vector2[] = [];
    for (let i = 0; i < ring.length; i++) { const p = proj.points2D[start + i]; pts.push(new THREE.Vector2(p.x, p.y)); }
    correctWinding(pts, false); holes2D.push(pts);
  }
  const faces = THREE.ShapeUtils.triangulateShape(outer2D, holes2D);
  const totalVerts = outer2D.length + holes2D.reduce((a, r) => a + r.length, 0);
  const positions = new Float32Array(totalVerts * 3);
  let writeIndex = 0;
  const writeVertex = (globalIdx: number, targetIndex: number) => {
    const p = proj.points2D[globalIdx];
    const v3 = latLonToVector3(p.lat, p.lon, { radius, elevation, invertX: false });
    positions[targetIndex*3] = v3.x; positions[targetIndex*3+1] = v3.y; positions[targetIndex*3+2] = -v3.z;
  };
  for (let i = 0; i < outer.length; i++) writeVertex(i, writeIndex++);
  for (let h = 0; h < holeRings.length; h++) {
    const ring = holeRings[h]; const start = holeStart[h];
    for (let i = 0; i < ring.length; i++) writeVertex(start + i, writeIndex++);
  }
  const indices: number[] = [];
  faces.forEach(tri => indices.push(tri[0], tri[1], tri[2]));
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// --- Projected Extruded Polygon (tangent / lambert) ---
interface ProjectedExtrudeOptions { radius: number; baseElevation: number; thickness: number; mode: 'tangent' | 'lambert'; }
function buildProjectedExtrudedPolygon(outer: [number,number][], holeRings: [number,number][][], opts: ProjectedExtrudeOptions): THREE.BufferGeometry {
  const { radius, baseElevation, thickness, mode } = opts;
  const allPoints: { lon: number; lat: number }[] = [];
  outer.forEach(([lng, lat]) => allPoints.push({ lon: lng, lat }));
  const holeStarts: number[] = [];
  holeRings.forEach(r => { holeStarts.push(allPoints.length); r.forEach(([lng, lat]) => allPoints.push({ lon: lng, lat })); });
  const proj = mode === 'tangent' ? projectToTangentPlane(allPoints) : projectPolarLambert(allPoints);
  const outer2D: THREE.Vector2[] = [];
  for (let i=0;i<outer.length;i++){ const p=proj.points2D[i]; outer2D.push(new THREE.Vector2(p.x,p.y)); }
  correctWinding(outer2D, true);
  const holes2D: THREE.Vector2[][] = [];
  for (let h=0; h<holeRings.length; h++) {
    const ring = holeRings[h]; if (ring.length < 3) continue; const start = holeStarts[h]; const pts: THREE.Vector2[] = [];
    for (let i=0;i<ring.length;i++){ const p=proj.points2D[start+i]; pts.push(new THREE.Vector2(p.x,p.y)); }
    correctWinding(pts,false); holes2D.push(pts);
  }
  const faces = THREE.ShapeUtils.triangulateShape(outer2D, holes2D);
  const bottomCount = outer2D.length + holes2D.reduce((a,r)=>a+r.length,0);
  const totalVerts = bottomCount * 2; // bottom + top duplicate
  const positions = new Float32Array(totalVerts * 3);
  const writeVertex = (globalIdx: number, target: number, elev: number) => {
    const p = proj.points2D[globalIdx];
    const v3 = latLonToVector3(p.lat, p.lon, { radius, elevation: elev, invertX: false });
    positions[target*3] = v3.x; positions[target*3+1] = v3.y; positions[target*3+2] = -v3.z;
  };
  // Bottom
  let cursor = 0;
  for (let i=0;i<outer.length;i++) writeVertex(i, cursor++, baseElevation);
  for (let h=0; h<holeRings.length; h++) {
    const ring = holeRings[h]; const start = holeStarts[h];
    for (let i=0;i<ring.length;i++) writeVertex(start+i, cursor++, baseElevation);
  }
  // Top
  for (let i=0;i<bottomCount;i++) writeVertex(i, bottomCount + i, baseElevation + thickness);
  const indices: number[] = [];
  // Bottom faces
  faces.forEach(tri => indices.push(tri[0], tri[1], tri[2]));
  // Top faces (reverse winding)
  faces.forEach(tri => indices.push(bottomCount + tri[2], bottomCount + tri[1], bottomCount + tri[0]));
  // Outer side walls only (holes ignored for side surfaces for now; could add later)
  const outerLen = outer.length;
  for (let i=0;i<outerLen;i++) {
    const a = i;
    const b = (i+1)%outerLen;
    const aTop = bottomCount + a;
    const bTop = bottomCount + b;
    indices.push(a, b, bTop, bTop, aTop, a);
  }
  // Hole side walls (new) – build vertical quads for each hole ring.
  // Hole rings were written sequentially after outer in same order as holeRings.
  // We rely on their original winding (we forced CW for triangulation). We invert wall triangle order to orient normals inward.
  const perimThreshold = getHoleWallPerimeterThreshold();
  for (let h=0; h<holeRings.length; h++) {
    const ring = holeRings[h];
    const start = holeStarts[h]; // bottom vertex start index for this hole
    const len = ring.length;
    if (len < 3) continue;
    // Compute approximate perimeter in degree space (simple planar) to filter tiny holes
    let perim = 0;
    for (let i=0;i<len-1;i++) {
      const a = ring[i];
      const b = ring[i+1];
      const dx = b[0]-a[0];
      const dy = b[1]-a[1];
      perim += Math.sqrt(dx*dx + dy*dy);
    }
    if (perim < perimThreshold) continue;
    for (let i=0;i<len;i++) {
      const a = start + i;
      const b = start + (i+1)%len;
      const aTop = bottomCount + a;
      const bTop = bottomCount + b;
      // Inverted ordering vs outer to flip normals inward
      indices.push(a, bTop, b, bTop, a, aTop);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  // bottom faces inserted first; record capTriCount for diagnostics (bottom only)
  geom.userData.capTriCount = faces.length;
  return geom;
}

// Compute edge length ratio metrics limited to cap triangles when available.
function computeCapEdgeMetrics(geom: THREE.BufferGeometry): { ratio: number } | undefined {
  const pos = geom.getAttribute('position');
  const idx = geom.getIndex();
  if (!pos || !idx) return undefined;
  const capTriCount: number | undefined = (geom.userData && typeof geom.userData.capTriCount === 'number') ? geom.userData.capTriCount : undefined;
  const triCount = idx.count / 3;
  const limitTris = capTriCount && capTriCount > 0 && capTriCount < triCount ? capTriCount : triCount;
  const lengths: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let t = 0; t < limitTris; t++) {
    const base = t * 3;
    const i0 = idx.getX(base);
    const i1 = idx.getX(base + 1);
    const i2 = idx.getX(base + 2);
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); lengths.push(a.distanceTo(b));
    a.fromBufferAttribute(pos, i1); b.fromBufferAttribute(pos, i2); lengths.push(a.distanceTo(b));
    a.fromBufferAttribute(pos, i2); b.fromBufferAttribute(pos, i0); lengths.push(a.distanceTo(b));
  }
  if (!lengths.length) return undefined;
  lengths.sort((x,y)=>x-y);
  const median = lengths[Math.floor(lengths.length/2)] || 1;
  const max = lengths[lengths.length-1] || median;
  return { ratio: max / median };
}
