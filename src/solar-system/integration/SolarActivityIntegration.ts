// Solar Activity Integration - Connects NOAA data with SolarSunManager
// Phase 2 Week 5 Integration Component

import * as THREE from 'three';
import { SolarSunManager } from '../SolarSunManager';
import { SolarActivityVisualizer, SolarActivityConfig } from '../effects/SolarActivityVisualizer';
import { NOAASolarDataService } from '../noaa/NOAASolarDataService';
import { ScaleContext } from '../types/ScaleContext';

export interface SolarActivityIntegrationConfig {
  // NOAA service configuration
  noaaUpdateInterval?: number;        // NOAA data update interval (default: 30000ms)
  noaaFallbackMode?: boolean;         // Enable fallback mode (default: true)
  
  // Activity visualization configuration
  solarActivity?: Partial<SolarActivityConfig>;
  
  // Integration behavior
  enableRealTimeUpdates?: boolean;    // Enable real-time space weather updates (default: true)
  enableActivityScaling?: boolean;    // Scale activity effects with sun scale (default: true)
  enableCrossFade?: boolean;          // Smooth transitions between activity states (default: true)
  
  // Performance optimization
  disableOnEarthLocal?: boolean;      // Disable activity effects in EARTH_LOCAL scale (default: true)
  maxActivityLevel?: 'moderate' | 'high' | 'extreme'; // Maximum activity level to visualize (default: 'extreme')
}

export interface SolarActivityState {
  isActive: boolean;
  currentScale: ScaleContext;
  activityLevel: 'quiet' | 'low' | 'moderate' | 'high' | 'extreme';
  lastUpdate: Date | null;
  performance: {
    frameTime: number;
    effectCount: number;
    memoryUsage: number;
  };
}

export class SolarActivityIntegration {
  private sunManager: SolarSunManager;
  private activityVisualizer?: SolarActivityVisualizer;
  private noaaService: NOAASolarDataService;
  private config: Required<SolarActivityIntegrationConfig>;
  
  private state: SolarActivityState = {
    isActive: false,
    currentScale: ScaleContext.SOLAR_SYSTEM,
    activityLevel: 'quiet',
    lastUpdate: null,
    performance: {
      frameTime: 0,
      effectCount: 0,
      memoryUsage: 0
    }
  };
  
  private updateTimer?: NodeJS.Timeout;
  private performanceTimer?: NodeJS.Timeout;

  constructor(
    sunManager: SolarSunManager,
    config: SolarActivityIntegrationConfig = {}
  ) {
    this.sunManager = sunManager;
    
    // Apply default configuration
    this.config = {
      noaaUpdateInterval: 30000,
      noaaFallbackMode: true,
      solarActivity: {},
      enableRealTimeUpdates: true,
      enableActivityScaling: true,
      enableCrossFade: true,
      disableOnEarthLocal: true,
      maxActivityLevel: 'extreme',
      ...config
    };

    // Initialize NOAA service
    this.noaaService = new NOAASolarDataService({
      updateInterval: this.config.noaaUpdateInterval,
      fallbackMode: this.config.noaaFallbackMode,
      enableCaching: true
    });

    this.initializeIntegration();
  }

  private async waitForSunMesh(maxAttempts: number = 10, delay: number = 100): Promise<THREE.Mesh | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const sunMesh = this.sunManager.getSunMesh();
      if (sunMesh && sunMesh.parent) {
        // Verify the mesh is properly attached to a scene
        return sunMesh;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return null;
  }

  private async initializeIntegration(): Promise<void> {
    try {
      // Connect to NOAA service
      await this.noaaService.connect();
      
      // Get sun mesh from SolarSunManager with retry logic
      const sunMesh = await this.waitForSunMesh();
      if (!sunMesh) {
        console.warn('SolarSunManager sun mesh not available, deferring initialization');
        this.state.isActive = false;
        return;
      }

      // Create activity visualizer
      const scene = sunMesh.parent as THREE.Scene;
      if (!scene || !scene.add) {
        console.warn('Invalid scene reference from sun mesh parent');
        this.state.isActive = false;
        return;
      }

      this.activityVisualizer = new SolarActivityVisualizer(
        scene,
        sunMesh,
        this.noaaService,
        this.config.solarActivity
      );

      // Set initial state
      this.state.isActive = true;
      this.state.currentScale = this.sunManager.getCurrentState().currentScale;
      
      // Start real-time updates if enabled
      if (this.config.enableRealTimeUpdates) {
        this.startRealTimeUpdates();
      }
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Initial activity update
      await this.updateSolarActivity();
      
    } catch (error) {
      console.error('Failed to initialize solar activity integration:', error);
      this.state.isActive = false;
    }
  }

  private startRealTimeUpdates(): void {
    this.updateTimer = setInterval(async () => {
      try {
        await this.updateSolarActivity();
      } catch (error) {
        console.warn('Failed to update solar activity:', error);
      }
    }, this.config.noaaUpdateInterval);
  }

  private startPerformanceMonitoring(): void {
    this.performanceTimer = setInterval(() => {
      this.updatePerformanceStats();
    }, 5000); // Update every 5 seconds
  }

  private async updateSolarActivity(): Promise<void> {
    if (!this.activityVisualizer || !this.state.isActive) {
      return;
    }

    try {
      const spaceWeather = await this.noaaService.getSpaceWeatherSummary();
      
      // Check if activity level exceeds maximum allowed
      if (this.exceedsMaxActivityLevel(spaceWeather.solarActivity.level)) {
        return;
      }
      
      // Update state
      this.state.activityLevel = spaceWeather.solarActivity.level;
      this.state.lastUpdate = new Date();
      
      // Apply scale-specific optimizations
      this.optimizeForCurrentScale();
      
    } catch (error) {
      console.warn('Failed to update solar activity:', error);
    }
  }

  private exceedsMaxActivityLevel(level: string): boolean {
    const levels = ['quiet', 'low', 'moderate', 'high', 'extreme'];
    const maxIndex = levels.indexOf(this.config.maxActivityLevel);
    const currentIndex = levels.indexOf(level);
    
    return currentIndex > maxIndex;
  }

  private optimizeForCurrentScale(): void {
    if (!this.activityVisualizer) return;
    
    const currentScale = this.sunManager.getCurrentState().currentScale;
    
    // Disable activity effects in EARTH_LOCAL scale for performance
    if (this.config.disableOnEarthLocal && currentScale === ScaleContext.EARTH_LOCAL) {
      this.activityVisualizer.pause();
      return;
    }
    
    // Resume if paused
    if (!this.activityVisualizer.isAnimating()) {
      this.activityVisualizer.resume();
    }
    
    // Adjust quality based on scale
    const isDistantView = currentScale === ScaleContext.SOLAR_SYSTEM;
    const qualityConfig: Partial<SolarActivityConfig> = {
      coronaLayers: isDistantView ? 1 : 3,
      flareParticleCount: isDistantView ? 200 : 1000,
      enableHighQuality: !isDistantView
    };
    
    this.activityVisualizer.setConfig(qualityConfig);
    
    this.state.currentScale = currentScale;
  }

  private updatePerformanceStats(): void {
    if (!this.activityVisualizer) return;
    
    const visualizerStats = this.activityVisualizer.getPerformanceStats();
    const activeFlares = this.activityVisualizer.getActiveFlares();
    
    this.state.performance = {
      frameTime: visualizerStats.avgFrameTime,
      effectCount: activeFlares.length + visualizerStats.coronaComplexity,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    if (!this.activityVisualizer) return 0;
    
    const activeFlares = this.activityVisualizer.getActiveFlares();
    const performanceStats = this.activityVisualizer.getPerformanceStats();
    
    // Rough estimate: each flare ~1MB, each corona layer ~0.5MB
    return (activeFlares.length * 1.0) + (performanceStats.coronaComplexity * 0.5);
  }

  // Public API methods
  
  /**
   * Update the solar system scale and optimize activity visualization accordingly
   */
  public updateScale(newScale: ScaleContext): void {
    if (this.state.currentScale === newScale) return;
    
    this.state.currentScale = newScale;
    this.optimizeForCurrentScale();
  }

  /**
   * Retry initialization if it was deferred due to missing sun mesh
   */
  public async retryInitialization(): Promise<boolean> {
    if (this.state.isActive || this.activityVisualizer) {
      return true; // Already initialized
    }
    
    try {
      await this.initializeIntegration();
      return this.state.isActive;
    } catch (error) {
      console.warn('Retry initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current solar activity state
   */
  public getState(): SolarActivityState {
    return { ...this.state };
  }

  /**
   * Get current space weather summary from NOAA
   */
  public async getCurrentSpaceWeather() {
    return await this.noaaService.getSpaceWeatherSummary();
  }

  /**
   * Get active solar flares
   */
  public async getActiveSolarFlares() {
    return await this.noaaService.getSolarFlares();
  }

  /**
   * Update integration configuration
   */
  public updateConfig(newConfig: Partial<SolarActivityIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply configuration changes
    if (this.activityVisualizer && newConfig.solarActivity) {
      this.activityVisualizer.setConfig(newConfig.solarActivity);
    }
    
    if (newConfig.noaaUpdateInterval && this.updateTimer) {
      clearInterval(this.updateTimer);
      this.startRealTimeUpdates();
    }
  }

  /**
   * Enable or disable real-time updates
   */
  public setRealTimeUpdates(enabled: boolean): void {
    this.config.enableRealTimeUpdates = enabled;
    
    if (enabled && !this.updateTimer) {
      this.startRealTimeUpdates();
    } else if (!enabled && this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
  }

  /**
   * Manually trigger a solar activity update
   */
  public async forceUpdate(): Promise<void> {
    await this.updateSolarActivity();
  }

  /**
   * Pause all solar activity effects
   */
  public pause(): void {
    if (this.activityVisualizer) {
      this.activityVisualizer.pause();
    }
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
    
    this.state.isActive = false;
  }

  /**
   * Resume solar activity effects
   */
  public resume(): void {
    if (this.activityVisualizer) {
      this.activityVisualizer.resume();
    }
    
    if (this.config.enableRealTimeUpdates && !this.updateTimer) {
      this.startRealTimeUpdates();
    }
    
    this.state.isActive = true;
  }

  /**
   * Check if solar activity integration is currently active
   */
  public isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats() {
    return { ...this.state.performance };
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
    
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = undefined;
    }
    
    if (this.activityVisualizer) {
      this.activityVisualizer.dispose();
      this.activityVisualizer = undefined;
    }
    
    this.noaaService.dispose();
    
    this.state.isActive = false;
  }
}
