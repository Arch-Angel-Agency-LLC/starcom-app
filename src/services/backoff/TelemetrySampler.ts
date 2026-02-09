export interface TelemetrySamplerConfig {
  sampleRate?: number; // 0-1 probability
  minIntervalMs?: number; // throttle per key
}

export class TelemetrySampler {
  private readonly sampleRate: number;
  private readonly minIntervalMs: number;
  private lastEmit = new Map<string, number>();

  constructor(config?: TelemetrySamplerConfig) {
    this.sampleRate = config?.sampleRate ?? 1;
    this.minIntervalMs = config?.minIntervalMs ?? 0;
  }

  shouldEmit(key: string): boolean {
    const now = Date.now();
    const last = this.lastEmit.get(key) ?? 0;
    if (this.minIntervalMs > 0 && now - last < this.minIntervalMs) return false;
    if (this.sampleRate < 1 && Math.random() > this.sampleRate) return false;
    this.lastEmit.set(key, now);
    return true;
  }
}
