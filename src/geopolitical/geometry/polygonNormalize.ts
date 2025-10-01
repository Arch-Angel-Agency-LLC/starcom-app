// polygonNormalize.ts
// Utilities for normalizing large longitude-span polygon rings (e.g., Russia) by
// splitting them at the antimeridian (±180°) so each resulting ring spans < 180°.
// This reduces earcut / ShapeGeometry artifacts caused by gigantic chord diagonals
// when a single ring numerically wraps from +170 -> -170, etc.

export type LngLat = [number, number];

// Detect if a ring's longitudinal span (in unclamped native coordinates) exceeds threshold.
export function ringLongitudeSpan(ring: LngLat[]): number {
  if (!ring.length) return 0;
  let min = 180; let max = -180;
  for (const [lng] of ring) {
    const L = normalizeLon180(lng);
    if (L < min) min = L;
    if (L > max) max = L;
  }
  return max - min;
}

// Main entry: split an outer ring on dateline crossings so that each returned ring
// has |maxLon - minLon| <= 180. Original vertex ordering preserved within segments.
// Returned rings are individually closed (first point repeated at end if original was closed).
export function splitRingAtDateline(ring: LngLat[]): LngLat[][] {
  if (ring.length < 4) return [ring]; // need at least 3 + closure
  // Ensure we iterate without duplicate final point for splitting logic; we'll re-close later.
  const closed = isClosed(ring);
  const work: LngLat[] = closed ? ring.slice(0, ring.length - 1) : ring.slice();
  const parts: LngLat[][] = [];
  let current: LngLat[] = [];

  const pushPoint = (p: LngLat) => { current.push(p); };
  const commit = () => {
    if (current.length) {
      // Close ring
      if (!pointsEqual(current[0], current[current.length - 1])) current.push([...current[0]]);
      parts.push(current);
      current = [];
    }
  };

  for (let i = 0; i < work.length; i++) {
    const a = work[i];
    const b = work[(i + 1) % work.length];
    pushPoint(a);
    const cross = crossesDateline(a[0], b[0]);
    if (cross) {
      // Insert intersection at ±180.
      const seamLon = datelineSeamLon(a[0], b[0]);
      const t = (seamLon - a[0]) / (b[0] - a[0]);
      const lat = a[1] + t * (b[1] - a[1]);
      const seamPoint: LngLat = [seamLon, lat];
      current.push(seamPoint);
      commit();
      // Start new part with seam point (to maintain continuity) -> will proceed with b in next loop iter.
      current.push(seamPoint);
    }
  }
  // Add final point (work[last]) handled in loop; ensure last segment committed.
  commit();

  // Post-process: If resulting span of original ring was already below threshold, return original.
  if (parts.length === 1) return parts;

  // Normalize each part's longitudes into a coherent domain so each spans < threshold.
  return parts.map(part => normalizeRingDomain(part));
}

// Normalize ring so that its longitude range is within [-180,180] and minimal span domain.
function normalizeRingDomain(ring: LngLat[]): LngLat[] {
  // Compute median longitude (in wrapped domain) then shift if needed.
  const lons = ring.map(p => normalizeLon180(p[0]));
  lons.sort((a,b) => a-b);
  const median = lons[Math.floor(lons.length/2)];
  // Decide domain shift: keep as is; later unwrap logic in geometryFactory may still apply small continuity fixes.
  return ring.map(([lng, lat]) => [wrapToDomain(lng, median), lat]);
}

function wrapToDomain(lng: number, anchor: number): number {
  let L = normalizeLon180(lng);
  // Try shifting by ±360 if that yields closer proximity to anchor (keeps contiguous cluster for part)
  if (Math.abs(L + 360 - anchor) < Math.abs(L - anchor)) L += 360;
  else if (Math.abs(L - 360 - anchor) < Math.abs(L - anchor)) L -= 360;
  return L;
}

function normalizeLon180(lng: number): number {
  let L = lng;
  while (L > 180) L -= 360;
  while (L < -180) L += 360;
  return L;
}

function pointsEqual(a: LngLat, b: LngLat): boolean { return a[0] === b[0] && a[1] === b[1]; }

function isClosed(ring: LngLat[]): boolean {
  if (ring.length < 2) return false;
  return pointsEqual(ring[0], ring[ring.length - 1]);
}

// Determine if segment from lonA -> lonB crosses the antimeridian (|delta| > 180)
function crossesDateline(lonA: number, lonB: number): boolean {
  const d = lonB - lonA;
  return d > 180 || d < -180;
}

function datelineSeamLon(lonA: number, lonB: number): number {
  // If going eastward (positive delta > 180) we crossed from high positive to high negative -> seam at +180
  const d = lonB - lonA;
  return d > 180 ? 180 : d < -180 ? -180 : lonB; // fallback
}

// High-level convenience: for a feature outer ring, if span > 180 returns split parts; else returns original.
export interface NormalizedRingResult {
  classification: 'plain' | 'split' | 'polar';
  parts: LngLat[][]; // always closed rings
  span: number;
}

// Detect polar rings (e.g., Antarctica) to avoid aggressive splitting that distorts geometry.
// Heuristic: large span (>300) and high-lat coverage beyond ±60 for majority of vertices.
function isPolarRing(ring: LngLat[]): boolean {
  if (ring.length < 4) return false;
  const span = ringLongitudeSpan(ring);
  if (span < 300) return false;
  let highLatCount = 0;
  for (const [, lat] of ring) if (Math.abs(lat) > 60) highLatCount++;
  return highLatCount / ring.length > 0.5; // majority high-lat
}

export function normalizeOuterRingDetailed(ring: LngLat[]): NormalizedRingResult {
  const span = ringLongitudeSpan(ring);
  if (isPolarRing(ring)) {
    return { classification: 'polar', parts: [ensureClosed(ring)], span };
  }
  if (span <= 180) {
    return { classification: 'plain', parts: [ensureClosed(ring)], span };
  }
  const parts = splitRingAtDateline(ring).map(ensureClosed);
  return { classification: 'split', parts, span };
}

export function normalizeOuterRing(ring: LngLat[]): LngLat[][] {
  return normalizeOuterRingDetailed(ring).parts;
}

function ensureClosed(r: LngLat[]): LngLat[] {
  if (!r.length) return r;
  if (r.length < 2) return r;
  const first = r[0];
  const last = r[r.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return r;
  return [...r, [...first]];
}

// --- Validation Stage Stubs (Phase 3) ---
// These will be moved to a dedicated validation module later; stubs exported now to begin incremental integration.

export interface RingValidationReport {
  removedDuplicatePoints: number;
  removedCollinearPoints: number;
  selfIntersections: number;
}

// Remove consecutive duplicate vertices.
export function removeDuplicatePoints(ring: LngLat[]): { ring: LngLat[]; removed: number } {
  if (ring.length < 2) return { ring, removed: 0 };
  const out: LngLat[] = [];
  let removed = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== p[0] || prev[1] !== p[1]) out.push(p); else removed++;
  }
  return { ring: out, removed };
}

// Remove strictly collinear intermediate points (A-B-C with B on segment AC) using area threshold.
export function removeCollinearPoints(ring: LngLat[], epsilon = 1e-12): { ring: LngLat[]; removed: number } {
  if (ring.length < 4) return { ring, removed: 0 }; // need at least 3 + closure
  const closed = isClosed(ring);
  const work = closed ? ring.slice(0, ring.length - 1) : ring.slice();
  const out: LngLat[] = [];
  let removed = 0;
  const area2 = (a: LngLat, b: LngLat, c: LngLat) => Math.abs((b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]));
  for (let i = 0; i < work.length; i++) {
    const a = out[out.length - 1];
    const b = work[i];
    const c = work[(i + 1) % work.length];
    if (!a) { out.push(b); continue; }
    if (area2(a, b, c) < epsilon) { removed++; continue; }
    out.push(b);
  }
  if (!pointsEqual(out[0], out[out.length - 1])) out.push([...out[0]]);
  return { ring: out, removed };
}

// Placeholder: self-intersection detection (line segment intersection count) – to be implemented.
export function countSelfIntersections(_ring: LngLat[]): number {
  const ring = _ring;
  if (ring.length < 4) return 0;
  // Work on non-duplicated last point for iteration
  const closed = isClosed(ring);
  const pts = closed ? ring.slice(0, ring.length - 1) : ring.slice();
  let count = 0;
  // Simple O(n^2) segment intersection check (adequate for moderate polygon sizes)
  for (let i = 0; i < pts.length; i++) {
    const a1 = pts[i];
    const a2 = pts[(i + 1) % pts.length];
    for (let j = i + 1; j < pts.length; j++) {
      // Skip adjacent segments sharing a vertex
      if (Math.abs(i - j) <= 1) continue;
      // Also skip first & last segment adjacency
      if (i === 0 && j === pts.length - 1) continue;
      const b1 = pts[j];
      const b2 = pts[(j + 1) % pts.length];
      if (segmentsIntersect(a1, a2, b1, b2)) count++;
    }
  }
  return count;
}

export function validateRing(ring: LngLat[]): { ring: LngLat[]; report: RingValidationReport } {
  let working = ring;
  const dup = removeDuplicatePoints(working); working = dup.ring;
  const col = removeCollinearPoints(working); working = col.ring;
  const intersections = countSelfIntersections(working);
  return {
    ring: working,
    report: {
      removedDuplicatePoints: dup.removed,
      removedCollinearPoints: col.removed,
      selfIntersections: intersections
    }
  };
}

// Segment intersection helpers
function orient(a: LngLat, b: LngLat, c: LngLat): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function onSegment(a: LngLat, b: LngLat, c: LngLat): boolean {
  return Math.min(a[0], b[0]) - 1e-12 <= c[0] && c[0] <= Math.max(a[0], b[0]) + 1e-12 &&
         Math.min(a[1], b[1]) - 1e-12 <= c[1] && c[1] <= Math.max(a[1], b[1]) + 1e-12;
}
function segmentsIntersect(a1: LngLat, a2: LngLat, b1: LngLat, b2: LngLat): boolean {
  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);
  // General case
  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  // Collinear special cases
  if (Math.abs(o1) < 1e-12 && onSegment(a1, a2, b1)) return true;
  if (Math.abs(o2) < 1e-12 && onSegment(a1, a2, b2)) return true;
  if (Math.abs(o3) < 1e-12 && onSegment(b1, b2, a1)) return true;
  if (Math.abs(o4) < 1e-12 && onSegment(b1, b2, a2)) return true;
  return false;
}
