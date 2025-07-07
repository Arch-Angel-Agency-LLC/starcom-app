/**
 * Tests for useOperationMetrics hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOperationMetrics } from '../hooks/useOperationMetrics';
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

describe('useOperationMetrics hook', () => {
  beforeEach(() => {
    operationTracker.clearMetrics();
    operationTracker.clearAccessPatterns();
    mockTime = 1000;
  });
  
  it('should provide access to operation metrics', () => {
    // Add some test metrics
    const op1 = operationTracker.startOperation('query');
    advanceTime(100);
    operationTracker.endOperation(op1, { cacheHit: true });
    
    const op2 = operationTracker.startOperation('save');
    advanceTime(200);
    operationTracker.endOperation(op2, { entityCount: 3 });
    
    // Render the hook
    const { result } = renderHook(() => useOperationMetrics());
    
    // Check the returned metrics
    expect(result.current.metrics.length).toBe(2);
    
    // Check metrics by type
    expect(Object.keys(result.current.metricsByType)).toContain('query');
    expect(Object.keys(result.current.metricsByType)).toContain('save');
    expect(result.current.metricsByType['query'].length).toBe(1);
    expect(result.current.metricsByType['save'].length).toBe(1);
    
    // Check stats
    expect(result.current.stats.totalOperations).toBe(2);
    expect(result.current.stats.averageOperationTime).toBe(150); // (100 + 200) / 2
    expect(result.current.stats.slowestOperation?.operationType).toBe('save');
    expect(result.current.stats.slowestOperation?.duration).toBe(200);
  });
  
  it('should track entity access patterns', () => {
    // Track some entities
    operationTracker.trackEntityAccess('entity1');
    operationTracker.trackEntityAccess('entity1');
    operationTracker.trackEntityAccess('entity1');
    operationTracker.trackEntityAccess('entity2');
    
    // Render the hook with a lower access threshold
    const { result } = renderHook(() => useOperationMetrics({ accessThreshold: 2 }));
    
    // Check entity access patterns
    expect(result.current.entityAccessPatterns.get('entity1')).toBe(3);
    expect(result.current.entityAccessPatterns.get('entity2')).toBe(1);
    
    // Check frequently accessed entities
    expect(result.current.frequentlyAccessedEntities).toContain('entity1');
    expect(result.current.frequentlyAccessedEntities).not.toContain('entity2');
  });
  
  it('should allow starting and ending operations from the hook', () => {
    // Render the hook
    const { result } = renderHook(() => useOperationMetrics());
    
    // Start an operation
    let operationId: string;
    act(() => {
      operationId = result.current.startOperation('test', { param: 'value' });
    });
    
    advanceTime(150);
    
    // End the operation
    act(() => {
      result.current.endOperation(operationId!, { result: 'success' });
    });
    
    // Check the metrics
    expect(result.current.metrics.length).toBe(1);
    expect(result.current.metrics[0].operationType).toBe('test');
    expect(result.current.metrics[0].duration).toBe(150);
    expect(result.current.metrics[0].queryParams?.param).toBe('value');
    expect(result.current.metrics[0].result).toBe('success');
  });
  
  it('should allow clearing metrics', () => {
    // Add some test metrics
    const op1 = operationTracker.startOperation('query');
    operationTracker.endOperation(op1);
    
    // Render the hook
    const { result } = renderHook(() => useOperationMetrics());
    
    // Initial state should have metrics
    expect(result.current.metrics.length).toBe(1);
    
    // Clear metrics
    act(() => {
      result.current.clearMetrics();
    });
    
    // Should now be empty
    expect(result.current.metrics.length).toBe(0);
  });
  
  // Restore original performance.now after all tests
  afterAll(() => {
    vi.spyOn(performance, 'now').mockRestore();
  });
});
