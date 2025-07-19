# Migration Plan: From PerformanceOptimizationManager to React Hooks

This document outlines the specific steps needed to migrate from the monolithic `PerformanceOptimizationManager` to the new React hooks-based approach.

## Affected Files

Based on our analysis, the following files need to be updated:

1. `src/core/intel/storage/storageOrchestrator.ts`
2. `src/core/intel/tests/performanceOptimizationManager.test.ts`
3. `src/core/intel/tests/enhancedPerformanceOptimization.test.ts`
4. Any components directly using the manager

## Migration Strategy

### 1. StorageOrchestrator Migration

The `storageOrchestrator.ts` file currently uses the `performanceOptimizationManager` for:
- Operation timing
- Entity access tracking
- Query optimization
- Cache management

#### Proposed Approach:

1. Create a new module to track operations outside of React components:

```typescript
// src/core/intel/performance/operationTracker.ts
import { v4 as uuidv4 } from 'uuid';

interface OperationMetrics {
  operationType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  entityCount?: number;
  queryComplexity?: number;
  cacheHit?: boolean;
  dataSize?: number;
  [key: string]: any;
}

class OperationTracker {
  private metrics: OperationMetrics[] = [];
  private accessPatterns: Map<string, number> = new Map();
  
  startOperation(operationType: string): string {
    const operationId = `${operationType}-${uuidv4()}`;
    
    this.metrics.push({
      operationId,
      operationType,
      startTime: performance.now(),
    });
    
    return operationId;
  }
  
  endOperation(operationId: string, additionalMetrics: Partial<OperationMetrics> = {}): OperationMetrics | null {
    const index = this.metrics.findIndex(m => m.operationId === operationId);
    
    if (index === -1) {
      console.warn(`Operation ${operationId} not found in metrics`);
      return null;
    }
    
    const metrics = this.metrics[index];
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    
    // Add additional metrics
    Object.assign(metrics, additionalMetrics);
    
    return metrics;
  }
  
  trackEntityAccess(entityId: string): void {
    const currentCount = this.accessPatterns.get(entityId) || 0;
    this.accessPatterns.set(entityId, currentCount + 1);
  }
  
  getMetrics(): OperationMetrics[] {
    return [...this.metrics];
  }
  
  getEntityAccessPatterns(): Map<string, number> {
    return new Map(this.accessPatterns);
  }
  
  clearMetrics(): void {
    this.metrics = [];
  }
}

export const operationTracker = new OperationTracker();
```

2. Update `storageOrchestrator.ts` to use the new tracker:

```typescript
// Before
const operationId = performanceOptimizationManager.startOperation('getEntity');
performanceOptimizationManager.trackEntityAccess(id);
// ...
performanceOptimizationManager.endOperation(operationId, { cacheHit: true });

// After
const operationId = operationTracker.startOperation('getEntity');
operationTracker.trackEntityAccess(id);
// ...
operationTracker.endOperation(operationId, { cacheHit: true });
```

3. Create a custom hook to integrate the operation tracker with React components:

```typescript
// src/core/intel/hooks/useOperationMetrics.ts
import { useState, useEffect } from 'react';
import { operationTracker } from '../performance/operationTracker';

export function useOperationMetrics() {
  const [metrics, setMetrics] = useState([]);
  
  useEffect(() => {
    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(operationTracker.getMetrics());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    metrics,
    clearMetrics: () => operationTracker.clearMetrics(),
    entityAccessPatterns: operationTracker.getEntityAccessPatterns()
  };
}
```

### 2. Test Files Migration

Update the test files to use the new hooks and utilities:

1. Replace `performanceOptimizationManager.test.ts` with a new test file:

```typescript
// src/core/intel/tests/operationTracker.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { operationTracker } from '../performance/operationTracker';

describe('OperationTracker', () => {
  beforeEach(() => {
    operationTracker.clearMetrics();
  });
  
  it('should track operations correctly', () => {
    const operationId = operationTracker.startOperation('test');
    const metrics = operationTracker.endOperation(operationId, { entityCount: 5 });
    
    expect(metrics).not.toBeNull();
    expect(metrics.operationType).toBe('test');
    expect(metrics.entityCount).toBe(5);
    expect(metrics.duration).toBeGreaterThan(0);
  });
  
  it('should track entity access patterns', () => {
    operationTracker.trackEntityAccess('entity1');
    operationTracker.trackEntityAccess('entity1');
    operationTracker.trackEntityAccess('entity2');
    
    const patterns = operationTracker.getEntityAccessPatterns();
    expect(patterns.get('entity1')).toBe(2);
    expect(patterns.get('entity2')).toBe(1);
  });
});
```

2. Update or deprecate `enhancedPerformanceOptimization.test.ts` as needed.

### 3. Component Usage Examples

Create examples of using the new hooks in components:

```tsx
// src/core/intel/examples/EntityListWithOptimizations.tsx
import React from 'react';
import { useQueryCache, useVirtualization, usePerformanceMonitor } from '../hooks';

function EntityListWithOptimizations({ filter }) {
  // Use query caching
  const { data: entities, isLoading, refresh } = useQueryCache(
    ['entities', filter],
    () => api.fetchEntities(filter),
    { ttl: 60 * 1000 } // 1 minute cache
  );
  
  // Use virtualization
  const { virtualItems, totalHeight } = useVirtualization({
    items: entities || [],
    itemHeight: 100,
    overscan: 5
  });
  
  // Monitor performance
  const { metrics } = usePerformanceMonitor();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {metrics.memory && (
        <div className="performance-metrics">
          Memory: {metrics.memory.toFixed(1)}% | FPS: {metrics.fps}
        </div>
      )}
      
      <button onClick={refresh}>Refresh</button>
      
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(virtualItem => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <EntityCard entity={entities[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Timeline

1. **Week 1**: Create and implement the `operationTracker` module
2. **Week 2**: Update the `storageOrchestrator` to use the new tracker
3. **Week 3**: Update tests and create example components
4. **Week 4**: Remove the deprecated `performanceOptimizationManager`

## Validation Strategy

1. Performance benchmarks before and after migration
2. Unit tests for all new modules
3. Integration tests with components using the new hooks
4. Memory usage comparison
5. Bundle size comparison

## Rollback Plan

If issues arise, the `performanceOptimizationManager` can be kept in place with the deprecated notice removed until all issues are resolved.
