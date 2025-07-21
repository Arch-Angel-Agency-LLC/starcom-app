/**
 * Test suite for CyberAttacks performance optimization components
 * Tests animation manager, performance monitor, and optimization utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PerformanceMonitor, 
  FrameThrottler, 
  ObjectPool, 
  LODManager,
  BatchProcessor,
  PerformanceOptimizer 
} from '../optimizations/PerformanceOptimizer';

describe('CyberAttacks Performance Optimization', () => {
  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      vi.useFakeTimers();
      monitor = new PerformanceMonitor();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('tracks frame rate correctly', () => {
      // Simulate 60 FPS for 1 second
      for (let i = 0; i < 60; i++) {
        const metrics = monitor.update(0.0167); // ~60 FPS
      }

      // Wait for FPS calculation (mocked)
      vi.advanceTimersByTime(1000);
      const metrics = monitor.update(0.0167);
      
      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.frameTime).toBeCloseTo(16.7, 1);
    });

    it('detects performance degradation', () => {
      // Simulate poor performance
      for (let i = 0; i < 10; i++) {
        monitor.update(0.05); // 20 FPS
      }

      expect(monitor.isPerformanceDegraded()).toBe(true);
    });

    it('provides performance recommendations', () => {
      // Simulate poor performance
      for (let i = 0; i < 30; i++) {
        monitor.update(0.05); // 20 FPS, high frame time
      }

      const recommendations = monitor.getRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('animation'))).toBe(true);
    });

    it('resets correctly', () => {
      monitor.update(0.0167);
      monitor.reset();
      
      const metrics = monitor.update(0.0167);
      expect(metrics.droppedFrames).toBe(0);
    });
  });

  describe('FrameThrottler', () => {
    let throttler: FrameThrottler;

    beforeEach(() => {
      throttler = new FrameThrottler(30); // 30 FPS
    });

    it('throttles frame updates correctly', () => {
      const currentTime = performance.now();
      
      // First update should be allowed
      expect(throttler.shouldUpdate(currentTime)).toBe(true);
      
      // Immediate second update should be throttled
      expect(throttler.shouldUpdate(currentTime + 1)).toBe(false);
      
      // Update after target interval should be allowed
      expect(throttler.shouldUpdate(currentTime + 40)).toBe(true);
    });

    it('adjusts target FPS correctly', () => {
      throttler.setTargetFps(60);
      const currentTime = performance.now();
      
      expect(throttler.shouldUpdate(currentTime)).toBe(true);
      expect(throttler.shouldUpdate(currentTime + 10)).toBe(false); // Should be throttled at 60 FPS
      expect(throttler.shouldUpdate(currentTime + 20)).toBe(true);
    });
  });

  describe('ObjectPool', () => {
    let pool: ObjectPool<{ value: number }>;

    beforeEach(() => {
      pool = new ObjectPool(
        () => ({ value: 0 }),
        (obj) => { obj.value = 0; },
        5
      );
    });

    it('provides objects from pool', () => {
      const obj1 = pool.get();
      const obj2 = pool.get();
      
      expect(obj1).toBeDefined();
      expect(obj2).toBeDefined();
      expect(obj1).not.toBe(obj2);
    });

    it('reuses released objects', () => {
      const obj1 = pool.get();
      obj1.value = 42;
      
      pool.release(obj1);
      const obj2 = pool.get();
      
      expect(obj2).toBe(obj1);
      expect(obj2.value).toBe(0); // Should be reset
    });

    it('creates new objects when pool is empty', () => {
      // Empty the pool
      const objects = [];
      for (let i = 0; i < 10; i++) {
        objects.push(pool.get());
      }
      
      // Should create new object
      const newObj = pool.get();
      expect(newObj).toBeDefined();
    });

    it('provides accurate statistics', () => {
      const stats = pool.getStats();
      expect(stats.available).toBeGreaterThanOrEqual(0);
      expect(stats.maxSize).toBeGreaterThan(0);
    });
  });

  describe('LODManager', () => {
    let lodManager: LODManager;

    beforeEach(() => {
      lodManager = new LODManager();
    });

    it('returns correct LOD levels', () => {
      expect(lodManager.getLODLevel(70)).toBe('high');
      expect(lodManager.getLODLevel(45)).toBe('medium');
      expect(lodManager.getLODLevel(10)).toBe('low');
    });

    it('provides appropriate settings for each LOD level', () => {
      const highSettings = lodManager.getAnimationSettings('high');
      const mediumSettings = lodManager.getAnimationSettings('medium');
      const lowSettings = lodManager.getAnimationSettings('low');
      
      expect(highSettings.maxAnimations).toBeGreaterThan(mediumSettings.maxAnimations);
      expect(mediumSettings.maxAnimations).toBeGreaterThan(lowSettings.maxAnimations);
      
      expect(highSettings.animationQuality).toBeGreaterThan(mediumSettings.animationQuality);
      expect(mediumSettings.animationQuality).toBeGreaterThan(lowSettings.animationQuality);
    });
  });

  describe('BatchProcessor', () => {
    let processor: BatchProcessor<number>;
    let processedBatches: number[][];

    beforeEach(() => {
      processedBatches = [];
      processor = new BatchProcessor<number>(
        (items) => processedBatches.push([...items]),
        3, // batch size
        50  // max wait time
      );
    });

    it('processes full batches immediately', () => {
      processor.add(1);
      processor.add(2);
      processor.add(3);
      
      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0]).toEqual([1, 2, 3]);
    });

    it('processes partial batches after timeout', async () => {
      processor.add(1);
      processor.add(2);
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0]).toEqual([1, 2]);
    });

    it('flushes current batch manually', () => {
      processor.add(1);
      processor.flush();
      
      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0]).toEqual([1]);
    });

    it('tracks current batch size', () => {
      expect(processor.getCurrentBatchSize()).toBe(0);
      
      processor.add(1);
      processor.add(2);
      
      expect(processor.getCurrentBatchSize()).toBe(2);
    });
  });

  describe('PerformanceOptimizer', () => {
    let optimizer: PerformanceOptimizer;

    beforeEach(() => {
      optimizer = new PerformanceOptimizer();
    });

    it('provides comprehensive performance data', () => {
      const result = optimizer.update(0.0167, 10);
      
      expect(result.metrics).toBeDefined();
      expect(result.lodLevel).toBeOneOf(['high', 'medium', 'low']);
      expect(result.shouldUpdate).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('adapts frame rate based on performance', () => {
      optimizer.setAdaptiveMode(true);
      
      // Simulate poor performance
      for (let i = 0; i < 10; i++) {
        optimizer.update(0.05, 20); // 20 FPS
      }
      
      const settings = optimizer.getOptimalSettings();
      expect(settings.maxAnimations).toBeLessThan(50);
    });

    it('provides optimal settings based on performance', () => {
      const settings = optimizer.getOptimalSettings();
      
      expect(settings.maxAnimations).toBeGreaterThan(0);
      expect(settings.animationQuality).toBeGreaterThan(0);
      expect(settings.updateFrequency).toBeGreaterThan(0);
    });

    it('resets correctly', () => {
      optimizer.update(0.0167, 5);
      optimizer.reset();
      
      const result = optimizer.update(0.0167, 5);
      expect(result.metrics.droppedFrames).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('works with combined optimizations', () => {
      const monitor = new PerformanceMonitor();
      const throttler = new FrameThrottler(60);
      const lodManager = new LODManager();
      
      // Simulate animation loop
      const startTime = performance.now();
      let frameCount = 0;
      
      for (let i = 0; i < 10; i++) {
        const currentTime = startTime + (i * 16.67);
        
        if (throttler.shouldUpdate(currentTime)) {
          frameCount++;
          const metrics = monitor.update(0.0167);
          const lodLevel = lodManager.getLODLevel(metrics.fps);
          const settings = lodManager.getAnimationSettings(lodLevel);
          
          expect(settings).toBeDefined();
          expect(lodLevel).toBeOneOf(['high', 'medium', 'low']);
        }
      }
      
      expect(frameCount).toBeGreaterThan(0);
    });
  });
});
