import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchNaturalEvents,
  type FetchNaturalEventsOptions,
  type NaturalEvent as RawNaturalEvent
} from '../services/GeoEventsService';

export type SeverityBucket = 'minor' | 'major' | 'catastrophic';

export interface NaturalEvent extends RawNaturalEvent {
  severityBucket: SeverityBucket;
}

export interface UseGeoEventsOptions {
  enabled: boolean;
  refreshMinutes?: number;
  timeRangeDays?: number;
  disasterTypes?: Partial<Record<string, boolean>>;
  severity?: {
    showMinor?: boolean;
    showMajor?: boolean;
    showCatastrophic?: boolean;
  };
  fetcher?: (options?: FetchNaturalEventsOptions) => Promise<RawNaturalEvent[]>;
  bbox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  limit?: number;
  onTelemetry?: (event: GeoEventsTelemetryEvent) => void;
  telemetrySampleRate?: number; // 0..1
  telemetryDebounceMs?: number;
  thinning?: ThinningOptions;
}

export type GeoEventsTelemetryEvent =
  | { type: 'fetch_start'; params: { refreshMinutes: number } }
  | { type: 'fetch_success'; metrics: { count: number; durationMs: number } }
  | { type: 'fetch_error'; error: string }
  | { type: 'render_update'; metrics: { filtered: number; total: number; stale: boolean } }
  | { type: 'render_thin_applied'; metrics: { before: number; after: number; dropped: number; reasons: ThinningReason[]; durationMs: number } }
  | { type: 'backoff_scheduled'; metrics: { attempt: number; delayMs: number; jitterMs: number } }
  | { type: 'backoff_exhausted'; metrics: { attempt: number } };

export interface UseGeoEventsState {
  data: NaturalEvent[];
  filtered: NaturalEvent[];
  loading: boolean;
  error: Error | null;
  lastUpdated: number | null;
  stale: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  refetch: () => Promise<void>;
}

const DEFAULT_REFRESH_MIN = 5;
const MS_PER_MINUTE = 60 * 1000;
const CACHE_TTL_MINUTES = 5;
const BACKOFF_MAX_ATTEMPTS = 5;
const BACKOFF_JITTER_RATIO = 0.25;

type ThinningReason = 'hard_cap' | 'grid';

interface ThinningOptions {
  target?: number;
  warn?: number;
  cap?: number;
  gridSizeDeg?: number;
}

interface ThinningMeta {
  applied: boolean;
  before: number;
  after: number;
  dropped: number;
  droppedBySeverity: number;
  droppedByGrid: number;
  reasons: ThinningReason[];
  durationMs: number;
}

const DEFAULT_THINNING: Required<ThinningOptions> = {
  target: 500,
  warn: 700,
  cap: 900,
  gridSizeDeg: 5
};

const classifySeverity = (event: RawNaturalEvent): SeverityBucket => {
  const mag = typeof event.magnitude === 'number' ? event.magnitude : null;
  if (mag === null || Number.isNaN(mag)) return 'major';
  if (mag >= 6) return 'catastrophic';
  if (mag >= 4) return 'major';
  return 'minor';
};

const withinTimeRange = (event: RawNaturalEvent, days?: number): boolean => {
  if (!days || days <= 0) return true;
  if (!event.timestamp) return true;
  const ts = Date.parse(event.timestamp);
  if (Number.isNaN(ts)) return true;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return ts >= cutoff;
};

const severityRank: Record<SeverityBucket, number> = {
  minor: 1,
  major: 2,
  catastrophic: 3
};

const thinBySeverity = (events: NaturalEvent[], cap: number) => {
  const catastrophic: NaturalEvent[] = [];
  const major: NaturalEvent[] = [];
  const minor: NaturalEvent[] = [];

  events.forEach((event) => {
    if (event.severityBucket === 'catastrophic') {
      catastrophic.push(event);
      return;
    }
    if (event.severityBucket === 'major') {
      major.push(event);
      return;
    }
    minor.push(event);
  });

  const ordered = [...catastrophic, ...major, ...minor];
  return {
    thinned: ordered.slice(0, cap),
    dropped: Math.max(0, ordered.length - cap)
  };
};

const gridKey = (event: NaturalEvent, gridSizeDeg: number) => {
  const safeGrid = gridSizeDeg > 0 ? gridSizeDeg : DEFAULT_THINNING.gridSizeDeg;
  const latKey = Math.floor(event.lat / safeGrid);
  const lngKey = Math.floor(event.lng / safeGrid);
  return `${latKey}:${lngKey}`;
};

const preferEvent = (candidate: NaturalEvent, current: NaturalEvent | undefined) => {
  if (!current) return true;
  const candidateRank = severityRank[candidate.severityBucket] ?? 0;
  const currentRank = severityRank[current.severityBucket] ?? 0;
  if (candidateRank !== currentRank) return candidateRank > currentRank;

  const candidateMag = Number.isFinite(candidate.magnitude) ? (candidate.magnitude as number) : -Infinity;
  const currentMag = Number.isFinite(current.magnitude) ? (current.magnitude as number) : -Infinity;
  if (candidateMag !== currentMag) return candidateMag > currentMag;

  const candidateTs = Date.parse(candidate.timestamp ?? '') || 0;
  const currentTs = Date.parse(current.timestamp ?? '') || 0;
  return candidateTs > currentTs;
};

const applyGridThinning = (events: NaturalEvent[], gridSizeDeg: number) => {
  const bestPerCell = new Map<string, NaturalEvent>();
  events.forEach((event) => {
    const key = gridKey(event, gridSizeDeg);
    const current = bestPerCell.get(key);
    if (preferEvent(event, current)) {
      bestPerCell.set(key, event);
    }
  });

  const thinned = Array.from(bestPerCell.values());
  return { thinned, dropped: events.length - thinned.length };
};

const applyThinning = (events: NaturalEvent[], options?: ThinningOptions) => {
  const cfg = { ...DEFAULT_THINNING, ...(options || {}) };
  const meta: ThinningMeta = {
    applied: false,
    before: events.length,
    after: events.length,
    dropped: 0,
    droppedBySeverity: 0,
    droppedByGrid: 0,
    reasons: [],
    durationMs: 0
  };

  const start = performance.now();
  let working = events;

  if (working.length > cfg.cap) {
    const { thinned, dropped } = thinBySeverity(working, cfg.cap);
    working = thinned;
    meta.reasons.push('hard_cap');
    meta.droppedBySeverity += dropped;
  }

  if (working.length > cfg.warn) {
    const { thinned, dropped } = applyGridThinning(working, cfg.gridSizeDeg);
    working = thinned;
    meta.reasons.push('grid');
    meta.droppedByGrid += dropped;
  }

  meta.after = working.length;
  meta.dropped = meta.before - meta.after;
  meta.applied = meta.dropped > 0;
  meta.durationMs = performance.now() - start;

  return { thinned: working, meta };
};

export const useGeoEvents = (options: UseGeoEventsOptions): UseGeoEventsState => {
  const {
    enabled,
    refreshMinutes = DEFAULT_REFRESH_MIN,
    timeRangeDays,
    disasterTypes,
    severity,
    fetcher,
    bbox,
    limit,
    onTelemetry,
    telemetrySampleRate = 1,
    telemetryDebounceMs = 2000,
    thinning
  } = options;
  const [data, setData] = useState<NaturalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [stale, setStale] = useState(false);
  const enabledRef = useRef(enabled);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastRenderTelemetryRef = useRef<number>(0);
  const fetchNaturalEventsFn = fetcher ?? fetchNaturalEvents;
  const cacheRef = useRef<{ timestamp: number; data: NaturalEvent[] } | null>(null);
  const lastGoodRef = useRef<NaturalEvent[]>([]);
  const failureCountRef = useRef(0);

  const safeTelemetrySampleRate = useMemo(() => {
    const rate = Number.isFinite(telemetrySampleRate) ? telemetrySampleRate : 1;
    return Math.min(1, Math.max(0, rate));
  }, [telemetrySampleRate]);

  const safeTelemetryDebounceMs = useMemo(() => {
    const ms = Number.isFinite(telemetryDebounceMs) ? telemetryDebounceMs : 2000;
    return Math.max(ms, 250);
  }, [telemetryDebounceMs]);

  const safeRefreshMinutes = useMemo(() => {
    const requested = Number.isFinite(refreshMinutes) ? refreshMinutes : DEFAULT_REFRESH_MIN;
    const min = import.meta.env?.PROD ? 1 : 0.001; // Allow tight loops in tests/dev, clamp in prod
    return Math.max(requested, min);
  }, [refreshMinutes]);

  const refreshIntervalMs = useMemo(() => safeRefreshMinutes * MS_PER_MINUTE, [safeRefreshMinutes]);

  const thinningConfig = useMemo(() => ({ ...DEFAULT_THINNING, ...(thinning || {}) }), [thinning]);

  useEffect(() => {
    if (!import.meta.env?.DEV) return;
    const clampedRate = safeTelemetrySampleRate !== telemetrySampleRate;
    const clampedDebounce = safeTelemetryDebounceMs !== telemetryDebounceMs;
    const clampedRefresh = safeRefreshMinutes !== refreshMinutes;
    if (clampedRate || clampedDebounce || clampedRefresh) {
      console.warn('[useGeoEvents] guardrails applied', {
        requestedRate: telemetrySampleRate,
        safeTelemetrySampleRate,
        requestedDebounceMs: telemetryDebounceMs,
        safeTelemetryDebounceMs,
        requestedRefreshMinutes: refreshMinutes,
        safeRefreshMinutes
      });
    }
  }, [safeTelemetrySampleRate, safeTelemetryDebounceMs, safeRefreshMinutes, telemetrySampleRate, telemetryDebounceMs, refreshMinutes]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const logTelemetry = useCallback(
    (event: GeoEventsTelemetryEvent) => {
      if (import.meta.env?.DEV) {
        console.debug('[useGeoEvents][telemetry]', event);
      }
      onTelemetry?.(event);
    },
    [onTelemetry]
  );

  const filterDisasterType = useCallback(
    (event: NaturalEvent) => {
      if (!disasterTypes) return true;
      const allowed = disasterTypes[event.type];
      return allowed !== false; // default allow if undefined
    },
    [disasterTypes]
  );

  const filterSeverity = useCallback(
    (event: NaturalEvent) => {
      const showMinor = severity?.showMinor ?? true;
      const showMajor = severity?.showMajor ?? true;
      const showCatastrophic = severity?.showCatastrophic ?? true;
      if (event.severityBucket === 'minor' && !showMinor) return false;
      if (event.severityBucket === 'major' && !showMajor) return false;
      if (event.severityBucket === 'catastrophic' && !showCatastrophic) return false;
      return true;
    },
    [severity]
  );

  const performFetch = useCallback(
    async (trigger: 'auto' | 'manual' = 'auto') => {
      if (!enabled) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      setStatus('loading');
      const start = performance.now();
      logTelemetry({ type: 'fetch_start', params: { refreshMinutes: safeRefreshMinutes } });

      try {
        const raw = await fetchNaturalEventsFn({ signal: controller.signal });
        if (!enabledRef.current) return;
        const mapped: NaturalEvent[] = raw.map((event) => ({
          ...event,
          severityBucket: classifySeverity(event)
        }));
        const now = Date.now();
        cacheRef.current = { timestamp: now, data: mapped };
        lastGoodRef.current = mapped;
        failureCountRef.current = 0;
        setData(mapped);
        setLastUpdated(now);
        setStale(false);
        setStatus('success');
        logTelemetry({ type: 'fetch_success', metrics: { count: mapped.length, durationMs: performance.now() - start } });

        timerRef.current = window.setTimeout(() => {
          performFetch('auto');
        }, refreshIntervalMs);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (!enabledRef.current) return;
        setError(err as Error);
        setStatus('error');
        setStale(true);
        logTelemetry({ type: 'fetch_error', error: (err as Error).message });

        const cacheFresh = cacheRef.current
          ? Date.now() - cacheRef.current.timestamp < CACHE_TTL_MINUTES * MS_PER_MINUTE
          : false;

        if (cacheFresh) {
          setData(cacheRef.current!.data);
          setLastUpdated(cacheRef.current!.timestamp);
        } else if (lastGoodRef.current.length > 0) {
          setData(lastGoodRef.current);
          setLastUpdated(lastUpdated);
        }

        failureCountRef.current += 1;
        const attempt = Math.min(failureCountRef.current, BACKOFF_MAX_ATTEMPTS);
        if (attempt >= BACKOFF_MAX_ATTEMPTS) {
          logTelemetry({ type: 'backoff_exhausted', metrics: { attempt } });
          timerRef.current = null;
          return;
        }

        const backoffMultiplier = Math.min(4, 2 ** attempt);
        const baseDelay = refreshIntervalMs * backoffMultiplier;
        const jitterMs = baseDelay * BACKOFF_JITTER_RATIO * Math.random();
        const nextDelay = baseDelay + jitterMs;
        logTelemetry({ type: 'backoff_scheduled', metrics: { attempt, delayMs: nextDelay, jitterMs } });

        timerRef.current = window.setTimeout(() => {
          performFetch('auto');
        }, nextDelay);
      } finally {
        setLoading(false);
      }
    },
    [enabled, fetchNaturalEventsFn, logTelemetry, refreshIntervalMs, safeRefreshMinutes, lastUpdated]
  );

  const refetch = useCallback(async () => performFetch('manual'), [performFetch]);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    performFetch('auto');

    return () => {
      abortRef.current?.abort();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, performFetch]);

  const { filtered, thinningMeta } = useMemo(() => {
    const withinBbox = (event: NaturalEvent) => {
      if (!bbox) return true;
      return (
        event.lat >= bbox.minLat &&
        event.lat <= bbox.maxLat &&
        event.lng >= bbox.minLng &&
        event.lng <= bbox.maxLng
      );
    };

    const pipeline = data
      .filter((event) => withinTimeRange(event, timeRangeDays))
      .filter(filterDisasterType)
      .filter(filterSeverity)
      .filter(withinBbox);

    const { thinned, meta } = applyThinning(pipeline, thinningConfig);
    const limited = typeof limit === 'number' && limit > 0 ? thinned.slice(0, limit) : thinned;

    return { filtered: limited, thinningMeta: meta };
  }, [data, timeRangeDays, filterDisasterType, filterSeverity, bbox, limit, thinningConfig]);

  useEffect(() => {
    if (!enabled) return;
    const now = performance.now();
    const sampled = Math.random() <= safeTelemetrySampleRate;
    if (!sampled) return;
    if (now - lastRenderTelemetryRef.current < safeTelemetryDebounceMs) return;
    lastRenderTelemetryRef.current = now;
    logTelemetry({
      type: 'render_update',
      metrics: { filtered: filtered.length, total: data.length, stale }
    });
  }, [enabled, filtered.length, data.length, stale, safeTelemetrySampleRate, safeTelemetryDebounceMs, logTelemetry]);

  useEffect(() => {
    if (!enabled) return;
    if (!thinningMeta.applied) return;
    const sampled = Math.random() <= safeTelemetrySampleRate;
    if (!sampled) return;
    logTelemetry({
      type: 'render_thin_applied',
      metrics: {
        before: thinningMeta.before,
        after: thinningMeta.after,
        dropped: thinningMeta.dropped,
        reasons: thinningMeta.reasons,
        durationMs: thinningMeta.durationMs
      }
    });
  }, [enabled, thinningMeta, safeTelemetrySampleRate, logTelemetry]);

  useEffect(() => {
    if (!lastUpdated) {
      setStale(status === 'error');
      return;
    }

    const staleAfter = refreshIntervalMs * 2;
    const ageMs = Date.now() - lastUpdated;
    if (status === 'error' || ageMs >= staleAfter) {
      setStale(true);
      return;
    }

    setStale(false);
    const timeout = window.setTimeout(() => setStale(true), staleAfter - ageMs);
    return () => clearTimeout(timeout);
  }, [lastUpdated, refreshIntervalMs, status]);

  return {
    data,
    filtered,
    loading,
    error,
    lastUpdated,
    stale,
    status,
    refetch
  };
};

export default useGeoEvents;
