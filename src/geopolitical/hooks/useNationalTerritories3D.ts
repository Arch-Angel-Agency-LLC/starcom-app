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
  const [fillsActive, setFillsActive] = useState(false);

  // Register borders layer
  useEffect(() => {
    if (!scene || !enabled) return;
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

  // Lazily load territory fills when opacity > 0 (future: explicit setting flag)
  useEffect(() => {
    if (!scene || !enabled) return;
    const wantFills = config.territoryColors.opacity > 0; // simple condition for now
    if (!wantFills) return;
    if (fillsActive) return; // already loaded
    let cancelled = false;
    (async () => {
      try {
        const territories = await nationalTerritoriesService.loadTerritories();
        if (cancelled) return;
        territoriesGroupRef.current = nationalTerritoriesService.buildTerritories(territories, config);
        globalLayerRegistry.register({
          id: 'geopolitical-territories',
          order: 95, // under borders
          build: () => territoriesGroupRef.current || new THREE.Group(),
          dispose: (g) => clearGroup(g)
        });
        globalLayerRegistry.activate('geopolitical-territories', scene);
        setFillsActive(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load territories');
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, scene, config.territoryColors.opacity, fillsActive]);

  // React to config changes (opacity / thickness)
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
    }
  }, [enabled]);

  return { loading, error, bordersGroup: bordersGroupRef.current, territoriesGroup: territoriesGroupRef.current };
}
