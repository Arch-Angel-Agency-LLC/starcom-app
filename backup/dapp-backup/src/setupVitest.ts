// src/setupVitest.ts
import '@testing-library/jest-dom'; // Import the package directly
import { vi } from 'vitest';

// Mock fetch globally with proper Response interface
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '',
  blob: async () => new Blob(),
  arrayBuffer: async () => new ArrayBuffer(0),
  headers: new Headers(),
  redirected: false,
  statusText: 'OK',
  type: 'basic',
  url: '',
  clone: function() { return this; },
  body: null,
  bodyUsed: false,
} as Response);

// Polyfill window.matchMedia for RainbowKit/WalletConnect and Globe
if (!window.matchMedia) {
  window.matchMedia = function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

// Polyfill for canvas to avoid Globe/3D errors
if (window.HTMLCanvasElement && !window.HTMLCanvasElement.prototype.getContext) {
  window.HTMLCanvasElement.prototype.getContext = () => null;
}

// Mock THREE.TextureLoader for artifact-driven globe tests
vi.mock('three', async (importOriginal) => {
  // Try to import the original module first
  try {
    const originalModule = await importOriginal<typeof import('three')>();
    return {
      ...originalModule,
      TextureLoader: class {
        load(url: string, onLoad: (texture: unknown) => void) {
          // Return a dummy texture object
          const dummyTexture = { image: { src: url } };
          onLoad(dummyTexture);
          return dummyTexture;
        }
      }
    };
  } catch {
    // If the original module cannot be imported, provide a minimal mock
    return {
      TextureLoader: class {
        load(url: string, onLoad: (texture: unknown) => void) {
          const dummyTexture = { image: { src: url } };
          onLoad(dummyTexture);
          return dummyTexture;
        }
      },
      Vector3: class Vector3 {
        x: number;
        y: number;
        z: number;
        constructor(x = 0, y = 0, z = 0) {
          this.x = x;
          this.y = y;
          this.z = z;
        }
      }
    };
  }
});
