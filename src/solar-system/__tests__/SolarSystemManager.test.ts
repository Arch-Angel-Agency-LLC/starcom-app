// SolarSystemManager.test.ts - TDD tests for SolarSystemManager core functionality

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { SolarSystemManager } from '../SolarSystemManager';
import { ScaleContext } from '../types/ScaleContext';
import { DEFAULT_SCALE_CONFIGS } from '../types/SolarSystemConfig';

// Mock THREE.js objects
const mockScene = {
  add: vi.fn(),
  remove: vi.fn(),
  children: []
} as unknown as THREE.Scene;

const mockCamera = {
  position: new THREE.Vector3(0, 0, 300),
  updateProjectionMatrix: vi.fn()
} as unknown as THREE.Camera;

const mockGlobe = {
  scene: () => mockScene,
  camera: () => mockCamera
} as any;

describe('SolarSystemManager', () => {
  let solarSystemManager: SolarSystemManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset camera position for each test
    mockCamera.position.set(0, 0, 300);
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      solarSystemManager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });

      expect(solarSystemManager).toBeDefined();
      expect(solarSystemManager.getCurrentContext()).toBe(ScaleContext.EARTH_LOCAL);
      expect(solarSystemManager.isInitialized()).toBe(true);
    });

    test('should accept custom configuration', () => {
      const customConfig = {
        globeRadius: 150,
        enableTransitions: false,
        transitionDuration: 1000,
        performanceMode: 'low' as const,
        debugMode: true
      };

      solarSystemManager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      }, customConfig);

      expect(solarSystemManager.getConfig().globeRadius).toBe(150);
      expect(solarSystemManager.getConfig().enableTransitions).toBe(false);
      expect(solarSystemManager.getConfig().performanceMode).toBe('low');
    });

    test('should throw error with invalid parameters', () => {
      expect(() => {
        new SolarSystemManager({
          scene: null as any,
          camera: mockCamera,
          globe: mockGlobe
        });
      }).toThrow('Scene is required for SolarSystemManager');

      expect(() => {
        new SolarSystemManager({
          scene: mockScene,
          camera: null as any,
          globe: mockGlobe
        });
      }).toThrow('Camera is required for SolarSystemManager');
    });
  });

  describe('Scale Context Detection', () => {
    beforeEach(() => {
      solarSystemManager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });
    });

    test('should detect EARTH_LOCAL context for close camera', () => {
      mockCamera.position.set(0, 0, 200); // Within 150-1000 range
      
      const context = solarSystemManager.detectScaleContext(200);
      expect(context).toBe(ScaleContext.EARTH_LOCAL);
    });

    test('should detect EARTH_SPACE context for medium distance', () => {
      mockCamera.position.set(0, 0, 3000); // Within 200-8000 range
      
      const context = solarSystemManager.detectScaleContext(3000);
      expect(context).toBe(ScaleContext.EARTH_SPACE);
    });

    test('should detect INNER_SOLAR context for far distance', () => {
      mockCamera.position.set(0, 0, 10000); // Within 500-15000 range
      
      const context = solarSystemManager.detectScaleContext(10000);
      expect(context).toBe(ScaleContext.INNER_SOLAR);
    });

    test('should detect SOLAR_SYSTEM context for very far distance', () => {
      mockCamera.position.set(0, 0, 25000); // Within 1000-50000 range
      
      const context = solarSystemManager.detectScaleContext(25000);
      expect(context).toBe(ScaleContext.SOLAR_SYSTEM);
    });

    test('should handle edge cases at context boundaries', () => {
      // Test exact boundary values
      expect(solarSystemManager.detectScaleContext(1000)).toBe(ScaleContext.EARTH_LOCAL);
      expect(solarSystemManager.detectScaleContext(8000)).toBe(ScaleContext.EARTH_SPACE);
      expect(solarSystemManager.detectScaleContext(15000)).toBe(ScaleContext.INNER_SOLAR);
    });
  });

  describe('Scale Context Updates', () => {
    beforeEach(() => {
      solarSystemManager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });
    });

    test('should update scale context when camera distance changes', () => {
      const onScaleChange = vi.fn();
      solarSystemManager.onScaleChange(onScaleChange);

      // Start in EARTH_LOCAL
      expect(solarSystemManager.getCurrentContext()).toBe(ScaleContext.EARTH_LOCAL);

      // Move camera to EARTH_SPACE distance
      mockCamera.position.set(0, 0, 3000);
      solarSystemManager.updateScale(3000);

      expect(solarSystemManager.getCurrentContext()).toBe(ScaleContext.EARTH_SPACE);
      expect(onScaleChange).toHaveBeenCalledWith(ScaleContext.EARTH_SPACE, ScaleContext.EARTH_LOCAL);
    });

    test('should not trigger update if context remains the same', () => {
      const onScaleChange = vi.fn();
      solarSystemManager.onScaleChange(onScaleChange);

      // Update with same context distance
      solarSystemManager.updateScale(300);
      solarSystemManager.updateScale(400);

      expect(onScaleChange).not.toHaveBeenCalled();
      expect(solarSystemManager.getCurrentContext()).toBe(ScaleContext.EARTH_LOCAL);
    });

    test('should support multiple scale change listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      solarSystemManager.onScaleChange(listener1);
      solarSystemManager.onScaleChange(listener2);

      mockCamera.position.set(0, 0, 3000);
      solarSystemManager.updateScale(3000);

      expect(listener1).toHaveBeenCalledWith(ScaleContext.EARTH_SPACE, ScaleContext.EARTH_LOCAL);
      expect(listener2).toHaveBeenCalledWith(ScaleContext.EARTH_SPACE, ScaleContext.EARTH_LOCAL);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      solarSystemManager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });
    });

    test('should return current configuration', () => {
      const config = solarSystemManager.getConfig();
      
      expect(config).toHaveProperty('globeRadius');
      expect(config).toHaveProperty('enableTransitions');
      expect(config).toHaveProperty('transitionDuration');
      expect(config).toHaveProperty('performanceMode');
    });

    test('should return scale configuration for current context', () => {
      const scaleConfig = solarSystemManager.getScaleConfig();
      
      expect(scaleConfig.context).toBe(ScaleContext.EARTH_LOCAL);
      expect(scaleConfig).toEqual(DEFAULT_SCALE_CONFIGS[ScaleContext.EARTH_LOCAL]);
    });

    test('should return scale configuration for specific context', () => {
      const spaceConfig = solarSystemManager.getScaleConfig(ScaleContext.EARTH_SPACE);
      
      expect(spaceConfig.context).toBe(ScaleContext.EARTH_SPACE);
      expect(spaceConfig.sunVisible).toBe(true);
      expect(spaceConfig.sunRadius).toBe(50);
    });
  });

  describe('Lifecycle Management', () => {
    beforeEach(() => {
      solarSystemManager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });
    });

    test('should initialize successfully', () => {
      expect(solarSystemManager.isInitialized()).toBe(true);
    });

    test('should dispose resources correctly', () => {
      const onScaleChange = vi.fn();
      solarSystemManager.onScaleChange(onScaleChange);

      solarSystemManager.dispose();

      expect(solarSystemManager.isInitialized()).toBe(false);
      
      // Should not trigger listeners after disposal
      solarSystemManager.updateScale(3000);
      expect(onScaleChange).not.toHaveBeenCalled();
    });

    test('should handle multiple dispose calls gracefully', () => {
      expect(() => {
        solarSystemManager.dispose();
        solarSystemManager.dispose();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid scale updates gracefully', () => {
      solarSystemManager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });

      expect(() => {
        solarSystemManager.updateScale(-100);
      }).not.toThrow();

      expect(() => {
        solarSystemManager.updateScale(NaN);
      }).not.toThrow();

      expect(() => {
        solarSystemManager.updateScale(Infinity);
      }).not.toThrow();
    });

    test('should validate scale context enum values', () => {
      solarSystemManager = new SolarSystemManager({
        scene: mockScene,
        camera: mockCamera,
        globe: mockGlobe
      });

      expect(() => {
        solarSystemManager.getScaleConfig('invalid-context' as ScaleContext);
      }).toThrow('Invalid scale context: invalid-context');
    });
  });
});
