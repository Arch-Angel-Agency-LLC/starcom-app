/**
 * Comprehensive Error Types for NetRunner Intel Architecture Integration
 * Covers Phase 1 (Core Integration) and Phase 2 (NetRunner Integration & Enhanced Visualization)
 * 
 * Total Error Types: 100+
 * Categories:
 * - Core Integration Errors (Phase 1)
 * - NetRunner Collection Errors (Phase 2A)
 * - Enhanced Visualization Errors (Phase 2B)
 * - Bridge Adapter Errors
 * - Storage & Persistence Errors
 * - Real-time Processing Errors
 * - Validation & Quality Errors
 */

// ============================================================================
// Base Error Classes
// ============================================================================

export class NetRunnerIntelError extends Error {
  constructor(
    message: string,
    public code: string,
    public category: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'NetRunnerIntelError';
  }
}

export class IntelProcessingError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'INTEL_PROCESSING', 'high', context);
    this.name = 'IntelProcessingError';
  }
}

export class VisualizationError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'VISUALIZATION', 'medium', context);
    this.name = 'VisualizationError';
  }
}

export class BridgeAdapterError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'BRIDGE_ADAPTER', 'high', context);
    this.name = 'BridgeAdapterError';
  }
}

// ============================================================================
// PHASE 1: CORE INTEGRATION ERRORS
// ============================================================================

// Intel Bridge Adapter Errors
export class BridgeAdapterInitializationError extends BridgeAdapterError {
  constructor(reason: string, context?: Record<string, any>) {
    super(`Failed to initialize Intel Bridge Adapter: ${reason}`, 'BRIDGE_INIT_FAILED', context);
    this.name = 'BridgeAdapterInitializationError';
  }
}

export class IntelToEntityTransformationError extends BridgeAdapterError {
  constructor(intelId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to transform Intel to Entity for ID ${intelId}: ${reason}`, 'INTEL_TO_ENTITY_TRANSFORM_FAILED', context);
    this.name = 'IntelToEntityTransformationError';
  }
}

export class EntityToIntelTransformationError extends BridgeAdapterError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to transform Entity to Intel for ID ${entityId}: ${reason}`, 'ENTITY_TO_INTEL_TRANSFORM_FAILED', context);
    this.name = 'EntityToIntelTransformationError';
  }
}

export class LineageTrackingError extends BridgeAdapterError {
  constructor(sourceId: string, targetId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to track lineage from ${sourceId} to ${targetId}: ${reason}`, 'LINEAGE_TRACKING_FAILED', context);
    this.name = 'LineageTrackingError';
  }
}

export class ConfidenceScorePropagationError extends BridgeAdapterError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to propagate confidence score for entity ${entityId}: ${reason}`, 'CONFIDENCE_PROPAGATION_FAILED', context);
  }
}

export class ReliabilityAssessmentError extends BridgeAdapterError {
  constructor(dataSource: string, reason: string, context?: Record<string, any>) {
    super(`Failed to assess reliability for source ${dataSource}: ${reason}`, 'RELIABILITY_ASSESSMENT_FAILED', context);
  }
}

export class MetadataMappingError extends BridgeAdapterError {
  constructor(fieldName: string, reason: string, context?: Record<string, any>) {
    super(`Failed to map metadata field ${fieldName}: ${reason}`, 'METADATA_MAPPING_FAILED', context);
  }
}

export class ClassificationMappingError extends BridgeAdapterError {
  constructor(classification: string, reason: string, context?: Record<string, any>) {
    super(`Failed to map classification ${classification}: ${reason}`, 'CLASSIFICATION_MAPPING_FAILED', context);
  }
}

export class ProcessingStageTrackingError extends BridgeAdapterError {
  constructor(stage: string, entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to track processing stage ${stage} for entity ${entityId}: ${reason}`, 'STAGE_TRACKING_FAILED', context);
  }
}

export class BridgeValidationError extends BridgeAdapterError {
  constructor(validationType: string, reason: string, context?: Record<string, any>) {
    super(`Bridge validation failed for ${validationType}: ${reason}`, 'BRIDGE_VALIDATION_FAILED', context);
  }
}

// Storage Integration Errors
export class StorageOrchestratorError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'STORAGE', 'high', context);
    this.name = 'StorageOrchestratorError';
  }
}

export class IntelStorageError extends StorageOrchestratorError {
  constructor(intelId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to store Intel object ${intelId}: ${reason}`, 'INTEL_STORAGE_FAILED', context);
  }
}

export class IntelligenceStorageError extends StorageOrchestratorError {
  constructor(intelligenceId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to store Intelligence object ${intelligenceId}: ${reason}`, 'INTELLIGENCE_STORAGE_FAILED', context);
  }
}

export class BatchStorageError extends StorageOrchestratorError {
  constructor(batchSize: number, reason: string, context?: Record<string, any>) {
    super(`Failed to store batch of ${batchSize} items: ${reason}`, 'BATCH_STORAGE_FAILED', context);
  }
}

export class LineageQueryError extends StorageOrchestratorError {
  constructor(targetId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to query lineage for ${targetId}: ${reason}`, 'LINEAGE_QUERY_FAILED', context);
  }
}

export class ProcessingHistoryError extends StorageOrchestratorError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to retrieve processing history for ${entityId}: ${reason}`, 'PROCESSING_HISTORY_FAILED', context);
  }
}

export class StorageConsistencyError extends StorageOrchestratorError {
  constructor(dataType: string, reason: string, context?: Record<string, any>) {
    super(`Storage consistency check failed for ${dataType}: ${reason}`, 'STORAGE_CONSISTENCY_FAILED', context);
  }
}

export class DataMigrationError extends StorageOrchestratorError {
  constructor(migrationStep: string, reason: string, context?: Record<string, any>) {
    super(`Data migration failed at step ${migrationStep}: ${reason}`, 'DATA_MIGRATION_FAILED', context);
  }
}

// ============================================================================
// PHASE 2A: NETRUNNER COLLECTION ERRORS
// ============================================================================

// Enhanced Website Scanner Errors
export class WebsiteScannerError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'WEBSITE_SCANNER', 'medium', context);
    this.name = 'WebsiteScannerError';
  }
}

export class ScanInitializationError extends WebsiteScannerError {
  constructor(url: string, reason: string, context?: Record<string, any>) {
    super(`Failed to initialize scan for ${url}: ${reason}`, 'SCAN_INIT_FAILED', context);
    this.name = 'ScanInitializationError';
  }
}

export class URLValidationError extends WebsiteScannerError {
  constructor(url: string, reason: string, context?: Record<string, any>) {
    super(`URL validation failed for ${url}: ${reason}`, 'URL_VALIDATION_FAILED', context);
    this.name = 'URLValidationError';
  }
}

export class ProxyConnectionError extends WebsiteScannerError {
  constructor(proxyUrl: string, reason: string, context?: Record<string, any>) {
    super(`Failed to connect via proxy ${proxyUrl}: ${reason}`, 'PROXY_CONNECTION_FAILED', context);
    this.name = 'ProxyConnectionError';
  }
}

export class ContentRetrievalError extends WebsiteScannerError {
  constructor(url: string, statusCode: number, reason: string, context?: Record<string, any>) {
    super(`Failed to retrieve content from ${url} (${statusCode}): ${reason}`, 'CONTENT_RETRIEVAL_FAILED', context);
    this.name = 'ContentRetrievalError';
  }
}

export class HTMLParsingError extends WebsiteScannerError {
  constructor(url: string, reason: string, context?: Record<string, any>) {
    super(`Failed to parse HTML from ${url}: ${reason}`, 'HTML_PARSING_FAILED', context);
    this.name = 'HTMLParsingError';
  }
}

export class TechnologyDetectionError extends WebsiteScannerError {
  constructor(url: string, technology: string, reason: string, context?: Record<string, any>) {
    super(`Failed to detect technology ${technology} on ${url}: ${reason}`, 'TECH_DETECTION_FAILED', context);
    this.name = 'TechnologyDetectionError';
  }
}

export class EmailExtractionError extends WebsiteScannerError {
  constructor(url: string, reason: string, context?: Record<string, any>) {
    super(`Failed to extract emails from ${url}: ${reason}`, 'EMAIL_EXTRACTION_FAILED', context);
    this.name = 'EmailExtractionError';
  }
}

export class SocialMediaExtractionError extends WebsiteScannerError {
  constructor(url: string, platform: string, reason: string, context?: Record<string, any>) {
    super(`Failed to extract ${platform} links from ${url}: ${reason}`, 'SOCIAL_EXTRACTION_FAILED', context);
    this.name = 'SocialMediaExtractionError';
  }
}

export class SubdomainDiscoveryError extends WebsiteScannerError {
  constructor(domain: string, reason: string, context?: Record<string, any>) {
    super(`Failed to discover subdomains for ${domain}: ${reason}`, 'SUBDOMAIN_DISCOVERY_FAILED', context);
  }
}

export class ServerInfoExtractionError extends WebsiteScannerError {
  constructor(url: string, reason: string, context?: Record<string, any>) {
    super(`Failed to extract server info from ${url}: ${reason}`, 'SERVER_INFO_FAILED', context);
  }
}

export class HeaderAnalysisError extends WebsiteScannerError {
  constructor(url: string, headerName: string, reason: string, context?: Record<string, any>) {
    super(`Failed to analyze header ${headerName} from ${url}: ${reason}`, 'HEADER_ANALYSIS_FAILED', context);
  }
}

export class CertificateAnalysisError extends WebsiteScannerError {
  constructor(url: string, reason: string, context?: Record<string, any>) {
    super(`Failed to analyze SSL certificate for ${url}: ${reason}`, 'CERTIFICATE_ANALYSIS_FAILED', context);
  }
}

export class DNSLookupError extends WebsiteScannerError {
  constructor(domain: string, recordType: string, reason: string, context?: Record<string, any>) {
    super(`Failed DNS lookup for ${domain} (${recordType}): ${reason}`, 'DNS_LOOKUP_FAILED', context);
  }
}

export class VulnerabilityDetectionError extends WebsiteScannerError {
  constructor(url: string, vulnerabilityType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to detect ${vulnerabilityType} vulnerability on ${url}: ${reason}`, 'VULNERABILITY_DETECTION_FAILED', context);
  }
}

export class SecurityHeaderAnalysisError extends WebsiteScannerError {
  constructor(url: string, reason: string, context?: Record<string, any>) {
    super(`Failed to analyze security headers for ${url}: ${reason}`, 'SECURITY_HEADER_ANALYSIS_FAILED', context);
  }
}

// Intel Generation Errors
export class IntelGenerationError extends IntelProcessingError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, context);
    this.name = 'IntelGenerationError';
  }
}

export class EmailIntelGenerationError extends IntelGenerationError {
  constructor(email: string, reason: string, context?: Record<string, any>) {
    super(`Failed to generate Intel for email ${email}: ${reason}`, 'EMAIL_INTEL_FAILED', context);
    this.name = 'EmailIntelGenerationError';
  }
}

export class SocialIntelGenerationError extends IntelGenerationError {
  constructor(platform: string, handle: string, reason: string, context?: Record<string, any>) {
    super(`Failed to generate Intel for ${platform} handle ${handle}: ${reason}`, 'SOCIAL_INTEL_FAILED', context);
    this.name = 'SocialIntelGenerationError';
  }
}

export class TechnologyIntelGenerationError extends IntelGenerationError {
  constructor(technology: string, reason: string, context?: Record<string, any>) {
    super(`Failed to generate Intel for technology ${technology}: ${reason}`, 'TECH_INTEL_FAILED', context);
    this.name = 'TechnologyIntelGenerationError';
  }
}

export class SubdomainIntelGenerationError extends IntelGenerationError {
  constructor(subdomain: string, reason: string, context?: Record<string, any>) {
    super(`Failed to generate Intel for subdomain ${subdomain}: ${reason}`, 'SUBDOMAIN_INTEL_FAILED', context);
  }
}

export class ServerIntelGenerationError extends IntelGenerationError {
  constructor(serverInfo: string, reason: string, context?: Record<string, any>) {
    super(`Failed to generate Intel for server ${serverInfo}: ${reason}`, 'SERVER_INTEL_FAILED', context);
  }
}

// Quality Assessment Errors
export class QualityAssessmentError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'QUALITY_ASSESSMENT', 'medium', context);
    this.name = 'QualityAssessmentError';
  }
}

export class ReliabilityCalculationError extends QualityAssessmentError {
  constructor(dataType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to calculate reliability for ${dataType}: ${reason}`, 'RELIABILITY_CALC_FAILED', context);
    this.name = 'ReliabilityCalculationError';
  }
}

export class ConfidenceScoreError extends QualityAssessmentError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to calculate confidence score for ${entityId}: ${reason}`, 'CONFIDENCE_SCORE_FAILED', context);
    this.name = 'ConfidenceScoreError';
  }
}

export class QualityMetricsError extends QualityAssessmentError {
  constructor(metricType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to calculate quality metric ${metricType}: ${reason}`, 'QUALITY_METRICS_FAILED', context);
    this.name = 'QualityMetricsError';
  }
}

export class DataValidationError extends QualityAssessmentError {
  constructor(dataField: string, reason: string, context?: Record<string, any>) {
    super(`Data validation failed for field ${dataField}: ${reason}`, 'DATA_VALIDATION_FAILED', context);
    this.name = 'DataValidationError';
  }
}

export class CorrelationAnalysisError extends QualityAssessmentError {
  constructor(sourceId: string, targetId: string, reason: string, context?: Record<string, any>) {
    super(`Failed correlation analysis between ${sourceId} and ${targetId}: ${reason}`, 'CORRELATION_ANALYSIS_FAILED', context);
    this.name = 'CorrelationAnalysisError';
  }
}

// ============================================================================
// PHASE 2B: ENHANCED VISUALIZATION ERRORS
// ============================================================================

// Enhanced NodeWeb Adapter Errors
export class NodeWebAdapterError extends VisualizationError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, context);
    this.name = 'NodeWebAdapterError';
  }
}

export class GraphDataGenerationError extends NodeWebAdapterError {
  constructor(reason: string, context?: Record<string, any>) {
    super(`Failed to generate enhanced graph data: ${reason}`, 'GRAPH_DATA_GENERATION_FAILED', context);
  }
}

export class NodeTransformationError extends NodeWebAdapterError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to transform entity ${entityId} to enhanced node: ${reason}`, 'NODE_TRANSFORMATION_FAILED', context);
  }
}

export class ConfidenceVisualizationError extends NodeWebAdapterError {
  constructor(nodeId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to render confidence visualization for node ${nodeId}: ${reason}`, 'CONFIDENCE_VIZ_FAILED', context);
  }
}

export class RelationshipMappingError extends NodeWebAdapterError {
  constructor(sourceId: string, targetId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to map relationship between ${sourceId} and ${targetId}: ${reason}`, 'RELATIONSHIP_MAPPING_FAILED', context);
  }
}

export class QualityIndicatorError extends NodeWebAdapterError {
  constructor(nodeId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to render quality indicator for node ${nodeId}: ${reason}`, 'QUALITY_INDICATOR_FAILED', context);
  }
}

export class NodeFilteringError extends NodeWebAdapterError {
  constructor(filterType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to apply ${filterType} filter: ${reason}`, 'NODE_FILTERING_FAILED', context);
  }
}

export class GraphMetricsError extends NodeWebAdapterError {
  constructor(metricType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to calculate graph metric ${metricType}: ${reason}`, 'GRAPH_METRICS_FAILED', context);
  }
}

export class RelationshipCorrelationError extends NodeWebAdapterError {
  constructor(correlationType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to analyze ${correlationType} correlation: ${reason}`, 'RELATIONSHIP_CORRELATION_FAILED', context);
  }
}

export class NodeLayoutError extends NodeWebAdapterError {
  constructor(layoutAlgorithm: string, reason: string, context?: Record<string, any>) {
    super(`Failed to apply ${layoutAlgorithm} layout: ${reason}`, 'NODE_LAYOUT_FAILED', context);
  }
}

export class NodeClusteringError extends NodeWebAdapterError {
  constructor(clusteringMethod: string, reason: string, context?: Record<string, any>) {
    super(`Failed to apply ${clusteringMethod} clustering: ${reason}`, 'NODE_CLUSTERING_FAILED', context);
  }
}

// Enhanced Timeline Adapter Errors
export class TimelineAdapterError extends VisualizationError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, context);
    this.name = 'TimelineAdapterError';
  }
}

export class TimelineDataGenerationError extends TimelineAdapterError {
  constructor(reason: string, context?: Record<string, any>) {
    super(`Failed to generate intel timeline data: ${reason}`, 'TIMELINE_DATA_GENERATION_FAILED', context);
  }
}

export class CollectionTimelineError extends TimelineAdapterError {
  constructor(collectionId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to create collection timeline for ${collectionId}: ${reason}`, 'COLLECTION_TIMELINE_FAILED', context);
  }
}

export class ProcessingTimelineError extends TimelineAdapterError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to create processing timeline for ${entityId}: ${reason}`, 'PROCESSING_TIMELINE_FAILED', context);
  }
}

export class TemporalAnalysisError extends TimelineAdapterError {
  constructor(analysisType: string, reason: string, context?: Record<string, any>) {
    super(`Failed temporal analysis ${analysisType}: ${reason}`, 'TEMPORAL_ANALYSIS_FAILED', context);
  }
}

export class TimelineEventCreationError extends TimelineAdapterError {
  constructor(eventType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to create timeline event of type ${eventType}: ${reason}`, 'TIMELINE_EVENT_CREATION_FAILED', context);
  }
}

export class ConfidenceProgressionError extends TimelineAdapterError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to track confidence progression for ${entityId}: ${reason}`, 'CONFIDENCE_PROGRESSION_FAILED', context);
  }
}

export class ProcessingStageVisualizationError extends TimelineAdapterError {
  constructor(stage: string, reason: string, context?: Record<string, any>) {
    super(`Failed to visualize processing stage ${stage}: ${reason}`, 'STAGE_VISUALIZATION_FAILED', context);
  }
}

export class TimelineFilteringError extends TimelineAdapterError {
  constructor(filterType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to apply timeline filter ${filterType}: ${reason}`, 'TIMELINE_FILTERING_FAILED', context);
  }
}

export class TimelineMetricsError extends TimelineAdapterError {
  constructor(metricType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to calculate timeline metric ${metricType}: ${reason}`, 'TIMELINE_METRICS_FAILED', context);
  }
}

export class EntityProcessingTimelineError extends TimelineAdapterError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to generate entity processing timeline for ${entityId}: ${reason}`, 'ENTITY_PROCESSING_TIMELINE_FAILED', context);
  }
}

// Real-time Update Errors
export class RealTimeUpdateError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'REALTIME_UPDATE', 'medium', context);
    this.name = 'RealTimeUpdateError';
  }
}

export class WebSocketConnectionError extends RealTimeUpdateError {
  constructor(endpoint: string, reason: string, context?: Record<string, any>) {
    super(`Failed to connect to WebSocket ${endpoint}: ${reason}`, 'WEBSOCKET_CONNECTION_FAILED', context);
  }
}

export class DataStreamError extends RealTimeUpdateError {
  constructor(streamType: string, reason: string, context?: Record<string, any>) {
    super(`Data stream error for ${streamType}: ${reason}`, 'DATA_STREAM_ERROR', context);
  }
}

export class EventBroadcastError extends RealTimeUpdateError {
  constructor(eventType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to broadcast event ${eventType}: ${reason}`, 'EVENT_BROADCAST_FAILED', context);
  }
}

export class SubscriptionError extends RealTimeUpdateError {
  constructor(subscriptionType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to manage subscription ${subscriptionType}: ${reason}`, 'SUBSCRIPTION_ERROR', context);
  }
}

export class LiveDataSyncError extends RealTimeUpdateError {
  constructor(dataType: string, reason: string, context?: Record<string, any>) {
    super(`Failed to sync live data for ${dataType}: ${reason}`, 'LIVE_DATA_SYNC_FAILED', context);
  }
}

// ============================================================================
// INTEGRATION & WORKFLOW ERRORS
// ============================================================================

// NetRunner Intelligence Bridge Errors
export class IntelligenceBridgeError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'INTELLIGENCE_BRIDGE', 'high', context);
    this.name = 'IntelligenceBridgeError';
  }
}

export class BridgeInitializationError extends IntelligenceBridgeError {
  constructor(componentName: string, reason: string, context?: Record<string, any>) {
    super(`Failed to initialize bridge component ${componentName}: ${reason}`, 'BRIDGE_INIT_ERROR', context);
  }
}

export class DataFlowError extends IntelligenceBridgeError {
  constructor(fromComponent: string, toComponent: string, reason: string, context?: Record<string, any>) {
    super(`Data flow error from ${fromComponent} to ${toComponent}: ${reason}`, 'DATA_FLOW_ERROR', context);
  }
}

export class ComponentIntegrationError extends IntelligenceBridgeError {
  constructor(componentA: string, componentB: string, reason: string, context?: Record<string, any>) {
    super(`Integration error between ${componentA} and ${componentB}: ${reason}`, 'COMPONENT_INTEGRATION_ERROR', context);
  }
}

// Enhanced RightSideBar Errors
export class RightSideBarError extends VisualizationError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, context);
    this.name = 'RightSideBarError';
  }
}

export class EntityDisplayError extends RightSideBarError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to display entity ${entityId}: ${reason}`, 'ENTITY_DISPLAY_ERROR', context);
  }
}

export class ConfidenceDisplayError extends RightSideBarError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to display confidence for entity ${entityId}: ${reason}`, 'CONFIDENCE_DISPLAY_ERROR', context);
  }
}

export class LineageDisplayError extends RightSideBarError {
  constructor(entityId: string, reason: string, context?: Record<string, any>) {
    super(`Failed to display lineage for entity ${entityId}: ${reason}`, 'LINEAGE_DISPLAY_ERROR', context);
  }
}

// Performance & Optimization Errors
export class PerformanceError extends NetRunnerIntelError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'PERFORMANCE', 'medium', context);
    this.name = 'PerformanceError';
  }
}

export class ProcessingTimeoutError extends PerformanceError {
  constructor(operationType: string, timeoutMs: number, context?: Record<string, any>) {
    super(`Processing timeout for ${operationType} after ${timeoutMs}ms`, 'PROCESSING_TIMEOUT', context);
  }
}

export class MemoryLimitError extends PerformanceError {
  constructor(operationType: string, memoryUsage: number, context?: Record<string, any>) {
    super(`Memory limit exceeded for ${operationType}: ${memoryUsage}MB`, 'MEMORY_LIMIT_EXCEEDED', context);
  }
}

export class ConcurrencyLimitError extends PerformanceError {
  constructor(operationType: string, activeOperations: number, context?: Record<string, any>) {
    super(`Concurrency limit exceeded for ${operationType}: ${activeOperations} active`, 'CONCURRENCY_LIMIT_EXCEEDED', context);
  }
}

export class ResourceExhaustionError extends PerformanceError {
  constructor(resourceType: string, reason: string, context?: Record<string, any>) {
    super(`Resource exhaustion for ${resourceType}: ${reason}`, 'RESOURCE_EXHAUSTION', context);
  }
}

// ============================================================================
// ERROR HELPER FUNCTIONS
// ============================================================================

export class NetRunnerErrorHandler {
  static createError(
    type: string, 
    message: string, 
    context?: Record<string, any>
  ): NetRunnerIntelError {
    const errorConstructors: Record<string, any> = {
      'BRIDGE_INIT_FAILED': BridgeAdapterInitializationError,
      'INTEL_TO_ENTITY_FAILED': IntelToEntityTransformationError,
      'ENTITY_TO_INTEL_FAILED': EntityToIntelTransformationError,
      'SCAN_INIT_FAILED': ScanInitializationError,
      'URL_VALIDATION_FAILED': URLValidationError,
      'CONTENT_RETRIEVAL_FAILED': ContentRetrievalError,
      'INTEL_GENERATION_FAILED': IntelGenerationError,
      'GRAPH_DATA_GENERATION_FAILED': GraphDataGenerationError,
      'TIMELINE_DATA_GENERATION_FAILED': TimelineDataGenerationError,
      'WEBSOCKET_CONNECTION_FAILED': WebSocketConnectionError,
      'PROCESSING_TIMEOUT': ProcessingTimeoutError
    };

    const ErrorConstructor = errorConstructors[type] || NetRunnerIntelError;
    return new ErrorConstructor(message, type, context);
  }

  static handleError(error: NetRunnerIntelError): void {
    console.error(`[${error.category}] ${error.code}: ${error.message}`, error.context);
    
    // Severity-based handling
    switch (error.severity) {
      case 'critical':
        // Alert monitoring systems, stop processing
        break;
      case 'high':
        // Log to error tracking, retry with backoff
        break;
      case 'medium':
        // Log warning, continue with degraded functionality
        break;
      case 'low':
        // Log info, continue normally
        break;
    }
  }

  static isRetryableError(error: NetRunnerIntelError): boolean {
    const retryableCodes = [
      'PROXY_CONNECTION_FAILED',
      'CONTENT_RETRIEVAL_FAILED',
      'WEBSOCKET_CONNECTION_FAILED',
      'DATA_STREAM_ERROR',
      'PROCESSING_TIMEOUT',
      'RESOURCE_EXHAUSTION'
    ];
    return retryableCodes.includes(error.code);
  }

  static getErrorContext(error: NetRunnerIntelError): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      category: error.category,
      code: error.code,
      severity: error.severity,
      context: error.context || {},
      stack: error.stack
    };
  }
}

// ============================================================================
// ERROR REPORTING & ANALYTICS
// ============================================================================

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByCode: Record<string, number>;
  retryableErrors: number;
  criticalErrors: number;
  averageResolutionTime: number;
}

export class NetRunnerErrorAnalytics {
  private errors: NetRunnerIntelError[] = [];

  addError(error: NetRunnerIntelError): void {
    this.errors.push(error);
  }

  getMetrics(): ErrorMetrics {
    const metrics: ErrorMetrics = {
      totalErrors: this.errors.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      errorsByCode: {},
      retryableErrors: 0,
      criticalErrors: 0,
      averageResolutionTime: 0
    };

    this.errors.forEach(error => {
      // Count by category
      metrics.errorsByCategory[error.category] = 
        (metrics.errorsByCategory[error.category] || 0) + 1;

      // Count by severity
      metrics.errorsBySeverity[error.severity] = 
        (metrics.errorsBySeverity[error.severity] || 0) + 1;

      // Count by code
      metrics.errorsByCode[error.code] = 
        (metrics.errorsByCode[error.code] || 0) + 1;

      // Count retryable errors
      if (NetRunnerErrorHandler.isRetryableError(error)) {
        metrics.retryableErrors++;
      }

      // Count critical errors
      if (error.severity === 'critical') {
        metrics.criticalErrors++;
      }
    });

    return metrics;
  }

  getMostCommonErrors(limit: number = 10): Array<{ code: string; count: number; percentage: number }> {
    const metrics = this.getMetrics();
    return Object.entries(metrics.errorsByCode)
      .map(([code, count]) => ({
        code,
        count,
        percentage: (count / metrics.totalErrors) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getCriticalErrorPatterns(): Array<{ pattern: string; occurrences: number; impact: string }> {
    const criticalErrors = this.errors.filter(e => e.severity === 'critical');
    const patterns: Record<string, number> = {};

    criticalErrors.forEach(error => {
      const pattern = `${error.category}:${error.code}`;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    return Object.entries(patterns)
      .map(([pattern, count]) => ({
        pattern,
        occurrences: count,
        impact: count > 5 ? 'HIGH' : count > 2 ? 'MEDIUM' : 'LOW'
      }))
      .sort((a, b) => b.occurrences - a.occurrences);
  }
}

// Export all error types for use throughout the application
export const NetRunnerErrorTypes = {
  // Core Integration
  BridgeAdapterInitializationError,
  IntelToEntityTransformationError,
  EntityToIntelTransformationError,
  LineageTrackingError,
  ConfidenceScorePropagationError,
  IntelStorageError,
  IntelligenceStorageError,
  
  // NetRunner Collection
  ScanInitializationError,
  URLValidationError,
  ProxyConnectionError,
  ContentRetrievalError,
  EmailExtractionError,
  TechnologyDetectionError,
  IntelGenerationError,
  
  // Enhanced Visualization
  GraphDataGenerationError,
  NodeTransformationError,
  ConfidenceVisualizationError,
  TimelineDataGenerationError,
  ProcessingTimelineError,
  
  // Real-time & Performance
  WebSocketConnectionError,
  ProcessingTimeoutError,
  MemoryLimitError,
  ConcurrencyLimitError
};
