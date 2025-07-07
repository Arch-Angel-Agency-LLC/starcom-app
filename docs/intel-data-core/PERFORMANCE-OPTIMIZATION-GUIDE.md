# Performance Optimization in IntelDataCore

## Overview

This guide provides a comprehensive approach to performance optimization in the IntelDataCore system using idiomatic React and Vite patterns. It focuses on techniques that leverage React's built-in capabilities and ecosystem tools rather than using a monolithic manager class.

## React-Centric Performance Strategies

### 1. Efficient Query Result Caching

React applications can implement sophisticated caching strategies using React Query, Context API, and custom hooks:

- **React Query**: Provides built-in caching, deduplication, and invalidation
- **Custom Hooks**: Encapsulate caching logic in reusable hooks
- **Local Storage Integration**: Persist important data between sessions

```typescript
// Example: Using React Query for caching
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Custom hook for Intel queries with caching
export function useIntelQuery(queryParams) {
  return useQuery({
    queryKey: ['intel', queryParams],
    queryFn: () => storageOrchestrator.query(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });
}

// Usage in component
function IntelDashboard() {
  const queryParams = { types: ['node'], fullTextSearch: 'important intel' };
  const { data, isLoading, error } = useIntelQuery(queryParams);
  
  if (isLoading) return <Loading />;
  if (error) return <ErrorDisplay error={error} />;
  
  return <DataDisplay data={data} />;
}
```

### 2. Virtualization for Large Datasets

React offers excellent libraries for virtualizing large lists and grids:

- **React Window**: Efficiently render large lists by only rendering visible items
- **React Virtualized**: More feature-rich virtualization with additional components
- **Intersection Observer**: Detect when elements enter viewport for custom solutions

```typescript
// Example: Using React Window for virtualized lists
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function EntityList({ entities }) {
  const Row = ({ index, style }) => (
    <div style={style} className="entity-item">
      <h3>{entities[index].title}</h3>
      <p>{entities[index].summary}</p>
    </div>
  );

  return (
    <div className="entity-list-container">
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={entities.length}
            itemSize={100}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
}
```

### 3. Code Splitting and Lazy Loading

Vite and React provide powerful tools for code splitting and lazy loading:

- **React.lazy and Suspense**: Load components only when needed
- **Dynamic Imports**: Split code at the module level
- **Route-based Code Splitting**: Load code based on routes

```typescript
// Example: Component lazy loading
import React, { lazy, Suspense } from 'react';

// Lazy load components
const EntityViewer = lazy(() => import('./EntityViewer'));
const EntityEditor = lazy(() => import('./EntityEditor'));

function IntelManager({ mode, entityId }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {mode === 'view' ? (
        <EntityViewer entityId={entityId} />
      ) : (
        <EntityEditor entityId={entityId} />
      )}
    </Suspense>
  );
}
```

### 4. Memoization and Pure Components

React provides several ways to prevent unnecessary re-renders:

- **React.memo**: Memoize components to prevent re-renders with the same props
- **useMemo**: Cache expensive computations
- **useCallback**: Preserve function references across renders

```typescript
// Example: Using memoization techniques
import React, { useMemo, useCallback } from 'react';

// Memoized component
const EntityCard = React.memo(({ entity, onSelect }) => {
  return (
    <div className="entity-card" onClick={() => onSelect(entity.id)}>
      <h3>{entity.title}</h3>
      <p>{entity.description}</p>
    </div>
  );
});

function EntityBrowser({ entities }) {
  // Memoized expensive calculation
  const sortedEntities = useMemo(() => {
    return [...entities].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [entities]);
  
  // Stable callback reference
  const handleSelect = useCallback((id) => {
    console.log(`Selected entity: ${id}`);
    // Handle selection logic
  }, []);
  
  return (
    <div className="entity-browser">
      {sortedEntities.map(entity => (
        <EntityCard 
          key={entity.id} 
          entity={entity} 
          onSelect={handleSelect} 
        />
      ))}
    </div>
  );
}
```

### 5. Web Workers for Heavy Computation

Offload CPU-intensive tasks to Web Workers to keep the main thread responsive:

- **Vite Worker Plugin**: Easy Web Worker integration
- **Comlink**: Simplified communication with Web Workers
- **Worker Pools**: Manage multiple workers for parallel processing

```typescript
// Example: Using a Web Worker for complex operations
// worker.js
self.onmessage = function(e) {
  const { data, operation } = e.data;
  
  let result;
  switch (operation) {
    case 'analyze':
      result = analyzeData(data);
      break;
    case 'transform':
      result = transformData(data);
      break;
    default:
      result = { error: 'Unknown operation' };
  }
  
  self.postMessage(result);
};

// In component
function DataProcessor() {
  const [result, setResult] = useState(null);
  const workerRef = useRef(null);
  
  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => setResult(e.data);
    
    return () => workerRef.current.terminate();
  }, []);
  
  const processData = useCallback((data) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ data, operation: 'analyze' });
    }
  }, []);
  
  return (
    <div>
      <button onClick={() => processData(largeDataset)}>Process Data</button>
      {result && <ResultDisplay data={result} />}
    </div>
  );
}
```

## Performance Monitoring Hooks

### 1. Resource Monitoring Hook

```typescript
// Example: Custom hook for monitoring application performance
import { useState, useEffect } from 'react';

export function usePerformanceMonitor(options = {}) {
  const [metrics, setMetrics] = useState({
    memory: null,
    cpu: null,
    fps: null,
    renderTime: null
  });
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let frameTimes = [];
    let rafId;
    
    // Monitor FPS
    const measureFPS = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        
        // Calculate average frame time
        const avgRenderTime = frameTimes.length 
          ? frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length 
          : null;
        
        setMetrics(prev => ({
          ...prev,
          fps,
          renderTime: avgRenderTime ? Math.round(avgRenderTime) : null
        }));
        
        frameCount = 0;
        lastTime = now;
        frameTimes = [];
      }
      
      // Measure time to render this frame
      const frameStartTime = performance.now();
      
      rafId = requestAnimationFrame(() => {
        const frameEndTime = performance.now();
        frameTimes.push(frameEndTime - frameStartTime);
        measureFPS();
      });
    };
    
    // Monitor memory if available
    const memoryInterval = setInterval(() => {
      if (performance.memory) {
        const memoryUsage = Math.round(
          (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        );
        setMetrics(prev => ({ ...prev, memory: memoryUsage }));
      }
    }, 2000);
    
    // Start monitoring
    measureFPS();
    
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(memoryInterval);
    };
  }, []);
  
  return metrics;
}
```

### 2. Component Profiling Hook

```typescript
// Example: Custom hook for profiling component render time
import { useRef, useEffect } from 'react';

export function useRenderProfiler(componentName) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  useEffect(() => {
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    
    renderCount.current += 1;
    
    console.log(`[PROFILER] ${componentName} rendered in ${renderTime.toFixed(2)}ms (count: ${renderCount.current})`);
    
    lastRenderTime.current = now;
  });
}
```

## Best Practices

1. **Use React Query for Data Fetching**: Leverage React Query's built-in caching and state management.
2. **Implement Code Splitting**: Use dynamic imports and React.lazy to split your code bundle.
3. **Virtualize Long Lists**: Use react-window or react-virtualized for large data sets.
4. **Memoize Expensive Calculations**: Use useMemo and useCallback for computationally expensive operations.
5. **Avoid Prop Drilling**: Use Context API or state management libraries for deep component hierarchies.
6. **Profile Before Optimizing**: Use the React Profiler and browser performance tools to identify bottlenecks.
7. **Optimize Bundle Size**: Use bundle analysis tools to identify and remove large dependencies.

## Performance Tuning Guidelines

1. **Monitor Memory Usage**: Use browser dev tools to track memory usage and identify leaks.
2. **Optimize Rendering**: Avoid unnecessary re-renders by using memoization techniques.
3. **Lazy Load Assets**: Use browser's native lazy loading for images and iframes.
4. **Implement Pagination**: Use pagination for large datasets instead of loading everything at once.
5. **Use Efficient CSS**: Avoid complex CSS selectors and prefer className over inline styles.

## Troubleshooting

### High Memory Usage

If your application has high memory usage:

1. Check for memory leaks in useEffect cleanup functions
2. Review large objects or arrays that might be stored in state
3. Ensure proper cleanup of event listeners and subscriptions
4. Implement virtualization for large lists
5. Break down large components into smaller, focused ones

### Slow Rendering Performance

If your UI is sluggish or rendering slowly:

1. Profile with React DevTools to identify slow components
2. Memoize components with React.memo
3. Move expensive calculations to useMemo or Web Workers
4. Reduce unnecessary re-renders by stabilizing props
5. Consider using libraries like Immer for immutable state updates

### Network Performance Issues

For slow data loading:

1. Implement caching strategies with React Query
2. Use pagination or infinite scrolling for large datasets
3. Consider prefetching critical data
4. Optimize your backend queries
5. Use data compression where appropriate

## Future Optimization Strategies

1. **Server Components**: Adopt React Server Components when they become stable
2. **Concurrent Rendering**: Leverage React 18's concurrent rendering features
3. **Streaming SSR**: Implement streaming server-side rendering for faster time-to-interactive
4. **Micro-frontends**: Consider micro-frontend architecture for large applications
5. **Edge Computing**: Move some computation to edge functions for faster global performance

## Migration Guide: From PerformanceOptimizationManager to React Hooks

### Overview

This section outlines the migration strategy from the monolithic `PerformanceOptimizationManager` class to idiomatic React hooks. This migration aims to:

1. Improve code organization and maintainability
2. Better align with React's component-based architecture
3. Enable more granular optimization based on component-specific needs
4. Reduce bundle size through better code splitting
5. Simplify testing and mocking

### Migration Path

#### 1. Replacing Caching Functionality

**Old Approach (PerformanceOptimizationManager):**
```typescript
// Using the monolithic manager
const { result, hit } = performanceOptimizationManager.getCachedQueryResult(queryParams);
if (hit) {
  return result;
}

// Perform query
const result = await performQuery(queryParams);

// Cache result
performanceOptimizationManager.cacheQueryResult(queryParams, result);
```

**New Approach (React Hooks):**
```typescript
// Using the React hook
const { data, isLoading, error, refresh } = useQueryCache(
  queryParams,
  performQuery,
  { ttl: 5 * 60 * 1000 }
);

// The hook handles caching internally
if (isLoading) return <Loading />;
if (error) return <ErrorDisplay error={error} />;
return <DataDisplay data={data} />;
```

#### 2. Replacing Virtualization Support

**Old Approach:**
```typescript
// Configure the manager
performanceOptimizationManager.virtualizationOptions = {
  enabled: true,
  initialChunkSize: 50,
  subsequentChunkSize: 20,
  prefetchThreshold: 0.8
};

// Use the configured options elsewhere
const { initialChunkSize } = performanceOptimizationManager.virtualizationOptions;
```

**New Approach:**
```typescript
// Use the hook directly in your component
const { 
  virtualItems, 
  totalHeight, 
  isItemLoaded, 
  loadMoreItems 
} = useVirtualization({
  items: largeDataset,
  itemHeight: 100,
  overscan: 5,
  windowSize: windowHeight
});
```

#### 3. Replacing Lazy Loading

**Old Approach:**
```typescript
// Using the manager
performanceOptimizationManager.lazyLoadEntityFields(
  entity,
  loadEntityFields,
  { batchSize: 50 }
);
```

**New Approach:**
```typescript
// Using the hook
const { 
  entity: enrichedEntity, 
  isLoading, 
  loadField 
} = useLazyLoading(
  initialEntity, 
  loadEntityFields,
  { 
    priorityFields: ['id', 'name', 'type'],
    deferredFields: ['details', 'history']
  }
);
```

#### 4. Replacing Performance Monitoring

**Old Approach:**
```typescript
// Using the manager
const operationId = performanceOptimizationManager.startOperation('query');
// ... perform operation
performanceOptimizationManager.endOperation(operationId, { entityCount: results.length });

// Get report
const report = performanceOptimizationManager.getPerformanceReport();
```

**New Approach:**
```typescript
// Using the hook
const { 
  metrics, 
  startOperation, 
  endOperation, 
  getReport 
} = usePerformanceMonitor();

// In component or effect
useEffect(() => {
  const opId = startOperation('dataFetch');
  fetchData().finally(() => endOperation(opId));
}, []);

// Display metrics
return (
  <div>
    <PerformanceDisplay metrics={metrics} />
    <DataVisualization data={data} />
  </div>
);
```

### Deprecation Timeline

1. **Phase 1 (Current)**: Introduce the new hooks alongside the existing manager
2. **Phase 2**: Refactor application code to use the new hooks instead of the manager
3. **Phase 3**: Mark the PerformanceOptimizationManager as deprecated
4. **Phase 4**: Remove the PerformanceOptimizationManager entirely

### Benefits of the New Approach

1. **Component-specific optimization**: Each component can configure optimizations based on its specific needs
2. **Reduced bundle size**: Only the optimization features actually used are included in the bundle
3. **Better testing**: Hooks are easier to test in isolation
4. **Improved developer experience**: Hooks integrate naturally with React's component model
5. **Easier maintenance**: Smaller, focused hooks are easier to understand and maintain than a large manager class

For detailed implementation examples of each hook, refer to the corresponding hook files in the codebase.
