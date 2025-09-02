import * as THREE from 'three';
// Corrected path to GeoPoliticalConfig
import { GeoPoliticalConfig } from '../../hooks/useGeoPoliticalSettings';

export interface BorderMaterialParams {
  color: number;
  opacity: number;
  thickness: number; // placeholder (WebGL line limitation)
  classification?: BorderClassification;
}

// Classification enum for boundary styling
export type BorderClassification = 'international' | 'disputed' | 'line_of_control' | 'indefinite' | 'unknown' | 'maritime_eez' | 'maritime_overlap';

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

// Classification specific base colors (can be theme configurable later)
const CLASSIFICATION_COLORS: Record<BorderClassification, number> = {
  international: 0x00ff41,     // vivid green (baseline)
  disputed: 0xff5555,          // red
  line_of_control: 0xffcc00,   // amber
  indefinite: 0x888888,        // neutral gray
  unknown: 0x555555,          // dark gray
  maritime_eez: 0x0094ff,     // blue
  maritime_overlap: 0xff8800   // orange
};

export function resolveBorderMaterialConfig(
  cfg: GeoPoliticalConfig['nationalTerritories'],
  featureId: string,
  classification: BorderClassification = 'international'
): BorderMaterialParams {
  // If international, retain scheme hashing; otherwise override with classification palette
  const baseColor = classification === 'international'
    ? schemeColor(cfg.territoryColors.colorScheme, featureId)
    : CLASSIFICATION_COLORS[classification];
  // Opacity tweak: disputed / line_of_control slightly higher to stand out
  const opacityBoost = (classification === 'disputed' || classification === 'line_of_control') ? 0.1 : 0;
  return {
    color: baseColor,
    opacity: Math.min(1, cfg.borderVisibility / 100 + opacityBoost),
    thickness: cfg.borderThickness,
    classification
  };
}

export function createLineMaterial(params: BorderMaterialParams): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({ color: params.color, transparent: true, opacity: params.opacity });
}
