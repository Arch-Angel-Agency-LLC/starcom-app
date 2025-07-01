/**
 * Simple Performance Monitoring Utility
 * Low-impact performance tracking for development insights
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  totalOperations: number;
  averageDuration: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
}

/**
 * Simple performance monitor that doesn't interfere with existing code
 */
export class SimplePerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private readonly maxStoredMetrics = 1000;

  /**
   * Start timing an operation
   */
  startTiming(name: string, metadata?: Record<string, unknown>): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.metrics.set(id, metric);
    return id;
  }

  /**
   * End timing an operation
   */
  endTiming(id: string): PerformanceMetric | null {
    const metric = this.metrics.get(id);
    if (!metric) {
      console.warn(`Performance metric not found: ${id}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.metrics.delete(id);
    this.completedMetrics.push(metric);

    // Limit stored metrics to prevent memory issues
    if (this.completedMetrics.length > this.maxStoredMetrics) {
      this.completedMetrics.shift();
    }

    return metric;
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(
    name: string, 
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const id = this.startTiming(name, metadata);
    try {
      const result = await fn();
      this.endTiming(id);
      return result;
    } catch (error) {
      this.endTiming(id);
      throw error;
    }
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const metrics = [...this.completedMetrics];
    const totalOperations = metrics.length;
    
    if (totalOperations === 0) {
      return {
        metrics: [],
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const durations = metrics.map(m => m.duration!).filter(d => d !== undefined);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const slowestOperation = metrics.reduce((slowest, current) => 
      !slowest || (current.duration! > slowest.duration!) ? current : slowest
    );
    
    const fastestOperation = metrics.reduce((fastest, current) => 
      !fastest || (current.duration! < fastest.duration!) ? current : fastest
    );

    return {
      metrics,
      totalOperations,
      averageDuration,
      slowestOperation,
      fastestOperation
    };
  }

  /**
   * Get metrics for a specific operation name
   */
  getMetricsFor(name: string): PerformanceMetric[] {
    return this.completedMetrics.filter(m => m.name === name);
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.completedMetrics.length = 0;
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const report = this.getReport();
    console.group('🚀 Performance Summary');
    console.log(`Total Operations: ${report.totalOperations}`);
    console.log(`Average Duration: ${report.averageDuration.toFixed(2)}ms`);
    
    if (report.slowestOperation) {
      console.log(`Slowest: ${report.slowestOperation.name} (${report.slowestOperation.duration!.toFixed(2)}ms)`);
    }
    
    if (report.fastestOperation) {
      console.log(`Fastest: ${report.fastestOperation.name} (${report.fastestOperation.duration!.toFixed(2)}ms)`);
    }
    
    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = new SimplePerformanceMonitor();

// Helper functions for quick use
export const timeOperation = (name: string, metadata?: Record<string, unknown>) => 
  performanceMonitor.startTiming(name, metadata);

export const endOperation = (id: string) => 
  performanceMonitor.endTiming(id);

export const timeFunction = <T>(
  name: string, 
  fn: () => T | Promise<T>,
  metadata?: Record<string, unknown>
) => performanceMonitor.timeFunction(name, fn, metadata);
