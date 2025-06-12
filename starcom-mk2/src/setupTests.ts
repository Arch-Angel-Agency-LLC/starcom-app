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