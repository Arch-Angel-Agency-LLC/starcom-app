import * as THREE from 'three';
import { emitDisposalTrace } from '../services/tracing/traceEmitters';

export interface DisposeOptions {
  geometry?: boolean;
  material?: boolean;
  textures?: boolean;
  skeleton?: boolean;
}

const defaultOptions: Required<DisposeOptions> = {
  geometry: true,
  material: true,
  textures: true,
  skeleton: true
};

export function disposeGLTF(root: THREE.Object3D | null | undefined, options: DisposeOptions = {}): void {
  if (!root) return;
  const merged = { ...defaultOptions, ...options };
  const counters = { nodes: 0, geometries: 0, materials: 0, textures: 0, skeletons: 0 };

  root.traverse(node => {
    counters.nodes += 1;
    if (!('isObject3D' in node)) return;

    const mesh = node as THREE.Mesh | THREE.SkinnedMesh | THREE.Points | THREE.Line;
    if (merged.geometry && (mesh as THREE.Mesh).geometry) {
      (mesh as THREE.Mesh).geometry.dispose();
      counters.geometries += 1;
    }

    if (merged.material && (mesh as THREE.Mesh).material) {
      const materials = Array.isArray((mesh as THREE.Mesh).material)
        ? (mesh as THREE.Mesh).material
        : [(mesh as THREE.Mesh).material];
      materials.forEach(mat => disposeMaterial(mat, merged.textures, counters));
      counters.materials += materials.length;
    }

    if (merged.skeleton && (mesh as THREE.SkinnedMesh).skeleton) {
      const skinned = mesh as THREE.SkinnedMesh;
      skinned.skeleton.boneTexture?.dispose?.();
      skinned.skeleton.dispose();
      counters.skeletons += 1;
    }
  });

  emitDisposalTrace('gltf_dispose', counters);
}

function disposeMaterial(
  material: THREE.Material,
  disposeTextures: boolean,
  counters: { textures: number }
): void {
  if (!material) return;

  if (disposeTextures) {
    const typed = material as unknown as { [key: string]: unknown };
    const textureKeys = Object.keys(typed).filter(key => (typed[key] as unknown) instanceof THREE.Texture);
    textureKeys.forEach(key => {
      const tex = typed[key] as THREE.Texture;
      tex.dispose();
      counters.textures += 1;
    });
  }

  material.dispose();
}
