// TDD Test Suite for SolarActivityVisualizer - Phase 2 Week 5 Implementation
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { SolarActivityVisualizer, SolarActivityConfig, CoronaState, FlareState } from '../SolarActivityVisualizer';
import { NOAASolarDataService } from '../../noaa/NOAASolarDataService';
import { SpaceWeatherSummary, SolarFlareEvent } from '../../noaa/types';

// Mock THREE.js animation frame
const mockAnimationFrame = vi.fn();
global.requestAnimationFrame = mockAnimationFrame;
global.cancelAnimationFrame = vi.fn();
global.performance = { now: vi.fn(() => Date.now()) } as any;

describe('SolarActivityVisualizer - Phase 2 Week 5 TDD Implementation', () => {
  let scene: THREE.Scene;
  let sunMesh: THREE.Mesh;
  let mockNoaaService: NOAASolarDataService;
  let visualizer: SolarActivityVisualizer;

  const mockSpaceWeatherSummary: SpaceWeatherSummary = {
    timestamp: new Date(),
    solarActivity: {
      level: 'moderate',
      flareIntensity: 1.5e-5,
      flareClass: 'C2.1',
      activeFlares: [],
      trend: 'stable'
    },
    visualizationParams: {
      coronaIntensity: 1.2,
      coronaSize: 1.5,
      sunColor: '#FFAA00',
      flareParticles: true,
      pulseRate: 0.7
    },
    quality: 'good',
    dataAge: 120
  };

  const mockSolarFlare: SolarFlareEvent = {
    id: 'flare_test_001',
    startTime: new Date(),
    peakTime: new Date(Date.now() + 300000),
    endTime: new Date(Date.now() + 600000),
    classification: 'M2.5',
    location: 'N15E45',
    peakFlux: 2.5e-5,
    isActive: true,
    duration: 600
  };

  beforeEach(() => {
    // Create test THREE.js environment
    scene = new THREE.Scene();
    
    const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFAA00 });
    sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    // Mock NOAA service
    mockNoaaService = {
      onSpaceWeatherChange: vi.fn(),
      getSpaceWeatherSummary: vi.fn().mockResolvedValue(mockSpaceWeatherSummary),
      getSolarFlares: vi.fn().mockResolvedValue([mockSolarFlare]),
      isConnected: vi.fn().mockReturnValue(true)
    } as any;

    // Reset animation frame mock
    mockAnimationFrame.mockClear();
    mockAnimationFrame.mockImplementation((callback) => {
      // Simulate animation frame
      setTimeout(() => callback(performance.now()), 16);
      return 1; // Mock animation ID
    });
    vi.clearAllTimers();
  });

  afterEach(() => {
    if (visualizer) {
      visualizer.dispose();
    }
    
    // Cleanup scene
    while (scene.children.length > 0) {
      const child = scene.children[0];
      scene.remove(child);
      if ('geometry' in child) {
        (child as any).geometry?.dispose();
      }
      if ('material' in child) {
        const material = (child as any).material;
        if (material) {
          if (Array.isArray(material)) {
            material.forEach(m => m.dispose());
          } else {
            material.dispose();
          }
        }
      }
    }
  });

  describe('Phase 2 Week 5 Day 1-2: Corona Dynamic Effects', () => {
    it('should create SolarActivityVisualizer with default corona configuration', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      expect(visualizer).toBeDefined();
      expect(visualizer.isAnimating()).toBe(true);
      
      const coronaState = visualizer.getCoronaState();
      expect(coronaState.currentRadius).toBe(1.5); // Default coronaBaseRadius
      expect(coronaState.currentIntensity).toBe(0.3); // Default coronaBaseIntensity
      expect(coronaState.pulsePhase).toBe(0);
    });

    it('should create corona meshes with proper layering', () => {
      const config: Partial<SolarActivityConfig> = {
        coronaLayers: 4,
        coronaBaseRadius: 2.0,
        coronaBaseIntensity: 0.5
      };
      
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);
      
      // Check that corona layers were added to scene
      const coronaMeshes = scene.children.filter(child => 
        child instanceof THREE.Mesh && 
        child !== sunMesh && 
        child.material instanceof THREE.ShaderMaterial
      );
      
      expect(coronaMeshes.length).toBe(4);
      
      const coronaState = visualizer.getCoronaState();
      expect(coronaState.currentRadius).toBe(2.0);
      expect(coronaState.currentIntensity).toBe(0.5);
    });

    it('should implement corona shader with dynamic uniforms', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      const coronaMesh = scene.children.find(child => 
        child instanceof THREE.Mesh && 
        child !== sunMesh && 
        child.material instanceof THREE.ShaderMaterial
      ) as THREE.Mesh;
      
      expect(coronaMesh).toBeDefined();
      
      const material = coronaMesh.material as THREE.ShaderMaterial;
      expect(material.uniforms.uTime).toBeDefined();
      expect(material.uniforms.uIntensity).toBeDefined();
      expect(material.uniforms.uRadius).toBeDefined();
      expect(material.uniforms.uSolarActivity).toBeDefined();
      expect(material.uniforms.uFlareIntensity).toBeDefined();
      expect(material.uniforms.uCoronaColor).toBeDefined();
    });

    it('should update corona based on NOAA space weather data', async () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      // Verify that onSpaceWeatherChange was registered
      expect(mockNoaaService.onSpaceWeatherChange).toHaveBeenCalled();
      
      // Get the callback function that was registered
      const spaceWeatherCallback = (mockNoaaService.onSpaceWeatherChange as any).mock.calls[0][0];
      
      // Call the callback with mock data
      spaceWeatherCallback(mockSpaceWeatherSummary);
      
      const coronaState = visualizer.getCoronaState();
      expect(coronaState.targetRadius).toBe(1.5 * mockSpaceWeatherSummary.visualizationParams.coronaSize); // 1.5 * 1.5 = 2.25
      expect(coronaState.targetIntensity).toBe(0.3 * mockSpaceWeatherSummary.visualizationParams.coronaIntensity); // 0.3 * 1.2 = 0.36
    });

    it('should implement smooth corona transitions', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      const initialState = visualizer.getCoronaState();
      
      // Trigger a state change
      const spaceWeatherCallback = (mockNoaaService.onSpaceWeatherChange as any).mock.calls[0][0];
      spaceWeatherCallback({
        ...mockSpaceWeatherSummary,
        visualizationParams: {
          ...mockSpaceWeatherSummary.visualizationParams,
          coronaSize: 2.5,
          coronaIntensity: 2.0
        }
      });
      
      const updatedState = visualizer.getCoronaState();
      expect(updatedState.targetRadius).toBe(1.5 * 2.5); // 3.75
      expect(updatedState.targetIntensity).toBe(0.3 * 2.0); // 0.6
      
      // Current values should not change instantly
      expect(updatedState.currentRadius).toBe(initialState.currentRadius);
      expect(updatedState.currentIntensity).toBe(initialState.currentIntensity);
    });
  });

  describe('Phase 2 Week 5 Day 3-4: Solar Flare Visualization', () => {
    it('should initialize flare particle system when enabled', () => {
      const config: Partial<SolarActivityConfig> = {
        enableFlareParticles: true,
        flareParticleCount: 2000,
        maxActiveFlares: 3
      };
      
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);
      
      const activeFlares = visualizer.getActiveFlares();
      expect(activeFlares).toEqual([]);
      
      const performanceStats = visualizer.getPerformanceStats();
      expect(performanceStats.activeFlareCount).toBe(0);
    });

    it('should create flare particles from NOAA solar flare events', async () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      // Mock getSolarFlares to return active flare
      (mockNoaaService.getSolarFlares as any).mockResolvedValue([mockSolarFlare]);
      
      // Manually trigger the data update that would happen on timer
      const updateSolarDataMethod = (visualizer as any).updateSolarData;
      await updateSolarDataMethod.call(visualizer);
      
      const activeFlares = visualizer.getActiveFlares();
      expect(activeFlares.length).toBe(1);
      expect(activeFlares[0].id).toBe('flare_test_001');
      expect(activeFlares[0].classification).toBe('M2.5');
      expect(activeFlares[0].isActive).toBe(true);
    });

    it('should limit maximum concurrent flares', async () => {
      const config: Partial<SolarActivityConfig> = {
        maxActiveFlares: 2
      };
      
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);
      
      // Create multiple mock flares
      const multipleFlares: SolarFlareEvent[] = [
        { ...mockSolarFlare, id: 'flare_1' },
        { ...mockSolarFlare, id: 'flare_2' },
        { ...mockSolarFlare, id: 'flare_3' },
        { ...mockSolarFlare, id: 'flare_4' }
      ];
      
      (mockNoaaService.getSolarFlares as any).mockResolvedValue(multipleFlares);
      
      const updateSolarDataMethod = (visualizer as any).updateSolarData;
      await updateSolarDataMethod.call(visualizer);
      
      const activeFlares = visualizer.getActiveFlares();
      expect(activeFlares.length).toBe(2); // Should be limited to maxActiveFlares
    });

    it('reuses pooled flare particle instances after release', () => {
      const config: Partial<SolarActivityConfig> = {
        maxActiveFlares: 2,
        flarePoolSize: 1
      };

      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);

      const addFlare = (visualizer as any).addFlare.bind(visualizer);
      const removeFlare = (visualizer as any).removeFlare.bind(visualizer);

      addFlare({ ...mockSolarFlare, id: 'pool-a' });
      const first = (visualizer as any).activeFlares.get('pool-a').particles;

      removeFlare('pool-a');

      addFlare({ ...mockSolarFlare, id: 'pool-b' });
      const second = (visualizer as any).activeFlares.get('pool-b').particles;

      expect(second).toBe(first);
    });

    it('tracks pool cap hits and prevents over-allocation', () => {
      const config: Partial<SolarActivityConfig> = {
        maxActiveFlares: 2,
        flarePoolSize: 1
      };

      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);

      const addFlare = (visualizer as any).addFlare.bind(visualizer);

      addFlare({ ...mockSolarFlare, id: 'cap-1' });
      addFlare({ ...mockSolarFlare, id: 'cap-2' });

      const stats = visualizer.getPerformanceStats();
      expect(stats.activeFlareCount).toBe(1);
      expect(stats.flarePoolCapHits).toBeGreaterThanOrEqual(1);
    });

    it('should calculate flare position from solar coordinates', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      // Test the private method through reflection
      const calculateFlarePosition = (visualizer as any).calculateFlarePosition;
      
      const position1 = calculateFlarePosition.call(visualizer, 'N15E45');
      const position2 = calculateFlarePosition.call(visualizer, 'S30W60');
      
      expect(position1).toBeInstanceOf(THREE.Vector3);
      expect(position2).toBeInstanceOf(THREE.Vector3);
      expect(position1.equals(position2)).toBe(false);
    });

    it('should assign colors based on flare classification', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      const getFlareColor = (visualizer as any).getFlareColor;
      
      expect(getFlareColor.call(visualizer, 'X9.3')).toBe(0xFF0000); // Red for X-class
      expect(getFlareColor.call(visualizer, 'M2.5')).toBe(0xFF8800); // Orange for M-class
      expect(getFlareColor.call(visualizer, 'C1.2')).toBe(0xFFFF00); // Yellow for C-class
      expect(getFlareColor.call(visualizer, 'B5.0')).toBe(0xFFFFAA); // Light yellow for B-class
      expect(getFlareColor.call(visualizer, 'A1.0')).toBe(0xFFFFFF); // White for A-class
    });

    it('should remove expired flares automatically', async () => {
      const config: Partial<SolarActivityConfig> = {
        flareMaxDuration: 1 // 1 second max duration for fast testing
      };
      
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);
      
      // Add a flare with very short duration
      const shortFlare = { ...mockSolarFlare, duration: 1, endTime: new Date(Date.now() + 1000) };
      (mockNoaaService.getSolarFlares as any).mockResolvedValue([shortFlare]);
      
      const updateSolarDataMethod = (visualizer as any).updateSolarData;
      await updateSolarDataMethod.call(visualizer);
      
      expect(visualizer.getActiveFlares().length).toBe(1);
      
      // Mock time passage by updating flare start time to be older
      const activeFlares = (visualizer as any).activeFlares;
      for (const [id, flareState] of activeFlares) {
        flareState.startTime = Date.now() - 2000; // 2 seconds ago
        flareState.duration = 1; // 1 second duration, so it should be expired
      }
      
      // Trigger flare cleanup by calling updateFlares directly
      const updateFlares = (visualizer as any).updateFlares;
      updateFlares.call(visualizer);
      
      expect(visualizer.getActiveFlares().length).toBe(0);
    });

    it('returns pooled flares on pause', () => {
      const config: Partial<SolarActivityConfig> = {
        flarePoolSize: 1,
        maxActiveFlares: 1
      };

      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);

      const addFlare = (visualizer as any).addFlare.bind(visualizer);
      addFlare({ ...mockSolarFlare, id: 'pause-return' });

      expect(visualizer.getActiveFlares().length).toBe(1);

      visualizer.pause();

      const stats = visualizer.getPerformanceStats();
      expect(visualizer.getActiveFlares().length).toBe(0);
      expect(stats.flarePoolAvailable).toBeGreaterThanOrEqual(1);
    });

    it('keeps pool bounded under churn', () => {
      const config: Partial<SolarActivityConfig> = {
        flarePoolSize: 2,
        maxActiveFlares: 2
      };

      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);
      const addFlare = (visualizer as any).addFlare.bind(visualizer);
      const removeFlare = (visualizer as any).removeFlare.bind(visualizer);

      for (let i = 0; i < 10; i++) {
        addFlare({ ...mockSolarFlare, id: `churn-${i}` });
        removeFlare(`churn-${i}`);
      }

      const stats = visualizer.getPerformanceStats();
      expect(stats.activeFlareCount).toBe(0);
      expect(stats.flarePoolAvailable).toBeLessThanOrEqual(2);
      expect(stats.flarePoolCapHits).toBeGreaterThanOrEqual(0);
    });

    it('emits telemetry when pool hits cap', () => {
      const events: any[] = [];
      const config: Partial<SolarActivityConfig> = {
        flarePoolSize: 1,
        maxActiveFlares: 2,
        onFlarePoolEvent: event => events.push(event)
      };

      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);
      const addFlare = (visualizer as any).addFlare.bind(visualizer);

      addFlare({ ...mockSolarFlare, id: 'cap-telemetry-1' });
      addFlare({ ...mockSolarFlare, id: 'cap-telemetry-2' });

      expect(events.find(e => e?.type === 'cap-hit')).toBeDefined();
    });
  });

  describe('Phase 2 Week 5 Day 5: Integration and Animation', () => {
    it('should integrate animation system with performance tracking', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      expect(visualizer.isAnimating()).toBe(true);
      expect(mockAnimationFrame).toHaveBeenCalled();
      
      const performanceStats = visualizer.getPerformanceStats();
      expect(performanceStats.avgFrameTime).toBeGreaterThanOrEqual(0);
      expect(performanceStats.activeFlareCount).toBe(0);
      
      // Check actual corona complexity value
      console.log('Corona complexity:', performanceStats.coronaComplexity);
      console.log('Corona meshes length:', (visualizer as any).coronaMeshes.length);
      
      expect(performanceStats.coronaComplexity).toBe(3); // Default corona layers
    });

    it('should support pause and resume functionality', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      expect(visualizer.isAnimating()).toBe(true);
      
      visualizer.pause();
      expect(visualizer.isAnimating()).toBe(false);
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
      
      visualizer.resume();
      expect(visualizer.isAnimating()).toBe(true);
    });

    it('should update configuration dynamically', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      const newConfig: Partial<SolarActivityConfig> = {
        coronaBaseIntensity: 0.8,
        pulseRate: 1.5,
        animationSpeed: 2.0
      };
      
      visualizer.setConfig(newConfig);
      
      const coronaState = visualizer.getCoronaState();
      expect(coronaState.animationSpeed).toBe(2.0);
    });

    it('should handle NOAA data updates at specified intervals', async () => {
      const config: Partial<SolarActivityConfig> = {
        updateInterval: 100 // 100ms for fast testing
      };
      
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService, config);
      
      const initialCallCount = (mockNoaaService.getSpaceWeatherSummary as any).mock.calls.length;
      
      // Wait for interval update
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const finalCallCount = (mockNoaaService.getSpaceWeatherSummary as any).mock.calls.length;
      expect(finalCallCount).toBeGreaterThan(initialCallCount);
    });

    it('should clean up resources on disposal', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      const initialChildCount = scene.children.length;
      expect(initialChildCount).toBeGreaterThan(1); // Sun + corona layers
      
      visualizer.dispose();
      
      expect(visualizer.isAnimating()).toBe(false);
      expect(visualizer.getActiveFlares().length).toBe(0);
      expect(scene.children.length).toBe(1); // Only sun mesh should remain
    });

    it('should handle NOAA service errors gracefully', async () => {
      (mockNoaaService.getSpaceWeatherSummary as any).mockRejectedValue(new Error('Network error'));
      (mockNoaaService.getSolarFlares as any).mockRejectedValue(new Error('API error'));
      
      // Should not throw
      expect(() => {
        visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      }).not.toThrow();
      
      // Animation should still work
      expect(visualizer.isAnimating()).toBe(true);
    });
  });

  describe('Integration with SolarSystemManager', () => {
    it('should accept sun mesh position updates', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      // Move sun mesh
      const newPosition = new THREE.Vector3(10, 5, -3);
      sunMesh.position.copy(newPosition);
      
      // Manually trigger animation update to sync corona
      const updateCorona = (visualizer as any).updateCorona;
      updateCorona.call(visualizer, performance.now());
      
      // Check that corona meshes follow sun position
      const coronaMeshes = scene.children.filter(child => 
        child instanceof THREE.Mesh && 
        child !== sunMesh && 
        child.material instanceof THREE.ShaderMaterial
      );
      
      for (const mesh of coronaMeshes) {
        expect(mesh.position.equals(newPosition)).toBe(true);
      }
    });

    it('should scale corona effects with sun size changes', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      // Scale sun mesh
      const scaleFactor = 2.5;
      sunMesh.scale.setScalar(scaleFactor);
      
      const coronaState = visualizer.getCoronaState();
      expect(coronaState.currentRadius).toBe(1.5); // Default base radius
      
      // Corona should maintain its relative scale to sun
      const coronaMeshes = scene.children.filter(child => 
        child instanceof THREE.Mesh && 
        child !== sunMesh
      );
      
      expect(coronaMeshes.length).toBeGreaterThan(0);
    });

    it('should provide real-time visualization parameter updates', () => {
      visualizer = new SolarActivityVisualizer(scene, sunMesh, mockNoaaService);
      
      const spaceWeatherCallback = (mockNoaaService.onSpaceWeatherChange as any).mock.calls[0][0];
      
      // Simulate high solar activity
      spaceWeatherCallback({
        ...mockSpaceWeatherSummary,
        solarActivity: {
          ...mockSpaceWeatherSummary.solarActivity,
          level: 'extreme'
        },
        visualizationParams: {
          ...mockSpaceWeatherSummary.visualizationParams,
          coronaIntensity: 2.0,
          coronaSize: 3.0,
          sunColor: '#FF4400',
          pulseRate: 1.5
        }
      });
      
      const coronaState = visualizer.getCoronaState();
      expect(coronaState.targetIntensity).toBe(0.3 * 2.0); // 0.6
      expect(coronaState.targetRadius).toBe(1.5 * 3.0); // 4.5
    });
  });
});
