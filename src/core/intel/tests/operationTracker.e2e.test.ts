/**
 * End-to-End tests for the OperationTracker
 * 
 * These tests verify that the operationTracker properly replaces all
 * functionality previously provided by the performanceOptimizationManager
 * in real-world application scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { operationTracker } from '../performance/operationTracker';
import { StorageOrchestrator } from '../storage/storageOrchestrator';
import { IntelEntity, IntelQueryOptions } from '../types/intelDataModels';

// Mock dependencies
vi.mock('../storage/indexedDBAdapter', () => ({
  default: {
    storeEntity: vi.fn().mockResolvedValue(true),
    queryEntities: vi.fn().mockResolvedValue([]),
    getEntityById: vi.fn().mockResolvedValue(null),
    deleteEntity: vi.fn().mockResolvedValue(true),
    initialize: vi.fn().mockResolvedValue(true),
  }
}));

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

// Create test entities
const createTestEntity = (id: string): IntelEntity => ({
  id,
  type: 'testEntity',
  name: `Test Entity ${id}`,
  metadata: {
    createdAt: new Date().toISOString(),
    tags: ['test', 'e2e']
  },
  coordinates: {
    latitude: 0,
    longitude: 0
  },
  content: {
    description: `Description for test entity ${id}`
  }
});

describe('OperationTracker E2E Tests', () => {
  let storageOrchestrator: StorageOrchestrator;

  beforeEach(async () => {
    // Reset the tracker state
    operationTracker.clearMetrics();
    operationTracker.clearAccessPatterns();
    mockTime = 1000;
    
    // Initialize storage orchestrator
    storageOrchestrator = new StorageOrchestrator();
    await storageOrchestrator.initialize();
    
    // Clear spy mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    vi.resetAllMocks();
  });

  it('should track full entity lifecycle operations', async () => {
    // Create test entity
    const entity = createTestEntity('e2e-test-1');
    
    // Before any operations, metrics should be empty
    expect(operationTracker.getMetrics()).toHaveLength(0);
    
    // Store entity
    await storageOrchestrator.storeEntity(entity);
    
    // Advance time to simulate delay
    advanceTime(100);
    
    // Query for entity
    const queryOptions: IntelQueryOptions = {
      type: 'testEntity',
      limit: 10
    };
    await storageOrchestrator.queryEntities(queryOptions);
    
    // Advance time
    advanceTime(50);
    
    // Get entity by ID
    await storageOrchestrator.getEntityById('e2e-test-1');
    
    // Advance time
    advanceTime(200);
    
    // Delete entity
    await storageOrchestrator.deleteEntity('e2e-test-1');
    
    // Check metrics
    const metrics = operationTracker.getMetrics();
    
    // Should have at least 4 operations (store, query, get, delete)
    expect(metrics.length).toBeGreaterThanOrEqual(4);
    
    // Verify operation types
    const operationTypes = metrics.map(m => m.operationType);
    expect(operationTypes).toContain('storeEntity');
    expect(operationTypes).toContain('queryEntities');
    expect(operationTypes).toContain('getEntityById');
    expect(operationTypes).toContain('deleteEntity');
    
    // All operations should have valid durations
    metrics.forEach(metric => {
      expect(metric.duration).toBeGreaterThanOrEqual(0);
      expect(metric.startTime).toBeLessThan(metric.endTime);
    });
  });

  it('should track and report performance metrics across operations', async () => {
    // Create and store multiple entities
    const entities = Array.from({ length: 5 }, (_, i) => createTestEntity(`e2e-test-${i}`));
    
    // Track performance of batch operations
    const batchOpId = operationTracker.startOperation('batchStoreEntities');
    
    // Store each entity
    for (const entity of entities) {
      await storageOrchestrator.storeEntity(entity);
      advanceTime(50); // Simulate processing time
    }
    
    // End the batch operation
    operationTracker.endOperation(batchOpId, { entityCount: entities.length });
    
    // Run a complex query
    await storageOrchestrator.queryEntities({
      type: 'testEntity',
      filters: [
        { field: 'metadata.tags', operator: 'contains', value: 'test' }
      ],
      sortBy: 'name',
      sortDirection: 'asc',
      limit: 10
    });
    
    // Get performance report
    const report = operationTracker.generatePerformanceReport();
    
    // Verify report structure
    expect(report).toHaveProperty('metrics');
    expect(report.metrics).toHaveProperty('totalOperations');
    expect(report.metrics).toHaveProperty('averageOperationTime');
    expect(report.metrics).toHaveProperty('slowestOperation');
    
    // Verify entity tracking
    const accessPatterns = operationTracker.getEntityAccessPatterns();
    entities.forEach(entity => {
      // Each entity should have been accessed at least once
      expect(accessPatterns.get(entity.id)).toBeGreaterThan(0);
    });
  });

  it('should detect slow operations and resource pressure', async () => {
    // Mock a slow operation
    const slowOpId = operationTracker.startOperation('slowOperation');
    advanceTime(1000); // 1 second operation - should be considered slow
    operationTracker.endOperation(slowOpId);
    
    // Get slow operations
    const slowOperations = operationTracker.getSlowOperations(500); // Threshold 500ms
    
    // Verify slow operation detection
    expect(slowOperations.length).toBeGreaterThan(0);
    expect(slowOperations[0].operationType).toBe('slowOperation');
    expect(slowOperations[0].duration).toBeGreaterThanOrEqual(1000);
    
    // Simulate resource pressure
    const highMemoryUsage = 85; // 85%
    const highCpuUsage = 90; // 90%
    
    // Mock memory and CPU usage
    vi.spyOn(operationTracker, 'getCurrentMemoryUsage').mockReturnValue(highMemoryUsage);
    vi.spyOn(operationTracker, 'getCurrentCpuUsage').mockReturnValue(highCpuUsage);
    
    // Take resource snapshot
    operationTracker.takeResourceSnapshot();
    
    // Verify resource pressure detection
    const resourcePressure = operationTracker.detectResourcePressure();
    expect(resourcePressure.memoryPressure).toBe(true);
    expect(resourcePressure.cpuPressure).toBe(true);
    
    // Verify optimization recommendations
    const optimizations = operationTracker.getOptimizationRecommendations();
    expect(optimizations.length).toBeGreaterThan(0);
  });

  it('should provide equivalent functionality to the deprecated performanceOptimizationManager', async () => {
    // Start complex operation
    const complexOpId = operationTracker.startOperation('complexOperation', {
      complexity: 'high',
      dataSize: 'large',
      importance: 'critical'
    });
    
    // Simulate sub-operations
    const subOp1Id = operationTracker.startOperation('subOperation1');
    advanceTime(100);
    operationTracker.endOperation(subOp1Id, { result: 'success' });
    
    const subOp2Id = operationTracker.startOperation('subOperation2');
    advanceTime(200);
    operationTracker.endOperation(subOp2Id, { result: 'partial' });
    
    // End complex operation
    advanceTime(50);
    operationTracker.endOperation(complexOpId, { 
      entityCount: 50,
      dataSize: 1024 * 1024, // 1MB
      status: 'completed'
    });
    
    // Get performance snapshot
    const snapshot = operationTracker.getPerformanceSnapshot();
    
    // Verify snapshot
    expect(snapshot).toHaveProperty('timestamp');
    expect(snapshot).toHaveProperty('metrics');
    expect(snapshot.metrics).toHaveProperty('memoryUsage');
    expect(snapshot.metrics).toHaveProperty('cpuUsage');
    expect(snapshot.metrics).toHaveProperty('activeOperations');
    expect(snapshot.metrics).toHaveProperty('completedOperations');
    
    // Verify that we can get detailed operation metrics
    const operationMetrics = operationTracker.getDetailedMetricsForOperation('complexOperation');
    expect(operationMetrics.length).toBeGreaterThan(0);
    expect(operationMetrics[0].additionalMetrics).toHaveProperty('entityCount');
    expect(operationMetrics[0].additionalMetrics).toHaveProperty('dataSize');
    
    // Verify caching capability
    operationTracker.recordQueryExecution('testQuery', true); // Cache hit
    operationTracker.recordQueryExecution('testQuery', false); // Cache miss
    
    const cacheStats = operationTracker.getQueryCacheStats();
    expect(cacheStats).toHaveProperty('hitRate');
    expect(cacheStats.hitRate).toBe(0.5); // 1 hit, 1 miss = 50% hit rate
  });
});
