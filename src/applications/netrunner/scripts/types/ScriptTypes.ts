/**
 * NetRunner Scripts Engine - Core Types & Interfaces
 * 
 * Comprehensive type definitions for the Scripts Engine including
 * execution contexts, error handling, and data transformation types.
 * 
 * @author GitHub Copilot
 * @date July 17, 2025
 */

import { OSINTData } from '../../services/WebsiteScanner';
import { IntelEntity } from '../../../../core/intel/types/intelDataModels';

// ===== TYPE ALIASES FOR BETTER READABILITY =====

// Use more specific types instead of 'any'
export type ScriptDataValue = string | number | boolean | object | Array<unknown> | null;
export type ConfigurationValue = string | number | boolean | Array<ScriptDataValue> | Record<string, ScriptDataValue>;
export type ProcessedDataValue = Record<string, unknown> | Array<unknown> | string | number | boolean;

// ===== SCRIPT EXECUTION TYPES =====

export interface ScriptExecutionContext {
  language: 'typescript' | 'javascript';
  environment: 'browser';
  runtime: 'webworker' | 'main-thread';
  sandbox: SecuritySandbox;
  timeout: number;
  memoryLimit: number;
  cpuLimit: number;
  metadata: ScriptMetadata;
}

export interface SecuritySandbox {
  enableCSP: boolean;
  allowedDomains: string[];
  disallowedFeatures: string[];
  maxExecutionTime: number;
  maxMemoryUsage: number;
}

export interface ScriptMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: ScriptCategory;
  tags: string[];
  dependencies: string[];
  created: Date;
  updated: Date;
}

export type ScriptCategory = 
  | 'email-extraction'
  | 'domain-analysis' 
  | 'technology-detection'
  | 'contact-harvesting'
  | 'vulnerability-scanning'
  | 'social-media-analysis'
  | 'custom';

// ===== SCRIPT DEFINITION TYPES =====

export interface ScriptDefinition {
  metadata: ScriptMetadata;
  configuration: ScriptConfiguration;
  execute: ScriptExecutionFunction;
  validate?: ScriptValidationFunction;
  cleanup?: ScriptCleanupFunction;
}

export interface ScriptConfiguration {
  inputTypes: ScriptInputType[];
  outputTypes: ScriptOutputType[];
  parameters: ScriptParameter[];
  defaults: Record<string, ConfigurationValue>;
  required: string[];
}

export type ScriptInputType = 
  | 'raw-osint-data'
  | 'website-scan-results'
  | 'domain-data'
  | 'network-data'
  | 'social-media-data'
  | 'file-data';

export type ScriptOutputType = 
  | 'structured-intel'
  | 'enriched-data'
  | 'analysis-report'
  | 'threat-indicators'
  | 'contact-information'
  | 'technical-details';

export interface ScriptParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: ConfigurationValue;
  validation?: string; // Regex or validation rule
}

// ===== SCRIPT EXECUTION FUNCTIONS =====

export type ScriptExecutionFunction = (
  input: ScriptInput,
  config: Record<string, ConfigurationValue>,
  context: ScriptExecutionContext
) => Promise<ScriptResult>;

export type ScriptValidationFunction = (
  input: ScriptInput,
  config: Record<string, ConfigurationValue>
) => Promise<ValidationResult>;

export type ScriptCleanupFunction = (
  context: ScriptExecutionContext
) => Promise<void>;

// ===== SCRIPT INPUT/OUTPUT TYPES =====

export interface ScriptInput {
  data: OSINTData | ProcessedDataValue;
  source: string;
  timestamp: Date;
  metadata: {
    scanId: string;
    targetUrl: string;
    scanType: string;
    confidence: number;
  };
}

export interface ScriptResult {
  success: boolean;
  data?: ProcessedIntelligenceData;
  error?: ScriptError;
  metrics: ExecutionMetrics;
  metadata: ResultMetadata;
}

export interface ProcessedIntelligenceData {
  type: ScriptOutputType;
  category: string;
  confidence: number;
  data: ProcessedDataValue;
  relationships: DataRelationship[];
  enrichments: DataEnrichment[];
  validations: ValidationResult[];
}

export interface DataRelationship {
  type: 'parent' | 'child' | 'sibling' | 'reference';
  target: string;
  confidence: number;
  description: string;
}

export interface DataEnrichment {
  type: string;
  source: string;
  data: ProcessedDataValue;
  confidence: number;
  timestamp: Date;
}

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'warning' | 'error' | 'info';
  field: string;
  message: string;
  severity: number;
}

// ===== EXECUTION METRICS & METADATA =====

export interface ExecutionMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ResultMetadata {
  scriptId: string;
  scriptVersion: string;
  executionId: string;
  sourceData: string;
  processingSteps: ProcessingStep[];
  qualityScore: number;
  flags: string[];
}

export interface ProcessingStep {
  step: string;
  duration: number;
  success: boolean;
  details: string;
}

// ===== ERROR HANDLING TYPES =====

export enum ScriptErrorType {
  // Execution Errors (25 types)
  SCRIPT_PARSE_ERROR = 'SPE001',
  SCRIPT_RUNTIME_ERROR = 'SRE002',
  SCRIPT_TIMEOUT_ERROR = 'STE003',
  SCRIPT_MEMORY_ERROR = 'SME004',
  SCRIPT_SECURITY_ERROR = 'SSE005',
  SCRIPT_VALIDATION_ERROR = 'SVE006',
  SCRIPT_DEPENDENCY_ERROR = 'SDE007',
  SCRIPT_INITIALIZATION_ERROR = 'SIE008',
  SCRIPT_CLEANUP_ERROR = 'SCE009',
  SCRIPT_CONFIGURATION_ERROR = 'SCFE010',
  SCRIPT_PERMISSION_ERROR = 'SPE011',
  SCRIPT_RESOURCE_ERROR = 'SRE012',
  SCRIPT_NETWORK_ERROR = 'SNE013',
  SCRIPT_STORAGE_ERROR = 'SSE014',
  SCRIPT_FORMAT_ERROR = 'SFE015',
  SCRIPT_VERSION_ERROR = 'SVE016',
  SCRIPT_COMPATIBILITY_ERROR = 'SCE017',
  SCRIPT_ISOLATION_ERROR = 'SIE018',
  SCRIPT_THREAD_ERROR = 'STE019',
  SCRIPT_COMMUNICATION_ERROR = 'SCE020',
  SCRIPT_ABORT_ERROR = 'SAE021',
  SCRIPT_CRASH_ERROR = 'SCE022',
  SCRIPT_DEADLOCK_ERROR = 'SDE023',
  SCRIPT_CORRUPTION_ERROR = 'SCE024',
  SCRIPT_UNKNOWN_ERROR = 'SUE025',

  // Data Processing Errors (25 types)
  DATA_VALIDATION_ERROR = 'DVE026',
  DATA_TRANSFORMATION_ERROR = 'DTE027',
  DATA_EXTRACTION_ERROR = 'DEE028',
  DATA_CORRELATION_ERROR = 'DCE029',
  DATA_ENRICHMENT_ERROR = 'DEE030',
  DATA_FORMAT_ERROR = 'DFE031',
  DATA_STRUCTURE_ERROR = 'DSE032',
  DATA_TYPE_ERROR = 'DTE033',
  DATA_ENCODING_ERROR = 'DEE034',
  DATA_PARSING_ERROR = 'DPE035',
  DATA_SANITIZATION_ERROR = 'DSE036',
  DATA_NORMALIZATION_ERROR = 'DNE037',
  DATA_AGGREGATION_ERROR = 'DAE038',
  DATA_FILTERING_ERROR = 'DFE039',
  DATA_SORTING_ERROR = 'DSE040',
  DATA_MERGING_ERROR = 'DME041',
  DATA_DUPLICATE_ERROR = 'DDE042',
  DATA_MISSING_ERROR = 'DME043',
  DATA_OVERFLOW_ERROR = 'DOE044',
  DATA_UNDERFLOW_ERROR = 'DUE045',
  DATA_PRECISION_ERROR = 'DPE046',
  DATA_CONSISTENCY_ERROR = 'DCE047',
  DATA_INTEGRITY_ERROR = 'DIE048',
  DATA_QUALITY_ERROR = 'DQE049',
  DATA_UNKNOWN_ERROR = 'DUE050',

  // Integration Errors (25 types)
  WEBSITESCANNER_INTEGRATION_ERROR = 'WIE051',
  INTELANALYZER_INTEGRATION_ERROR = 'IIE052',
  STORAGE_INTEGRATION_ERROR = 'SIE053',
  UI_INTEGRATION_ERROR = 'UIE054',
  PIPELINE_INTEGRATION_ERROR = 'PIE055',
  API_INTEGRATION_ERROR = 'AIE056',
  DATABASE_INTEGRATION_ERROR = 'DIE057',
  CACHE_INTEGRATION_ERROR = 'CIE058',
  WORKFLOW_INTEGRATION_ERROR = 'WIE059',
  EVENT_INTEGRATION_ERROR = 'EIE060',
  NOTIFICATION_INTEGRATION_ERROR = 'NIE061',
  LOGGING_INTEGRATION_ERROR = 'LIE062',
  MONITORING_INTEGRATION_ERROR = 'MIE063',
  AUTHENTICATION_INTEGRATION_ERROR = 'AIE064',
  AUTHORIZATION_INTEGRATION_ERROR = 'AIE065',
  CONFIGURATION_INTEGRATION_ERROR = 'CIE066',
  SERVICE_INTEGRATION_ERROR = 'SIE067',
  COMPONENT_INTEGRATION_ERROR = 'CIE068',
  MODULE_INTEGRATION_ERROR = 'MIE069',
  DEPENDENCY_INTEGRATION_ERROR = 'DIE070',
  VERSION_INTEGRATION_ERROR = 'VIE071',
  COMPATIBILITY_INTEGRATION_ERROR = 'CIE072',
  COMMUNICATION_INTEGRATION_ERROR = 'CIE073',
  SYNCHRONIZATION_INTEGRATION_ERROR = 'SIE074',
  INTEGRATION_UNKNOWN_ERROR = 'IUE075',

  // Network/API Errors (25 types)
  NETWORK_TIMEOUT_ERROR = 'NTE076',
  API_RATE_LIMIT_ERROR = 'ARE077',
  CORS_PROXY_ERROR = 'CPE078',
  DNS_RESOLUTION_ERROR = 'DRE079',
  SSL_CERTIFICATE_ERROR = 'SCE080',
  HTTP_STATUS_ERROR = 'HSE081',
  CONNECTION_ERROR = 'CE082',
  PROXY_ERROR = 'PE083',
  FIREWALL_ERROR = 'FE084',
  BANDWIDTH_ERROR = 'BE085',
  LATENCY_ERROR = 'LE086',
  PACKET_LOSS_ERROR = 'PLE087',
  REDIRECT_ERROR = 'RE088',
  AUTHENTICATION_ERROR = 'AE089',
  AUTHORIZATION_ERROR = 'AE090',
  QUOTA_EXCEEDED_ERROR = 'QEE091',
  SERVICE_UNAVAILABLE_ERROR = 'SUE092',
  MAINTENANCE_ERROR = 'ME093',
  DEPRECATION_ERROR = 'DE094',
  VERSION_MISMATCH_ERROR = 'VME095',
  PROTOCOL_ERROR = 'PE096',
  ENCODING_ERROR = 'EE097',
  COMPRESSION_ERROR = 'CE098',
  ENCRYPTION_ERROR = 'EE099',
  NETWORK_UNKNOWN_ERROR = 'NUE100'
}

export interface ScriptError {
  type: ScriptErrorType;
  code: string;
  message: string;
  details: string;
  stack?: string;
  context: ErrorContext;
  timestamp: Date;
  recoverable: boolean;
  suggestions: string[];
}

export interface ErrorContext {
  scriptId: string;
  executionId: string;
  step: string;
  inputData?: ProcessedDataValue;
  configuration?: Record<string, ConfigurationValue>;
  environment: string;
  userAgent: string;
}

// ===== SCRIPT REGISTRY TYPES =====

export interface ScriptRegistry {
  scripts: Map<string, ScriptDefinition>;
  categories: Map<ScriptCategory, string[]>;
  dependencies: Map<string, string[]>;
  metadata: RegistryMetadata;
}

export interface RegistryMetadata {
  version: string;
  lastUpdated: Date;
  totalScripts: number;
  activeScripts: number;
  statistics: RegistryStatistics;
}

export interface RegistryStatistics {
  executionCount: Record<string, number>;
  successRate: Record<string, number>;
  averageExecutionTime: Record<string, number>;
  errorRates: Record<string, number>;
  popularityScore: Record<string, number>;
}

// ===== PERFORMANCE MONITORING TYPES =====

export interface PerformanceMetrics {
  executionTime: TimingMetric;
  memoryUsage: MemoryMetric;
  cpuUsage: CpuMetric;
  networkActivity: NetworkMetric;
  cachePerformance: CacheMetric;
  errorRates: ErrorMetric;
}

export interface TimingMetric {
  min: number;
  max: number;
  average: number;
  median: number;
  p95: number;
  p99: number;
  samples: number;
}

export interface MemoryMetric {
  peak: number;
  average: number;
  allocated: number;
  freed: number;
  leaks: number;
}

export interface CpuMetric {
  utilizationPercent: number;
  cycles: number;
  instructions: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface NetworkMetric {
  requests: number;
  bytesTransferred: number;
  averageLatency: number;
  errorRate: number;
  timeouts: number;
}

export interface CacheMetric {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  size: number;
}

export interface ErrorMetric {
  total: number;
  byType: Record<ScriptErrorType, number>;
  recoveryRate: number;
  averageRecoveryTime: number;
}

// ===== SCRIPT PIPELINE TYPES =====

export interface ScriptPipeline {
  input: OSINTData;
  processing: ScriptResult[];
  output: IntelEntity;
  display: CategorizedResults;
  metadata: PipelineMetadata;
}

export interface CategorizedResults {
  categories: ResultCategory[];
  totalResults: number;
  processingTime: number;
  qualityScore: number;
  flags: string[];
}

export interface ResultCategory {
  name: string;
  type: ScriptOutputType;
  count: number;
  results: ProcessedResult[];
  confidence: number;
  metadata: CategoryMetadata;
}

export interface ProcessedResult {
  id: string;
  data: ProcessedDataValue;
  confidence: number;
  source: string;
  relationships: DataRelationship[];
  validations: ValidationResult[];
  flags: string[];
  timestamp: Date;
}

export interface CategoryMetadata {
  description: string;
  processingScript: string;
  qualityMetrics: QualityMetrics;
  lastUpdated: Date;
}

export interface QualityMetrics {
  accuracy: number;
  completeness: number;
  consistency: number;
  timeliness: number;
  relevance: number;
  overall: number;
}

export interface PipelineMetadata {
  id: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  scriptsExecuted: string[];
  successRate: number;
  errorCount: number;
  warningCount: number;
}

// ===== STORAGE & CACHING TYPES =====

export interface ScriptStorageConfig {
  enablePersistence: boolean;
  cacheStrategy: CacheStrategy;
  retentionPolicy: RetentionPolicy;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export type CacheStrategy = 
  | 'memory-only'
  | 'memory-first'
  | 'indexeddb-first'
  | 'localstorage-first'
  | 'hybrid';

export interface RetentionPolicy {
  maxAge: number; // milliseconds
  maxSize: number; // bytes
  maxEntries: number;
  cleanupInterval: number; // milliseconds
  priorityWeights: {
    frequency: number;
    recency: number;
    size: number;
    importance: number;
  };
}

// ===== EVENT SYSTEM TYPES =====

export interface ScriptEvent {
  type: ScriptEventType;
  scriptId: string;
  executionId: string;
  timestamp: Date;
  data: ProcessedDataValue;
  metadata: EventMetadata;
}

export type ScriptEventType = 
  | 'script-registered'
  | 'script-unregistered'
  | 'execution-started'
  | 'execution-completed'
  | 'execution-failed'
  | 'execution-timeout'
  | 'data-processed'
  | 'error-occurred'
  | 'warning-issued'
  | 'cache-hit'
  | 'cache-miss'
  | 'performance-degraded'
  | 'resource-exhausted';

export interface EventMetadata {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  tags: string[];
  correlationId: string;
  source: string;
}

// ===== DEFAULT SCRIPT CONFIGURATIONS =====

export const DEFAULT_SCRIPT_CONFIGS = {
  EMAIL_EXTRACTOR: {
    timeout: 10000,
    memoryLimit: 50 * 1024 * 1024, // 50MB
    cpuLimit: 30, // 30% CPU
    validationEnabled: true,
    deduplicationEnabled: true,
    confidenceThreshold: 0.8
  },
  DOMAIN_PARSER: {
    timeout: 15000,
    memoryLimit: 75 * 1024 * 1024, // 75MB
    cpuLimit: 40, // 40% CPU
    maxDepth: 5,
    includeSubdomains: true,
    validateDNS: true
  },
  TECH_STACK_ANALYZER: {
    timeout: 20000,
    memoryLimit: 100 * 1024 * 1024, // 100MB
    cpuLimit: 50, // 50% CPU
    detectionDepth: 'comprehensive',
    includeVersions: true,
    includeFrameworks: true
  },
  CONTACT_HARVESTER: {
    timeout: 12000,
    memoryLimit: 60 * 1024 * 1024, // 60MB
    cpuLimit: 35, // 35% CPU
    socialMediaEnabled: true,
    phoneValidation: true,
    geocodingEnabled: false
  }
} as const;

export type DefaultScriptType = keyof typeof DEFAULT_SCRIPT_CONFIGS;
