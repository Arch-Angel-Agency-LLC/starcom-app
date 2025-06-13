// src/setupTests.ts
import '@testing-library/jest-dom'; // Import the package directly
import { vi } from 'vitest';

global.fetch = vi.fn(); // Mock fetch globally

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

// Mock THREE.TextureLoader for artifact-driven globe tests (see globe-testing-plan.artifact)
vi.mock('three', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    TextureLoader: class {
      load(url: string, onLoad: (texture: unknown) => void) {
        // Return a dummy texture object
        const TextureCtor = actual.Texture as { new (): object };
        const dummyTexture = Object.assign({}, { image: { src: url } }, new TextureCtor());
        onLoad(dummyTexture);
      }
    }
  };
});