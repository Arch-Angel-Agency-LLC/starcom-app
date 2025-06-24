// Data Service Interfaces (artifact-driven)
// See: artifacts/starcom-mk2-data-service-interfaces.artifact
// See: artifacts/starcom-mk2-data-service-observability.artifact
// See: artifacts/starcom-mk2-data-service-refactor-plan.artifact

// Observability contract for logging/metrics/tracing
export interface DataServiceObserver {
  onFetchStart?(key: string): void;
  onFetchEnd?(key: string, durationMs: number): void;
  onError?(key: string, error: Error): void;
  onCacheHit?(key: string): void;
  onCacheMiss?(key: string): void;
  onCacheEvict?(key: string): void;
}

// Generic data provider interface
export interface DataProvider<T = unknown> {
  fetchData(key: string, options?: Record<string, unknown>): Promise<T>;
  subscribe?(key: string, onData: (data: T) => void, options?: Record<string, unknown>): () => void;
  setObserver?(observer: DataServiceObserver): void;
}

// Generic cache service interface
export interface DataCacheService<T = unknown> {
  get(key: string): T | null;
  set(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
  setObserver?(observer: DataServiceObserver): void;
}

// Example: Composing multiple providers (fallback, aggregation)
export class FallbackProvider<T> implements DataProvider<T> {
  constructor(private providers: DataProvider<T>[]) {}
  async fetchData(key: string, options?: Record<string, unknown>): Promise<T> {
    for (const provider of this.providers) {
      try {
        return await provider.fetchData(key, options);
      } catch {
        // try next provider
      }
    }
    throw new Error('All providers failed');
  }
}

// AI-NOTE: This file is artifact-driven and should be updated if the interfaces artifact changes.
