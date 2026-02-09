import type { VisualizationMode } from '../../context/VisualizationModeContext';
import { emitDiagnosticTrace } from '../tracing/traceEmitters';

type VisualizationModeKey =
  | 'EcoNatural.SpaceWeather'
  | 'EcoNatural.EcologicalDisasters'
  | 'EcoNatural.EarthWeather'
  | 'CyberCommand.IntelReports'
  | 'CyberCommand.CyberThreats'
  | 'CyberCommand.CyberAttacks'
  | 'CyberCommand.Satellites'
  | 'CyberCommand.CommHubs'
  | 'GeoPolitical.NationalTerritories'
  | 'GeoPolitical.DiplomaticEvents'
  | 'GeoPolitical.ResourceZones'
  | 'Globe.Core';

export interface VectorMetric {
  count: number;
  approxBytes: number;
}

export interface HeapMetric {
  usedBytes: number;
  limitBytes?: number;
  percent?: number;
}

export interface GeometryMetric {
  meshes: number;
  materials: number;
  textures: number;
  approxGpuBytes?: number;
}

export interface ModeResourceSnapshot {
  mode: VisualizationModeKey;
  timestamp: number;
  vectors?: VectorMetric;
  pipelineVectors?: VectorMetric;
  diagnosticsEntries?: number;
  overlayCacheBytes?: number;
  geometries?: GeometryMetric;
  heap?: HeapMetric;
  longTasks?: number;
  warnings: string[];
}

export interface ResourceBudget {
  maxVectors?: number;
  maxPipelineVectors?: number;
  maxHeapBytes?: number;
  maxGpuBytes?: number;
  maxDiagnosticsEntries?: number;
}

interface VisualizationResourceMonitorOptions {
  warningDebounceMs?: number;
  heapWarningDeltaBytes?: number;
  snapshotTtlMs?: number;
  snapshotCap?: number;
  snapshotWarningThreshold?: number;
  onSnapshotEvent?: (event: SnapshotTelemetryEvent) => void;
}

type WarningListener = (snapshot: ModeResourceSnapshot) => void;

type SnapshotEvictionReason = 'ttl' | 'cap';

export type SnapshotTelemetryEvent =
  | {
      type: 'evict';
      key: VisualizationModeKey;
      reason: SnapshotEvictionReason;
      ageMs: number;
    }
  | {
      type: 'size';
      active: number;
      cap: number;
      utilization: number;
      warning: boolean;
    };

function buildKey(mode: VisualizationMode | VisualizationModeKey): VisualizationModeKey {
  if (typeof mode === 'string') return mode as VisualizationModeKey;
  return `${mode.mode}.${mode.subMode}` as VisualizationModeKey;
}

const DEFAULT_VECTOR_BYTES = 64; // rough size of ElectricFieldVector-like objects
const DEFAULT_PIPELINE_VECTOR_BYTES = 48;

const defaultOptions = {
  warningDebounceMs: 1_500,
  heapWarningDeltaBytes: 64_000_000,
  snapshotTtlMs: 5 * 60 * 1000,
  snapshotCap: 24,
  snapshotWarningThreshold: 0.9
};

export class VisualizationResourceMonitorImpl {
  private snapshots = new Map<VisualizationModeKey, ModeResourceSnapshot>();
  private budgets = new Map<VisualizationModeKey, ResourceBudget>();
  private listeners = new Set<WarningListener>();
  private pendingWarnings = new Map<VisualizationModeKey, ReturnType<typeof setTimeout>>();
  private lastWarningSnapshots = new Map<VisualizationModeKey, ModeResourceSnapshot>();
  private warningEmissions = 0;

  private readonly warningDebounceMs: number;
  private readonly heapWarningDeltaBytes: number;
  private readonly snapshotTtlMs: number;
  private readonly snapshotCap: number;
  private readonly snapshotWarningThreshold: number;
  private readonly onSnapshotEvent?: (event: SnapshotTelemetryEvent) => void;

  constructor(options: VisualizationResourceMonitorOptions = {}) {
    this.warningDebounceMs = options.warningDebounceMs ?? defaultOptions.warningDebounceMs;
    this.heapWarningDeltaBytes = options.heapWarningDeltaBytes ?? defaultOptions.heapWarningDeltaBytes;
    this.snapshotTtlMs = options.snapshotTtlMs ?? defaultOptions.snapshotTtlMs;
    this.snapshotCap = options.snapshotCap ?? defaultOptions.snapshotCap;
    this.snapshotWarningThreshold = options.snapshotWarningThreshold ?? defaultOptions.snapshotWarningThreshold;
    this.onSnapshotEvent = options.onSnapshotEvent;
  }

  recordVectors(mode: VisualizationMode | VisualizationModeKey, metric: Partial<VectorMetric> & { count: number }) {
    const key = buildKey(mode);
    const approxBytes = metric.approxBytes ?? metric.count * DEFAULT_VECTOR_BYTES;
    this.updateSnapshot(key, snapshot => ({
      ...snapshot,
      vectors: { count: metric.count, approxBytes }
    }));
  }

  recordPipelineVectors(mode: VisualizationMode | VisualizationModeKey, metric: Partial<VectorMetric> & { count: number }) {
    const key = buildKey(mode);
    const approxBytes = metric.approxBytes ?? metric.count * DEFAULT_PIPELINE_VECTOR_BYTES;
    this.updateSnapshot(key, snapshot => ({
      ...snapshot,
      pipelineVectors: { count: metric.count, approxBytes }
    }));
  }

  recordDiagnosticsUsage(mode: VisualizationMode | VisualizationModeKey, entries: number, approxBytes: number) {
    const key = buildKey(mode);
    this.updateSnapshot(key, snapshot => ({
      ...snapshot,
      diagnosticsEntries: entries,
      overlayCacheBytes: Math.max(snapshot.overlayCacheBytes ?? 0, approxBytes)
    }));
  }

  recordOverlayCache(mode: VisualizationMode | VisualizationModeKey, bytes: number) {
    const key = buildKey(mode);
    this.updateSnapshot(key, snapshot => ({
      ...snapshot,
      overlayCacheBytes: bytes
    }));
  }

  recordGeometry(mode: VisualizationMode | VisualizationModeKey, metric: GeometryMetric) {
    const key = buildKey(mode);
    this.updateSnapshot(key, snapshot => ({
      ...snapshot,
      geometries: metric
    }));
  }

  recordHeap(mode: VisualizationMode | VisualizationModeKey, heapUsedBytes: number, heapLimitBytes?: number) {
    const key = buildKey(mode);
    this.updateSnapshot(key, snapshot => ({
      ...snapshot,
      heap: {
        usedBytes: heapUsedBytes,
        limitBytes: heapLimitBytes ?? snapshot.heap?.limitBytes,
        percent: heapLimitBytes ? (heapUsedBytes / heapLimitBytes) * 100 : snapshot.heap?.percent
      }
    }));
  }

  recordLongTask(mode: VisualizationMode | VisualizationModeKey, durationMs: number) {
    if (durationMs < 50) return; // ignore trivial tasks
    const key = buildKey(mode);
    this.updateSnapshot(key, snapshot => ({
      ...snapshot,
      longTasks: (snapshot.longTasks ?? 0) + 1
    }));
  }

  clearMode(mode: VisualizationMode | VisualizationModeKey) {
    const key = buildKey(mode);
    this.snapshots.delete(key);
    this.clearPendingWarning(key);
    this.lastWarningSnapshots.delete(key);
  }

  getSnapshot(mode?: VisualizationMode | VisualizationModeKey): ModeResourceSnapshot | ModeResourceSnapshot[] {
    if (!mode) return Array.from(this.snapshots.values());
    const key = buildKey(mode);
    return this.snapshots.get(key) ?? { mode: key, timestamp: Date.now(), warnings: [] };
  }

  setBudgets(mode: VisualizationModeKey, budget: ResourceBudget) {
    this.budgets.set(mode, budget);
  }

  getGlobalSummary() {
    const snapshots = Array.from(this.snapshots.values());
    return {
      totalVectors: snapshots.reduce((sum, snap) => sum + (snap.vectors?.count ?? 0), 0),
      totalApproxBytes: snapshots.reduce((sum, snap) => sum + (snap.vectors?.approxBytes ?? 0), 0),
      heapUsedBytes: snapshots.reduce((max, snap) => Math.max(max, snap.heap?.usedBytes ?? 0), 0),
      warnings: snapshots.filter(snap => snap.warnings.length > 0)
    };
  }

  getWarningStats() {
    return {
      emissions: this.warningEmissions,
      listeners: this.listeners.size
    };
  }

  onWarning(listener: WarningListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateSnapshot(key: VisualizationModeKey, updater: (snapshot: ModeResourceSnapshot) => ModeResourceSnapshot) {
    const prev = this.snapshots.get(key) ?? { mode: key, timestamp: Date.now(), warnings: [] };
    const next = updater({ ...prev, timestamp: Date.now(), warnings: [...prev.warnings] });
    next.warnings = this.applyBudgets(key, next);
    this.snapshots.set(key, next);
    this.scheduleWarning(key, prev, next);
    this.cleanupSnapshots();
  }

  private applyBudgets(key: VisualizationModeKey, snapshot: ModeResourceSnapshot) {
    const budget = this.budgets.get(key);
    if (!budget) return snapshot.warnings;
    const warnings = new Set(snapshot.warnings);
    if (budget.maxVectors && snapshot.vectors && snapshot.vectors.count > budget.maxVectors) {
      warnings.add(`vectors>${budget.maxVectors}`);
    }
    if (budget.maxPipelineVectors && snapshot.pipelineVectors && snapshot.pipelineVectors.count > budget.maxPipelineVectors) {
      warnings.add(`pipelineVectors>${budget.maxPipelineVectors}`);
    }
    if (budget.maxHeapBytes && snapshot.heap?.usedBytes && snapshot.heap.usedBytes > budget.maxHeapBytes) {
      warnings.add(`heap>${Math.round(budget.maxHeapBytes / 1_000_000)}MB`);
    }
    if (budget.maxDiagnosticsEntries && snapshot.diagnosticsEntries && snapshot.diagnosticsEntries > budget.maxDiagnosticsEntries) {
      warnings.add(`diagnostics>${budget.maxDiagnosticsEntries}`);
    }
    if (budget.maxGpuBytes && snapshot.geometries?.approxGpuBytes && snapshot.geometries.approxGpuBytes > budget.maxGpuBytes) {
      warnings.add(`gpu>${Math.round(budget.maxGpuBytes / 1_000_000)}MB`);
    }
    return this.normalizeWarnings(Array.from(warnings));
  }

  private scheduleWarning(key: VisualizationModeKey, prev: ModeResourceSnapshot, next: ModeResourceSnapshot) {
    if (!next.warnings.length) {
      this.clearPendingWarning(key);
      this.lastWarningSnapshots.delete(key);
      return;
    }

    const prevWarn = this.lastWarningSnapshots.get(key);
    const prevWarningsKey = prevWarn ? prevWarn.warnings.join('|') : '';
    const nextWarningsKey = next.warnings.join('|');
    const prevHeap = prevWarn?.heap?.usedBytes ?? 0;
    const nextHeap = next.heap?.usedBytes ?? 0;
    const heapDelta = Math.max(0, nextHeap - prevHeap);
    const warningsChanged = prevWarningsKey !== nextWarningsKey;
    const deltaExceeded = heapDelta >= this.heapWarningDeltaBytes;

    if (!warningsChanged && !deltaExceeded) return;

    this.clearPendingWarning(key);
    const emission: ModeResourceSnapshot = { ...next, warnings: [...next.warnings] };
    emitDiagnosticTrace(
      'viz_heap_warning',
      {
        mode: key,
        warnings: emission.warnings,
        heap: emission.heap,
        overlayCacheBytes: emission.overlayCacheBytes,
        vectors: emission.vectors,
        pipelineVectors: emission.pipelineVectors,
        geometries: emission.geometries
      },
      'warn'
    );
    const timer = setTimeout(() => {
      this.lastWarningSnapshots.set(key, emission);
      this.warningEmissions += 1;
      this.listeners.forEach(listener => listener(emission));
      if (import.meta.env.DEV) {
        console.warn('[VisualizationResourceMonitor]', key, emission.warnings, {
          vectors: emission.vectors,
          pipelineVectors: emission.pipelineVectors,
          geometries: emission.geometries,
          heap: emission.heap,
          overlayCacheBytes: emission.overlayCacheBytes
        });
      }
    }, this.warningDebounceMs);

    this.pendingWarnings.set(key, timer);
  }

  private clearPendingWarning(key: VisualizationModeKey) {
    const timer = this.pendingWarnings.get(key);
    if (timer) {
      clearTimeout(timer);
      this.pendingWarnings.delete(key);
    }
  }

  private cleanupSnapshots() {
    const evicted: SnapshotTelemetryEvent[] = [];
    const now = Date.now();
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (now - snapshot.timestamp > this.snapshotTtlMs) {
        this.snapshots.delete(key);
        this.clearPendingWarning(key);
        this.lastWarningSnapshots.delete(key);
        evicted.push({ type: 'evict', key, reason: 'ttl', ageMs: now - snapshot.timestamp });
      }
    }

    if (this.snapshots.size > this.snapshotCap) {
      const ordered = Array.from(this.snapshots.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp);
      while (this.snapshots.size > this.snapshotCap) {
        const [evictedKey, snapshot] = ordered.shift() ?? [];
        if (evictedKey) {
          this.snapshots.delete(evictedKey);
          this.clearPendingWarning(evictedKey);
          this.lastWarningSnapshots.delete(evictedKey);
          evicted.push({ type: 'evict', key: evictedKey, reason: 'cap', ageMs: now - (snapshot?.timestamp ?? now) });
        }
      }
    }

    const utilization = this.snapshotCap > 0 ? this.snapshots.size / this.snapshotCap : 0;
    if (this.onSnapshotEvent) {
      evicted.forEach(event => this.onSnapshotEvent?.(event));
      this.onSnapshotEvent({
        type: 'size',
        active: this.snapshots.size,
        cap: this.snapshotCap,
        utilization,
        warning: utilization >= this.snapshotWarningThreshold
      });
    }

    if (utilization >= this.snapshotWarningThreshold && import.meta.env.DEV) {
      console.warn('[VisualizationResourceMonitor] snapshot utilization nearing cap', {
        active: this.snapshots.size,
        cap: this.snapshotCap,
        utilization
      });
    }
  }

  private normalizeWarnings(warnings: string[]) {
    return Array.from(new Set(warnings)).sort();
  }
}

export const visualizationResourceMonitor = new VisualizationResourceMonitorImpl();

declare global {
  interface Window {
    __STARCOM_VIS_RESOURCE_MONITOR__?: VisualizationResourceMonitorImpl;
  }
}

if (typeof window !== 'undefined') {
  window.__STARCOM_VIS_RESOURCE_MONITOR__ = visualizationResourceMonitor;
}
