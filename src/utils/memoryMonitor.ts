import { memoryBudgetConfig } from '../config/memoryBudgets';
import { emitDiagnosticTrace } from '../services/tracing/traceEmitters';

const MB = 1_000_000;

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface MemoryStats {
  usedMB: number;
  totalMB: number;
  limitMB: number;
  usagePercentage: number;
  usedBytes: number;
}

export type MemoryPressureLevel = 'warning' | 'critical';

export interface MemoryReading {
  stats: MemoryStats | null;
  level: MemoryPressureLevel | null;
}

type MemoryListener = (reading: MemoryReading) => void;

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private monitoring = false;
  private intervalId?: ReturnType<typeof setInterval>;
  private lastStats: MemoryStats | null = null;
  private lastPressureLevel: MemoryPressureLevel | null = null;
  private lastPressureBytes = 0;
  private readonly warningBytes = memoryBudgetConfig.warningBytes;
  private readonly criticalBytes = memoryBudgetConfig.criticalBytes;
  private readonly checkIntervalMs = memoryBudgetConfig.checkIntervalMs;
  private readonly emitDeltaBytes = memoryBudgetConfig.emitDeltaBytes;
  private subscribers = new Set<MemoryListener>();
  private intervalStarts = 0;

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(): void {
    if (this.monitoring || !this.isMemoryAPIAvailable()) return;
    this.monitoring = true;
    this.intervalStarts += 1;
    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkIntervalMs);
    this.checkMemoryUsage();
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.monitoring = false;
  }

  subscribe(listener: MemoryListener): () => void {
    this.subscribers.add(listener);
    if (!this.monitoring) {
      this.startMonitoring();
    }
    listener({ stats: this.lastStats, level: this.lastPressureLevel });
    return () => {
      this.subscribers.delete(listener);
      if (this.subscribers.size === 0) {
        this.stopMonitoring();
      }
    };
  }

  getMemoryStats(): MemoryStats | null {
    if (!this.isMemoryAPIAvailable()) return null;
    const memInfo = this.getMemoryInfo();
    if (!memInfo) return null;

    const usedMB = memInfo.usedJSHeapSize / MB;
    const totalMB = memInfo.totalJSHeapSize / MB;
    const limitMB = memInfo.jsHeapSizeLimit / MB;
    const usagePercentage = (usedMB / limitMB) * 100;

    const round = (value: number) => Math.round(value * 100) / 100;

    return {
      usedMB: round(usedMB),
      totalMB: round(totalMB),
      limitMB: round(limitMB),
      usagePercentage: round(usagePercentage),
      usedBytes: memInfo.usedJSHeapSize
    };
  }

  isMemoryUsageHigh(): boolean {
    const stats = this.getMemoryStats();
    return stats ? stats.usedBytes > this.warningBytes : false;
  }

  isMemoryUsageCritical(): boolean {
    const stats = this.getMemoryStats();
    return stats ? stats.usedBytes > this.criticalBytes : false;
  }

  shouldProceedWithLargeOperation(): boolean {
    return !this.isMemoryUsageCritical();
  }

  getRecommendedPageSize(defaultSize: number, maxSize: number): number {
    const stats = this.getMemoryStats();
    if (!stats) return defaultSize;

    if (stats.usedBytes > this.criticalBytes) {
      return Math.min(defaultSize * 0.5, 10);
    }
    if (stats.usedBytes > this.warningBytes) {
      return Math.min(defaultSize * 0.75, Math.max(5, maxSize * 0.5));
    }
    return Math.min(defaultSize, maxSize);
  }

  forceCheck(): void {
    this.checkMemoryUsage();
  }

  getDebugState() {
    return {
      monitoring: this.monitoring,
      subscribers: this.subscribers.size,
      intervalStarts: this.intervalStarts
    };
  }

  resetForTests() {
    this.stopMonitoring();
    this.subscribers.clear();
    this.intervalStarts = 0;
    this.lastStats = null;
    this.lastPressureLevel = null;
    this.lastPressureBytes = 0;
  }

  private checkMemoryUsage(): void {
    const stats = this.getMemoryStats();
    if (!stats) return;
    this.lastStats = stats;

    const level: MemoryPressureLevel | null = stats.usedBytes > this.criticalBytes
      ? 'critical'
      : stats.usedBytes > this.warningBytes
        ? 'warning'
        : null;

    if (this.shouldEmitPressure(level, stats.usedBytes)) {
      this.emitMemoryPressureEvent(level, stats);
      emitDiagnosticTrace(
        'heap_pressure',
        {
          level,
          usedBytes: stats.usedBytes,
          totalMB: stats.totalMB,
          limitMB: stats.limitMB,
          usagePercentage: stats.usagePercentage
        },
        level === 'critical' ? 'warn' : 'info'
      );
    }

    this.subscribers.forEach(listener => listener({ stats, level }));
  }

  private shouldEmitPressure(level: MemoryPressureLevel | null, usedBytes: number) {
    if (!level) {
      this.lastPressureLevel = null;
      this.lastPressureBytes = 0;
      return false;
    }
    const levelChanged = level !== this.lastPressureLevel;
    const delta = usedBytes - this.lastPressureBytes;
    const deltaExceeded = delta >= this.emitDeltaBytes;
    if (levelChanged || deltaExceeded) {
      this.lastPressureLevel = level;
      this.lastPressureBytes = usedBytes;
      return true;
    }
    return false;
  }

  private isMemoryAPIAvailable(): boolean {
    return typeof performance !== 'undefined' && 'memory' in performance;
  }

  private getMemoryInfo(): MemoryInfo | null {
    const performanceWithMemory = performance as { memory?: MemoryInfo };
    return performanceWithMemory.memory || null;
  }

  private emitMemoryPressureEvent(level: MemoryPressureLevel, stats: MemoryStats): void {
    const event = new CustomEvent('memoryPressure', {
      detail: {
        level,
        stats,
        timestamp: Date.now()
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }
}

export const memoryMonitor = MemoryMonitor.getInstance();
