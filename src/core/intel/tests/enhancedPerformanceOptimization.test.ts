/**
 * Enhanced PerformanceOptimizationManager tests
 * 
 * @deprecated These tests cover the deprecated performanceOptimizationManager
 * which is being replaced by operationTracker. These tests are kept for historical
 * reference and will be removed in a future update.
 * 
 * These tests cover the advanced features of the performance optimization manager,
 * including advanced caching, resource pressure detection, lazy loading, and dynamic
 * optimization.
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

// Mock localStorage
const mockLocalStorage = {
  storage: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.storage.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockLocalStorage.storage.delete(key);
  }),
  clear: vi.fn(() => {
    mockLocalStorage.storage.clear();
  })
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage
});

// Mock window.setInterval and window.clearInterval
const mockIntervals = new Map<number, NodeJS.Timeout>();
let mockIntervalId = 1;

vi.spyOn(global, 'setInterval').mockImplementation((callback, ms) => {
  const id = mockIntervalId++;
  mockIntervals.set(id, { callback, ms } as any);
  return id;
});

vi.spyOn(global, 'clearInterval').mockImplementation((id) => {
  mockIntervals.delete(id as number);
});

describe('Enhanced PerformanceOptimizationManager', () => {
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
    // @ts-ignore - accessing private property for testing
    if (performanceOptimizationManager.performanceSnapshots) {
      performanceOptimizationManager.performanceSnapshots = [];
    }
    // @ts-ignore - accessing private property for testing
    if (performanceOptimizationManager.resourceUsageHistory) {
      performanceOptimizationManager.resourceUsageHistory = [];
    }
    // @ts-ignore - accessing private property for testing
    if (performanceOptimizationManager.queryCache) {
      performanceOptimizationManager.queryCache = new Map();
    }
    // @ts-ignore - accessing private property for testing
    if (performanceOptimizationManager.queryComplexityCache) {
      performanceOptimizationManager.queryComplexityCache = new Map();
    }
    
    // Reset mock time
    mockTime = 1000;
    
    // Reset localStorage mock
    mockLocalStorage.clear();
    
    // Reset interval mocks
    mockIntervals.clear();
    mockIntervalId = 1;
  });
  
  afterAll(() => {
    // Restore original performance.now
    performance.now = originalPerformanceNow;
  });
  
  describe('advanced caching', () => {
    it('should calculate query complexity correctly', async () => {
      await performanceOptimizationManager.initialize();
      
      // @ts-ignore - Testing private method
      const simpleQuery = { limit: 10 };
      // @ts-ignore - Testing private method
      const complexity1 = performanceOptimizationManager.calculateQueryComplexity(simpleQuery);
      
      const complexQuery = {
        fullTextSearch: "important data",
        types: ["node", "edge", "report"],
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-02-01T00:00:00Z",
        relationshipDepth: 3,
        fields: {
          status: "active",
          category: "intel",
          priority: "high"
        }
      };
      // @ts-ignore - Testing private method
      const complexity2 = performanceOptimizationManager.calculateQueryComplexity(complexQuery);
      
      expect(complexity1).toBeLessThan(complexity2);
      expect(complexity2).toBeGreaterThan(8); // Complex query should have high complexity
    });
    
    it('should decide whether to cache based on query characteristics', async () => {
      await performanceOptimizationManager.initialize();
      
      const simpleQuery = { limit: 10 };
      const complexQuery = {
        fullTextSearch: "important data",
        types: ["node", "edge", "report"],
        graphTraversal: true
      };
      
      // Simple query with small result set shouldn't be cached
      // @ts-ignore - Testing private method
      const shouldCacheSimple = performanceOptimizationManager.shouldCacheQueryResult(simpleQuery, 10);
      
      // Complex query should be cached even with small result set
      // @ts-ignore - Testing private method
      const shouldCacheComplex = performanceOptimizationManager.shouldCacheQueryResult(complexQuery, 10);
      
      // Simple query with large result set should be cached
      // @ts-ignore - Testing private method
      const shouldCacheLarge = performanceOptimizationManager.shouldCacheQueryResult(simpleQuery, 2000);
      
      expect(shouldCacheSimple).toBe(false);
      expect(shouldCacheComplex).toBe(true);
      expect(shouldCacheLarge).toBe(true);
    });
    
    it('should cache and retrieve query results', async () => {
      await performanceOptimizationManager.initialize();
      
      const query = { fullTextSearch: "test data" };
      const result = [{ id: "entity1" }, { id: "entity2" }];
      
      // Cache the result
      // @ts-ignore - Testing private method
      performanceOptimizationManager.cacheQueryResult(query, result);
      
      // Retrieve from cache
      // @ts-ignore - Testing private method
      const { result: cachedResult, hit } = performanceOptimizationManager.getCachedQueryResult(query);
      
      expect(hit).toBe(true);
      expect(cachedResult).toEqual(result);
      
      // Check if localStorage was used
      // @ts-ignore - Testing private method
      if (performanceOptimizationManager.advancedCacheConfig.persistenceEnabled) {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      }
    });
  });
  
  describe('resource monitoring', () => {
    it('should take performance snapshots', async () => {
      await performanceOptimizationManager.initialize();
      
      // Trigger a snapshot manually
      // @ts-ignore - Testing private method
      performanceOptimizationManager.takePerformanceSnapshot();
      
      // @ts-ignore - Accessing private property for testing
      expect(performanceOptimizationManager.performanceSnapshots.length).toBe(1);
      // @ts-ignore - Accessing private property for testing
      expect(performanceOptimizationManager.resourceUsageHistory.length).toBe(1);
      
      // @ts-ignore - Accessing private property for testing
      const snapshot = performanceOptimizationManager.performanceSnapshots[0];
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('memoryUsage');
      expect(snapshot).toHaveProperty('cpuUsage');
      expect(snapshot).toHaveProperty('cacheHitRate');
    });
    
    it('should detect resource pressure and take action', async () => {
      await performanceOptimizationManager.initialize();
      
      // Create a high-memory snapshot
      const highMemorySnapshot = {
        timestamp: Date.now(),
        memoryUsage: 95, // Critical memory usage (95%)
        cpuUsage: 80,
        activeQueries: 5,
        pendingOperations: 10,
        cacheSize: 100,
        cacheHitRate: 0.5,
        averageQueryTime: 200
      };
      
      // Spy on the emergency recovery method
      // @ts-ignore - Testing private method
      const recoverySpy = vi.spyOn(performanceOptimizationManager, 'performEmergencyMemoryRecovery');
      
      // Trigger resource pressure detection
      // @ts-ignore - Testing private method
      performanceOptimizationManager.detectResourcePressure(highMemorySnapshot);
      
      // Check if emergency recovery was triggered
      expect(recoverySpy).toHaveBeenCalled();
    });
  });
  
  describe('lazy loading', () => {
    it('should perform lazy loading of entity fields', async () => {
      await performanceOptimizationManager.initialize();
      
      // Create a test entity with some fields
      const entity: BaseEntity = {
        id: "test-entity",
        type: "test",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
        metadata: {}
      };
      
      // Create a mock load function
      const loadFunction = vi.fn().mockImplementation((id: string, fields: string[]) => {
        const result: Record<string, any> = {};
        for (const field of fields) {
          if (field === 'title') result.title = 'Test Title';
          if (field === 'description') result.description = 'Test Description';
          if (field === 'fullContent') result.fullContent = 'This is the full content of the test entity.';
        }
        return Promise.resolve(result);
      });
      
      // @ts-ignore - Testing private method with custom property
      performanceOptimizationManager.lazyLoadConfig = {
        enabled: true,
        batchSize: 50,
        delayBetweenBatches: 10, // Short delay for testing
        priorityFields: ['id', 'type', 'title'],
        secondaryFields: ['description', 'metadata'],
        deferredFields: ['fullContent'],
        maxConcurrentLoads: 3
      };
      
      // Perform lazy loading
      // @ts-ignore - Testing private method
      const resultPromise = performanceOptimizationManager.lazyLoadEntityFields(
        entity,
        loadFunction
      );
      
      // Initial call should load priority fields
      expect(loadFunction).toHaveBeenCalledWith("test-entity", ["title"]);
      
      // Wait for the result
      const result = await resultPromise;
      
      // Result should have the priority field
      expect(result.title).toBe('Test Title');
      
      // Wait for secondary fields to load
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should have made a second call for secondary fields
      expect(loadFunction).toHaveBeenCalledWith("test-entity", ["description"]);
      
      // Wait for deferred fields to load
      await new Promise(resolve => setTimeout(resolve, 40));
      
      // Should have made a third call for deferred fields
      expect(loadFunction).toHaveBeenCalledWith("test-entity", ["fullContent"]);
    });
  });
  
  describe('automatic optimization', () => {
    it('should adjust virtualization settings based on performance', async () => {
      await performanceOptimizationManager.initialize();
      
      // @ts-ignore - Testing private method with custom property
      performanceOptimizationManager.virtualizationOptions = {
        enabled: true,
        initialChunkSize: 50,
        subsequentChunkSize: 20,
        prefetchThreshold: 0.8,
        maxCachedChunks: 10,
        recycleDOM: true,
        dynamicChunkSize: true
      };
      
      // @ts-ignore - Testing private property
      performanceOptimizationManager.performanceSnapshots = [
        { timestamp: Date.now() - 5000, memoryUsage: 85, cpuUsage: 80, activeQueries: 10, pendingOperations: 15, cacheSize: 100, cacheHitRate: 0.5, averageQueryTime: 300 },
        { timestamp: Date.now() - 4000, memoryUsage: 82, cpuUsage: 78, activeQueries: 8, pendingOperations: 12, cacheSize: 100, cacheHitRate: 0.5, averageQueryTime: 290 },
        { timestamp: Date.now() - 3000, memoryUsage: 80, cpuUsage: 75, activeQueries: 7, pendingOperations: 10, cacheSize: 100, cacheHitRate: 0.5, averageQueryTime: 280 },
        { timestamp: Date.now() - 2000, memoryUsage: 83, cpuUsage: 77, activeQueries: 9, pendingOperations: 13, cacheSize: 100, cacheHitRate: 0.5, averageQueryTime: 295 },
        { timestamp: Date.now() - 1000, memoryUsage: 84, cpuUsage: 79, activeQueries: 10, pendingOperations: 14, cacheSize: 100, cacheHitRate: 0.5, averageQueryTime: 305 }
      ];
      
      // Record original settings
      const originalInitialChunkSize = performanceOptimizationManager.virtualizationOptions.initialChunkSize;
      const originalSubsequentChunkSize = performanceOptimizationManager.virtualizationOptions.subsequentChunkSize;
      
      // Trigger automatic optimization with aggressive mode
      // @ts-ignore - Testing private method
      performanceOptimizationManager.adjustVirtualizationSettings(true);
      
      // Expect chunk sizes to be reduced due to high memory/CPU usage
      expect(performanceOptimizationManager.virtualizationOptions.initialChunkSize).toBeLessThan(originalInitialChunkSize);
      expect(performanceOptimizationManager.virtualizationOptions.subsequentChunkSize).toBeLessThan(originalSubsequentChunkSize);
    });
    
    it('should prune cache based on priority', async () => {
      await performanceOptimizationManager.initialize();
      
      // @ts-ignore - Setup test cache
      performanceOptimizationManager.queryCache = new Map();
      
      // Add some cache entries with varying access counts and timestamps
      const items = [
        { key: 'query1', data: [1, 2, 3], timestamp: Date.now() - 10000, accessCount: 10 },
        { key: 'query2', data: [4, 5, 6], timestamp: Date.now() - 500000, accessCount: 2 },
        { key: 'query3', data: [7, 8, 9], timestamp: Date.now() - 100000, accessCount: 5 },
        { key: 'query4', data: [10, 11, 12], timestamp: Date.now() - 300000, accessCount: 1 }
      ];
      
      for (const item of items) {
        // @ts-ignore - Setup test cache
        performanceOptimizationManager.queryCache.set(item.key, {
          data: item.data,
          timestamp: item.timestamp,
          accessCount: item.accessCount
        });
      }
      
      // @ts-ignore - Setup test config
      performanceOptimizationManager.advancedCacheConfig = {
        ttl: 600000, // 10 minutes
        maxSize: 3, // Only keep 3 items
        priorityFunction: (key, accessCount, lastAccess) => {
          const recencyScore = (Date.now() - lastAccess) / 1000;
          return accessCount * 10 - recencyScore;
        },
        compressionEnabled: false,
        persistenceEnabled: false,
        analyticsEnabled: true
      };
      
      // Trigger cache pruning
      // @ts-ignore - Testing private method
      performanceOptimizationManager.pruneCache();
      
      // Check that the cache was pruned properly
      // @ts-ignore - Accessing private property
      expect(performanceOptimizationManager.queryCache.size).toBe(3);
      
      // The least accessed and oldest entry should be removed (query4)
      // @ts-ignore - Accessing private property
      expect(performanceOptimizationManager.queryCache.has('query4')).toBe(false);
      
      // The most accessed entry should be kept (query1)
      // @ts-ignore - Accessing private property
      expect(performanceOptimizationManager.queryCache.has('query1')).toBe(true);
    });
  });
  
  describe('detailed performance reporting', () => {
    it('should provide enhanced performance reports', async () => {
      await performanceOptimizationManager.initialize();
      
      // Track some operations
      const op1 = performanceOptimizationManager.startOperation('query', { types: ['entity1'] });
      advanceTime(100);
      performanceOptimizationManager.endOperation(op1, { cacheHit: true, entityCount: 50 });
      
      const op2 = performanceOptimizationManager.startOperation('query', { types: ['entity2'] });
      advanceTime(200);
      performanceOptimizationManager.endOperation(op2, { cacheHit: false, entityCount: 100 });
      
      const op3 = performanceOptimizationManager.startOperation('store');
      advanceTime(50);
      performanceOptimizationManager.endOperation(op3, { entityCount: 1 });
      
      // Track entity access
      performanceOptimizationManager.trackEntityAccess('entity1');
      performanceOptimizationManager.trackEntityAccess('entity1');
      performanceOptimizationManager.trackEntityAccess('entity2');
      
      // Trigger a snapshot
      // @ts-ignore - Testing private method
      performanceOptimizationManager.takePerformanceSnapshot();
      
      // Get the enhanced report
      const report = performanceOptimizationManager.getPerformanceReport();
      
      // Check basic metrics
      expect(report.metrics.totalOperations).toBe(3);
      expect(report.metrics.uniqueOperationTypes).toContain('query');
      expect(report.metrics.uniqueOperationTypes).toContain('store');
      expect(report.metrics.cacheHitRatio).toBe(0.5); // 1 out of 2 queries hit cache
      
      // Check new fields
      expect(report.resourceUsage).toBeDefined();
      expect(report.resourceUsage!.memory).toBeGreaterThan(0);
      expect(report.optimizationOpportunities).toBeDefined();
    });
  });
  
  describe('cleanup and disposal', () => {
    it('should clean up resources on disposal', async () => {
      await performanceOptimizationManager.initialize();
      
      // Setup some test data
      // @ts-ignore - Setup test data
      performanceOptimizationManager.performanceMetrics = [{ operationType: 'test', startTime: 100, endTime: 200, duration: 100 }];
      // @ts-ignore - Setup test data
      performanceOptimizationManager.performanceSnapshots = [{ timestamp: Date.now(), memoryUsage: 50, cpuUsage: 30, activeQueries: 2, pendingOperations: 5, cacheSize: 10, cacheHitRate: 0.5, averageQueryTime: 100 }];
      // @ts-ignore - Setup test data
      performanceOptimizationManager.resourceUsageHistory = [{ timestamp: Date.now(), memory: 50, cpu: 30 }];
      // @ts-ignore - Setup test data
      performanceOptimizationManager.queryPatterns.set('test', 1);
      // @ts-ignore - Setup test data
      performanceOptimizationManager.entityAccessPatterns.set('entity1', 2);
      
      // Dispose
      // @ts-ignore - Testing private method
      performanceOptimizationManager.dispose();
      
      // Check that everything was cleaned up
      // @ts-ignore - Accessing private properties
      expect(performanceOptimizationManager.performanceMetrics.length).toBe(0);
      // @ts-ignore - Accessing private properties
      expect(performanceOptimizationManager.performanceSnapshots.length).toBe(0);
      // @ts-ignore - Accessing private properties
      expect(performanceOptimizationManager.resourceUsageHistory.length).toBe(0);
      // @ts-ignore - Accessing private properties
      expect(performanceOptimizationManager.queryPatterns.size).toBe(0);
      // @ts-ignore - Accessing private properties
      expect(performanceOptimizationManager.entityAccessPatterns.size).toBe(0);
      
      // Check that intervals were cleared
      expect(mockIntervals.size).toBe(0);
    });
  });
});
