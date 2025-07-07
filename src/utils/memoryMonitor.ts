/**
 * Memory Monitoring Utility
 * Provides global memory monitoring and resource management for the application
 */

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryStats {
  usedMB: number;
  totalMB: number;
  limitMB: number;
  usagePercentage: number;
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private readonly MEMORY_WARNING_THRESHOLD = 100; // MB
  private readonly MEMORY_CRITICAL_THRESHOLD = 200; // MB
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  
  private monitoring = false;
  private intervalId?: NodeJS.Timeout;
  private lastStats: MemoryStats | null = null;
  
  private constructor() {}
  
  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }
  
  public startMonitoring(): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
    }, this.CHECK_INTERVAL);
    
    console.log('🔍 Memory monitoring started');
  }
  
  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.monitoring = false;
    console.log('⏹️ Memory monitoring stopped');
  }
  
  public getMemoryStats(): MemoryStats | null {
    if (!this.isMemoryAPIAvailable()) {
      return null;
    }
    
    const memInfo = this.getMemoryInfo();
    if (!memInfo) return null;
    
    const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
    const totalMB = memInfo.totalJSHeapSize / 1024 / 1024;
    const limitMB = memInfo.jsHeapSizeLimit / 1024 / 1024;
    const usagePercentage = (usedMB / limitMB) * 100;
    
    return {
      usedMB: Math.round(usedMB * 100) / 100,
      totalMB: Math.round(totalMB * 100) / 100,
      limitMB: Math.round(limitMB * 100) / 100,
      usagePercentage: Math.round(usagePercentage * 100) / 100
    };
  }
  
  public isMemoryUsageHigh(): boolean {
    const stats = this.getMemoryStats();
    return stats ? stats.usedMB > this.MEMORY_WARNING_THRESHOLD : false;
  }
  
  public isMemoryUsageCritical(): boolean {
    const stats = this.getMemoryStats();
    return stats ? stats.usedMB > this.MEMORY_CRITICAL_THRESHOLD : false;
  }
  
  private checkMemoryUsage(): void {
    const stats = this.getMemoryStats();
    if (!stats) return;
    
    this.lastStats = stats;
    
    if (stats.usedMB > this.MEMORY_CRITICAL_THRESHOLD) {
      console.warn('🚨 CRITICAL MEMORY USAGE:', {
        usedMB: stats.usedMB,
        threshold: this.MEMORY_CRITICAL_THRESHOLD,
        percentage: stats.usagePercentage
      });
      
      // Trigger garbage collection if available
      this.forceGarbageCollection();
      
      // Emit custom event for other components to clean up
      this.emitMemoryPressureEvent('critical');
      
    } else if (stats.usedMB > this.MEMORY_WARNING_THRESHOLD) {
      console.warn('⚠️ HIGH MEMORY USAGE:', {
        usedMB: stats.usedMB,
        threshold: this.MEMORY_WARNING_THRESHOLD,
        percentage: stats.usagePercentage
      });
      
      this.emitMemoryPressureEvent('warning');
    }
  }
  
  private isMemoryAPIAvailable(): boolean {
    return 'memory' in performance;
  }
  
  private getMemoryInfo(): MemoryInfo | null {
    if (!this.isMemoryAPIAvailable()) return null;
    
    const performanceWithMemory = performance as { memory?: MemoryInfo };
    return performanceWithMemory.memory || null;
  }
  
  private forceGarbageCollection(): void {
    // Force garbage collection if available (Chrome DevTools)
    const windowWithGC = window as { gc?: () => void };
    if (windowWithGC.gc) {
      try {
        windowWithGC.gc();
        console.log('🗑️ Forced garbage collection');
      } catch (error) {
        console.warn('Failed to force garbage collection:', error);
      }
    }
  }
  
  private emitMemoryPressureEvent(level: 'warning' | 'critical'): void {
    const event = new CustomEvent('memoryPressure', {
      detail: {
        level,
        stats: this.lastStats,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  }
  
  // Utility method to check if a large operation should proceed
  public shouldProceedWithLargeOperation(): boolean {
    return !this.isMemoryUsageCritical();
  }
  
  // Utility method to get recommended page size based on memory usage
  public getRecommendedPageSize(defaultSize: number, maxSize: number): number {
    const stats = this.getMemoryStats();
    if (!stats) return defaultSize;
    
    if (stats.usedMB > this.MEMORY_CRITICAL_THRESHOLD) {
      return Math.min(defaultSize * 0.5, 10); // Reduce to 50% or 10, whichever is smaller
    } else if (stats.usedMB > this.MEMORY_WARNING_THRESHOLD) {
      return Math.min(defaultSize * 0.75, maxSize * 0.5); // Reduce to 75% of default
    }
    
    return Math.min(defaultSize, maxSize);
  }
}

// Export singleton instance
export const memoryMonitor = MemoryMonitor.getInstance();

// Auto-start monitoring in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  memoryMonitor.startMonitoring();
}

// Add cleanup listener for memory pressure events
if (typeof window !== 'undefined') {
  window.addEventListener('memoryPressure', (event: CustomEvent) => {
    const { level, stats } = event.detail;
    console.log(`📊 Memory pressure event: ${level}`, stats);
  });
}
