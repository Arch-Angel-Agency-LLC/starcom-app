// src/setupTests.ts
import '@testing-library/jest-dom'; // Import the package directly

// Mock fetch globally with proper Response interface
global.fetch = jest.fn().mockResolvedValue({
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

// Mock THREE.TextureLoader for artifact-driven globe tests (see globe-testing-plan.artifact)
jest.mock('three', () => {
  const actual = jest.requireActual('three');
  return {
    ...actual,
    TextureLoader: class {
      load(url, onLoad) {
        // Return a dummy texture object
        const dummyTexture = { image: { src: url } };
        onLoad(dummyTexture);
        return dummyTexture;
      }
    }
  };
});