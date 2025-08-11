// Projection utility: convert lat/lon (degrees) to THREE.Vector3 on sphere
// Radius base and optional elevation offset.
import * as THREE from 'three';

export interface LatLonProjectOptions {
  radius?: number;      // Base radius of globe
  elevation?: number;   // Extra radial offset
  invertX?: boolean;    // Some existing code flips X sign
}

const DEG2RAD = Math.PI / 180;

export function latLonToVector3(latDeg: number, lonDeg: number, opts: LatLonProjectOptions = {}): THREE.Vector3 {
  const { radius = 100, elevation = 0, invertX = true } = opts;
  const lat = (latDeg || 0) * DEG2RAD;
  const lon = (lonDeg || 0) * DEG2RAD;
  const r = radius + elevation;
  const x = r * Math.cos(lat) * Math.cos(lon);
  const y = r * Math.sin(lat);
  const z = r * Math.cos(lat) * Math.sin(lon);
  return new THREE.Vector3(invertX ? -x : x, y, z);
}

// Batch helper (minimizes allocations by reusing output array if provided)
export function projectPath(coords: Array<[number, number]>, opts: LatLonProjectOptions = {}): THREE.Vector3[] {
  return coords.map(([lon, lat]) => latLonToVector3(lat, lon, opts));
}
