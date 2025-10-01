// tangentPlane.ts
// Local tangent plane projection for a set of lon/lat vertices to stabilize triangulation.
// Returns 2D coordinates and the basis used so we can debug / verify.

import * as THREE from 'three';
import { latLonToVector3 } from '../../utils/latLonToVector3';

export interface LonLat { lon: number; lat: number; }
export interface TangentPlaneResult {
  originLat: number;
  originLon: number;
  points2D: { x: number; y: number; lon: number; lat: number }[];
  east: THREE.Vector3;
  north: THREE.Vector3;
  up: THREE.Vector3;
}

// Compute centroid on sphere via averaging unit vectors then normalizing.
function sphericalCentroid(points: LonLat[]): { lat: number; lon: number } {
  if (!points.length) return { lat: 0, lon: 0 };
  let x = 0, y = 0, z = 0;
  for (const p of points) {
    const v = latLonToVector3(p.lat, p.lon, { radius: 1, elevation: 0, invertX: false });
    x += v.x; y += v.y; z += v.z;
  }
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  x /= len; y /= len; z /= len;
  const lon = Math.atan2(z, x) * 180 / Math.PI; // note vector convention from latLonToVector3
  const lat = Math.asin(y) * 180 / Math.PI;
  return { lat, lon };
}

export function projectToTangentPlane(points: LonLat[]): TangentPlaneResult {
  const centroid = sphericalCentroid(points);
  // Basis: up = centroid unit vector; east = normalize(cross(up, worldUpApprox)); north = cross(east, up)
  const up = latLonToVector3(centroid.lat, centroid.lon, { radius: 1, elevation: 0, invertX: false }).normalize();
  // Choose reference to avoid degeneracy near poles
  const ref = Math.abs(up.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const east = new THREE.Vector3().crossVectors(up, ref).normalize();
  const north = new THREE.Vector3().crossVectors(east, up).normalize();

  const points2D = points.map(p => {
    const v = latLonToVector3(p.lat, p.lon, { radius: 1, elevation: 0, invertX: false });
    const rel = v.clone(); // sphere unit already
    const x = rel.dot(east);
    const y = rel.dot(north);
    return { x, y, lon: p.lon, lat: p.lat };
  });

  return { originLat: centroid.lat, originLon: centroid.lon, points2D, east, north, up };
}
