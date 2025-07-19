// PlanetarySystemManager.ts - Core manager for planetary system rendering and dynamics

import * as THREE from 'three';
import { ScaleContext } from './types/ScaleContext';
import { PlanetarySystemConfig, PlanetInstance, PlanetaryPerformanceMetrics } from './types/PlanetaryTypes';
import { Planet } from './components/Planet';

export class PlanetarySystemManager {
  private scene: THREE.Scene;
  private config: Required<PlanetarySystemConfig>;
  private planets: Map<string, Planet> = new Map();
  private initialized: boolean = false;
  private paused: boolean = false;
  private disposed: boolean = false;

  // Time management
  private currentTime: Date = new Date();
  private timeAcceleration: number = 1;
  private lastUpdateTime: number = 0;

  // Performance tracking
  private performanceMetrics: PlanetaryPerformanceMetrics = {
    frameTime: 0,
    activePlanets: 0,
    visiblePlanets: 0,
    memoryUsage: 0
  };

  // Default configuration
  private readonly defaultConfig: Required<PlanetarySystemConfig> = {
    timeAcceleration: 1,
    showOrbitalPaths: true,
    enableLighting: true,
    performanceMode: 'balanced',
    maxVisiblePlanets: 8,
    orbitalPathSegments: 64,
    enableAtmospheres: true,
    enableMagnetospheres: false // Will be enabled in later weeks
  };

  constructor(scene: THREE.Scene, config: Partial<PlanetarySystemConfig> = {}) {
    this.scene = scene;
    this.config = { ...this.defaultConfig, ...config };
    this.timeAcceleration = this.config.timeAcceleration;
    
    this.initialize();
  }

  private initialize(): void {
    if (this.disposed) {
      throw new Error('Cannot initialize disposed PlanetarySystemManager');
    }

    this.createInnerPlanets();
    this.setupLighting();
    this.initialized = true;
    this.lastUpdateTime = Date.now();
  }

  private createInnerPlanets(): void {
    // Create inner planets (Mercury, Venus, Earth, Mars)
    const innerPlanetData = [
      {
        name: 'mercury',
        radius: 2439.7, // km
        orbitRadius: 0.387, // AU
        orbitPeriod: 87.97, // days
        color: 0x8c7853,
        hasAtmosphere: false
      },
      {
        name: 'venus',
        radius: 6051.8, // km
        orbitRadius: 0.723, // AU
        orbitPeriod: 224.7, // days
        color: 0xffc649,
        hasAtmosphere: true
      },
      {
        name: 'earth',
        radius: 6371, // km
        orbitRadius: 1.0, // AU
        orbitPeriod: 365.25, // days
        color: 0x6b93d6,
        hasAtmosphere: true
      },
      {
        name: 'mars',
        radius: 3389.5, // km
        orbitRadius: 1.524, // AU
        orbitPeriod: 686.98, // days
        color: 0xcd5c5c,
        hasAtmosphere: true
      }
    ];

    for (const planetData of innerPlanetData) {
      const planet = new Planet(this.scene, planetData);
      this.planets.set(planetData.name, planet);
    }

    this.performanceMetrics.activePlanets = this.planets.size;
  }

  private setupLighting(): void {
    if (!this.config.enableLighting) return;

    // Lighting will be handled by SolarSunManager
    // This is a placeholder for planet-specific lighting setup
  }

  /**
   * Get initialization status
   */
  public isInitialized(): boolean {
    return this.initialized && !this.disposed;
  }

  /**
   * Get current time acceleration factor
   */
  public getTimeAcceleration(): number {
    return this.timeAcceleration;
  }

  /**
   * Set time acceleration factor
   */
  public setTimeAcceleration(acceleration: number): void {
    this.timeAcceleration = Math.max(0, acceleration);
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<PlanetarySystemConfig> {
    return { ...this.config };
  }

  /**
   * Get all planets
   */
  public getPlanets(): Record<string, Planet> {
    const result: Record<string, Planet> = {};
    for (const [name, planet] of this.planets) {
      result[name] = planet;
    }
    return result;
  }

  /**
   * Get specific planet by name
   */
  public getPlanet(name: string): Planet | null {
    return this.planets.get(name) || null;
  }

  /**
   * Get all planet positions
   */
  public getAllPlanetPositions(): Record<string, THREE.Vector3> {
    const positions: Record<string, THREE.Vector3> = {};
    for (const [name, planet] of this.planets) {
      positions[name] = planet.getPosition().clone();
    }
    return positions;
  }

  /**
   * Get planets visible in specific scale context
   */
  public getPlanetsForScale(scaleContext: ScaleContext): Planet[] {
    const visiblePlanets: Planet[] = [];
    
    for (const planet of this.planets.values()) {
      if (this.isPlanetVisibleInScale(planet, scaleContext)) {
        visiblePlanets.push(planet);
      }
    }
    
    return visiblePlanets;
  }

  private isPlanetVisibleInScale(planet: Planet, scaleContext: ScaleContext): boolean {
    const name = planet.getName();
    
    switch (scaleContext) {
      case ScaleContext.EARTH_LOCAL:
        return false; // No planets visible at Earth local scale
      case ScaleContext.EARTH_SPACE:
        return name === 'earth'; // Only Earth visible in Earth space
      case ScaleContext.INNER_SOLAR:
        return ['mercury', 'venus', 'earth', 'mars'].includes(name);
      case ScaleContext.SOLAR_SYSTEM:
        return true; // All planets visible in full solar system view
      default:
        return false;
    }
  }

  /**
   * Advance time by specified seconds
   */
  public advanceTime(deltaSeconds: number): void {
    if (this.paused || this.disposed) return;

    const acceleratedDelta = deltaSeconds * this.timeAcceleration;
    this.currentTime = new Date(this.currentTime.getTime() + (acceleratedDelta * 1000));

    // Update all planets
    for (const planet of this.planets.values()) {
      planet.updateOrbitalPosition(this.currentTime);
    }

    this.lastUpdateTime = Date.now();
  }

  /**
   * Pause orbital motion
   */
  public pause(): void {
    this.paused = true;
  }

  /**
   * Resume orbital motion
   */
  public resume(): void {
    this.paused = false;
  }

  /**
   * Get pause status
   */
  public isPaused(): boolean {
    return this.paused;
  }

  /**
   * Set current time
   */
  public setCurrentTime(time: Date): void {
    this.currentTime = new Date(time.getTime());
    
    // Update all planets to new time
    for (const planet of this.planets.values()) {
      planet.updateOrbitalPosition(this.currentTime);
    }
  }

  /**
   * Get current time
   */
  public getCurrentTime(): Date {
    return new Date(this.currentTime.getTime());
  }

  /**
   * Update for scale context changes
   */
  public updateForScale(scaleContext: ScaleContext): void {
    if (this.disposed) return;

    let visibleCount = 0;
    
    for (const planet of this.planets.values()) {
      const shouldBeVisible = this.isPlanetVisibleInScale(planet, scaleContext);
      planet.setVisible(shouldBeVisible);
      
      if (shouldBeVisible) {
        visibleCount++;
      }
    }

    this.performanceMetrics.visiblePlanets = visibleCount;

    // Update orbital path visibility based on scale
    const showPaths = this.config.showOrbitalPaths && 
                     (scaleContext === ScaleContext.INNER_SOLAR || scaleContext === ScaleContext.SOLAR_SYSTEM);
    
    for (const planet of this.planets.values()) {
      planet.setOrbitalPathVisible(showPaths);
    }
  }

  /**
   * Get orbital paths visibility status
   */
  public areOrbitalPathsVisible(): boolean {
    const firstPlanet = this.planets.values().next().value;
    return firstPlanet ? firstPlanet.isOrbitalPathVisible() : false;
  }

  /**
   * Report frame time for performance tracking
   */
  public reportFrameTime(frameTime: number): void {
    this.performanceMetrics.frameTime = frameTime;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PlanetaryPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Optimize performance based on current metrics
   */
  public optimizePerformance(): void {
    const frameTime = this.performanceMetrics.frameTime;
    
    if (frameTime > 33) { // Less than 30 FPS
      this.config.performanceMode = 'low';
      this.config.orbitalPathSegments = 32;
      this.config.enableAtmospheres = false;
    } else if (frameTime < 16) { // More than 60 FPS
      this.config.performanceMode = 'high';
      this.config.orbitalPathSegments = 128;
      this.config.enableAtmospheres = true;
    } else { // 30-60 FPS
      this.config.performanceMode = 'balanced';
      this.config.orbitalPathSegments = 64;
      this.config.enableAtmospheres = true;
    }

    // Apply optimizations to all planets
    for (const planet of this.planets.values()) {
      planet.applyPerformanceConfig(this.config);
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    if (this.disposed) return;

    this.paused = true;

    // Dispose all planets
    for (const planet of this.planets.values()) {
      planet.dispose();
    }

    this.planets.clear();
    this.initialized = false;
    this.disposed = true;
  }
}
