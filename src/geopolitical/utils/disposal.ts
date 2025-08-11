// Unified disposal helpers for Three.js objects
import * as THREE from 'three';

export function disposeObject3D(obj: THREE.Object3D) {
  if ((obj as any).geometry) {
    (obj as any).geometry.dispose?.();
  }
  const mat = (obj as any).material;
  if (mat) {
    if (Array.isArray(mat)) mat.forEach(m => m.dispose?.()); else mat.dispose?.();
  }
}

export function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    disposeObject3D(child);
  }
}
