// ScaleContext.ts - Core scale context definitions for multi-scale solar system

export enum ScaleContext {
  EARTH_LOCAL = 'earth-local',      // 150-1000 units from Earth center
  EARTH_SPACE = 'earth-space',      // 200-8000 units  
  INNER_SOLAR = 'inner-solar',      // 500-15000 units
  SOLAR_SYSTEM = 'solar-system'     // 1000-50000 units
}

export interface ScaleContextConfig {
  context: ScaleContext;
  cameraRange: {
    min: number;
    max: number;
  };
  earthRadius: number;        // Earth size in this context
  sunRadius: number;          // Sun size in this context
  sunDistance: number;        // Sun distance from Earth
  sunVisible: boolean;        // Should sun be rendered?
  lightIntensity: number;     // Lighting intensity for this scale
}

export interface ScaleTransition {
  fromContext: ScaleContext;
  toContext: ScaleContext;
  duration: number;           // milliseconds
  startTime: number;          // timestamp
  progress: number;           // 0-1
  isActive: boolean;
}

export type ScaleChangeCallback = (newContext: ScaleContext, oldContext?: ScaleContext) => void;
export type ScaleTransitionCallback = (transition: ScaleTransition) => void;
