// SpaceWeatherGeometry.ts
// Geometry/material helpers for magnetopause, bow shock, and auroral overlays.
// MVP focuses on lightweight meshes with low vertex counts and simple materials.

import * as THREE from 'three';
import type { AuroraPayload, BowShockPayload, LatLng, MagnetopausePayload } from '../services/SpaceWeatherModeling';

const SHELL_WIDTH_SEGMENTS = 48; // keep under 5k verts with sphere geometry
const SHELL_HEIGHT_SEGMENTS = 32;
const DEFAULT_AURORA_ALTITUDE = 1.02; // relative to Earth radius
const BLACKOUT_ALTITUDE = 1.015;
const SHELL_VERTEX_CAP = 5000;
export const AURORA_POINT_CAP = 512;

const COLORS = {
  magnetopause: new THREE.Color('#20d0e8'),
  bowShock: new THREE.Color('#ff9f43'),
  aurora: new THREE.Color('#00ff80'),
  blackout: new THREE.Color('#0a0a0a')
};

function buildShell(radius: number, color: THREE.Color, opacity: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, SHELL_WIDTH_SEGMENTS, SHELL_HEIGHT_SEGMENTS);
  const material = new THREE.MeshPhongMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -2
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 2;
  if (mesh.geometry.getAttribute('position').count > SHELL_VERTEX_CAP) {
    console.warn('[SpaceWeather] magnetopause/bow-shock shell exceeded vertex cap', {
      vertices: mesh.geometry.getAttribute('position').count,
      cap: SHELL_VERTEX_CAP
    });
  }
  return mesh;
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function downsamplePolyline(points: LatLng[], cap: number, label: string): LatLng[] {
  if (points.length <= cap) return points;

  const result: LatLng[] = [];
  const step = (points.length - 1) / (cap - 1);
  for (let i = 0; i < cap - 1; i++) {
    const idx = Math.floor(i * step);
    result.push(points[idx]);
  }
  result.push(points[points.length - 1]);

  console.warn(`[SpaceWeather] downsampling ${label} polyline`, {
    original: points.length,
    cap,
    used: result.length
  });
  return result;
}

function buildAuroraLine(points: LatLng[], color: THREE.Color, opacity: number, altitude = DEFAULT_AURORA_ALTITUDE): THREE.Line {
  const usable = downsamplePolyline(points, AURORA_POINT_CAP, 'aurora-line');
  const positions: number[] = [];
  usable.forEach((p) => {
    const v = latLngToVector3(p.lat, p.lng, altitude);
    positions.push(v.x, v.y, v.z);
  });
  const geometry = new THREE.BufferGeometry();
  const positionAttr = new Float32Array(positions);
  geometry.setAttribute('position', new THREE.BufferAttribute(positionAttr, 3));
  geometry.computeBoundingSphere();
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    linewidth: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });
  const line = new THREE.LineLoop(geometry, material);
  line.renderOrder = 1;
  return line;
}

function buildBlackoutBand(points: LatLng[], gradient: { inner: number; outer: number }): THREE.Mesh {
  // Build a triangle strip band between inner/outer altitude offsets using provided polyline.
  const usable = downsamplePolyline(points, AURORA_POINT_CAP, 'aurora-blackout');
  const innerAlt = BLACKOUT_ALTITUDE + gradient.inner * 0.02;
  const outerAlt = BLACKOUT_ALTITUDE + gradient.outer * 0.04;
  const vertices: number[] = [];
  const indices: number[] = [];

  usable.forEach((p) => {
    const inner = latLngToVector3(p.lat, p.lng, innerAlt);
    const outer = latLngToVector3(p.lat, p.lng, outerAlt);
    vertices.push(inner.x, inner.y, inner.z);
    vertices.push(outer.x, outer.y, outer.z);
  });

  // Close loop by repeating first segment
  const inner0 = latLngToVector3(usable[0].lat, usable[0].lng, innerAlt);
  const outer0 = latLngToVector3(usable[0].lat, usable[0].lng, outerAlt);
  vertices.push(inner0.x, inner0.y, inner0.z);
  vertices.push(outer0.x, outer0.y, outer0.z);

  // Build triangle indices for strip (two vertices per segment)
  const pairs = vertices.length / 3 / 2; // number of point pairs
  for (let i = 0; i < pairs - 1; i++) {
    const iInner = i * 2;
    const iOuter = i * 2 + 1;
    const nextInner = (i + 1) * 2;
    const nextOuter = (i + 1) * 2 + 1;
    indices.push(iInner, iOuter, nextOuter);
    indices.push(iInner, nextOuter, nextInner);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: COLORS.blackout,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 0.5;
  return mesh;
}

export function countVertices(object: THREE.Object3D): number {
  let total = 0;
  object.traverse((child) => {
    const geometry = (child as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    const position = geometry?.getAttribute('position');
    if (position) total += position.count;
  });
  return total;
}

const defaultVertexLogger = (label: string, total: number) => {
  console.info(`[SpaceWeather] ${label} vertices=${total}`);
};

export function logVertexCount(
  label: string,
  object: THREE.Object3D,
  logger: (label: string, total: number) => void = defaultVertexLogger
): number {
  const total = countVertices(object);
  logger(label, total);
  return total;
}

export function createMagnetopauseMesh(payload: MagnetopausePayload): THREE.Mesh {
  const opacity = payload.quality === 'live' ? 0.4 : 0.3;
  return buildShell(payload.standoffRe, COLORS.magnetopause, opacity);
}

export function createBowShockMesh(payload: BowShockPayload): THREE.Mesh {
  const opacity = payload.quality === 'live' ? 0.35 : 0.28;
  return buildShell(payload.radiusRe, COLORS.bowShock, opacity);
}

export function createAuroraLines(payload: AuroraPayload): { north: THREE.Line; south: THREE.Line } {
  const baseOpacity = payload.quality === 'live' ? 0.55 : 0.4;
  const pulseEnabled = Boolean((payload.meta as Record<string, unknown> | undefined)?.pulse);
  const applyPulse = (line: THREE.Line) => {
    if (!pulseEnabled) return;
    line.onBeforeRender = (_renderer, _scene, _camera, _geometry, material) => {
      const m = material as THREE.LineBasicMaterial;
      const t = performance.now() * 0.002;
      const amp = 0.12;
      const osc = Math.sin(t) * amp;
      m.opacity = THREE.MathUtils.clamp(baseOpacity + osc, 0.15, 0.85);
    };
  };

  const north = buildAuroraLine(payload.oval.north, COLORS.aurora, baseOpacity);
  const south = buildAuroraLine(payload.oval.south, COLORS.aurora, baseOpacity);
  applyPulse(north);
  applyPulse(south);
  return { north, south };
}

export function createAuroraBlackoutMesh(payload: AuroraPayload): THREE.Mesh {
  // Use north oval path for blackout band approximation; share gradient from payload
  return buildBlackoutBand(payload.oval.north, payload.blackout.gradient);
}

export function disposeObject(obj: THREE.Object3D | null | undefined) {
  if (!obj) return;
  obj.traverse((child) => {
    if ((child as THREE.Mesh).geometry) {
      (child as THREE.Mesh).geometry.dispose();
    }
    const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m.dispose());
    } else if (mat) {
      mat.dispose();
    }
  });
}
