/**
 * Performance utilities for CyberAttacks visualization
 * Provides frame rate monitoring, memory management, and optimization helpers
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  activeAnimations: number;
  droppedFrames: number;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private currentFps = 0;
  private frameTimes: number[] = [];
  private maxFrameTimes = 60;
  private droppedFrames = 0;
  private targetFrameTime = 16.67; // 60 FPS target

  /**
   * Update performance metrics each frame
   */
  update(deltaTime: number): PerformanceMetrics {
    this.frameCount++;
    const now = performance.now();
    
    // Calculate FPS
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Track frame times
    const frameTime = deltaTime * 1000; // Convert to milliseconds
    this.frameTimes.push(frameTime);
    
    if (this.frameTimes.length > this.maxFrameTimes) {
      this.frameTimes.shift();
    }

    // Count dropped frames
    if (frameTime > this.targetFrameTime * 1.5) {
      this.droppedFrames++;
    }

    return {
      fps: this.currentFps,
      frameTime: this.getAverageFrameTime(),
      memoryUsage: this.estimateMemoryUsage(),
      activeAnimations: 0, // Will be set by caller
      droppedFrames: this.droppedFrames
    };
  }

  private getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage in KB
    if ('memory' in performance) {
      const perfWithMemory = performance as Performance & {
        memory?: { usedJSHeapSize: number };
      };
      return perfWithMemory.memory?.usedJSHeapSize ? perfWithMemory.memory.usedJSHeapSize / 1024 : 0;
    }
    return 0;
  }

  /**
   * Check if performance is degrading
   */
  isPerformanceDegraded(): boolean {
    return this.currentFps < 30 || this.getAverageFrameTime() > 20;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.currentFps < 30) {
      recommendations.push('Consider reducing animation quality or count');
    }

    if (this.getAverageFrameTime() > 20) {
      recommendations.push('Frame time is high, optimize render complexity');
    }

    if (this.droppedFrames > 10) {
      recommendations.push('Many dropped frames detected, check system load');
    }

    return recommendations;
  }

  reset(): void {
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    this.frameTimes = [];
    this.droppedFrames = 0;
  }
}

/**
 * Animation frame throttling utility
 */
export class FrameThrottler {
  private lastFrameTime = 0;
  private targetInterval: number;

  constructor(targetFps: number = 60) {
    this.targetInterval = 1000 / targetFps;
  }

  /**
   * Check if enough time has passed for next frame
   */
  shouldUpdate(currentTime: number): boolean {
    if (currentTime - this.lastFrameTime >= this.targetInterval) {
      this.lastFrameTime = currentTime;
      return true;
    }
    return false;
  }

  setTargetFps(fps: number): void {
    this.targetInterval = 1000 / fps;
  }
}

/**
 * Object pool for reusing expensive objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;

  constructor(createFunction: () => T, resetFunction?: (obj: T) => void, initialSize: number = 10) {
    this.createFn = createFunction;
    this.resetFn = resetFunction;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Get object from pool or create new one
   */
  get(): T {
    const obj = this.pool.pop();
    if (obj) {
      return obj;
    }
    return this.createFn();
  }

  /**
   * Return object to pool for reuse
   */
  release(obj: T): void {
    if (this.resetFn) {
      this.resetFn(obj);
    }
    this.pool.push(obj);
  }

  /**
   * Get pool statistics
   */
  getStats(): { available: number; maxSize: number } {
    return {
      available: this.pool.length,
      maxSize: this.pool.length + 10 // Estimate
    };
  }

  clear(): void {
    this.pool.length = 0;
  }
}

/**
 * Level of Detail (LOD) manager for performance optimization
 */
export class LODManager {
  private thresholds = {
    high: 60,    // Above 60 FPS - full quality
    medium: 30,  // 30-60 FPS - reduced quality
    low: 15      // Below 15 FPS - minimal quality
  };

  /**
   * Get current LOD level based on performance
   */
  getLODLevel(fps: number): 'high' | 'medium' | 'low' {
    if (fps >= this.thresholds.high) return 'high';
    if (fps >= this.thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Get animation settings for current LOD level
   */
  getAnimationSettings(lodLevel: 'high' | 'medium' | 'low'): {
    maxAnimations: number;
    animationQuality: number;
    updateFrequency: number;
  } {
    switch (lodLevel) {
      case 'high':
        return {
          maxAnimations: 50,
          animationQuality: 1.0,
          updateFrequency: 60
        };
      case 'medium':
        return {
          maxAnimations: 25,
          animationQuality: 0.7,
          updateFrequency: 30
        };
      case 'low':
        return {
          maxAnimations: 10,
          animationQuality: 0.5,
          updateFrequency: 15
        };
    }
  }
}

/**
 * Batch processor for efficient updates
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private processFn: (items: T[]) => void;
  private batchSize: number;
  private timeout: number | null = null;

  constructor(
    processFunction: (items: T[]) => void,
    batchSize: number = 10,
    private maxWaitTime: number = 100
  ) {
    this.processFn = processFunction;
    this.batchSize = batchSize;
  }

  /**
   * Add item to batch for processing
   */
  add(item: T): void {
    this.batch.push(item);

    // Process if batch is full
    if (this.batch.length >= this.batchSize) {
      this.flush();
      return;
    }

    // Set timeout for partial batch
    if (this.timeout === null) {
      this.timeout = window.setTimeout(() => {
        this.flush();
      }, this.maxWaitTime);
    }
  }

  /**
   * Process current batch immediately
   */
  flush(): void {
    if (this.batch.length === 0) return;

    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const currentBatch = [...this.batch];
    this.batch.length = 0;
    this.processFn(currentBatch);
  }

  /**
   * Get current batch size
   */
  getCurrentBatchSize(): number {
    return this.batch.length;
  }

  clear(): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.batch.length = 0;
  }
}

/**
 * Combined performance optimizer
 */
export class PerformanceOptimizer {
  private monitor = new PerformanceMonitor();
  private throttler = new FrameThrottler(60);
  private lodManager = new LODManager();

  private lastMetrics: PerformanceMetrics | null = null;
  private adaptiveMode = true;

  /**
   * Update performance and get current metrics
   */
  update(deltaTime: number, activeAnimations: number): {
    metrics: PerformanceMetrics;
    lodLevel: 'high' | 'medium' | 'low';
    shouldUpdate: boolean;
    recommendations: string[];
  } {
    const currentTime = performance.now();
    const shouldUpdate = this.throttler.shouldUpdate(currentTime);

    if (!shouldUpdate && !this.adaptiveMode) {
      return {
        metrics: this.lastMetrics || this.getDefaultMetrics(),
        lodLevel: 'medium',
        shouldUpdate: false,
        recommendations: []
      };
    }

    const metrics = this.monitor.update(deltaTime);
    metrics.activeAnimations = activeAnimations;
    this.lastMetrics = metrics;

    const lodLevel = this.lodManager.getLODLevel(metrics.fps);
    
    // Adaptive frame rate based on performance
    if (this.adaptiveMode) {
      if (metrics.fps < 30) {
        this.throttler.setTargetFps(30); // Reduce target FPS
      } else if (metrics.fps > 50) {
        this.throttler.setTargetFps(60); // Restore full FPS
      }
    }

    return {
      metrics,
      lodLevel,
      shouldUpdate: true,
      recommendations: this.monitor.getRecommendations()
    };
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      activeAnimations: 0,
      droppedFrames: 0
    };
  }

  /**
   * Enable/disable adaptive performance mode
   */
  setAdaptiveMode(enabled: boolean): void {
    this.adaptiveMode = enabled;
    if (enabled) {
      this.throttler.setTargetFps(60);
    }
  }

  /**
   * Get animation settings for current performance level
   */
  getOptimalSettings(): {
    maxAnimations: number;
    animationQuality: number;
    updateFrequency: number;
  } {
    const fps = this.lastMetrics?.fps || 60;
    const lodLevel = this.lodManager.getLODLevel(fps);
    return this.lodManager.getAnimationSettings(lodLevel);
  }

  reset(): void {
    this.monitor.reset();
    this.lastMetrics = null;
  }
}
