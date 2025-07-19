import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { CMEVisualizer } from '../CMEVisualizer';

// Mock THREE.js for testing
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn()
  })),
  Mesh: vi.fn(() => ({
    position: { copy: vi.fn(), set: vi.fn() },
    scale: { setScalar: vi.fn(), set: vi.fn() },
    lookAt: vi.fn(),
    material: {
      uniforms: {
        uTime: { value: 0 },
        uShockRadius: { value: 0 },
        uIntensity: { value: 0 },
        uDirection: { value: new THREE.Vector3() }
      },
      dispose: vi.fn()
    },
    geometry: {
      dispose: vi.fn()
    }
  })),
  SphereGeometry: vi.fn(() => ({
    dispose: vi.fn()
  })),
  ShaderMaterial: vi.fn(() => ({
    uniforms: {
      uTime: { value: 0 },
      uShockRadius: { value: 0 },
      uIntensity: { value: 0 },
      uDirection: { value: new THREE.Vector3() },
      uCMESpeed: { value: 0 },
      uCMEDensity: { value: 0 }
    },
    dispose: vi.fn()
  })),
  Vector3: vi.fn(() => ({
    x: 0, y: 0, z: 0,
    set: vi.fn(),
    copy: vi.fn(),
    clone: vi.fn(function() { return { x: this.x, y: this.y, z: this.z, normalize: vi.fn().mockReturnThis(), multiplyScalar: vi.fn().mockReturnThis(), clone: vi.fn(), dot: vi.fn(() => 0.5) }; }),
    normalize: vi.fn().mockReturnThis(),
    multiplyScalar: vi.fn().mockReturnThis(),
    add: vi.fn(),
    distanceTo: vi.fn(() => 100),
    length: vi.fn(() => 1),
    dot: vi.fn(() => 0.5)
  })),
  Color: vi.fn(() => ({
    setHex: vi.fn(),
    r: 1, g: 1, b: 1
  })),
  AdditiveBlending: 2,
  DoubleSide: 2
}));

// Mock performance and requestAnimationFrame
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  }
});

global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('CMEVisualizer - Phase 2 Week 6 Day 3-4 TDD Implementation', () => {
  let cmeVisualizer: CMEVisualizer;
  let mockScene: THREE.Scene;
  let mockSunMesh: THREE.Mesh;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockScene = new THREE.Scene();
    mockSunMesh = new THREE.Mesh();
    
    Object.defineProperty(mockSunMesh, 'position', {
      value: { x: 0, y: 0, z: 0, copy: vi.fn(), set: vi.fn() },
      writable: true
    });
    Object.defineProperty(mockSunMesh, 'scale', {
      value: { x: 1, y: 1, z: 1 },
      writable: true
    });
  });

  afterEach(() => {
    if (cmeVisualizer) {
      cmeVisualizer.dispose();
    }
  });

  describe('Phase 2 Week 6 Day 3-4: Coronal Mass Ejection Effects', () => {
    describe('CME Detection and Setup', () => {
      it('should create CMEVisualizer with default configuration', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        expect(cmeVisualizer).toBeDefined();
        expect(cmeVisualizer.getConfig()).toEqual(
          expect.objectContaining({
            maxConcurrentCMEs: expect.any(Number),
            shockWaveRadius: expect.any(Number),
            expansionSpeed: expect.any(Number),
            shockDuration: expect.any(Number),
            cmeThreshold: expect.any(Number),
            enableEarthImpactPrediction: expect.any(Boolean)
          })
        );
      });

      it('should detect CME events from NOAA data', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        const noaaData = {
          xrayFlux: 5.2e-4,  // X-class flare
          flareLocation: { lat: 15, lon: -30 },
          timestamp: Date.now(),
          classification: 'X5.2'
        };
        
        const cmeDetected = cmeVisualizer.processSolarFlareData(noaaData);
        expect(cmeDetected).toBe(true);
        
        const activeCMEs = cmeVisualizer.getActiveCMEs();
        expect(activeCMEs).toHaveLength(1);
        expect(activeCMEs[0]).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            launchTime: expect.any(Number),
            direction: expect.any(Object),
            speed: expect.any(Number),
            intensity: expect.any(Number)
          })
        );
      });

      it('should create CME only for significant solar events', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        // Weak C-class flare should not trigger CME
        const weakFlare = {
          xrayFlux: 1.5e-6,  // C1.5 flare
          flareLocation: { lat: 0, lon: 0 },
          timestamp: Date.now(),
          classification: 'C1.5'
        };
        
        const cmeDetected = cmeVisualizer.processSolarFlareData(weakFlare);
        expect(cmeDetected).toBe(false);
        expect(cmeVisualizer.getActiveCMEs()).toHaveLength(0);
      });

      it('should limit maximum concurrent CMEs', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh, {
          maxConcurrentCMEs: 2
        });
        
        // Create multiple strong flares
        for (let i = 0; i < 5; i++) {
          const flareData = {
            xrayFlux: 8.0e-4,  // X8.0 flare
            flareLocation: { lat: i * 10, lon: i * 15 },
            timestamp: Date.now() + i * 1000,
            classification: 'X8.0'
          };
          cmeVisualizer.processSolarFlareData(flareData);
        }
        
        expect(cmeVisualizer.getActiveCMEs()).toHaveLength(2);
      });
    });

    describe('Shock Wave Visualization', () => {
      it('should create dramatic shock wave effects', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        // Trigger CME
        const flareData = {
          xrayFlux: 9.0e-4,
          flareLocation: { lat: 20, lon: -45 },
          timestamp: Date.now(),
          classification: 'X9.0'
        };
        
        cmeVisualizer.processSolarFlareData(flareData);
        
        const shockWaves = cmeVisualizer.getShockWaveEffects();
        expect(shockWaves).toHaveLength(1);
        
        const shockWave = shockWaves[0];
        expect(shockWave.geometry).toBeDefined();
        expect(shockWave.material.uniforms.uShockRadius.value).toBeGreaterThan(0);
        expect(mockScene.add).toHaveBeenCalledWith(shockWave);
      });

      it('should expand shock wave over time', async () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        // Create CME
        const flareData = {
          xrayFlux: 6.0e-4,
          flareLocation: { lat: 0, lon: 0 },
          timestamp: Date.now(),
          classification: 'X6.0'
        };
        
        cmeVisualizer.processSolarFlareData(flareData);
        
        const initialRadius = cmeVisualizer.getShockWaveEffects()[0].material.uniforms.uShockRadius.value;
        
        // Start animation and let it run
        cmeVisualizer.startAnimation();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const updatedRadius = cmeVisualizer.getShockWaveEffects()[0].material.uniforms.uShockRadius.value;
        expect(updatedRadius).toBeGreaterThan(initialRadius);
      });

      it('should remove shock waves after duration expires', async () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh, {
          shockDuration: 100  // Short duration for testing
        });
        
        const flareData = {
          xrayFlux: 7.0e-4,
          flareLocation: { lat: 10, lon: 20 },
          timestamp: Date.now(),
          classification: 'X7.0'
        };
        
        cmeVisualizer.processSolarFlareData(flareData);
        expect(cmeVisualizer.getShockWaveEffects()).toHaveLength(1);
        
        // Wait for shock to expire
        await new Promise(resolve => setTimeout(resolve, 150));
        cmeVisualizer.updateEffects(150);
        
        expect(cmeVisualizer.getShockWaveEffects()).toHaveLength(0);
      });
    });

    describe('Directional CME Visualization', () => {
      it('should calculate CME direction from flare location', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        const flareData = {
          xrayFlux: 4.0e-4,
          flareLocation: { lat: 30, lon: 45 },  // Northeast on sun
          timestamp: Date.now(),
          classification: 'X4.0'
        };
        
        cmeVisualizer.processSolarFlareData(flareData);
        
        const cmes = cmeVisualizer.getActiveCMEs();
        const cme = cmes[0];
        
        // Direction should be roughly northeast
        expect(cme.direction.x).toBeGreaterThan(0);
        expect(cme.direction.y).toBeGreaterThan(0);
        expect(Math.abs(cme.direction.length - 1)).toBeLessThan(0.1); // Should be normalized
      });

      it('should visualize CME cone expansion', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        const flareData = {
          xrayFlux: 5.5e-4,
          flareLocation: { lat: -20, lon: 60 },
          timestamp: Date.now(),
          classification: 'X5.5'
        };
        
        cmeVisualizer.processSolarFlareData(flareData);
        
        const coneEffects = cmeVisualizer.getCMEConeEffects();
        expect(coneEffects).toHaveLength(1);
        
        const cone = coneEffects[0];
        expect(cone.geometry).toBeDefined();
        expect(cone.material.uniforms.uDirection.value).toBeDefined();
      });

      it('should vary CME intensity based on flare strength', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        // Weak X-class flare
        const weakFlare = {
          xrayFlux: 1.2e-4,
          flareLocation: { lat: 0, lon: 0 },
          timestamp: Date.now(),
          classification: 'X1.2'
        };
        
        cmeVisualizer.processSolarFlareData(weakFlare);
        const weakCME = cmeVisualizer.getActiveCMEs()[0];
        
        // Strong X-class flare
        const strongFlare = {
          xrayFlux: 9.8e-4,
          flareLocation: { lat: 0, lon: 0 },
          timestamp: Date.now() + 1000,
          classification: 'X9.8'
        };
        
        cmeVisualizer.processSolarFlareData(strongFlare);
        const strongCME = cmeVisualizer.getActiveCMEs()[1];
        
        expect(strongCME.intensity).toBeGreaterThan(weakCME.intensity);
        expect(strongCME.speed).toBeGreaterThan(weakCME.speed);
      });
    });

    describe('Earth Impact Predictions', () => {
      it('should predict Earth-directed CMEs', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh, {
          enableEarthImpactPrediction: true
        });
        
        // Earth-facing flare (center of visible disk)
        const earthDirectedFlare = {
          xrayFlux: 6.5e-4,
          flareLocation: { lat: 0, lon: 0 },
          timestamp: Date.now(),
          classification: 'X6.5'
        };
        
        cmeVisualizer.processSolarFlareData(earthDirectedFlare);
        
        const predictions = cmeVisualizer.getEarthImpactPredictions();
        expect(predictions).toHaveLength(1);
        
        const prediction = predictions[0];
        expect(prediction).toEqual(
          expect.objectContaining({
            cmeId: expect.any(String),
            impactProbability: expect.any(Number),
            estimatedArrivalTime: expect.any(Number),
            impactIntensity: expect.any(String)
          })
        );
        
        expect(prediction.impactProbability).toBeGreaterThan(0.7); // High probability for center disk
      });

      it('should calculate arrival time based on CME speed', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh, {
          enableEarthImpactPrediction: true
        });
        
        const fastFlare = {
          xrayFlux: 8.0e-4,  // Very strong flare = faster CME
          flareLocation: { lat: 5, lon: -10 },
          timestamp: Date.now(),
          classification: 'X8.0'
        };
        
        cmeVisualizer.processSolarFlareData(fastFlare);
        
        const predictions = cmeVisualizer.getEarthImpactPredictions();
        const prediction = predictions[0];
        
        // Arrival time should be within reasonable range (1-4 days)
        const arrivalDelay = prediction.estimatedArrivalTime - fastFlare.timestamp;
        const hoursDelay = arrivalDelay / (1000 * 60 * 60);
        
        expect(hoursDelay).toBeGreaterThan(24);  // At least 1 day
        expect(hoursDelay).toBeLessThan(96);     // Less than 4 days
      });

      it('should classify impact intensity levels', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh, {
          enableEarthImpactPrediction: true
        });
        
        // Minor event
        const minorFlare = {
          xrayFlux: 1.5e-4,
          flareLocation: { lat: 0, lon: 0 },
          timestamp: Date.now(),
          classification: 'X1.5'
        };
        
        cmeVisualizer.processSolarFlareData(minorFlare);
        let prediction = cmeVisualizer.getEarthImpactPredictions()[0];
        expect(['minor', 'moderate']).toContain(prediction.impactIntensity);
        
        // Major event
        const majorFlare = {
          xrayFlux: 9.0e-4,
          flareLocation: { lat: 0, lon: 0 },
          timestamp: Date.now() + 1000,
          classification: 'X9.0'
        };
        
        cmeVisualizer.processSolarFlareData(majorFlare);
        prediction = cmeVisualizer.getEarthImpactPredictions()[1];
        expect(['severe', 'extreme']).toContain(prediction.impactIntensity);
      });

      it('should reduce impact probability for limb flares', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh, {
          enableEarthImpactPrediction: true
        });
        
        // Limb flare (edge of visible disk)
        const limbFlare = {
          xrayFlux: 7.0e-4,
          flareLocation: { lat: 0, lon: 85 },  // Near edge
          timestamp: Date.now(),
          classification: 'X7.0'
        };
        
        cmeVisualizer.processSolarFlareData(limbFlare);
        
        const predictions = cmeVisualizer.getEarthImpactPredictions();
        if (predictions.length > 0) {
          expect(predictions[0].impactProbability).toBeLessThan(0.3); // Low probability for limb
        }
      });
    });

    describe('Performance and Integration', () => {
      it('should maintain performance with multiple active CMEs', () => {
        const startTime = performance.now();
        
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh, {
          maxConcurrentCMEs: 5
        });
        
        // Create multiple CMEs
        for (let i = 0; i < 5; i++) {
          const flareData = {
            xrayFlux: (3 + i) * 1e-4,
            flareLocation: { lat: i * 20 - 40, lon: i * 30 - 60 },
            timestamp: Date.now() + i * 500,
            classification: `X${3 + i}.0`
          };
          cmeVisualizer.processSolarFlareData(flareData);
        }
        
        const creationTime = performance.now() - startTime;
        expect(creationTime).toBeLessThan(50); // Should create quickly
        
        // Test update performance
        const updateStart = performance.now();
        cmeVisualizer.updateEffects(16); // One frame update
        const updateTime = performance.now() - updateStart;
        
        expect(updateTime).toBeLessThan(5); // Should update quickly
      });

      it('should clean up resources on disposal', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        // Create some CMEs
        const flareData = {
          xrayFlux: 4.5e-4,
          flareLocation: { lat: 15, lon: -25 },
          timestamp: Date.now(),
          classification: 'X4.5'
        };
        
        cmeVisualizer.processSolarFlareData(flareData);
        
        const shockWaves = cmeVisualizer.getShockWaveEffects();
        const coneEffects = cmeVisualizer.getCMEConeEffects();
        
        cmeVisualizer.dispose();
        
        // Check that geometry and materials are disposed
        shockWaves.forEach(wave => {
          expect(wave.geometry.dispose).toHaveBeenCalled();
          expect(wave.material.dispose).toHaveBeenCalled();
        });
        
        coneEffects.forEach(cone => {
          expect(cone.geometry.dispose).toHaveBeenCalled();
          expect(cone.material.dispose).toHaveBeenCalled();
        });
        
        expect(mockScene.remove).toHaveBeenCalled();
      });

      it('should integrate with existing solar activity systems', () => {
        cmeVisualizer = new CMEVisualizer(mockScene, mockSunMesh);
        
        // Update sun position
        const newPosition = new THREE.Vector3(10, 5, -8);
        Object.defineProperty(mockSunMesh, 'position', {
          value: newPosition,
          writable: true
        });
        
        cmeVisualizer.updateSunPosition(newPosition);
        
        // Create CME after position update
        const flareData = {
          xrayFlux: 3.8e-4,
          flareLocation: { lat: 0, lon: 0 },
          timestamp: Date.now(),
          classification: 'X3.8'
        };
        
        cmeVisualizer.processSolarFlareData(flareData);
        
        // Check that CME effects are positioned relative to new sun position
        const shockWaves = cmeVisualizer.getShockWaveEffects();
        expect(shockWaves[0].position.x).toBeCloseTo(newPosition.x, 1);
        expect(shockWaves[0].position.y).toBeCloseTo(newPosition.y, 1);
        expect(shockWaves[0].position.z).toBeCloseTo(newPosition.z, 1);
      });
    });
  });
});
