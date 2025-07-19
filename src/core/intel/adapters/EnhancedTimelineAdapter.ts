/**
 * Enhanced Timeline Adapter with Intel Architecture Integration
 * 
 * This enhanced adapter extends the existing Timeline functionality to support
 * Intel processing history, temporal intelligence visualization, and
 * confidence-based timeline events.
 */

import { 
  TimelineEvent,
  EventType,
  IntelQueryOptions 
} from '../types/intelDataModels';
import { Intel, Intelligence } from '../../../models/Intel/Intel';
import { IntelEntity } from '../types/intelDataModels';
import { storageOrchestrator } from '../storage/storageOrchestrator';

// Import error types for comprehensive error handling
import {
  TimelineDataGenerationError,
  CollectionTimelineError,
  ProcessingTimelineError,
  TemporalAnalysisError,
  TimelineEventCreationError,
  ConfidenceProgressionError,
  ProcessingStageVisualizationError,
  TimelineFilteringError,
  TimelineMetricsError,
  EntityProcessingTimelineError,
  NetRunnerErrorHandler
} from '../errors/NetRunnerErrorTypes';

import { useIntelBridge } from '../hooks/useIntelBridge';
import { TimelineItem, TimelineGroup, TimelineData } from './timelineAdapter';

// Enhanced timeline types for Intel processing
export interface IntelTimelineItem extends TimelineItem {
  // Intel-specific properties
  confidence?: number;
  reliability?: string;
  processingStage?: 'collection' | 'processing' | 'analysis' | 'visualization';
  qualityScore?: number;
  
  // Visual enhancements
  confidenceBar?: {
    enabled: boolean;
    height: number;
    color: string;
  };
  processingIndicator?: {
    enabled: boolean;
    stage: string;
    color: string;
  };
  
  // Lineage information
  derivedFrom?: string[];
  processingSteps?: Array<{
    stage: string;
    timestamp: number;
    processor: string;
    confidence: number;
  }>;
}

export interface IntelTimelineData extends TimelineData {
  items: IntelTimelineItem[];
  
  // Timeline-level intelligence metrics
  intelligence: {
    totalEvents: number;
    averageConfidence: number;
    processingDuration: number;
    qualityDistribution: Record<string, number>;
    timeSpan: {
      start: number;
      end: number;
      duration: number;
    };
  };
}

/**
 * Enhanced Timeline Adapter for Intel Architecture
 */
export class EnhancedTimelineAdapter {
  private bridge: ReturnType<typeof useIntelBridge>;
  
  constructor() {
    this.bridge = useIntelBridge({
      autoTransform: true,
      confidenceThreshold: 0,
      enableNodeGeneration: false, // Timeline doesn't need nodes
      trackLineage: true
    });
  }
  
  /**
   * Get enhanced timeline data with Intel processing history
   */
  async getIntelTimelineData(
    filters?: {
      dateRange?: { start: Date; end: Date };
      confidenceThreshold?: number;
      reliabilityFilter?: string[];
      showProcessingHistory?: boolean;
      groupBySource?: boolean;
    }
  ): Promise<IntelTimelineData> {
    const {
      dateRange,
      confidenceThreshold = 30,
      reliabilityFilter = ['A', 'B', 'C', 'D'],
      showProcessingHistory = true,
      groupBySource = true
    } = filters || {};
    
    try {
      // Get Intel entities from bridge
      let entities = this.bridge.entities.filter(entity => {
        // Apply confidence filter
        if (entity.confidence && entity.confidence < confidenceThreshold) return false;
        
        // Apply reliability filter
        if (entity.reliability && !reliabilityFilter.includes(entity.reliability)) return false;
        
        // Apply date range filter
        if (dateRange) {
          const entityDate = entity.osintMetadata?.collectionTimestamp || 
                            new Date(entity.createdAt).getTime();
          if (entityDate < dateRange.start.getTime() || entityDate > dateRange.end.getTime()) {
            return false;
          }
        }
        
        return true;
      });
      
      // Transform entities to timeline items
      const timelineItems: IntelTimelineItem[] = [];
      
      // Add collection events
      entities.forEach(entity => {
        const collectionItem = this.createCollectionTimelineItem(entity);
        timelineItems.push(collectionItem);
        
        // Add processing history if enabled
        if (showProcessingHistory && entity.processingLineage?.lineage) {
          const processingItems = this.createProcessingTimelineItems(entity);
          timelineItems.push(...processingItems);
        }
      });
      
      // Sort by timestamp
      timelineItems.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      // Create groups
      const groups = groupBySource ? this.createSourceGroups(entities) : this.createDefaultGroups();
      
      // Calculate intelligence metrics
      const intelligence = this.calculateTimelineIntelligence(timelineItems, entities);
      
      return {
        items: timelineItems,
        groups,
        intelligence
      };
      
    } catch (error) {
      console.error('Error in getIntelTimelineData:', error);
      return {
        items: [],
        groups: [],
        intelligence: {
          totalEvents: 0,
          averageConfidence: 0,
          processingDuration: 0,
          qualityDistribution: {},
          timeSpan: { start: 0, end: 0, duration: 0 }
        }
      };
    }
  }
  
  /**
   * Create timeline item for data collection event
   */
  private createCollectionTimelineItem(entity: any): IntelTimelineItem {
    const collectionTime = entity.osintMetadata?.collectionTimestamp || 
                          new Date(entity.createdAt).getTime();
    
    const confidence = entity.confidence || entity.confidenceMetrics?.overall || 50;
    const qualityScore = entity.osintMetadata?.qualityIndicators?.accuracy || 50;
    
    return {
      id: `collection-${entity.id}`,
      title: `Intel Collected: ${this.getEntityDisplayName(entity)}`,
      description: this.generateCollectionDescription(entity),
      startTime: new Date(collectionTime),
      group: entity.source || 'unknown',
      type: 'collection',
      importance: Math.round(confidence / 20), // 1-5 scale
      isEstimated: false,
      relatedIds: [entity.id],
      color: this.getConfidenceColor(confidence),
      icon: this.getEntityIcon(entity),
      metadata: {
        originalEntity: entity,
        confidence,
        reliability: entity.reliability,
        qualityScore
      },
      tags: ['intel', 'collection', ...(entity.tags || [])],
      
      // Enhanced Intel properties
      confidence,
      reliability: entity.reliability,
      processingStage: 'collection',
      qualityScore,
      
      // Visual enhancements
      confidenceBar: {
        enabled: true,
        height: Math.max(2, confidence / 10),
        color: this.getConfidenceBarColor(confidence)
      },
      processingIndicator: {
        enabled: true,
        stage: 'Collection',
        color: '#2196f3'
      },
      
      // Lineage
      derivedFrom: entity.derivedFromRawData || []
    };
  }
  
  /**
   * Create timeline items for processing history
   */
  private createProcessingTimelineItems(entity: any): IntelTimelineItem[] {
    if (!entity.processingLineage?.lineage) return [];
    
    return entity.processingLineage.lineage.map((step: any, index: number) => ({
      id: `processing-${entity.id}-${index}`,
      title: `${step.transformationType}: ${this.getEntityDisplayName(entity)}`,
      description: `${step.type} processed with ${step.confidence}% confidence`,
      startTime: new Date(step.timestamp),
      group: `processing-${step.transformationType}`,
      type: 'processing',
      importance: Math.round(step.confidence / 20),
      isEstimated: false,
      relatedIds: [entity.id, step.id],
      color: this.getProcessingStageColor(step.transformationType),
      icon: this.getProcessingStageIcon(step.transformationType),
      metadata: {
        originalEntity: entity,
        processingStep: step
      },
      tags: ['intel', 'processing', step.transformationType],
      
      // Enhanced Intel properties
      confidence: step.confidence,
      processingStage: step.transformationType,
      qualityScore: entity.bridgeMetadata?.qualityScore || 50,
      
      // Visual enhancements
      confidenceBar: {
        enabled: true,
        height: Math.max(1, step.confidence / 15),
        color: this.getConfidenceBarColor(step.confidence)
      },
      processingIndicator: {
        enabled: true,
        stage: step.transformationType,
        color: this.getProcessingStageColor(step.transformationType)
      },
      
      // Processing steps
      processingSteps: [step]
    }));
  }
  
  /**
   * Create source-based groups
   */
  private createSourceGroups(entities: any[]): TimelineGroup[] {
    const sources = new Set(entities.map(entity => entity.source || 'unknown'));
    
    return Array.from(sources).map(source => ({
      id: source,
      title: this.getSourceDisplayName(source),
      color: this.getSourceColor(source)
    }));
  }
  
  /**
   * Create default processing groups
   */
  private createDefaultGroups(): TimelineGroup[] {
    return [
      { id: 'OSINT', title: 'OSINT Collection', color: '#2196f3' },
      { id: 'netrunner-websitescanner', title: 'NetRunner Scanner', color: '#4caf50' },
      { id: 'processing-collection', title: 'Data Processing', color: '#ff9800' },
      { id: 'processing-analysis', title: 'Analysis', color: '#9c27b0' },
      { id: 'processing-visualization', title: 'Visualization', color: '#607d8b' }
    ];
  }
  
  /**
   * Calculate timeline intelligence metrics
   */
  private calculateTimelineIntelligence(
    timelineItems: IntelTimelineItem[], 
    entities: any[]
  ): {
    totalEvents: number;
    averageConfidence: number;
    processingDuration: number;
    qualityDistribution: Record<string, number>;
    timeSpan: { start: number; end: number; duration: number };
  } {
    if (timelineItems.length === 0) {
      return {
        totalEvents: 0,
        averageConfidence: 0,
        processingDuration: 0,
        qualityDistribution: {},
        timeSpan: { start: 0, end: 0, duration: 0 }
      };
    }
    
    // Calculate average confidence
    const averageConfidence = timelineItems.reduce((sum, item) => 
      sum + (item.confidence || 50), 0) / timelineItems.length;
    
    // Calculate processing duration
    const processingDuration = entities.reduce((sum, entity) => {
      if (entity.processingLineage?.processingDuration) {
        return sum + entity.processingLineage.processingDuration;
      }
      return sum;
    }, 0);
    
    // Quality distribution
    const qualityDistribution: Record<string, number> = {};
    entities.forEach(entity => {
      const quality = entity.osintMetadata?.qualityIndicators?.accuracy || 50;
      const bucket = this.getQualityBucket(quality);
      qualityDistribution[bucket] = (qualityDistribution[bucket] || 0) + 1;
    });
    
    // Time span
    const timestamps = timelineItems.map(item => item.startTime.getTime());
    const start = Math.min(...timestamps);
    const end = Math.max(...timestamps);
    
    return {
      totalEvents: timelineItems.length,
      averageConfidence: Math.round(averageConfidence),
      processingDuration,
      qualityDistribution,
      timeSpan: {
        start,
        end,
        duration: end - start
      }
    };
  }
  
  // === Helper Methods ===
  
  private getEntityDisplayName(entity: any): string {
    if (entity.title) return entity.title;
    if (entity.data) {
      return entity.data.length > 25 ? entity.data.substring(0, 22) + '...' : entity.data;
    }
    return 'Intel Entity';
  }
  
  private generateCollectionDescription(entity: any): string {
    const parts = [];
    
    if (entity.source) parts.push(`Source: ${entity.source}`);
    if (entity.reliability) parts.push(`Reliability: ${entity.reliability}`);
    if (entity.confidence) parts.push(`Confidence: ${entity.confidence}%`);
    if (entity.tags?.length > 0) parts.push(`Tags: ${entity.tags.slice(0, 3).join(', ')}`);
    
    return parts.join(' | ');
  }
  
  private getEntityIcon(entity: any): string {
    if (entity.tags?.includes('email')) return '📧';
    if (entity.tags?.includes('domain')) return '🌐';
    if (entity.tags?.includes('technology')) return '⚙️';
    if (entity.tags?.includes('social-media')) return '📱';
    if (entity.tags?.includes('server')) return '🖥️';
    return '📊';
  }
  
  private getConfidenceColor(confidence: number): string {
    if (confidence > 80) return '#4caf50'; // Green
    if (confidence > 60) return '#ff9800'; // Orange
    if (confidence > 40) return '#ffeb3b'; // Yellow
    return '#f44336'; // Red
  }
  
  private getConfidenceBarColor(confidence: number): string {
    if (confidence > 80) return '#2e7d32'; // Dark green
    if (confidence > 60) return '#f57c00'; // Dark orange
    if (confidence > 40) return '#fbc02d'; // Dark yellow
    return '#d32f2f'; // Dark red
  }
  
  private getProcessingStageColor(stage: string): string {
    const colors = {
      'collection': '#2196f3',
      'processing': '#ff9800',
      'analysis': '#9c27b0',
      'visualization': '#607d8b'
    };
    return colors[stage as keyof typeof colors] || '#757575';
  }
  
  private getProcessingStageIcon(stage: string): string {
    const icons = {
      'collection': '📥',
      'processing': '⚡',
      'analysis': '🔍',
      'visualization': '📈'
    };
    return icons[stage as keyof typeof icons] || '🔧';
  }
  
  private getSourceDisplayName(source: string): string {
    const displayNames = {
      'OSINT': 'OSINT Collection',
      'netrunner-websitescanner': 'NetRunner Scanner',
      'netrunner-enhanced-websitescanner': 'Enhanced NetRunner'
    };
    return displayNames[source as keyof typeof displayNames] || source;
  }
  
  private getSourceColor(source: string): string {
    const colors = {
      'OSINT': '#2196f3',
      'netrunner-websitescanner': '#4caf50',
      'netrunner-enhanced-websitescanner': '#8bc34a'
    };
    return colors[source as keyof typeof colors] || '#757575';
  }
  
  private getQualityBucket(quality: number): string {
    if (quality > 80) return 'High';
    if (quality > 60) return 'Medium';
    if (quality > 40) return 'Low';
    return 'Poor';
  }
  
  /**
   * Get processing lineage timeline for specific entity
   */
  async getEntityProcessingTimeline(entityId: string): Promise<IntelTimelineData> {
    try {
      const entity = this.bridge.entities.find(e => e.id === entityId);
      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }
      
      const timelineItems: IntelTimelineItem[] = [];
      
      // Add collection event
      timelineItems.push(this.createCollectionTimelineItem(entity));
      
      // Add processing history
      if (entity.processingLineage?.lineage) {
        timelineItems.push(...this.createProcessingTimelineItems(entity));
      }
      
      const intelligence = this.calculateTimelineIntelligence(timelineItems, [entity]);
      
      return {
        items: timelineItems.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
        groups: this.createDefaultGroups(),
        intelligence
      };
      
    } catch (error) {
      console.error('Error getting entity processing timeline:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to real-time timeline updates
   */
  subscribeToTimelineUpdates(callback: (timeline: IntelTimelineData) => void): () => void {
    const interval = setInterval(async () => {
      const timeline = await this.getIntelTimelineData();
      if
