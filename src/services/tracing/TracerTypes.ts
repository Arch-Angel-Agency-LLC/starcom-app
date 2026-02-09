export type TraceDomain = 'poller' | 'service' | 'cache' | 'diagnostic' | 'disposal' | 'system';

export interface TraceMetrics {
  durationMs?: number;
  deltaBytes?: number;
  sizeBytes?: number;
  attempt?: number;
  delayMs?: number;
  failures?: number;
  skips?: number;
}

export interface TraceEvent {
  domain: TraceDomain;
  type: string;
  severity?: 'info' | 'warn' | 'error' | 'debug';
  timestamp: number;
  key?: string;
  message?: string;
  data?: Record<string, unknown>;
  metrics?: TraceMetrics;
  context?: Record<string, unknown>;
}
