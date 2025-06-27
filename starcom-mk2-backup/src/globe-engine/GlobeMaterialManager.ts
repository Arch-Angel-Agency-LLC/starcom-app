// GlobeMaterialManager.ts
// AI-NOTE: See globe-shaders.artifact for shader/material documentation.

/**
 * GlobeMaterialManager: Handles all shader/material logic for the Globe Engine.
 * - See globe-shaders.artifact for shader/material documentation and extension.
 */

import * as THREE from 'three';

export class GlobeMaterialManager {
  /**
   * Get material for a given mode and textures (see globe-shaders.artifact)
   */
  static getMaterialForMode(mode: string, textures: Record<string, THREE.Texture>): THREE.Material {
    // AI-NOTE: See globe-shaders.artifact for shader/material documentation.
    switch (mode) {
      case 'hologram':
        // Example: Hologram material using earthDark texture
        return new THREE.MeshPhongMaterial({
          map: textures.earthDarkTexture,
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8,
        });
      case 'blueMarble':
        return new THREE.MeshBasicMaterial({ map: textures.blueMarbleTexture });
      case 'dayNight':
      default:
        return new THREE.MeshBasicMaterial({ map: textures.earthDayTexture });
    }
  }

  /**
   * Dispose of material resources
   */
  static disposeMaterial(material: THREE.Material) {
    material.dispose();
  }
}
