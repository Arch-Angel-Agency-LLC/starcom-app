/**
 * NetRunner Model Utilities
 * 
 * Utility functions for working with NetRunner data models including validation,
 * type guards, and transformation helpers.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { 
  OSINTDataItem, 
  OSINTSearchQuery, 
  ToolExecutionRequest, 
  OSINTDataTransferDTO,
  IntelType,
  SourceType,
  // classification removed in civilian build
} from './OSINTDataModels';

/**
 * Type guards for OSINT data models
 */
export class ModelTypeGuards {
  
  /**
   * Check if an object is a valid OSINTDataItem
   */
  static isOSINTDataItem(obj: unknown): obj is OSINTDataItem {
    if (!obj || typeof obj !== 'object') return false;
    const item = obj as Record<string, unknown>;
    
    return (
      typeof item.id === 'string' &&
      typeof item.type === 'string' &&
      typeof item.sourceType === 'string' &&
      // classification removed in civilian build
      typeof item.collectedAt === 'string' &&
      typeof item.collectedBy === 'string' &&
      typeof item.source === 'object' &&
      typeof item.content === 'object' &&
      typeof item.metadata === 'object'
    );
  }

  /**
   * Check if an object is a valid OSINTSearchQuery
   */
  static isOSINTSearchQuery(obj: unknown): obj is OSINTSearchQuery {
    if (!obj || typeof obj !== 'object') return false;
    const query = obj as Record<string, unknown>;
    
    return (
      typeof query.id === 'string' &&
      typeof query.query === 'string' &&
      Array.isArray(query.type) &&
      Array.isArray(query.sources) &&
      typeof query.filters === 'object' &&
      typeof query.options === 'object' &&
      typeof query.createdAt === 'string' &&
      typeof query.createdBy === 'string'
    );
  }

  /**
   * Check if an object is a valid ToolExecutionRequest
   */
  static isToolExecutionRequest(obj: unknown): obj is ToolExecutionRequest {
    if (!obj || typeof obj !== 'object') return false;
    const request = obj as Record<string, unknown>;
    
    return (
      typeof request.id === 'string' &&
      typeof request.toolId === 'string' &&
      typeof request.parameters === 'object' &&
      typeof request.options === 'object' &&
      typeof request.context === 'object' &&
      typeof request.createdAt === 'string'
    );
  }

  /**
   * Check if a string is a valid IntelType
   */
  static isValidIntelType(type: string): type is IntelType {
    const validTypes: IntelType[] = [
      'identity', 'network', 'financial', 'geospatial', 'social',
      'infrastructure', 'vulnerability', 'darkweb', 'threat', 'temporal'
    ];
    return validTypes.includes(type as IntelType);
  }

  /**
   * Check if a string is a valid SourceType
   */
  static isValidSourceType(type: string): type is SourceType {
    const validTypes: SourceType[] = [
      'public_web', 'social_media', 'search_engine', 'database', 'api',
      'dark_web', 'file_system', 'network_scan', 'manual'
    ];
    return validTypes.includes(type as SourceType);
  }

  // classification validation removed in civilian build
}

/**
 * Model validation utilities
 */
export class ModelValidators {
  
  /**
   * Validate OSINT data item structure
   */
  static validateOSINTDataItem(item: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!ModelTypeGuards.isOSINTDataItem(item)) {
      errors.push('Object is not a valid OSINTDataItem');
      return { valid: false, errors };
    }

    // Additional validation
    if (!item.id || item.id.length === 0) {
      errors.push('ID is required and cannot be empty');
    }

    if (!ModelTypeGuards.isValidIntelType(item.type)) {
      errors.push(`Invalid intel type: ${item.type}`);
    }

    if (!ModelTypeGuards.isValidSourceType(item.sourceType)) {
      errors.push(`Invalid source type: ${item.sourceType}`);
    }

    // classification removed in civilian build

    if (item.metadata.confidence < 0 || item.metadata.confidence > 100) {
      errors.push('Confidence must be between 0 and 100');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate search query structure
   */
  static validateOSINTSearchQuery(query: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!ModelTypeGuards.isOSINTSearchQuery(query)) {
      errors.push('Object is not a valid OSINTSearchQuery');
      return { valid: false, errors };
    }

    // Additional validation
    if (!query.query || query.query.trim().length === 0) {
      errors.push('Query string is required and cannot be empty');
    }

    if (query.type.length === 0) {
      errors.push('At least one intel type must be specified');
    }

    if (query.sources.length === 0) {
      errors.push('At least one source type must be specified');
    }

    // Validate intel types
    for (const type of query.type) {
      if (!ModelTypeGuards.isValidIntelType(type)) {
        errors.push(`Invalid intel type: ${type}`);
      }
    }

    // Validate source types
    for (const source of query.sources) {
      if (!ModelTypeGuards.isValidSourceType(source)) {
        errors.push(`Invalid source type: ${source}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

/**
 * Model transformation utilities
 */
export class ModelTransformers {
  
  /**
   * Transform raw data to OSINTDataItem
   */
  static createOSINTDataItem(data: {
    type: IntelType;
    sourceType: SourceType;
    // classification removed in civilian build
    sourceName: string;
    sourceUrl?: string;
    tool?: string;
    content: Record<string, unknown>;
    collectedBy: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }): OSINTDataItem {
    return {
      id: this.generateId(),
      type: data.type,
      sourceType: data.sourceType,
      // classification removed in civilian build
      collectedAt: new Date().toISOString(),
      collectedBy: data.collectedBy,
      correlationId: data.correlationId,
      source: {
        name: data.sourceName,
        url: data.sourceUrl,
        tool: data.tool,
        reliability: 'unknown'
      },
      content: data.content,
      metadata: {
        collectionMethod: data.tool || 'manual',
        processingStatus: 'raw',
        confidence: 50, // Default confidence
        ...data.metadata
      }
    } as OSINTDataItem;
  }

  /**
   * Transform OSINT data items to transfer DTO
   */
  static createTransferDTO(
    items: OSINTDataItem[],
    transferType: OSINTDataTransferDTO['transferType'],
    context?: Partial<OSINTDataTransferDTO['data']['context']>
  ): OSINTDataTransferDTO {
    const dataTypes = Array.from(new Set(items.map(item => item.type)));
    const sourceTypes = Array.from(new Set(items.map(item => item.sourceType)));
    const avgConfidence = items.reduce((sum, item) => sum + item.metadata.confidence, 0) / items.length;

    return {
      transferId: this.generateId(),
      sourceApplication: 'netrunner',
      targetApplication: 'intel-analyzer',
      transferType,
      timestamp: new Date().toISOString(),
      data: {
        items,
        context: context || {},
        metadata: {
          totalItems: items.length,
          dataTypes: dataTypes,
          sourceTypes: sourceTypes,
          qualityScore: Math.round(avgConfidence),
          processingNotes: []
        }
      }
    };
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `netrunner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Model query utilities
 */
export class ModelQueries {
  
  /**
   * Filter OSINT data items by type
   */
  static filterByType(items: OSINTDataItem[], types: IntelType[]): OSINTDataItem[] {
    return items.filter(item => types.includes(item.type));
  }

  /**
   * Filter OSINT data items by source type
   */
  static filterBySourceType(items: OSINTDataItem[], sourceTypes: SourceType[]): OSINTDataItem[] {
    return items.filter(item => sourceTypes.includes(item.sourceType));
  }

  // classification-based filters removed in civilian build

  /**
   * Filter OSINT data items by confidence threshold
   */
  static filterByConfidence(items: OSINTDataItem[], minConfidence: number): OSINTDataItem[] {
    return items.filter(item => item.metadata.confidence >= minConfidence);
  }

  /**
   * Sort OSINT data items by collection date
   */
  static sortByCollectionDate(items: OSINTDataItem[], ascending = false): OSINTDataItem[] {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.collectedAt).getTime();
      const dateB = new Date(b.collectedAt).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Sort OSINT data items by confidence
   */
  static sortByConfidence(items: OSINTDataItem[], ascending = false): OSINTDataItem[] {
    return [...items].sort((a, b) => {
      return ascending 
        ? a.metadata.confidence - b.metadata.confidence
        : b.metadata.confidence - a.metadata.confidence;
    });
  }

  /**
   * Group OSINT data items by type
   */
  static groupByType(items: OSINTDataItem[]): Record<IntelType, OSINTDataItem[]> {
    const groups: Partial<Record<IntelType, OSINTDataItem[]>> = {};
    
    for (const item of items) {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type]!.push(item);
    }
    
    return groups as Record<IntelType, OSINTDataItem[]>;
  }

  /**
   * Get statistics for a collection of OSINT data items
   */
  static getCollectionStats(items: OSINTDataItem[]): {
    totalItems: number;
    typeDistribution: Record<IntelType, number>;
    sourceDistribution: Record<SourceType, number>;
    avgConfidence: number;
    dateRange: { earliest: string; latest: string } | null;
  } {
    if (items.length === 0) {
      return {
        totalItems: 0,
        typeDistribution: {} as Record<IntelType, number>,
        sourceDistribution: {} as Record<SourceType, number>,
        avgConfidence: 0,
        dateRange: null
      };
    }

    const typeDistribution: Partial<Record<IntelType, number>> = {};
    const sourceDistribution: Partial<Record<SourceType, number>> = {};
    let totalConfidence = 0;
    let earliest = items[0].collectedAt;
    let latest = items[0].collectedAt;

    for (const item of items) {
      // Count types
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
      
      // Count sources
      sourceDistribution[item.sourceType] = (sourceDistribution[item.sourceType] || 0) + 1;
      
      // Sum confidence
      totalConfidence += item.metadata.confidence;
      
      // Track date range
      if (item.collectedAt < earliest) earliest = item.collectedAt;
      if (item.collectedAt > latest) latest = item.collectedAt;
    }

    return {
      totalItems: items.length,
      typeDistribution: typeDistribution as Record<IntelType, number>,
      sourceDistribution: sourceDistribution as Record<SourceType, number>,
      avgConfidence: totalConfidence / items.length,
      dateRange: { earliest, latest }
    };
  }
}
