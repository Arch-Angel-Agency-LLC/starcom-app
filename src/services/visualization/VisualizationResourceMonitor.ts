import type { VisualizationMode } from '../../context/VisualizationModeContext';

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

type WarningListener = (snapshot: ModeResourceSnapshot) => void;

function buildKey(mode: VisualizationMode | VisualizationModeKey): VisualizationModeKey {
  if (typeof mode === 'string') return mode as VisualizationModeKey;
  return `${mode.mode}.${mode.subMode}` as VisualizationModeKey;
}

const DEFAULT_VECTOR_BYTES = 64; // rough size of ElectricFieldVector-like objects
const DEFAULT_PIPELINE_VECTOR_BYTES = 48;

class VisualizationResourceMonitorImpl {
  private snapshots = new Map<VisualizationModeKey, ModeResourceSnapshot>();
  private budgets = new Map<VisualizationModeKey, ResourceBudget>();
  private listeners = new Set<WarningListener>();

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

  onWarning(listener: WarningListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateSnapshot(key: VisualizationModeKey, updater: (snapshot: ModeResourceSnapshot) => ModeResourceSnapshot) {
    const prev = this.snapshots.get(key) ?? { mode: key, timestamp: Date.now(), warnings: [] };
    const next = updater({ ...prev, timestamp: Date.now(), warnings: [...prev.warnings] });
    next.warnings = this.applyBudgets(key, next);
    this.snapshots.set(key, next);
    if (next.warnings.length > prev.warnings.length) {
      this.listeners.forEach(listener => listener(next));
      if (import.meta.env.DEV) {
        console.warn('[VisualizationResourceMonitor]', key, next.warnings, {
          vectors: next.vectors,
          pipelineVectors: next.pipelineVectors,
          geometries: next.geometries,
          heap: next.heap,
          overlayCacheBytes: next.overlayCacheBytes
        });
      }
    }
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
    return Array.from(warnings);
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
