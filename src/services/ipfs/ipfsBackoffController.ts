export type BackoffEvent =
  | { type: 'pause'; label: string }
  | { type: 'resume'; label: string }
  | { type: 'backoff_scheduled'; label: string; attempt: number; delayMs: number }
  | { type: 'backoff_exhausted'; label: string; attempt: number }
  | { type: 'call_success'; label: string; durationMs: number }
  | { type: 'call_failure'; label: string; durationMs: number; error: unknown };

interface BackoffConfig {
  label: string;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
  onEvent?: (event: BackoffEvent) => void;
}

export class IpfsBackoffController {
  private readonly label: string;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly maxAttempts: number;
  private attempt = 0;
  private paused = false;
  private onEvent?: (event: BackoffEvent) => void;

  constructor(config: BackoffConfig) {
    this.label = config.label;
    this.baseDelayMs = config.baseDelayMs ?? 500;
    this.maxDelayMs = config.maxDelayMs ?? 30_000;
    this.maxAttempts = config.maxAttempts ?? 6;
    this.onEvent = config.onEvent;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.paused) throw new Error(`${this.label} paused`);

    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = performance.now() - start;
      this.attempt = 0;
      this.emit({ type: 'call_success', label: this.label, durationMs });
      return result;
    } catch (error) {
      const durationMs = performance.now() - start;
      this.emit({ type: 'call_failure', label: this.label, durationMs, error });
      this.attempt += 1;
      if (this.attempt >= this.maxAttempts) {
        this.emit({ type: 'backoff_exhausted', label: this.label, attempt: this.attempt });
        throw error;
      }

      const delay = Math.min(this.baseDelayMs * 2 ** (this.attempt - 1), this.maxDelayMs);
      this.emit({ type: 'backoff_scheduled', label: this.label, attempt: this.attempt, delayMs: delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.run(fn);
    }
  }

  pause(): void {
    this.paused = true;
    this.emit({ type: 'pause', label: this.label });
  }

  resume(): void {
    this.paused = false;
    this.attempt = 0;
    this.emit({ type: 'resume', label: this.label });
  }

  private emit(event: BackoffEvent): void {
    try {
      this.onEvent?.(event);
    } catch {
      // ignore telemetry errors
    }
  }
}
