/*
  Helper to enable three-mesh-bvh accelerated raycasting on a group of meshes.
  Isolated to avoid widespread eslint any warnings.
*/
import * as THREE from 'three';

export async function enableBVHForGroup(group: THREE.Group): Promise<boolean> {
  try {
    const bvh = await import('three-mesh-bvh');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (THREE.Mesh as any).prototype.raycast = (bvh as any).acceleratedRaycast;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (THREE.BufferGeometry as any).prototype.computeBoundsTree = (bvh as any).computeBoundsTree;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (THREE.BufferGeometry as any).prototype.disposeBoundsTree = (bvh as any).disposeBoundsTree;
    group.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if ((mesh as unknown as { isMesh?: boolean }).isMesh && mesh.geometry) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geom = mesh.geometry as any;
        if (typeof geom.computeBoundsTree === 'function') {
          geom.computeBoundsTree();
        }
      }
    });
    return true;
  } catch (e) {
    console.warn('three-mesh-bvh not available; falling back to standard raycasting.', e);
    return false;
  }
}
