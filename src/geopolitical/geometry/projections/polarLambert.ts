// polarLambert.ts
// Simple Lambert Azimuthal Equal-Area style projection (approx) centered on feature centroid
// Used for high-latitude (|lat| > 60) polygons to stabilize triangulation near poles.

import { latLonToVector3 } from '../../utils/latLonToVector3';

export interface LonLat { lon: number; lat: number; }
export interface PolarProjectionResult {
  originLat: number;
  originLon: number;
  points2D: { x: number; y: number; lon: number; lat: number }[];
}

// Re-implements spherical centroid logic (duplicated from tangentPlane for now; consider factoring later)
function sphericalCentroid(points: LonLat[]): { lat: number; lon: number } {
  if (!points.length) return { lat: 0, lon: 0 };
  let x = 0, y = 0, z = 0;
  for (const p of points) {
    const v = latLonToVector3(p.lat, p.lon, { radius: 1, elevation: 0, invertX: false });
    x += v.x; y += v.y; z += v.z;
  }
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  x /= len; y /= len; z /= len;
  const lon = Math.atan2(z, x) * 180 / Math.PI;
  const lat = Math.asin(y) * 180 / Math.PI;
  return { lat, lon };
}

export function projectPolarLambert(points: LonLat[]): PolarProjectionResult {
  const centroid = sphericalCentroid(points);
  const lat0 = centroid.lat * Math.PI / 180;
  const lon0 = centroid.lon * Math.PI / 180;
  const sinLat0 = Math.sin(lat0);
  const cosLat0 = Math.cos(lat0);

  const points2D = points.map(p => {
    const lat = p.lat * Math.PI / 180;
    const lon = p.lon * Math.PI / 180;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const dLon = lon - lon0;
    const cosDLon = Math.cos(dLon);
    const denom = 1 + sinLat0 * sinLat + cosLat0 * cosLat * cosDLon;
    // Fallback to small epsilon to avoid division by zero near antipode
    const k = Math.sqrt(2 / Math.max(denom, 1e-12));
    const x = k * cosLat * Math.sin(dLon);
    const y = k * (cosLat0 * sinLat - sinLat0 * cosLat * cosDLon);
    return { x, y, lon: p.lon, lat: p.lat };
  });

  return { originLat: centroid.lat, originLon: centroid.lon, points2D };
}
