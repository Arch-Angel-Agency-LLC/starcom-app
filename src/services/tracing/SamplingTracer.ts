import { TraceEvent } from './TracerTypes';
import { getSingleton } from '../../utils/singleton';

export interface TracerConfig {
  enabled?: boolean;
  sampleRate?: number; // 0-1 probability
  bufferSize?: number;
  deltaFilterBytes?: number;
}

export interface Tracer {
  emit(event: TraceEvent): void;
  getBuffer(): TraceEvent[];
  clear(): void;
}

const defaultEnabled = () => {
  if (typeof process !== 'undefined' && process.env && 'STARCOM_TRACER_ENABLED' in process.env) {
    return process.env.STARCOM_TRACER_ENABLED === 'true';
  }
  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).STARCOM_TRACER_ENABLED !== undefined) {
    return Boolean((globalThis as Record<string, unknown>).STARCOM_TRACER_ENABLED);
  }
  return true; // default on for dev
};

export class SamplingTracer implements Tracer {
  private readonly sampleRate: number;
  private readonly bufferSize: number;
  private readonly deltaFilterBytes?: number;
  private enabled: boolean;
  private buffer: TraceEvent[] = [];

  constructor(config?: TracerConfig) {
    this.enabled = config?.enabled ?? defaultEnabled();
    this.sampleRate = config?.sampleRate ?? 0.7;
    this.bufferSize = config?.bufferSize ?? 200;
    this.deltaFilterBytes = config?.deltaFilterBytes;
  }

  emit(event: TraceEvent): void {
    if (!this.enabled) return;
    if (this.sampleRate < 1 && Math.random() > this.sampleRate) return;
    if (this.deltaFilterBytes && event.metrics?.deltaBytes !== undefined) {
      if (Math.abs(event.metrics.deltaBytes) < this.deltaFilterBytes) return;
    }

    this.buffer.push(event);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
  }

  getBuffer(): TraceEvent[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export class NoopTracer implements Tracer {
  emit(): void {
    // no-op
  }
  getBuffer(): TraceEvent[] {
    return [];
  }
  clear(): void {
    // no-op
  }
}

export const defaultTracer = getSingleton('default-tracer', () => new SamplingTracer({ deltaFilterBytes: 100 * 1024 * 1024 }), {
  warnOnReuse: true
});
