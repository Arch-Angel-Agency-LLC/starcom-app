/**
 * Example components demonstrating the use of performance optimization hooks
 * 
 * This file provides example React components that show how to use the
 * performance optimization hooks in real-world scenarios.
 */

import React, { useState, useEffect } from 'react';
import { useQueryCache, useVirtualization, useLazyLoading, usePerformanceMonitor } from '../hooks';
import { BaseEntity, IntelQueryOptions } from '../types/intelDataModels';

// Mock storage orchestrator for the examples
const mockStorageOrchestrator = {
  query: async (query: IntelQueryOptions) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return Array.from({ length: 100 }, (_, i) => ({
      id: `entity-${i}`,
      type: 'intel',
      title: `Intel Report ${i}`,
      summary: `Summary for report ${i}`,
      createdAt: new Date().toISOString(),
    }));
  },
  
  getEntityById: async (id: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return basic entity
    return {
      id,
      type: 'intel',
      title: `Intel Report ${id}`,
      createdAt: new Date().toISOString(),
    } as BaseEntity;
  },
  
  loadEntityFields: async (id: string, fields: string[]) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return requested fields
    return fields.reduce((acc, field) => {
      acc[field] = `${field} for ${id}`;
      return acc;
    }, {} as Record<string, any>);
  }
};

/**
 * Example component demonstrating useQueryCache
 */
export const QueryCacheExample: React.FC = () => {
  const queryParams = {
    types: ['intel'],
    limit: 100
  };
  
  const { 
    data, 
    isLoading, 
    error, 
    isCached,
    refresh, 
    cacheStats 
  } = useQueryCache(
    mockStorageOrchestrator.query,
    queryParams,
    {
      ttl: 60000, // 1 minute
      persistToStorage: true
    }
  );
  
  if (isLoading) {
    return <div>Loading data...</div>;
  }
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return (
    <div>
      <h2>Query Results {isCached && '(from cache)'}</h2>
      
      <div className="stats">
        <p>Cache hit rate: {(cacheStats.hitRate * 100).toFixed(0)}%</p>
        <p>Entries in cache: {cacheStats.entryCount}</p>
      </div>
      
      <button onClick={() => refresh()}>Refresh Data</button>
      
      <ul>
        {data && data.slice(0, 10).map((item: any) => (
          <li key={item.id}>{item.title}</li>
        ))}
        {data && data.length > 10 && <li>...and {data.length - 10} more items</li>}
      </ul>
    </div>
  );
};

/**
 * Example component demonstrating useVirtualization
 */
export const VirtualizationExample: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  
  // Fetch items on mount
  useEffect(() => {
    const fetchItems = async () => {
      const result = await mockStorageOrchestrator.query({
        types: ['intel'],
        limit: 1000
      });
      setItems(result);
    };
    
    fetchItems();
  }, []);
  
  const {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerProps
  } = useVirtualization(items, {
    itemHeight: 60,
    overscan: 5
  });
  
  if (items.length === 0) {
    return <div>Loading items...</div>;
  }
  
  return (
    <div>
      <h2>Virtualized List ({items.length} items)</h2>
      
      <div className="controls">
        <button onClick={() => scrollToIndex(0)}>Top</button>
        <button onClick={() => scrollToIndex(Math.floor(items.length / 2))}>Middle</button>
        <button onClick={() => scrollToIndex(items.length - 1)}>Bottom</button>
      </div>
      
      <div {...containerProps} style={{ ...containerProps.style, height: '400px', border: '1px solid #ccc' }}>
        <div style={{ height: totalHeight, position: 'relative' }}>
          {virtualItems.map(({ item, index, style }) => (
            <div key={index} style={{ ...style, padding: '10px', borderBottom: '1px solid #eee' }}>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </div>
          ))}
        </div>
      </div>
      
      <p className="note">
        Only {virtualItems.length} items are actually rendered out of {items.length} total items.
      </p>
    </div>
  );
};

/**
 * Example component demonstrating useLazyLoading
 */
export const LazyLoadingExample: React.FC<{ entityId: string }> = ({ entityId }) => {
  const [basicEntity, setBasicEntity] = useState<BaseEntity | null>(null);
  
  // First load the basic entity
  useEffect(() => {
    const loadBasicEntity = async () => {
      const entity = await mockStorageOrchestrator.getEntityById(entityId);
      setBasicEntity(entity);
    };
    
    loadBasicEntity();
  }, [entityId]);
  
  // Use lazy loading for additional fields
  const {
    entity,
    isLoading,
    loadedFields,
    pendingFields,
    progress,
    error,
    loadField
  } = useLazyLoading(
    basicEntity!,
    mockStorageOrchestrator.loadEntityFields,
    {
      priorityFields: ['title', 'summary'],
      secondaryFields: ['description', 'tags'],
      deferredFields: ['fullContent', 'comments', 'attachments'],
      batchSize: 2,
      delayBetweenBatches: 500
    }
  );
  
  if (!basicEntity) {
    return <div>Loading basic entity...</div>;
  }
  
  const handleLoadField = (field: string) => {
    loadField(field);
  };
  
  return (
    <div>
      <h2>Entity Viewer</h2>
      
      {isLoading && (
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress * 100}%` }}
          />
          <span>Loading: {Math.round(progress * 100)}%</span>
        </div>
      )}
      
      <div className="entity-viewer">
        <h3>{entity.title}</h3>
        
        {entity.summary && (
          <div className="summary">
            <h4>Summary</h4>
            <p>{entity.summary}</p>
          </div>
        )}
        
        {entity.description && (
          <div className="description">
            <h4>Description</h4>
            <p>{entity.description}</p>
          </div>
        )}
        
        {entity.fullContent && (
          <div className="full-content">
            <h4>Full Content</h4>
            <p>{entity.fullContent}</p>
          </div>
        )}
        
        <div className="field-controls">
          <h4>Load Additional Fields</h4>
          <div className="buttons">
            {['authors', 'relatedEntities', 'statistics', 'geolocation'].map(field => (
              <button 
                key={field}
                onClick={() => handleLoadField(field)}
                disabled={loadedFields.includes(field) || pendingFields.includes(field)}
              >
                {loadedFields.includes(field) ? '✓ ' : ''}{field}
              </button>
            ))}
          </div>
        </div>
        
        <div className="field-status">
          <h4>Field Status</h4>
          <div>
            <strong>Loaded:</strong> {loadedFields.join(', ') || 'None'}
          </div>
          <div>
            <strong>Pending:</strong> {pendingFields.join(', ') || 'None'}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error">
          Error: {error.message}
        </div>
      )}
    </div>
  );
};

/**
 * Example component demonstrating usePerformanceMonitor
 */
export const PerformanceMonitorExample: React.FC = () => {
  const {
    metrics,
    samples,
    warnings,
    startOperation,
    endOperation,
    clearSamples
  } = usePerformanceMonitor({
    sampleInterval: 1000,
    maxSamples: 60,
    logToConsole: true,
    warningThresholds: {
      lowFps: 30,
      highMemory: 80,
      highRenderTime: 16,
      highNetworkLatency: 200
    }
  });
  
  const [operationResult, setOperationResult] = useState<{
    name: string;
    duration: number;
    result: number;
  } | null>(null);
  
  const handleHeavyOperation = () => {
    startOperation('heavyCalculation');
    
    // Simulate heavy operation
    const start = Date.now();
    const result = Array.from({ length: 1000000 }).reduce((sum, _, i) => sum + i, 0);
    
    const duration = endOperation('heavyCalculation');
    
    setOperationResult({
      name: 'heavyCalculation',
      duration: duration || 0,
      result
    });
  };
  
  return (
    <div>
      <h2>Performance Monitor</h2>
      
      <div className="metrics-panel">
        <h3>Current Metrics</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">FPS:</span>
            <span className="metric-value">{metrics.fps || 'N/A'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Memory:</span>
            <span className="metric-value">{metrics.memory ? `${metrics.memory}%` : 'N/A'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Render Time:</span>
            <span className="metric-value">{metrics.renderTime ? `${metrics.renderTime}ms` : 'N/A'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Network Latency:</span>
            <span className="metric-value">{metrics.networkLatency ? `${metrics.networkLatency}ms` : 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div className="samples-panel">
        <h3>Recent Samples</h3>
        <button onClick={clearSamples}>Clear Samples</button>
        <div className="samples-count">Total samples: {samples.length}</div>
      </div>
      
      {warnings.length > 0 && (
        <div className="warnings-panel">
          <h3>Performance Warnings</h3>
          <ul>
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="operations-panel">
        <h3>Test Operations</h3>
        <button onClick={handleHeavyOperation}>
          Run Heavy Operation
        </button>
        
        {operationResult && (
          <div className="operation-result">
            <p>Operation: {operationResult.name}</p>
            <p>Duration: {operationResult.duration.toFixed(2)}ms</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Combined example demonstrating all hooks
 */
export const PerformanceOptimizationExamples: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'query' | 'virtualization' | 'lazyLoading' | 'monitor'>('query');
  
  return (
    <div className="examples-container">
      <h1>Performance Optimization Hooks</h1>
      
      <div className="tabs">
        <button 
          className={activeTab === 'query' ? 'active' : ''}
          onClick={() => setActiveTab('query')}
        >
          Query Cache
        </button>
        <button 
          className={activeTab === 'virtualization' ? 'active' : ''}
          onClick={() => setActiveTab('virtualization')}
        >
          Virtualization
        </button>
        <button 
          className={activeTab === 'lazyLoading' ? 'active' : ''}
          onClick={() => setActiveTab('lazyLoading')}
        >
          Lazy Loading
        </button>
        <button 
          className={activeTab === 'monitor' ? 'active' : ''}
          onClick={() => setActiveTab('monitor')}
        >
          Performance Monitor
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'query' && <QueryCacheExample />}
        {activeTab === 'virtualization' && <VirtualizationExample />}
        {activeTab === 'lazyLoading' && <LazyLoadingExample entityId="example-123" />}
        {activeTab === 'monitor' && <PerformanceMonitorExample />}
      </div>
    </div>
  );
};
