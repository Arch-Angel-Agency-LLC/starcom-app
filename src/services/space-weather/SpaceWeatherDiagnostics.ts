import { visualizationResourceMonitor } from '../visualization/VisualizationResourceMonitor';

export interface CacheSnapshotEntry {
  key: string;
  hits: number;
  lastAccessed: number;
  expiresAt?: number;
  priorityLevel: 'low' | 'normal' | 'high' | 'critical';
  size: number;
}

export interface CacheDiagnosticsPayload {
  stats: {
    totalEntries: number;
    averageHits: number;
    qualityDistribution: { high: number; medium: number; low: number };
    priorityDistribution: { critical: number; high: number; normal: number; low: number };
    providerDistribution: { legacy: number; enterprise: number; enhanced: number };
  };
  snapshot: CacheSnapshotEntry[];
  timestamp: number;
}

export interface ProviderMetricEntry {
  datasetId: string;
  durationMs: number;
  success: boolean;
  timestamp: number;
  error?: string;
}

export interface AdapterMetricEntry {
  adapterId: string;
  durationMs: number;
  success: boolean;
  timestamp: number;
  vectors?: number;
  error?: string;
}

export interface SpaceWeatherDiagnosticsState {
  cache: CacheDiagnosticsPayload;
  providers: {
    entries: ProviderMetricEntry[];
    timestamp: number;
  };
  adapters: {
    entries: AdapterMetricEntry[];
    timestamp: number;
  };
}

type DiagnosticsListener = (state: SpaceWeatherDiagnosticsState) => void;

const SPACE_WEATHER_MODE_KEY = 'EcoNatural.SpaceWeather' as const;
const DIAGNOSTIC_ENTRY_BYTES_ESTIMATE = 128;
const CACHE_ENTRY_SIZE_MULTIPLIER = 1024; // cache snapshot reports KB; convert to bytes
const LATENCY_WARNING_THRESHOLD_MS = 900;

const DEFAULT_CACHE_STATE: CacheDiagnosticsPayload = {
  stats: {
    totalEntries: 0,
    averageHits: 0,
    qualityDistribution: { high: 0, medium: 0, low: 0 },
    priorityDistribution: { critical: 0, high: 0, normal: 0, low: 0 },
    providerDistribution: { legacy: 0, enterprise: 0, enhanced: 0 }
  },
  snapshot: [],
  timestamp: Date.now()
};

const DEFAULT_STATE: SpaceWeatherDiagnosticsState = {
  cache: DEFAULT_CACHE_STATE,
  providers: { entries: [], timestamp: Date.now() },
  adapters: { entries: [], timestamp: Date.now() }
};

export class SpaceWeatherDiagnostics {
  private static instance: SpaceWeatherDiagnostics;
  private state: SpaceWeatherDiagnosticsState = DEFAULT_STATE;
  private listeners = new Set<DiagnosticsListener>();
  private readonly maxEntries = 50;

  static getInstance(): SpaceWeatherDiagnostics {
    if (!SpaceWeatherDiagnostics.instance) {
      SpaceWeatherDiagnostics.instance = new SpaceWeatherDiagnostics();
    }
    return SpaceWeatherDiagnostics.instance;
  }

  getState(): SpaceWeatherDiagnosticsState {
    return this.state;
  }

  subscribe(listener: DiagnosticsListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  updateCache(payload: CacheDiagnosticsPayload) {
    this.state = {
      ...this.state,
      cache: payload
    };
    this.notify();
    this.reportResourceUsage();
  }

  recordProviderMetric(entry: ProviderMetricEntry) {
    const entries = [entry, ...this.state.providers.entries];
    this.state = {
      ...this.state,
      providers: {
        entries: entries.slice(0, this.maxEntries),
        timestamp: entry.timestamp
      }
    };
    this.notify();
    this.recordLatency(entry.durationMs);
    this.reportResourceUsage();
  }

  recordAdapterMetric(entry: AdapterMetricEntry) {
    const entries = [entry, ...this.state.adapters.entries];
    this.state = {
      ...this.state,
      adapters: {
        entries: entries.slice(0, this.maxEntries),
        timestamp: entry.timestamp
      }
    };
    this.notify();
    this.recordLatency(entry.durationMs);
    this.reportResourceUsage();
  }

  private notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.warn('SpaceWeatherDiagnostics listener error', error);
      }
    });
  }

  private reportResourceUsage() {
    const diagnosticsEntries =
      this.state.cache.snapshot.length +
      this.state.providers.entries.length +
      this.state.adapters.entries.length;

    if (diagnosticsEntries > 0) {
      visualizationResourceMonitor.recordDiagnosticsUsage(
        SPACE_WEATHER_MODE_KEY,
        diagnosticsEntries,
        diagnosticsEntries * DIAGNOSTIC_ENTRY_BYTES_ESTIMATE
      );
    }

    const cacheBytes = this.estimateCacheBytes(this.state.cache.snapshot);
    if (cacheBytes > 0) {
      visualizationResourceMonitor.recordOverlayCache(SPACE_WEATHER_MODE_KEY, cacheBytes);
    }
  }

  private estimateCacheBytes(snapshot: CacheSnapshotEntry[]) {
    if (!snapshot.length) return 0;
    const totalSize = snapshot.reduce((sum, entry) => sum + (entry.size || 0), 0);
    return totalSize * CACHE_ENTRY_SIZE_MULTIPLIER;
  }

  private recordLatency(durationMs: number) {
    if (durationMs >= LATENCY_WARNING_THRESHOLD_MS) {
      visualizationResourceMonitor.recordLongTask(SPACE_WEATHER_MODE_KEY, durationMs);
    }
  }
}

export const spaceWeatherDiagnostics = SpaceWeatherDiagnostics.getInstance();
