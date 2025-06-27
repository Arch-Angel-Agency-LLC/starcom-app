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
    if (textureCache[name]) return textureCache[name];
    const entry = textureManifest[name];
    if (!entry) throw new Error(`Unknown texture: ${name}`);
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        entry.url,
        (texture: THREE.Texture) => {
          textureCache[name] = texture;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  /**
   * Get cached texture if available
   */
  static getCachedTexture(name: string): THREE.Texture | undefined {
    return textureCache[name];
  }
}
