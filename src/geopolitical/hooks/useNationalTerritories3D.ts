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

export function useNationalTerritories3D({ enabled, scene, config }: UseNationalTerritoriesParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bordersGroupRef = useRef<THREE.Group | null>(null);
  const territoriesGroupRef = useRef<THREE.Group | null>(null);

  // Register layer once
  useEffect(() => {
    if (!scene) return;
    if (!enabled) return; // lazy register when first needed

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const borders = await nationalTerritoriesService.loadBorders();
        if (cancelled) return;
        bordersGroupRef.current = nationalTerritoriesService.buildBorders(borders, config);
        globalLayerRegistry.register({
          id: 'geopolitical-borders',
            order: 100,
            build: () => bordersGroupRef.current || new THREE.Group(),
            dispose: (g) => clearGroup(g)
        });
        globalLayerRegistry.activate('geopolitical-borders', scene);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load borders');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, scene]);

  // React to config changes (opacity / thickness)
  useEffect(() => {
    if (!enabled) return;
    const g = bordersGroupRef.current;
    if (!g) return;
    g.children.forEach(c => {
      if (c instanceof THREE.Line && c.material instanceof THREE.LineBasicMaterial) {
        c.material.opacity = config.borderVisibility / 100;
        c.material.needsUpdate = true;
      }
    });
  }, [config.borderVisibility, config.borderThickness, enabled]);

  // Cleanup when disabled
  useEffect(() => {
    if (!enabled) {
      // Optionally suspend later; for now just dispose local groups
      bordersGroupRef.current && clearGroup(bordersGroupRef.current);
    }
  }, [enabled]);

  return { loading, error, bordersGroup: bordersGroupRef.current, territoriesGroup: territoriesGroupRef.current };
}
