// Centralized Data Manager Implementation
// AI-NOTE: Core implementation of the unified data management system

import {
  CentralizedDataManager,
  DataSource,
  DataServiceObserver,
  FetchOptions,
  SubscriptionOptions,
  CorrelationRule,
  CorrelationResult,
  CorrelationOptions,
  DataQualityMetrics,
  SystemHealthReport,
  SystemMetrics
} from './interfaces';

interface Subscription {
  id: string;
  sourceId: string;
  key: string;
  callback: (data: unknown) => void;
  options: SubscriptionOptions;
  intervalId?: NodeJS.Timeout;
  active: boolean;
}

interface RequestMetrics {
  timestamp: number;
  sourceId: string;
  key: string;
  duration: number;
  success: boolean;
  error?: string;
  cacheHit: boolean;
}

// TODO: Implement IPFS content backup and redundancy across multiple nodes - PRIORITY: HIGH
// TODO: Add support for IPFS content compression and optimization - PRIORITY: MEDIUM
export class StarcomDataManager implements CentralizedDataManager {
  private dataSources = new Map<string, DataSource>();
  private correlationRules = new Map<string, CorrelationRule>();
  private subscriptions = new Map<string, Subscription>();
  private globalObserver?: DataServiceObserver;
  private requestMetrics: RequestMetrics[] = [];
  
  // Metrics tracking
  private metrics = {
    requests: { total: 0, successful: 0, failed: 0, totalDuration: 0 },
    cache: { hits: 0, misses: 0, evictions: 0 },
    correlations: { total: 0, successful: 0, alertsGenerated: 0, totalConfidence: 0 },
    subscriptions: { active: 0, total: 0 }
  };

  constructor() {
    // Start background tasks
    this.startBackgroundTasks();
  }

  // Data Source Management
  async registerDataSource(source: DataSource): Promise<void> {
    if (this.dataSources.has(source.id)) {
      throw new Error(`Data source with id '${source.id}' already registered`);
    }

    // Set up observer forwarding
    if (source.provider.setObserver) {
      source.provider.setObserver(this.createSourceObserver(source.id));
    }
    if (source.cache.setObserver) {
      source.cache.setObserver(this.createSourceObserver(source.id));
    }

    this.dataSources.set(source.id, source);
    
    console.log(`✅ Registered data source: ${source.name} (${source.id})`);
    this.globalObserver?.onFetchStart?.(`register-${source.id}`, 'system');
  }

  async unregisterDataSource(sourceId: string): Promise<void> {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Data source '${sourceId}' not found`);
    }

    // Cancel all subscriptions for this source
    const sourceSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.sourceId === sourceId);
    
    for (const sub of sourceSubscriptions) {
      this.unsubscribe(sub.id);
    }

    this.dataSources.delete(sourceId);
    console.log(`🗑️ Unregistered data source: ${source.name} (${sourceId})`);
  }

  getDataSource(sourceId: string): DataSource | null {
    return this.dataSources.get(sourceId) || null;
  }

  listDataSources(category?: string): DataSource[] {
    const sources = Array.from(this.dataSources.values());
    return category ? sources.filter(s => s.category === category) : sources;
  }

  // Data Fetching
  async fetchData(sourceId: string, key: string, options: FetchOptions = {}): Promise<unknown> {
    const startTime = Date.now();
    const source = this.dataSources.get(sourceId);
    
    if (!source) {
      throw new Error(`Data source '${sourceId}' not found`);
    }

    try {
      this.globalObserver?.onFetchStart?.(key, sourceId);
      this.metrics.requests.total++;

      // Check cache first if enabled
      let data: unknown;
      let cacheHit = false;
      
      if (options.cache !== false && source.cache.has(key)) {
        data = source.cache.get(key);
        cacheHit = true;
        this.metrics.cache.hits++;
        this.globalObserver?.onCacheHit?.(key, sourceId);
      } else {
        // Fetch from provider
        data = await source.provider.fetchData(key, options);
        this.metrics.cache.misses++;
        this.globalObserver?.onCacheMiss?.(key, sourceId);
        
        // Store in cache if successful
        if (data !== null && data !== undefined) {
          source.cache.set(key, data);
        }
      }

      // Quality assessment if requested
      if (options.quality) {
        const quality = await this.assessDataQuality(sourceId, key);
        this.globalObserver?.onQualityAssessment?.(key, quality);
      }

      // Correlation if requested
      if (options.correlate && options.correlate.length > 0) {
        await this.correlateData([sourceId, ...options.correlate]);
      }

      const duration = Date.now() - startTime;
      this.recordMetrics(sourceId, key, duration, true, cacheHit);
      this.globalObserver?.onFetchEnd?.(key, duration, sourceId);
      this.metrics.requests.successful++;

      return data;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics(sourceId, key, duration, false, false, (error as Error).message);
      this.globalObserver?.onError?.(key, error as Error, sourceId);
      this.metrics.requests.failed++;
      throw error;
    }
  }

  async fetchMultiple(requests: Array<{sourceId: string, key: string, options?: FetchOptions}>): Promise<Record<string, unknown>> {
    const results = await Promise.allSettled(
      requests.map(async req => ({
        key: `${req.sourceId}:${req.key}`,
        data: await this.fetchData(req.sourceId, req.key, req.options)
      }))
    );

    const output: Record<string, unknown> = {};
    
    results.forEach((result, index) => {
      const request = requests[index];
      const key = `${request.sourceId}:${request.key}`;
      
      if (result.status === 'fulfilled') {
        output[key] = result.value.data;
      } else {
        console.error(`Failed to fetch ${key}:`, result.reason);
        output[key] = null;
      }
    });

    return output;
  }

  // Subscriptions
  subscribe(
    sourceId: string, 
    key: string, 
    callback: (data: unknown) => void, 
    options: SubscriptionOptions = {}
  ): () => void {
    const subscriptionId = `${sourceId}:${key}:${Date.now()}`;
    const interval = options.interval || 60000; // Default 1 minute

    const subscription: Subscription = {
      id: subscriptionId,
      sourceId,
      key,
      callback,
      options,
      active: true
    };

    // Initial fetch if requested
    if (options.immediate !== false) {
      this.fetchData(sourceId, key)
        .then(data => callback(data))
        .catch(error => {
          console.error(`Initial subscription fetch failed for ${subscriptionId}:`, error);
          if (!options.retryOnError) {
            subscription.active = false;
          }
        });
    }

    // Set up interval
    subscription.intervalId = setInterval(async () => {
      if (!subscription.active) return;

      try {
        const data = await this.fetchData(sourceId, key);
        callback(data);
      } catch (error) {
        console.error(`Subscription fetch failed for ${subscriptionId}:`, error);
        if (!options.retryOnError) {
          subscription.active = false;
          this.unsubscribe(subscriptionId);
        }
      }
    }, interval);

    this.subscriptions.set(subscriptionId, subscription);
    this.metrics.subscriptions.active++;
    this.metrics.subscriptions.total++;

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionId);
  }

  subscribeMultiple(subscriptions: Array<{sourceId: string, key: string, callback: (data: unknown) => void, options?: SubscriptionOptions}>): () => void {
    const unsubscribeFunctions = subscriptions.map(sub => 
      this.subscribe(sub.sourceId, sub.key, sub.callback, sub.options)
    );

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }

  private unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      if (subscription.intervalId) {
        clearInterval(subscription.intervalId);
      }
      this.subscriptions.delete(subscriptionId);
      this.metrics.subscriptions.active--;
    }
  }

  // Correlation & Analysis
  addCorrelationRule(rule: CorrelationRule): void {
    this.correlationRules.set(rule.id, rule);
    console.log(`📊 Added correlation rule: ${rule.name}`);
  }

  removeCorrelationRule(ruleId: string): void {
    this.correlationRules.delete(ruleId);
    console.log(`🗑️ Removed correlation rule: ${ruleId}`);
  }

  async correlateData(sourceIds: string[], options: CorrelationOptions = {}): Promise<CorrelationResult[]> {
    this.metrics.correlations.total++;
    
    try {
      const results: CorrelationResult[] = [];
      const data: Record<string, unknown> = {};

      // Log correlation options for debugging
      console.log('Correlating data with options:', options);

      // Collect data from all sources
      for (const sourceId of sourceIds) {
        try {
          const sourceData = await this.fetchData(sourceId, 'latest', { cache: true });
          data[sourceId] = sourceData;
        } catch (error) {
          console.warn(`Failed to fetch data for correlation from ${sourceId}:`, error);
        }
      }

      // Apply correlation rules
      for (const rule of this.correlationRules.values()) {
        if (!rule.enabled) continue;
        
        const relevantSources = rule.sources.filter(s => sourceIds.includes(s));
        if (relevantSources.length < 2) continue;

        try {
          if (rule.condition(data)) {
            const result = rule.action(data);
            results.push(result);
            
            this.globalObserver?.onDataCorrelation?.(relevantSources, result);
            
            // Generate alerts if any
            if (result.alerts && result.alerts.length > 0) {
              this.metrics.correlations.alertsGenerated += result.alerts.length;
            }
          }
        } catch (error) {
          console.error(`Correlation rule ${rule.id} failed:`, error);
        }
      }

      this.metrics.correlations.successful++;
      return results;

    } catch (error) {
      console.error('Data correlation failed:', error);
      throw error;
    }
  }

  // Quality & Monitoring
  async assessDataQuality(sourceId: string, key: string): Promise<DataQualityMetrics> {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Data source '${sourceId}' not found`);
    }

    // Basic quality assessment - can be enhanced
    const data = source.cache.get(key);
    const metadata = source.cache.getMetadata(key);
    
    const now = Date.now();
    const age = metadata ? now - metadata.createdAt : Infinity;
    const expectedInterval = source.updateInterval;
    
    return {
      completeness: data ? 1.0 : 0.0,
      timeliness: Math.max(0, 1 - (age / (expectedInterval * 2))), // Penalize old data
      accuracy: 1.0, // Would need source-specific validation
      consistency: 1.0, // Would need cross-source comparison
      reliability: this.getSourceReliability(sourceId)
    };
  }

  async getSystemHealth(): Promise<SystemHealthReport> {
    const now = Date.now();
    const sources = Array.from(this.dataSources.values());
    
    const sourceHealth = sources.map(source => {
      const recentMetrics = this.getRecentMetrics(source.id, 300000); // Last 5 minutes
      const errorRate = recentMetrics.length > 0 
        ? recentMetrics.filter(m => !m.success).length / recentMetrics.length 
        : 0;
      
      const avgResponseTime = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0;
      
      const cacheHitRate = recentMetrics.length > 0
        ? recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length
        : 0;

      const status: 'offline' | 'degraded' | 'online' = errorRate > 0.5 ? 'offline' : errorRate > 0.1 ? 'degraded' : 'online';

      return {
        id: source.id,
        status,
        lastUpdate: source.metadata.lastUpdated || 0,
        errorRate,
        responseTime: avgResponseTime,
        cacheHitRate
      };
    });

    const overallStatus = sourceHealth.some(s => s.status === 'offline') ? 'critical' :
                         sourceHealth.some(s => s.status === 'degraded') ? 'degraded' : 'healthy';

    return {
      timestamp: now,
      overall: overallStatus,
      sources: sourceHealth,
      cache: {
        totalSize: this.getTotalCacheSize(),
        hitRate: this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses) || 0,
        evictionRate: this.metrics.cache.evictions / this.metrics.cache.hits || 0,
        oldestEntry: this.getOldestCacheEntry()
      },
      performance: {
        averageResponseTime: this.metrics.requests.totalDuration / this.metrics.requests.total || 0,
        requestsPerMinute: this.getRequestsPerMinute(),
        errorRate: this.metrics.requests.failed / this.metrics.requests.total || 0,
        correlationsPerMinute: this.getCorrelationsPerMinute()
      }
    };
  }

  // Cache Management
  async clearCache(sourceId?: string, key?: string): Promise<void> {
    if (sourceId && key) {
      // Clear specific key from specific source
      const source = this.dataSources.get(sourceId);
      if (source) {
        source.cache.delete(key);
      }
    } else if (sourceId) {
      // Clear all cache for specific source
      const source = this.dataSources.get(sourceId);
      if (source) {
        source.cache.clear();
      }
    } else {
      // Clear all caches
      for (const source of this.dataSources.values()) {
        source.cache.clear();
      }
    }
  }

  async optimizeCache(): Promise<void> {
    for (const source of this.dataSources.values()) {
      await source.cache.cleanup();
    }
  }

  // Observability
  setGlobalObserver(observer: DataServiceObserver): void {
    this.globalObserver = observer;
  }

  async getMetrics(): Promise<SystemMetrics> {
    const totalConfidence = this.metrics.correlations.totalConfidence;
    const totalCorrelations = this.metrics.correlations.total;
    
    return {
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        averageResponseTime: this.metrics.requests.totalDuration / this.metrics.requests.total || 0
      },
      cache: {
        hits: this.metrics.cache.hits,
        misses: this.metrics.cache.misses,
        evictions: this.metrics.cache.evictions,
        totalSize: this.getTotalCacheSize()
      },
      correlations: {
        total: totalCorrelations,
        successful: this.metrics.correlations.successful,
        averageConfidence: totalCorrelations > 0 ? totalConfidence / totalCorrelations : 0,
        alertsGenerated: this.metrics.correlations.alertsGenerated
      },
      dataSources: {
        total: this.dataSources.size,
        active: Array.from(this.dataSources.values()).filter(s => s.metadata.lastUpdated && 
          Date.now() - s.metadata.lastUpdated < s.updateInterval * 2).length,
        offline: Array.from(this.dataSources.values()).filter(s => !s.metadata.lastUpdated ||
          Date.now() - s.metadata.lastUpdated > s.updateInterval * 5).length,
        averageQuality: this.getAverageDataQuality()
      }
    };
  }

  // Private helper methods
  private createSourceObserver(sourceId: string): DataServiceObserver {
    return {
      onFetchStart: (key, source) => this.globalObserver?.onFetchStart?.(key, source || sourceId),
      onFetchEnd: (key, duration, source) => this.globalObserver?.onFetchEnd?.(key, duration, source || sourceId),
      onError: (key, error, source) => this.globalObserver?.onError?.(key, error, source || sourceId),
      onCacheHit: (key, source) => this.globalObserver?.onCacheHit?.(key, source || sourceId),
      onCacheMiss: (key, source) => this.globalObserver?.onCacheMiss?.(key, source || sourceId),
      onCacheEvict: (key, source) => this.globalObserver?.onCacheEvict?.(key, source || sourceId)
    };
  }

  private recordMetrics(sourceId: string, key: string, duration: number, success: boolean, cacheHit: boolean, error?: string): void {
    this.requestMetrics.push({
      timestamp: Date.now(),
      sourceId,
      key,
      duration,
      success,
      cacheHit,
      error
    });

    this.metrics.requests.totalDuration += duration;

    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - 3600000;
    this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > oneHourAgo);
  }

  private getRecentMetrics(sourceId: string, timeWindow: number): RequestMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.requestMetrics.filter(m => m.sourceId === sourceId && m.timestamp > cutoff);
  }

  private getSourceReliability(sourceId: string): number {
    const recentMetrics = this.getRecentMetrics(sourceId, 3600000); // Last hour
    if (recentMetrics.length === 0) return 1.0;
    
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    return successfulRequests / recentMetrics.length;
  }

  private getTotalCacheSize(): number {
    return Array.from(this.dataSources.values())
      .reduce((total, source) => total + source.cache.getSize(), 0);
  }

  private getOldestCacheEntry(): number {
    const oldest = Date.now();
    
    // TODO: Implement cache entry age tracking in cache services
    // For now, return current time as placeholder
    
    return oldest;
  }

  private getRequestsPerMinute(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.requestMetrics.filter(m => m.timestamp > oneMinuteAgo);
    return recentRequests.length;
  }

  private getCorrelationsPerMinute(): number {
    // This would need to track correlation timestamps
    // For now, return a placeholder
    return 0;
  }

  private getAverageDataQuality(): number {
    // This would need to track quality metrics per source
    // For now, return a placeholder
    return 0.85;
  }

  private startBackgroundTasks(): void {
    // Cache cleanup every 5 minutes
    setInterval(() => {
      this.optimizeCache().catch(error => 
        console.error('Cache optimization failed:', error)
      );
    }, 300000);

    // Metrics cleanup every hour
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > oneHourAgo);
    }, 3600000);
  }
}

// AI-NOTE: This implementation provides a robust foundation for centralized data management
// with observability, caching, correlation, and quality assessment capabilities
