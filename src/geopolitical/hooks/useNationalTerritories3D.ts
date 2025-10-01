import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { nationalTerritoriesService } from '../services/NationalTerritoriesService';
import { globalLayerRegistry } from '../LayerRegistry';
import { clearGroup } from '../utils/disposal';
// Corrected path to GeoPoliticalConfig type
import { GeoPoliticalConfig } from '../../hooks/useGeoPoliticalSettings';
import { enableBVHForGroup } from '../../globe-engine/enableBVH';
import { vector3ToLatLon } from '../utils/vector3ToLatLon';
import { buildBorderIndex, queryNearestSegmentId, type BorderIndex } from '../utils/borderIndex';
import { IdPickingPass } from '../picking/IdPickingPass';

interface UseNationalTerritoriesParams {
  enabled: boolean;
  scene: THREE.Scene | null;
  config: GeoPoliticalConfig['nationalTerritories'];
}

function pickLOD(distance: number, hysteresis: number, current: 0 | 1 | 2 | null): 0 | 1 | 2 {
  // Base thresholds
  const t0 = 350; // boundary between LOD0 and LOD1
  const t1 = 200; // boundary between LOD1 and LOD2
  if (current !== null) {
    // Apply hysteresis margins: if near threshold, stick with current
    if (current === 0 && distance > t0 - hysteresis) return 0;
    if (current === 1 && distance < t0 + hysteresis && distance > t1 - hysteresis) return 1;
    if (current === 2 && distance < t1 + hysteresis) return 2;
  }
  if (distance > t0) return 0;
  if (distance > t1) return 1;
  return 2;
}

export function useNationalTerritories3D({ enabled, scene, config }: UseNationalTerritoriesParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bordersGroupRef = useRef<THREE.Group | null>(null);
  const maritimeGroupRef = useRef<THREE.Group | null>(null);
  const territoriesGroupRef = useRef<THREE.Group | null>(null);
  // No local UI state presently required
  const currentLODRef = useRef<0 | 1 | 2 | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const hysteresis = config.lod?.hysteresis ?? 20;
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const pointerRef = useRef<THREE.Vector2 | null>(null);
  const highlightedBorderRef = useRef<THREE.Object3D | null>(null);
  const hoveredTerritoryRef = useRef<THREE.Mesh | null>(null);
  const selectedTerritoryRef = useRef<THREE.Mesh | null>(null);
  const pendingHoverCandidateRef = useRef<THREE.Mesh | null>(null);
  const pendingHoverSinceRef = useRef<number>(0);
  const lastPickTsRef = useRef<number>(0);
  const pickIntervalMs = 16; // ~60Hz
  const bvhEnabledRef = useRef<boolean>(!!config?.bvhPicking);
  const lastFrameTimeRef = useRef<number>(performance.now());
  // Simple spatial index for borders: array of segments with AABB in lon/lat
  const borderIndexRef = useRef<BorderIndex | null>(null);
  // Dev-only ID picking pass
  const idPickingRef = useRef<IdPickingPass | null>(null);
  const idPickEnabledRef = useRef<boolean>(false);
  const lastIdUnderCursorRef = useRef<string | null>(null);
  const idHudElRef = useRef<HTMLDivElement | null>(null);

  // Shared helpers
  const ensureTerritoryUserData = useCallback((mesh: THREE.Mesh) => {
    const ud = mesh.userData || (mesh.userData = {});
    if (ud.baseColor === undefined && mesh.material instanceof THREE.MeshBasicMaterial) {
      ud.baseColor = mesh.material.color.getHex();
    }
    if (ud.baseOpacity === undefined && mesh.material instanceof THREE.MeshBasicMaterial) {
      ud.baseOpacity = mesh.material.opacity;
    }
    ud.hoverT ??= 0; ud.targetHover ??= 0;
    ud.selectT ??= 0; ud.targetSelect ??= 0;
    ud.dimT ??= 0; ud.targetDim ??= 0;
  }, []);

  const setSelection = useCallback((mesh: THREE.Mesh | null) => {
    // Clear previous selection target
    if (selectedTerritoryRef.current) {
      ensureTerritoryUserData(selectedTerritoryRef.current);
      selectedTerritoryRef.current.userData.targetSelect = 0;
    }
    selectedTerritoryRef.current = mesh;
    if (mesh) {
      ensureTerritoryUserData(mesh);
      mesh.userData.targetSelect = 1;
    }
    // Neighbor dimming: when selection present, dim all others by 30%
    const tg = territoriesGroupRef.current;
    if (tg) {
      tg.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          ensureTerritoryUserData(m);
          m.userData.targetDim = mesh && m !== mesh ? 1 : 0; // 1 => apply 30% dim factor
        }
      });
    }
  }, [ensureTerritoryUserData]);

  // Attempt to get camera from scene (react-globe.gl attaches it to parent object)
  useEffect(() => {
    if (!scene) return;
    // react-globe.gl attaches the camera on a private field of the scene's parent object
    const s = scene as unknown as { __camera?: THREE.Camera };
    if (s.__camera) {
      cameraRef.current = s.__camera;
    }
  }, [scene]);

  // Build / activate for a specific LOD (re-register if first time; else replace group contents in-place)
  const buildForLOD = useCallback(async (lod: 0 | 1 | 2, replace = false) => {
    try {
      setLoading(true);
  const borders = await nationalTerritoriesService.loadBordersLOD(lod);
      const newBordersGroup = nationalTerritoriesService.buildBorders(borders, config);
      // We'll build the spatial index after optionally loading maritime features
      if (replace && bordersGroupRef.current) {
        clearGroup(bordersGroupRef.current);
        bordersGroupRef.current.add(...newBordersGroup.children);
      } else {
        bordersGroupRef.current = newBordersGroup;
        if (!globalLayerRegistry.getStatus('geopolitical-borders')) {
          globalLayerRegistry.register({
            id: 'geopolitical-borders',
            order: 100,
            build: () => bordersGroupRef.current || new THREE.Group(),
            dispose: (g) => clearGroup(g)
          });
        }
        globalLayerRegistry.activate('geopolitical-borders', scene!);
      }
  // Maritime borders (optional separate layer)
  let maritime: Array<{ id: string; coordinates: [number, number][], classification?: unknown }> | null = null;
      if (config.showMaritimeBorders) {
        maritime = await nationalTerritoriesService.loadMaritimeBordersLOD(lod);
        if (maritime && maritime.length) {
          const newMaritimeGroup = nationalTerritoriesService.buildMaritimeBorders(maritime as unknown as ReturnType<typeof nationalTerritoriesService.loadMaritimeBordersLOD> extends Promise<infer T> ? NonNullable<T> : never, config);
          if (replace && maritimeGroupRef.current) {
            clearGroup(maritimeGroupRef.current);
            maritimeGroupRef.current.add(...newMaritimeGroup.children);
          } else {
            maritimeGroupRef.current = newMaritimeGroup;
            if (!globalLayerRegistry.getStatus('geopolitical-maritime')) {
              globalLayerRegistry.register({
                id: 'geopolitical-maritime',
                order: 96,
                build: () => maritimeGroupRef.current || new THREE.Group(),
                dispose: (g) => clearGroup(g)
              });
            }
            globalLayerRegistry.activate('geopolitical-maritime', scene!);
          }
        } else if (replace && maritimeGroupRef.current) {
          clearGroup(maritimeGroupRef.current);
        }
      } else if (replace && maritimeGroupRef.current) {
        clearGroup(maritimeGroupRef.current);
      }
  // Build/refresh spatial index from available features (land + optional maritime)
  const indexFeatures = maritime && maritime.length
    ? [...borders, ...maritime.map(m => ({ id: m.id, coordinates: m.coordinates as [number, number][] }))]
    : borders;
  borderIndexRef.current = buildBorderIndex(indexFeatures);
      if (config.territoryColors.opacity > 0) {
        const territories = await nationalTerritoriesService.loadTerritoriesLOD(lod);
        const newTerritoriesGroup = nationalTerritoriesService.buildTerritories(territories, config);
        // Optionally enable BVH for faster raycasting
        if (bvhEnabledRef.current) {
          const ok = await enableBVHForGroup(newTerritoriesGroup);
          if (!ok) bvhEnabledRef.current = false;
        }
        if (replace && territoriesGroupRef.current) {
          clearGroup(territoriesGroupRef.current);
          territoriesGroupRef.current.add(...newTerritoriesGroup.children);
        } else {
          territoriesGroupRef.current = newTerritoriesGroup;
          if (!globalLayerRegistry.getStatus('geopolitical-territories')) {
            globalLayerRegistry.register({
              id: 'geopolitical-territories',
              order: 95,
              build: () => territoriesGroupRef.current || new THREE.Group(),
              dispose: (g) => clearGroup(g)
            });
          }
          globalLayerRegistry.activate('geopolitical-territories', scene!);
        }
        // If dev picking is enabled, refresh target group and camera
        if (idPickingRef.current && cameraRef.current) {
          idPickingRef.current.setCamera(cameraRef.current);
          idPickingRef.current.setTargetGroup(territoriesGroupRef.current);
        }
      }
      currentLODRef.current = lod;
      setLoading(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to build geopolitical layers';
      setError(msg);
      setLoading(false);
    }
  }, [config, scene]);

  // Initial activation
  useEffect(() => {
    if (!enabled || !scene) return;
    if (currentLODRef.current !== null) return; // already built
    // Estimate initial distance via camera or default
    let dist = 250;
  const s = scene as unknown as { __camera?: THREE.Camera };
  if (s && s.__camera) dist = s.__camera.position.length();
    const initialLOD = config.lod?.mode === 'locked' ? config.lod.lockedLevel : pickLOD(dist, hysteresis, null);
    buildForLOD(initialLOD);
  }, [enabled, scene, config.lod?.lockedLevel, config.lod?.mode, hysteresis, buildForLOD]);

  // LOD watcher (animation frame for responsiveness with throttling)
  useEffect(() => {
    if (!enabled || !scene) return;
    if (config.lod?.mode === 'locked') return; // no auto switching
    let frame: number;
    let lastCheck = 0;
    const checkIntervalMs = 750; // throttle
    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      if (!cameraRef.current) return;
      if (t - lastCheck < checkIntervalMs) return;
      lastCheck = t;
      const dist = cameraRef.current.position.length();
      const desired = pickLOD(dist, hysteresis, currentLODRef.current);
      if (desired !== currentLODRef.current) {
        buildForLOD(desired, true);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [enabled, scene, config.lod?.mode, config.lod?.lockedLevel, hysteresis, buildForLOD]);

  // React to settings changes (opacity / thickness / color scheme) without LOD rebuild
  useEffect(() => {
    if (!enabled) return;
    const g = bordersGroupRef.current;
    if (g) {
      g.children.forEach(c => {
        if (c instanceof THREE.Line && c.material instanceof THREE.LineBasicMaterial) {
          c.material.opacity = config.borderVisibility / 100;
          c.material.needsUpdate = true;
        }
      });
    }
    const mg = maritimeGroupRef.current;
    if (mg) {
      mg.children.forEach(c => {
        if (c instanceof THREE.Line && c.material instanceof THREE.LineBasicMaterial) {
          c.material.opacity = config.borderVisibility / 100;
          c.material.needsUpdate = true;
        }
      });
    }
    const tg = territoriesGroupRef.current;
    if (tg) {
      tg.children.forEach(c => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial) {
          c.material.opacity = config.territoryColors.opacity / 100;
          c.material.needsUpdate = true;
        }
      });
    }
  }, [config.borderVisibility, config.borderThickness, config.territoryColors.opacity, enabled]);

  // Rebuild territories when epsilon or frontSideOnly/polygonOffset settings change (affects geometry/material)
  useEffect(() => {
    if (!enabled) return;
    if (currentLODRef.current !== null) {
      buildForLOD(currentLODRef.current, true);
    }
  }, [enabled, config.fillElevationEpsilon, config.frontSideOnly, config.usePolygonOffset, config.polygonOffsetFactor, config.polygonOffsetUnits, buildForLOD]);

  // Rebuild when disputed visibility toggles (affects feature set)
  useEffect(() => {
    if (!enabled) return;
    if (currentLODRef.current !== null) {
      buildForLOD(currentLODRef.current, true);
    }
  }, [config.showDisputedTerritories, config.showMaritimeBorders, enabled, buildForLOD]);

  // Allow switching to locked mode dynamically
  useEffect(() => {
    if (!enabled || !scene) return;
    if (config.lod?.mode === 'locked' && currentLODRef.current !== config.lod.lockedLevel) {
      buildForLOD(config.lod.lockedLevel, true);
    }
  }, [config.lod?.mode, config.lod?.lockedLevel, enabled, scene, buildForLOD]);

  // ID picking probe (behind ?geoIdPicking), enabled in any env
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const enableIdPicking = params.get('geoIdPicking');
      idPickEnabledRef.current = !!enableIdPicking;
      if (!enableIdPicking) return;
      const w = window as unknown as { __geoIdPickProbe?: { sampleCenter: () => string | null, sampleAtCursor?: () => string | null, getLast?: () => string | null } } & Record<string, unknown>;
      if (!idPickingRef.current) {
        idPickingRef.current = new IdPickingPass(512, 512);
        if (cameraRef.current) idPickingRef.current.setCamera(cameraRef.current);
        if (territoriesGroupRef.current) idPickingRef.current.setTargetGroup(territoriesGroupRef.current);
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas) idPickingRef.current.setSizeFromCanvas(canvas);
      }
      w.__geoIdPickProbe = {
        sampleCenter: () => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
          if (!canvas || !idPickingRef.current) return null;
          idPickingRef.current.setSizeFromCanvas(canvas);
          const cx = Math.floor(canvas.width/2);
          const cy = Math.floor(canvas.height/2);
          // Spiral search around center up to ~10% of min dimension
          const maxR = Math.max(24, Math.floor(Math.min(canvas.width, canvas.height) * 0.1));
          if (idPickingRef.current.getIdAt(cx, cy)) return idPickingRef.current.getIdAt(cx, cy);
          for (let r = 1; r <= maxR; r++) {
            for (let dx = -r; dx <= r; dx++) {
              const id1 = idPickingRef.current.getIdAt(cx + dx, cy - r);
              if (id1) return id1;
            }
            for (let dy = -r + 1; dy <= r; dy++) {
              const id2 = idPickingRef.current.getIdAt(cx + r, cy + dy);
              if (id2) return id2;
            }
            for (let dx = r - 1; dx >= -r; dx--) {
              const id3 = idPickingRef.current.getIdAt(cx + dx, cy + r);
              if (id3) return id3;
            }
            for (let dy = r - 1; dy >= -r + 1; dy--) {
              const id4 = idPickingRef.current.getIdAt(cx - r, cy + dy);
              if (id4) return id4;
            }
          }
          return null;
        },
        sampleAtCursor: () => lastIdUnderCursorRef.current,
        getLast: () => lastIdUnderCursorRef.current
      };
      return () => { if (w.__geoIdPickProbe) delete w.__geoIdPickProbe; };
    } catch { /* noop */ }
  }, [enabled, scene]);

  // Development-only: expose an overlay probe to window for tests/diagnostics
  useEffect(() => {
    if (process?.env?.NODE_ENV !== 'development') return;
    // Attach a diagnostic helper to window
  const w = window as unknown as { __geoOverlayProbe?: { getCenterLineDiagnostics: (rectSize?: number) => unknown } } & Record<string, unknown>;

    try {
      // nothing here for id picking; handled in env-agnostic effect above
    } catch {
      // ignore
    }
    w.__geoOverlayProbe = {
      getCenterLineDiagnostics: (rectSize = 80) => {
        try {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
          if (!canvas || !cameraRef.current) return null;
          const width = canvas.width;
          const height = canvas.height;
          const cx = Math.floor(width / 2);
          const cy = Math.floor(height / 2);
          const half = Math.floor(rectSize / 2);
          const x0 = cx - half;
          const y0 = cy - half;
          const x1 = cx + half;
          const y1 = cy + half;
          const results: Array<{ classification: string; renderOrder: number; depthWrite: boolean } > = [];
          const testLine = (line: THREE.Line) => {
            const geom = line.geometry as THREE.BufferGeometry;
            const pos = geom.getAttribute('position');
            if (!pos) return;
            let hits = 0;
            // Sample every Nth vertex to reduce cost
            const step = Math.max(1, Math.floor(pos.count / 100));
            const v = new THREE.Vector3();
            for (let i = 0; i < pos.count; i += step) {
              v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
              v.applyMatrix4(line.matrixWorld);
              v.project(cameraRef.current!);
              const sx = Math.floor((v.x * 0.5 + 0.5) * width);
              const sy = Math.floor((-v.y * 0.5 + 0.5) * height);
              if (sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1) {
                hits++;
                if (hits > 2) break;
              }
            }
            if (hits > 0) {
              const classification = (line.userData && line.userData.classification) || 'unknown';
              const mat = (line.material as THREE.Material) as THREE.Material & { depthWrite?: boolean };
              const depthWrite = !!mat.depthWrite;
              results.push({ classification, renderOrder: line.renderOrder || 0, depthWrite });
            }
          };
          if (bordersGroupRef.current) {
            bordersGroupRef.current.children.forEach(obj => { if ((obj as THREE.Line).isLine) testLine(obj as THREE.Line); });
          }
          if (maritimeGroupRef.current) {
            maritimeGroupRef.current.children.forEach(obj => { if ((obj as THREE.Line).isLine) testLine(obj as THREE.Line); });
          }
          let maxTerritoryOrder: number | null = null;
          if (territoriesGroupRef.current) {
            territoriesGroupRef.current.traverse(obj => {
              if ((obj as THREE.Mesh).isMesh) {
                maxTerritoryOrder = Math.max(maxTerritoryOrder ?? 0, obj.renderOrder || 0);
              }
            });
          }
          return { lines: results, maxTerritoryOrder };
  } catch (_e) {
          return null;
        }
      }
    };
  return () => { if (w.__geoOverlayProbe) delete w.__geoOverlayProbe; };
  }, [enabled]);

  // Cleanup when disabled
  useEffect(() => {
    if (!enabled) {
      if (bordersGroupRef.current) clearGroup(bordersGroupRef.current);
      if (maritimeGroupRef.current) clearGroup(maritimeGroupRef.current);
      if (territoriesGroupRef.current) clearGroup(territoriesGroupRef.current);
      currentLODRef.current = null;
  borderIndexRef.current = null;
    }
  }, [enabled]);

  // Highlight on hover logic
  useEffect(() => {
    if (!enabled || !scene) return;
    if (!raycasterRef.current) raycasterRef.current = new THREE.Raycaster();
    if (!pointerRef.current) pointerRef.current = new THREE.Vector2();

    function onPointerMove(e: PointerEvent) {
      if (!pointerRef.current) return;
      const canvasEl = document.querySelector('canvas') as HTMLElement | null;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      // ID picking: sample under cursor if enabled
      if (idPickEnabledRef.current && idPickingRef.current && cameraRef.current) {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas) {
          idPickingRef.current.setSizeFromCanvas(canvas);
          // Convert normalized device coords to pixel
          const u = (pointerRef.current.x + 1) / 2; // [0,1]
          const v = (1 - (pointerRef.current.y + 1) / 2); // top-left origin
          lastIdUnderCursorRef.current = idPickingRef.current.getIdAtNormalized(u, v);
          if (idHudElRef.current) {
            idHudElRef.current.textContent = lastIdUnderCursorRef.current ? `ID: ${lastIdUnderCursorRef.current}` : 'ID: —';
          }
        }
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (!pointerRef.current || !cameraRef.current) return;
      const canvasEl = document.querySelector('canvas') as HTMLElement | null;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      // Selection against territories
  const ray = raycasterRef.current! as THREE.Raycaster & { firstHitOnly?: boolean };
  if (bvhEnabledRef.current) ray.firstHitOnly = true;
  ray.setFromCamera(pointerRef.current, cameraRef.current as THREE.Camera);
      const tg = territoriesGroupRef.current;
      if (!tg) return;
      const intersects = ray.intersectObjects(tg.children, true);
      const hit = intersects[0]?.object as THREE.Mesh | undefined;
      if (hit && hit.isMesh) setSelection(hit);
      else setSelection(null);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelection(null);
      }
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, scene, config.highlightOnHover, config.territoryColors.opacity, setSelection]);

  // Dev-only HUD to display ID under cursor when geoIdPickingHud=1
  useEffect(() => {
    if (process?.env?.NODE_ENV !== 'development') return;
    if (!enabled) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const hud = params.get('geoIdPickingHud');
      if (!hud) return;
      // Create HUD element
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.bottom = '8px';
      el.style.left = '8px';
      el.style.padding = '4px 8px';
      el.style.background = 'rgba(0,0,0,0.6)';
      el.style.color = '#fff';
      el.style.font = '12px/16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      el.style.borderRadius = '4px';
      el.style.pointerEvents = 'none';
      el.textContent = 'ID: —';
      document.body.appendChild(el);
      idHudElRef.current = el;
      return () => { el.remove(); idHudElRef.current = null; };
    } catch { /* noop */ }
  }, [enabled]);

  // Hover highlight loop (borders + territories) with eased transitions
  useEffect(() => {
    if (!enabled || !scene) return;
    let frame: number;
    const camera = cameraRef.current;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastFrameTimeRef.current) / 1000); // clamp dt
      lastFrameTimeRef.current = now;
      if (!raycasterRef.current || !pointerRef.current || !camera) return;
      if (now - lastPickTsRef.current < pickIntervalMs) return;
      lastPickTsRef.current = now;

      // Borders hover using spatial index: compute lon/lat at ray-sphere hit and check nearby segments
      if (config.highlightOnHover) {
  const bordersGroup = bordersGroupRef.current;
  const maritimeGroup = maritimeGroupRef.current;
  const index = borderIndexRef.current;
  if (bordersGroup && index) {
          // Ray-sphere hit at radius ~100
          const ray = raycasterRef.current;
          const sphere = new THREE.Sphere(new THREE.Vector3(0,0,0), 100);
          const hit = new THREE.Vector3();
          ray.setFromCamera(pointerRef.current, camera as THREE.Camera);
          const ok = ray.ray.intersectSphere(sphere, hit);
          let bTop: THREE.Object3D | null = null;
          if (ok) {
            const { lat, lon } = vector3ToLatLon(hit, { flipZ: true });
            const id = queryNearestSegmentId(index, lon, lat, 1);
            if (id) {
              bTop = bordersGroup.children.find(c => c.name === `border:${id}`) || null;
              if (!bTop && maritimeGroup) {
                bTop = maritimeGroup.children.find(c => c.name === `border:${id}`) || null;
              }
            }
          }
          if (bTop !== highlightedBorderRef.current) {
            if (highlightedBorderRef.current && highlightedBorderRef.current instanceof THREE.Line && highlightedBorderRef.current.material instanceof THREE.LineBasicMaterial) {
              highlightedBorderRef.current.material.linewidth = 1; // reset
              highlightedBorderRef.current.material.opacity = config.borderVisibility / 100;
              highlightedBorderRef.current.material.needsUpdate = true;
            }
            highlightedBorderRef.current = bTop;
            if (bTop && bTop instanceof THREE.Line && bTop.material instanceof THREE.LineBasicMaterial) {
              const classification = (bTop.userData?.classification || 'international');
              if (classification === 'disputed') bTop.material.color.set(0xff7777);
              else if (classification === 'line_of_control') bTop.material.color.set(0xffe066);
              else if (classification === 'indefinite') bTop.material.color.set(0xaaaaaa);
              else if (classification === 'maritime_overlap') bTop.material.color.set(0xff8800);
              else if (classification === 'maritime_eez') bTop.material.color.set(0x00aaff);
              bTop.material.opacity = Math.min(1, (config.borderVisibility / 100) + 0.25);
              bTop.material.needsUpdate = true;
            }
          }
        }
      }

      // Territories hover using BVH if enabled
      const tg = territoriesGroupRef.current;
      if (tg) {
  const ray = raycasterRef.current as THREE.Raycaster & { firstHitOnly?: boolean };
  if (bvhEnabledRef.current) ray.firstHitOnly = true;
  ray.setFromCamera(pointerRef.current, camera as THREE.Camera);
        const tIntersects = ray.intersectObjects(tg.children, true);
        const tHit = tIntersects[0]?.object as THREE.Mesh | undefined;
        // Debounced hover switch to reduce flicker on fast moves
        if ((tHit && tHit.isMesh) !== !!hoveredTerritoryRef.current || (tHit && tHit.isMesh && tHit !== hoveredTerritoryRef.current)) {
          if (tHit && tHit.isMesh) {
            if (pendingHoverCandidateRef.current !== tHit) {
              pendingHoverCandidateRef.current = tHit;
              pendingHoverSinceRef.current = now;
            } else if (now - pendingHoverSinceRef.current > 75) { // 75ms stability
              // Commit switch
              if (hoveredTerritoryRef.current) {
                hoveredTerritoryRef.current.userData.targetHover = 0;
              }
              hoveredTerritoryRef.current = tHit;
              ensureTerritoryUserData(tHit);
              tHit.userData.targetHover = 1;
            }
          } else {
            // No hit; clear hover
            pendingHoverCandidateRef.current = null;
            if (hoveredTerritoryRef.current) {
              hoveredTerritoryRef.current.userData.targetHover = 0;
              hoveredTerritoryRef.current = null;
            }
          }
        }
        // Easing update for territories
  const tau = 0.1; // seconds to ~63% toward target (~150ms to near settle)
  const alpha = config.reducedMotion ? 1 : Math.min(1, dt / tau);
        tg.traverse(obj => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            ensureTerritoryUserData(m);
            const ud = m.userData;
            ud.hoverT += (ud.targetHover - ud.hoverT) * alpha;
            ud.selectT += (ud.targetSelect - ud.selectT) * alpha;
            ud.dimT += (ud.targetDim - ud.dimT) * alpha;
            if (m.material instanceof THREE.MeshBasicMaterial) {
              const baseColor: number = ud.baseColor ?? m.material.color.getHex();
              const baseOpacity: number = ud.baseOpacity ?? (config.territoryColors.opacity / 100);
              // Brighten color toward light blue based on max of hover/select
              const hoverBoost = 0.12 * ud.hoverT;
              const selectBoost = 0.25 * ud.selectT;
              const brighten = Math.min(0.35, hoverBoost + selectBoost);
              const bc = new THREE.Color(baseColor);
              const target = new THREE.Color(0x88bbff);
              const mixed = bc.clone().lerp(target, brighten);
              m.material.color.copy(mixed);
              // Opacity: base plus boosts, times dimming factor
              const dimFactor = 1 - 0.3 * ud.dimT;
              const op = Math.min(1, Math.max(0, (baseOpacity + hoverBoost + selectBoost) * dimFactor));
              m.material.opacity = op;
              m.material.needsUpdate = true;
            }
          }
        });
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [enabled, scene, config.highlightOnHover, config.borderVisibility, config.territoryColors.opacity, config.reducedMotion, ensureTerritoryUserData]);

  // Keep BVH enabled flag in sync with config; if enabling at runtime, try to enable on existing group
  useEffect(() => {
    const desired = !!config?.bvhPicking;
    if (bvhEnabledRef.current !== desired) {
      bvhEnabledRef.current = desired;
      if (desired && territoriesGroupRef.current) {
        // Best-effort enable; ignore if fails
        enableBVHForGroup(territoriesGroupRef.current).catch(() => {
          bvhEnabledRef.current = false;
        });
      }
    }
  }, [config?.bvhPicking]);

  return { loading, error, bordersGroup: bordersGroupRef.current, maritimeGroup: maritimeGroupRef.current, territoriesGroup: territoriesGroupRef.current, currentLOD: currentLODRef.current };
}
