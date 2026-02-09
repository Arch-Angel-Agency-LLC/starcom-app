import * as THREE from 'three';
import { describe, it, expect, vi } from 'vitest';
import { disposeGLTF } from '../disposeGLTF';

const makeMesh = () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const texture = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({ map: texture });

  const mesh = new THREE.Mesh(geometry, material);

  const geometryDispose = vi.spyOn(geometry, 'dispose');
  const materialDispose = vi.spyOn(material, 'dispose');
  const textureDispose = vi.spyOn(texture, 'dispose');

  return { mesh, geometryDispose, materialDispose, textureDispose };
};

describe('disposeGLTF', () => {
  it('disposes geometry, material, and textures', () => {
    const { mesh, geometryDispose, materialDispose, textureDispose } = makeMesh();

    disposeGLTF(mesh);

    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(textureDispose).toHaveBeenCalledTimes(1);
  });

  it('is noop for null roots', () => {
    expect(() => disposeGLTF(null)).not.toThrow();
    expect(() => disposeGLTF(undefined)).not.toThrow();
  });

  it('recursively disposes child meshes and tolerates repeated calls', () => {
    const parent = new THREE.Group();
    const childMesh = makeMesh();
    parent.add(childMesh.mesh);

    disposeGLTF(parent);
    disposeGLTF(parent); // second call should not throw or double-dispose errors

    expect(childMesh.geometryDispose).toHaveBeenCalled();
    expect(childMesh.materialDispose).toHaveBeenCalled();
    expect(childMesh.textureDispose).toHaveBeenCalled();
  });
});
