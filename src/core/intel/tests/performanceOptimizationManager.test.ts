/**
 * PerformanceOptimizationManager tests
 * 
 * @deprecated These tests are for the deprecated performanceOptimizationManager module
 * which is being replaced by operationTracker. These tests are kept for historical
 * reference and will be removed in a future update.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceOptimizationManager } from '../storage/performanceOptimizationManager';
import { BaseEntity } from '../types/intelDataModels';

// Mock performance.now
const originalPerformanceNow = performance.now;
let mockTime = 1000;

vi.spyOn(performance, 'now').mockImplementation(() => {
  return mockTime;
});

// Helper to advance mock time
function advanceTime(ms: number) {
  mockTime += ms;
}

describe('PerformanceOptimizationManager', () => {
  beforeEach(() => {
    // Reset the manager's internal state
    // @ts-ignore - accessing private property for testing
    performanceOptimizationManager.initialized = false;
    // @ts-ignore - accessing private property for testing
    performanceOptimizationManager.performanceMetrics = [];
    // @ts-ignore - accessing private property for testing
    performanceOptimizationManager.queryPatterns = new Map();
    // @ts-ignore - accessing private property for testing
    performanceOptimizationManager.entityAccessPatterns = new Map();
    
    // Reset mock time
    mockTime = 1000;
  });
  
  afterAll(() => {
    // Restore original performance.now
    performance.now = originalPerformanceNow;
  });
  
  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await performanceOptimizationManager.initialize();
      
      // @ts-ignore - accessing private property for testing
      expect(performanceOptimizationManager.initialized).toBe(true);
    });
  });
  
  describe('performance tracking', () => {
    it('should track operation performance', async () => {
      await performanceOptimizationManager.initialize();
      
      const operationId = performanceOptimizationManager.startOperation('query');
      
      // Simulate operation time
      advanceTime(150);
      
      const metrics = performanceOptimizationManager.endOperation(operationId, {
        entityCount: 100,
        queryComplexity: 3,
        cacheHit: false
      });
      
      expect(metrics).toBeDefined();
      expect(metrics!.operationType).toBe('query');
      expect(metrics!.duration).toBe(150);
      expect(metrics!.entityCount).toBe(100);
      expect(metrics!.queryComplexity).toBe(3);
      expect(metrics!.cacheHit).toBe(false);
    });
    
    it('should generate a performance report', async () => {
      await performanceOptimizationManager.initialize();
      
      // Track several operations
      const op1 = performanceOptimizationManager.startOperation('query');
      advanceTime(100);
      performanceOptimizationManager.endOperation(op1, { cacheHit: true });
      
      const op2 = performanceOptimizationManager.startOperation('query');
      advanceTime(200);
      performanceOptimizationManager.endOperation(op2, { cacheHit: false });
      
      const op3 = performanceOptimizationManager.startOperation('store');
      advanceTime(50);
      performanceOptimizationManager.endOperation(op3, { entityCount: 1 });
      
      // Track entity access
      performanceOptimizationManager.trackEntityAccess('entity1');
      performanceOptimizationManager.trackEntityAccess('entity1');
      performanceOptimizationManager.trackEntityAccess('entity2');
      
      // Generate report
      const report = performanceOptimizationManager.getPerformanceReport();
      
      expect(report).toBeDefined();
      expect(report.metrics.totalOperations).toBe(3);
      expect(report.metrics.uniqueOperationTypes).toContain('query');
      expect(report.metrics.uniqueOperationTypes).toContain('store');
      
      // Check if cache hit ratio is calculated correctly
      expect(report.metrics.cacheHitRatio).toBe(0.5); // 1 out of 2 queries hit cache
      
      // Check if top accessed entities are tracked
      expect(report.metrics.topAccessedEntities).toHaveLength(2);
      expect(report.metrics.topAccessedEntities[0][0]).toBe('entity1');
      expect(report.metrics.topAccessedEntities[0][1]).toBe(2);
      expect(report.metrics.topAccessedEntities[1][0]).toBe('entity2');
      expect(report.metrics.topAccessedEntities[1][1]).toBe(1);
    });
  });
  
  describe('data windowing', () => {
    it('should create appropriate data windows for large datasets', async () => {
      await performanceOptimizationManager.initialize();
      
      // Create sample data
      const sampleData: BaseEntity[] = Array(5000).fill(null).map((_, i) => ({
        id: `entity-${i}`,
        type: 'test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        metadata: {}
      }));
      
      // Set a smaller window size for testing
      const windows = performanceOptimizationManager.createDataWindows(sampleData, {
        windowSize: 1000,
        maxWindowCount: 3
      });
      
      expect(windows).toBeDefined();
      expect(windows.length).toBe(3); // Should be limited by maxWindowCount
      expect(windows[0].length).toBe(1000);
      expect(windows[1].length).toBe(1000);
      expect(windows[2].length).toBe(1000);
    });
    
    it('should return a single window for small datasets', async () => {
      await performanceOptimizationManager.initialize();
      
      // Create small sample data
      const sampleData: BaseEntity[] = Array(50).fill(null).map((_, i) => ({
        id: `entity-${i}`,
        type: 'test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        metadata: {}
      }));
      
      const windows = performanceOptimizationManager.createDataWindows(sampleData, {
        windowSize: 1000
      });
      
      expect(windows).toBeDefined();
      expect(windows.length).toBe(1);
      expect(windows[0].length).toBe(50);
    });
  });
  
  describe('virtualization', () => {
    it('should return appropriate virtualized data slices', async () => {
      await performanceOptimizationManager.initialize();
      
      // Create sample data
      const sampleData: BaseEntity[] = Array(1000).fill(null).map((_, i) => ({
        id: `entity-${i}`,
        type: 'test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        metadata: {}
      }));
      
      // Get first chunk
      const firstChunk = performanceOptimizationManager.getVirtualizedData(sampleData, 0, {
        initialChunkSize: 50,
        subsequentChunkSize: 30
      });
      
      expect(firstChunk).toBeDefined();
      expect(firstChunk.length).toBe(50); // Initial chunk size
      
      // Get a chunk in the middle
      const middleChunk = performanceOptimizationManager.getVirtualizedData(sampleData, 100, {
        initialChunkSize: 50,
        subsequentChunkSize: 30
      });
      
      expect(middleChunk).toBeDefined();
      expect(middleChunk.length).toBe(30); // Subsequent chunk size
      expect(middleChunk[0].id).toBe('entity-90'); // Starting from chunk boundary
    });
    
    it('should prefetch next chunk when approaching end of current chunk', async () => {
      await performanceOptimizationManager.initialize();
      
      // Create sample data
      const sampleData: BaseEntity[] = Array(1000).fill(null).map((_, i) => ({
        id: `entity-${i}`,
        type: 'test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        metadata: {}
      }));
      
      // Get chunk when near the end of current chunk (should prefetch)
      const nearEndChunk = performanceOptimizationManager.getVirtualizedData(sampleData, 49, {
        initialChunkSize: 50,
        subsequentChunkSize: 30,
        prefetchThreshold: 0.8
      });
      
      expect(nearEndChunk).toBeDefined();
      // Should include current chunk + prefetch of next chunk
      expect(nearEndChunk.length).toBe(80); // 50 + 30
    });
  });
  
  describe('query optimization', () => {
    it('should suggest query optimizations for unbounded queries', async () => {
      await performanceOptimizationManager.initialize();
      
      const originalQuery = {};
      
      const suggestion = performanceOptimizationManager.optimizeQuery(originalQuery);
      
      expect(suggestion).toBeDefined();
      expect(suggestion!.suggestedQuery.limit).toBe(100);
      expect(suggestion!.reason).toContain('Adding a limit');
    });
    
    it('should suggest reducing large date ranges', async () => {
      await performanceOptimizationManager.initialize();
      
      const startDate = new Date('2025-01-01').toISOString();
      const endDate = new Date('2025-06-01').toISOString(); // 5 months later
      
      const originalQuery = {
        startDate,
        endDate
      };
      
      const suggestion = performanceOptimizationManager.optimizeQuery(originalQuery);
      
      expect(suggestion).toBeDefined();
      expect(suggestion!.reason).toContain('Limiting date range');
      
      // The suggested end date should be about 30 days after the start date
      const suggestedEndDate = new Date(suggestion!.suggestedQuery.endDate!);
      const suggestedStartDate = new Date(startDate);
      const daysDiff = (suggestedEndDate.getTime() - suggestedStartDate.getTime()) / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeCloseTo(30, 0);
    });
  });
});
