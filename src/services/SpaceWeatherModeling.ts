// No changes made; this is a no-op patch.
// SpaceWeatherModeling.ts
// Utility functions to derive magnetopause/bow shock radii and auroral oval geometry
// from solar wind and Kp inputs. Includes safe clamps and simple fallbacks for MVP.

export type SolarWindSnapshot = {
  speedKmPerSec: number;
  densityPerCm3: number;
  bz?: number;
  timestamp: string;
};

export type KpSnapshot = {
  kp: number;
  timestamp: string;
};

export type MagnetopausePayload = {
  standoffRe: number;
  lastUpdated: string;
  quality: 'live' | 'fallback' | 'stale';
  clamped?: boolean;
  meta?: Record<string, unknown>;
};

export type BowShockPayload = {
  radiusRe: number;
  lastUpdated: string;
  quality: 'live' | 'fallback' | 'stale';
  clamped?: boolean;
  meta?: Record<string, unknown>;
};

export type LatLng = { lat: number; lng: number };

export type AuroraPayload = {
  oval: { north: LatLng[]; south: LatLng[] };
  kp: number;
  blackout: { thresholdKp: number; gradient: { inner: number; outer: number } };
  lastUpdated: string;
  quality: 'live' | 'fallback' | 'stale';
  meta?: Record<string, unknown>;
};

const MIN_STANDOFF_RE = 5;
const MAX_STANDOFF_RE = 25;
const MIN_BOWSHOCK_RE = 7;
const MAX_BOWSHOCK_RE = 35;
const MIN_GAP_RE = 1.0;

// Dynamic pressure in nPa using common approximation: P = 1.6726e-6 * n(cm^-3) * v(km/s)^2
export function computeDynamicPressureNPa(densityPerCm3: number, speedKmPerSec: number): number {
  const n = Math.max(densityPerCm3, 0);
  const v = Math.max(speedKmPerSec, 0);
  return 1.6726e-6 * n * v * v;
}

export function computeMagnetopauseStandoff(pressureNPa: number): { value: number; clamped: boolean } {
  const a = 10.22; // nominal coefficient
  const exponent = -1 / 6;
  const raw = a * Math.pow(Math.max(pressureNPa, 0.1), exponent);
  const clamped = raw < MIN_STANDOFF_RE || raw > MAX_STANDOFF_RE;
  const value = Math.min(MAX_STANDOFF_RE, Math.max(MIN_STANDOFF_RE, raw));
  return { value, clamped };
}

export function computeBowShockRadius(pressureNPa: number, magnetopauseRe: number): { value: number; clamped: boolean } {
  const delta = 2.5;
  const baseCoeff = 14.0;
  const exponent = -1 / 6;
  const raw = baseCoeff * Math.pow(Math.max(pressureNPa, 0.1), exponent);
  const ensuredGap = Math.max(raw, magnetopauseRe + MIN_GAP_RE, magnetopauseRe + delta);
  const clamped = ensuredGap < MIN_BOWSHOCK_RE || ensuredGap > MAX_BOWSHOCK_RE;
  const value = Math.min(MAX_BOWSHOCK_RE, Math.max(MIN_BOWSHOCK_RE, ensuredGap));
  return { value, clamped };
}

function buildOvalPoints(kp: number, hemisphere: 'north' | 'south', segments = 96): LatLng[] {
  const points: LatLng[] = [];
  const clampedKp = Math.min(Math.max(kp, 0), 9);
  const baseLat = hemisphere === 'north' ? 80 : -80;
  const slope = 2.5; // degrees per Kp toward equator
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * 360 - 180; // longitude
    const dayNightFactor = 2 * Math.cos((t * Math.PI) / 180); // modest day-night asymmetry
    const lat = baseLat + (hemisphere === 'north' ? -1 : 1) * (slope * clampedKp + 0.3 * dayNightFactor);
    points.push({ lat, lng: t });
  }
  // close loop
  points.push(points[0]);
  return points;
}

export function buildAuroralPayload(kpSnapshot: KpSnapshot, quality: AuroraPayload['quality']): AuroraPayload {
  const kp = kpSnapshot.kp;
  const north = buildOvalPoints(kp, 'north');
  const south = buildOvalPoints(kp, 'south');
  const blackout = {
    thresholdKp: 7,
    gradient: { inner: 0.35, outer: 0.65 },
  };
  return {
    oval: { north, south },
    kp,
    blackout,
    lastUpdated: kpSnapshot.timestamp,
    quality,
    meta: { source: 'modeled-kp' },
  };
}

export function buildMagnetopausePayload(sw: SolarWindSnapshot, quality: MagnetopausePayload['quality']): MagnetopausePayload {
  const pressure = computeDynamicPressureNPa(sw.densityPerCm3, sw.speedKmPerSec);
  const { value, clamped } = computeMagnetopauseStandoff(pressure);
  return {
    standoffRe: value,
    lastUpdated: sw.timestamp,
    quality,
    clamped,
    meta: { pressureNPa: pressure },
  };
}

export function buildBowShockPayload(sw: SolarWindSnapshot, magnetopauseRe: number, quality: BowShockPayload['quality']): BowShockPayload {
  const pressure = computeDynamicPressureNPa(sw.densityPerCm3, sw.speedKmPerSec);
  const { value, clamped } = computeBowShockRadius(pressure, magnetopauseRe);
  return {
    radiusRe: value,
    lastUpdated: sw.timestamp,
    quality,
    clamped,
    meta: { pressureNPa: pressure },
  };
}

export function fallbackSolarWindSnapshot(): SolarWindSnapshot {
  return {
    speedKmPerSec: 420,
    densityPerCm3: 6,
    bz: -2,
    timestamp: new Date().toISOString(),
  };
}

export function fallbackKpSnapshot(): KpSnapshot {
  return {
    kp: 3,
    timestamp: new Date().toISOString(),
  };
}
