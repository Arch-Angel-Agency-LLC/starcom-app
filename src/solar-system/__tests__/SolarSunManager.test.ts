import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { SolarSunManager } from '../SolarSunManager';
import { ScaleContext } from '../types/ScaleContext';
import type { SunConfig, SunState } from '../SolarSunManager';

describe('SolarSunManager', () => {
  let scene: THREE.Scene;
  let sunManager: SolarSunManager;
  let mockStateChangeCallback: ReturnType<typeof vi.fn>;

  const defaultConfig: SunConfig = {
    baseRadius: 100,
    coronaIntensity: 0.5,
    lightIntensity: 1.0,
    lightColor: 0xffffff,
    enableCorona: true,
    enableLighting: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    scene = new THREE.Scene();
    mockStateChangeCallback = vi.fn();
    sunManager = new SolarSunManager(scene, defaultConfig);
  });

  afterEach(() => {
    if (sunManager) {
      sunManager.dispose();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const state = sunManager.getCurrentState();
      
      expect(state.isVisible).toBe(false);
      expect(state.currentRadius).toBe(100);
      expect(state.currentScale).toBe(ScaleContext.EARTH_LOCAL);
      expect(state.lightIntensity).toBe(1.0);
      expect(state.currentPosition).toEqual(new THREE.Vector3(0, 0, 0));
    });

    test('should accept custom configuration', () => {
      const customConfig: Partial<SunConfig> = {
        baseRadius: 200,
        lightIntensity: 0.5,
        enableCorona: false
      };

      const customSunManager = new SolarSunManager(scene, customConfig);
      const state = customSunManager.getCurrentState();
      
      expect(state.currentRadius).toBe(200);
      expect(state.lightIntensity).toBe(0.5);
      
      // Corona should not be created
      expect(customSunManager.getCoronaMesh()).toBeNull();
      
      customSunManager.dispose();
    });

    test('should create sun mesh and add to scene', () => {
      const sunMesh = sunManager.getSunMesh();
      
      expect(sunMesh).toBeDefined();
      expect(sunMesh).toBeInstanceOf(THREE.Mesh);
      expect(scene.children).toContain(sunMesh);
      expect(sunMesh!.visible).toBe(false); // Initially hidden
    });

    test('should create corona when enabled', () => {
      const coronaMesh = sunManager.getCoronaMesh();
      
      expect(coronaMesh).toBeDefined();
      expect(coronaMesh).toBeInstanceOf(THREE.Mesh);
      expect(scene.children).toContain(coronaMesh);
      expect(coronaMesh!.visible).toBe(false); // Initially hidden
    });

    test('should create lighting when enabled', () => {
      const sunLight = sunManager.getSunLight();
      
      expect(sunLight).toBeDefined();
      expect(sunLight).toBeInstanceOf(THREE.DirectionalLight);
      expect(scene.children).toContain(sunLight);
    });

    test('should not create corona when disabled', () => {
      const noCoronaManager = new SolarSunManager(scene, { enableCorona: false });
      
      expect(noCoronaManager.getCoronaMesh()).toBeNull();
      
      noCoronaManager.dispose();
    });

    test('should not create lighting when disabled', () => {
      const noLightManager = new SolarSunManager(scene, { enableLighting: false });
      
      expect(noLightManager.getSunLight()).toBeNull();
      
      noLightManager.dispose();
    });
  });

  describe('Scale Context Updates', () => {
    test('should hide sun in EARTH_LOCAL scale', () => {
      sunManager.updateForScale(ScaleContext.EARTH_LOCAL);
      
      const state = sunManager.getCurrentState();
      const sunMesh = sunManager.getSunMesh();
      
      expect(state.isVisible).toBe(false);
      expect(state.currentScale).toBe(ScaleContext.EARTH_LOCAL);
      expect(sunMesh!.visible).toBe(false);
    });

    test('should show and position sun in EARTH_SPACE scale', () => {
      sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      
      const state = sunManager.getCurrentState();
      const sunMesh = sunManager.getSunMesh();
      const scaleConfig = sunManager.getScaleConfig(ScaleContext.EARTH_SPACE);
      
      expect(state.isVisible).toBe(true);
      expect(state.currentScale).toBe(ScaleContext.EARTH_SPACE);
      expect(sunMesh!.visible).toBe(true);
      expect(state.currentRadius).toBe(scaleConfig!.sunRadius);
      expect(state.currentPosition.x).toBe(scaleConfig!.sunDistance);
    });

    test('should update sun size and position for INNER_SOLAR scale', () => {
      sunManager.updateForScale(ScaleContext.INNER_SOLAR);
      
      const state = sunManager.getCurrentState();
      const sunMesh = sunManager.getSunMesh();
      const scaleConfig = sunManager.getScaleConfig(ScaleContext.INNER_SOLAR);
      
      expect(state.isVisible).toBe(true);
      expect(state.currentScale).toBe(ScaleContext.INNER_SOLAR);
      expect(state.currentRadius).toBe(scaleConfig!.sunRadius);
      expect(state.lightIntensity).toBe(scaleConfig!.lightIntensity);
      
      // Check mesh scale
      const expectedScale = scaleConfig!.sunRadius / defaultConfig.baseRadius;
      expect(sunMesh!.scale.x).toBeCloseTo(expectedScale, 2);
    });

    test('should show large sun in SOLAR_SYSTEM scale', () => {
      sunManager.updateForScale(ScaleContext.SOLAR_SYSTEM);
      
      const state = sunManager.getCurrentState();
      const scaleConfig = sunManager.getScaleConfig(ScaleContext.SOLAR_SYSTEM);
      
      expect(state.isVisible).toBe(true);
      expect(state.currentScale).toBe(ScaleContext.SOLAR_SYSTEM);
      expect(state.currentRadius).toBe(scaleConfig!.sunRadius);
      expect(state.currentPosition.x).toBe(scaleConfig!.sunDistance);
    });

    test('should update corona position and scale with sun', () => {
      sunManager.updateForScale(ScaleContext.INNER_SOLAR);
      
      const sunMesh = sunManager.getSunMesh();
      const coronaMesh = sunManager.getCoronaMesh();
      const scaleConfig = sunManager.getScaleConfig(ScaleContext.INNER_SOLAR);
      
      expect(coronaMesh!.visible).toBe(true);
      expect(coronaMesh!.position.x).toBe(scaleConfig!.sunDistance);
      expect(coronaMesh!.scale.x).toBe(sunMesh!.scale.x);
    });

    test('should update lighting intensity and position', () => {
      sunManager.updateForScale(ScaleContext.SOLAR_SYSTEM);
      
      const sunLight = sunManager.getSunLight();
      const scaleConfig = sunManager.getScaleConfig(ScaleContext.SOLAR_SYSTEM);
      
      expect(sunLight!.intensity).toBe(scaleConfig!.lightIntensity);
      expect(sunLight!.position.x).toBe(scaleConfig!.sunDistance);
    });

    test('should handle invalid scale context gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      sunManager.updateForScale('invalid-context' as ScaleContext);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'No configuration found for scale context: invalid-context'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    test('should track visibility changes', () => {
      // Initially hidden
      expect(sunManager.isVisible()).toBe(false);
      
      // Show sun
      sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      expect(sunManager.isVisible()).toBe(true);
      
      // Hide sun
      sunManager.updateForScale(ScaleContext.EARTH_LOCAL);
      expect(sunManager.isVisible()).toBe(false);
    });

    test('should call state change callback on visibility change', () => {
      sunManager.onStateChange(mockStateChangeCallback);
      
      // Change from hidden to visible
      sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      
      expect(mockStateChangeCallback).toHaveBeenCalledTimes(1);
      const calledState = mockStateChangeCallback.mock.calls[0][0] as SunState;
      expect(calledState.isVisible).toBe(true);
      expect(calledState.currentScale).toBe(ScaleContext.EARTH_SPACE);
    });

    test('should not call callback when visibility unchanged', () => {
      sunManager.onStateChange(mockStateChangeCallback);
      sunManager.updateForScale(ScaleContext.EARTH_SPACE); // Show sun
      
      vi.clearAllMocks();
      
      // Change scale but keep visible
      sunManager.updateForScale(ScaleContext.INNER_SOLAR);
      
      expect(mockStateChangeCallback).not.toHaveBeenCalled();
    });

    test('should provide immutable state copy', () => {
      const state1 = sunManager.getCurrentState();
      const state2 = sunManager.getCurrentState();
      
      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2);   // Same content
      
      // Modifying returned state should not affect internal state
      state1.isVisible = true;
      expect(sunManager.getCurrentState().isVisible).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    test('should get scale configuration for each context', () => {
      const earthLocalConfig = sunManager.getScaleConfig(ScaleContext.EARTH_LOCAL);
      const earthSpaceConfig = sunManager.getScaleConfig(ScaleContext.EARTH_SPACE);
      
      expect(earthLocalConfig).toBeDefined();
      expect(earthLocalConfig!.sunVisible).toBe(false);
      expect(earthSpaceConfig).toBeDefined();
      expect(earthSpaceConfig!.sunVisible).toBe(true);
    });

    test('should return undefined for invalid context', () => {
      const config = sunManager.getScaleConfig('invalid' as ScaleContext);
      expect(config).toBeUndefined();
    });

    test('should update configuration and recreate sun', () => {
      const originalSunMesh = sunManager.getSunMesh();
      
      sunManager.updateConfig({ baseRadius: 200, lightColor: 0xff0000 });
      
      const newSunMesh = sunManager.getSunMesh();
      expect(newSunMesh).not.toBe(originalSunMesh); // New mesh created
      expect(newSunMesh).toBeDefined();
    });

    test('should preserve current scale after config update', () => {
      sunManager.updateForScale(ScaleContext.INNER_SOLAR);
      const stateBefore = sunManager.getCurrentState();
      
      sunManager.updateConfig({ coronaIntensity: 0.8 });
      
      const stateAfter = sunManager.getCurrentState();
      expect(stateAfter.currentScale).toBe(stateBefore.currentScale);
      expect(stateAfter.isVisible).toBe(stateBefore.isVisible);
    });
  });

  describe('Multiple Scale Transitions', () => {
    test('should handle rapid scale changes', () => {
      const scales = [
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        ScaleContext.INNER_SOLAR,
        ScaleContext.SOLAR_SYSTEM,
        ScaleContext.EARTH_LOCAL
      ];

      scales.forEach(scale => {
        sunManager.updateForScale(scale);
        const state = sunManager.getCurrentState();
        expect(state.currentScale).toBe(scale);
      });
    });

    test('should maintain consistent state across transitions', () => {
      // Transition through all scales
      sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      const earthSpaceState = sunManager.getCurrentState();
      
      sunManager.updateForScale(ScaleContext.INNER_SOLAR);
      sunManager.updateForScale(ScaleContext.SOLAR_SYSTEM);
      
      // Return to earth space
      sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      const returnState = sunManager.getCurrentState();
      
      expect(returnState.isVisible).toBe(earthSpaceState.isVisible);
      expect(returnState.currentScale).toBe(earthSpaceState.currentScale);
    });
  });

  describe('Error Handling', () => {
    test('should handle operations after disposal', () => {
      sunManager.dispose();
      
      // Should not throw errors
      sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      const state = sunManager.getCurrentState();
      
      // State should remain unchanged
      expect(state.currentScale).toBe(ScaleContext.EARTH_LOCAL);
    });

    test('should handle missing scene gracefully', () => {
      // This tests internal robustness - sun manager should handle
      // edge cases where scene operations might fail
      expect(() => {
        sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      }).not.toThrow();
    });
  });

  describe('Resource Management', () => {
    test('should dispose all resources properly', () => {
      sunManager.updateForScale(ScaleContext.EARTH_SPACE); // Ensure sun is created
      
      const sunMesh = sunManager.getSunMesh();
      const coronaMesh = sunManager.getCoronaMesh();
      const sunLight = sunManager.getSunLight();
      
      expect(scene.children).toContain(sunMesh);
      expect(scene.children).toContain(coronaMesh);
      expect(scene.children).toContain(sunLight);
      
      sunManager.dispose();
      
      expect(sunManager.getSunMesh()).toBeNull();
      expect(sunManager.getCoronaMesh()).toBeNull();
      expect(sunManager.getSunLight()).toBeNull();
      expect(scene.children).not.toContain(sunMesh);
      expect(scene.children).not.toContain(coronaMesh);
      expect(scene.children).not.toContain(sunLight);
    });

    test('should handle multiple dispose calls', () => {
      sunManager.dispose();
      sunManager.dispose(); // Should not throw
      
      expect(sunManager.getSunMesh()).toBeNull();
    });

    test('should clean up callback references', () => {
      sunManager.onStateChange(mockStateChangeCallback);
      sunManager.dispose();
      
      // Callback should not be called after disposal
      sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      expect(mockStateChangeCallback).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('should work with multiple sun managers in same scene', () => {
      const sunManager2 = new SolarSunManager(scene, { baseRadius: 50 });
      
      sunManager.updateForScale(ScaleContext.EARTH_SPACE);
      sunManager2.updateForScale(ScaleContext.INNER_SOLAR);
      
      expect(sunManager.isVisible()).toBe(true);
      expect(sunManager2.isVisible()).toBe(true);
      expect(scene.children.length).toBeGreaterThan(6); // Multiple meshes and lights
      
      sunManager2.dispose();
    });

    test('should maintain performance with frequent updates', () => {
      const startTime = performance.now();
      
      // Simulate frequent scale changes
      for (let i = 0; i < 100; i++) {
        const scale = i % 2 === 0 ? ScaleContext.EARTH_SPACE : ScaleContext.INNER_SOLAR;
        sunManager.updateForScale(scale);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (100ms is generous)
      expect(duration).toBeLessThan(100);
    });
  });
});
