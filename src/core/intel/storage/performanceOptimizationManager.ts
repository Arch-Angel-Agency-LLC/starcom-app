/**
 * PerformanceOptimizationManager
 * 
 * @deprecated [MIGRATION COMPLETED] This module is fully deprecated and will be removed in a future release.
 * 
 * IMPORTANT: Do not use any functionality from this module in new or existing code.
 * 
 * For non-React code, use the operationTracker from '../performance/operationTracker'.
 * For React components, use these hooks instead:
 * - useQueryCache: For query result caching
 * - useVirtualization: For virtualized lists and efficient data rendering
 * - useLazyLoading: For lazy loading entity fields
 * - usePerformanceMonitor: For performance metrics and monitoring
 * 
 * PERFORMANCE OPTIMIZATION TIPS:
 * 1. Use React.memo for components that render often but with the same props
 * 2. Use useMemo for expensive calculations to prevent recomputing on every render
 * 3. Use useCallback for functions passed as props to memoized child components
 * 4. When using operationTracker, wrap long-running operations between startOperation() and endOperation()
 * 
 * For detailed migration instructions, see PERFORMANCE-OPTIMIZATION-GUIDE.md and MIGRATION-NOTES.md.
 * 
 * This legacy module previously provided performance optimization strategies for the IntelDataCore system
 * when dealing with large datasets, including data windowing, virtualization, 
 * intelligent prefetching, and query optimization.
 * 
 * Features:
 * - Data windowing for efficient memory usage
 * - Query optimization and caching
 * - Lazy loading strategies
 * - Virtual scrolling support for UI components
 * - Performance metrics collection and analysis
 * - Adaptive optimization based on usage patterns
 * - Advanced query result caching
 * - Dynamic resource allocation
 * - Real-time performance monitoring
 * - Memory usage optimization
 * 
 * @module PerformanceOptimizationManager
 */

import { BaseEntity, IntelQueryOptions } from '../types/intelDataModels';
import { cacheManager } from './cacheManager';

/**
 * Performance metrics for a specific operation
 */
export interface PerformanceMetrics {
  operationType: string;
  startTime: number;
  endTime: number;
  duration: number;
  entityCount?: number;
  queryComplexity?: number;
  cacheHit?: boolean;
  dataSize?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  queryParams?: Record<string, any>;
}

/**
 * Performance snapshot containing various system metrics
 */
export interface PerformanceSnapshot {
  timestamp: number;
  memoryUsage: number;
  cpuUsage: number;
  activeQueries: number;
  pendingOperations: number;
  cacheSize: number;
  cacheHitRate: number;
  averageQueryTime: number;
  storageUsage?: number;
  networkLatency?: number;
  entityCount?: number;
}

/**
 * Data window configuration
 */
export interface DataWindowConfig {
  windowSize: number;
  preloadBufferSize: number;
  maxWindowCount: number;
}

/**
 * Options for virtualized data access
 */
export interface VirtualizationOptions {
  enabled: boolean;
  initialChunkSize: number;
  subsequentChunkSize: number;
  prefetchThreshold: number;
  maxCachedChunks: number;
  recycleDOM?: boolean;      // Whether to recycle DOM elements
  dynamicChunkSize?: boolean; // Dynamically adjust chunk size based on performance
}

/**
 * Query optimization suggestions
 */
export interface QueryOptimizationSuggestion {
  originalQuery: IntelQueryOptions;
  suggestedQuery: IntelQueryOptions;
  expectedImprovement: number;
  reason: string;
}

/**
 * Advanced caching configuration
 */
export interface AdvancedCacheConfig {
  ttl: number;                      // Time to live in milliseconds
  maxSize: number;                  // Maximum number of entries
  priorityFunction: PriorityFunction; // Function to determine cache priority
  compressionEnabled: boolean;      // Whether to compress large cache entries
  persistenceEnabled: boolean;      // Whether to persist cache between sessions
  analyticsEnabled: boolean;        // Whether to collect cache analytics
}

/**
 * Priority function for cache entries
 */
export type PriorityFunction = (key: string, accessCount: number, lastAccess: number) => number;

/**
 * Lazy loading configuration
 */
export interface LazyLoadConfig {
  enabled: boolean;
  batchSize: number;
  delayBetweenBatches: number;
  priorityFields: string[];       // Fields to load immediately
  secondaryFields: string[];      // Fields to load in second batch
  deferredFields: string[];       // Fields to load only when accessed
  maxConcurrentLoads: number;     // Maximum concurrent loading operations
}

/**
 * Resource allocation thresholds
 */
export interface ResourceThresholds {
  highMemoryUsageThreshold: number;  // Percentage of available memory
  highCpuUsageThreshold: number;     // Percentage of available CPU
  criticalMemoryThreshold: number;   // Critical memory threshold
  lowDiskSpaceThreshold: number;     // Percentage of available disk space
  highNetworkLatencyThreshold: number; // Network latency in ms
}

/**
 * Query execution stats for performance analysis
 */
export interface QueryExecutionStats {
  queryHash: string;
  totalExecutions: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastExecuted: number;
  averageResultSize: number;
  cacheHitRate: number;
  parameters: Record<string, any>[];
}

/**
 * Performance report interface
 */
export interface PerformanceReport {
  metrics: {
    totalOperations: number;
    averageOperationTime: number;
    slowestOperation: number;
    uniqueOperationTypes: string[];
    cacheHitRatio: number;
    averageQuerySize: number;
  };
  resourceUsage?: {
    memory: number;
    cpu: number;
    disk?: number;
  };
  optimizationOpportunities?: string[];
  recommendations?: string[];
}

/**
 * PerformanceOptimizationManager class
 */
class PerformanceOptimizationManager {
  private initialized: boolean = false;
  private performanceMetrics: PerformanceMetrics[] = [];
  private performanceSnapshots: PerformanceSnapshot[] = [];
  private dataWindowConfig: DataWindowConfig = {
    windowSize: 1000,
    preloadBufferSize: 200,
    maxWindowCount: 5
  };
  public virtualizationOptions: VirtualizationOptions = {
    enabled: true,
    initialChunkSize: 50,
    subsequentChunkSize: 20,
    prefetchThreshold: 0.8, // Prefetch when 80% of current chunk is visible
    maxCachedChunks: 10,
    recycleDOM: true,
    dynamicChunkSize: true
  };
  private queryPatterns: Map<string, number> = new Map(); // Pattern -> frequency
  private entityAccessPatterns: Map<string, number> = new Map(); // EntityId -> access count
  private slowOperationThreshold: number = 500; // ms
  private queryExecutionStats: Map<string, QueryExecutionStats> = new Map();
  public advancedCacheConfig: AdvancedCacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    priorityFunction: (key, accessCount, lastAccess) => {
      // Combine access frequency and recency
      const recencyScore = (Date.now() - lastAccess) / 1000; // Seconds since last access
      return accessCount * 10 - recencyScore;
    },
    compressionEnabled: true,
    persistenceEnabled: true,
    analyticsEnabled: true
  };
  public lazyLoadConfig: LazyLoadConfig = {
    enabled: true,
    batchSize: 50,
    delayBetweenBatches: 100,
    priorityFields: ['id', 'type', 'name', 'title', 'createdAt'],
    secondaryFields: ['description', 'metadata', 'tags'],
    deferredFields: ['fullContent', 'comments', 'attachments', 'history'],
    maxConcurrentLoads: 3
  };
  private resourceThresholds: ResourceThresholds = {
    highMemoryUsageThreshold: 80, // 80%
    highCpuUsageThreshold: 70,    // 70%
    criticalMemoryThreshold: 90,  // 90%
    lowDiskSpaceThreshold: 10,    // 10% remaining
    highNetworkLatencyThreshold: 300 // 300ms
  };
  private activeOperations: Map<string, { startTime: number, type: string }> = new Map();
  private resourceUsageHistory: Array<{ timestamp: number, memory: number, cpu: number }> = [];
  private queryCache: Map<string, { data: any, timestamp: number, accessCount: number }> = new Map();
  private snapshotInterval: number | null = null;
  private optimizationInterval: number | null = null;
  private queryComplexityCache: Map<string, number> = new Map();

  /**
   * Initialize the performance optimization manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load configuration from storage or use defaults
      this.loadConfiguration();
      
      // Initialize metrics collection
      this.initializeMetricsCollection();
      
      // Start performance snapshots
      this.startPerformanceSnapshots();
      
      // Initialize automatic optimization
      this.initializeAutomaticOptimization();
      
      // Load saved cache if persistence is enabled
      if (this.advancedCacheConfig.persistenceEnabled) {
        await this.loadPersistedCache();
      }
      
      this.initialized = true;
      console.log('PerformanceOptimizationManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PerformanceOptimizationManager:', error);
      throw error;
    }
  }

  /**
   * Load configuration from storage or use defaults
   */
  private loadConfiguration(): void {
    // In a real implementation, this would load from persistent storage
    // For now, we'll use the default values set in the constructor
    
    // Adjust window size based on device capabilities if available
    if (typeof window !== 'undefined') {
      try {
        // Use a simple heuristic based on what might be available
        // Check if we're in a memory-constrained environment
        const isMemoryConstrained = 
          typeof navigator !== 'undefined' && 
          // @ts-ignore - deviceMemory is not in standard types but exists in some browsers
          (navigator.deviceMemory && navigator.deviceMemory <= 2);
        
        // Check if we're on a high-end device
        const isHighEndDevice = 
          typeof navigator !== 'undefined' && 
          // @ts-ignore - deviceMemory is not in standard types but exists in some browsers
          (navigator.deviceMemory && navigator.deviceMemory >= 8);
        
        if (isMemoryConstrained) {
          this.dataWindowConfig.windowSize = 500;
          this.dataWindowConfig.maxWindowCount = 3;
          this.virtualizationOptions.initialChunkSize = 30;
          this.virtualizationOptions.subsequentChunkSize = 15;
          this.lazyLoadConfig.batchSize = 30;
          this.advancedCacheConfig.maxSize = 500;
        } else if (isHighEndDevice) {
          this.dataWindowConfig.windowSize = 2000;
          this.dataWindowConfig.maxWindowCount = 8;
          this.virtualizationOptions.initialChunkSize = 100;
          this.virtualizationOptions.subsequentChunkSize = 50;
          this.lazyLoadConfig.batchSize = 100;
          this.advancedCacheConfig.maxSize = 2000;
        }
      } catch (error) {
        // Ignore errors in capability detection
        console.warn('Error detecting device capabilities:', error);
      }
    }
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetricsCollection(): void {
    // Set up periodic metrics analysis
    setInterval(() => {
      this.analyzePerformanceMetrics();
    }, 60000); // Analyze every minute
    
    // Limit metrics array size to prevent memory issues
    setInterval(() => {
      if (this.performanceMetrics.length > 1000) {
        this.performanceMetrics = this.performanceMetrics.slice(-1000);
      }
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Start periodic performance snapshots
   */
  private startPerformanceSnapshots(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    
    // Take initial snapshot
    this.takePerformanceSnapshot();
    
    // Set up interval for regular snapshots
    this.snapshotInterval = window.setInterval(() => {
      this.takePerformanceSnapshot();
      
      // Limit snapshots array size
      if (this.performanceSnapshots.length > 100) {
        this.performanceSnapshots = this.performanceSnapshots.slice(-100);
      }
      
      // Check for resource pressure
      const latestSnapshot = this.performanceSnapshots[this.performanceSnapshots.length - 1];
      this.detectResourcePressure(latestSnapshot);
    }, 60000); // Take a snapshot every minute
  }

  /**
   * Initialize automatic optimization processes
   */
  private initializeAutomaticOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    
    this.optimizationInterval = window.setInterval(() => {
      // Analyze query patterns to optimize caching
      this.analyzeQueryPatterns();
      
      // Analyze entity access patterns
      this.analyzeEntityAccessPatterns();
      
      // Adjust virtualization settings
      this.adjustVirtualizationSettings(false);
      
      // Clean up cache
      this.pruneCache();
    }, 300000); // Run optimization every 5 minutes
  }

  /**
   * Load persisted cache from storage
   */
  private async loadPersistedCache(): Promise<void> {
    try {
      const cachedData = localStorage.getItem('intelDataCore.queryCache');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Validate and import cache entries
        if (Array.isArray(parsedData)) {
          parsedData.forEach(([key, value]) => {
            // Validate entry
            if (value && typeof value === 'object' && 
                'data' in value && 
                'timestamp' in value && 
                'accessCount' in value) {
              
              // Check if entry is still valid
              const age = Date.now() - value.timestamp;
              if (age < this.advancedCacheConfig.ttl) {
                this.queryCache.set(key, value);
              }
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted cache:', error);
    }
  }

  /**
   * Persist cache to storage
   */
  private persistCache(): void {
    try {
      // Convert cache to array for serialization
      const cacheEntries = Array.from(this.queryCache.entries());
      
      // Store in localStorage
      localStorage.setItem('intelDataCore.queryCache', JSON.stringify(cacheEntries));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  /**
   * Start tracking performance for an operation
   */
  startOperation(operationType: string, params?: Record<string, any>): string {
    const operationId = `${operationType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    this.performanceMetrics.push({
      operationType,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: this.getCurrentCpuUsage(),
      queryParams: params
    });
    
    // Track active operation
    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      type: operationType
    });
    
    return operationId;
  }

  /**
   * End tracking performance for an operation
   */
  endOperation(operationId: string, additionalMetrics: Partial<PerformanceMetrics> = {}): PerformanceMetrics | null {
    const parts = operationId.split('-');
    const operationType = parts[0];
    const startTime = parseInt(parts[1], 10);
    
    // Find the operation in our metrics array
    const operationIndex = this.performanceMetrics.findIndex(
      m => m.operationType === operationType && m.startTime === startTime
    );
    
    if (operationIndex === -1) {
      console.warn(`Operation ${operationId} not found in metrics`);
      return null;
    }
    
    const metrics = this.performanceMetrics[operationIndex];
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    
    // Add additional metrics
    Object.assign(metrics, additionalMetrics);
    
    // Check if this was a slow operation
    if (metrics.duration > this.slowOperationThreshold) {
      console.warn(`Slow operation detected: ${operationType} took ${metrics.duration.toFixed(2)}ms`);
      
      // If this was a query, record the pattern for optimization
      if (operationType === 'query' && additionalMetrics.queryComplexity) {
        const queryKey = `complexity:${additionalMetrics.queryComplexity}`;
        this.queryPatterns.set(queryKey, (this.queryPatterns.get(queryKey) || 0) + 1);
      }
    }
    
    return metrics;
  }

  /**
   * Record detailed query execution statistics
   */
  private recordQueryExecutionStats(metrics: PerformanceMetrics): void {
    if (!metrics.queryParams) return;
    
    // Create a hash of the query parameters
    const queryHash = this.hashQueryParams(metrics.queryParams);
    
    // Get or create stats record
    let stats = this.queryExecutionStats.get(queryHash);
    if (!stats) {
      stats = {
        queryHash,
        totalExecutions: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastExecuted: 0,
        averageResultSize: 0,
        cacheHitRate: 0,
        parameters: []
      };
      this.queryExecutionStats.set(queryHash, stats);
    }
    
    // Update stats
    stats.totalExecutions++;
    stats.totalDuration += metrics.duration;
    stats.averageDuration = stats.totalDuration / stats.totalExecutions;
    stats.minDuration = Math.min(stats.minDuration, metrics.duration);
    stats.maxDuration = Math.max(stats.maxDuration, metrics.duration);
    stats.lastExecuted = Date.now();
    
    // Update result size if available
    if (metrics.entityCount) {
      const totalSize = (stats.averageResultSize * (stats.totalExecutions - 1)) + metrics.entityCount;
      stats.averageResultSize = totalSize / stats.totalExecutions;
    }
    
    // Update cache hit rate
    const cacheHits = stats.cacheHitRate * (stats.totalExecutions - 1) + (metrics.cacheHit ? 1 : 0);
    stats.cacheHitRate = cacheHits / stats.totalExecutions;
    
    // Store query parameters for analysis
    if (stats.parameters.length < 10) { // Limit to 10 samples
      stats.parameters.push({...metrics.queryParams});
    }
  }

  /**
   * Hash query parameters to create a unique identifier
   */
  private hashQueryParams(params: Record<string, any>): string {
    // Simple hash function for query parameters
    try {
      const sortedEntries = Object.entries(params)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
      
      return JSON.stringify(sortedEntries);
    } catch (error) {
      // Fallback if JSON stringify fails
      return Object.keys(params).sort().join(',');
    }
  }

  /**
   * Take a performance snapshot
   */
  private takePerformanceSnapshot(): void {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: this.getCurrentCpuUsage(),
      activeQueries: this.countActiveOperationsOfType('query'),
      pendingOperations: this.activeOperations.size,
      cacheSize: this.queryCache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      averageQueryTime: this.calculateAverageQueryTime()
    };
    
    this.performanceSnapshots.push(snapshot);
    
    // Add to resource usage history
    this.resourceUsageHistory.push({
      timestamp: snapshot.timestamp,
      memory: snapshot.memoryUsage,
      cpu: snapshot.cpuUsage
    });
    
    // Limit history size
    if (this.resourceUsageHistory.length > 1000) {
      this.resourceUsageHistory = this.resourceUsageHistory.slice(-1000);
    }
  }

  /**
   * Get current memory usage percentage
   */
  private getCurrentMemoryUsage(): number {
    // In a browser environment, we might not have precise memory info
    // Use performance.memory if available (Chrome only)
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    
    // Fallback: estimate based on active operations and cache size
    // This is very approximate and mostly for testing
    const operationEstimate = this.activeOperations.size * 0.5; // Each operation ~0.5% memory
    const cacheEstimate = (this.queryCache.size / this.advancedCacheConfig.maxSize) * 30; // Cache up to 30%
    
    return Math.min(operationEstimate + cacheEstimate, 100);
  }

  /**
   * Get current CPU usage percentage
   */
  private getCurrentCpuUsage(): number {
    // We don't have direct CPU usage in most browsers
    // Estimate based on recent operations and timing
    
    const recentOperations = this.performanceMetrics
      .filter(m => m.endTime > 0 && (performance.now() - m.endTime) < 10000) // Last 10 seconds
      .length;
    
    // Very rough estimate: each recent operation contributes to CPU load
    const estimatedCpuUsage = Math.min(recentOperations * 5, 100); // Each operation ~5% CPU
    
    return estimatedCpuUsage;
  }

  /**
   * Count active operations of a specific type
   */
  private countActiveOperationsOfType(type: string): number {
    let count = 0;
    for (const [_, operation] of this.activeOperations) {
      if (operation.type === type) {
        count++;
      }
    }
    return count;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const recentQueryMetrics = this.performanceMetrics
      .filter(m => m.operationType === 'query' && m.endTime > 0)
      .slice(-100); // Last 100 queries
    
    if (recentQueryMetrics.length === 0) {
      return 0;
    }
    
    const cacheHits = recentQueryMetrics.filter(m => m.cacheHit).length;
    return cacheHits / recentQueryMetrics.length;
  }

  /**
   * Calculate average query execution time
   */
  private calculateAverageQueryTime(): number {
    const recentQueryMetrics = this.performanceMetrics
      .filter(m => m.operationType === 'query' && m.endTime > 0)
      .slice(-100); // Last 100 queries
    
    if (recentQueryMetrics.length === 0) {
      return 0;
    }
    
    const totalTime = recentQueryMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalTime / recentQueryMetrics.length;
  }

  /**
   * Detect resource pressure and take action if needed
   */
  private detectResourcePressure(snapshot: PerformanceSnapshot): void {
    // Check memory pressure
    if (snapshot.memoryUsage > this.resourceThresholds.criticalMemoryThreshold) {
      console.warn(`Critical memory pressure detected: ${snapshot.memoryUsage.toFixed(1)}%`);
      this.performEmergencyMemoryRecovery();
    } else if (snapshot.memoryUsage > this.resourceThresholds.highMemoryUsageThreshold) {
      console.warn(`High memory usage detected: ${snapshot.memoryUsage.toFixed(1)}%`);
      this.pruneCache();
      this.adjustVirtualizationSettings(true);
    }
    
    // Check CPU pressure
    if (snapshot.cpuUsage > this.resourceThresholds.highCpuUsageThreshold) {
      console.warn(`High CPU usage detected: ${snapshot.cpuUsage.toFixed(1)}%`);
      this.throttleNonEssentialOperations();
    }
  }

  /**
   * Perform emergency memory recovery when memory usage is critical
   */
  private performEmergencyMemoryRecovery(): void {
    console.warn('Performing emergency memory recovery');
    
    // Clear all non-essential caches
    this.queryCache.clear();
    
    // Clear performance history to free memory
    this.performanceMetrics = this.performanceMetrics.slice(-100);
    this.performanceSnapshots = this.performanceSnapshots.slice(-10);
    this.resourceUsageHistory = this.resourceUsageHistory.slice(-10);
    
    // Clear query execution stats
    this.queryExecutionStats.clear();
    
    // Adjust virtualization for maximum memory savings
    const originalChunkSize = this.virtualizationOptions.initialChunkSize;
    this.virtualizationOptions.initialChunkSize = Math.max(10, Math.floor(originalChunkSize / 3));
    this.virtualizationOptions.subsequentChunkSize = Math.max(5, Math.floor(this.virtualizationOptions.subsequentChunkSize / 3));
    this.virtualizationOptions.maxCachedChunks = 2;
    
    // Force garbage collection if available
    if (typeof global !== 'undefined' && (global as any).gc) {
      (global as any).gc();
    }
  }

  /**
   * Throttle non-essential operations when CPU usage is high
   */
  private throttleNonEssentialOperations(): void {
    // In a real implementation, this might:
    // 1. Reduce frequency of background operations
    // 2. Delay non-critical updates
    // 3. Simplify rendering complexity
    
    // For our implementation, we'll adjust virtualization and caching
    this.virtualizationOptions.initialChunkSize = Math.max(20, Math.floor(this.virtualizationOptions.initialChunkSize * 0.7));
    this.virtualizationOptions.subsequentChunkSize = Math.max(10, Math.floor(this.virtualizationOptions.subsequentChunkSize * 0.7));
    
    // Make cache more aggressive to reduce processing
    this.advancedCacheConfig.ttl = this.advancedCacheConfig.ttl * 1.5; // 50% longer cache lifetime
  }

  /**
   * Analyze performance metrics for insights
   */
  private analyzePerformanceMetrics(): void {
    if (this.performanceMetrics.length < 10) {
      return; // Not enough data for analysis
    }
    
    // Group by operation type
    const operationTypes = new Set(this.performanceMetrics.map(m => m.operationType));
    
    // Find slow operations
    const slowOperations = this.performanceMetrics.filter(m => m.duration > this.slowOperationThreshold);
    
    if (slowOperations.length > 0) {
      // Group slow operations by type
      const slowByType = new Map<string, PerformanceMetrics[]>();
      for (const op of slowOperations) {
        if (!slowByType.has(op.operationType)) {
          slowByType.set(op.operationType, []);
        }
        slowByType.get(op.operationType)!.push(op);
      }
      
      // Log insights
      for (const [type, operations] of slowByType.entries()) {
        const avgDuration = operations.reduce((sum, op) => sum + op.duration, 0) / operations.length;
        console.log(`Performance insight: ${operations.length} slow ${type} operations, avg duration: ${avgDuration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Analyze query patterns to optimize cache and prefetching strategies
   */
  private analyzeQueryPatterns(): void {
    // Sort patterns by frequency
    const sortedPatterns = Array.from(this.queryPatterns.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Focus on top patterns
    const topPatterns = sortedPatterns.slice(0, 10);
    
    // In a real implementation, we might adjust caching strategies based on patterns
    // For now, we'll just log the most common patterns
    if (topPatterns.length > 0) {
      console.log('Top query patterns:', topPatterns.map(([pattern, count]) => `${pattern}: ${count}`).join(', '));
    }
  }

  /**
   * Analyze entity access patterns to suggest preloading
   */
  private analyzeEntityAccessPatterns(): void {
    // Sort entities by access frequency
    const sortedEntities = Array.from(this.entityAccessPatterns.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Keep only most frequently accessed entities
    const frequentlyAccessed = sortedEntities
      .filter(([_, count]) => count > 5) // Accessed more than 5 times
      .slice(0, 20); // Top 20
    
    // In a real implementation, this might trigger preloading of related data
    if (frequentlyAccessed.length > 0) {
      console.log(`${frequentlyAccessed.length} frequently accessed entities identified for potential preloading`);
    }
  }

  /**
   * Get a performance report with metrics and recommendations
   */
  getPerformanceReport(): PerformanceReport {
    // Calculate core metrics
    const totalOperations = this.performanceMetrics.length;
    const completedOperations = this.performanceMetrics.filter(m => m.endTime > 0);
    
    const averageOperationTime = completedOperations.length > 0 
      ? completedOperations.reduce((sum, m) => sum + m.duration, 0) / completedOperations.length
      : 0;
    
    const slowestOperation = completedOperations.length > 0
      ? Math.max(...completedOperations.map(m => m.duration))
      : 0;
    
    const uniqueOperationTypes = Array.from(new Set(this.performanceMetrics.map(m => m.operationType)));
    
    // Cache metrics
    const queries = completedOperations.filter(m => m.operationType === 'query');
    const cacheHits = queries.filter(m => m.cacheHit).length;
    const cacheHitRatio = queries.length > 0 ? cacheHits / queries.length : 0;
    
    // Average query size
    const queriesWithSize = queries.filter(m => m.entityCount !== undefined);
    const averageQuerySize = queriesWithSize.length > 0
      ? queriesWithSize.reduce((sum, m) => sum + (m.entityCount || 0), 0) / queriesWithSize.length
      : 0;
    
    // Current resource usage
    const latestSnapshot = this.performanceSnapshots.length > 0
      ? this.performanceSnapshots[this.performanceSnapshots.length - 1]
      : null;
    
    // Generate optimization opportunities
    const optimizationOpportunities: string[] = [];
    
    // Check cache hit ratio
    if (cacheHitRatio < 0.5 && queries.length > 10) {
      optimizationOpportunities.push('Low cache hit ratio. Consider adjusting cache configuration or query patterns.');
    }
    
    // Check slow operations
    const slowOps = completedOperations.filter(m => m.duration > this.slowOperationThreshold);
    if (slowOps.length > 0) {
      const slowOpTypes = Array.from(new Set(slowOps.map(m => m.operationType)));
      optimizationOpportunities.push(`Detected ${slowOps.length} slow operations of types: ${slowOpTypes.join(', ')}`);
    }
    
    // Check resource usage
    if (latestSnapshot && latestSnapshot.memoryUsage > this.resourceThresholds.highMemoryUsageThreshold) {
      optimizationOpportunities.push(`High memory usage (${latestSnapshot.memoryUsage.toFixed(1)}%). Consider reducing cache size or loaded data volume.`);
    }
    
    // Assemble the report
    const report: PerformanceReport = {
      metrics: {
        totalOperations,
        averageOperationTime,
        slowestOperation,
        uniqueOperationTypes,
        cacheHitRatio,
        averageQuerySize
      },
      optimizationOpportunities: optimizationOpportunities.length > 0 ? optimizationOpportunities : undefined
    };
    
    // Add resource usage if available
    if (latestSnapshot) {
      report.resourceUsage = {
        memory: latestSnapshot.memoryUsage,
        cpu: latestSnapshot.cpuUsage
      };
    }
    
    // Add recommendations based on findings
    if (optimizationOpportunities.length > 0) {
      report.recommendations = this.generateRecommendations(report);
    }
    
    return report;
  }

  /**
   * Generate specific recommendations based on performance report
   */
  private generateRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = [];
    
    // Memory usage recommendations
    if (report.resourceUsage && report.resourceUsage.memory > this.resourceThresholds.highMemoryUsageThreshold) {
      recommendations.push('Reduce cache size or TTL to lower memory usage');
      recommendations.push('Consider increasing data windowing and reducing prefetch buffer size');
    }
    
    // Cache optimization
    if (report.metrics.cacheHitRatio < 0.3) {
      recommendations.push('Review query patterns and adjust cache strategy');
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
    }
    
    // Performance optimizations
    if (report.metrics.averageOperationTime > this.slowOperationThreshold) {
      recommendations.push('Enable data windowing for large result sets');
      recommendations.push('Review query complexity and consider breaking complex queries into simpler ones');
    }
    
    return recommendations;
  }

  /**
   * Clean up resources when the manager is no longer needed
   */
  dispose(): void {
    // Clear intervals
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
    
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    
    // Persist cache one last time if enabled
    if (this.advancedCacheConfig && this.advancedCacheConfig.persistenceEnabled) {
      this.persistCache();
    }
    
    // Clear memory
    this.performanceMetrics = [];
    if (this.performanceSnapshots) {
      this.performanceSnapshots = [];
    }
    if (this.resourceUsageHistory) {
      this.resourceUsageHistory = [];
    }
    if (this.activeOperations) {
      this.activeOperations.clear();
    }
    this.queryPatterns.clear();
    this.entityAccessPatterns.clear();
    if (this.queryComplexityCache) {
      this.queryComplexityCache.clear();
    }
    
    console.log('PerformanceOptimizationManager disposed');
  }
}

// Deprecated singleton instance - DO NOT USE IN NEW CODE
// Use operationTracker from '../performance/operationTracker' instead
/**
 * @deprecated [MIGRATION COMPLETED] Do not use this singleton in new code!
 * This singleton export is maintained only for backward compatibility.
 * 
 * For non-React code, use the operationTracker from '../performance/operationTracker'.
 * For React components, use these hooks instead:
 * - useQueryCache: For query result caching
 * - useVirtualization: For virtualized lists and efficient data rendering
 * - useLazyLoading: For lazy loading entity fields
 * - usePerformanceMonitor: For performance metrics and monitoring
 */
export const performanceOptimizationManager = new PerformanceOptimizationManager();
