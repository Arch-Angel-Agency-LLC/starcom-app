/**
 * Intel Reports 3D - Backward Compatibility Layer
 * 
 * This file provides compatibility interfaces and migration utilities
 * to maintain backward compatibility with existing Intel Report components
 * while transitioning to the new unified type system.
 */

import { 
  IntelReport3DData, 
  IntelVisualization,
  IntelMetadata,
  IntelContent,
  IntelLocation,
  IntelClassification
} from './IntelReportTypes';

// =============================================================================
// LEGACY INTERFACE COMPATIBILITY
// =============================================================================

/**
 * Legacy IntelReportOverlayMarker interface
 * Maps to new IntelReport3DData structure
 */
// TODO: Add support for dynamic configuration updates without application restart - PRIORITY: LOW
// TODO: Implement configuration backup and version control integration - PRIORITY: MEDIUM
export interface LegacyIntelReportOverlay {
  pubkey: string; // Solana account pubkey (base58)
  title: string;
  content: string;
  tags: string[]; // e.g., ['SIGINT', 'HUMINT']
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp
  author: string; // Wallet address (base58)
}

/**
 * Legacy IntelReportData interface
 * Maps to new IntelReport3DData structure
 */
export interface LegacyIntelReportData {
  // Unique identifier (account public key or generated ID)
  id?: string;
  
  // Blockchain fields (required for on-chain storage)
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string; // Wallet address (base58)
  
  // Blockchain metadata (available after submission)
  pubkey?: string; // Solana account public key (base58)
  signature?: string; // Transaction signature
  
  // UI-specific fields (optional, used for display)
  subtitle?: string;
  date?: string; // ISO date string for display
  categories?: string[];
  metaDescription?: string;
  
  // Legacy compatibility fields (deprecated)
  lat?: number;
  long?: number;
}

/**
 * Legacy IntelReport class interface
 * Maps to new IntelReport3DData structure
 */
export interface LegacyIntelReport {
  lat: number;
  long: number;
  title: string;
  subtitle: string;
  date: string;
  author: string;
  content: string;
  tags: string[];
  categories: string[];
  metaDescription: string;
}

/**
 * Legacy EnhancedIntelReport interface
 * Maps to new IntelReport3DData structure with context
 */
export interface LegacyEnhancedIntelReport {
  id: string;
  title: string;
  coordinates: [number, number];
  priority: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  description: string;
  source: string;
  classification: string;
  timestamp: Date;
  reliability: number;
  relatedReports: string[];
  attachments?: Array<{
    id: string;
    type: string;
    name: string;
    url: string;
  }>;
  impactAssessment?: string;
  actionItems?: Array<{
    id: string;
    description: string;
    priority: string;
    status: string;
  }>;
}

/**
 * Legacy Data Provider IntelReport interface
 * Used by IntelDataProvider and related services
 */
export interface LegacyDataProviderIntelReport {
  pubkey: string;
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string;
  signature?: string;
  verified?: boolean;
  classification?: 'UNCLASS' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  source?: 'SIGINT' | 'HUMINT' | 'GEOINT' | 'OSINT' | 'COMINT';
}

// =============================================================================
// MIGRATION UTILITIES
// =============================================================================

/**
 * Migration utilities for converting legacy types to new unified types
 */
export const IntelCompatibilityMigration = {
  /**
   * Convert legacy overlay marker to new IntelReport3DData
   */
  fromLegacyOverlay: (legacy: LegacyIntelReportOverlay): IntelReport3DData => {
    return {
      id: legacy.pubkey,
      title: legacy.title,
      classification: 'UNCLASSIFIED', // Default classification
      source: legacy.author,
      timestamp: new Date(legacy.timestamp),
      
      location: {
        lat: legacy.latitude,
        lng: legacy.longitude
      } as IntelLocation,
      
      content: {
        summary: legacy.content.substring(0, 200) + '...',
        details: legacy.content,
        attachments: []
      } as IntelContent,
      
      visualization: {
        markerType: 'standard',
        color: '#4ecdc4',
        size: 1.0,
        opacity: 0.8
      } as IntelVisualization,
      
      metadata: {
        tags: legacy.tags,
        confidence: 0.5,
        reliability: 0.5,
        freshness: Math.max(0, 1 - (Date.now() - legacy.timestamp) / (7 * 24 * 60 * 60 * 1000))
      } as IntelMetadata
    };
  },

  /**
   * Convert legacy data interface to new IntelReport3DData
   */
  fromLegacyData: (legacy: LegacyIntelReportData): IntelReport3DData => {
    return {
      id: legacy.id || legacy.pubkey || `legacy-${Date.now()}`,
      title: legacy.title,
      classification: 'UNCLASSIFIED',
      source: legacy.author,
      timestamp: new Date(legacy.timestamp),
      
      location: {
        lat: legacy.latitude || legacy.lat || 0,
        lng: legacy.longitude || legacy.long || 0
      } as IntelLocation,
      
      content: {
        summary: legacy.subtitle || legacy.content.substring(0, 200) + '...',
        details: legacy.content,
        attachments: []
      } as IntelContent,
      
      visualization: {
        markerType: 'standard',
        color: '#4ecdc4',
        size: 1.0,
        opacity: 0.8
      } as IntelVisualization,
      
      metadata: {
        tags: legacy.tags,
        confidence: 0.5,
        reliability: 0.5,
        freshness: Math.max(0, 1 - (Date.now() - legacy.timestamp) / (7 * 24 * 60 * 60 * 1000))
      } as IntelMetadata
    };
  },

  /**
   * Convert legacy IntelReport class to new IntelReport3DData
   */
  fromLegacyIntelReport: (legacy: LegacyIntelReport): IntelReport3DData => {
    const timestamp = legacy.date ? new Date(legacy.date) : new Date();
    
    return {
      id: `legacy-report-${Date.now()}`,
      title: legacy.title,
      classification: 'UNCLASSIFIED',
      source: legacy.author,
      timestamp,
      
      location: {
        lat: legacy.lat,
        lng: legacy.long
      } as IntelLocation,
      
      content: {
        summary: legacy.subtitle || legacy.content.substring(0, 200) + '...',
        details: legacy.content,
        attachments: []
      } as IntelContent,
      
      visualization: {
        markerType: 'standard',
        color: '#4ecdc4',
        size: 1.0,
        opacity: 0.8
      } as IntelVisualization,
      
      metadata: {
        tags: legacy.tags,
        confidence: 0.5,
        reliability: 0.5,
        freshness: Math.max(0, 1 - (Date.now() - timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000))
      } as IntelMetadata
    };
  },

  /**
   * Convert legacy enhanced intel report to new IntelReport3DData
   */
  fromLegacyEnhanced: (legacy: LegacyEnhancedIntelReport): IntelReport3DData => {
    // Map priority to visualization properties
    const getPriorityVisualization = (priority: string) => {
      switch (priority) {
        case 'critical': return { markerType: 'alert' as const, color: '#ff4757', size: 1.5 };
        case 'high': return { markerType: 'priority' as const, color: '#ff6b35', size: 1.3 };
        case 'medium': return { markerType: 'standard' as const, color: '#f39c12', size: 1.1 };
        default: return { markerType: 'standard' as const, color: '#4ecdc4', size: 1.0 };
      }
    };
    
    const visualProps = getPriorityVisualization(legacy.priority);
    
    return {
      id: legacy.id,
      title: legacy.title,
      classification: (legacy.classification as IntelClassification) || 'UNCLASSIFIED',
      source: legacy.source,
      timestamp: legacy.timestamp,
      
      location: {
        lat: legacy.coordinates[0],
        lng: legacy.coordinates[1]
      } as IntelLocation,
      
      content: {
        summary: legacy.summary,
        details: legacy.description,
        attachments: legacy.attachments?.map(att => ({
          id: att.id,
          type: att.type as 'image' | 'document' | 'video' | 'audio' | 'data',
          name: att.name,
          url: att.url,
          size: 0,
          classification: 'UNCLASSIFIED' as IntelClassification
        })) || []
      } as IntelContent,
      
      visualization: {
        markerType: visualProps.markerType,
        color: visualProps.color,
        size: visualProps.size,
        opacity: 0.9
      } as IntelVisualization,
      
      metadata: {
        tags: [],
        confidence: legacy.reliability / 5, // Convert 1-5 scale to 0-1
        reliability: legacy.reliability / 5,
        freshness: Math.max(0, 1 - (Date.now() - legacy.timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000))
      } as IntelMetadata,
      
      relationships: legacy.relatedReports?.map(id => ({
        id: `rel-${id}`,
        type: 'related_to' as const,
        target_intel_id: id,
        strength: 0.5,
        description: 'Related report',
        created_at: new Date()
      }))
    };
  },

  /**
   * Convert legacy data provider report to new IntelReport3DData
   */
  fromLegacyDataProvider: (legacy: LegacyDataProviderIntelReport): IntelReport3DData => {
    // Map classification levels
    const mapClassification = (level?: string) => {
      switch (level) {
        case 'CONFIDENTIAL': return 'CONFIDENTIAL';
        case 'SECRET': return 'SECRET';
        case 'TOP_SECRET': return 'TOP_SECRET';
        default: return 'UNCLASSIFIED';
      }
    };

    // Map source types to visualization colors
    const getSourceVisualization = (source?: string) => {
      switch (source) {
        case 'SIGINT': return { color: '#ff6b6b', markerType: 'standard' as const };
        case 'HUMINT': return { color: '#4ecdc4', markerType: 'standard' as const };
        case 'GEOINT': return { color: '#45b7d1', markerType: 'standard' as const };
        case 'OSINT': return { color: '#26de81', markerType: 'standard' as const };
        case 'COMINT': return { color: '#a55eea', markerType: 'standard' as const };
        default: return { color: '#4ecdc4', markerType: 'standard' as const };
      }
    };

    const visualProps = getSourceVisualization(legacy.source);
    
    return {
      id: legacy.pubkey,
      title: legacy.title,
      classification: mapClassification(legacy.classification),
      source: legacy.author,
      timestamp: new Date(legacy.timestamp),
      
      location: {
        lat: legacy.latitude,
        lng: legacy.longitude
      } as IntelLocation,
      
      content: {
        summary: legacy.content.substring(0, 200) + (legacy.content.length > 200 ? '...' : ''),
        details: legacy.content,
        attachments: []
      } as IntelContent,
      
      visualization: {
        markerType: visualProps.markerType,
        color: visualProps.color,
        size: legacy.verified ? 1.2 : 1.0,
        opacity: legacy.verified ? 0.9 : 0.7
      } as IntelVisualization,
      
      metadata: {
        tags: legacy.tags,
        confidence: legacy.verified ? 0.8 : 0.5,
        reliability: legacy.verified ? 0.8 : 0.5,
        freshness: Math.max(0, 1 - (Date.now() - legacy.timestamp) / (7 * 24 * 60 * 60 * 1000))
      } as IntelMetadata
    };
  }
};

// =============================================================================
// REVERSE MIGRATION UTILITIES
// =============================================================================

/**
 * Utilities for converting new types back to legacy formats
 * (for compatibility with components that haven't been migrated yet)
 */
export const IntelCompatibilityExport = {
  /**
   * Convert new IntelReport3DData to legacy overlay format
   */
  toLegacyOverlay: (modern: IntelReport3DData): LegacyIntelReportOverlay => {
    return {
      pubkey: modern.id,
      title: modern.title,
      content: modern.content.details,
      tags: modern.metadata.tags,
      latitude: modern.location.lat,
      longitude: modern.location.lng,
      timestamp: modern.timestamp.getTime(),
      author: modern.source
    };
  },

  /**
   * Convert new IntelReport3DData to legacy data format
   */
  toLegacyData: (modern: IntelReport3DData): LegacyIntelReportData => {
    return {
      id: modern.id,
      pubkey: modern.id,
      title: modern.title,
      content: modern.content.details,
      tags: modern.metadata.tags,
      latitude: modern.location.lat,
      longitude: modern.location.lng,
      timestamp: modern.timestamp.getTime(),
      author: modern.source,
      subtitle: modern.content.summary
    };
  },

  /**
   * Convert new IntelReport3DData to legacy enhanced format
   */
  toLegacyEnhanced: (modern: IntelReport3DData): LegacyEnhancedIntelReport => {
    // Map visualization to priority
    const getPriorityFromVisualization = (viz: IntelVisualization) => {
      switch (viz.markerType) {
        case 'alert': return 'critical';
        case 'priority': return 'high';
        default: return viz.size > 1.2 ? 'medium' : 'low';
      }
    };

    return {
      id: modern.id,
      title: modern.title,
      coordinates: [modern.location.lat, modern.location.lng],
      priority: getPriorityFromVisualization(modern.visualization) as 'low' | 'medium' | 'high' | 'critical',
      summary: modern.content.summary,
      description: modern.content.details,
      source: modern.source,
      classification: modern.classification,
      timestamp: modern.timestamp,
      reliability: Math.round(modern.metadata.reliability * 5), // Convert back to 1-5 scale
      relatedReports: modern.relationships?.map(r => r.id) || [],
      attachments: modern.content.attachments?.map(att => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url
      }))
    };
  }
};

// =============================================================================
// TYPE GUARDS AND VALIDATION
// =============================================================================

/**
 * Type guards for identifying legacy interfaces
 */
export const IntelCompatibilityTypeGuards = {
  /**
   * Check if object is legacy overlay marker
   */
  isLegacyOverlay: (obj: unknown): obj is LegacyIntelReportOverlay => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as Record<string, unknown>).pubkey === 'string' &&
      typeof (obj as Record<string, unknown>).title === 'string' &&
      typeof (obj as Record<string, unknown>).content === 'string' &&
      Array.isArray((obj as Record<string, unknown>).tags) &&
      typeof (obj as Record<string, unknown>).latitude === 'number' &&
      typeof (obj as Record<string, unknown>).longitude === 'number' &&
      typeof (obj as Record<string, unknown>).timestamp === 'number' &&
      typeof (obj as Record<string, unknown>).author === 'string'
    );
  },

  /**
   * Check if object is legacy data interface
   */
  isLegacyData: (obj: unknown): obj is LegacyIntelReportData => {
    const record = obj as Record<string, unknown>;
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof record.title === 'string' &&
      typeof record.content === 'string' &&
      Array.isArray(record.tags) &&
      (typeof record.latitude === 'number' || typeof record.lat === 'number') &&
      (typeof record.longitude === 'number' || typeof record.long === 'number') &&
      typeof record.timestamp === 'number' &&
      typeof record.author === 'string'
    );
  },

  /**
   * Check if object is legacy IntelReport class format
   */
  isLegacyIntelReport: (obj: unknown): obj is LegacyIntelReport => {
    const record = obj as Record<string, unknown>;
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof record.lat === 'number' &&
      typeof record.long === 'number' &&
      typeof record.title === 'string' &&
      typeof record.subtitle === 'string' &&
      typeof record.date === 'string' &&
      typeof record.author === 'string' &&
      typeof record.content === 'string' &&
      Array.isArray(record.tags) &&
      Array.isArray(record.categories) &&
      typeof record.metaDescription === 'string'
    );
  },

  /**
   * Check if object is legacy enhanced intel report
   */
  isLegacyEnhanced: (obj: unknown): obj is LegacyEnhancedIntelReport => {
    const record = obj as Record<string, unknown>;
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof record.id === 'string' &&
      typeof record.title === 'string' &&
      Array.isArray(record.coordinates) &&
      (record.coordinates as unknown[]).length === 2 &&
      typeof record.priority === 'string' &&
      typeof record.summary === 'string' &&
      typeof record.description === 'string' &&
      typeof record.source === 'string' &&
      record.timestamp instanceof Date
    );
  }
};

// =============================================================================
// COMPATIBILITY ADAPTER
// =============================================================================

/**
 * Universal adapter for handling any legacy Intel Report format
 */
export class IntelCompatibilityAdapter {
  /**
   * Auto-detect legacy format and convert to new IntelReport3DData
   */
  static autoMigrate(legacy: unknown): IntelReport3DData | null {
    if (IntelCompatibilityTypeGuards.isLegacyOverlay(legacy)) {
      return IntelCompatibilityMigration.fromLegacyOverlay(legacy);
    }
    
    if (IntelCompatibilityTypeGuards.isLegacyEnhanced(legacy)) {
      return IntelCompatibilityMigration.fromLegacyEnhanced(legacy);
    }
    
    if (IntelCompatibilityTypeGuards.isLegacyData(legacy)) {
      return IntelCompatibilityMigration.fromLegacyData(legacy);
    }
    
    if (IntelCompatibilityTypeGuards.isLegacyIntelReport(legacy)) {
      return IntelCompatibilityMigration.fromLegacyIntelReport(legacy);
    }
    
    return null;
  }

  /**
   * Batch migration for arrays of legacy reports
   */
  static batchMigrate(legacyReports: unknown[]): IntelReport3DData[] {
    return legacyReports
      .map(report => this.autoMigrate(report))
      .filter((report): report is IntelReport3DData => report !== null);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// All interfaces are already exported inline above
