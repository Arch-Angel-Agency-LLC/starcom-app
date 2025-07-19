/**
 * Enhanced NodeWeb Adapter with Intel Architecture Integration
 * 
 * This enhanced adapter extends the existing NodeWeb functionality to support
 * Intel objects with confidence-based visualization, quality indicators,
 * and processing lineage display.
 */

import { 
  NodeEntity, 
  EdgeRelationship,
  IntelQueryOptions,
  IntelEntity
} from '../types/intelDataModels';
import { Intel, Intelligence } from '../../../models/Intel/Intel';
import { storageOrchestrator } from '../storage/storageOrchestrator';

// Import error types for comprehensive error handling
import {
  GraphDataGenerationError,
  NodeTransformationError,
  ConfidenceVisualizationError,
  RelationshipMappingError,
  QualityIndicatorError,
  NodeFilteringError,
  GraphMetricsError,
  NetRunnerErrorHandler
} from '../errors/NetRunnerErrorTypes';
import { useIntelBridge } from '../hooks/useIntelBridge';
import { NodeWebNode, NodeWebEdge, NodeWebGraph } from './nodeWebAdapter';

// Enhanced node types for Intel visualization
export interface EnhancedNodeWebNode extends NodeWebNode {
  // Enhanced Intel properties
  confidence?: number;
  reliability?: string;
  qualityScore?: number;
  osintMetadata?: {
    freshness: number;
    completeness: number;
    accuracy: number;
    relevance: number;
  };
  
  // Visualization enhancements
  confidenceRing?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  qualityIndicator?: {
    enabled: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
    color: string;
  };
  
  // Processing information
  processingLineage?: {
    steps: number;
    duration: number;
    lastProcessed: number;
  };
}

export interface EnhancedNodeWebEdge extends NodeWebEdge {
  // Relationship confidence
  confidence?: number;
  correlationStrength?: number;
  
  // Visualization enhancements
  confidenceWidth?: boolean;
  qualityColor?: boolean;
}

export interface EnhancedNodeWebGraph extends NodeWebGraph {
  nodes: EnhancedNodeWebNode[];
  edges: EnhancedNodeWebEdge[];
  
  // Graph-level intelligence metrics
  intelligence: {
    totalConfidence: number;
    averageQuality: number;
    reliabilityDistribution: Record<string, number>;
    freshnessScore: number;
  };
}

/**
 * Enhanced NodeWeb Adapter for Intel Architecture
 */
export class EnhancedNodeWebAdapter {
  private bridge: ReturnType<typeof useIntelBridge>;
  
  constructor() {
    // Initialize bridge for Intel transformations
    this.bridge = useIntelBridge({
      autoTransform: true,
      confidenceThreshold: 0, // Include all data, filter in visualization
      enableNodeGeneration: true,
      trackLineage: true
    });
  }
  
  /**
   * Get enhanced graph data with Intel visualization
   */
  async getEnhancedGraphData(
    filters?: {
      confidenceThreshold?: number;
      reliabilityFilter?: string[];
      qualityThreshold?: number;
      includeProcessingHistory?: boolean;
    }
  ): Promise<EnhancedNodeWebGraph> {
    const {
      confidenceThreshold = 50,
      reliabilityFilter = ['A', 'B', 'C'],
      qualityThreshold = 40,
      includeProcessingHistory = true
    } = filters || {};
    
    try {
      // Get Intel entities from bridge with error handling
      let entities: any[];
      try {
        entities = this.bridge.entities.filter(entity => {
          // Apply confidence filter
          if (entity.confidence && entity.confidence < confidenceThreshold) return false;
          
          // Apply reliability filter
          if (entity.reliability && !reliabilityFilter.includes(entity.reliability)) return false;
          
          // Apply quality filter
          if (entity.osintMetadata?.qualityIndicators?.accuracy) {
            if (entity.osintMetadata.qualityIndicators.accuracy < qualityThreshold) return false;
          }
          
          return true;
        });
      } catch (error) {
        throw new NodeFilteringError('entity-filtering', error instanceof Error ? error.message : 'Unknown filtering error');
      }
      
      // Transform to enhanced nodes with error handling
      let enhancedNodes: any[];
      try {
        enhancedNodes = entities.map((entity, index) => {
          try {
            return this.transformEntityToEnhancedNode(entity);
          } catch (error) {
            console.warn(`Failed to transform entity ${entity.id || index}:`, error);
            throw new NodeTransformationError(
              entity.id || `entity-${index}`, 
              error instanceof Error ? error.message : 'Unknown transformation error'
            );
          }
        });
      } catch (error) {
        if (error instanceof NodeTransformationError) {
          throw error;
        }
        throw new GraphDataGenerationError('Failed to transform entities to enhanced nodes');
      }
      
      // Generate relationships between Intel entities with error handling
      let enhancedEdges: any[];
      try {
        enhancedEdges = this.generateIntelRelationships(entities);
      } catch (error) {
        console.warn('Failed to generate relationships:', error);
        throw new RelationshipMappingError('*', '*', error instanceof Error ? error.message : 'Unknown relationship error');
      }
      
      // Calculate graph-level intelligence metrics with error handling
      let intelligence: any;
      try {
        intelligence = this.calculateGraphIntelligence(entities);
      } catch (error) {
        console.warn('Failed to calculate graph intelligence:', error);
        throw new GraphMetricsError('graph-intelligence', error instanceof Error ? error.message : 'Unknown metrics error');
      }
      
      return {
        nodes: enhancedNodes,
        edges: enhancedEdges,
        intelligence
      };
      
    } catch (error) {
      // Handle known errors
      if (error instanceof NodeFilteringError || 
          error instanceof NodeTransformationError || 
          error instanceof RelationshipMappingError || 
          error instanceof GraphMetricsError) {
        NetRunnerErrorHandler.handleError(error);
        throw error;
      }
      
      // Handle unknown errors
      const wrappedError = new GraphDataGenerationError(
        error instanceof Error ? error.message : 'Unknown error in graph data generation'
      );
      NetRunnerErrorHandler.handleError(wrappedError);
      
      console.error('Error in getEnhancedGraphData:', error);
      return {
        nodes: [],
        edges: [],
        intelligence: {
          totalConfidence: 0,
          averageQuality: 0,
          reliabilityDistribution: {},
          freshnessScore: 0
        }
      };
    }
  }
  
  /**
   * Transform IntelEntity to Enhanced NodeWeb Node
   */
  private transformEntityToEnhancedNode(entity: any): EnhancedNodeWebNode {
    // Base node properties
    const baseNode: NodeWebNode = {
      id: entity.id,
      label: this.generateNodeLabel(entity),
      type: this.determineNodeType(entity),
      properties: entity.metadata || {},
      metadata: entity,
      tags: entity.tags || []
    };
    
    // Enhanced Intel properties
    const confidence = entity.confidence || entity.confidenceMetrics?.overall || 50;
    const reliability = entity.reliability || 'C';
    const qualityScore = entity.osintMetadata?.qualityIndicators?.accuracy || 
                        entity.bridgeMetadata?.qualityScore || 50;
    
    // Visualization enhancements based on quality
    const enhancedNode: EnhancedNodeWebNode = {
      ...baseNode,
      
      // Intel properties
      confidence,
      reliability,
      qualityScore,
      osintMetadata: entity.osintMetadata?.qualityIndicators,
      
      // Visual enhancements
      size: this.calculateNodeSize(confidence, qualityScore),
      color: this.getConfidenceColor(confidence, reliability),
      
      // Confidence ring visualization
      confidenceRing: {
        enabled: confidence > 60,
        color: this.getConfidenceRingColor(confidence),
        width: Math.max(2, confidence / 25)
      },
      
      // Quality indicator
      qualityIndicator: {
        enabled: qualityScore > 70,
        position: 'top',
        color: this.getQualityColor(qualityScore)
      },
      
      // Processing lineage
      processingLineage: entity.processingLineage ? {
        steps: entity.processingLineage.totalSteps || 0,
        duration: entity.processingLineage.processingDuration || 0,
        lastProcessed: entity.updatedAt ? new Date(entity.updatedAt).getTime() : Date.now()
      } : undefined,
      
      // Enhanced tooltip
      title: this.generateEnhancedTooltip(entity)
    };
    
    return enhancedNode;
  }
  
  /**
   * Generate relationships between Intel entities
   */
  private generateIntelRelationships(entities: any[]): EnhancedNodeWebEdge[] {
    const edges: EnhancedNodeWebEdge[] = [];
    
    // Create relationships based on shared characteristics
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        const relationship = this.analyzeEntityRelationship(entity1, entity2);
        
        if (relationship.strength > 0.3) { // Threshold for showing relationship
          const edge: EnhancedNodeWebEdge = {
            id: `rel-${entity1.id}-${entity2.id}`,
            from: entity1.id,
            to: entity2.id,
            type: relationship.type,
            label: relationship.label,
            metadata: {
              strength: relationship.strength,
              reason: relationship.reason
            },
            tags: ['auto-generated', 'intel-correlation'],
            
            // Enhanced properties
            confidence: Math.round(relationship.strength * 100),
            correlationStrength: relationship.strength,
            
            // Visual properties based on strength
            width: Math.max(1, relationship.strength * 4),
            color: this.getRelationshipColor(relationship.strength),
            confidenceWidth: true,
            qualityColor: true
          };
          
          edges.push(edge);
        }
      }
    }
    
    return edges;
  }
  
  /**
   * Analyze relationship between two Intel entities
   */
  private analyzeEntityRelationship(entity1: any, entity2: any): {
    strength: number;
    type: string;
    label: string;
    reason: string;
  } {
    let strength = 0;
    let type = 'correlation';
    let reason = '';
    
    // Check for shared tags
    const sharedTags = entity1.tags?.filter((tag: string) => 
      entity2.tags?.includes(tag)) || [];
    if (sharedTags.length > 0) {
      strength += sharedTags.length * 0.2;
      reason += `Shared tags: ${sharedTags.join(', ')}. `;
    }
    
    // Check for same source
    if (entity1.source === entity2.source) {
      strength += 0.3;
      reason += `Same source: ${entity1.source}. `;
    }
    
    // Check for domain/email correlation
    if (entity1.tags?.includes('email') && entity2.tags?.includes('domain')) {
      const emailDomain = this.extractDomainFromEmail(entity1.title || entity1.data);
      const domain = entity2.title || entity2.data;
      if (emailDomain && domain && emailDomain.includes(domain)) {
        strength += 0.6;
        type = 'domain-correlation';
        reason += `Email domain correlation. `;
      }
    }
    
    // Check for technology-subdomain correlation
    if (entity1.tags?.includes('technology') && entity2.tags?.includes('subdomain')) {
      strength += 0.4;
      type = 'infrastructure-correlation';
      reason += `Infrastructure correlation. `;
    }
    
    // Check for processing lineage
    if (entity1.derivedFromRawData && entity2.derivedFromRawData) {
      const sharedRawData = entity1.derivedFromRawData.filter((id: string) =>
        entity2.derivedFromRawData?.includes(id)) || [];
      if (sharedRawData.length > 0) {
        strength += 0.5;
        type = 'lineage-correlation';
        reason += `Shared data lineage. `;
      }
    }
    
    return {
      strength: Math.min(1, strength),
      type,
      label: this.getRelationshipLabel(type, strength),
      reason: reason.trim()
    };
  }
  
  /**
   * Calculate graph-level intelligence metrics
   */
  private calculateGraphIntelligence(entities: any[]): {
    totalConfidence: number;
    averageQuality: number;
    reliabilityDistribution: Record<string, number>;
    freshnessScore: number;
  } {
    if (entities.length === 0) {
      return {
        totalConfidence: 0,
        averageQuality: 0,
        reliabilityDistribution: {},
        freshnessScore: 0
      };
    }
    
    // Calculate total confidence
    const totalConfidence = entities.reduce((sum, entity) => 
      sum + (entity.confidence || entity.confidenceMetrics?.overall || 50), 0) / entities.length;
    
    // Calculate average quality
    const averageQuality = entities.reduce((sum, entity) => 
      sum + (entity.osintMetadata?.qualityIndicators?.accuracy || 50), 0) / entities.length;
    
    // Calculate reliability distribution
    const reliabilityDistribution: Record<string, number> = {};
    entities.forEach(entity => {
      const reliability = entity.reliability || 'C';
      reliabilityDistribution[reliability] = (reliabilityDistribution[reliability] || 0) + 1;
    });
    
    // Calculate freshness score
    const now = Date.now();
    const freshnessScore = entities.reduce((sum, entity) => {
      const entityTime = entity.osintMetadata?.collectionTimestamp || 
                        new Date(entity.createdAt).getTime() || now;
      const age = now - entityTime;
      const dayAge = age / (1000 * 60 * 60 * 24);
      const freshness = Math.max(0, 100 - (dayAge * 10)); // 10% penalty per day
      return sum + freshness;
    }, 0) / entities.length;
    
    return {
      totalConfidence: Math.round(totalConfidence),
      averageQuality: Math.round(averageQuality),
      reliabilityDistribution,
      freshnessScore: Math.round(freshnessScore)
    };
  }
  
  // === Helper Methods ===
  
  private generateNodeLabel(entity: any): string {
    if (entity.title) return entity.title;
    if (entity.data) {
      // Truncate long data for display
      return entity.data.length > 30 ? entity.data.substring(0, 27) + '...' : entity.data;
    }
    return entity.id || 'Unknown';
  }
  
  private determineNodeType(entity: any): string {
    if (entity.tags?.includes('email')) return 'email';
    if (entity.tags?.includes('domain') || entity.tags?.includes('subdomain')) return 'domain';
    if (entity.tags?.includes('technology')) return 'technology';
    if (entity.tags?.includes('social-media')) return 'social';
    if (entity.tags?.includes('server')) return 'server';
    return 'intel';
  }
  
  private calculateNodeSize(confidence: number, qualityScore: number): number {
    const baseSize = 20;
    const confidenceBonus = (confidence / 100) * 15;
    const qualityBonus = (qualityScore / 100) * 10;
    return Math.round(baseSize + confidenceBonus + qualityBonus);
  }
  
  private getConfidenceColor(confidence: number, reliability: string): string {
    // Base color on reliability, adjust brightness by confidence
    const reliabilityColors = {
      'A': '#2e7d32', // Dark green
      'B': '#388e3c', // Green  
      'C': '#f57c00', // Orange
      'D': '#f44336', // Red
      'E': '#d32f2f', // Dark red
      'F': '#b71c1c'  // Very dark red
    };
    
    const baseColor = reliabilityColors[reliability as keyof typeof reliabilityColors] || '#757575';
    
    // Adjust opacity based on confidence
    const opacity = Math.max(0.4, confidence / 100);
    return baseColor + Math.round(opacity * 255).toString(16).padStart(2, '0');
  }
  
  private getConfidenceRingColor(confidence: number): string {
    if (confidence > 80) return '#4caf50'; // Green
    if (confidence > 60) return '#ff9800'; // Orange  
    return '#f44336'; // Red
  }
  
  private getQualityColor(qualityScore: number): string {
    if (qualityScore > 80) return '#2196f3'; // Blue
    if (qualityScore > 60) return '#9c27b0'; // Purple
    return '#607d8b'; // Blue Grey
  }
  
  private getRelationshipColor(strength: number): string {
    if (strength > 0.7) return '#4caf50'; // Strong - Green
    if (strength > 0.5) return '#ff9800'; // Medium - Orange
    return '#2196f3'; // Weak - Blue
  }
  
  private getRelationshipLabel(type: string, strength: number): string {
    const strengthText = strength > 0.7 ? 'Strong' : strength > 0.5 ? 'Medium' : 'Weak';
    const typeLabels = {
      'correlation': 'Correlation',
      'domain-correlation': 'Domain Match',
      'infrastructure-correlation': 'Infrastructure',
      'lineage-correlation': 'Data Lineage'
    };
    return `${strengthText} ${typeLabels[type as keyof typeof typeLabels] || 'Relation'}`;
  }
  
  private generateEnhancedTooltip(entity: any): string {
    const lines = [];
    
    // Basic info
    lines.push(`<strong>${entity.title || entity.data || 'Intel Entity'}</strong>`);
    lines.push(`Source: ${entity.source}`);
    
    // Quality metrics
    if (entity.confidence) {
      lines.push(`Confidence: ${entity.confidence}%`);
    }
    if (entity.reliability) {
      lines.push(`Reliability: ${entity.reliability}`);
    }
    
    // OSINT metadata
    if (entity.osintMetadata?.qualityIndicators) {
      const qi = entity.osintMetadata.qualityIndicators;
      lines.push(`Quality: ${qi.accuracy}% | Fresh: ${qi.freshness}%`);
    }
    
    // Processing info
    if (entity.processingLineage) {
      lines.push(`Processed: ${entity.processingLineage.totalSteps} steps`);
    }
    
    // Tags
    if (entity.tags?.length > 0) {
      lines.push(`Tags: ${entity.tags.slice(0, 3).join(', ')}${entity.tags.length > 3 ? '...' : ''}`);
    }
    
    return lines.join('<br/>');
  }
  
  private extractDomainFromEmail(email: string): string | null {
    const match = email.match(/@([^@]+)$/);
    return match ? match[1] : null;
  }
  
  /**
   * Get real-time updates for Intel visualization
   */
  subscribeToIntelUpdates(callback: (graph: EnhancedNodeWebGraph) => void): () => void {
    // This would integrate with your event system
    const interval = setInterval(async () => {
      const graph = await this.getEnhancedGraphData();
      if (graph.nodes.length > 0) {
        callback(graph);
      }
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }
}

// Export enhanced adapter instance
export const enhancedNodeWebAdapter = new EnhancedNodeWebAdapter();
