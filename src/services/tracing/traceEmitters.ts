import { TraceMetrics } from './TracerTypes';
import { defaultTracer } from './SamplingTracer';

const now = () => Date.now();

type Severity = 'info' | 'warn' | 'error' | 'debug';

type TraceData = Record<string, unknown> | undefined;

type EmitParams = {
  type: string;
  data?: TraceData;
  metrics?: TraceMetrics;
  severity?: Severity;
};

const emit = (domain: 'cache' | 'diagnostic' | 'disposal', params: EmitParams): void => {
  defaultTracer.emit({
    domain,
    type: params.type,
    timestamp: now(),
    data: params.data,
    metrics: params.metrics,
    severity: params.severity ?? 'info'
  });
};

export const emitCacheTrace = (type: string, data?: TraceData, metrics?: TraceMetrics): void => {
  emit('cache', { type, data, metrics });
};

export const emitDiagnosticTrace = (
  type: string,
  data?: TraceData,
  severity: Severity = 'info'
): void => {
  emit('diagnostic', { type, data, severity });
};

export const emitDisposalTrace = (type: string, data?: TraceData, metrics?: TraceMetrics): void => {
  emit('disposal', { type, data, metrics });
};
