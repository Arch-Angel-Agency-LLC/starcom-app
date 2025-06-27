// MarketDataCacheService unit tests (artifact-driven)
// Artifacts: data-service-interfaces, data-service-testing-strategy

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarketDataCacheService, CacheObserver } from './MarketDataCacheService';
import { MarketAsset } from './MarketDataProvider';

describe('MarketDataCacheService', () => {
  let cacheService: MarketDataCacheService;

  beforeEach(() => {
    cacheService = new MarketDataCacheService(100, 1000); // Small cache for testing
  });

  afterEach(() => {
    cacheService.destroy();
  });

  describe('Basic cache operations', () => {
    it('should set and get data', () => {
      const testData = { test: 'value' };
      cacheService.set('test-key', testData);
      
      const retrieved = cacheService.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cacheService.set('exists', { data: true });
      
      expect(cacheService.has('exists')).toBe(true);
      expect(cacheService.has('not-exists')).toBe(false);
    });

    it('should delete keys', () => {
      cacheService.set('to-delete', { data: true });
      expect(cacheService.has('to-delete')).toBe(true);
      
      const deleted = cacheService.delete('to-delete');
      expect(deleted).toBe(true);
      expect(cacheService.has('to-delete')).toBe(false);
    });

    it('should clear all entries', () => {
      cacheService.set('key1', { data: 1 });
      cacheService.set('key2', { data: 2 });
      
      expect(cacheService.getStats().totalEntries).toBe(2);
      
      cacheService.clear();
      expect(cacheService.getStats().totalEntries).toBe(0);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire entries after TTL', async () => {
      const shortTTL = 50; // 50ms
      cacheService.set('expire-me', { data: true }, shortTTL);
      
      expect(cacheService.get('expire-me')).toBeTruthy();
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cacheService.get('expire-me')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      cacheService.set('default-ttl', { data: true });
      
      // Should still exist immediately
      expect(cacheService.get('default-ttl')).toBeTruthy();
    });
  });

  describe('Cache statistics', () => {
    it('should track hit and miss rates', () => {
      cacheService.set('hit-key', { data: true });
      
      // Generate hits
      cacheService.get('hit-key');
      cacheService.get('hit-key');
      
      // Generate misses
      cacheService.get('miss-key1');
      cacheService.get('miss-key2');
      
      const stats = cacheService.getStats();
      expect(stats.totalHits).toBe(2);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBe(50);
      expect(stats.missRate).toBe(50);
    });

    it('should track memory usage estimation', () => {
      cacheService.set('memory-test', { large: 'data'.repeat(1000) });
      
      const stats = cacheService.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache is full', () => {
      const smallCache = new MarketDataCacheService(2, 10000); // Max 2 entries
      
      smallCache.set('first', { data: 1 });
      smallCache.set('second', { data: 2 });
      
      // Access first to make it more recently used
      smallCache.get('first');
      
      // Add third, should evict 'second'
      smallCache.set('third', { data: 3 });
      
      expect(smallCache.has('first')).toBe(true);
      expect(smallCache.has('second')).toBe(false);
      expect(smallCache.has('third')).toBe(true);
      
      smallCache.destroy();
    });
  });

  describe('Observer pattern', () => {
    it('should notify observers on cache events', () => {
      const observer: CacheObserver = {
        onHit: vi.fn(),
        onMiss: vi.fn(),
        onSet: vi.fn(),
        onEviction: vi.fn()
      };
      
      cacheService.addObserver(observer);
      
      cacheService.set('observe-key', { data: true });
      expect(observer.onSet).toHaveBeenCalled();
      
      cacheService.get('observe-key');
      expect(observer.onHit).toHaveBeenCalled();
      
      cacheService.get('non-existent');
      expect(observer.onMiss).toHaveBeenCalled();
      
      cacheService.delete('observe-key');
      expect(observer.onEviction).toHaveBeenCalled();
    });

    it('should remove observers', () => {
      const observer: CacheObserver = {
        onSet: vi.fn()
      };
      
      cacheService.addObserver(observer);
      cacheService.removeObserver(observer);
      
      cacheService.set('test', { data: true });
      expect(observer.onSet).not.toHaveBeenCalled();
    });
  });

  describe('Market-specific functionality', () => {
    it('should cache market data with appropriate TTL', () => {
      const marketData = {
        assets: [],
        totalVolume: 1000,
        activeTraders: 50,
        timestamp: Date.now()
      };
      
      cacheService.cacheMarketData('market-snapshot', marketData);
      
      const retrieved = cacheService.getCachedMarketData('market-snapshot');
      expect(retrieved).toEqual(marketData);
    });

    it('should cache asset data with classification-based TTL', () => {
      const topSecretAsset: MarketAsset = {
        id: 'TS001',
        symbol: 'TOPSECRET',
        name: 'Top Secret Asset',
        category: 'INTELLIGENCE',
        price: 5000,
        volume24h: 1000,
        change24h: 2.5,
        marketCap: 50000,
        lastUpdated: Date.now(),
        metadata: {
          classification: 'TOP_SECRET',
          sourceAgency: 'CIA',
          verificationLevel: 99
        }
      };
      
      cacheService.cacheAssetData(topSecretAsset);
      
      const retrieved = cacheService.getCachedAssetData('TS001');
      expect(retrieved).toEqual(topSecretAsset);
    });
  });

  describe('Health monitoring', () => {
    it('should provide health status', () => {
      const health = cacheService.getHealthStatus();
      
      expect(health.status).toMatch(/healthy|warning|critical/);
      expect(health.issues).toBeInstanceOf(Array);
      expect(health.metrics).toBeDefined();
    });

    it('should detect low hit rate as warning', () => {
      // Generate many misses to create low hit rate
      for (let i = 0; i < 10; i++) {
        cacheService.get(`miss-${i}`);
      }
      
      const health = cacheService.getHealthStatus();
      expect(health.status).toBe('warning');
      expect(health.issues.some(issue => issue.includes('hit rate'))).toBe(true);
    });
  });
});
