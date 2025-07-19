/**
 * NetRunner Error Handling Integration Examples
 * 
 * This file demonstrates how to integrate the comprehensive error handling
 * system into NetRunner Phase 1 and Phase 2 components.
 * 
 * Usage examples for all 100+ error types covering:
 * - Core Integration (Phase 1)
 * - NetRunner Collection (Phase 2A) 
 * - Enhanced Visualization (Phase 2B)
 */

import {
  // Core Integration Errors
  BridgeAdapterInitializationError,
  IntelToEntityTransformationError,
  EntityToIntelTransformationError,
  LineageTrackingError,
  ConfidenceScorePropagationError,
  IntelStorageError,
  IntelligenceStorageError,
  
  // NetRunner Collection Errors
  ScanInitializationError,
  URLValidationError,
  ProxyConnectionError,
  ContentRetrievalError,
  EmailExtractionError,
  TechnologyDetectionError,
  IntelGenerationError,
  
  // Enhanced Visualization Errors
  GraphDataGenerationError,
  NodeTransformationError,
  ConfidenceVisualizationError,
  TimelineDataGenerationError,
  ProcessingTimelineError,
  
  // Real-time & Performance Errors
  WebSocketConnectionError,
  ProcessingTimeoutError,
  MemoryLimitError,
  ConcurrencyLimitError,
  
  // Utility Classes
  NetRunnerErrorHandler,
  NetRunnerErrorAnalytics
} from '../../../core/intel/errors/NetRunnerErrorTypes';

// ============================================================================
// ENHANCED WEBSITE SCANNER ERROR INTEGRATION
// ============================================================================

export class EnhancedWebsiteScannerWithErrorHandling {
  private errorAnalytics = new NetRunnerErrorAnalytics();

  async scanWithComprehensiveErrorHandling(url: string): Promise<any> {
    try {
      // URL Validation with specific error handling
      try {
        new URL(url);
      } catch (error) {
        const urlError = new URLValidationError(url, 'Invalid URL format');
        this.errorAnalytics.addError(urlError);
        throw urlError;
      }

      // Content Retrieval with retry logic
      let content: string;
      try {
        content = await this.retrieveContent(url);
      } catch (error) {
        const retrievalError = new ContentRetrievalError(
          url, 
          error instanceof Error && 'status' in error ? (error as any).status : 0,
          error instanceof Error ? error.message : 'Unknown retrieval error',
          { retryAttempt: 1, userAgent: 'NetRunner-Enhanced' }
        );
        
        // Check if retryable
        if (NetRunnerErrorHandler.isRetryableError(retrievalError)) {
          // Implement retry with exponential backoff
          content = await this.retryWithBackoff(url, 3);
        } else {
          this.errorAnalytics.addError(retrievalError);
          throw retrievalError;
        }
      }

      // Email Extraction with validation
      let emails: string[];
      try {
        emails = await this.extractEmails(content);
      } catch (error) {
        const emailError = new EmailExtractionError(
          url,
          error instanceof Error ? error.message : 'Email extraction failed'
        );
        this.errorAnalytics.addError(emailError);
        // Continue with empty emails array
        emails = [];
        console.warn('Email extraction failed, continuing without emails:', emailError);
      }

      // Technology Detection with fallback
      let technologies: any[];
      try {
        technologies = await this.detectTechnologies(content);
      } catch (error) {
        const techError = new TechnologyDetectionError(
          url,
          'unknown',
          error instanceof Error ? error.message : 'Technology detection failed'
        );
        this.errorAnalytics.addError(techError);
        technologies = [];
      }

      // Intel Generation with comprehensive error handling
      try {
        const intelObjects = await this.generateIntelFromResults({
          emails,
          technologies,
          url
        });
        
        return {
          success: true,
          data: intelObjects,
          errors: this.errorAnalytics.getMetrics()
        };
        
      } catch (error) {
        const intelError = new IntelGenerationError(
          'scan-results',
          error instanceof Error ? error.message : 'Intel generation failed'
        );
        this.errorAnalytics.addError(intelError);
        throw intelError;
      }

    } catch (error) {
      // Final error handling and reporting
      NetRunnerErrorHandler.handleError(error as any);
      return {
        success: false,
        error: NetRunnerErrorHandler.getErrorContext(error as any),
        analytics: this.errorAnalytics.getMetrics()
      };
    }
  }

  private async retryWithBackoff(url: string, maxRetries: number): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        return await this.retrieveContent(url);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async retrieveContent(url: string): Promise<string> {
    // Simulate content retrieval
    return fetch(url).then(r => r.text());
  }

  private async extractEmails(content: string): Promise<string[]> {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return content.match(emailRegex) || [];
  }

  private async detectTechnologies(content: string): Promise<any[]> {
    // Simulate technology detection
    const technologies = [];
    if (content.includes('React')) technologies.push({ name: 'React', version: 'unknown' });
    if (content.includes('jQuery')) technologies.push({ name: 'jQuery', version: 'unknown' });
    return technologies;
  }

  private async generateIntelFromResults(results: any): Promise<any[]> {
    const intelObjects = [];
    
    // Generate email intel with error handling
    for (const email of results.emails) {
      try {
        intelObjects.push({
          id: `email-${Date.now()}-${Math.random()}`,
          type: 'email',
          data: email,
          confidence: this.calculateEmailConfidence(email),
          source: 'NetRunner-Enhanced'
        });
      } catch (error) {
        const emailIntelError = new IntelGenerationError(
          'email',
          `Failed to generate intel for email ${email}: ${error instanceof Error ? error.message : 'unknown error'}`
        );
        this.errorAnalytics.addError(emailIntelError);
        // Continue with other emails
      }
    }

    return intelObjects;
  }

  private calculateEmailConfidence(email: string): number {
    let confidence = 50;
    if (email.includes('@gmail.com')) confidence += 20;
    if (email.includes('@company.com')) confidence += 30;
    return Math.min(confidence, 100);
  }
}

// ============================================================================
// ENHANCED NODEWEB ADAPTER ERROR INTEGRATION
// ============================================================================

export class EnhancedNodeWebAdapterWithErrorHandling {
  private errorAnalytics = new NetRunnerErrorAnalytics();

  async generateGraphWithErrorHandling(entities: any[]): Promise<any> {
    try {
      // Node Transformation with individual error handling
      const nodes = [];
      for (const [index, entity] of entities.entries()) {
        try {
          const node = await this.transformEntityToNode(entity);
          nodes.push(node);
        } catch (error) {
          const transformError = new NodeTransformationError(
            entity.id || `entity-${index}`,
            error instanceof Error ? error.message : 'Node transformation failed'
          );
          this.errorAnalytics.addError(transformError);
          
          // Create fallback node
          nodes.push({
            id: entity.id || `fallback-${index}`,
            label: entity.title || 'Unknown Entity',
            confidence: 0,
            error: true
          });
        }
      }

      // Relationship Mapping with error handling
      let edges = [];
      try {
        edges = await this.generateRelationships(entities);
      } catch (error) {
        const relationshipError = new RelationshipMappingError(
          '*',
          '*',
          error instanceof Error ? error.message : 'Relationship mapping failed'
        );
        this.errorAnalytics.addError(relationshipError);
        // Continue with empty edges
      }

      // Confidence Visualization with error handling
      const visualNodes = nodes.map(node => {
        try {
          return this.addConfidenceVisualization(node);
        } catch (error) {
          const confError = new ConfidenceVisualizationError(
            node.id,
            error instanceof Error ? error.message : 'Confidence visualization failed'
          );
          this.errorAnalytics.addError(confError);
          return node; // Return original node without confidence visualization
        }
      });

      return {
        nodes: visualNodes,
        edges,
        metrics: this.errorAnalytics.getMetrics()
      };

    } catch (error) {
      const graphError = new GraphDataGenerationError(
        error instanceof Error ? error.message : 'Graph generation failed'
      );
      NetRunnerErrorHandler.handleError(graphError);
      throw graphError;
    }
  }

  private async transformEntityToNode(entity: any): Promise<any> {
    return {
      id: entity.id,
      label: entity.title,
      confidence: entity.confidence || 50,
      type: entity.type || 'unknown'
    };
  }

  private async generateRelationships(entities: any[]): Promise<any[]> {
    const edges = [];
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        if (this.entitiesAreRelated(entities[i], entities[j])) {
          edges.push({
            from: entities[i].id,
            to: entities[j].id,
            label: 'related'
          });
        }
      }
    }
    return edges;
  }

  private entitiesAreRelated(a: any, b: any): boolean {
    // Simple relatedness check
    return a.source === b.source || 
           (a.tags && b.tags && a.tags.some((tag: string) => b.tags.includes(tag)));
  }

  private addConfidenceVisualization(node: any): any {
    return {
      ...node,
      size: Math.max(10, node.confidence / 2),
      color: node.confidence > 70 ? 'green' : node.confidence > 40 ? 'yellow' : 'red',
      opacity: node.confidence / 100
    };
  }
}

// ============================================================================
// ENHANCED TIMELINE ADAPTER ERROR INTEGRATION
// ============================================================================

export class EnhancedTimelineAdapterWithErrorHandling {
  private errorAnalytics = new NetRunnerErrorAnalytics();

  async generateTimelineWithErrorHandling(entities: any[]): Promise<any> {
    try {
      // Collection Timeline Generation
      let collectionEvents = [];
      try {
        collectionEvents = await this.generateCollectionEvents(entities);
      } catch (error) {
        const collectionError = new CollectionTimelineError(
          'entities',
          error instanceof Error ? error.message : 'Collection timeline generation failed'
        );
        this.errorAnalytics.addError(collectionError);
      }

      // Processing Timeline Generation
      let processingEvents = [];
      try {
        processingEvents = await this.generateProcessingEvents(entities);
      } catch (error) {
        const processingError = new ProcessingTimelineError(
          'entities',
          error instanceof Error ? error.message : 'Processing timeline generation failed'
        );
        this.errorAnalytics.addError(processingError);
      }

      // Temporal Analysis
      let temporalMetrics = {};
      try {
        temporalMetrics = await this.performTemporalAnalysis([...collectionEvents, ...processingEvents]);
      } catch (error) {
        const temporalError = new TemporalAnalysisError(
          'timeline-events',
          error instanceof Error ? error.message : 'Temporal analysis failed'
        );
        this.errorAnalytics.addError(temporalError);
      }

      return {
        events: [...collectionEvents, ...processingEvents],
        metrics: temporalMetrics,
        errorAnalytics: this.errorAnalytics.getMetrics()
      };

    } catch (error) {
      const timelineError = new TimelineDataGenerationError(
        error instanceof Error ? error.message : 'Timeline generation failed'
      );
      NetRunnerErrorHandler.handleError(timelineError);
      throw timelineError;
    }
  }

  private async generateCollectionEvents(entities: any[]): Promise<any[]> {
    return entities.map((entity, index) => {
      try {
        return {
          id: `collection-${entity.id || index}`,
          timestamp: entity.timestamp || Date.now(),
          type: 'collection',
          content: `Collected: ${entity.title || 'Unknown'}`,
          confidence: entity.confidence || 50
        };
      } catch (error) {
        const eventError = new TimelineEventCreationError(
          'collection',
          error instanceof Error ? error.message : 'Event creation failed'
        );
        this.errorAnalytics.addError(eventError);
        return null;
      }
    }).filter(Boolean);
  }

  private async generateProcessingEvents(entities: any[]): Promise<any[]> {
    return entities.flatMap(entity => {
      try {
        const processingSteps = entity.processingHistory || [
          { stage: 'extraction', timestamp: entity.timestamp },
          { stage: 'analysis', timestamp: entity.timestamp + 1000 },
          { stage: 'correlation', timestamp: entity.timestamp + 2000 }
        ];

        return processingSteps.map((step: any, index: number) => ({
          id: `processing-${entity.id}-${index}`,
          timestamp: step.timestamp,
          type: 'processing',
          content: `${step.stage}: ${entity.title || 'Unknown'}`,
          stage: step.stage
        }));
      } catch (error) {
        const stageError = new ProcessingStageVisualizationError(
          'unknown',
          error instanceof Error ? error.message : 'Stage visualization failed'
        );
        this.errorAnalytics.addError(stageError);
        return [];
      }
    });
  }

  private async performTemporalAnalysis(events: any[]): Promise<any> {
    try {
      const timestamps = events.map(e => e.timestamp).filter(Boolean);
      const timespan = Math.max(...timestamps) - Math.min(...timestamps);
      
      return {
        totalEvents: events.length,
        timespan,
        averageConfidence: events.reduce((sum, e) => sum + (e.confidence || 0), 0) / events.length,
        processingDuration: timespan
      };
    } catch (error) {
      const metricsError = new TimelineMetricsError(
        'temporal-analysis',
        error instanceof Error ? error.message : 'Temporal analysis failed'
      );
      this.errorAnalytics.addError(metricsError);
      return {};
    }
  }
}

// ============================================================================
// REAL-TIME UPDATE ERROR INTEGRATION
// ============================================================================

export class RealTimeUpdateManagerWithErrorHandling {
  private errorAnalytics = new NetRunnerErrorAnalytics();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async initializeWebSocket(endpoint: string): Promise<void> {
    try {
      this.websocket = new WebSocket(endpoint);
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
      };

      this.websocket.onerror = (error) => {
        const wsError = new WebSocketConnectionError(
          endpoint,
          `WebSocket error: ${error}`
        );
        this.errorAnalytics.addError(wsError);
        this.handleReconnection(endpoint);
      };

      this.websocket.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnection(endpoint);
        }
      };

    } catch (error) {
      const initError = new WebSocketConnectionError(
        endpoint,
        error instanceof Error ? error.message : 'WebSocket initialization failed'
      );
      this.errorAnalytics.addError(initError);
      throw initError;
    }
  }

  private async handleReconnection(endpoint: string): Promise<void> {
    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    
    setTimeout(() => {
      console.log(`Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.initializeWebSocket(endpoint);
    }, delay);
  }

  async processWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          const timeoutError = new ProcessingTimeoutError(
            'async-operation',
            timeoutMs
          );
          this.errorAnalytics.addError(timeoutError);
          reject(timeoutError);
        }, timeoutMs);
      })
    ]);
  }

  getErrorAnalytics() {
    return {
      metrics: this.errorAnalytics.getMetrics(),
      commonErrors: this.errorAnalytics.getMostCommonErrors(),
      criticalPatterns: this.errorAnalytics.getCriticalErrorPatterns()
    };
  }
}

// ============================================================================
// COMPREHENSIVE ERROR MONITORING DASHBOARD
// ============================================================================

export class NetRunnerErrorMonitoringDashboard {
  private scannerAnalytics = new NetRunnerErrorAnalytics();
  private nodeWebAnalytics = new NetRunnerErrorAnalytics();
  private timelineAnalytics = new NetRunnerErrorAnalytics();
  private realTimeAnalytics = new NetRunnerErrorAnalytics();

  getComprehensiveErrorReport() {
    return {
      timestamp: new Date().toISOString(),
      components: {
        scanner: {
          metrics: this.scannerAnalytics.getMetrics(),
          topErrors: this.scannerAnalytics.getMostCommonErrors(5),
          criticalPatterns: this.scannerAnalytics.getCriticalErrorPatterns()
        },
        nodeWeb: {
          metrics: this.nodeWebAnalytics.getMetrics(),
          topErrors: this.nodeWebAnalytics.getMostCommonErrors(5),
          criticalPatterns: this.nodeWebAnalytics.getCriticalErrorPatterns()
        },
        timeline: {
          metrics: this.timelineAnalytics.getMetrics(),
          topErrors: this.timelineAnalytics.getMostCommonErrors(5),
          criticalPatterns: this.timelineAnalytics.getCriticalErrorPatterns()
        },
        realTime: {
          metrics: this.realTimeAnalytics.getMetrics(),
          topErrors: this.realTimeAnalytics.getMostCommonErrors(5),
          criticalPatterns: this.realTimeAnalytics.getCriticalErrorPatterns()
        }
      },
      systemHealth: this.calculateSystemHealth(),
      recommendations: this.generateRecommendations()
    };
  }

  private calculateSystemHealth(): { score: number; status: string; issues: string[] } {
    const allMetrics = [
      this.scannerAnalytics.getMetrics(),
      this.nodeWebAnalytics.getMetrics(),
      this.timelineAnalytics.getMetrics(),
      this.realTimeAnalytics.getMetrics()
    ];

    const totalErrors = allMetrics.reduce((sum, m) => sum + m.totalErrors, 0);
    const criticalErrors = allMetrics.reduce((sum, m) => sum + m.criticalErrors, 0);
    const retryableErrors = allMetrics.reduce((sum, m) => sum + m.retryableErrors, 0);

    let score = 100;
    const issues = [];

    if (criticalErrors > 10) {
      score -= 30;
      issues.push(`High critical error count: ${criticalErrors}`);
    }

    if (totalErrors > 100) {
      score -= 20;
      issues.push(`High total error count: ${totalErrors}`);
    }

    if (retryableErrors / totalErrors > 0.5) {
      score -= 15;
      issues.push('High percentage of retryable errors indicates infrastructure issues');
    }

    const status = score > 80 ? 'healthy' : score > 60 ? 'warning' : 'critical';

    return { score, status, issues };
  }

  private generateRecommendations(): string[] {
    const recommendations = [];
    const health = this.calculateSystemHealth();

    if (health.score < 70) {
      recommendations.push('Investigate and resolve critical errors immediately');
    }

    if (health.issues.some(issue => issue.includes('retryable'))) {
      recommendations.push('Check network connectivity and external service availability');
    }

    if (this.scannerAnalytics.getMetrics().totalErrors > 50) {
      recommendations.push('Review URL validation and content retrieval logic');
    }

    if (this.realTimeAnalytics.getMetrics().totalErrors > 20) {
      recommendations.push('Implement connection pooling and improve WebSocket reliability');
    }

    return recommendations;
  }
}

export const netRunnerErrorIntegration = {
  EnhancedWebsiteScannerWithErrorHandling,
  EnhancedNodeWebAdapterWithErrorHandling,
  EnhancedTimelineAdapterWithErrorHandling,
  RealTimeUpdateManagerWithErrorHandling,
  NetRunnerErrorMonitoringDashboard
};
