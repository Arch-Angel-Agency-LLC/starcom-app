// Unified disposal helpers for Three.js objects
import * as THREE from 'three';

export function disposeObject3D(obj: THREE.Object3D) {
  const anyObj = obj as unknown as { geometry?: unknown; material?: unknown };
  const geom = anyObj.geometry as unknown as { dispose?: () => void; disposeBoundsTree?: () => void } | undefined;
  if (geom) {
    // If three-mesh-bvh attached a bounds tree, dispose it first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (geom as any).disposeBoundsTree?.();
    geom.dispose?.();
  }
  const matUnknown = (obj as unknown as { material?: THREE.Material | THREE.Material[] }).material;
  if (matUnknown) {
    if (Array.isArray(matUnknown)) matUnknown.forEach(m => m.dispose?.()); else matUnknown.dispose?.();
  }
}

export function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    disposeObject3D(child);
  }
}
