// GlobeTextureLoader.ts
// AI-NOTE: See globe-textures.artifact for asset manifest and usage mapping.

/**
 * GlobeTextureLoader: Centralized texture preloading and caching for the Globe Engine.
 * - See globe-textures.artifact for asset manifest and usage mapping.
 */

import * as THREE from 'three';

// AI-NOTE: See globe-textures.artifact for asset manifest and usage mapping.
const textureManifest: Record<string, { url: string; license: string; usage: string[] }> = {
  earthDay: {
    url: '//unpkg.com/three-globe/example/img/earth-day.jpg',
    license: 'CC BY 4.0',
    usage: ['EcoNatural', 'dayNight', 'default'],
  },
  earthNight: {
    url: '//unpkg.com/three-globe/example/img/earth-night.jpg',
    license: 'CC BY 4.0',
    usage: ['EcoNatural', 'dayNight'],
  },
  blueMarble: {
    url: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    license: 'NASA',
    usage: ['GeoPolitical', 'blueMarble'],
  },
  earthDark: {
    url: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
    license: 'CC BY 4.0',
    usage: ['CyberCommand', 'hologram'],
  },
};

const textureCache: Record<string, THREE.Texture> = {};

export class GlobeTextureLoader {
  /**
   * Load texture by name (see globe-textures.artifact)
   */
  static async loadTexture(name: string): Promise<THREE.Texture> {
    if (textureCache[name]) {
      // Ensure cached textures also have normalized parameters
      const cached = textureCache[name];
      GlobeTextureLoader.normalizeTexture(cached);
      return cached;
    }
    const entry = textureManifest[name];
    if (!entry) throw new Error(`Unknown texture: ${name}`);
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        entry.url,
        (texture: THREE.Texture) => {
          // Normalize texture orientation consistently
          GlobeTextureLoader.normalizeTexture(texture);
          textureCache[name] = texture;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  /** Normalize texture sampling and orientation.
   * - Repeat in U to allow seam wrapping
   * - Clamp in V to avoid polar artifacts
   * - Shift by -90° along U (offset.x = 0.75) to align with globe overlays
   */
  private static normalizeTexture(texture: THREE.Texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    // Keep native longitudinal alignment so overlays using lat/lon remain accurate
    texture.offset.x = 0;
    texture.needsUpdate = true;
  }

  /**
   * Get cached texture if available
   */
  static getCachedTexture(name: string): THREE.Texture | undefined {
    return textureCache[name];
  }
}
