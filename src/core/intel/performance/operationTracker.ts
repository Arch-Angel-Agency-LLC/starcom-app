/**
 * OperationTracker
 * 
 * This module provides a lightweight, non-React-specific alternative to track
 * operations and performance metrics without requiring the full
 * PerformanceOptimizationManager. It's designed to be used by services
 * and other non-React code that still needs performance tracking.
 * 
 * This allows for a gradual migration away from the PerformanceOptimizationManager.
 */

import { v4 as uuidv4 } from 'uuid';
import { IntelQueryOptions } from '../types/intelDataModels';

/**
 * Performance metrics for a specific operation
 */
export interface OperationMetrics {
  operationId: string;
  operationType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  entityCount?: number;
  queryComplexity?: number;
  cacheHit?: boolean;
  dataSize?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  queryParams?: Record<string, any>;
  [key: string]: any;
}

/**
 * Query optimization suggestion
 */
export interface QueryOptimizationSuggestion {
  originalQuery: IntelQueryOptions;
  suggestedQuery: IntelQueryOptions;
  expectedImprovement: number;
  reason: string;
}

/**
 * Simple operation tracker for non-React code
 */
class OperationTracker {
  private metrics: OperationMetrics[] = [];
  private accessPatterns: Map<string, number> = new Map();
  private maxMetricsCount: number = 1000;
  private queryComplexityCache: Map<string, number> = new Map();
  
  /**
   * Start tracking performance for an operation
   */
  startOperation(operationType: string, params?: Record<string, any>): string {
    const operationId = `${operationType}-${uuidv4()}`;
    
    // Limit metrics array size
    if (this.metrics.length >= this.maxMetricsCount) {
      this.metrics = this.metrics.slice(-Math.floor(this.maxMetricsCount / 2));
    }
    
    this.metrics.push({
      operationId,
      operationType,
      startTime: performance.now(),
      queryParams: params
    });
    
    return operationId;
  }
  
  /**
   * End tracking performance for an operation
   */
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
    
    // Trigger callbacks for slow operations if needed in the future
    if (metrics.duration && metrics.duration > 500) {
      console.warn(`Slow operation detected: ${metrics.operationType} took ${metrics.duration.toFixed(2)}ms`);
    }
    
    return metrics;
  }
  
  /**
   * Track entity access for optimization patterns
   */
  trackEntityAccess(entityId: string): void {
    const currentCount = this.accessPatterns.get(entityId) || 0;
    this.accessPatterns.set(entityId, currentCount + 1);
  }
  
  /**
   * Optimize a query based on previous patterns and performance data
   */
  optimizeQuery(options: IntelQueryOptions): QueryOptimizationSuggestion | null {
    // Simple optimization logic
    const optimized = { ...options };
    let improvement = 0;
    let reason = '';
    
    // If the query doesn't specify a limit, add one
    if (!optimized.limit && (optimized.fullTextSearch || optimized.types)) {
      optimized.limit = 100;
      improvement += 0.1;
      reason += 'Added reasonable limit. ';
    }
    
    // If the query has both fullTextSearch and types, suggest adding a more specific filter
    if (optimized.fullTextSearch && optimized.types && optimized.types.length > 1) {
      // Check most accessed entity types from our tracking data
      const mostAccessedType = this.getMostAccessedEntityType();
      if (mostAccessedType && optimized.types.includes(mostAccessedType)) {
        optimized.types = [mostAccessedType];
        improvement += 0.2;
        reason += `Narrowed to most accessed type (${mostAccessedType}). `;
      }
    }
    
    // If improvement threshold is met, return suggestion
    if (improvement > 0) {
      return {
        originalQuery: options,
        suggestedQuery: optimized,
        expectedImprovement: improvement,
        reason: reason.trim()
      };
    }
    
    return null;
  }
  
  /**
   * Get the most accessed entity type based on access patterns
   */
  private getMostAccessedEntityType(): string | null {
    // This is a simplified version - in reality would parse entity IDs to extract types
    // or maintain a separate map of entity type accesses
    
    // For now, just return null as this is just a placeholder
    return null;
  }
  
  /**
   * Get all collected metrics
   */
  getMetrics(): OperationMetrics[] {
    return [...this.metrics];
  }
  
  /**
   * Get entity access patterns map
   */
  getEntityAccessPatterns(): Map<string, number> {
    return new Map(this.accessPatterns);
  }
  
  /**
   * Clear collected metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Clear entity access patterns
   */
  clearAccessPatterns(): void {
    this.accessPatterns.clear();
  }
  
  /**
   * Get metrics for a specific operation type
   */
  getMetricsForOperationType(operationType: string): OperationMetrics[] {
    return this.metrics.filter(m => m.operationType === operationType);
  }
  
  /**
   * Calculate average operation duration for a specific type
   */
  getAverageDuration(operationType: string): number | null {
    const typeMetrics = this.getMetricsForOperationType(operationType)
      .filter(m => m.duration !== undefined);
    
    if (typeMetrics.length === 0) {
      return null;
    }
    
    const totalDuration = typeMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalDuration / typeMetrics.length;
  }
  
  /**
   * Calculate cache hit rate for query operations
   */
  getCacheHitRate(): number | null {
    const queryMetrics = this.getMetricsForOperationType('query')
      .filter(m => m.cacheHit !== undefined);
    
    if (queryMetrics.length === 0) {
      return null;
    }
    
    const cacheHits = queryMetrics.filter(m => m.cacheHit).length;
    return cacheHits / queryMetrics.length;
  }
  
  /**
   * Set the maximum number of metrics to store
   */
  setMaxMetricsCount(count: number): void {
    this.maxMetricsCount = count;
    
    // Trim if needed
    if (this.metrics.length > count) {
      this.metrics = this.metrics.slice(-count);
    }
  }
}

// Create singleton instance
export const operationTracker = new OperationTracker();
