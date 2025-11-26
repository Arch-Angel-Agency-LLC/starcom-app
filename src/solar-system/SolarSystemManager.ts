// SolarSystemManager.ts - Core manager for multi-scale solar system rendering

import * as THREE from 'three';
import { ScaleContext, ScaleContextConfig, ScaleChangeCallback } from './types/ScaleContext';
import { SolarSystemManagerConfig, DEFAULT_SCALE_CONFIGS } from './types/SolarSystemConfig';
import { SolarSunManager } from './SolarSunManager';
import { SolarActivityIntegration } from './integration/SolarActivityIntegration';
import { PlanetarySystemManager } from './PlanetarySystemManager';
import type { SunState } from './SolarSunManager';

export interface SolarSystemManagerDependencies {
  scene: THREE.Scene;
  camera: THREE.Camera;
  globe: {
    scene: () => THREE.Scene;
    camera: () => THREE.Camera;
  }; // Globe.gl reference
}

export interface SolarSystemState {
  currentContext: ScaleContext;
  cameraDistance: number;
  sunState: SunState | null;
  transitionActive: boolean;
  planetaryInfo?: {
    visiblePlanets: number;
    activePlanets: string[];
    timeAcceleration: number;
  };
}

export type SolarSystemStateCallback = (state: SolarSystemState) => void;

export class SolarSystemManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private globe: {
    scene: () => THREE.Scene;
    camera: () => THREE.Camera;
  };
  private config: SolarSystemManagerConfig;
  private currentContext: ScaleContext = ScaleContext.EARTH_LOCAL;
  private scaleChangeListeners: ScaleChangeCallback[] = [];
  private stateChangeListeners: SolarSystemStateCallback[] = [];
  private initialized: boolean = false;
  private disposed: boolean = false;

  // Solar system components
  private sunManager: SolarSunManager | null = null;
  private solarActivityIntegration: SolarActivityIntegration | null = null;
  private planetarySystemManager: PlanetarySystemManager | null = null;

  private readonly defaultConfig: SolarSystemManagerConfig = {
    globeRadius: 100,
    enableTransitions: true,
    transitionDuration: 500,
    performanceMode: 'balanced',
    debugMode: false,
    enableSolarActivityIntegration: true
  };

  constructor(
    dependencies: SolarSystemManagerDependencies,
    config?: Partial<SolarSystemManagerConfig>
  ) {
    this.validateDependencies(dependencies);
    
    this.scene = dependencies.scene;
    this.camera = dependencies.camera;
    this.globe = dependencies.globe;
    this.config = { ...this.defaultConfig, ...config };
    
    this.initialize();
  }

  private validateDependencies(dependencies: SolarSystemManagerDependencies): void {
    if (!dependencies.scene) {
      throw new Error('Scene is required for SolarSystemManager');
    }
    if (!dependencies.camera) {
      throw new Error('Camera is required for SolarSystemManager');
    }
    if (!dependencies.globe) {
      throw new Error('Globe reference is required for SolarSystemManager');
    }
  }

  private initialize(): void {
    if (this.disposed) {
      throw new Error('Cannot initialize disposed SolarSystemManager');
    }

    if (this.initialized) return;

    // Set initial context based on current camera position
    const distance = this.calculateCameraDistance();
    this.currentContext = this.detectScaleContext(distance);
    
    this.log('SolarSystemManager initialized', {
      initialContext: this.currentContext,
      cameraDistance: distance,
      config: this.config
    });

    // Initialize sun manager
    this.initializeSunManager();

    // Initialize planetary system (Phase 4)
    this.initializePlanetarySystem();

    this.initialized = true;
  }

  private initializeSunManager(): void {
    this.sunManager = new SolarSunManager(this.scene, {
      baseRadius: this.config.globeRadius * 0.5,
      lightIntensity: 1.0,
      enableCorona: this.config.performanceMode !== 'low',
      enableLighting: true
    });

    // Set up sun state change listener (drives solar activity gating + state broadcasts)
    this.sunManager.onStateChange((state) => {
      this.handleSunStateChange(state);
    });

    // Initialize sun for current context
    this.sunManager.updateForScale(this.currentContext);

    if (this.config.enableSolarActivityIntegration && this.sunManager.isVisible()) {
      this.initializeSolarActivity();
    }
  }

  private initializeSolarActivity(): void {
    if (!this.config.enableSolarActivityIntegration) {
      return;
    }

    if (this.solarActivityIntegration) {
      return;
    }

    if (!this.sunManager) {
      console.warn('Cannot initialize solar activity without sun manager');
      return;
    }

    if (!this.sunManager.isVisible()) {
      this.log('Solar activity initialization deferred until sun is visible');
      return;
    }

    try {
      // Initialize solar activity integration with NOAA data
      // Enhanced configuration for better visual effects
      this.solarActivityIntegration = new SolarActivityIntegration(this.sunManager, {
        noaaUpdateInterval: 15000, // More frequent updates for real-time feel
        noaaFallbackMode: true,
        enableRealTimeUpdates: true, // Always enable for dynamic effects
        disableOnEarthLocal: true, // Still disable on Earth-local to prevent conflicts
        enableActivityScaling: true, // Scale effects with sun size
        enableCrossFade: true, // Smooth transitions
        maxActivityLevel: 'extreme', // Allow all activity levels
        solarActivity: {
          coronaLayers: this.config.performanceMode === 'high' ? 4 : 3, // More layers for richer corona
          enableFlareParticles: true, // Always enable flare particles
          flareParticleCount: this.config.performanceMode === 'high' ? 1500 : 800, // More particles
          enableHighQuality: this.config.performanceMode !== 'low'
        }
      });

      // Set initial scale context
      this.solarActivityIntegration.updateScale(this.currentContext);

      this.log('Solar activity integration initialized - may be deferred if sun mesh not ready');
    } catch (error) {
      console.warn('Solar activity integration initialization deferred:', error);
      // Note: This is now expected behavior when sun mesh isn't ready
    }
  }

  private handleSunStateChange(state: SunState): void {
    if (this.disposed) {
      return;
    }

    if (this.config.enableSolarActivityIntegration) {
      if (state.isVisible) {
        if (!this.solarActivityIntegration) {
          this.initializeSolarActivity();
        } else {
          this.solarActivityIntegration.resume();
        }
      } else if (this.solarActivityIntegration) {
        this.solarActivityIntegration.pause();
      }
    }

    this.notifyStateChange();
  }

  private initializePlanetarySystem(): void {
    try {
      // Initialize planetary system with performance-appropriate settings
      this.planetarySystemManager = new PlanetarySystemManager(this.scene, {
        timeAcceleration: 1, // Real-time by default
        showOrbitalPaths: this.config.performanceMode !== 'low',
        enableLighting: true,
        performanceMode: this.config.performanceMode,
        maxVisiblePlanets: this.config.performanceMode === 'high' ? 8 : 6,
        orbitalPathSegments: this.config.performanceMode === 'high' ? 128 : 64,
        enableAtmospheres: this.config.performanceMode !== 'low'
      });

      // Set initial scale context for planets
      this.planetarySystemManager.updateForScale(this.currentContext);

      this.log('Planetary system initialized with inner planets');
    } catch (error) {
      console.error('Failed to initialize planetary system:', error);
    }
  }

  /**
   * Detect the appropriate scale context based on camera distance
   */
  public detectScaleContext(distance: number): ScaleContext {
    if (this.disposed) return this.currentContext;

    // Handle invalid distances
    if (!isFinite(distance) || distance < 0) {
      return ScaleContext.EARTH_LOCAL;
    }

    // Check contexts in order from closest to farthest
    const contexts = [
      ScaleContext.EARTH_LOCAL,
      ScaleContext.EARTH_SPACE,
      ScaleContext.INNER_SOLAR,
      ScaleContext.SOLAR_SYSTEM
    ];

    for (const context of contexts) {
      const config = DEFAULT_SCALE_CONFIGS[context];
      if (distance >= config.cameraRange.min && distance <= config.cameraRange.max) {
        return context;
      }
    }

    // If distance is beyond all ranges, use the outermost context
    return ScaleContext.SOLAR_SYSTEM;
  }

  /**
   * Update scale based on camera distance
   */
  public updateScale(cameraDistance?: number): void {
    if (this.disposed) return;

    const distance = cameraDistance ?? this.calculateCameraDistance();
    const newContext = this.detectScaleContext(distance);

    if (newContext !== this.currentContext) {
      this.changeContext(newContext);
    }
  }

  private changeContext(newContext: ScaleContext): void {
    const oldContext = this.currentContext;
    this.currentContext = newContext;

    this.log(`Scale context changed: ${oldContext} -> ${newContext}`);

    // Update sun manager for new context
    if (this.sunManager) {
      this.sunManager.updateForScale(newContext);
    }

    // Update solar activity integration for new context (Phase 2)
    if (this.solarActivityIntegration) {
      this.solarActivityIntegration.updateScale(newContext);
      
      // Retry initialization if it was deferred and sun is now visible
      if (newContext !== ScaleContext.EARTH_LOCAL && !this.solarActivityIntegration.getState().isActive) {
        this.solarActivityIntegration.retryInitialization().catch(error => {
          console.warn('Failed to retry solar activity initialization:', error);
        });
      }
    }

    // Update planetary system for new context (Phase 4)
    if (this.planetarySystemManager) {
      this.planetarySystemManager.updateForScale(newContext);
    }

    // Notify listeners
    this.scaleChangeListeners.forEach(listener => {
      try {
        listener(newContext, oldContext);
      } catch (error) {
        console.warn('Error in scale change listener:', error);
      }
    });

    // Notify state change
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    if (this.disposed) return;

    const state: SolarSystemState = {
      currentContext: this.currentContext,
      cameraDistance: this.calculateCameraDistance(),
      sunState: this.sunManager?.getCurrentState() || null,
      transitionActive: false, // TODO: integrate with transition engine
      planetaryInfo: this.planetarySystemManager ? {
        visiblePlanets: this.planetarySystemManager.getPlanetsForScale(this.currentContext).length,
        activePlanets: Object.keys(this.planetarySystemManager.getPlanets()),
        timeAcceleration: this.planetarySystemManager.getTimeAcceleration()
      } : undefined
    };

    this.stateChangeListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.warn('Error in state change listener:', error);
      }
    });
  }

  /**
   * Register a callback for scale context changes
   */
  public onScaleChange(callback: ScaleChangeCallback): void {
    if (this.disposed) return;
    
    this.scaleChangeListeners.push(callback);
  }

  /**
   * Remove a scale change callback
   */
  public offScaleChange(callback: ScaleChangeCallback): void {
    const index = this.scaleChangeListeners.indexOf(callback);
    if (index > -1) {
      this.scaleChangeListeners.splice(index, 1);
    }
  }

  /**
   * Subscribe to solar system state changes
   */
  public onStateChange(callback: SolarSystemStateCallback): void {
    this.stateChangeListeners.push(callback);
  }

  /**
   * Unsubscribe from solar system state changes
   */
  public offStateChange(callback: SolarSystemStateCallback): void {
    const index = this.stateChangeListeners.indexOf(callback);
    if (index >= 0) {
      this.stateChangeListeners.splice(index, 1);
    }
  }

  /**
   * Get the current scale context
   */
  public getCurrentContext(): ScaleContext {
    return this.currentContext;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): SolarSystemManagerConfig {
    return { ...this.config };
  }

  /**
   * Get scale configuration for current or specified context
   */
  public getScaleConfig(context?: ScaleContext): ScaleContextConfig {
    const targetContext = context || this.currentContext;
    
    if (!Object.values(ScaleContext).includes(targetContext)) {
      throw new Error(`Invalid scale context: ${targetContext}`);
    }
    
    return { ...DEFAULT_SCALE_CONFIGS[targetContext] };
  }

  /**
   * Check if the manager is initialized
   */
  public isInitialized(): boolean {
    return this.initialized && !this.disposed;
  }

  /**
   * Calculate current camera distance from Earth center
   */
  private calculateCameraDistance(): number {
    const earthCenter = new THREE.Vector3(0, 0, 0);
    return this.camera.position.distanceTo(earthCenter);
  }

  /**
   * Dispose of the solar system manager and clean up resources
   */
  public dispose(): void {
    if (this.disposed) return;

    this.log('SolarSystemManager disposed');

    // Dispose sun manager
    if (this.sunManager) {
      this.sunManager.dispose();
      this.sunManager = null;
    }

    // Dispose activity integration
    if (this.solarActivityIntegration) {
      this.solarActivityIntegration.dispose();
      this.solarActivityIntegration = null;
    }

    // Dispose planetary system
    if (this.planetarySystemManager) {
      this.planetarySystemManager.dispose();
      this.planetarySystemManager = null;
    }

    // Clear all listeners
    this.scaleChangeListeners.length = 0;
    this.stateChangeListeners.length = 0;
    
    // Mark as disposed
    this.disposed = true;
    this.initialized = false;
  }

  /**
   * Get current solar activity state (Phase 2)
   */
  public getSolarActivityState() {
    return this.solarActivityIntegration?.getState() || null;
  }

  /**
   * Get current space weather data (Phase 2)
   */
  public async getCurrentSpaceWeather() {
    return this.solarActivityIntegration?.getCurrentSpaceWeather() || null;
  }

  /**
   * Enable or disable real-time solar activity updates (Phase 2)
   */
  public setSolarActivityUpdates(enabled: boolean): void {
    this.solarActivityIntegration?.setRealTimeUpdates(enabled);
  }

  /**
   * Force update solar activity data (Phase 2)
   */
  public async updateSolarActivity(): Promise<void> {
    await this.solarActivityIntegration?.forceUpdate();
  }

  private log(...args: unknown[]): void {
    if (this.config.debugMode) {
      console.log(...args);
    }
  }
}
