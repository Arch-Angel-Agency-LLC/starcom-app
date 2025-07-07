/**
 * EntityListWithOptimizations - Example component demonstrating the use of performance optimization hooks
 * 
 * This component shows how to use the various performance optimization hooks together
 * to create an efficient list of entities with caching, virtualization, and performance monitoring.
 */

import React, { useState, useEffect } from 'react';
import { 
  useQueryCache, 
  useVirtualization, 
  usePerformanceMonitor,
  useOperationMetrics
} from '../hooks';
import { operationTracker } from '../performance/operationTracker';

// Import types for TypeScript support
import { BaseEntity } from '../types/intelDataModels';

// Mock API functions for example purposes
const api = {
  fetchEntities: async (filter: string) => {
    // In a real application, this would be a call to your actual API
    const operationId = operationTracker.startOperation('fetchEntities', { filter });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock data
    const entities = Array.from({ length: 1000 }, (_, index) => ({
      id: `entity-${index}`,
      title: `Entity ${index}`,
      description: `Description for entity ${index}. Filter: ${filter}`,
      type: index % 3 === 0 ? 'document' : index % 3 === 1 ? 'person' : 'location',
      createdAt: new Date(Date.now() - index * 86400000).toISOString()
    }));
    
    operationTracker.endOperation(operationId, { entityCount: entities.length });
    
    return entities;
  }
};

// Entity card component to display each entity
const EntityCard = React.memo(({ entity }: { entity: BaseEntity }) => {
  const typeColors = {
    document: '#e3f2fd',
    person: '#f1f8e9',
    location: '#fff8e1'
  };
  
  return (
    <div 
      className="entity-card" 
      style={{ 
        padding: '12px',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        backgroundColor: typeColors[entity.type as keyof typeof typeColors] || '#ffffff'
      }}
    >
      <h3 style={{ margin: '0 0 8px 0' }}>{entity.title}</h3>
      <div style={{ fontSize: '14px', color: '#666' }}>{entity.description}</div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginTop: '8px',
        fontSize: '12px',
        color: '#888'
      }}>
        <span>{entity.type}</span>
        <span>{new Date(entity.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
});

// Performance metrics display component
const PerformanceDisplay = ({ metrics }: { metrics: any }) => {
  return (
    <div style={{ 
      padding: '8px 12px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      marginBottom: '16px',
      fontSize: '14px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Performance Metrics:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {metrics.memory !== null && (
          <div>Memory: {metrics.memory.toFixed(1)}%</div>
        )}
        {metrics.fps !== null && (
          <div>FPS: {metrics.fps}</div>
        )}
        {metrics.renderTime !== null && (
          <div>Render time: {metrics.renderTime.toFixed(1)}ms</div>
        )}
      </div>
    </div>
  );
};

// Operation metrics display component
const OperationMetricsDisplay = ({ operationMetrics }: { operationMetrics: any }) => {
  return (
    <div style={{ 
      padding: '8px 12px',
      backgroundColor: '#e8f5e9',
      borderRadius: '4px',
      marginBottom: '16px',
      fontSize: '14px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Operation Stats:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <div>Total operations: {operationMetrics.stats.totalOperations}</div>
        {operationMetrics.stats.averageOperationTime !== null && (
          <div>Avg time: {operationMetrics.stats.averageOperationTime.toFixed(1)}ms</div>
        )}
        {operationMetrics.stats.cacheHitRate !== null && (
          <div>Cache hit rate: {(operationMetrics.stats.cacheHitRate * 100).toFixed(1)}%</div>
        )}
      </div>
    </div>
  );
};

// Main component demonstrating the hooks
export function EntityListWithOptimizations() {
  const [filter, setFilter] = useState('');
  const [itemHeight, setItemHeight] = useState(100);
  
  // 1. Use query caching for efficient data fetching
  const { 
    data: entities, 
    isLoading, 
    error, 
    refresh,
    isCached
  } = useQueryCache(
    // Query key - will be used for caching
    ['entities', filter],
    // Query function - will only be called when the cache doesn't have the data
    () => api.fetchEntities(filter),
    {
      // Cache for 1 minute
      ttl: 60 * 1000,
      // Persist to localStorage between page reloads
      persistToStorage: true,
      // Store up to 10 different queries
      maxSize: 10
    }
  );
  
  // 2. Use virtualization for efficient rendering of large lists
  const { 
    virtualItems, 
    totalHeight,
    scrollToIndex
  } = useVirtualization({
    items: entities || [],
    itemHeight,
    overscan: 5,
    scrollWindowHeight: 600
  });
  
  // 3. Use performance monitoring to track metrics
  const { 
    metrics: performanceMetrics,
    startOperationTimer,
    endOperationTimer
  } = usePerformanceMonitor({
    // Monitor memory usage if available
    monitorMemory: true,
    // Calculate FPS
    monitorFPS: true
  });
  
  // 4. Use operation metrics to track API calls and other operations
  const operationMetrics = useOperationMetrics({
    // Refresh every second
    refreshInterval: 1000,
    // Consider entities accessed 3+ times as frequently accessed
    accessThreshold: 3
  });
  
  // Example of timing a component operation
  useEffect(() => {
    const timerId = startOperationTimer('render');
    
    return () => {
      endOperationTimer(timerId);
    };
  }, [filter, entities, startOperationTimer, endOperationTimer]);
  
  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };
  
  // Jump to a random entity
  const handleJumpToRandom = () => {
    if (entities && entities.length > 0) {
      const randomIndex = Math.floor(Math.random() * entities.length);
      scrollToIndex(randomIndex);
    }
  };
  
  // Handle refresh click
  const handleRefresh = () => {
    refresh();
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Entity List with Performance Optimizations</h1>
      
      {/* Performance metrics display */}
      {performanceMetrics && <PerformanceDisplay metrics={performanceMetrics} />}
      
      {/* Operation metrics display */}
      <OperationMetricsDisplay operationMetrics={operationMetrics} />
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Filter entities..."
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', flexGrow: 1 }}
        />
        
        <button 
          onClick={handleRefresh}
          style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#1976d2', color: 'white' }}
        >
          Refresh
        </button>
        
        <button 
          onClick={handleJumpToRandom}
          style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#43a047', color: 'white' }}
        >
          Jump to Random
        </button>
        
        <div>
          <label>
            Item Height:
            <input
              type="range"
              min="50"
              max="200"
              value={itemHeight}
              onChange={(e) => setItemHeight(parseInt(e.target.value))}
              style={{ marginLeft: '8px' }}
            />
            {itemHeight}px
          </label>
        </div>
      </div>
      
      {/* Cache status */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '8px', 
        backgroundColor: isCached ? '#e8f5e9' : '#f5f5f5',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        {isCached ? 'Data loaded from cache ⚡' : 'Data loaded from API 🔄'}
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading entities...
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          Error loading entities: {error.message}
        </div>
      )}
      
      {/* Virtualized list */}
      {entities && entities.length > 0 && (
        <div 
          style={{ 
            height: '600px', 
            overflow: 'auto', 
            position: 'relative',
            border: '1px solid #eee',
            borderRadius: '4px'
          }}
          className="virtual-list-container"
        >
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {virtualItems.map(virtualItem => (
              <div
                key={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '8px'
                }}
              >
                <EntityCard entity={entities[virtualItem.index]} />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {entities && entities.length === 0 && !isLoading && (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          No entities found matching the filter.
        </div>
      )}
      
      {/* Stats */}
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        {entities && (
          <div>
            Showing {virtualItems.length} of {entities.length} entities
            {filter && ` matching "${filter}"`}
          </div>
        )}
        {operationMetrics.frequentlyAccessedEntities.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            Frequently accessed: {operationMetrics.frequentlyAccessedEntities.slice(0, 5).join(', ')}
            {operationMetrics.frequentlyAccessedEntities.length > 5 && ` and ${operationMetrics.frequentlyAccessedEntities.length - 5} more`}
          </div>
        )}
      </div>
    </div>
  );
}
