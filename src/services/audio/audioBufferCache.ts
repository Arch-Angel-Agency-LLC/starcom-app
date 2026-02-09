interface CachedBuffer {
  buffer: AudioBuffer;
  lastUsed: number;
}

interface AudioBufferCacheConfig {
  maxEntries?: number;
  ttlMs?: number;
}

export class AudioBufferCache {
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly store = new Map<string, CachedBuffer>();

  constructor(config: AudioBufferCacheConfig = {}) {
    this.maxEntries = config.maxEntries ?? 12;
    this.ttlMs = config.ttlMs ?? 2 * 60 * 1000; // 2 minutes
  }

  get(key: string): AudioBuffer | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.lastUsed > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    entry.lastUsed = Date.now();
    return entry.buffer;
  }

  set(key: string, buffer: AudioBuffer): void {
    this.store.set(key, { buffer, lastUsed: Date.now() });
    this.evictIfNeeded();
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  private evictIfNeeded(): void {
    if (this.store.size <= this.maxEntries) return;

    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    const overflow = entries.length - this.maxEntries;
    for (let i = 0; i < overflow; i += 1) {
      this.store.delete(entries[i][0]);
    }
  }
}

export const sharedAudioBufferCache = new AudioBufferCache();
