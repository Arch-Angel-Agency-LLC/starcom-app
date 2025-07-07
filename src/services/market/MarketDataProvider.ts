/**
 * Market Data Provider - Intelligence Exchange Marketplace
 * Provides real-time market data for intelligence assets and trading
 * Implements observer pattern for streaming updates and caching
 */

import { EventEmitter } from 'events';

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  category: 'INTELLIGENCE' | 'GEOSPATIAL' | 'SIGNALS' | 'CYBER' | 'ECONOMIC';
  price: number;
  volume24h: number;
  change24h: number;
  marketCap: number;
  lastUpdated: number;
  metadata: {
    classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
    sourceAgency: string;
    verificationLevel: number;
    expirationTime?: number;
  };
}

export interface MarketData {
  assets: MarketAsset[];
  totalVolume: number;
  activeTraders: number;
  timestamp: number;
}

export interface MarketDataSubscription {
  id: string;
  filters: {
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    classification?: string;
  };
  callback: (data: MarketData) => void;
}

export class MarketDataProvider extends EventEmitter {
  private subscriptions: Map<string, MarketDataSubscription> = new Map();
  private mockData: MarketAsset[] = [];
  private updateInterval?: NodeJS.Timeout;
  private isActive = false;

  constructor() {
    super();
    this.initializeMockData();
  }

  /**
   * Start streaming market data updates
   */
  async startStreaming(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    this.updateInterval = setInterval(() => {
      this.updateMarketData();
    }, 5000); // Update every 5 seconds

    this.emit('streaming-started');
  }

  /**
   * Stop streaming market data updates
   */
  async stopStreaming(): Promise<void> {
    if (!this.isActive) return;
    
    this.isActive = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.emit('streaming-stopped');
  }

  /**
   * Subscribe to market data updates with filters
   */
  subscribe(filters: MarketDataSubscription['filters'], callback: (data: MarketData) => void): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(id, {
      id,
      filters,
      callback
    });

    // Send initial data
    const filteredData = this.getFilteredData(filters);
    callback(filteredData);

    this.emit('subscription-added', id);
    return id;
  }

  /**
   * Unsubscribe from market data updates
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      this.emit('subscription-removed', subscriptionId);
    }
    return removed;
  }

  /**
   * Get current market data snapshot
   */
  async getCurrentData(filters?: MarketDataSubscription['filters']): Promise<MarketData> {
    return this.getFilteredData(filters || {});
  }

  /**
   * Get specific asset data
   */
  async getAssetData(assetId: string): Promise<MarketAsset | null> {
    return this.mockData.find(asset => asset.id === assetId) || null;
  }

  /**
   * Get market statistics
   */
  async getMarketStats(): Promise<{
    totalAssets: number;
    totalVolume: number;
    averagePrice: number;
    topGainers: MarketAsset[];
    topLosers: MarketAsset[];
  }> {
    const totalVolume = this.mockData.reduce((sum, asset) => sum + asset.volume24h, 0);
    const averagePrice = this.mockData.reduce((sum, asset) => sum + asset.price, 0) / this.mockData.length;
    
    const sortedByChange = [...this.mockData].sort((a, b) => b.change24h - a.change24h);
    
    return {
      totalAssets: this.mockData.length,
      totalVolume,
      averagePrice,
      topGainers: sortedByChange.slice(0, 5),
      topLosers: sortedByChange.slice(-5).reverse()
    };
  }

  /**
   * Private: Initialize mock market data
   */
  private initializeMockData(): void {
    this.mockData = [
      {
        id: 'INTEL001',
        symbol: 'SIGINT',
        name: 'Signals Intelligence Package',
        category: 'SIGNALS',
        price: 2500.00,
        volume24h: 15000,
        change24h: 5.2,
        marketCap: 125000,
        lastUpdated: Date.now(),
        metadata: {
          classification: 'SECRET',
          sourceAgency: 'NSA',
          verificationLevel: 95,
          expirationTime: Date.now() + 86400000 // 24 hours
        }
      },
      {
        id: 'INTEL002',
        symbol: 'GEOINT',
        name: 'Geospatial Intelligence Data',
        category: 'GEOSPATIAL',
        price: 1800.50,
        volume24h: 22000,
        change24h: -2.1,
        marketCap: 180000,
        lastUpdated: Date.now(),
        metadata: {
          classification: 'CONFIDENTIAL',
          sourceAgency: 'NGA',
          verificationLevel: 88,
        }
      },
      {
        id: 'INTEL003',
        symbol: 'CYBER',
        name: 'Cyber Threat Intelligence',
        category: 'CYBER',
        price: 3200.75,
        volume24h: 8500,
        change24h: 12.8,
        marketCap: 95000,
        lastUpdated: Date.now(),
        metadata: {
          classification: 'TOP_SECRET',
          sourceAgency: 'CYBERCOM',
          verificationLevel: 99,
          expirationTime: Date.now() + 43200000 // 12 hours
        }
      },
      {
        id: 'INTEL004',
        symbol: 'ECON',
        name: 'Economic Intelligence Report',
        category: 'ECONOMIC',
        price: 1200.25,
        volume24h: 31000,
        change24h: 3.4,
        marketCap: 220000,
        lastUpdated: Date.now(),
        metadata: {
          classification: 'UNCLASSIFIED',
          sourceAgency: 'DIA',
          verificationLevel: 82,
        }
      }
    ];
  }

  /**
   * Private: Update market data with simulated changes
   */
  private updateMarketData(): void {
    this.mockData.forEach(asset => {
      // Simulate price changes (-5% to +5%)
      const changePercent = (Math.random() - 0.5) * 0.1;
      const oldPrice = asset.price;
      asset.price = Math.max(100, asset.price * (1 + changePercent));
      
      // Update 24h change
      asset.change24h = ((asset.price - oldPrice) / oldPrice) * 100;
      
      // Update volume (random variation)
      asset.volume24h = Math.max(1000, asset.volume24h * (0.9 + Math.random() * 0.2));
      
      // Update market cap
      asset.marketCap = asset.price * (asset.volume24h / asset.price * 100);
      
      asset.lastUpdated = Date.now();
    });

    // Notify all subscribers
    this.notifySubscribers();
    this.emit('data-updated', this.mockData);
  }

  /**
   * Private: Notify all subscribers with filtered data
   */
  private notifySubscribers(): void {
    this.subscriptions.forEach(subscription => {
      const filteredData = this.getFilteredData(subscription.filters);
      subscription.callback(filteredData);
    });
  }

  /**
   * Private: Get filtered market data
   */
  private getFilteredData(filters: MarketDataSubscription['filters']): MarketData {
    let filteredAssets = [...this.mockData];

    if (filters.categories && filters.categories.length > 0) {
      filteredAssets = filteredAssets.filter(asset => 
        filters.categories!.includes(asset.category)
      );
    }

    if (filters.minPrice !== undefined) {
      filteredAssets = filteredAssets.filter(asset => asset.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filteredAssets = filteredAssets.filter(asset => asset.price <= filters.maxPrice!);
    }

    if (filters.classification) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.metadata.classification === filters.classification
      );
    }

    const totalVolume = filteredAssets.reduce((sum, asset) => sum + asset.volume24h, 0);

    return {
      assets: filteredAssets,
      totalVolume,
      activeTraders: Math.floor(totalVolume / 10000), // Simulated trader count
      timestamp: Date.now()
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopStreaming();
    this.subscriptions.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const marketDataProvider = new MarketDataProvider();
