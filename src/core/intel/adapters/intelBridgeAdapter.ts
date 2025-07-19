/**
 * Intel Bridge Adapter
 * 
 * This adapter bridges the new Intel architecture with the existing IntelDataCore system,
 * providing seamless transformation between raw Intel objects and visualization-ready IntelEntity objects.
 */

import { 
  BaseEntity,
  IntelEntity,
  NodeEntity,
  ClassificationLevel
} from '../types/intelDataModels';
import { 
  Intel, 
  Intelligence, 
  ReliabilityRating,
  IntelRequirement 
} from '../../../models/Intel/Intel';
import { 
  RawData, 
  Observation, 
  Pattern, 
  Evidence, 
  Indicator,
  Finding,
  DataLineage 
} from '../../../models/Intel/IntelligenceFlowchart';

/**
 * Enhanced IntelEntity that bridges new and existing architectures
 */
export interface EnhancedIntelEntity extends IntelEntity {
  // Original properties preserved
  title: string;
  description: string;
  classification: ClassificationLevel;
  source: string;
  verified: boolean;
  confidence: number;
  
  // New architecture integration
  sourceIntelligence?: string[]; // Intelligence IDs that contributed to this entity
  derivedFromRawData?: string[]; // RawData IDs that were used
  reliability?: ReliabilityRating; // Reliability from Intel system
  processingLineage?: DataLineage; // Complete processing history
  confidenceMetrics?: {
    extraction: number;    // Confidence in data extraction (0-100)
    correlation: number;   // Confidence in correlations (0-100)
    analysis: number;      // Confidence in analysis (0-100)
    validation: number;    // Confidence in validation (0-100)
  };
  
  // Evidence chain
  supportingEvidence?: string[]; // Evidence IDs
  contradictingEvidence?: string[]; // Evidence that challenges this entity
  relatedPatterns?: string[]; // Pattern IDs that apply
  triggeredIndicators?: string[]; // Indicator IDs triggered by this entity
}

/**
 * Bridge adapter for transforming between Intel and IntelEntity systems
 */
export class IntelBridgeAdapter {
  
  /**
   * Transform raw Intel object to visualization-ready IntelEntity
   */
  static transformIntelToEntity(intel: Intel): EnhancedIntelEntity {
    // Generate meaningful title from intel data
    const title = this.generateTitleFromIntel(intel);
    
    // Generate description from intel content
    const description = this.generateDescriptionFromIntel(intel);
    
    // Map reliability to confidence score (0-100)
    const confidence = this.mapReliabilityToConfidence(intel.reliability);
    
    return {
      // Base entity properties
      id: `entity-${intel.id}`,
      type: 'intel_entity',
      createdAt: new Date(intel.timestamp).toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: intel.collectedBy,
      metadata: {
        originalIntelId: intel.id,
        dataHash: intel.hash,
        originalTags: intel.tags
      },
      tags: intel.tags,
      
      // IntelEntity properties
      title,
      description,
      classification: this.mapToClassificationLevel(intel.classification),
      source: intel.source,
      sourceUrl: undefined, // Could be enhanced with source URL if available
      verified: intel.verified || false,
      confidence,
      verifiedBy: intel.verified ? intel.collectedBy : undefined,
      verifiedAt: intel.verified ? new Date().toISOString() : undefined,
      expiresAt: undefined, // Could add expiration logic
      attachments: [], // Could be enhanced with attachments
      
      // Enhanced properties
      sourceIntelligence: [intel.id],
      derivedFromRawData: [], // Will be populated when we have lineage
      reliability: intel.reliability,
      processingLineage: undefined, // Will be populated by lineage tracker
      confidenceMetrics: {
        extraction: confidence,
        correlation: 50, // Default, will be enhanced
        analysis: 50,    // Default, will be enhanced  
        validation: intel.verified ? 90 : 30
      }
    };
  }
  
  /**
   * Transform Intelligence object (processed intel) to IntelEntity
   */
  static transformIntelligenceToEntity(intelligence: Intelligence): EnhancedIntelEntity {
    const baseEntity = this.transformIntelToEntity(intelligence);
    
    return {
      ...baseEntity,
      id: `entity-intel-${intelligence.id}`,
      
      // Enhanced with Intelligence-specific data
      sourceIntelligence: [intelligence.id],
      derivedFromRawData: intelligence.derivedFrom?.rawData || [],
      confidence: intelligence.confidence || baseEntity.confidence,
      
      // Enhanced confidence metrics from Intelligence processing
      confidenceMetrics: {
        extraction: intelligence.confidence || 70,
        correlation: 75, // Intelligence objects have been correlated
        analysis: 80,    // Intelligence objects have been analyzed
        validation: intelligence.verified ? 90 : 50
      },
      
      // Additional context from Intelligence
      metadata: {
        ...baseEntity.metadata,
        implications: intelligence.implications,
        recommendations: intelligence.recommendations,
        derivedFromObservations: intelligence.derivedFrom?.observations || [],
        derivedFromPatterns: intelligence.derivedFrom?.patterns || [],
        derivedFromEvidence: intelligence.derivedFrom?.evidence || [],
        derivedFromIndicators: intelligence.derivedFrom?.indicators || []
      }
    };
  }
  
  /**
   * Transform IntelEntity back to Intelligence (for round-trip capability)
   */
  static transformEntityToIntelligence(entity: EnhancedIntelEntity): Intelligence {
    return {
      id: entity.metadata?.originalIntelId || entity.id.replace('entity-', ''),
      source: entity.source as any, // Type conversion needed
      classification: entity.classification as any, // Type conversion needed
      reliability: entity.reliability || 'C',
      timestamp: new Date(entity.createdAt).getTime(),
      collectedBy: entity.createdBy,
      
      // Geographic context (if available)
      latitude: undefined, // Could extract from entity if available
      longitude: undefined,
      location: undefined,
      
      // Data payload
      data: {
        title: entity.title,
        description: entity.description,
        entityType: entity.type
      },
      
      // Relationship tracking
      derivedFrom: {
        observations: entity.metadata?.derivedFromObservations || [],
        patterns: entity.metadata?.derivedFromPatterns || [],
        evidence: entity.metadata?.derivedFromEvidence || [],
        indicators: entity.metadata?.derivedFromIndicators || [],
        rawData: entity.derivedFromRawData || [],
        artifacts: []
      },
      
      // Metadata
      tags: entity.tags,
      hash: entity.metadata?.dataHash,
      verified: entity.verified,
      confidence: entity.confidence,
      implications: entity.metadata?.implications || [],
      recommendations: entity.metadata?.recommendations || []
    };
  }
  
  /**
   * Create NodeEntity for network visualization from Intelligence
   */
  static transformIntelligenceToNodeEntity(intelligence: Intelligence): NodeEntity {
    const baseEntity = this.transformIntelligenceToEntity(intelligence);
    
    // Determine node type based on intelligence content
    const nodeType = this.determineNodeType(intelligence);
    
    return {
      ...baseEntity,
      id: `node-${intelligence.id}`,
      type: 'node_entity',
      
      // Node-specific properties
      nodeType,
      properties: {
        intelType: intelligence.source,
        reliability: intelligence.reliability,
        confidence: intelligence.confidence,
        implications: intelligence.implications?.length || 0,
        hasRecommendations: (intelligence.recommendations?.length || 0) > 0
      },
      
      // Coordinates (could be enhanced with geographic data)
      coordinates: {
        latitude: intelligence.latitude,
        longitude: intelligence.longitude
      },
      
      // Display options based on intelligence characteristics
      displayOptions: {
        size: this.calculateNodeSize(intelligence),
        color: this.getReliabilityColor(intelligence.reliability),
        icon: this.getNodeIcon(nodeType),
        label: this.generateNodeLabel(intelligence),
        visible: true
      }
    };
  }
  
  // --- Helper Methods ---
  
  private static generateTitleFromIntel(intel: Intel): string {
    // Try to create meaningful title from intel data
    if (typeof intel.data === 'string') {
      // For string data, use first 50 characters
      return intel.data.length > 50 
        ? `${intel.data.substring(0, 47)}...`
        : intel.data;
    }
    
    if (typeof intel.data === 'object' && intel.data) {
      // For object data, try to find title-like properties
      const obj = intel.data as any;
      if (obj.title) return obj.title;
      if (obj.name) return obj.name;
      if (obj.subject) return obj.subject;
      if (obj.email) return `Email: ${obj.email}`;
      if (obj.domain) return `Domain: ${obj.domain}`;
      if (obj.ip) return `IP: ${obj.ip}`;
    }
    
    // Fallback to source and tags
    return `${intel.source} Intel (${intel.tags.join(', ')})`;
  }
  
  private static generateDescriptionFromIntel(intel: Intel): string {
    let description = `Intelligence collected from ${intel.source} `;
    description += `by ${intel.collectedBy} `;
    description += `at ${new Date(intel.timestamp).toLocaleString()}.`;
    
    if (intel.location) {
      description += ` Location: ${intel.location}.`;
    }
    
    if (intel.tags.length > 0) {
      description += ` Tags: ${intel.tags.join(', ')}.`;
    }
    
    // Add reliability assessment
    const reliabilityDesc = this.getReliabilityDescription(intel.reliability);
    description += ` Reliability: ${reliabilityDesc}.`;
    
    return description;
  }
  
  private static mapReliabilityToConfidence(reliability: ReliabilityRating): number {
    const reliabilityMap: Record<ReliabilityRating, number> = {
      'A': 95, // Completely reliable
      'B': 85, // Usually reliable
      'C': 70, // Fairly reliable
      'D': 45, // Not usually reliable
      'E': 25, // Unreliable
      'F': 50, // Cannot be judged (neutral)
      'X': 10  // Deliberate deception suspected
    };
    
    return reliabilityMap[reliability] || 50;
  }
  
  private static mapToClassificationLevel(classification: any): ClassificationLevel {
    // Map from new architecture classification to existing system
    const classificationMap: Record<string, ClassificationLevel> = {
      'UNCLASS': 'UNCLASSIFIED',
      'CONFIDENTIAL': 'CONFIDENTIAL',
      'SECRET': 'SECRET',
      'TOP_SECRET': 'TOP_SECRET'
    };
    
    return classificationMap[classification] || 'UNCLASSIFIED';
  }
  
  private static getReliabilityDescription(reliability: ReliabilityRating): string {
    const descriptions: Record<ReliabilityRating, string> = {
      'A': 'Completely reliable',
      'B': 'Usually reliable',
      'C': 'Fairly reliable', 
      'D': 'Not usually reliable',
      'E': 'Unreliable',
      'F': 'Reliability cannot be judged',
      'X': 'Deliberate deception suspected'
    };
    
    return descriptions[reliability] || 'Unknown';
  }
  
  private static determineNodeType(intelligence: Intelligence): string {
    // Analyze intelligence content to determine appropriate node type
    const data = intelligence.data;
    const tags = intelligence.tags;
    
    // Check tags for type hints
    if (tags.includes('email') || tags.includes('contact')) return 'PERSON';
    if (tags.includes('domain') || tags.includes('subdomain')) return 'DOMAIN';
    if (tags.includes('ip-address') || tags.includes('server')) return 'IP_ADDRESS';
    if (tags.includes('organization') || tags.includes('company')) return 'ORGANIZATION';
    if (tags.includes('location') || tags.includes('geographic')) return 'LOCATION';
    if (tags.includes('vulnerability') || tags.includes('cve')) return 'VULNERABILITY';
    if (tags.includes('threat') || tags.includes('malware')) return 'THREAT_ACTOR';
    if (tags.includes('file') || tags.includes('document')) return 'FILE';
    
    // Analyze data content
    if (typeof data === 'string') {
      if (data.includes('@')) return 'PERSON'; // Email address
      if (data.match(/^\d+\.\d+\.\d+\.\d+$/)) return 'IP_ADDRESS'; // IP address
      if (data.includes('.com') || data.includes('.org')) return 'DOMAIN'; // Domain
    }
    
    return 'CUSTOM'; // Default fallback
  }
  
  private static calculateNodeSize(intelligence: Intelligence): number {
    // Size based on confidence and importance
    const baseSize = 10;
    const confidenceMultiplier = (intelligence.confidence || 50) / 100;
    const reliabilityMultiplier = this.mapReliabilityToConfidence(intelligence.reliability) / 100;
    const implicationMultiplier = (intelligence.implications?.length || 0) * 0.2 + 1;
    
    return Math.max(5, Math.min(30, baseSize * confidenceMultiplier * reliabilityMultiplier * implicationMultiplier));
  }
  
  private static getReliabilityColor(reliability: ReliabilityRating): string {
    const colorMap: Record<ReliabilityRating, string> = {
      'A': '#00ff00', // Green - Completely reliable
      'B': '#80ff00', // Light green - Usually reliable
      'C': '#ffff00', // Yellow - Fairly reliable
      'D': '#ff8000', // Orange - Not usually reliable
      'E': '#ff4000', // Red-orange - Unreliable
      'F': '#808080', // Gray - Cannot be judged
      'X': '#ff0000'  // Red - Deception suspected
    };
    
    return colorMap[reliability] || '#808080';
  }
  
  private static getNodeIcon(nodeType: string): string {
    const iconMap: Record<string, string> = {
      'PERSON': 'person',
      'ORGANIZATION': 'business',
      'DOMAIN': 'language',
      'IP_ADDRESS': 'router',
      'LOCATION': 'place',
      'VULNERABILITY': 'security',
      'THREAT_ACTOR': 'warning',
      'FILE': 'description',
      'SYSTEM': 'computer',
      'EVENT': 'event',
      'CUSTOM': 'help'
    };
    
    return iconMap[nodeType] || 'help';
  }
  
  private static generateNodeLabel(intelligence: Intelligence): string {
    if (typeof intelligence.data === 'string') {
      return intelligence.data.length > 20 
        ? `${intelligence.data.substring(0, 17)}...`
        : intelligence.data;
    }
    
    return `${intelligence.source} Intel`;
  }
}

/**
 * Utility functions for working with the bridge adapter
 */
export class IntelBridgeUtils {
  
  /**
   * Batch transform multiple Intel objects to IntelEntities
   */
  static batchTransformIntelToEntities(intelObjects: Intel[]): EnhancedIntelEntity[] {
    return intelObjects.map(intel => IntelBridgeAdapter.transformIntelToEntity(intel));
  }
  
  /**
   * Batch transform multiple Intelligence objects to NodeEntities
   */
  static batchTransformIntelligenceToNodes(intelligenceObjects: Intelligence[]): NodeEntity[] {
    return intelligenceObjects.map(intelligence => 
      IntelBridgeAdapter.transformIntelligenceToNodeEntity(intelligence)
    );
  }
  
  /**
   * Filter entities by confidence threshold
   */
  static filterByConfidence(entities: EnhancedIntelEntity[], minConfidence: number): EnhancedIntelEntity[] {
    return entities.filter(entity => entity.confidence >= minConfidence);
  }
  
  /**
   * Group entities by reliability rating
   */
  static groupByReliability(entities: EnhancedIntelEntity[]): Record<ReliabilityRating, EnhancedIntelEntity[]> {
    const groups: Record<string, EnhancedIntelEntity[]> = {};
    
    entities.forEach(entity => {
      const reliability = entity.reliability || 'F';
      if (!groups[reliability]) {
        groups[reliability] = [];
      }
      groups[reliability].push(entity);
    });
    
    return groups as Record<ReliabilityRating, EnhancedIntelEntity[]>;
  }
  
  /**
   * Calculate overall confidence for a group of entities
   */
  static calculateGroupConfidence(entities: EnhancedIntelEntity[]): number {
    if (entities.length === 0) return 0;
    
    const totalConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0);
    return totalConfidence / entities.length;
  }
}
