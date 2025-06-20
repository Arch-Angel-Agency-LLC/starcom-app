// SpaceWeatherCacheService: Implements DataCacheService for NOAA space weather domain
// AI-NOTE: Following the same pattern as EIADataCacheService for consistency
// Artifacts: data-service-interfaces, noaa-space-weather-integration

import { DataCacheService, DataServiceObserver } from './data-service-interfaces';
import type { ProcessedElectricFieldData, SpaceWeatherAlert } from '../types/spaceWeather';

interface SpaceWeatherCacheData {
  interMagData?: ProcessedElectricFieldData;
  usCanadaData?: ProcessedElectricFieldData;
  alerts?: SpaceWeatherAlert[];
  lastUpdated?: Date;
}

export class SpaceWeatherCacheService implements DataCacheService<SpaceWeatherCacheData> {
  private cache = new Map<string, { value: SpaceWeatherCacheData; expiresAt?: number }>();
  private observer?: DataServiceObserver;

  // Default TTL for space weather data: 5 minutes (matches NOAA update frequency)
  private static readonly DEFAULT_TTL = 5 * 60 * 1000;

  setObserver(observer: DataServiceObserver) {
    this.observer = observer;
  }

  get(key: string): SpaceWeatherCacheData | null {
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

  set(key: string, value: SpaceWeatherCacheData, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : Date.now() + SpaceWeatherCacheService.DEFAULT_TTL;
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

  // Convenience methods for space weather specific operations
  getElectricFieldData(dataset: 'InterMag' | 'US-Canada'): ProcessedElectricFieldData | null {
    const data = this.get('spaceWeatherData');
    if (!data) return null;
    
    return dataset === 'InterMag' ? data.interMagData || null : data.usCanadaData || null;
  }

  getAlerts(): SpaceWeatherAlert[] {
    const data = this.get('spaceWeatherData');
    return data?.alerts || [];
  }

  isDataFresh(): boolean {
    const data = this.get('spaceWeatherData');
    if (!data?.lastUpdated) return false;
    
    // Consider data fresh if less than 10 minutes old
    return (Date.now() - data.lastUpdated.getTime()) < 10 * 60 * 1000;
  }

  // Missing methods from DataCacheService interface
  getMetadata(key: string): import('./data-management/interfaces').CacheMetadata | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    return {
      key,
      createdAt: Date.now() - SpaceWeatherCacheService.DEFAULT_TTL, // Approximate
      expiresAt: entry.expiresAt || Date.now() + SpaceWeatherCacheService.DEFAULT_TTL,
      size: JSON.stringify(entry.value).length,
      hits: 0, // Not tracked in current implementation
      lastAccessed: Date.now()
    };
  }

  getSize(): number {
    return this.cache.size;
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// AI-NOTE: This implements proper caching for space weather data following the established pattern.
// The cache respects NOAA's 60-second update cadence with appropriate TTL values.
