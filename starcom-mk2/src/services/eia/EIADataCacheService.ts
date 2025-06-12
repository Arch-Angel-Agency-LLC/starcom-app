// EIADataCacheService: Implements DataCacheService for EIA domain
// Artifacts: data-service-interfaces, data-service-observability, data-service-refactor-plan
import { DataCacheService, DataServiceObserver } from '../data-service-interfaces';

export class EIADataCacheService implements DataCacheService<any> {
  private cache = new Map<string, { value: any; expiresAt?: number }>();
  private observer?: DataServiceObserver;

  setObserver(observer: DataServiceObserver) {
    this.observer = observer;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.observer?.onCacheMiss?.(key);
      return null;
    }
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.observer?.onCacheEvict?.(key);
      return null;
    }
    this.observer?.onCacheHit?.(key);
    return entry.value;
  }

  set(key: string, value: any, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : undefined;
    this.cache.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.observer?.onCacheEvict?.(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// AI-NOTE: This is a minimal, artifact-driven implementation. Add persistence or advanced invalidation as needed.
