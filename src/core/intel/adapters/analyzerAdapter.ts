/**
 * AnalyzerAdapter - Adapter for Analyzer integration with IntelDataCore
 * 
 * This adapter connects the Analyzer module to the IntelDataCore system
 * by providing data transformation, query functions, and event synchronization.
 */

import { 
  BaseEntity,
  IntelQueryOptions,
  IntelEntity,
  ClassificationLevel,
  CaseRecord
} from '../types/intelDataModels';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { storageOrchestrator } from '../storage/storageOrchestrator';

// Types for Analyzer module
export interface AnalysisEntity {
  id: string;
  title: string;
  description: string;
  entityType: string;
  source: string;
  sourceUrl?: string;
  content: string;
  extracted: {
    entities: ExtractedEntity[];
    relationships: ExtractedRelationship[];
    concepts: ExtractedConcept[];
    sentiments: ExtractedSentiment[];
  };
  classification: ClassificationLevel;
  confidence: number;
  analysisDate: string;
  analysisTechniques: string[];
  tags: string[];
  metadata: Record<string, any>;
  relatedCases: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ExtractedEntity {
  id: string;
  text: string;
  type: string;
  relevance: number;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  metadata?: Record<string, any>;
}

export interface ExtractedRelationship {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  sourceText: string;
  targetText: string;
  confidence: number;
  context: string;
  metadata?: Record<string, any>;
}

export interface ExtractedConcept {
  id: string;
  text: string;
  relevance: number;
  references: number;
  metadata?: Record<string, any>;
}

export interface ExtractedSentiment {
  id: string;
  target: string;
  score: number; // -1 to 1 (negative to positive)
  position: {
    start: number;
    end: number;
  };
  metadata?: Record<string, any>;
}

export interface AnalysisRequest {
  content: string;
  contentType: 'text' | 'html' | 'pdf' | 'image' | 'audio' | 'video';
  sourceUrl?: string;
  title?: string;
  options?: {
    extractEntities?: boolean;
    extractRelationships?: boolean;
    extractConcepts?: boolean;
    extractSentiments?: boolean;
    language?: string;
  };
  metadata?: Record<string, any>;
}

export interface AnalysisResult {
  analysisId: string;
  entity: AnalysisEntity;
  status: 'complete' | 'failed';
  error?: string;
}

export interface AnalyzerFilter {
  property: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
  value: any;
}

export interface AnalyzerStats {
  totalAnalyses: number;
  entityTypeDistribution: Record<string, number>;
  conceptDistribution: Record<string, number>;
  averageConfidence: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recentActivity: {
    created: number;
    updated: number;
  };
}

/**
 * Analyzer adapter class for IntelDataCore
 */
export class AnalyzerAdapter {
  private listeners: Array<{ unsubscribe: () => void }> = [];
  
  constructor() {
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for real-time updates
   */
  private setupEventListeners(): void {
    // Listen for analysis entity events
    const analysisCreatedListener = enhancedEventEmitter.on('entity:created', (event) => {
      if (event.entityType === 'analysis_entity') {
        enhancedEventEmitter.emit('analysis:created', {
          analysisId: event.entityId,
          analysis: this.transformIntelEntityToAnalysisEntity(event.entity as IntelEntity)
        });
      }
    });
    
    const analysisUpdatedListener = enhancedEventEmitter.on('entity:updated', (event) => {
      if (event.entityType === 'analysis_entity') {
        enhancedEventEmitter.emit('analysis:updated', {
          analysisId: event.entityId,
          analysis: this.transformIntelEntityToAnalysisEntity(event.entity as IntelEntity),
          changes: event.changes
        });
      }
    });
    
    const analysisDeletedListener = enhancedEventEmitter.on('entity:deleted', (event) => {
      if (event.entityType === 'analysis_entity') {
        enhancedEventEmitter.emit('analysis:deleted', {
          analysisId: event.entityId
        });
      }
    });
    
    // Listen for case updates that might affect analysis entities
    const caseUpdatedListener = enhancedEventEmitter.on('case:updated', (event) => {
      if (event.changes && event.changes.relatedEntities) {
        // Check if any analysis entities were added to the case
        const addedEntities = event.changes.relatedEntities.added || [];
        if (addedEntities.length > 0) {
          this.getAnalysesForEntities(addedEntities).then(analyses => {
            if (analyses.length > 0) {
              enhancedEventEmitter.emit('analysis:linked:case', {
                caseId: event.caseId,
                analyses: analyses
              });
            }
          });
        }
      }
    });
    
    // Store all listeners for cleanup
    this.listeners = [
      analysisCreatedListener,
      analysisUpdatedListener,
      analysisDeletedListener,
      caseUpdatedListener
    ];
  }
  
  /**
   * Get analyses related to specific entities
   */
  private async getAnalysesForEntities(entityIds: string[]): Promise<AnalysisEntity[]> {
    try {
      const analyses: AnalysisEntity[] = [];
      
      // Query for analysis entities that reference these entities
      for (const entityId of entityIds) {
        const queryFilters = [
          {
            field: 'type',
            operator: 'equals',
            value: 'analysis_entity'
          },
          {
            field: 'metadata.analyzedEntities',
            operator: 'contains',
            value: entityId
          }
        ];
        
        const results = await storageOrchestrator.queryEntities<IntelEntity>({
          filters: queryFilters
        });
        
        if (results.length > 0) {
          const analysisEntities = results.map(entity => 
            this.transformIntelEntityToAnalysisEntity(entity)
          );
          analyses.push(...analysisEntities);
        }
      }
      
      return analyses;
    } catch (error) {
      console.error('Error fetching analyses for entities:', error);
      return [];
    }
  }
  
  /**
   * Clean up event listeners when adapter is no longer needed
   */
  public dispose(): void {
    this.listeners.forEach(listener => listener.unsubscribe());
    this.listeners = [];
  }
  
  /**
   * Transform an IntelEntity to an AnalysisEntity
   */
  private transformIntelEntityToAnalysisEntity(intelEntity: IntelEntity): AnalysisEntity {
    // Default empty extracted data
    const defaultExtracted = {
      entities: [],
      relationships: [],
      concepts: [],
      sentiments: []
    };
    
    // Extract or use default values from metadata
    const metadata = intelEntity.metadata || {};
    const extracted = metadata.extracted || defaultExtracted;
    const analysisDate = metadata.analysisDate || intelEntity.createdAt;
    const analysisTechniques = metadata.analysisTechniques || [];
    const confidence = metadata.confidence || 50;
    const relatedCases = metadata.relatedCases || [];
    
    return {
      id: intelEntity.id,
      title: intelEntity.title,
      description: intelEntity.description,
      entityType: metadata.entityType || 'unknown',
      source: intelEntity.source,
      sourceUrl: intelEntity.sourceUrl,
      content: metadata.content || '',
      extracted: extracted,
      classification: intelEntity.classification,
      confidence: confidence,
      analysisDate: analysisDate,
      analysisTechniques: analysisTechniques,
      tags: intelEntity.tags,
      metadata: metadata,
      relatedCases: relatedCases,
      createdAt: intelEntity.createdAt,
      updatedAt: intelEntity.updatedAt,
      createdBy: intelEntity.createdBy
    };
  }
  
  /**
   * Transform an AnalysisEntity to an IntelEntity
   */
  private transformAnalysisEntityToIntelEntity(analysisEntity: AnalysisEntity): IntelEntity {
    return {
      id: analysisEntity.id,
      type: 'analysis_entity',
      title: analysisEntity.title,
      description: analysisEntity.description,
      classification: analysisEntity.classification,
      source: analysisEntity.source,
      sourceUrl: analysisEntity.sourceUrl,
      verified: analysisEntity.confidence > 75, // Consider verified if confidence is high
      tags: analysisEntity.tags,
      createdAt: analysisEntity.createdAt,
      updatedAt: analysisEntity.updatedAt,
      createdBy: analysisEntity.createdBy,
      metadata: {
        ...analysisEntity.metadata,
        entityType: analysisEntity.entityType,
        content: analysisEntity.content,
        extracted: analysisEntity.extracted,
        analysisDate: analysisEntity.analysisDate,
        analysisTechniques: analysisEntity.analysisTechniques,
        confidence: analysisEntity.confidence,
        relatedCases: analysisEntity.relatedCases
      }
    };
  }
  
  /**
   * Get a specific analysis entity by ID
   */
  async getAnalysis(id: string): Promise<AnalysisEntity | null> {
    try {
      const intelEntity = await storageOrchestrator.getEntity<IntelEntity>(id);
      
      if (!intelEntity || intelEntity.type !== 'analysis_entity') {
        return null;
      }
      
      return this.transformIntelEntityToAnalysisEntity(intelEntity);
    } catch (error) {
      console.error('Error fetching analysis entity:', error);
      return null;
    }
  }
  
  /**
   * Query analysis entities using filters
   */
  async queryAnalyses(filters: AnalyzerFilter[] = [], options: IntelQueryOptions = {}): Promise<AnalysisEntity[]> {
    try {
      // Convert analyzer filters to intel query filters
      const queryFilters = filters.map(filter => ({
        field: filter.property,
        operator: filter.operator,
        value: filter.value
      }));
      
      // Add type filter to ensure we only get analysis entities
      queryFilters.push({
        field: 'type',
        operator: 'equals',
        value: 'analysis_entity'
      });
      
      const intelEntities = await storageOrchestrator.queryEntities<IntelEntity>({
        ...options,
        filters: queryFilters
      });
      
      return intelEntities.map(entity => this.transformIntelEntityToAnalysisEntity(entity));
    } catch (error) {
      console.error('Error querying analysis entities:', error);
      return [];
    }
  }
  
  /**
   * Create a new analysis entity
   */
  async createAnalysis(analysis: Omit<AnalysisEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalysisEntity> {
    try {
      const intelEntity = this.transformAnalysisEntityToIntelEntity({
        ...analysis,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as AnalysisEntity);
      
      const createdEntity = await storageOrchestrator.createEntity<IntelEntity>(intelEntity);
      return this.transformIntelEntityToAnalysisEntity(createdEntity);
    } catch (error) {
      console.error('Error creating analysis entity:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing analysis entity
   */
  async updateAnalysis(id: string, updates: Partial<AnalysisEntity>): Promise<AnalysisEntity> {
    try {
      // First get the current analysis to ensure it exists
      const currentAnalysis = await this.getAnalysis(id);
      if (!currentAnalysis) {
        throw new Error(`Analysis with ID ${id} not found`);
      }
      
      // Transform updates to entity updates
      const entityUpdates: Partial<IntelEntity> = {};
      
      if (updates.title) entityUpdates.title = updates.title;
      if (updates.description) entityUpdates.description = updates.description;
      if (updates.source) entityUpdates.source = updates.source;
      if (updates.sourceUrl) entityUpdates.sourceUrl = updates.sourceUrl;
      if (updates.classification) entityUpdates.classification = updates.classification;
      if (updates.tags) entityUpdates.tags = updates.tags;
      
      // Handle metadata updates
      entityUpdates.metadata = { ...currentAnalysis.metadata };
      
      if (updates.entityType) entityUpdates.metadata.entityType = updates.entityType;
      if (updates.content) entityUpdates.metadata.content = updates.content;
      if (updates.extracted) entityUpdates.metadata.extracted = updates.extracted;
      if (updates.confidence) {
        entityUpdates.metadata.confidence = updates.confidence;
        entityUpdates.verified = updates.confidence > 75;
      }
      if (updates.analysisDate) entityUpdates.metadata.analysisDate = updates.analysisDate;
      if (updates.analysisTechniques) entityUpdates.metadata.analysisTechniques = updates.analysisTechniques;
      if (updates.relatedCases) entityUpdates.metadata.relatedCases = updates.relatedCases;
      if (updates.metadata) entityUpdates.metadata = { ...entityUpdates.metadata, ...updates.metadata };
      
      // Update the entity
      const updatedEntity = await storageOrchestrator.updateEntity<IntelEntity>(id, entityUpdates);
      return this.transformIntelEntityToAnalysisEntity(updatedEntity);
    } catch (error) {
      console.error('Error updating analysis entity:', error);
      throw error;
    }
  }
  
  /**
   * Delete an analysis entity
   */
  async deleteAnalysis(id: string): Promise<boolean> {
    try {
      return await storageOrchestrator.deleteEntity(id);
    } catch (error) {
      console.error('Error deleting analysis entity:', error);
      return false;
    }
  }
  
  /**
   * Run analysis on content and create a new analysis entity
   */
  async analyzeContent(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      // This would connect to actual analysis services in a real implementation
      // For now, we'll create a simulated analysis
      
      const analysisId = `analysis_${Date.now()}`;
      const now = new Date().toISOString();
      
      // Generate a simple mock analysis based on the content
      const mockAnalysis: Omit<AnalysisEntity, 'id' | 'createdAt' | 'updatedAt'> = {
        title: request.title || `Analysis of ${request.contentType} content`,
        description: `Automated analysis of ${request.contentType} content`,
        entityType: request.contentType,
        source: 'STARCOM Analyzer',
        sourceUrl: request.sourceUrl,
        content: request.content,
        extracted: this.generateMockExtraction(request.content),
        classification: ClassificationLevel.UNCLASSIFIED,
        confidence: 85,
        analysisDate: now,
        analysisTechniques: ['natural language processing', 'entity extraction', 'sentiment analysis'],
        tags: ['automated-analysis', request.contentType],
        metadata: request.metadata || {},
        relatedCases: [],
        createdBy: 'system'
      };
      
      // Create the analysis entity
      const createdAnalysis = await this.createAnalysis(mockAnalysis);
      
      return {
        analysisId: createdAnalysis.id,
        entity: createdAnalysis,
        status: 'complete'
      };
    } catch (error) {
      console.error('Error analyzing content:', error);
      return {
        analysisId: `failed_${Date.now()}`,
        entity: null as unknown as AnalysisEntity,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Generate mock extraction results for demonstration purposes
   */
  private generateMockExtraction(content: string): {
    entities: ExtractedEntity[];
    relationships: ExtractedRelationship[];
    concepts: ExtractedConcept[];
    sentiments: ExtractedSentiment[];
  } {
    // This is a very simple mock implementation
    // In a real system, this would use NLP and ML models
    
    const entities: ExtractedEntity[] = [];
    const relationships: ExtractedRelationship[] = [];
    const concepts: ExtractedConcept[] = [];
    const sentiments: ExtractedSentiment[] = [];
    
    // Simple entity extraction - look for capitalized words as potential entities
    const entityRegex = /\b[A-Z][a-zA-Z]{2,}\b/g;
    let match;
    while ((match = entityRegex.exec(content)) !== null) {
      const entityText = match[0];
      const entity: ExtractedEntity = {
        id: `entity_${Date.now()}_${entities.length}`,
        text: entityText,
        type: 'PERSON', // Mock type
        relevance: Math.random() * 0.5 + 0.5, // Random relevance between 0.5 and 1
        confidence: Math.random() * 0.3 + 0.7, // Random confidence between 0.7 and 1
        position: {
          start: match.index,
          end: match.index + entityText.length
        }
      };
      entities.push(entity);
    }
    
    // Create some mock relationships between entities if we have multiple entities
    if (entities.length >= 2) {
      for (let i = 0; i < Math.min(entities.length - 1, 3); i++) {
        const sourceEntity = entities[i];
        const targetEntity = entities[i + 1];
        
        const relationship: ExtractedRelationship = {
          id: `rel_${Date.now()}_${i}`,
          type: 'ASSOCIATED_WITH',
          sourceId: sourceEntity.id,
          targetId: targetEntity.id,
          sourceText: sourceEntity.text,
          targetText: targetEntity.text,
          confidence: Math.random() * 0.4 + 0.6, // Random confidence between 0.6 and 1
          context: content.substring(
            Math.max(0, sourceEntity.position.start - 20),
            Math.min(content.length, targetEntity.position.end + 20)
          )
        };
        relationships.push(relationship);
      }
    }
    
    // Extract some concepts based on word frequency
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const wordCounts: Record<string, number> = {};
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Sort words by frequency and take the top 5
    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    topWords.forEach(([word, count], index) => {
      const concept: ExtractedConcept = {
        id: `concept_${Date.now()}_${index}`,
        text: word,
        relevance: Math.random() * 0.3 + 0.7, // Random relevance between 0.7 and 1
        references: count
      };
      concepts.push(concept);
    });
    
    // Generate a simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'benefit'];
    const negativeWords = ['bad', 'terrible', 'negative', 'failure', 'risk', 'problem'];
    
    const contentLower = content.toLowerCase();
    let sentimentIndex = 0;
    
    // Look for positive sentiment targets
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      let sentimentMatch;
      
      while ((sentimentMatch = regex.exec(contentLower)) !== null) {
        // Look for a nearby entity or noun to associate with this sentiment
        let targetText = 'overall';
        
        // Check if there's an entity within 50 characters
        const nearbyEntity = entities.find(entity => 
          Math.abs(entity.position.start - sentimentMatch.index) < 50
        );
        
        if (nearbyEntity) {
          targetText = nearbyEntity.text;
        }
        
        const sentiment: ExtractedSentiment = {
          id: `sentiment_${Date.now()}_${sentimentIndex++}`,
          target: targetText,
          score: Math.random() * 0.5 + 0.5, // Random positive score between 0.5 and 1
          position: {
            start: sentimentMatch.index,
            end: sentimentMatch.index + word.length
          }
        };
        sentiments.push(sentiment);
      }
    });
    
    // Look for negative sentiment targets
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      let sentimentMatch;
      
      while ((sentimentMatch = regex.exec(contentLower)) !== null) {
        // Look for a nearby entity or noun to associate with this sentiment
        let targetText = 'overall';
        
        // Check if there's an entity within 50 characters
        const nearbyEntity = entities.find(entity => 
          Math.abs(entity.position.start - sentimentMatch.index) < 50
        );
        
        if (nearbyEntity) {
          targetText = nearbyEntity.text;
        }
        
        const sentiment: ExtractedSentiment = {
          id: `sentiment_${Date.now()}_${sentimentIndex++}`,
          target: targetText,
          score: Math.random() * -0.5 - 0.5, // Random negative score between -0.5 and -1
          position: {
            start: sentimentMatch.index,
            end: sentimentMatch.index + word.length
          }
        };
        sentiments.push(sentiment);
      }
    });
    
    // Add a neutral overall sentiment if we don't have any sentiments
    if (sentiments.length === 0) {
      sentiments.push({
        id: `sentiment_${Date.now()}_overall`,
        target: 'overall',
        score: 0,
        position: {
          start: 0,
          end: 0
        }
      });
    }
    
    return {
      entities,
      relationships,
      concepts,
      sentiments
    };
  }
  
  /**
   * Link an analysis to a case
   */
  async linkAnalysisToCase(analysisId: string, caseId: string): Promise<boolean> {
    try {
      // Get the current analysis
      const analysis = await this.getAnalysis(analysisId);
      if (!analysis) {
        throw new Error(`Analysis with ID ${analysisId} not found`);
      }
      
      // Check if it's already linked to this case
      if (analysis.relatedCases.includes(caseId)) {
        return true;
      }
      
      // Update the analysis with the case reference
      const updatedRelatedCases = [...analysis.relatedCases, caseId];
      await this.updateAnalysis(analysisId, {
        relatedCases: updatedRelatedCases
      });
      
      // Also update the case to reference this analysis
      // Get the case first
      const caseEntity = await storageOrchestrator.getEntity<CaseRecord>(caseId);
      if (!caseEntity || caseEntity.type !== 'case_record') {
        throw new Error(`Case with ID ${caseId} not found`);
      }
      
      // Update the case's related entities to include this analysis
      const relatedEntities = caseEntity.relatedEntities || [];
      if (!relatedEntities.includes(analysisId)) {
        await storageOrchestrator.updateEntity<CaseRecord>(caseId, {
          relatedEntities: [...relatedEntities, analysisId]
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error linking analysis to case:', error);
      return false;
    }
  }
  
  /**
   * Get analyzer statistics
   */
  async getAnalyzerStats(): Promise<AnalyzerStats> {
    try {
      // Get all analysis entities
      const analyses = await this.queryAnalyses();
      
      // Calculate entity type distribution
      const entityTypeDistribution: Record<string, number> = {};
      
      // Calculate concept distribution and aggregate sentiments
      const conceptCounts: Record<string, number> = {};
      let totalConfidence = 0;
      let positiveCount = 0;
      let neutralCount = 0;
      let negativeCount = 0;
      
      analyses.forEach(analysis => {
        // Entity type distribution
        entityTypeDistribution[analysis.entityType] = (entityTypeDistribution[analysis.entityType] || 0) + 1;
        
        // Confidence total for average
        totalConfidence += analysis.confidence;
        
        // Concepts distribution
        analysis.extracted.concepts.forEach(concept => {
          conceptCounts[concept.text] = (conceptCounts[concept.text] || 0) + concept.references;
        });
        
        // Sentiment distribution
        analysis.extracted.sentiments.forEach(sentiment => {
          if (sentiment.score > 0.1) {
            positiveCount++;
          } else if (sentiment.score < -0.1) {
            negativeCount++;
          } else {
            neutralCount++;
          }
        });
      });
      
      // Sort concepts by count and take top 10
      const conceptDistribution: Record<string, number> = {};
      Object.entries(conceptCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([concept, count]) => {
          conceptDistribution[concept] = count;
        });
      
      // Calculate average confidence
      const averageConfidence = analyses.length > 0 ? totalConfidence / analyses.length : 0;
      
      // Get recent activity (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString();
      
      const recentlyCreated = analyses.filter(analysis => analysis.createdAt >= oneWeekAgoStr);
      const recentlyUpdated = analyses.filter(
        analysis => analysis.updatedAt >= oneWeekAgoStr && analysis.createdAt < oneWeekAgoStr
      );
      
      return {
        totalAnalyses: analyses.length,
        entityTypeDistribution,
        conceptDistribution,
        averageConfidence,
        sentimentDistribution: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount
        },
        recentActivity: {
          created: recentlyCreated.length,
          updated: recentlyUpdated.length
        }
      };
    } catch (error) {
      console.error('Error calculating analyzer stats:', error);
      return {
        totalAnalyses: 0,
        entityTypeDistribution: {},
        conceptDistribution: {},
        averageConfidence: 0,
        sentimentDistribution: {
          positive: 0,
          neutral: 0,
          negative: 0
        },
        recentActivity: {
          created: 0,
          updated: 0
        }
      };
    }
  }
}

// Export a singleton instance
export const analyzerAdapter = new AnalyzerAdapter();
