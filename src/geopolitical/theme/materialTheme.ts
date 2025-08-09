import * as THREE from 'three';
import { GeoPoliticalConfig } from '../../../hooks/useGeoPoliticalSettings';

export interface BorderMaterialParams {
  color: number;
  opacity: number;
  thickness: number; // placeholder (WebGL line limitation)
}

function schemeColor(scheme: string, variant: string): number {
  const maps: Record<string, number[]> = {
    default: [0x00ff41, 0x00b37a, 0x0094ff, 0xffcc00],
    political: [0xff5555, 0xffaa00, 0x55aaff, 0x55ff55],
    economic: [0x33dd88, 0x22aaee, 0xffaa33, 0xcc66ff],
    population: [0xff7777, 0xff4444, 0xcc2222, 0x881111]
  };
  const arr = maps[scheme] || maps.default;
  const idx = Math.abs(variant.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % arr.length;
  return arr[idx];
}

export function resolveBorderMaterialConfig(cfg: GeoPoliticalConfig['nationalTerritories'], featureId: string): BorderMaterialParams {
  return {
    color: schemeColor(cfg.territoryColors.colorScheme, featureId),
    opacity: cfg.borderVisibility / 100,
    thickness: cfg.borderThickness
  };
}

export function createLineMaterial(params: BorderMaterialParams): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({ color: params.color, transparent: true, opacity: params.opacity });
}
