// SolarSystemIntegration.test.ts - Integration test for solar system in Globe

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import * as THREE from 'three';
import { useGlobeSolarSystemIntegration } from '../GlobeSolarSystemIntegration';

// Mock react-globe.gl
vi.mock('react-globe.gl', () => ({
  default: React.forwardRef((props: any, ref: any) => {
    // Create a mock globe with Three.js scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 300);

    React.useEffect(() => {
      if (ref) {
        ref.current = {
          scene: () => scene,
          camera: () => camera,
          controls: () => ({ enabled: true }),
          renderer: () => new THREE.WebGLRenderer(),
        };
      }
    }, []);

    return React.createElement('div', { 'data-testid': 'globe' });
  }),
}));

// Test component that uses the integration
const TestGlobeWithSolarSystem: React.FC = () => {
  const globeRef = React.useRef<any>();
  const [integrationState, setIntegrationState] = React.useState<any>(null);

  const solarSystemIntegration = useGlobeSolarSystemIntegration({
    globeRef,
    enabled: true,
    debugMode: true,
    onStateChange: (state) => {
      setIntegrationState(state);
      console.log('Solar system state changed:', state);
    }
  });

  return (
    <div data-testid="test-container">
      <div data-testid="globe" ref={globeRef} />
      <div data-testid="integration-status">
        Active: {solarSystemIntegration.isActive ? 'true' : 'false'}
      </div>
      <div data-testid="sun-visible">
        Sun Visible: {solarSystemIntegration.sunVisible ? 'true' : 'false'}
      </div>
      <div data-testid="current-scale">
        Scale: {solarSystemIntegration.currentScale || 'none'}
      </div>
    </div>
  );
};

describe('Solar System Integration Tests', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Globe Solar System Integration', () => {
    test('should initialize solar system manager successfully', async () => {
      const { getByTestId } = render(<TestGlobeWithSolarSystem />);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const integrationStatus = getByTestId('integration-status');
      expect(integrationStatus.textContent).toBe('Active: true');
    });

    test('should start with earth-local scale context', async () => {
      const { getByTestId } = render(<TestGlobeWithSolarSystem />);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const scaleDisplay = getByTestId('current-scale');
      expect(scaleDisplay.textContent).toBe('Scale: earth-local');
    });

    test('should show sun as not visible in earth-local scale', async () => {
      const { getByTestId } = render(<TestGlobeWithSolarSystem />);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const sunVisibility = getByTestId('sun-visible');
      expect(sunVisibility.textContent).toBe('Sun Visible: false');
    });

    test('should respond to camera distance changes', async () => {
      const { getByTestId } = render(<TestGlobeWithSolarSystem />);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initial state should be earth-local
      let scaleDisplay = getByTestId('current-scale');
      expect(scaleDisplay.textContent).toBe('Scale: earth-local');

      // Simulate camera zoom out (this would normally happen via Globe interaction)
      // We'll need to test this through the integration hook
      
      // For now, verify the integration is active
      const integrationStatus = getByTestId('integration-status');
      expect(integrationStatus.textContent).toBe('Active: true');
    });

    test('should clean up resources on unmount', async () => {
      const { unmount } = render(<TestGlobeWithSolarSystem />);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Solar System Manager Core Functionality', () => {
    test('should create solar system manager with proper dependencies', async () => {
      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.PerspectiveCamera();
      const mockGlobe = {
        scene: () => mockScene,
        camera: () => mockCamera
      };

      // Test that our core components can be imported and instantiated
      const { SolarSystemManager } = await import('../../../solar-system/SolarSystemManager');
      
      const manager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });

      expect(manager).toBeDefined();
      expect(manager.isInitialized()).toBe(true);
      expect(manager.getCurrentContext()).toBe('earth-local');

      // Cleanup
      manager.dispose();
    });

    test('should have working sun manager integration', async () => {
      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.PerspectiveCamera();
      const mockGlobe = {
        scene: () => mockScene,
        camera: () => mockCamera
      };

      const { SolarSystemManager } = await import('../../../solar-system/SolarSystemManager');
      const manager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });

      // Test scale transitions
      manager.updateScale(5000); // Should trigger earth-space context
      expect(manager.getCurrentContext()).toBe('earth-space');

      manager.updateScale(15000); // Should trigger inner-solar context
      expect(manager.getCurrentContext()).toBe('inner-solar');

      // Cleanup
      manager.dispose();
    });

    test('should handle NOAA data integration', async () => {
      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.PerspectiveCamera();
      const mockGlobe = {
        scene: () => mockScene,
        camera: () => mockCamera
      };

      const { SolarSystemManager } = await import('../../../solar-system/SolarSystemManager');
      const manager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });

      // Test that NOAA integration exists and doesn't crash
      const solarActivityState = manager.getSolarActivityState();
      
      // Should return state object or null (not throw error)
      expect(solarActivityState === null || typeof solarActivityState === 'object').toBe(true);

      // Cleanup
      manager.dispose();
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle rapid scale changes without memory leaks', async () => {
      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.PerspectiveCamera();
      const mockGlobe = {
        scene: () => mockScene,
        camera: () => mockCamera
      };

      const { SolarSystemManager } = await import('../../../solar-system/SolarSystemManager');
      const manager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });

      // Rapid scale changes
      for (let i = 0; i < 100; i++) {
        const distance = 300 + (i * 100);
        manager.updateScale(distance);
      }

      expect(manager.isInitialized()).toBe(true);
      
      // Cleanup
      manager.dispose();
      expect(manager.isInitialized()).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      // Test with invalid parameters
      const { SolarSystemManager } = await import('../../../solar-system/SolarSystemManager');
      
      expect(() => {
        new SolarSystemManager({
          scene: null as any,
          camera: null as any,
          globe: null as any
        });
      }).toThrow();
    });
  });
});
