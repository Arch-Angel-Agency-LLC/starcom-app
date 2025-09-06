// Core Intel Data Interface
// Bridge between raw Intel and processed data layer
// Provides clean data abstraction layer for the Intel architecture
// NOTE: This is the intermediate layer in the hierarchy: Intel → IntelData → IntelReport

import { Intel } from './Intel';
// NOTE: Removed IntelReport import to break circular dependency
// IntelReport will import IntelData, not the reverse
import { IntelMetadata } from './IntelReportMetaData';
import type { IntelClassification } from './IntelEnums';
import { PrimaryIntelSource } from './Sources';
import { IntelCategory, IntelPriority, IntelThreatLevel } from './IntelEnums';

// =============================================================================
// CORE INTEL DATA INTERFACE
// =============================================================================

/**
 * Intel Data Interface
 * Core data interface for raw/processed/analyzed intel
 * Serves as bridge between Intel (raw) and higher-level report structures
 * NOTE: This interface does NOT reference IntelReport to maintain hierarchy
 */
export interface IntelData {
  // =============================================================================
  // CORE IDENTIFICATION
  // =============================================================================
  
  /** Unique identifier */
  id: string;
  
  /** Data type classification */
  type: 'raw' | 'processed' | 'analyzed' | 'fused';
  
  /** Data format version */
  version: string;
  
  // =============================================================================
  // RAW DATA PROPERTIES
  // =============================================================================
  
  /** Raw intel data (if type is 'raw') */
  rawIntel?: Intel;
  
  /** Collection of raw intel (for fusion) */
  rawIntelCollection?: Intel[];
  
  // =============================================================================
  // PROCESSED DATA PROPERTIES (without circular reference)
  // =============================================================================
  
  /** Processing status indicator */
  isProcessed: boolean;
  
  
  /** Processing metadata */
  processingMetadata?: {
    processedBy: string;
    processedAt: Date;
    processingMethod: string;
    qualityScore: number;
    completeness: number;
    timeliness: number;
  };
  
  // =============================================================================
  // CONTENT & LOCATION
  // =============================================================================
  
  /** Primary content */
  content: string;
  
  /** Content summary */
  summary?: string;
  
  /** Geographic coordinates */
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source?: string;
  };
  
  /** Location description */
  location?: string;
  
  // =============================================================================
  // PRIORITY & CATEGORY
  // =============================================================================
  
  /** Optional informational designation (declassified build) */
  classification?: IntelClassification;
  
  /** Intel category */
  category: IntelCategory;
  
  /** Priority level */
  priority: IntelPriority;
  
  /** Threat level assessment */
  threatLevel?: IntelThreatLevel;
  
  /** Confidence score (0-100) */
  confidence: number;
  
  // =============================================================================
  // SOURCE ATTRIBUTION
  // =============================================================================
  
  /** Primary intelligence sources */
  sources: PrimaryIntelSource[];
  
  /** Source reliability assessment */
  sourceReliability: {
    [source: string]: {
      reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
      confidence: number;
      track_record: number;
    };
  };
  
  /** Collection method */
  collectionMethod?: string;
  
  // =============================================================================
  // TEMPORAL PROPERTIES
  // =============================================================================
  
  /** Data collection timestamp */
  collectedAt: Date;
  
  /** Data processing timestamp */
  processedAt?: Date;
  
  /** Event timestamp (when the intel event occurred) */
  eventTimestamp?: Date;
  
  /** Data validity period */
  validityPeriod?: {
    start: Date;
    end: Date;
  };
  
  // =============================================================================
  // METADATA RELATIONSHIPS
  // =============================================================================
  
  /** Intel metadata reference */
  metadata: IntelMetadata;
  
  /** Related intel data IDs */
  relatedIntel?: string[];
  
  /** Parent/child relationships */
  relationships?: {
    parent?: string;
    children?: string[];
    siblings?: string[];
  };
  
  // =============================================================================
  // QUALITY METRICS
  // =============================================================================
  
  /** Data quality assessment */
  quality: {
    accuracy: number;      // 0-100
    completeness: number;  // 0-100
    timeliness: number;    // 0-100
    relevance: number;     // 0-100
    reliability: number;   // 0-100
  };
  
  /** Verification status */
  verification: {
    status: 'unverified' | 'pending' | 'verified' | 'disputed';
    verifiedBy?: string;
    verifiedAt?: Date;
    verificationMethod?: string;
  };
  
  // =============================================================================
  // PROCESSING FLAGS
  // =============================================================================
  
  /** Processing status */
  status: 'collected' | 'processing' | 'processed' | 'analyzed' | 'distributed' | 'archived';
  
  /** Processing flags */
  flags: {
    requiresHumanReview?: boolean;
    sensitiveContent?: boolean;
    urgentProcessing?: boolean;
    anomalyDetected?: boolean;
    correlationCandidate?: boolean;
  };
  
  // =============================================================================
  // TAGS & SEARCH
  // =============================================================================
  
  /** Searchable tags */
  tags: string[];
  
  /** Keywords for search */
  keywords?: string[];
  
  /** Search index data */
  searchIndex?: {
    fullText: string;
    entities: string[];
    concepts: string[];
  };
}

// =============================================================================
// INTEL DATA COLLECTION INTERFACE
// =============================================================================

/**
 * Intel Data Collection
 * Represents a collection of related IntelData for analysis
 */
export interface IntelDataCollection {
  /** Collection identifier */
  id: string;
  
  /** Collection name/title */
  name: string;
  
  /** Collection description */
  description?: string;
  
  /** Intel data items in this collection */
  items: IntelData[];
  
  /** Collection metadata */
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    purpose: string;
    analysisGoal?: string;
  };
  
  /** Collection statistics */
  statistics: {
    totalItems: number;
    rawIntelCount: number;
    processedReportCount: number;
    averageConfidence: number;
    dateRange: {
      earliest: Date;
      latest: Date;
    };
    geographicCoverage?: {
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      };
      centerpoint: {
        latitude: number;
        longitude: number;
      };
    };
  };
  
  /** Collection status */
  status: 'active' | 'analyzing' | 'complete' | 'archived';
}

// =============================================================================
// INTEL DATA TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Intel Data Transformer
 * Handles transformations between Intel, IntelData, and IntelReport
 */
export class IntelDataTransformer {
  /**
   * Transform raw Intel to IntelData
   */
  static fromIntel(intel: Intel): IntelData {
    return {
      id: intel.id,
      type: 'raw',
      version: '1.0.0',
      rawIntel: intel,
      isProcessed: false, // Raw intel starts as unprocessed
      content: typeof intel.data === 'string' ? intel.data : JSON.stringify(intel.data),
      summary: `Intel from ${intel.source}`, // Generate summary from available data
      coordinates: {
        latitude: intel.latitude || 0,
        longitude: intel.longitude || 0,
        accuracy: 100, // Default accuracy
        source: 'intel_source'
      },
      location: intel.location,
  // Classification removed in declassified build
  classification: undefined,
      category: 'GENERAL' as IntelCategory, // Default category - can be enhanced
      priority: 'ROUTINE' as IntelPriority, // Default priority - can be enhanced  
      confidence: 50, // Default confidence - intel doesn't have this field
      sources: [intel.source],
      sourceReliability: {
        [intel.source]: {
          reliability: intel.reliability as 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
          confidence: 50, // Default confidence
          track_record: 75 // Default track record
        }
      },
      collectionMethod: 'unknown', // Intel doesn't have this field
      collectedAt: new Date(intel.timestamp),
      eventTimestamp: undefined, // Intel doesn't have this field
      metadata: {
        source: intel.source,
        reliability: intel.reliability,
        timestamp: intel.timestamp,
        category: 'GENERAL',
        tags: intel.tags || [],
  // classification removed
      } as IntelMetadata,
      quality: {
        accuracy: 50, // Default - intel doesn't have confidence field
        completeness: 75, // Calculated based on available fields
        timeliness: this.calculateTimeliness(intel.timestamp),
        relevance: 75, // Default relevance
        reliability: this.mapReliabilityToScore(intel.reliability)
      },
      verification: {
        status: intel.verified ? 'verified' : 'unverified'
      },
      status: 'collected',
      flags: {
        requiresHumanReview: intel.reliability === 'F' || intel.reliability === 'X',
  sensitiveContent: false,
        urgentProcessing: false // Default - intel doesn't have priority
      },
      tags: intel.tags || []
    };
  }

  /**
   * Transform IntelData to structured report data
   * NOTE: This creates the data foundation for IntelReport creation
   * but does not directly create IntelReport to maintain hierarchy
   */
  static toReportData(intelData: IntelData) {
    return {
      id: intelData.id,
      title: `Intel Report: ${intelData.category}`,
      content: intelData.content,
      summary: intelData.summary,
      authorId: intelData.processingMetadata?.processedBy || 'System',
      created: intelData.processingMetadata?.processedAt || new Date(),
      updated: new Date(),
      latitude: intelData.coordinates.latitude,
      longitude: intelData.coordinates.longitude,
      location: intelData.location,
  classification: intelData.classification,
      priority: intelData.priority,
      threatLevel: intelData.threatLevel,
      confidence: intelData.confidence,
      category: intelData.category,
      tags: intelData.tags,
      type: 'intelligence' as const,
      sources: intelData.sources,
      isProcessed: intelData.isProcessed,
      qualityScore: this.calculateOverallQuality(intelData.quality)
    };
  }

  /**
   * Create IntelDataCollection from multiple Intel items
   */
  static createCollection(
    name: string, 
    intelItems: Intel[], 
    options: {
      description?: string;
      purpose: string;
      createdBy: string;
    }
  ): IntelDataCollection {
    const items = intelItems.map(intel => this.fromIntel(intel));
    
    return {
      id: crypto.randomUUID(),
      name,
      description: options.description,
      items,
      metadata: {
        createdBy: options.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        purpose: options.purpose
      },
      statistics: this.calculateCollectionStatistics(items),
      status: 'active'
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private static calculateTimeliness(timestamp: number): number {
    const now = Date.now();
    const ageHours = (now - timestamp) / (1000 * 60 * 60);
    
    // Timeliness decreases over time
    if (ageHours < 1) return 100;
    if (ageHours < 24) return 90;
    if (ageHours < 168) return 75; // 1 week
    if (ageHours < 720) return 50; // 1 month
    return 25;
  }

  private static mapReliabilityToScore(reliability: string): number {
    const mapping = { 'A': 95, 'B': 85, 'C': 75, 'D': 60, 'E': 40, 'F': 30 };
    return mapping[reliability as keyof typeof mapping] || 50;
  }

  private static calculateOverallQuality(quality: IntelData['quality']): number {
    const weights = {
      accuracy: 0.3,
      completeness: 0.2,
      timeliness: 0.2,
      relevance: 0.15,
      reliability: 0.15
    };

    return Math.round(
      quality.accuracy * weights.accuracy +
      quality.completeness * weights.completeness +
      quality.timeliness * weights.timeliness +
      quality.relevance * weights.relevance +
      quality.reliability * weights.reliability
    );
  }

  private static calculateCollectionStatistics(items: IntelData[]): IntelDataCollection['statistics'] {
    const totalItems = items.length;
    const rawIntelCount = items.filter(item => item.type === 'raw').length;
    const processedDataCount = items.filter(item => item.isProcessed).length;
    
    const confidenceSum = items.reduce((sum, item) => sum + item.confidence, 0);
    const averageConfidence = totalItems > 0 ? confidenceSum / totalItems : 0;
    
    const timestamps = items.map(item => item.collectedAt.getTime());
    const earliest = new Date(Math.min(...timestamps));
    const latest = new Date(Math.max(...timestamps));
    
    // Calculate geographic bounds
    const latitudes = items.map(item => item.coordinates.latitude);
    const longitudes = items.map(item => item.coordinates.longitude);
    
    const geographicCoverage = items.length > 0 ? {
      bounds: {
        north: Math.max(...latitudes),
        south: Math.min(...latitudes),
        east: Math.max(...longitudes),
        west: Math.min(...longitudes)
      },
      centerpoint: {
        latitude: latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length,
        longitude: longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length
      }
    } : undefined;

    return {
      totalItems,
      rawIntelCount,
      processedReportCount: processedDataCount,
      averageConfidence,
      dateRange: { earliest, latest },
      geographicCoverage
    };
  }
}

// =============================================================================
// INTEL DATA MANAGER
// =============================================================================

/**
 * Intel Data Manager
 * Provides high-level operations for managing IntelData lifecycle
 */
export class IntelDataManager {
  private collections: Map<string, IntelDataCollection> = new Map();
  private intelData: Map<string, IntelData> = new Map();

  /**
   * Add intel data to management
   */
  addIntelData(data: IntelData): void {
    this.intelData.set(data.id, data);
  }

  /**
   * Get intel data by ID
   */
  getIntelData(id: string): IntelData | undefined {
    return this.intelData.get(id);
  }

  /**
   * Process raw intel data to analyzed state
   */
  processIntelData(id: string, processor: string): IntelData | null {
    const data = this.intelData.get(id);
    if (!data || data.status !== 'collected') {
      return null;
    }

    const processedData: IntelData = {
      ...data,
      type: 'processed',
      status: 'processed',
      processedAt: new Date(),
      processingMetadata: {
        processedBy: processor,
        processedAt: new Date(),
        processingMethod: 'automated',
        qualityScore: IntelDataTransformer['calculateOverallQuality'](data.quality),
        completeness: data.quality.completeness,
        timeliness: data.quality.timeliness
      }
    };

    this.intelData.set(id, processedData);
    return processedData;
  }

  /**
   * Create collection from multiple intel data items
   */
  createCollection(name: string, dataIds: string[], options: {
    description?: string;
    purpose: string;
    createdBy: string;
  }): IntelDataCollection | null {
    const items = dataIds
      .map(id => this.intelData.get(id))
      .filter((item): item is IntelData => item !== undefined);

    if (items.length === 0) {
      return null;
    }

    const collection: IntelDataCollection = {
      id: crypto.randomUUID(),
      name,
      description: options.description,
      items,
      metadata: {
        createdBy: options.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        purpose: options.purpose
      },
      statistics: IntelDataTransformer['calculateCollectionStatistics'](items),
      status: 'active'
    };

    this.collections.set(collection.id, collection);
    return collection;
  }

  /**
   * Get all collections
   */
  getCollections(): IntelDataCollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Get collection by ID
   */
  getCollection(id: string): IntelDataCollection | undefined {
    return this.collections.get(id);
  }

  /**
   * Get intel data by criteria
   */
  queryIntelData(criteria: {
    category?: IntelCategory;
    priority?: IntelPriority;
    // classification removed in declassified build
    // classification?: IntelClassification;
    timeRange?: { start: Date; end: Date };
    confidenceMin?: number;
    tags?: string[];
  }): IntelData[] {
    return Array.from(this.intelData.values()).filter(data => {
      if (criteria.category && data.category !== criteria.category) return false;
      if (criteria.priority && data.priority !== criteria.priority) return false;
      // No classification filtering in declassified build
      if (criteria.confidenceMin && data.confidence < criteria.confidenceMin) return false;
      
      if (criteria.timeRange) {
        const dataTime = data.collectedAt.getTime();
        if (dataTime < criteria.timeRange.start.getTime() || dataTime > criteria.timeRange.end.getTime()) {
          return false;
        }
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        const hasAllTags = criteria.tags.every(tag => data.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      
      return true;
    });
  }
}

// End of IntelData.ts
