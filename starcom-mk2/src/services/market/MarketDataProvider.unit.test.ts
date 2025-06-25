// MarketDataProvider unit tests (artifact-driven)
// Artifacts: data-service-interfaces, data-service-testing-strategy

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarketDataProvider, MarketData } from './MarketDataProvider';

describe('MarketDataProvider', () => {
  let provider: MarketDataProvider;

  beforeEach(() => {
    provider = new MarketDataProvider();
  });

  afterEach(() => {
    provider.destroy();
  });

  describe('Basic functionality', () => {
    it('should initialize with mock data', async () => {
      const data = await provider.getCurrentData();
      expect(data.assets).toHaveLength(4);
      expect(data.totalVolume).toBeGreaterThan(0);
      expect(data.activeTraders).toBeGreaterThan(0);
      expect(data.timestamp).toBeTypeOf('number');
    });

    it('should get specific asset data', async () => {
      const asset = await provider.getAssetData('INTEL001');
      expect(asset).toBeTruthy();
      expect(asset?.symbol).toBe('SIGINT');
      expect(asset?.category).toBe('SIGNALS');
    });

    it('should return null for non-existent asset', async () => {
      const asset = await provider.getAssetData('NONEXISTENT');
      expect(asset).toBeNull();
    });
  });

  describe('Filtering', () => {
    it('should filter by categories', async () => {
      const data = await provider.getCurrentData({ categories: ['CYBER'] });
      expect(data.assets).toHaveLength(1);
      expect(data.assets[0].category).toBe('CYBER');
    });

    it('should filter by price range', async () => {
      const data = await provider.getCurrentData({ 
        minPrice: 2000, 
        maxPrice: 3000 
      });
      expect(data.assets.every(asset => asset.price >= 2000 && asset.price <= 3000)).toBe(true);
    });

    it('should filter by classification', async () => {
      const data = await provider.getCurrentData({ classification: 'SECRET' });
      expect(data.assets.every(asset => asset.metadata.classification === 'SECRET')).toBe(true);
    });
  });

  describe('Subscriptions', () => {
    it('should create subscription and receive initial data', () => {
      return new Promise<void>((resolve) => {
        const callback = vi.fn((data: MarketData) => {
          expect(data.assets).toHaveLength(4);
          resolve();
        });

        const subId = provider.subscribe({}, callback);
        expect(subId).toMatch(/^sub_/);
      });
    });

    it('should unsubscribe successfully', () => {
      const callback = vi.fn();
      const subId = provider.subscribe({}, callback);
      
      const result = provider.unsubscribe(subId);
      expect(result).toBe(true);
    });

    it('should return false when unsubscribing non-existent subscription', () => {
      const result = provider.unsubscribe('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Streaming', () => {
    it('should start and stop streaming', async () => {
      await provider.startStreaming();
      await provider.stopStreaming();
      // Streaming functionality tested via events in next test
    });

    it('should emit events when streaming starts/stops', async () => {
      const startSpy = vi.fn();
      const stopSpy = vi.fn();
      
      provider.on('streaming-started', startSpy);
      provider.on('streaming-stopped', stopSpy);
      
      await provider.startStreaming();
      expect(startSpy).toHaveBeenCalled();
      
      await provider.stopStreaming();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('Market statistics', () => {
    it('should calculate market stats correctly', async () => {
      const stats = await provider.getMarketStats();
      
      expect(stats.totalAssets).toBe(4);
      expect(stats.totalVolume).toBeGreaterThan(0);
      expect(stats.averagePrice).toBeGreaterThan(0);
      expect(stats.topGainers).toHaveLength(4); // We only have 4 assets total
      expect(stats.topLosers).toHaveLength(4); // We only have 4 assets total
    });
  });
});
