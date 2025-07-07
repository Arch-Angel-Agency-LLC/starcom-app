/**
 * Tests for the OperationTracker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { operationTracker } from '../performance/operationTracker';

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

describe('OperationTracker', () => {
  beforeEach(() => {
    operationTracker.clearMetrics();
    operationTracker.clearAccessPatterns();
    mockTime = 1000;
  });
  
  it('should track operation start and end', () => {
    const operationId = operationTracker.startOperation('query');
    
    advanceTime(100);
    
    const metrics = operationTracker.endOperation(operationId, {
      entityCount: 5,
      cacheHit: true
    });
    
    expect(metrics).not.toBeNull();
    expect(metrics?.operationType).toBe('query');
    expect(metrics?.duration).toBe(100);
    expect(metrics?.entityCount).toBe(5);
    expect(metrics?.cacheHit).toBe(true);
  });
  
  it('should track entity access patterns', () => {
    operationTracker.trackEntityAccess('entity1');
    operationTracker.trackEntityAccess('entity1');
    operationTracker.trackEntityAccess('entity2');
    
    const patterns = operationTracker.getEntityAccessPatterns();
    expect(patterns.get('entity1')).toBe(2);
    expect(patterns.get('entity2')).toBe(1);
  });
  
  it('should calculate average duration for operation types', () => {
    const op1 = operationTracker.startOperation('query');
    advanceTime(100);
    operationTracker.endOperation(op1);
    
    const op2 = operationTracker.startOperation('query');
    advanceTime(300);
    operationTracker.endOperation(op2);
    
    const avgDuration = operationTracker.getAverageDuration('query');
    expect(avgDuration).toBe(200); // (100 + 300) / 2
  });
  
  it('should calculate cache hit rate', () => {
    const op1 = operationTracker.startOperation('query');
    advanceTime(100);
    operationTracker.endOperation(op1, { cacheHit: true });
    
    const op2 = operationTracker.startOperation('query');
    advanceTime(100);
    operationTracker.endOperation(op2, { cacheHit: false });
    
    const op3 = operationTracker.startOperation('query');
    advanceTime(100);
    operationTracker.endOperation(op3, { cacheHit: true });
    
    const hitRate = operationTracker.getCacheHitRate();
    expect(hitRate).toBe(2/3); // 2 hits out of 3 queries
  });
  
  it('should limit the number of metrics stored', () => {
    operationTracker.setMaxMetricsCount(5);
    
    for (let i = 0; i < 10; i++) {
      const opId = operationTracker.startOperation(`op${i}`);
      operationTracker.endOperation(opId);
    }
    
    const metrics = operationTracker.getMetrics();
    expect(metrics.length).toBe(5);
    expect(metrics[0].operationType).toBe('op5');
    expect(metrics[4].operationType).toBe('op9');
  });
  
  it('should group metrics by operation type', () => {
    operationTracker.startOperation('query');
    operationTracker.startOperation('query');
    operationTracker.startOperation('save');
    
    const queryMetrics = operationTracker.getMetricsForOperationType('query');
    expect(queryMetrics.length).toBe(2);
    
    const saveMetrics = operationTracker.getMetricsForOperationType('save');
    expect(saveMetrics.length).toBe(1);
  });
  
  // Restore original performance.now after all tests
  afterAll(() => {
    vi.spyOn(performance, 'now').mockRestore();
  });
});
