/**
 * Performance Optimization Service - Phase 3 Advanced Features
 * 
 * Provides performance monitoring, caching, and optimization for Intel services
 */

// Cache management
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  size: number; // bytes
  created: Date;
  lastAccessed: Date;
  accessCount: number;
  ttl: number; // seconds
  compressed: boolean;
}
export interface ServicePerformanceMetrics {
  serviceName: string;
  operationCounts: Record<string, number>;
  averageResponseTimes: Record<string, number>;
  errorRates: Record<string, number>;
  memoryUsage: number; // MB
  cacheHitRates: Record<string, number>;
  lastUpdated: Date;
}

export interface SystemHealthMetrics {
  overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  services: ServicePerformanceMetrics[];
  totalMemoryUsage: number; // MB
  totalRequestCount: number;
  averageSystemResponseTime: number; // ms
  errorRate: number; // percentage
  uptime: number; // seconds
  timestamp: Date;
}

export interface CacheConfiguration {
  maxSize: number; // MB
  ttl: number; // seconds
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO';
  compressionEnabled: boolean;
  persistToDisk: boolean;
}

export interface OptimizationRecommendation {
  type: 'CACHE' | 'QUERY' | 'MEMORY' | 'NETWORK' | 'STORAGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  estimatedImpact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'MAJOR';
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  technicalDetails?: string;
}

export interface PerformanceReport {
  id: string;
  generated: Date;
  timeframe: {
    start: Date;
    end: Date;
  };
  metrics: SystemHealthMetrics;
  trends: PerformanceTrend[];
  recommendations: OptimizationRecommendation[];
  summary: string;
}

export interface PerformanceTrend {
  metric: string;
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  changePercentage: number;
  timeframe: number; // days
  significance: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Cache management
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  size: number; // bytes
  created: Date;
  lastAccessed: Date;
  accessCount: number;
  ttl: number; // seconds
  compressed: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  hitRate: number; // percentage
  missRate: number; // percentage
  evictionCount: number;
  compressionRatio: number;
  oldestEntry: Date;
  newestEntry: Date;
}

/**
 * Advanced Performance Optimization Service
 */
export class PerformanceOptimizationService {
  private metrics: Map<string, ServicePerformanceMetrics> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private cacheConfig: CacheConfiguration;
  private performanceHistory: PerformanceReport[] = [];

  constructor(cacheConfig?: Partial<CacheConfiguration>) {
    this.cacheConfig = {
      maxSize: 100, // 100MB default
      ttl: 3600, // 1 hour
      evictionPolicy: 'LRU',
      compressionEnabled: true,
      persistToDisk: false,
      ...cacheConfig
    };

    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  /**
   * Record performance metrics for a service operation
   */
  recordOperation(
    serviceName: string,
    operationType: string,
    responseTime: number,
    success: boolean,
    memoryUsage?: number
  ): void {
    let serviceMetrics = this.metrics.get(serviceName);
    
    if (!serviceMetrics) {
      serviceMetrics = {
        serviceName,
        operationCounts: {},
        averageResponseTimes: {},
        errorRates: {},
        memoryUsage: memoryUsage || 0,
        cacheHitRates: {},
        lastUpdated: new Date()
      };
      this.metrics.set(serviceName, serviceMetrics);
    }

    // Update operation counts
    serviceMetrics.operationCounts[operationType] = 
      (serviceMetrics.operationCounts[operationType] || 0) + 1;

    // Update average response times
    const currentCount = serviceMetrics.operationCounts[operationType];
    const currentAvg = serviceMetrics.averageResponseTimes[operationType] || 0;
    serviceMetrics.averageResponseTimes[operationType] = 
      ((currentAvg * (currentCount - 1)) + responseTime) / currentCount;

    // Update error rates
    if (!success) {
      const errorCount = (serviceMetrics.errorRates[operationType] || 0) + 1;
      serviceMetrics.errorRates[operationType] = (errorCount / currentCount) * 100;
    }

    // Update memory usage if provided
    if (memoryUsage !== undefined) {
      serviceMetrics.memoryUsage = memoryUsage;
    }

    serviceMetrics.lastUpdated = new Date();
  }

  /**
   * Get current system health metrics
   */
  getSystemHealth(): SystemHealthMetrics {
    const services = Array.from(this.metrics.values());
    
    const totalMemoryUsage = services.reduce((sum, service) => sum + service.memoryUsage, 0);
    const totalRequestCount = services.reduce((sum, service) => 
      sum + Object.values(service.operationCounts).reduce((opSum, count) => opSum + count, 0), 0);
    
    const averageResponseTimes = services.flatMap(service => 
      Object.values(service.averageResponseTimes));
    const averageSystemResponseTime = averageResponseTimes.length > 0 ?
      averageResponseTimes.reduce((sum, time) => sum + time, 0) / averageResponseTimes.length : 0;

    const errorRates = services.flatMap(service => 
      Object.values(service.errorRates));
    const errorRate = errorRates.length > 0 ?
      errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length : 0;

    // Determine overall health
    let overallHealth: SystemHealthMetrics['overallHealth'] = 'EXCELLENT';
    if (errorRate > 10 || averageSystemResponseTime > 5000 || totalMemoryUsage > 1000) {
      overallHealth = 'CRITICAL';
    } else if (errorRate > 5 || averageSystemResponseTime > 2000 || totalMemoryUsage > 500) {
      overallHealth = 'POOR';
    } else if (errorRate > 2 || averageSystemResponseTime > 1000 || totalMemoryUsage > 200) {
      overallHealth = 'FAIR';
    } else if (errorRate > 1 || averageSystemResponseTime > 500 || totalMemoryUsage > 100) {
      overallHealth = 'GOOD';
    }

    return {
      overallHealth,
      services,
      totalMemoryUsage,
      totalRequestCount,
      averageSystemResponseTime,
      errorRate,
      uptime: this.getUptime(),
      timestamp: new Date()
    };
  }

  /**
   * Cache management operations
   */
  async cacheSet<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const size = new TextEncoder().encode(serialized).length;
    
    // Check if we need to evict entries
    await this.evictIfNeeded(size);

    const entry: CacheEntry<T> = {
      key,
      value,
      size,
      created: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      ttl: ttl || this.cacheConfig.ttl,
      compressed: this.cacheConfig.compressionEnabled
    };

    this.cache.set(key, entry);
  }

  async cacheGet<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = new Date();
    const ageSeconds = (now.getTime() - entry.created.getTime()) / 1000;
    if (ageSeconds > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.lastAccessed = now;
    entry.accessCount++;

    return entry.value;
  }

  cacheDelete(key: string): boolean {
    return this.cache.delete(key);
  }

  getCacheStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    
    // Simple hit rate calculation (would be more sophisticated in real implementation)
    const hitRate = entries.length > 0 ? (totalHits / entries.length) * 100 : 0;

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate,
      missRate: 100 - hitRate,
      evictionCount: 0, // Would track this in real implementation
      compressionRatio: this.cacheConfig.compressionEnabled ? 0.7 : 1.0, // Estimated
      oldestEntry: entries.length > 0 ? 
        new Date(Math.min(...entries.map(e => e.created.getTime()))) : new Date(),
      newestEntry: entries.length > 0 ? 
        new Date(Math.max(...entries.map(e => e.created.getTime()))) : new Date()
    };
  }

  /**
   * Generate performance optimization recommendations
   */
  generateRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const health = this.getSystemHealth();
    const cacheStats = this.getCacheStats();

    // Memory usage recommendations
    if (health.totalMemoryUsage > 500) {
      recommendations.push({
        type: 'MEMORY',
        severity: 'HIGH',
        title: 'High Memory Usage Detected',
        description: `System is using ${health.totalMemoryUsage}MB of memory`,
        estimatedImpact: 'SIGNIFICANT',
        implementationEffort: 'MEDIUM',
        recommendation: 'Enable garbage collection optimization and increase cache eviction frequency',
        technicalDetails: 'Consider implementing memory pooling and optimizing data structures'
      });
    }

    // Cache efficiency recommendations
    if (cacheStats.hitRate < 50) {
      recommendations.push({
        type: 'CACHE',
        severity: 'MEDIUM',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${cacheStats.hitRate.toFixed(1)}%`,
        estimatedImpact: 'MODERATE',
        implementationEffort: 'LOW',
        recommendation: 'Optimize caching strategy and increase cache size',
        technicalDetails: 'Review cache TTL settings and implement smarter prefetching'
      });
    }

    // Response time recommendations
    if (health.averageSystemResponseTime > 1000) {
      recommendations.push({
        type: 'QUERY',
        severity: 'HIGH',
        title: 'Slow Response Times',
        description: `Average response time is ${health.averageSystemResponseTime}ms`,
        estimatedImpact: 'MAJOR',
        implementationEffort: 'HIGH',
        recommendation: 'Optimize database queries and implement request batching',
        technicalDetails: 'Add database indexes and implement query result caching'
      });
    }

    // Error rate recommendations
    if (health.errorRate > 5) {
      recommendations.push({
        type: 'STORAGE',
        severity: 'CRITICAL',
        title: 'High Error Rate',
        description: `System error rate is ${health.errorRate.toFixed(1)}%`,
        estimatedImpact: 'MAJOR',
        implementationEffort: 'HIGH',
        recommendation: 'Investigate error sources and implement better error handling',
        technicalDetails: 'Add comprehensive logging and implement circuit breaker patterns'
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(timeframeDays: number = 7): PerformanceReport {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

    const metrics = this.getSystemHealth();
    const recommendations = this.generateRecommendations();
    const trends = this.calculateTrends(timeframeDays);

    const report: PerformanceReport = {
      id: `perf_report_${Date.now()}`,
      generated: new Date(),
      timeframe: { start: startDate, end: endDate },
      metrics,
      trends,
      recommendations,
      summary: this.generateSummary(metrics, trends, recommendations)
    };

    this.performanceHistory.push(report);
    
    // Keep only last 30 reports
    if (this.performanceHistory.length > 30) {
      this.performanceHistory = this.performanceHistory.slice(-30);
    }

    return report;
  }

  /**
   * Get optimization suggestions for specific service
   */
  getServiceOptimizations(serviceName: string): OptimizationRecommendation[] {
    const serviceMetrics = this.metrics.get(serviceName);
    if (!serviceMetrics) {
      return [];
    }

    const recommendations: OptimizationRecommendation[] = [];

    // Check for slow operations
    Object.entries(serviceMetrics.averageResponseTimes).forEach(([operation, time]) => {
      if (time > 2000) {
        recommendations.push({
          type: 'QUERY',
          severity: 'HIGH',
          title: `Slow ${operation} Operation`,
          description: `${operation} averages ${time}ms`,
          estimatedImpact: 'SIGNIFICANT',
          implementationEffort: 'MEDIUM',
          recommendation: `Optimize ${operation} implementation`,
          technicalDetails: `Consider caching, indexing, or algorithm improvements for ${operation}`
        });
      }
    });

    // Check for high error rates
    Object.entries(serviceMetrics.errorRates).forEach(([operation, rate]) => {
      if (rate > 5) {
        recommendations.push({
          type: 'STORAGE',
          severity: 'HIGH',
          title: `High Error Rate in ${operation}`,
          description: `${operation} has ${rate.toFixed(1)}% error rate`,
          estimatedImpact: 'MAJOR',
          implementationEffort: 'HIGH',
          recommendation: `Improve error handling for ${operation}`,
          technicalDetails: `Add retry logic, validation, and better error recovery for ${operation}`
        });
      }
    });

    return recommendations;
  }

  // Private helper methods

  private async evictIfNeeded(newEntrySize: number): Promise<void> {
    const currentSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    const maxSizeBytes = this.cacheConfig.maxSize * 1024 * 1024; // Convert MB to bytes

    if (currentSize + newEntrySize > maxSizeBytes) {
      const entries = Array.from(this.cache.entries());
      
      // Sort by eviction policy
      switch (this.cacheConfig.evictionPolicy) {
        case 'LRU':
          entries.sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
          break;
        case 'LFU':
          entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
          break;
        case 'FIFO':
          entries.sort(([, a], [, b]) => a.created.getTime() - b.created.getTime());
          break;
      }

      // Evict entries until we have enough space
      let freedSize = 0;
      for (const [key, entry] of entries) {
        this.cache.delete(key);
        freedSize += entry.size;
        if (freedSize >= newEntrySize || currentSize - freedSize + newEntrySize <= maxSizeBytes) {
          break;
        }
      }
    }
  }

  private calculateTrends(timeframeDays: number): PerformanceTrend[] {
    // Simplified trend calculation
    // In real implementation, would compare against historical data
    return [
      {
        metric: 'Response Time',
        trend: 'STABLE',
        changePercentage: 2.5,
        timeframe: timeframeDays,
        significance: 'LOW'
      },
      {
        metric: 'Memory Usage',
        trend: 'IMPROVING',
        changePercentage: -5.2,
        timeframe: timeframeDays,
        significance: 'MEDIUM'
      }
    ];
  }

  private generateSummary(
    metrics: SystemHealthMetrics,
    trends: PerformanceTrend[],
    recommendations: OptimizationRecommendation[]
  ): string {
    const healthStatus = metrics.overallHealth.toLowerCase();
    const criticalRecommendations = recommendations.filter(r => r.severity === 'CRITICAL').length;
    const improvingTrends = trends.filter(t => t.trend === 'IMPROVING').length;

    return `System health is ${healthStatus}. ` +
           `${criticalRecommendations} critical issues require immediate attention. ` +
           `${improvingTrends} metrics showing improvement. ` +
           `Memory usage: ${metrics.totalMemoryUsage}MB, ` +
           `Error rate: ${metrics.errorRate.toFixed(1)}%, ` +
           `Average response: ${metrics.averageSystemResponseTime}ms.`;
  }

  private getUptime(): number {
    // In real implementation, would track actual start time
    return Date.now() / 1000; // Simplified uptime
  }

  private startPerformanceMonitoring(): void {
    // Start background monitoring tasks
    setInterval(() => {
      this.cleanExpiredCacheEntries();
    }, 60000); // Clean every minute
  }

  private cleanExpiredCacheEntries(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const ageSeconds = (now.getTime() - entry.created.getTime()) / 1000;
      if (ageSeconds > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

// Factory function for service creation
export function createPerformanceOptimizationService(
  cacheConfig?: Partial<CacheConfiguration>
): PerformanceOptimizationService {
  return new PerformanceOptimizationService(cacheConfig);
}
