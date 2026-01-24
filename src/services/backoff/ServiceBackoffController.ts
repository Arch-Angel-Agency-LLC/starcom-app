export type ServiceBackoffEvent =
  | { type: 'pause'; label: string }
  | { type: 'resume'; label: string }
  | { type: 'backoff_scheduled'; label: string; attempt: number; delayMs: number }
  | { type: 'backoff_exhausted'; label: string; attempt: number }
  | { type: 'cooloff_start'; label: string; failures: number; durationMs: number }
  | { type: 'cooloff_end'; label: string }
  | { type: 'call_success'; label: string; durationMs: number }
  | { type: 'call_failure'; label: string; durationMs: number; error: unknown };

interface ServiceBackoffConfig {
  label: string;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
  coolOffThreshold?: number;
  coolOffDurationMs?: number;
  onEvent?: (event: ServiceBackoffEvent) => void;
  sampleRate?: number;
  minIntervalMs?: number;
}

import { TelemetrySampler } from './TelemetrySampler';

export class ServiceBackoffController {
  private readonly label: string;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly maxAttempts: number;
  private readonly coolOffThreshold: number;
  private readonly coolOffDurationMs: number;
  private attempt = 0;
  private failures = 0;
  private paused = false;
  private onEvent?: (event: ServiceBackoffEvent) => void;
  private telemetrySampler: TelemetrySampler;

  constructor(config: ServiceBackoffConfig) {
    this.label = config.label;
    this.baseDelayMs = config.baseDelayMs ?? 750;
    this.maxDelayMs = config.maxDelayMs ?? 30000;
    this.maxAttempts = config.maxAttempts ?? 6;
    this.coolOffThreshold = config.coolOffThreshold ?? 3;
    this.coolOffDurationMs = config.coolOffDurationMs ?? 15000;
    this.onEvent = config.onEvent;
    this.telemetrySampler = new TelemetrySampler({
      sampleRate: config.sampleRate ?? 0.75,
      minIntervalMs: config.minIntervalMs ?? 1500,
    });
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.paused) throw new Error(`${this.label} paused`);

    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = performance.now() - start;
      this.attempt = 0;
      this.failures = 0;
      this.emit({ type: 'call_success', label: this.label, durationMs });
      return result;
    } catch (error) {
      const durationMs = performance.now() - start;
      this.failures += 1;
      this.emit({ type: 'call_failure', label: this.label, durationMs, error });

      // Apply cool-off after consecutive failures
      if (this.failures >= this.coolOffThreshold) {
        this.emit({ type: 'cooloff_start', label: this.label, failures: this.failures, durationMs: this.coolOffDurationMs });
        await this.delay(this.coolOffDurationMs);
        this.failures = 0;
        this.attempt = 0;
        this.emit({ type: 'cooloff_end', label: this.label });
      } else {
        this.attempt += 1;
        if (this.attempt >= this.maxAttempts) {
          this.emit({ type: 'backoff_exhausted', label: this.label, attempt: this.attempt });
          throw error;
        }

        const delayMs = Math.min(this.baseDelayMs * 2 ** (this.attempt - 1), this.maxDelayMs);
        this.emit({ type: 'backoff_scheduled', label: this.label, attempt: this.attempt, delayMs });
        await this.delay(delayMs);
      }

      return this.run(fn);
    }
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.emit({ type: 'pause', label: this.label });
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.attempt = 0;
    this.failures = 0;
    this.emit({ type: 'resume', label: this.label });
  }

  private emit(event: ServiceBackoffEvent): void {
    if (!this.telemetrySampler.shouldEmit(`${event.type}:${this.label}`)) return;
    try {
      this.onEvent?.(event);
    } catch {
      // ignore telemetry errors
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
