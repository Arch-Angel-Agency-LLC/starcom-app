// SolarSystemConfig.ts - Configuration interfaces for solar system components

import { ScaleContext, ScaleContextConfig } from './ScaleContext';

export interface SolarSystemManagerConfig {
  globeRadius: number;
  enableTransitions: boolean;
  transitionDuration: number;
  performanceMode: 'high' | 'balanced' | 'low';
  debugMode: boolean;
}

export interface SunRenderConfig {
  geometry: {
    radius: number;
    segments: number;
  };
  material: {
    color: string;
    emissive: string;
    intensity: number;
  };
  corona: {
    enabled: boolean;
    size: number;
    opacity: number;
  };
  lighting: {
    enabled: boolean;
    intensity: number;
    castShadows: boolean;
  };
}

export interface TransitionConfig {
  defaultDuration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  enableFadeEffects: boolean;
  interruptible: boolean;
}

export const DEFAULT_SCALE_CONFIGS: Record<ScaleContext, ScaleContextConfig> = {
  [ScaleContext.EARTH_LOCAL]: {
    context: ScaleContext.EARTH_LOCAL,
    cameraRange: { min: 150, max: 1000 },
    earthRadius: 100,
    sunRadius: 0,
    sunDistance: 0,
    sunVisible: false,
    lightIntensity: 0.3
  },
  [ScaleContext.EARTH_SPACE]: {
    context: ScaleContext.EARTH_SPACE,
    cameraRange: { min: 200, max: 8000 },
    earthRadius: 100,
    sunRadius: 50,
    sunDistance: 5000,
    sunVisible: true,
    lightIntensity: 0.7
  },
  [ScaleContext.INNER_SOLAR]: {
    context: ScaleContext.INNER_SOLAR,
    cameraRange: { min: 500, max: 15000 },
    earthRadius: 20,
    sunRadius: 200,
    sunDistance: 2000,
    sunVisible: true,
    lightIntensity: 1.0
  },
  [ScaleContext.SOLAR_SYSTEM]: {
    context: ScaleContext.SOLAR_SYSTEM,
    cameraRange: { min: 1000, max: 50000 },
    earthRadius: 5,
    sunRadius: 300,
    sunDistance: 1500,
    sunVisible: true,
    lightIntensity: 1.2
  }
};
