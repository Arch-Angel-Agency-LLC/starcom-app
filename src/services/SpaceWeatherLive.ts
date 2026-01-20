import { fallbackKpSnapshot, fallbackSolarWindSnapshot, type KpSnapshot, type SolarWindSnapshot } from './SpaceWeatherModeling';
import { noaaGeomagneticService } from './NOAAGeomagneticService';

const PLASMA_URL = 'https://services.swpc.noaa.gov/json/rtsw/rtsw_plasma_1m.json';
const MAG_URL = 'https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json';
const REQUEST_TIMEOUT_MS = 12000;

type FetchResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

async function fetchWithTimeout(url: string): Promise<FetchResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return { ok: res.ok, status: res.status, json: () => res.json() };
  } finally {
    clearTimeout(timeout);
  }
}

function parseLatestPlasma(data: Array<Record<string, unknown>>): { speedKmPerSec: number; densityPerCm3: number; timestamp: string } | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const last = data[data.length - 1];
  const speed = Number(last.speed);
  const density = Number(last.density);
  const time = typeof last.time_tag === 'string' ? last.time_tag : new Date().toISOString();
  if (!Number.isFinite(speed) || !Number.isFinite(density)) return null;
  return { speedKmPerSec: speed, densityPerCm3: density, timestamp: time };
}

function parseLatestMag(data: Array<Record<string, unknown>>): { bz: number | undefined; timestamp: string } | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const last = data[data.length - 1];
  const bz = Number(last.bz_gsm);
  const time = typeof last.time_tag === 'string' ? last.time_tag : new Date().toISOString();
  return { bz: Number.isFinite(bz) ? bz : undefined, timestamp: time };
}

function mergeSnapshots(
  plasma: { speedKmPerSec: number; densityPerCm3: number; timestamp: string } | null,
  mag: { bz: number | undefined; timestamp: string } | null
): SolarWindSnapshot | null {
  if (!plasma) return null;
  return {
    speedKmPerSec: plasma.speedKmPerSec,
    densityPerCm3: plasma.densityPerCm3,
    bz: mag?.bz,
    timestamp: plasma.timestamp || mag?.timestamp || new Date().toISOString(),
  };
}

export async function fetchLiveSolarWindSnapshot(): Promise<{ snapshot: SolarWindSnapshot; quality: 'live' | 'fallback' }>
{
  try {
    const [plasmaRes, magRes] = await Promise.all([fetchWithTimeout(PLASMA_URL), fetchWithTimeout(MAG_URL)]);
    if (!plasmaRes.ok || !magRes.ok) throw new Error(`NOAA RTSW http ${plasmaRes.status}/${magRes.status}`);
    const [plasmaJson, magJson] = await Promise.all([
      plasmaRes.json() as Promise<Array<Record<string, unknown>>>,
      magRes.json() as Promise<Array<Record<string, unknown>>>
    ]);
    const plasma = parseLatestPlasma(plasmaJson);
    const mag = parseLatestMag(magJson);
    const merged = mergeSnapshots(plasma, mag);
    if (!merged) throw new Error('Missing plasma snapshot');
    return { snapshot: merged, quality: 'live' };
  } catch {
    return { snapshot: fallbackSolarWindSnapshot(), quality: 'fallback' };
  }
}

export async function fetchLiveKpSnapshot(): Promise<{ snapshot: KpSnapshot; quality: 'live' | 'fallback' }>
{
  try {
    const result = await noaaGeomagneticService.getCurrentConditions();
    if (!result.success || !result.data) throw new Error(result.error || 'geomagnetic fetch failed');
    const kp = result.data.kIndex;
    const timestamp = result.data.timestamp.toISOString();
    if (!Number.isFinite(kp)) throw new Error('invalid kp');
    return { snapshot: { kp, timestamp }, quality: 'live' };
  } catch {
    return { snapshot: fallbackKpSnapshot(), quality: 'fallback' };
  }
}
