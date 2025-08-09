import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { nationalTerritoriesService } from '../services/NationalTerritoriesService';
import { globalLayerRegistry } from '../LayerRegistry';
import { clearGroup } from '../utils/disposal';
import { GeoPoliticalConfig } from '../../../hooks/useGeoPoliticalSettings';

interface UseNationalTerritoriesParams {
  enabled: boolean;
  scene: THREE.Scene | null;
  config: GeoPoliticalConfig['nationalTerritories'];
}

function pickLOD(distance: number): 0 | 1 | 2 {
  if (distance > 350) return 0; // far: most simplified
  if (distance > 200) return 1; // mid
  return 2; // near: highest detail
}

export function useNationalTerritories3D({ enabled, scene, config }: UseNationalTerritoriesParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bordersGroupRef = useRef<THREE.Group | null>(null);
  const territoriesGroupRef = useRef<THREE.Group | null>(null);
  const [fillsActive, setFillsActive] = useState(false);
  const currentLODRef = useRef<0 | 1 | 2 | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  // Attempt to get camera from scene (react-globe.gl attaches it to parent object)
  useEffect(() => {
    if (scene && (scene as any).__camera) {
      cameraRef.current = (scene as any).__camera as THREE.Camera;
    }
  }, [scene]);

  // Build / activate for a specific LOD
  const buildForLOD = async (lod: 0 | 1 | 2) => {
    try {
      setLoading(true);
      const borders = await nationalTerritoriesService.loadBordersLOD(lod);
      bordersGroupRef.current = nationalTerritoriesService.buildBorders(borders, config);
      globalLayerRegistry.register({
        id: 'geopolitical-borders',
        order: 100,
        build: () => bordersGroupRef.current || new THREE.Group(),
        dispose: (g) => clearGroup(g)
      });
      globalLayerRegistry.activate('geopolitical-borders', scene!);
      if (config.territoryColors.opacity > 0) {
        const territories = await nationalTerritoriesService.loadTerritoriesLOD(lod);
        territoriesGroupRef.current = nationalTerritoriesService.buildTerritories(territories, config);
        globalLayerRegistry.register({
          id: 'geopolitical-territories',
          order: 95,
          build: () => territoriesGroupRef.current || new THREE.Group(),
          dispose: (g) => clearGroup(g)
        });
        globalLayerRegistry.activate('geopolitical-territories', scene!);
        setFillsActive(true);
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
    const lod = pickLOD(dist);
    buildForLOD(lod);
  }, [enabled, scene]);

  // LOD watcher (interval-based lightweight)
  useEffect(() => {
    if (!enabled || !scene) return;
    const interval = setInterval(() => {
      if (!cameraRef.current) return;
      const dist = cameraRef.current.position.length();
      const desired = pickLOD(dist);
      if (desired !== currentLODRef.current) {
        // dispose old groups
        bordersGroupRef.current && clearGroup(bordersGroupRef.current);
        territoriesGroupRef.current && clearGroup(territoriesGroupRef.current);
        buildForLOD(desired);
      }
    }, 2000); // every 2s
    return () => clearInterval(interval);
  }, [enabled, scene, config.territoryColors.opacity]);

  // React to settings changes (opacity / thickness)
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

  // Cleanup when disabled
  useEffect(() => {
    if (!enabled) {
      bordersGroupRef.current && clearGroup(bordersGroupRef.current);
      territoriesGroupRef.current && clearGroup(territoriesGroupRef.current);
      currentLODRef.current = null;
    }
  }, [enabled]);

  return { loading, error, bordersGroup: bordersGroupRef.current, territoriesGroup: territoriesGroupRef.current, currentLOD: currentLODRef.current };
}
