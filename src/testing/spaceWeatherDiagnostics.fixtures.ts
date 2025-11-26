import type {
  AdapterMetricEntry,
  CacheDiagnosticsPayload,
  ProviderMetricEntry,
  SpaceWeatherDiagnosticsState
} from '../services/space-weather/SpaceWeatherDiagnostics';

const now = Date.now();

const baseCacheSnapshot: CacheDiagnosticsPayload['snapshot'] = [
  {
    key: 'legacy-intermag',
    hits: 24,
    lastAccessed: now - 5000,
    expiresAt: now + 60000,
    priorityLevel: 'normal',
    size: 450
  },
  {
    key: 'enterprise-uscanada',
    hits: 11,
    lastAccessed: now - 3000,
    expiresAt: now + 45000,
    priorityLevel: 'high',
    size: 390
  }
];

const baseCacheStats: CacheDiagnosticsPayload['stats'] = {
  totalEntries: baseCacheSnapshot.length,
  averageHits: baseCacheSnapshot.reduce((sum, entry) => sum + entry.hits, 0) / baseCacheSnapshot.length,
  qualityDistribution: { high: 2, medium: 0, low: 0 },
  priorityDistribution: { critical: 0, high: 1, normal: 1, low: 0 },
  providerDistribution: { legacy: 1, enterprise: 1, enhanced: 0 }
};

const baseProviderEntries: ProviderMetricEntry[] = [
  { datasetId: 'noaa/intermag', durationMs: 420, success: true, timestamp: now - 2000 },
  { datasetId: 'noaa/uscanada', durationMs: 310, success: true, timestamp: now - 4000 }
];

const baseAdapterEntries: AdapterMetricEntry[] = [
  { adapterId: 'noaa-intermag', durationMs: 510, success: true, timestamp: now - 1500, vectors: 820 },
  { adapterId: 'noaa-uscanada', durationMs: 480, success: true, timestamp: now - 3200, vectors: 760 }
];

function buildCachePayload(overrides?: Partial<CacheDiagnosticsPayload>): CacheDiagnosticsPayload {
  return {
    stats: {
      ...baseCacheStats,
      ...(overrides?.stats ?? {})
    },
    snapshot: overrides?.snapshot ?? baseCacheSnapshot,
    timestamp: overrides?.timestamp ?? now,
  };
}

function buildProviderMetrics(entries?: ProviderMetricEntry[], timestamp?: number) {
  return {
    entries: entries ?? baseProviderEntries,
    timestamp: timestamp ?? now
  };
}

function buildAdapterMetrics(entries?: AdapterMetricEntry[], timestamp?: number) {
  return {
    entries: entries ?? baseAdapterEntries,
    timestamp: timestamp ?? now
  };
}

export function makeDiagnosticsState(overrides?: Partial<SpaceWeatherDiagnosticsState>): SpaceWeatherDiagnosticsState {
  return {
    cache: buildCachePayload(overrides?.cache),
    providers: buildProviderMetrics(overrides?.providers?.entries, overrides?.providers?.timestamp),
    adapters: buildAdapterMetrics(overrides?.adapters?.entries, overrides?.adapters?.timestamp)
  };
}

export function makeDegradedDiagnosticsState(): SpaceWeatherDiagnosticsState {
  const degradedCacheStats: CacheDiagnosticsPayload['stats'] = {
    ...baseCacheStats,
    averageHits: 3,
    totalEntries: 4,
    qualityDistribution: { high: 1, medium: 2, low: 1 },
    priorityDistribution: { critical: 1, high: 1, normal: 1, low: 1 },
    providerDistribution: { legacy: 2, enterprise: 1, enhanced: 1 }
  };

  const failingAdapterEntries: AdapterMetricEntry[] = [
    { adapterId: 'noaa-intermag', durationMs: 1100, success: false, error: 'timeout', timestamp: now - 1000 },
    { adapterId: 'noaa-uscanada', durationMs: 950, success: true, timestamp: now - 2500 }
  ];

  return makeDiagnosticsState({
    cache: {
      stats: degradedCacheStats,
      snapshot: [
        { key: 'legacy-intermag', hits: 2, lastAccessed: now - 20000, priorityLevel: 'critical', size: 470 },
        { key: 'enterprise-uscanada', hits: 4, lastAccessed: now - 15000, priorityLevel: 'low', size: 350 }
      ],
      timestamp: now
    },
    adapters: {
      entries: failingAdapterEntries,
      timestamp: now
    }
  });
}
