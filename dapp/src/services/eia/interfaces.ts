// Enhanced EIA data interfaces and types
// Artifact-driven: Comprehensive energy intelligence data structures

// Core series configuration interface
// TODO: Implement security metrics collection and reporting - PRIORITY: MEDIUM
// TODO: Add comprehensive security testing and penetration testing integration - PRIORITY: MEDIUM
export interface EIASeriesConfig {
  id: string;
  series: string;
  label: string;
  icon: string;
  format: string;
  category: string;
  priority: 'critical' | 'important' | 'standard' | 'background';
  refreshInterval: number;
  cacheTime?: number;
  transform?: (value: number) => string;
  earthAllianceContext?: string;
  batchGroup?: string;
  units?: string;
  formatValue?: (value: number) => string;
  securityContext?: EIASecurityMetadata;
}

// Enhanced data point interface
export interface EIADataPoint {
  seriesId: string;
  value: number;
  timestamp: Date;
  period?: string;
  units: string;
  label: string;
  category: string;
  priority: 'critical' | 'important' | 'standard' | 'background';
  securityContext?: EIASecurityMetadata;
  formattedValue: string;
}

// Batch request and response interfaces
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface BatchRequest {
  batchId: string;
  seriesIds: string[];
  priority: 'high' | 'medium' | 'low';
  maxAge?: number;
  retryConfig?: RetryConfig;
}

export interface BatchResponse {
  batchId: string;
  data: Record<string, EIADataPoint>;
  errors: Record<string, Error>;
  metadata: BatchMetadata;
}

export interface BatchMetadata {
  totalRequested: number;
  successful: number;
  failed: number;
  duration: number;
  priority: 'high' | 'medium' | 'low';
}

// Error handling interfaces
export enum EIAErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  INVALID_SERIES = 'INVALID_SERIES',
  DATA_STALE = 'DATA_STALE',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export class EIAError extends Error {
  constructor(
    message: string,
    public type: EIAErrorType,
    public seriesId?: string,
    public retryAfter?: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EIAError';
  }
}

// Monitoring interfaces
export interface CacheStatistics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
  evictions: number;
}

export interface ProviderHealth {
  isHealthy: boolean;
  requestsPerMinute: number;
  queueSize: number;
  lastRequestTime: number;
  uptime: number;
}

export interface QuotaStatus {
  hourlyUsage: number;
  dailyUsage: number;
  hourlyLimit: number;
  dailyLimit: number;
  remainingHourly: number;
  remainingDaily: number;
}

// Existing data (maintain compatibility)
export interface EnhancedEIAData {
  oilPrice: number | null;
  gasolinePrice: number | null;
  oilInventory: number | null;
  naturalGasStorage: number | null;
  
  // Energy Security (Critical Infrastructure)
  naturalGasPrice: number | null;
  electricityGeneration: number | null;
  electricityPrice: number | null;
  
  // Renewables (Clean Energy Transition)
  solarGeneration: number | null;
  windGeneration: number | null;
  hydroGeneration: number | null;
  
  // Market Intelligence (Economic Warfare Detection)
  brentCrude: number | null;
  jetFuelSupply: number | null;
  refineryUtilization: number | null;
  
  // Strategic Monitoring (National Security)
  crudeImports: number | null;
  lngExports: number | null;
  nuclearGeneration: number | null;
  coalGeneration: number | null;
  naturalGasGeneration: number | null;
  
  // Additional Energy Data
  distillateSupply: number | null;
  propaneSupply: number | null;
  crudeInputs: number | null;
  gasolineProduction: number | null;
  
  // Metadata
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  apiCallsRemaining?: number;
}

export interface EIABatchGroup {
  id: string;
  name: string;
  description: string;
  seriesIds: string[];
  priority: 'critical' | 'important' | 'standard' | 'background';
  refreshInterval: number;
}

export interface EIAApiMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  cacheHitRate: number;
  rateLimitRemaining: number;
  lastCallTimestamp: number;
}

// Earth Alliance Intelligence Classification
export type SecurityClassification = 'public' | 'internal' | 'classified';

export interface EIASecurityMetadata {
  classification: SecurityClassification;
  earthAllianceRelevance: string;
  threatIndicators: string[];
  operationalPriority: number; // 1-10 scale
}

// AI-NOTE: These interfaces provide comprehensive type safety for enhanced EIA data integration
// while maintaining backward compatibility with existing oil price implementation.
