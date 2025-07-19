import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { SolarWindVisualizer } from '../SolarWindVisualizer';

// Mock THREE.js for testing
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn()
  })),
  Mesh: vi.fn(() => ({
    position: { copy: vi.fn(), set: vi.fn() },
    scale: { setScalar: vi.fn(), set: vi.fn() },
    material: {
      uniforms: {
        uTime: { value: 0 },
        uWindSpeed: { value: 0 },
        uDensity: { value: 0 },
        uDirection: { value: new THREE.Vector3() }
      },
      dispose: vi.fn()
    },
    geometry: {
      dispose: vi.fn()
    }
  })),
  Points: vi.fn(() => ({
    position: { copy: vi.fn() },
    material: {
      uniforms: {
        uTime: { value: 0 },
        uWindSpeed: { value: 0 },
        uParticleSize: { value: 1 }
      },
      dispose: vi.fn()
    },
    geometry: {
      attributes: {
        position: { array: new Float32Array(300), needsUpdate: false },
        velocity: { array: new Float32Array(300), needsUpdate: false }
      },
      dispose: vi.fn()
    }
  })),
  BufferGeometry: vi.fn(() => ({
    setAttribute: vi.fn(),
    dispose: vi.fn(),
    attributes: {
      position: { array: new Float32Array(300), needsUpdate: false },
      velocity: { array: new Float32Array(300), needsUpdate: false }
    }
  })),
  BufferAttribute: vi.fn(),
  ShaderMaterial: vi.fn(() => ({
    uniforms: {
      uTime: { value: 0 },
      uWindSpeed: { value: 0 },
      uDensity: { value: 0 },
      uParticleSize: { value: 1 },
      uDirection: { value: new THREE.Vector3() }
    },
    dispose: vi.fn()
  })),
  PointsMaterial: vi.fn(() => ({
    dispose: vi.fn()
  })),
  Vector3: vi.fn(() => ({
    x: 0, y: 0, z: 0,
    set: vi.fn(),
    copy: vi.fn(),
    clone: vi.fn(function() { return { x: this.x, y: this.y, z: this.z, normalize: vi.fn().mockReturnThis(), multiplyScalar: vi.fn().mockReturnThis(), clone: vi.fn() }; }),
    normalize: vi.fn().mockReturnThis(),
    multiplyScalar: vi.fn().mockReturnThis(),
    add: vi.fn(),
    distanceTo: vi.fn(() => 100)
  })),
  Color: vi.fn(() => ({
    setHex: vi.fn(),
    r: 1, g: 1, b: 1
  })),
  AdditiveBlending: 2,
  Float32BufferAttribute: vi.fn()
}));

// Mock performance and requestAnimationFrame
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  }
});

global.requestAnimationFrame = vi.fn((callback) => {
  // Return a mock animation frame ID
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('SolarWindVisualizer - Phase 2 Week 6 TDD Implementation', () => {
  let solarWindVisualizer: SolarWindVisualizer;
  let mockScene: THREE.Scene;
  let mockSunMesh: THREE.Mesh;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock scene and sun mesh
    mockScene = new THREE.Scene();
    mockSunMesh = new THREE.Mesh();
    
    // Mock position and scale properties
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
    if (solarWindVisualizer) {
      solarWindVisualizer.dispose();
    }
  });

  describe('Phase 2 Week 6 Day 1-2: Solar Wind Particle System', () => {
    describe('Basic Solar Wind Setup', () => {
      it('should create SolarWindVisualizer with default configuration', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        expect(solarWindVisualizer).toBeDefined();
        expect(solarWindVisualizer.getConfig()).toEqual(
          expect.objectContaining({
            particleCount: expect.any(Number),
            windSpeed: expect.any(Number),
            particleDensity: expect.any(Number),
            streamDistance: expect.any(Number),
            particleSize: expect.any(Number),
            updateInterval: expect.any(Number)
          })
        );
      });

      it('should initialize particle system with proper count', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh, {
          particleCount: 1000
        });
        
        const particles = solarWindVisualizer.getParticleSystem();
        expect(particles).toBeDefined();
        expect(particles.geometry.attributes.position.array).toHaveLength(3000); // 1000 particles * 3 coordinates
      });

      it('should position particles emanating from sun surface', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        const positions = solarWindVisualizer.getParticlePositions();
        expect(positions).toBeDefined();
        expect(positions.length).toBeGreaterThan(0);
        
        // All particles should start near sun surface (radius ~1.0)
        for (let i = 0; i < positions.length; i += 3) {
          const distance = Math.sqrt(positions[i]**2 + positions[i+1]**2 + positions[i+2]**2);
          expect(distance).toBeGreaterThanOrEqual(0.9); // Near sun surface
        }
      });
    });

    describe('Solar Wind Data Integration', () => {
      it('should update wind speed from NOAA solar wind data', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        const solarWindData = {
          windSpeed: 450,        // km/s
          density: 8.5,          // protons/cm³
          temperature: 150000,   // K
          direction: { x: 1, y: 0, z: 0 }
        };
        
        solarWindVisualizer.updateFromSolarWindData(solarWindData);
        
        const config = solarWindVisualizer.getConfig();
        expect(config.windSpeed).toBe(450);
        expect(config.particleDensity).toBe(8.5);
      });

      it('should create particle stream with correct velocity distribution', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh, {
          windSpeed: 400
        });
        
        const velocities = solarWindVisualizer.getParticleVelocities();
        expect(velocities).toBeDefined();
        
        // Velocities should be radial from sun with some variation
        for (let i = 0; i < velocities.length; i += 3) {
          const speed = Math.sqrt(velocities[i]**2 + velocities[i+1]**2 + velocities[i+2]**2);
          expect(speed).toBeGreaterThan(0);
          expect(speed).toBeLessThan(500); // Reasonable solar wind speed
        }
      });

      it('should adjust particle density based on solar wind data', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        // Low density solar wind
        solarWindVisualizer.updateFromSolarWindData({ density: 2.0 });
        expect(solarWindVisualizer.getVisibleParticleCount()).toBeLessThan(500);
        
        // High density solar wind  
        solarWindVisualizer.updateFromSolarWindData({ density: 15.0 });
        expect(solarWindVisualizer.getVisibleParticleCount()).toBeGreaterThan(800);
      });
    });

    describe('Particle Animation and Movement', () => {
      it('should animate particles streaming from sun to outer space', async () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        const initialPositions = [...solarWindVisualizer.getParticlePositions()];
        
        // Start animation
        solarWindVisualizer.startAnimation();
        
        // Wait for animation frame
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const updatedPositions = solarWindVisualizer.getParticlePositions();
        
        // Particles should have moved
        let hasMovement = false;
        for (let i = 0; i < initialPositions.length; i++) {
          if (Math.abs(initialPositions[i] - updatedPositions[i]) > 0.001) {
            hasMovement = true;
            break;
          }
        }
        expect(hasMovement).toBe(true);
      });

      it('should recycle particles when they reach stream distance', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh, {
          streamDistance: 10.0 // Small distance for testing
        });
        
        const recycledCount = solarWindVisualizer.getRecycledParticleCount();
        
        // Force particle update beyond stream distance
        solarWindVisualizer.updateParticles(5000); // Large time delta
        
        const newRecycledCount = solarWindVisualizer.getRecycledParticleCount();
        expect(newRecycledCount).toBeGreaterThan(recycledCount);
      });

      it('should support pause and resume functionality', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        solarWindVisualizer.startAnimation();
        expect(solarWindVisualizer.isAnimating()).toBe(true);
        
        solarWindVisualizer.pause();
        expect(solarWindVisualizer.isAnimating()).toBe(false);
        
        solarWindVisualizer.resume();
        expect(solarWindVisualizer.isAnimating()).toBe(true);
      });
    });

    describe('Performance and Optimization', () => {
      it('should maintain performance with large particle counts', () => {
        const startTime = performance.now();
        
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh, {
          particleCount: 5000
        });
        
        const creationTime = performance.now() - startTime;
        expect(creationTime).toBeLessThan(100); // Should create quickly
        
        // Test update performance
        const updateStart = performance.now();
        solarWindVisualizer.updateParticles(16); // One frame update
        const updateTime = performance.now() - updateStart;
        
        expect(updateTime).toBeLessThan(10); // Should update quickly
      });

      it('should implement level-of-detail based on distance', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        // Far from sun - should reduce particle count
        solarWindVisualizer.setCameraDistance(100);
        const farParticleCount = solarWindVisualizer.getVisibleParticleCount();
        
        // Close to sun - should show more particles
        solarWindVisualizer.setCameraDistance(5);
        const closeParticleCount = solarWindVisualizer.getVisibleParticleCount();
        
        expect(closeParticleCount).toBeGreaterThan(farParticleCount);
      });

      it('should clean up resources on disposal', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        const particleSystem = solarWindVisualizer.getParticleSystem();
        const geometry = particleSystem.geometry;
        const material = particleSystem.material;
        
        solarWindVisualizer.dispose();
        
        expect(geometry.dispose).toHaveBeenCalled();
        expect(material.dispose).toHaveBeenCalled();
        expect(mockScene.remove).toHaveBeenCalledWith(particleSystem);
      });
    });

    describe('Visual Effects and Shaders', () => {
      it('should create particle shader with solar wind parameters', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        const particleSystem = solarWindVisualizer.getParticleSystem();
        const material = particleSystem.material as THREE.ShaderMaterial;
        
        expect(material.uniforms.uTime).toBeDefined();
        expect(material.uniforms.uWindSpeed).toBeDefined();
        expect(material.uniforms.uParticleSize).toBeDefined();
      });

      it('should vary particle color based on wind speed', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        // Slow wind - more blue
        solarWindVisualizer.updateFromSolarWindData({ windSpeed: 300 });
        const slowWindColor = solarWindVisualizer.getParticleColor();
        
        // Fast wind - more red
        solarWindVisualizer.updateFromSolarWindData({ windSpeed: 600 });
        const fastWindColor = solarWindVisualizer.getParticleColor();
        
        expect(fastWindColor.r).toBeGreaterThan(slowWindColor.r);
      });

      it('should apply particle size based on density', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        // Low density - smaller particles
        solarWindVisualizer.updateFromSolarWindData({ density: 1.0 });
        const lowDensitySize = solarWindVisualizer.getParticleSize();
        
        // High density - larger particles
        solarWindVisualizer.updateFromSolarWindData({ density: 20.0 });
        const highDensitySize = solarWindVisualizer.getParticleSize();
        
        expect(highDensitySize).toBeGreaterThan(lowDensitySize);
      });
    });

    describe('Integration with Solar System', () => {
      it('should accept sun position updates', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        const newPosition = new THREE.Vector3(5, 10, -3);
        Object.defineProperty(mockSunMesh, 'position', {
          value: newPosition,
          writable: true
        });
        
        solarWindVisualizer.updateSunPosition(newPosition);
        
        // Particle origin should update to new sun position
        const particlePositions = solarWindVisualizer.getParticlePositions();
        
        // Check that some particles are near the new sun position
        let hasParticlesNearSun = false;
        for (let i = 0; i < particlePositions.length; i += 3) {
          const distance = Math.sqrt(
            (particlePositions[i] - newPosition.x) ** 2 +
            (particlePositions[i+1] - newPosition.y) ** 2 +
            (particlePositions[i+2] - newPosition.z) ** 2
          );
          if (distance < 2.0) {
            hasParticlesNearSun = true;
            break;
          }
        }
        expect(hasParticlesNearSun).toBe(true);
      });

      it('should scale particle emission with sun size', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        const originalEmissionRate = solarWindVisualizer.getEmissionRate();
        
        // Scale up sun
        Object.defineProperty(mockSunMesh, 'scale', {
          value: { x: 2, y: 2, z: 2 },
          writable: true
        });
        solarWindVisualizer.updateSunScale(2.0);
        
        const scaledEmissionRate = solarWindVisualizer.getEmissionRate();
        expect(scaledEmissionRate).toBeGreaterThan(originalEmissionRate);
      });

      it('should provide real-time solar wind parameters', () => {
        solarWindVisualizer = new SolarWindVisualizer(mockScene, mockSunMesh);
        
        const parameters = solarWindVisualizer.getSolarWindParameters();
        
        expect(parameters).toEqual(
          expect.objectContaining({
            windSpeed: expect.any(Number),
            density: expect.any(Number),
            temperature: expect.any(Number),
            magneticFieldStrength: expect.any(Number),
            activeParticleCount: expect.any(Number)
          })
        );
      });
    });
  });
});
