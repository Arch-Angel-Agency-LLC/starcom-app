import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { nationalTerritoriesService } from '../services/NationalTerritoriesService';
import { globalLayerRegistry } from '../LayerRegistry';
import { clearGroup } from '../utils/disposal';
// Corrected path to GeoPoliticalConfig type
import { GeoPoliticalConfig } from '../../hooks/useGeoPoliticalSettings';

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
  const territoriesGroupRef = useRef<THREE.Group | null>(null);
  const [fillsActive, setFillsActive] = useState(false);
  const currentLODRef = useRef<0 | 1 | 2 | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const hysteresis = config.lod?.hysteresis ?? 20;
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const pointerRef = useRef<THREE.Vector2 | null>(null);
  const highlightedRef = useRef<THREE.Object3D | null>(null);

  // Attempt to get camera from scene (react-globe.gl attaches it to parent object)
  useEffect(() => {
    if (scene && (scene as any).__camera) {
      cameraRef.current = (scene as any).__camera as THREE.Camera;
    }
  }, [scene]);

  // Build / activate for a specific LOD (re-register if first time; else replace group contents in-place)
  const buildForLOD = async (lod: 0 | 1 | 2, replace = false) => {
    try {
      setLoading(true);
      const borders = await nationalTerritoriesService.loadBordersLOD(lod) as any; // ClassifiedLineFeature[]
      const newBordersGroup = nationalTerritoriesService.buildBorders(borders, config);
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
      if (config.territoryColors.opacity > 0) {
        const territories = await nationalTerritoriesService.loadTerritoriesLOD(lod);
        const newTerritoriesGroup = nationalTerritoriesService.buildTerritories(territories, config);
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
          setFillsActive(true);
        }
      }
      currentLODRef.current = lod;
      setLoading(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to build geopolitical layers');
      setLoading(false);
    }
  };

  // Initial activation
  useEffect(() => {
    if (!enabled || !scene) return;
    if (currentLODRef.current !== null) return; // already built
    // Estimate initial distance via camera or default
    let dist = 250;
    if (scene && (scene as any).__camera) {
      const cam = (scene as any).__camera as THREE.Camera;
      dist = cam.position.length();
    }
    const initialLOD = config.lod?.mode === 'locked' ? config.lod.lockedLevel : pickLOD(dist, hysteresis, null);
    buildForLOD(initialLOD);
  }, [enabled, scene]);

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
  }, [enabled, scene, config.lod?.mode, config.lod?.lockedLevel, hysteresis]);

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

  // Rebuild when disputed visibility toggles (affects feature set)
  useEffect(() => {
    if (!enabled) return;
    if (currentLODRef.current !== null) {
      buildForLOD(currentLODRef.current, true);
    }
  }, [config.showDisputedTerritories, enabled]);

  // Allow switching to locked mode dynamically
  useEffect(() => {
    if (!enabled || !scene) return;
    if (config.lod?.mode === 'locked' && currentLODRef.current !== config.lod.lockedLevel) {
      buildForLOD(config.lod.lockedLevel, true);
    }
  }, [config.lod?.mode, config.lod?.lockedLevel, enabled, scene]);

  // Cleanup when disabled
  useEffect(() => {
    if (!enabled) {
      bordersGroupRef.current && clearGroup(bordersGroupRef.current);
      territoriesGroupRef.current && clearGroup(territoriesGroupRef.current);
      currentLODRef.current = null;
    }
  }, [enabled]);

  // Highlight on hover logic
  useEffect(() => {
    if (!enabled || !scene) return;
    if (!raycasterRef.current) raycasterRef.current = new THREE.Raycaster();
    if (!pointerRef.current) pointerRef.current = new THREE.Vector2();

    function onPointerMove(e: PointerEvent) {
      if (!config.highlightOnHover) return;
      if (!pointerRef.current) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [enabled, scene, config.highlightOnHover]);

  // Hover highlight loop
  useEffect(() => {
    if (!enabled || !scene) return;
    let frame: number;
    const camera = cameraRef.current;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!config.highlightOnHover || !raycasterRef.current || !pointerRef.current || !camera) return;
      const bordersGroup = bordersGroupRef.current;
      if (!bordersGroup) return;
      raycasterRef.current.setFromCamera(pointerRef.current, camera as any);
      const intersects = raycasterRef.current.intersectObjects(bordersGroup.children, false);
      const top = intersects[0]?.object || null;
      if (top !== highlightedRef.current) {
        // restore previous
        if (highlightedRef.current && highlightedRef.current instanceof THREE.Line && highlightedRef.current.material instanceof THREE.LineBasicMaterial) {
          highlightedRef.current.material.linewidth = 1; // placeholder reset
          highlightedRef.current.material.opacity = config.borderVisibility / 100;
        }
        highlightedRef.current = top;
        if (top && top instanceof THREE.Line && top.material instanceof THREE.LineBasicMaterial) {
          // Emphasis: increase opacity + maybe change color based on classification
            const classification = (top.userData?.classification || 'international');
            if (classification === 'disputed') top.material.color.set(0xff7777);
            else if (classification === 'line_of_control') top.material.color.set(0xffe066);
            else if (classification === 'indefinite') top.material.color.set(0xaaaaaa);
            top.material.opacity = Math.min(1, (config.borderVisibility / 100) + 0.25);
            top.material.needsUpdate = true;
        }
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [enabled, scene, config.highlightOnHover, config.borderVisibility]);

  return { loading, error, bordersGroup: bordersGroupRef.current, territoriesGroup: territoriesGroupRef.current, currentLOD: currentLODRef.current };
}
