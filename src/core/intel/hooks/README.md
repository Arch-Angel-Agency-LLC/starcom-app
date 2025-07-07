# React Performance Optimization Hooks

This directory contains a collection of React hooks that provide performance optimization capabilities for the IntelDataCore system. These hooks replace the monolithic `PerformanceOptimizationManager` with React-idiomatic alternatives that integrate with the component lifecycle.

## Available Hooks

### useQueryCache

A hook for caching query results with support for TTL, prioritization, and persistence.

```typescript
const { 
  data,
  isLoading,
  error,
  isCached,
  refresh,
  cacheStats
} = useQueryCache(
  queryFn,
  queryParams,
  {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    persistToStorage: true
  }
);
```

### useVirtualization

A hook for efficiently rendering large lists by only rendering the visible items.

```typescript
const { 
  virtualItems,
  totalHeight,
  scrollToIndex,
  containerProps
} = useVirtualization(
  items,
  {
    itemHeight: 50,
    overscan: 5
  }
);
```

### useLazyLoading

A hook for lazy loading entity fields with prioritization and background loading.

```typescript
const {
  entity,
  isLoading,
  loadedFields,
  pendingFields,
  progress,
  error,
  loadField
} = useLazyLoading(
  basicEntity,
  loadFieldsFn,
  {
    priorityFields: ['title', 'summary'],
    secondaryFields: ['description'],
    deferredFields: ['fullContent']
  }
);
```

### usePerformanceMonitor

A hook for monitoring application performance metrics like FPS, memory usage, and network latency.

```typescript
const {
  metrics,
  samples,
  warnings,
  startOperation,
  endOperation,
  clearSamples
} = usePerformanceMonitor({
  logToConsole: true,
  warningThresholds: {
    lowFps: 30,
    highMemory: 80
  }
});
```

## Usage

Import these hooks directly in your components:

```typescript
import { useQueryCache, useVirtualization, useLazyLoading, usePerformanceMonitor } from '../hooks';
```

See the documentation in each hook file for detailed usage examples.

## Benefits Over PerformanceOptimizationManager

1. **React Integration**: Hooks integrate naturally with React's component lifecycle
2. **Colocation**: Performance optimizations live with the components that need them
3. **Tree-Shaking**: Only import the hooks you need
4. **TypeScript Support**: Full TypeScript support with generics
5. **Testing**: Easier to test components with mocked hooks
6. **Maintainability**: Smaller, focused APIs rather than one large manager

## Migration Status and Next Steps

### New Additions

We've added a new hook to the collection:

### useOperationMetrics

A hook for accessing performance metrics collected by the OperationTracker, designed as a bridge between the non-React tracker and React components.

```typescript
const {
  metrics,
  metricsByType,
  entityAccessPatterns,
  frequentlyAccessedEntities,
  stats,
  clearMetrics,
  startOperation,
  endOperation
} = useOperationMetrics({
  refreshInterval: 5000,
  accessThreshold: 3
});
```

## Migration Plan

We're transitioning from the monolithic `PerformanceOptimizationManager` to these React hooks in several phases:

1. **Phase 1 (Completed)**: Create the hooks and non-React alternative (OperationTracker)
2. **Phase 2 (Current)**: Update documentation and provide examples
3. **Phase 3 (Next)**: Migrate StorageOrchestrator and other services to use OperationTracker
4. **Phase 4 (Final)**: Remove the deprecated PerformanceOptimizationManager completely

See the detailed migration plan in `/docs/intel-data-core/MIGRATION-PLAN.md`.

## Example Usage

Check out the example component in `/src/core/intel/examples/EntityListWithOptimizations.tsx` that demonstrates how to use all these hooks together to create a high-performance entity list with:

- Query result caching
- List virtualization
- Performance monitoring
- Operation metrics tracking

## Testing

Each hook has corresponding test files in the `/src/core/intel/tests/` directory:

- `useQueryCache.test.ts`
- `useVirtualization.test.ts`
- `useLazyLoading.test.ts`
- `usePerformanceMonitor.test.ts`
- `useOperationMetrics.test.ts`
- `operationTracker.test.ts`
