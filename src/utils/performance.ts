/**
 * Memory Management and Performance Optimization Utilities
 * Handles cleanup, debouncing, and resource management for enhanced performance
 */

// ===== CLEANUP MANAGER =====

export class CleanupManager {
  private cleanupFunctions: Array<() => void> = [];
  private intervals: NodeJS.Timeout[] = [];
  private timeouts: NodeJS.Timeout[] = [];
  private abortControllers: AbortController[] = [];

  /**
   * Add a cleanup function to be called when cleaning up
   */
  addCleanup(cleanup: () => void): void {
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Register an interval for cleanup
   */
  addInterval(interval: NodeJS.Timeout): void {
    this.intervals.push(interval);
  }

  /**
   * Register a timeout for cleanup
   */
  addTimeout(timeout: NodeJS.Timeout): void {
    this.timeouts.push(timeout);
  }

  /**
   * Register an AbortController for cleanup
   */
  addAbortController(controller: AbortController): void {
    this.abortControllers.push(controller);
  }

  /**
   * Clean up all registered resources
   */
  cleanup(): void {
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    // Clear timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts = [];

    // Abort controllers
    this.abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.abortControllers = [];

    // Run custom cleanup functions
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    });
    this.cleanupFunctions = [];
  }
}

// ===== DEBOUNCE UTILITIES =====

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let args: Parameters<T> | null = null;
  let timestamp: number;
  let result: ReturnType<T>;

  const later = function () {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func(...args!) as ReturnType<T>;
        args = null;
      }
    }
  };

  const debounced = function (...newArgs: Parameters<T>) {
    args = newArgs;
    timestamp = Date.now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func(...args!) as ReturnType<T>;
      args = null;
    }
    return result;
  } as T & { cancel: () => void };

  debounced.cancel = function () {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      args = null;
    }
  };

  return debounced;
}

// ===== THROTTLE UTILITIES =====

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): T & { cancel: () => void } {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;

  const throttled = function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  } as T & { cancel: () => void };

  throttled.cancel = function () {
    clearTimeout(lastFunc);
    inThrottle = false;
  };

  return throttled;
}

// ===== MEMORY MONITORING =====

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  isHighUsage: boolean;
  timestamp: number;
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private callbacks: Array<(stats: MemoryStats) => void> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly highUsageThreshold = 0.8; // 80%

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats | null {
    if (!('memory' in performance)) {
      console.warn('Performance.memory not available in this environment');
      return null;
    }

    interface MemoryInfo {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }

    const memory = (performance as unknown as { memory: MemoryInfo }).memory;
    const usagePercentage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage,
      isHighUsage: usagePercentage > this.highUsageThreshold,
      timestamp: Date.now()
    };
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(intervalMs = 10000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      if (stats) {
        this.callbacks.forEach(callback => {
          try {
            callback(stats);
          } catch (error) {
            console.warn('Error in memory monitor callback:', error);
          }
        });

        // Log warnings for high memory usage
        if (stats.isHighUsage) {
          console.warn(`High memory usage detected: ${(stats.usagePercentage * 100).toFixed(1)}%`);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Add a callback for memory statistics
   */
  onMemoryUpdate(callback: (stats: MemoryStats) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Force garbage collection if available (development only)
   */
  forceGC(): void {
    interface WindowWithGC extends Window {
      gc?: () => void;
    }
    
    const windowWithGC = window as WindowWithGC;
    
    if ('gc' in window && typeof windowWithGC.gc === 'function') {
      try {
        windowWithGC.gc();
        console.log('Forced garbage collection');
      } catch (error) {
        console.warn('Failed to force garbage collection:', error);
      }
    } else {
      console.warn('Garbage collection not available');
    }
  }
}

// ===== CACHE MANAGER =====

export class LRUCache<K, V> {
  private maxSize: number;
  private cache = new Map<K, V>();

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  values(): IterableIterator<V> {
    return this.cache.values();
  }
}

// ===== PERFORMANCE UTILITIES =====

export class PerformanceTracker {
  private measurements = new Map<string, number[]>();

  /**
   * Start a performance measurement
   */
  start(label: string): void {
    performance.mark(`${label}-start`);
  }

  /**
   * End a performance measurement and record the duration
   */
  end(label: string): number {
    const endMark = `${label}-end`;
    const measureName = `${label}-measure`;
    
    performance.mark(endMark);
    performance.measure(measureName, `${label}-start`, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    const duration = measure ? measure.duration : 0;
    
    // Record measurement
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
    
    // Clean up performance entries
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    return duration;
  }

  /**
   * Get statistics for a measurement label
   */
  getStats(label: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    total: number;
  } | null {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const total = measurements.reduce((sum, duration) => sum + duration, 0);
    const avg = total / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return {
      count: measurements.length,
      avg: Number(avg.toFixed(2)),
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
  }

  /**
   * Get all measurement labels
   */
  getLabels(): string[] {
    return Array.from(this.measurements.keys());
  }
}

// ===== EXPORTS =====

export const performanceTracker = new PerformanceTracker();
export const memoryMonitor = MemoryMonitor.getInstance();
