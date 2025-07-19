// PlanetaryTypes.ts - Type definitions for planetary system

import * as THREE from 'three';

export interface PlanetarySystemConfig {
  timeAcceleration?: number;
  showOrbitalPaths?: boolean;
  enableLighting?: boolean;
  performanceMode?: 'low' | 'balanced' | 'high';
  maxVisiblePlanets?: number;
  orbitalPathSegments?: number;
  enableAtmospheres?: boolean;
  enableMagnetospheres?: boolean;
}

export interface PlanetInstance {
  name: string;
  radius: number; // km
  orbitRadius: number; // AU
  orbitPeriod: number; // days
  color: number;
  hasAtmosphere: boolean;
  hasMagnetosphere?: boolean;
  hasRings?: boolean;
  moons?: MoonInstance[];
}

export interface MoonInstance {
  name: string;
  radius: number; // km
  orbitRadius: number; // km from planet
  orbitPeriod: number; // days
  color: number;
}

export interface PlanetaryPerformanceMetrics {
  frameTime: number;
  activePlanets: number;
  visiblePlanets: number;
  memoryUsage: number;
}

export interface OrbitalElements {
  semiMajorAxis: number; // AU
  eccentricity: number;
  inclination: number; // degrees
  longitudeAscendingNode: number; // degrees
  argumentPeriapsis: number; // degrees
  meanAnomalyEpoch: number; // degrees
  epoch: Date; // Reference date
}

export interface PlanetaryState {
  name: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isVisible: boolean;
  currentPhase: number; // 0-1, orbital position
  distanceFromSun: number; // AU
  illuminationAngle: number; // degrees
}

export interface AtmosphereConfig {
  enabled: boolean;
  color: THREE.Color;
  density: number;
  height: number; // km above surface
  scattering: boolean;
}

export interface MagnetosphereConfig {
  enabled: boolean;
  strength: number; // Tesla
  tilt: number; // degrees from rotation axis
  offset: THREE.Vector3; // offset from center
  bowShockDistance: number; // planet radii
  magnetopauseDistance: number; // planet radii
}
