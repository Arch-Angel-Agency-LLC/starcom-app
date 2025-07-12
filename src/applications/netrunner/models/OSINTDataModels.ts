/**
 * NetRunner OSINT Data Models
 * 
 * Core data models for OSINT data collection operations in NetRunner.
 * These models define the structure of data collected (not analyzed) by NetRunner.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

/**
 * Intel types supported by NetRunner OSINT collection
 */
export type IntelType = 
  | 'identity'        // Personal identity information
  | 'network'         // Network infrastructure data
  | 'financial'       // Financial information
  | 'geospatial'      // Geographic and location data
  | 'social'          // Social media and communication data
  | 'infrastructure'  // Technical infrastructure data
  | 'vulnerability'   // Security vulnerabilities
  | 'darkweb'        // Dark web intelligence
  | 'threat'         // Threat intelligence
  | 'temporal';      // Time-based intelligence

/**
 * OSINT data source types
 */
export type SourceType = 
  | 'public_web'      // Public web sources
  | 'social_media'    // Social media platforms
  | 'search_engine'   // Search engine results
  | 'database'        // Public databases
  | 'api'            // API endpoints
  | 'dark_web'       // Dark web sources
  | 'file_system'    // File system sources
  | 'network_scan'   // Network scanning results
  | 'manual';        // Manually entered data

/**
 * OSINT data classification levels
 */
export type ClassificationLevel = 
  | 'public'         // Public information
  | 'internal'       // Internal use only
  | 'confidential'   // Confidential information
  | 'restricted';    // Restricted access

/**
 * Base interface for all OSINT data items
 */
export interface OSINTDataItem {
  id: string;
  type: IntelType;
  sourceType: SourceType;
  classification: ClassificationLevel;
  collectedAt: string;
  collectedBy: string;
  correlationId?: string;
  source: {
    name: string;
    url?: string;
    tool?: string;
    reliability: 'high' | 'medium' | 'low' | 'unknown';
  };
  content: Record<string, unknown>;
  metadata: {
    collectionMethod: string;
    processingStatus: 'raw' | 'processed' | 'validated' | 'transferred';
    tags?: string[];
    confidence: number; // 0-100
    [key: string]: unknown;
  };
}

/**
 * Search query structure for OSINT operations
 */
export interface OSINTSearchQuery {
  id: string;
  query: string;
  type: IntelType[];
  sources: SourceType[];
  filters: {
    dateRange?: {
      start: string;
      end: string;
    };
    geographic?: {
      country?: string;
      region?: string;
      coordinates?: {
        lat: number;
        lng: number;
        radius: number;
      };
    };
    language?: string[];
    excludeTerms?: string[];
  };
  options: {
    maxResults?: number;
    timeout?: number;
    includeMetadata: boolean;
    deduplication: boolean;
  };
  createdAt: string;
  createdBy: string;
  correlationId?: string;
}

/**
 * OSINT search result structure
 */
export interface OSINTSearchResult {
  queryId: string;
  correlationId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startTime: string;
  endTime?: string;
  duration?: number;
  totalResults: number;
  processedResults: number;
  items: OSINTDataItem[];
  errors: Array<{
    source: string;
    error: string;
    timestamp: string;
  }>;
  metadata: {
    sourcesQueried: string[];
    sourcesSuccessful: string[];
    sourcesFailed: string[];
    performance: {
      [source: string]: {
        responseTime: number;
        resultCount: number;
        success: boolean;
      };
    };
  };
}

/**
 * Tool execution request structure
 */
export interface ToolExecutionRequest {
  id: string;
  toolId: string;
  parameters: Record<string, unknown>;
  options: {
    timeout?: number;
    retries?: number;
    priority?: 'low' | 'normal' | 'high';
  };
  context: {
    userId: string;
    sessionId?: string;
    workflowId?: string;
    correlationId?: string;
  };
  createdAt: string;
}

/**
 * Tool execution response structure
 */
export interface ToolExecutionResponse {
  requestId: string;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  startTime: string;
  endTime: string;
  duration: number;
  data?: OSINTDataItem[];
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata: {
    toolVersion?: string;
    resourcesUsed?: {
      cpu?: number;
      memory?: number;
      network?: number;
    };
    performance?: {
      requestsPerSecond?: number;
      avgResponseTime?: number;
    };
  };
  correlationId?: string;
}

/**
 * Bot task structure for automated OSINT collection
 */
export interface BotTask {
  id: string;
  botId: string;
  type: 'search' | 'monitor' | 'workflow' | 'custom';
  name: string;
  description?: string;
  configuration: {
    schedule?: {
      type: 'once' | 'recurring';
      startTime: string;
      interval?: string; // cron expression for recurring tasks
      endTime?: string;
    };
    parameters: Record<string, unknown>;
    options: {
      priority: 'low' | 'normal' | 'high' | 'critical';
      timeout: number;
      retries: number;
      notifications: boolean;
    };
  };
  status: 'created' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    current: number;
    total: number;
    stage: string;
  };
  results?: {
    dataCollected: number;
    timeElapsed: number;
    successRate: number;
    outputLocation?: string;
  };
  createdAt: string;
  createdBy: string;
  correlationId?: string;
}

/**
 * Data Transfer Object for sending OSINT data to IntelAnalyzer
 */
export interface OSINTDataTransferDTO {
  transferId: string;
  sourceApplication: 'netrunner';
  targetApplication: 'intel-analyzer';
  transferType: 'search-results' | 'tool-output' | 'bot-collection' | 'bulk-transfer';
  timestamp: string;
  data: {
    items: OSINTDataItem[];
    context: {
      originalQuery?: OSINTSearchQuery;
      toolExecution?: ToolExecutionRequest;
      botTask?: BotTask;
      correlationId?: string;
    };
    metadata: {
      totalItems: number;
      dataTypes: IntelType[];
      sourceTypes: SourceType[];
      qualityScore: number; // 0-100
      processingNotes?: string[];
    };
  };
  security: {
    classification: ClassificationLevel;
    accessControl: string[];
    retention?: {
      period: number; // days
      action: 'delete' | 'archive' | 'transfer';
    };
  };
}

// Additional types for real API integration

/**
 * Generic OSINT result wrapper
 */
export interface OSINTResult {
  success: boolean;
  data?: OSINTSource;
  error?: {
    message: string;
    code: string;
    correlationId?: string;
  };
  metadata?: {
    correlationId: string;
    source: string;
    timestamp: string;
    requestTime?: number;
    creditsUsed?: number;
    remainingCredits?: number;
  };
}

/**
 * OSINT data source information
 */
export interface OSINTSource {
  id: string;
  name: string;
  type: IntelType;
  description: string;
  url: string;
  lastUpdated: string;
  trustLevel: 'low' | 'medium' | 'high' | 'verified';
  data: Record<string, unknown>;
  metadata: {
    correlationId: string;
    source: string;
    [key: string]: unknown;
  };
}

/**
 * Network host information
 */
export interface NetworkHost {
  ip: string;
  port: number;
  hostname: string;
  hostnames: string[];
  domains: string[];
  organization: string;
  isp: string;
  asn: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  postalCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  services: NetworkService[];
  operatingSystem: string;
  deviceType: string;
  tags: string[];
  vulnerabilities: Vulnerability[];
  lastSeen: string;
  metadata: Record<string, unknown>;
}

/**
 * Network service information
 */
export interface NetworkService {
  port: number;
  protocol: string;
  service: string;
  version: string;
  banner: string;
  title: string;
  ssl?: {
    certificate: {
      subject: Record<string, string>;
      issuer: Record<string, string>;
      fingerprint: string;
      serial: string;
      expired: boolean;
    };
    cipher: {
      version: string;
      name: string;
      bits: number;
    };
  };
}

/**
 * Vulnerability information
 */
export interface Vulnerability {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  description: string;
  references: string[];
}
