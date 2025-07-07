/**
 * useOperationMetrics - A React hook for using operation metrics collected by the OperationTracker
 * 
 * This hook provides a bridge between the non-React OperationTracker and React components
 * that want to display or use the collected metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { operationTracker, OperationMetrics } from '../performance/operationTracker';

interface OperationMetricsHookResult {
  // All collected metrics
  metrics: OperationMetrics[];
  
  // Metrics grouped by operation type
  metricsByType: Record<string, OperationMetrics[]>;
  
  // Entity access patterns
  entityAccessPatterns: Map<string, number>;
  
  // Frequently accessed entities (accessed more than threshold times)
  frequentlyAccessedEntities: string[];
  
  // Statistical information
  stats: {
    totalOperations: number;
    averageOperationTime: number | null;
    slowestOperation: OperationMetrics | null;
    cacheHitRate: number | null;
    operationTypes: string[];
  };
  
  // Actions
  clearMetrics: () => void;
  startOperation: (type: string, params?: Record<string, any>) => string;
  endOperation: (id: string, additionalMetrics?: Partial<OperationMetrics>) => OperationMetrics | null;
}

interface UseOperationMetricsOptions {
  refreshInterval?: number;         // How often to refresh metrics in ms
  accessThreshold?: number;         // Number of accesses to consider an entity "frequently accessed"
  includeCompletedOperationsOnly?: boolean; // Whether to include only completed operations
}

/**
 * React hook for using operation metrics
 */
export function useOperationMetrics(options: UseOperationMetricsOptions = {}): OperationMetricsHookResult {
  const {
    refreshInterval = 5000,
    accessThreshold = 3,
    includeCompletedOperationsOnly = true
  } = options;
  
  const [metrics, setMetrics] = useState<OperationMetrics[]>([]);
  const [entityAccessPatterns, setEntityAccessPatterns] = useState<Map<string, number>>(new Map());
  
  // Function to refresh metrics
  const refreshMetrics = useCallback(() => {
    let currentMetrics = operationTracker.getMetrics();
    
    // Filter out incomplete operations if specified
    if (includeCompletedOperationsOnly) {
      currentMetrics = currentMetrics.filter(m => m.endTime !== undefined);
    }
    
    setMetrics(currentMetrics);
    setEntityAccessPatterns(operationTracker.getEntityAccessPatterns());
  }, [includeCompletedOperationsOnly]);
  
  // Set up periodic refresh
  useEffect(() => {
    // Initial fetch
    refreshMetrics();
    
    // Set up interval
    const interval = setInterval(refreshMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, refreshMetrics]);
  
  // Group metrics by type
  const metricsByType = metrics.reduce<Record<string, OperationMetrics[]>>((acc, metric) => {
    if (!acc[metric.operationType]) {
      acc[metric.operationType] = [];
    }
    acc[metric.operationType].push(metric);
    return acc;
  }, {});
  
  // Get frequently accessed entities
  const frequentlyAccessedEntities = Array.from(entityAccessPatterns.entries())
    .filter(([_, count]) => count >= accessThreshold)
    .map(([entityId]) => entityId);
  
  // Calculate statistics
  const completedMetrics = metrics.filter(m => m.duration !== undefined);
  const totalOperations = completedMetrics.length;
  
  let averageOperationTime: number | null = null;
  if (completedMetrics.length > 0) {
    const total = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    averageOperationTime = total / completedMetrics.length;
  }
  
  const slowestOperation = completedMetrics.length > 0
    ? completedMetrics.reduce((slowest, current) => 
        (current.duration || 0) > (slowest.duration || 0) ? current : slowest
      )
    : null;
  
  // Calculate cache hit rate
  const queryOperations = completedMetrics.filter(m => 
    m.operationType === 'query' && m.cacheHit !== undefined
  );
  
  let cacheHitRate: number | null = null;
  if (queryOperations.length > 0) {
    const hits = queryOperations.filter(m => m.cacheHit).length;
    cacheHitRate = hits / queryOperations.length;
  }
  
  // Get unique operation types
  const operationTypes = Array.from(new Set(metrics.map(m => m.operationType)));
  
  // Actions
  const clearMetrics = useCallback(() => {
    operationTracker.clearMetrics();
    refreshMetrics();
  }, [refreshMetrics]);
  
  const startOperation = useCallback((type: string, params?: Record<string, any>) => {
    return operationTracker.startOperation(type, params);
  }, []);
  
  const endOperation = useCallback((id: string, additionalMetrics?: Partial<OperationMetrics>) => {
    const result = operationTracker.endOperation(id, additionalMetrics);
    refreshMetrics();
    return result;
  }, [refreshMetrics]);
  
  return {
    metrics,
    metricsByType,
    entityAccessPatterns,
    frequentlyAccessedEntities,
    stats: {
      totalOperations,
      averageOperationTime,
      slowestOperation,
      cacheHitRate,
      operationTypes
    },
    clearMetrics,
    startOperation,
    endOperation
  };
}
