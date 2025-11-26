import * as THREE from 'three';

export interface GeometryStats {
  meshes: number;
  materials: number;
  textures: number;
  approxGpuBytes: number;
}

const TEXTURE_KEYS = [
  'map',
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'lightMap',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'specularMap'
] as const;
type TextureKey = (typeof TEXTURE_KEYS)[number];

function estimateGeometryBytes(geometry?: THREE.BufferGeometry | null) {
  if (!geometry) return 0;
  let total = 0;
  const attributes = geometry.attributes as Record<string, THREE.BufferAttribute>;
  Object.values(attributes).forEach(attr => {
    if (!attr || !attr.array) return;
    total += attr.count * attr.itemSize * attr.array.BYTES_PER_ELEMENT;
  });
  const index = geometry.index;
  if (index && index.array) {
    total += index.count * index.array.BYTES_PER_ELEMENT;
  }
  return total;
}

function estimateTextureBytes(texture: THREE.Texture | undefined) {
  if (!texture || !texture.image) return 0;
  const image = texture.image as { width?: number; height?: number };
  const width = image?.width ?? 512;
  const height = image?.height ?? 512;
  const channelBytes = 4; // assume RGBA
  return width * height * channelBytes;
}

export function collectGeometryStats(target?: THREE.Object3D | THREE.Object3D[] | null): GeometryStats {
  const stats: GeometryStats = {
    meshes: 0,
    materials: 0,
    textures: 0,
    approxGpuBytes: 0
  };
  if (!target) return stats;

  const roots = Array.isArray(target) ? target : [target];
  const seenMaterials = new Set<number>();
  const seenTextures = new Set<number>();

  const inspectMaterial = (material: THREE.Material) => {
    if (!material) return;
    if (!seenMaterials.has(material.id)) {
      seenMaterials.add(material.id);
      stats.materials += 1;
    }
      const materialRecord = material as unknown as Record<string, unknown>;
      TEXTURE_KEYS.forEach((key: TextureKey) => {
        const tex = materialRecord[key] as THREE.Texture | undefined;
      if (tex && !seenTextures.has(tex.id)) {
        seenTextures.add(tex.id);
        stats.textures += 1;
        stats.approxGpuBytes += estimateTextureBytes(tex);
      }
    });
  };

  roots.forEach(root => {
    if (!root) return;
    root.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if ((mesh as { isMesh?: boolean }).isMesh && mesh.geometry) {
        stats.meshes += 1;
        stats.approxGpuBytes += estimateGeometryBytes(mesh.geometry as THREE.BufferGeometry);
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach(inspectMaterial);
        } else if (material) {
          inspectMaterial(material);
        }
      }
    });
  });

  return stats;
}
