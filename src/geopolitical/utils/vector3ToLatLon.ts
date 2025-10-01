import * as THREE from 'three';

export interface VectorToLatLonOptions {
  flipZ?: boolean;     // overlays used z' = -z; set true to invert back
}

const RAD2DEG = 180 / Math.PI;

export function vector3ToLatLon(v: THREE.Vector3, opts: VectorToLatLonOptions = {}) {
  const { flipZ = true } = opts;
  const x = v.x;
  const y = v.y;
  const z = flipZ ? -v.z : v.z;
  const r = Math.sqrt(x * x + y * y + z * z) || 1;
  const lat = Math.asin(y / r) * RAD2DEG;
  const lon = Math.atan2(z, x) * RAD2DEG;
  // normalize lon to [-180,180]
  const nlon = ((lon + 540) % 360) - 180;
  return { lat, lon: nlon };
}
