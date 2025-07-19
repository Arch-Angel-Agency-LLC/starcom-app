// PlanetarySystemManager.test.ts - TDD specifications for planetary system core

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { PlanetarySystemManager } from '../PlanetarySystemManager';
import { ScaleContext } from '../types/ScaleContext';

// Mock THREE.js objects for testing
const mockScene = {
  add: vi.fn(),
  remove: vi.fn(),
  children: []
} as unknown as THREE.Scene;

const mockCamera = {
  position: new THREE.Vector3(0, 0, 5000),
  updateProjectionMatrix: vi.fn()
} as unknown as THREE.Camera;

describe('PlanetarySystemManager - Core Architecture', () => {
  let planetaryManager: PlanetarySystemManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCamera.position.set(0, 0, 5000);
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      planetaryManager = new PlanetarySystemManager(mockScene, {
        timeAcceleration: 1,
        showOrbitalPaths: true,
        enableLighting: true,
        performanceMode: 'balanced'
      });

      expect(planetaryManager).toBeDefined();
      expect(planetaryManager.isInitialized()).toBe(true);
      expect(planetaryManager.getTimeAcceleration()).toBe(1);
    });

    test('should accept custom configuration', () => {
      const customConfig = {
        timeAcceleration: 365,
        showOrbitalPaths: false,
        enableLighting: false,
        performanceMode: 'high' as const
      };

      planetaryManager = new PlanetarySystemManager(mockScene, customConfig);

      expect(planetaryManager.getTimeAcceleration()).toBe(365);
      expect(planetaryManager.getConfig().showOrbitalPaths).toBe(false);
      expect(planetaryManager.getConfig().enableLighting).toBe(false);
      expect(planetaryManager.getConfig().performanceMode).toBe('high');
    });

    test('should initialize all inner planets', () => {
      planetaryManager = new PlanetarySystemManager(mockScene);

      const planets = planetaryManager.getPlanets();
      expect(planets).toHaveProperty('mercury');
      expect(planets).toHaveProperty('venus');
      expect(planets).toHaveProperty('earth');
      expect(planets).toHaveProperty('mars');

      expect(planets.mercury.isInitialized()).toBe(true);
      expect(planets.venus.isInitialized()).toBe(true);
      expect(planets.earth.isInitialized()).toBe(true);
      expect(planets.mars.isInitialized()).toBe(true);
    });
  });

  describe('Planetary Management', () => {
    beforeEach(() => {
      planetaryManager = new PlanetarySystemManager(mockScene);
    });

    test('should get planet by name', () => {
      const earth = planetaryManager.getPlanet('earth');
      expect(earth).toBeDefined();
      expect(earth.getName()).toBe('earth');

      const mars = planetaryManager.getPlanet('mars');
      expect(mars).toBeDefined();
      expect(mars.getName()).toBe('mars');
    });

    test('should return null for invalid planet name', () => {
      const invalid = planetaryManager.getPlanet('pluto');
      expect(invalid).toBeNull();
    });

    test('should get all planet positions', () => {
      const positions = planetaryManager.getAllPlanetPositions();
      
      expect(positions).toHaveProperty('mercury');
      expect(positions).toHaveProperty('venus');
      expect(positions).toHaveProperty('earth');
      expect(positions).toHaveProperty('mars');

      expect(positions.earth).toBeInstanceOf(THREE.Vector3);
      expect(positions.mars).toBeInstanceOf(THREE.Vector3);
    });

    test('should get planets visible in scale context', () => {
      const innerSolarPlanets = planetaryManager.getPlanetsForScale(ScaleContext.INNER_SOLAR);
      expect(innerSolarPlanets).toHaveLength(4); // Mercury, Venus, Earth, Mars

      const solarSystemPlanets = planetaryManager.getPlanetsForScale(ScaleContext.SOLAR_SYSTEM);
      expect(solarSystemPlanets).toHaveLength(4); // Will expand to 8 when outer planets added
    });
  });

  describe('Time and Orbital Updates', () => {
    beforeEach(() => {
      planetaryManager = new PlanetarySystemManager(mockScene);
    });

    test('should update planetary positions with time advancement', () => {
      const initialPositions = planetaryManager.getAllPlanetPositions();
      
      // Advance time by 1 day (at 1x acceleration)
      planetaryManager.advanceTime(86400); // 1 day in seconds

      const newPositions = planetaryManager.getAllPlanetPositions();
      
      // Positions should change (planets are orbiting)
      expect(newPositions.earth.distanceTo(initialPositions.earth)).toBeGreaterThan(0);
      expect(newPositions.mars.distanceTo(initialPositions.mars)).toBeGreaterThan(0);
    });

    test('should handle time acceleration changes', () => {
      planetaryManager.setTimeAcceleration(365); // 1 year per day
      expect(planetaryManager.getTimeAcceleration()).toBe(365);

      planetaryManager.setTimeAcceleration(0.5); // Half speed
      expect(planetaryManager.getTimeAcceleration()).toBe(0.5);
    });

    test('should pause and resume orbital motion', () => {
      expect(planetaryManager.isPaused()).toBe(false);

      planetaryManager.pause();
      expect(planetaryManager.isPaused()).toBe(true);

      planetaryManager.resume();
      expect(planetaryManager.isPaused()).toBe(false);
    });

    test('should set specific date and time', () => {
      const testDate = new Date('2025-07-14T12:00:00Z');
      planetaryManager.setCurrentTime(testDate);
      
      const currentTime = planetaryManager.getCurrentTime();
      expect(currentTime.getTime()).toBe(testDate.getTime());
    });
  });

  describe('Scale Context Integration', () => {
    beforeEach(() => {
      planetaryManager = new PlanetarySystemManager(mockScene);
    });

    test('should update for scale context changes', () => {
      // Start in INNER_SOLAR context
      planetaryManager.updateForScale(ScaleContext.INNER_SOLAR);
      
      const planets = planetaryManager.getPlanets();
      expect(planets.earth.isVisible()).toBe(true);
      expect(planets.mars.isVisible()).toBe(true);

      // Switch to EARTH_SPACE context
      planetaryManager.updateForScale(ScaleContext.EARTH_SPACE);
      
      // Only Earth should be visible in Earth space context
      expect(planets.earth.isVisible()).toBe(true);
      expect(planets.mars.isVisible()).toBe(false);
    });

    test('should adjust orbital path visibility based on scale', () => {
      planetaryManager.updateForScale(ScaleContext.SOLAR_SYSTEM);
      expect(planetaryManager.areOrbitalPathsVisible()).toBe(true);

      planetaryManager.updateForScale(ScaleContext.EARTH_SPACE);
      expect(planetaryManager.areOrbitalPathsVisible()).toBe(false);
    });
  });

  describe('Performance and Optimization', () => {
    beforeEach(() => {
      planetaryManager = new PlanetarySystemManager(mockScene, {
        performanceMode: 'balanced'
      });
    });

    test('should track performance metrics', () => {
      const metrics = planetaryManager.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('frameTime');
      expect(metrics).toHaveProperty('activePlanets');
      expect(metrics).toHaveProperty('visiblePlanets');
      expect(metrics).toHaveProperty('memoryUsage');

      expect(metrics.frameTime).toBeGreaterThanOrEqual(0);
      expect(metrics.activePlanets).toBe(4); // Inner planets
    });

    test('should automatically optimize based on performance', () => {
      // Simulate poor performance
      planetaryManager.reportFrameTime(50); // 20 FPS

      const metrics = planetaryManager.getPerformanceMetrics();
      expect(metrics.frameTime).toBe(50);

      // Should trigger optimization
      planetaryManager.optimizePerformance();
      
      // Performance mode should adjust
      const config = planetaryManager.getConfig();
      expect(config.performanceMode).toBe('low');
    });
  });

  describe('Lifecycle Management', () => {
    beforeEach(() => {
      planetaryManager = new PlanetarySystemManager(mockScene);
    });

    test('should dispose resources correctly', () => {
      planetaryManager.dispose();

      expect(planetaryManager.isInitialized()).toBe(false);
      expect(planetaryManager.isPaused()).toBe(true);
    });

    test('should handle multiple dispose calls gracefully', () => {
      expect(() => {
        planetaryManager.dispose();
        planetaryManager.dispose();
      }).not.toThrow();
    });
  });
});
