export type PollerFn = (signal: AbortSignal) => Promise<void> | void;

export interface BackoffConfig {
  initialMs?: number;
  maxMs?: number;
  factor?: number;
}

import { TelemetrySampler } from './backoff/TelemetrySampler';

export type PollerTelemetryEvent =
  | { type: 'skip_inflight'; key: string; skips: number }
  | { type: 'slow_run'; key: string; durationMs: number; appliedBackoffMs: number };

export interface PollerOptions {
  intervalMs: number;
  minIntervalMs?: number;
  jitterMs?: number;
  immediate?: boolean;
  backoff?: BackoffConfig;
  scope?: string | string[];
  timeoutMs?: number;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
  slowThresholdMs?: number;
  slowBackoffMs?: number;
  onTelemetry?: (event: PollerTelemetryEvent) => void;
  allowVisibilityScaling?: boolean;
}

const pollerTelemetrySampler = new TelemetrySampler({ sampleRate: 0.5, minIntervalMs: 2000 });

export interface PollerHandle {
  key: string;
  scope?: string;
  scopes?: string[];
  stop: () => void;
  runNow: () => void;
  isActive: () => boolean;
}

interface PollerState {
  key: string;
  fn: PollerFn;
  options: PollerOptions;
  scopes: string[];
  timer?: ReturnType<typeof setTimeout>;
  abortController?: AbortController;
  inFlight: boolean;
  stopped: boolean;
  failures: number;
  lastDurationMs?: number;
  lastRunAt?: number;
  skips: number;
  penaltyMs: number;
  handle: PollerHandle;
}

const DEFAULT_BACKOFF_FACTOR = 2;

const now = () => Date.now();

const withJitter = (base: number, jitterMs = 0) => {
  if (jitterMs <= 0) return base;
  const offset = Math.floor(Math.random() * (jitterMs + 1));
  return base + offset;
};

const computeDelay = (state: PollerState, visibilityMultiplier: number) => {
  const { intervalMs, minIntervalMs, backoff, jitterMs, allowVisibilityScaling } = state.options;
  const floor = Math.max(intervalMs, minIntervalMs ?? intervalMs);
  const multiplier = allowVisibilityScaling === false ? 1 : visibilityMultiplier;
  const penalty = state.penaltyMs ?? 0;
  if (!backoff || state.failures === 0) return withJitter((floor + penalty) * multiplier, jitterMs);

  const factor = backoff.factor ?? DEFAULT_BACKOFF_FACTOR;
  const base = backoff.initialMs ?? floor;
  const attempt = state.failures - 1;
  const grown = base * factor ** attempt;
  const capped = backoff.maxMs ? Math.min(grown, backoff.maxMs) : grown;
  return withJitter((capped + penalty) * multiplier, jitterMs);
};

const getTimeout = (opts: PollerOptions) =>
  typeof opts.timeoutMs === 'number' && opts.timeoutMs > 0
    ? opts.timeoutMs
    : undefined;

const normalizeScopes = (scope?: string | string[]) => {
  if (!scope) return [] as string[];
  return Array.isArray(scope) ? scope.filter(Boolean) : [scope];
};

export class PollerRegistry {
  private pollers = new Map<string, PollerState>();
  private visibilityMultiplier = 1;
  private hiddenMultiplier = 3;
  private visibilityListenerAttached = false;

  register(key: string, fn: PollerFn, options: PollerOptions): PollerHandle {
    const existing = this.pollers.get(key);
    if (existing) return existing.handle;

    const scopes = normalizeScopes(options.scope);

    const state: PollerState = {
      key,
      fn,
      options,
      scopes,
      inFlight: false,
      stopped: false,
      failures: 0,
      skips: 0,
      penaltyMs: 0,
      handle: {
        key,
        scope: scopes[0],
        scopes,
        stop: () => this.stop(key),
        runNow: () => this.runNow(key),
        isActive: () => this.isActive(key),
      },
    };

    this.pollers.set(key, state);
    if (options.immediate) {
      void this.execute(state);
    } else {
      this.scheduleNext(state);
    }

    return state.handle;
  }

  enableVisibilityExpansion(hiddenMultiplier = 3): void {
    this.hiddenMultiplier = Math.max(1, hiddenMultiplier);
    this.bindVisibilityListener();
  }

  stop(key: string) {
    const state = this.pollers.get(key);
    if (!state) return;
    state.stopped = true;
    if (state.timer) clearTimeout(state.timer);
    if (state.abortController) state.abortController.abort();
    this.pollers.delete(key);
  }

  stopAll(scope?: string) {
    for (const [key, state] of this.pollers.entries()) {
      if (!scope || state.scopes.includes(scope)) {
        this.stop(key);
      }
    }
  }

  setVisibilityHidden(hidden: boolean) {
    this.visibilityMultiplier = hidden ? this.hiddenMultiplier : 1;
    for (const state of this.pollers.values()) {
      this.scheduleNext(state);
    }
  }

  runNow(key: string) {
    const state = this.pollers.get(key);
    if (!state) return;
    void this.execute(state, true);
  }

  isActive(key: string) {
    const state = this.pollers.get(key);
    return !!state && !state.stopped;
  }

  debugDump() {
    return Array.from(this.pollers.values()).map((state) => ({
      key: state.key,
      scopes: state.scopes,
      inFlight: state.inFlight,
      failures: state.failures,
      skips: state.skips,
      lastDurationMs: state.lastDurationMs,
      lastRunAt: state.lastRunAt,
    }));
  }

  private scheduleNext(state: PollerState) {
    if (state.stopped) return;
    if (state.timer) clearTimeout(state.timer);
    const delay = computeDelay(state, this.visibilityMultiplier);
    state.timer = setTimeout(() => {
      void this.execute(state);
    }, delay);
  }

  private async execute(state: PollerState, forced = false) {
    if (state.stopped) return;
    if (state.inFlight && !forced) {
      state.skips += 1;
      if (pollerTelemetrySampler.shouldEmit(`${state.key}:skip_inflight`)) {
        state.options.onTelemetry?.({ type: 'skip_inflight', key: state.key, skips: state.skips });
        window.dispatchEvent?.(new CustomEvent('poller-backoff', { detail: { type: 'skip_inflight', key: state.key, skips: state.skips } }));
      }
      console.debug?.('PollerRegistry skip due to in-flight run', { key: state.key, skips: state.skips });
      this.scheduleNext(state);
      return;
    }

    state.inFlight = true;
    this.scheduleNext(state);
    state.abortController = new AbortController();
    const start = now();
    const timeoutMs = getTimeout(state.options);
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const clearRunTimeout = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };

    if (timeoutMs) {
      timeoutHandle = setTimeout(() => state.abortController?.abort(), timeoutMs);
    }

    try {
      await state.fn(state.abortController.signal);
      state.failures = 0;
      state.options.onSuccess?.();
    } catch (error) {
      state.failures += 1;
      state.options.onError?.(error);
    } finally {
      clearRunTimeout();
      state.inFlight = false;
      state.lastDurationMs = now() - start;
      state.lastRunAt = start;
      this.applySlowPenalty(state);
      if (!state.stopped) this.scheduleNext(state);
    }
  }

  private applySlowPenalty(state: PollerState) {
    const { slowThresholdMs, slowBackoffMs, onTelemetry } = state.options;
    if (!slowThresholdMs || !state.lastDurationMs) {
      state.penaltyMs = 0;
      return;
    }

    if (state.lastDurationMs > slowThresholdMs) {
      const penalty = slowBackoffMs ?? Math.min(state.lastDurationMs, slowThresholdMs * 2);
      state.penaltyMs = Math.max(state.penaltyMs, penalty);
      if (pollerTelemetrySampler.shouldEmit(`${state.key}:slow_run`)) {
        onTelemetry?.({ type: 'slow_run', key: state.key, durationMs: state.lastDurationMs, appliedBackoffMs: penalty });
        window.dispatchEvent?.(new CustomEvent('poller-backoff', { detail: { type: 'slow_run', key: state.key, durationMs: state.lastDurationMs, penaltyMs: penalty } }));
      }
      console.warn?.('PollerRegistry slow run; applying backoff', {
        key: state.key,
        durationMs: state.lastDurationMs,
        penaltyMs: penalty,
      });
    } else {
      state.penaltyMs = 0;
    }
  }

  private bindVisibilityListener() {
    if (this.visibilityListenerAttached) return;
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    this.visibilityListenerAttached = true;
    document.addEventListener('visibilitychange', () => {
      this.setVisibilityHidden(document.visibilityState === 'hidden');
    });
  }
}

export const pollerRegistry = new PollerRegistry();
