// Enhanced Data Service Interfaces for Centralized Management
// AI-NOTE: Upgraded from existing data-service-interfaces.ts to support comprehensive data management

// Core observability interface (enhanced from existing)
export interface DataServiceObserver {
  onFetchStart?(key: string, source?: string): void;
  onFetchEnd?(key: string, durationMs: number, source?: string): void;
  onError?(key: string, error: Error, source?: string): void;
  onCacheHit?(key: string, source?: string): void;
  onCacheMiss?(key: string, source?: string): void;
  onCacheEvict?(key: string, source?: string): void;
  onDataCorrelation?(sources: string[], result: unknown): void;
  onQualityAssessment?(key: string, quality: DataQualityMetrics): void;
}

// Enhanced data provider interface
export interface DataProvider<T = unknown> {
  readonly id: string;
  readonly name: string;
  readonly endpoints: EndpointConfig[];
  
  fetchData(key: string, options?: FetchOptions): Promise<T>;
  subscribe?(key: string, onData: (data: T) => void, options?: SubscriptionOptions): () => void;
  setObserver?(observer: DataServiceObserver): void;
  validateData?(data: unknown): data is T;
  transformData?(rawData: unknown): T;
}

// Enhanced cache service interface
export interface DataCacheService<T = unknown> {
  get(key: string): T | null;
  set(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
  getMetadata(key: string): CacheMetadata | null;
  setObserver?(observer: DataServiceObserver): void;
  getSize(): number;
  cleanup(): Promise<void>;
}

// New interfaces for centralized management

export interface EndpointConfig {
  id: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  retryConfig?: RetryConfig;
  rateLimit?: RateLimitConfig;
  validation?: ValidationConfig;
  transformation?: TransformationConfig;
}

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  correlate?: string[]; // Other data sources to correlate with
  quality?: boolean; // Enable quality assessment
}

export interface SubscriptionOptions {
  interval?: number;
  immediate?: boolean;
  retryOnError?: boolean;
  correlate?: string[];
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
}

export interface ValidationConfig {
  schema?: unknown; // JSON schema or validation function
  required?: string[];
  minSize?: number;
  maxSize?: number;
  customValidator?: (data: unknown) => boolean;
}

export interface TransformationConfig {
  type: 'json' | 'xml' | 'csv' | 'text' | 'custom';
  customTransformer?: (data: unknown) => unknown;
  flattenArrays?: boolean;
  normalizeKeys?: boolean;
}

export interface CacheMetadata {
  key: string;
  createdAt: number;
  expiresAt: number;
  size: number;
  hits: number;
  lastAccessed: number;
  quality?: DataQualityMetrics;
}

export interface DataQualityMetrics {
  completeness: number;    // 0-1, percentage of expected data points
  timeliness: number;      // 0-1, data freshness score
  accuracy: number;        // 0-1, quality flag assessment
  consistency: number;     // 0-1, cross-source validation score
  reliability: number;     // 0-1, historical reliability score
}

export interface DataSource {
  id: string;
  name: string;
  category: 'space-weather' | 'market' | 'conflict' | 'intelligence' | 'weather' | 'energy' | 'other';
  provider: DataProvider;
  cache: DataCacheService;
  updateInterval: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  dependencies?: string[]; // Other data sources this depends on
  correlations?: string[]; // Data sources this correlates with
  metadata: {
    description: string;
    tags: string[];
    lastUpdated?: number;
    dataTypes: string[];
    coverage?: {
      geographic?: string;
      temporal?: string;
      resolution?: string;
    };
  };
}

export interface CorrelationRule {
  id: string;
  name: string;
  sources: string[];
  condition: (data: Record<string, unknown>) => boolean;
  action: (correlatedData: Record<string, unknown>) => CorrelationResult;
  priority: number;
  enabled: boolean;
}

export interface CorrelationResult {
  id: string;
  timestamp: number;
  sources: string[];
  confidence: number; // 0-1
  significance: 'low' | 'medium' | 'high' | 'critical';
  insights: CorrelationInsight[];
  recommendations?: string[];
  alerts?: Alert[];
}

export interface CorrelationInsight {
  type: 'trend' | 'anomaly' | 'pattern' | 'threshold' | 'prediction';
  description: string;
  data: unknown;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface Alert {
  id: string;
  timestamp: number;
  source: string;
  type: string;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  title: string;
  description: string;
  data?: unknown;
  expiresAt?: number;
  acknowledged?: boolean;
}

// Centralized Data Manager Interface
export interface CentralizedDataManager {
  // Data Source Management
  registerDataSource(source: DataSource): Promise<void>;
  unregisterDataSource(sourceId: string): Promise<void>;
  getDataSource(sourceId: string): DataSource | null;
  listDataSources(category?: string): DataSource[];
  
  // Data Fetching
  fetchData(sourceId: string, key: string, options?: FetchOptions): Promise<unknown>;
  fetchMultiple(requests: Array<{sourceId: string, key: string, options?: FetchOptions}>): Promise<Record<string, unknown>>;
  
  // Subscriptions
  subscribe(sourceId: string, key: string, callback: (data: unknown) => void, options?: SubscriptionOptions): () => void;
  subscribeMultiple(subscriptions: Array<{sourceId: string, key: string, callback: (data: unknown) => void, options?: SubscriptionOptions}>): () => void;
  
  // Correlation & Analysis
  addCorrelationRule(rule: CorrelationRule): void;
  removeCorrelationRule(ruleId: string): void;
  correlateData(sourceIds: string[], options?: CorrelationOptions): Promise<CorrelationResult[]>;
  
  // Quality & Monitoring
  assessDataQuality(sourceId: string, key: string): Promise<DataQualityMetrics>;
  getSystemHealth(): Promise<SystemHealthReport>;
  
  // Cache Management
  clearCache(sourceId?: string, key?: string): Promise<void>;
  optimizeCache(): Promise<void>;
  
  // Observability
  setGlobalObserver(observer: DataServiceObserver): void;
  getMetrics(): Promise<SystemMetrics>;
}

export interface CorrelationOptions {
  timeWindow?: number; // milliseconds
  minConfidence?: number; // 0-1
  includeHistorical?: boolean;
  maxResults?: number;
}

export interface SystemHealthReport {
  timestamp: number;
  overall: 'healthy' | 'degraded' | 'critical';
  sources: Array<{
    id: string;
    status: 'online' | 'offline' | 'degraded';
    lastUpdate: number;
    errorRate: number;
    responseTime: number;
    cacheHitRate: number;
  }>;
  cache: {
    totalSize: number;
    hitRate: number;
    evictionRate: number;
    oldestEntry: number;
  };
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    correlationsPerMinute: number;
  };
}

export interface SystemMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    evictions: number;
    totalSize: number;
  };
  correlations: {
    total: number;
    successful: number;
    averageConfidence: number;
    alertsGenerated: number;
  };
  dataSources: {
    total: number;
    active: number;
    offline: number;
    averageQuality: number;
  };
}

// Enhanced fallback provider (upgraded from existing)
export class FallbackProvider<T> implements DataProvider<T> {
  readonly id: string;
  readonly name: string;
  readonly endpoints: EndpointConfig[] = [];
  
  constructor(
    id: string,
    name: string,
    private providers: DataProvider<T>[]
  ) {
    this.id = id;
    this.name = name;
  }
  
  async fetchData(key: string, options?: FetchOptions): Promise<T> {
    let lastError: Error | null = null;
    
    for (const provider of this.providers) {
      try {
        return await provider.fetchData(key, options);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Provider ${provider.id} failed for key ${key}:`, error);
      }
    }
    
    throw new Error(`All ${this.providers.length} providers failed. Last error: ${lastError?.message}`);
  }
  
  setObserver(observer: DataServiceObserver): void {
    this.providers.forEach(provider => provider.setObserver?.(observer));
  }
  
  validateData(data: unknown): data is T {
    return this.providers.some(provider => provider.validateData?.(data));
  }
  
  transformData(rawData: unknown): T {
    // Use the first provider's transformation
    return this.providers[0]?.transformData?.(rawData) ?? rawData as T;
  }
}

// Load balancing provider
export class LoadBalancingProvider<T> implements DataProvider<T> {
  readonly id: string;
  readonly name: string;
  readonly endpoints: EndpointConfig[] = [];
  
  private currentIndex = 0;
  
  constructor(
    id: string,
    name: string,
    private providers: DataProvider<T>[],
    private strategy: 'round-robin' | 'random' | 'least-loaded' = 'round-robin'
  ) {
    this.id = id;
    this.name = name;
  }
  
  async fetchData(key: string, options?: FetchOptions): Promise<T> {
    const provider = this.selectProvider();
    return provider.fetchData(key, options);
  }
  
  private selectProvider(): DataProvider<T> {
    switch (this.strategy) {
      case 'round-robin': {
        const provider = this.providers[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.providers.length;
        return provider;
      }
      
      case 'random':
        return this.providers[Math.floor(Math.random() * this.providers.length)];
      
      case 'least-loaded':
        // For now, just return random. Could be enhanced with load tracking
        return this.providers[Math.floor(Math.random() * this.providers.length)];
      
      default:
        return this.providers[0];
    }
  }
  
  setObserver(observer: DataServiceObserver): void {
    this.providers.forEach(provider => provider.setObserver?.(observer));
  }
  
  validateData(data: unknown): data is T {
    return this.providers.some(provider => provider.validateData?.(data));
  }
  
  transformData(rawData: unknown): T {
    return this.providers[0]?.transformData?.(rawData) ?? rawData as T;
  }
}

// AI-NOTE: This enhanced interface system provides the foundation for a comprehensive data management system
// that can handle all existing services and scale to support extensive NOAA endpoint expansion.
