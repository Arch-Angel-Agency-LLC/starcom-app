/**
 * Market Data Cache Service - Intelligence Exchange Marketplace  
 * Provides intelligent caching for market data with TTL, eviction policies,
 * and observability hooks for performance monitoring
 */

import { EventEmitter } from 'events';
import { MarketData, MarketAsset } from './MarketDataProvider';

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export interface CacheObserver {
  onHit?(key: string, entry: CacheEntry<unknown>): void;
  onMiss?(key: string): void;
  onEviction?(key: string, reason: 'ttl' | 'lru' | 'manual'): void;
  onSet?(key: string, entry: CacheEntry<unknown>): void;
}

export class MarketDataCacheService extends EventEmitter {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 30000; // 30 seconds default
  private maxSize: number = 1000;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  private observers: CacheObserver[] = [];
  private cleanupInterval?: NodeJS.Timeout;

  constructor(maxSize = 1000, defaultTTL = 30000) {
    super();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.startCleanupTimer();
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;
    
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict LRU entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    
    // Notify observers
    this.observers.forEach(observer => observer.onSet?.(key, entry));
    this.emit('cache-set', key, entry);
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.observers.forEach(observer => observer.onMiss?.(key));
      this.emit('cache-miss', key);
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.observers.forEach(observer => observer.onEviction?.(key, 'ttl'));
      this.emit('cache-evict', key, 'ttl');
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.observers.forEach(observer => observer.onHit?.(key, entry));
    this.emit('cache-hit', key, entry);
    
    return entry.data as T;
  }

  /**
   * Check if key exists in cache (without accessing)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.observers.forEach(observer => observer.onEviction?.(key, 'manual'));
      this.emit('cache-evict', key, 'manual');
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const keys = Array.from(this.cache.keys());
    this.cache.clear();
    keys.forEach(key => {
      this.observers.forEach(observer => observer.onEviction?.(key, 'manual'));
    });
    this.emit('cache-clear');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : undefined,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : undefined
    };
  }

  /**
   * Add cache observer for monitoring
   */
  addObserver(observer: CacheObserver): void {
    this.observers.push(observer);
  }

  /**
   * Remove cache observer
   */
  removeObserver(observer: CacheObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Market-specific: Cache market data with appropriate TTL
   */
  cacheMarketData(key: string, data: MarketData): void {
    // Market data gets shorter TTL due to volatility
    this.set(key, data, 15000); // 15 seconds
  }

  /**
   * Market-specific: Cache asset data with classification-based TTL
   */
  cacheAssetData(asset: MarketAsset): void {
    const key = `asset:${asset.id}`;
    
    // TTL based on classification level
    let ttl = this.defaultTTL;
    switch (asset.metadata.classification) {
      case 'TOP_SECRET':
        ttl = 5000; // 5 seconds - highly sensitive
        break;
      case 'SECRET':
        ttl = 10000; // 10 seconds
        break;
      case 'CONFIDENTIAL':
        ttl = 20000; // 20 seconds
        break;
      case 'UNCLASSIFIED':
        ttl = 60000; // 1 minute
        break;
    }

    this.set(key, asset, ttl);
  }

  /**
   * Market-specific: Get cached market data
   */
  getCachedMarketData(key: string): MarketData | null {
    return this.get<MarketData>(key);
  }

  /**
   * Market-specific: Get cached asset data
   */
  getCachedAssetData(assetId: string): MarketAsset | null {
    return this.get<MarketAsset>(`asset:${assetId}`);
  }

  /**
   * Private: Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Private: Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.observers.forEach(observer => observer.onEviction?.(oldestKey!, 'lru'));
      this.emit('cache-evict', oldestKey, 'lru');
    }
  }

  /**
   * Private: Start cleanup timer for expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Private: Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
      this.observers.forEach(observer => observer.onEviction?.(key, 'ttl'));
      this.emit('cache-evict', key, 'ttl');
    });

    if (expiredKeys.length > 0) {
      this.emit('cleanup-completed', expiredKeys.length);
    }
  }

  /**
   * Private: Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      // Rough estimation: JSON size + metadata overhead
      totalSize += JSON.stringify(entry.data).length + 200; // 200 bytes metadata overhead
    }
    
    return totalSize;
  }

  /**
   * Health check for cache service
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: CacheStats;
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check hit rate
    if (stats.hitRate < 60) {
      issues.push(`Low hit rate: ${stats.hitRate.toFixed(1)}%`);
      status = 'warning';
    }

    // Check memory usage (rough threshold)
    if (stats.memoryUsage > 10 * 1024 * 1024) { // 10MB
      issues.push(`High memory usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
      status = 'warning';
    }

    // Check cache size
    if (stats.totalEntries > this.maxSize * 0.9) {
      issues.push(`Cache nearly full: ${stats.totalEntries}/${this.maxSize}`);
      status = 'warning';
    }

    if (issues.length === 0) {
      issues.push('All systems operational');
    }

    return { status, issues, metrics: stats };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.observers = [];
    this.removeAllListeners();
  }
}

// Export singleton instance
export const marketDataCacheService = new MarketDataCacheService();
