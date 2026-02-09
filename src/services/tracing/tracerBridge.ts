import { TraceEvent, TraceDomain } from './TracerTypes';
import { Tracer, defaultTracer } from './SamplingTracer';

const mapPollerEvent = (detail: any): TraceEvent => {
  const base = { domain: 'poller' as TraceDomain, timestamp: Date.now(), severity: 'info' as const };
  if (detail?.type === 'skip_inflight') {
    return { ...base, type: 'poller_skip_inflight', key: detail.key, metrics: { skips: detail.skips } };
  }
  if (detail?.type === 'slow_run') {
    return {
      ...base,
      type: 'poller_slow_run',
      key: detail.key,
      metrics: { durationMs: detail.durationMs, delayMs: detail.penaltyMs },
      severity: 'warn',
    };
  }
  return { ...base, type: 'poller_unknown', data: detail };
};

const mapServiceEvent = (detail: any): TraceEvent => {
  const base = { domain: 'service' as TraceDomain, timestamp: Date.now(), key: detail?.service, severity: 'info' as const };
  switch (detail?.event?.type) {
    case 'pause':
      return { ...base, type: 'service_pause' };
    case 'resume':
      return { ...base, type: 'service_resume' };
    case 'backoff_scheduled':
      return { ...base, type: 'service_backoff', metrics: { attempt: detail.event.attempt, delayMs: detail.event.delayMs } };
    case 'backoff_exhausted':
      return { ...base, type: 'service_backoff_exhausted', metrics: { attempt: detail.event.attempt }, severity: 'warn' };
    case 'cooloff_start':
      return {
        ...base,
        type: 'service_cooloff_start',
        metrics: { failures: detail.event.failures, delayMs: detail.event.durationMs },
        severity: 'warn',
      };
    case 'cooloff_end':
      return { ...base, type: 'service_cooloff_end' };
    case 'call_failure':
      return {
        ...base,
        type: 'service_call_failure',
        metrics: { durationMs: detail.event.durationMs },
        severity: 'warn',
        data: { error: String(detail.event.error ?? 'unknown') },
      };
    case 'call_success':
      return { ...base, type: 'service_call_success', metrics: { durationMs: detail.event.durationMs } };
    default:
      return { ...base, type: 'service_event', data: detail };
  }
};

export const registerBackoffBridge = (tracer: Tracer = defaultTracer): void => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

  window.addEventListener('poller-backoff', (evt: Event) => {
    const detail = (evt as CustomEvent).detail;
    tracer.emit(mapPollerEvent(detail));
  });

  window.addEventListener('service-backoff', (evt: Event) => {
    const detail = (evt as CustomEvent).detail;
    tracer.emit(mapServiceEvent(detail));
  });
};

// Auto-register bridge for default tracer in browser contexts
registerBackoffBridge();
