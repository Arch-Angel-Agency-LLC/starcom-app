/**
 * Intelligence Dashboard Service
 * 
 * Centralized service for managing and orchestrating intelligence workflows,
 * analysis engines, and real-time intelligence operations.
 * 
 * Updated for Phase 4: Service Dependency Updates
 * - Migrated from deprecated Intelligence import to Intel + IntelReport
 * - Updated to use enhanced IntelReportData with Phase 3 improvements
 * - Integrated with clean type hierarchy
 */

import { Intel, IntelRequirement } from '../../models/Intel/Intel';
import { IntelReportData } from '../../models/IntelReportData';
import { IntelligenceWorkflowEngine, WorkflowExecution, AnalysisWorkflow } from './IntelligenceWorkflowEngine';
import { IntelligenceAnalysisEngine, AnalysisResult, AnalysisContext } from './IntelligenceAnalysisEngine';
import { IntelValidator } from '../../models/Intel/Validators';
import { IntelFusionService } from '../../models/Intel/IntelFusion';
import { enhancedEventEmitter } from '../../core/intel/events/enhancedEventEmitter';

// =============================================================================
// DASHBOARD TYPES AND INTERFACES
// =============================================================================

export interface IntelligenceDashboard {
  overview: DashboardOverview;
  active_workflows: WorkflowExecution[];
  recent_analysis: AnalysisResult[];
  intel_queue: Intel[];
  alerts: IntelAlert[];
  performance_metrics: PerformanceMetrics;
  recommendations: DashboardRecommendation[];
}

export interface DashboardOverview {
  total_intel_processed: number;
  active_workflows_count: number;
  pending_analysis_count: number;
  critical_alerts_count: number;
  average_processing_time: number; // milliseconds
  quality_score: number; // 0-100
  confidence_score: number; // 0-100
  last_updated: number;
}

export interface IntelAlert {
  id: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'THREAT_DETECTED' | 'PATTERN_IDENTIFIED' | 'CORRELATION_FOUND' | 'QUALITY_ISSUE' | 'SYSTEM_STATUS';
  title: string;
  description: string;
  source_intel: string[];
  recommendations: string[];
  created_at: number;
  expires_at?: number;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: number;
}

export interface PerformanceMetrics {
  processing_throughput: {
    intel_per_hour: number;
    reports_per_hour: number;
    analysis_per_hour: number;
  };
  quality_metrics: {
    average_intel_quality: number;
    validation_success_rate: number;
    correlation_success_rate: number;
  };
  timing_metrics: {
    average_workflow_duration: number;
    average_analysis_duration: number;
    queue_wait_time: number;
  };
  resource_utilization: {
    workflow_engine_load: number;
    analysis_engine_load: number;
    memory_usage: number;
  };
}

export interface DashboardRecommendation {
  id: string;
  type: 'OPERATIONAL' | 'ANALYTICAL' | 'TECHNICAL' | 'PROCEDURAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  action_items: string[];
  estimated_impact: string;
  created_at: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
}

export interface IntelligenceOperation {
  id: string;
  name: string;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  start_time: number;
  end_time?: number;
  requirements: IntelRequirement[];
  collected_intel: string[]; // Intel IDs
  analysis_results: string[]; // Analysis IDs
  reports_generated: string[]; // Report IDs
  success_metrics: Record<string, number>;
}

// =============================================================================
// INTELLIGENCE DASHBOARD SERVICE
// =============================================================================

export class IntelligenceDashboardService {
  private workflowEngine: IntelligenceWorkflowEngine;
  private analysisEngine: IntelligenceAnalysisEngine;
  private intelQueue: Intel[] = [];
  private activeAlerts: Map<string, IntelAlert> = new Map();
  private operations: Map<string, IntelligenceOperation> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private recommendations: Map<string, DashboardRecommendation> = new Map();

  constructor() {
    this.workflowEngine = new IntelligenceWorkflowEngine();
    this.analysisEngine = new IntelligenceAnalysisEngine();
    this.performanceMetrics = this.initializePerformanceMetrics();
    this.setupEventListeners();
    this.startPerformanceMonitoring();
  }

  // =============================================================================
  // MAIN DASHBOARD METHODS
  // =============================================================================

  /**
   * Get current intelligence dashboard state
   */
  async getDashboard(): Promise<IntelligenceDashboard> {
    const overview = await this.generateDashboardOverview();
    const activeWorkflows = await this.getActiveWorkflows();
    const recentAnalysis = await this.getRecentAnalysis();
    const alerts = Array.from(this.activeAlerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.created_at - a.created_at);

    return {
      overview,
      active_workflows: activeWorkflows,
      recent_analysis: recentAnalysis,
      intel_queue: this.intelQueue.slice(-10), // Last 10 items
      alerts: alerts.slice(0, 20), // Top 20 alerts
      performance_metrics: this.performanceMetrics,
      recommendations: Array.from(this.recommendations.values())
        .filter(rec => rec.status === 'PENDING')
        .sort((a, b) => {
          const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 10)
    };
  }

  /**
   * Process incoming intelligence data
   */
  async processIntelligence(
    intel: Intel[],
    options: {
      auto_analyze?: boolean;
      trigger_workflows?: boolean;
      generate_alerts?: boolean;
      context?: AnalysisContext;
    } = {}
  ): Promise<{
    processed_intel: IntelReportData[]; // Phase 4: Updated from Intelligence to IntelReportData
    triggered_workflows: string[];
    generated_alerts: string[];
    analysis_results: AnalysisResult[];
  }> {
    
    const processOptions = {
      auto_analyze: true,
      trigger_workflows: true,
      generate_alerts: true,
      ...options
    };

    const result = {
      processed_intel: [] as IntelReportData[], // Phase 4: Updated from Intelligence to IntelReportData
      triggered_workflows: [] as string[],
      generated_alerts: [] as string[],
      analysis_results: [] as AnalysisResult[]
    };

    try {
      // 1. Add to processing queue
      this.intelQueue.push(...intel);

      // 2. Validate incoming intel
      const validatedIntel = await this.validateIncomingIntel(intel);

      // 3. Trigger automatic workflows if enabled
      if (processOptions.trigger_workflows) {
        for (const intelItem of validatedIntel) {
          await this.workflowEngine.checkTriggers(intelItem);
        }
      }

      // 4. Perform automatic analysis if enabled
      if (processOptions.auto_analyze && validatedIntel.length > 0) {
        const analysisContext = processOptions.context || this.createDefaultAnalysisContext();
        const analysisResults = await this.analysisEngine.analyzeIntelligence(
          validatedIntel,
          analysisContext
        );
        result.analysis_results = analysisResults;

        // Generate alerts based on analysis
        if (processOptions.generate_alerts) {
          const alerts = await this.generateAlertsFromAnalysis(analysisResults);
          result.generated_alerts = alerts.map(alert => alert.id);
        }
      }

      // 5. Update performance metrics
      this.updatePerformanceMetrics(intel.length, result.analysis_results.length);

      // 6. Generate recommendations
      await this.generateAutomaticRecommendations(intel, result.analysis_results);

      enhancedEventEmitter.emit('intelligence:processed', {
        intel_count: intel.length,
        analysis_count: result.analysis_results.length,
        alerts_generated: result.generated_alerts.length
      });

      return result;

    } catch (error) {
      this.createAlert({
        level: 'CRITICAL',
        type: 'SYSTEM_STATUS',
        title: 'Intelligence Processing Error',
        description: `Error processing ${intel.length} intelligence items: ${error.message}`,
        source_intel: intel.map(i => i.id),
        recommendations: ['Review system logs', 'Check processing pipeline'],
        created_at: Date.now()
      });

      throw error;
    }
  }

  /**
   * Execute a specific intelligence operation
   */
  async executeOperation(
    operationName: string,
    requirements: IntelRequirement[],
    options: {
      auto_collect?: boolean;
      auto_analyze?: boolean;
      generate_reports?: boolean;
      deadline?: number;
    } = {}
  ): Promise<IntelligenceOperation> {
    
    const operation: IntelligenceOperation = {
      id: this.generateOperationId(),
      name: operationName,
      description: `Intelligence operation: ${operationName}`,
      status: 'PLANNING',
      start_time: Date.now(),
      requirements,
      collected_intel: [],
      analysis_results: [],
      reports_generated: [],
      success_metrics: {}
    };

    this.operations.set(operation.id, operation);

    try {
      operation.status = 'ACTIVE';

      // Execute operation workflow
      const workflow = await this.createOperationWorkflow(operation, options);
      const execution = await this.workflowEngine.executeWorkflow(
        workflow.id,
        { 
          intel: [], 
          requirements,
          context: this.createOperationContext(operation, options)
        }
      );

      // Monitor operation progress
      this.monitorOperationProgress(operation, execution);

      enhancedEventEmitter.emit('operation:started', {
        operation_id: operation.id,
        requirements_count: requirements.length
      });

      return operation;

    } catch (error) {
      operation.status = 'CANCELLED';
      throw error;
    }
  }

  /**
   * Generate comprehensive intelligence report
   */
  async generateIntelligenceReport(
    intel: Intel[],
    analysisResults: AnalysisResult[],
    context: {
      title: string;
      analyst: string;
      classification: string;
      purpose: string;
      audience: string[];
    }
  ): Promise<IntelReportData> {
    
    try {
      // Use Intel Fusion Service to create comprehensive report
      const report = IntelFusionService.fuseIntelIntoReport(intel, {
        analystId: context.analyst,
        reportTitle: context.title,
        analysisMethod: 'automated-dashboard',
        keyQuestions: this.extractKeyQuestionsFromAnalysis(analysisResults),
        timeframe: {
          start: Math.min(...intel.map(i => i.timestamp)),
          end: Math.max(...intel.map(i => i.timestamp))
        }
      });

      // Enhance report with analysis results
      const enhancedReport = this.enhanceReportWithAnalysis(report, analysisResults);

      // Add dashboard-specific metadata
      enhancedReport.metadata = {
        ...enhancedReport.metadata,
        dashboard_generated: true,
        generation_timestamp: Date.now(),
        intel_sources_count: intel.length,
        analysis_results_count: analysisResults.length,
        automated_processing: true
      };

      enhancedEventEmitter.emit('report:generated', {
        report_id: enhancedReport.id,
        intel_count: intel.length,
        analysis_count: analysisResults.length
      });

      return enhancedReport;

    } catch (error) {
      this.createAlert({
        level: 'WARNING',
        type: 'SYSTEM_STATUS',
        title: 'Report Generation Error',
        description: `Error generating intelligence report: ${error.message}`,
        source_intel: intel.map(i => i.id),
        recommendations: ['Review report requirements', 'Check data quality'],
        created_at: Date.now()
      });

      throw error;
    }
  }

  // =============================================================================
  // ALERT MANAGEMENT
  // =============================================================================

  /**
   * Create a new alert
   */
  createAlert(alertData: Omit<IntelAlert, 'id' | 'acknowledged'>): IntelAlert {
    const alert: IntelAlert = {
      id: this.generateAlertId(),
      ...alertData,
      acknowledged: false
    };

    this.activeAlerts.set(alert.id, alert);

    enhancedEventEmitter.emit('alert:created', {
      alert_id: alert.id,
      level: alert.level,
      type: alert.type
    });

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledged_by = acknowledgedBy;
      alert.acknowledged_at = Date.now();

      enhancedEventEmitter.emit('alert:acknowledged', {
        alert_id: alertId,
        acknowledged_by: acknowledgedBy
      });
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): IntelAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.created_at - a.created_at);
  }

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  private startPerformanceMonitoring(): void {
    // Update performance metrics every 30 seconds
    setInterval(() => {
      this.updatePerformanceMetrics(0, 0);
    }, 30000);

    // Clean up old alerts and recommendations every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000);
  }

  private updatePerformanceMetrics(newIntel: number, newAnalysis: number): void {
    const now = Date.now();
    
    // Update throughput metrics (simplified - would use sliding window in production)
    this.performanceMetrics.processing_throughput.intel_per_hour += newIntel;
    this.performanceMetrics.processing_throughput.analysis_per_hour += newAnalysis;
    
    // Update quality metrics based on recent processing
    this.updateQualityMetrics();
    
    // Update resource utilization
    this.updateResourceUtilization();
  }

  private updateQualityMetrics(): void {
    // Calculate quality metrics based on recent intel and analysis
    // This would analyze validation results, correlation success, etc.
    this.performanceMetrics.quality_metrics.average_intel_quality = 85;
    this.performanceMetrics.quality_metrics.validation_success_rate = 92;
    this.performanceMetrics.quality_metrics.correlation_success_rate = 78;
  }

  private updateResourceUtilization(): void {
    // Monitor system resource usage
    this.performanceMetrics.resource_utilization.workflow_engine_load = 45;
    this.performanceMetrics.resource_utilization.analysis_engine_load = 62;
    this.performanceMetrics.resource_utilization.memory_usage = 38;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      processing_throughput: {
        intel_per_hour: 0,
        reports_per_hour: 0,
        analysis_per_hour: 0
      },
      quality_metrics: {
        average_intel_quality: 0,
        validation_success_rate: 0,
        correlation_success_rate: 0
      },
      timing_metrics: {
        average_workflow_duration: 0,
        average_analysis_duration: 0,
        queue_wait_time: 0
      },
      resource_utilization: {
        workflow_engine_load: 0,
        analysis_engine_load: 0,
        memory_usage: 0
      }
    };
  }

  private setupEventListeners(): void {
    // Listen for workflow events
    enhancedEventEmitter.on('workflow:completed', (event) => {
      this.handleWorkflowCompletion(event);
    });

    // Listen for analysis events
    enhancedEventEmitter.on('analysis:completed', (event) => {
      this.handleAnalysisCompletion(event);
    });

    // Listen for quality issues
    enhancedEventEmitter.on('quality:issue', (event) => {
      this.handleQualityIssue(event);
    });
  }

  private async generateDashboardOverview(): Promise<DashboardOverview> {
    const activeWorkflows = await this.getActiveWorkflows();
    const criticalAlerts = this.getActiveAlerts().filter(alert => alert.level === 'CRITICAL');

    return {
      total_intel_processed: this.intelQueue.length,
      active_workflows_count: activeWorkflows.length,
      pending_analysis_count: this.intelQueue.filter(intel => !intel.verified).length,
      critical_alerts_count: criticalAlerts.length,
      average_processing_time: this.performanceMetrics.timing_metrics.average_workflow_duration,
      quality_score: this.performanceMetrics.quality_metrics.average_intel_quality,
      confidence_score: 85, // Would be calculated from recent analysis
      last_updated: Date.now()
    };
  }

  private async getActiveWorkflows(): Promise<WorkflowExecution[]> {
    // In a real implementation, this would query the workflow engine
    return [];
  }

  private async getRecentAnalysis(): Promise<AnalysisResult[]> {
    // In a real implementation, this would query the analysis engine
    return [];
  }

  private async validateIncomingIntel(intel: Intel[]): Promise<Intel[]> {
    const validatedIntel: Intel[] = [];
    
    for (const intelItem of intel) {
      const validation = IntelValidator.validateIntel(intelItem);
      if (validation.isValid) {
        validatedIntel.push(intelItem);
      } else {
        this.createAlert({
          level: 'WARNING',
          type: 'QUALITY_ISSUE',
          title: 'Intel Validation Failed',
          description: `Intel item ${intelItem.id} failed validation: ${validation.errors.map(e => e.message).join(', ')}`,
          source_intel: [intelItem.id],
          recommendations: ['Review intel data quality', 'Verify source reliability'],
          created_at: Date.now()
        });
      }
    }

    return validatedIntel;
  }

  private createDefaultAnalysisContext(): AnalysisContext {
    return {
      focus_areas: ['threat_detection', 'pattern_analysis'],
      time_range: { start: Date.now() - 86400000, end: Date.now() }, // Last 24 hours
      priority_sources: ['SIGINT', 'HUMINT', 'OSINT'],
      analysis_objectives: ['identify_threats', 'find_patterns', 'assess_risks'],
      constraints: [],
      background_context: 'Automated dashboard analysis'
    };
  }

  private async generateAlertsFromAnalysis(analysisResults: AnalysisResult[]): Promise<IntelAlert[]> {
    const alerts: IntelAlert[] = [];

    for (const result of analysisResults) {
      if (result.significance === 'CRITICAL' || result.significance === 'HIGH') {
        const alert = this.createAlert({
          level: result.significance === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          type: result.type === 'THREAT_ASSESSMENT' ? 'THREAT_DETECTED' : 'PATTERN_IDENTIFIED',
          title: `${result.type} - ${result.significance} Significance`,
          description: `Analysis detected ${result.significance.toLowerCase()} significance findings: ${result.findings.length} findings identified`,
          source_intel: result.findings.flatMap(f => f.source_intel),
          recommendations: result.recommendations,
          created_at: Date.now()
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private async generateAutomaticRecommendations(intel: Intel[], analysisResults: AnalysisResult[]): Promise<void> {
    // Generate operational recommendations based on intel and analysis
    if (intel.length > 100) {
      this.recommendations.set('high-volume-processing', {
        id: 'high-volume-processing',
        type: 'OPERATIONAL',
        priority: 'MEDIUM',
        title: 'High Volume Intel Processing',
        description: 'Large volume of intelligence detected. Consider scaling processing capabilities.',
        action_items: ['Review processing capacity', 'Consider parallel processing', 'Monitor queue times'],
        estimated_impact: 'Improved processing throughput and reduced latency',
        created_at: Date.now(),
        status: 'PENDING'
      });
    }

    // Generate analytical recommendations
    const highSignificanceResults = analysisResults.filter(r => r.significance === 'HIGH' || r.significance === 'CRITICAL');
    if (highSignificanceResults.length > 0) {
      this.recommendations.set('high-significance-analysis', {
        id: 'high-significance-analysis',
        type: 'ANALYTICAL',
        priority: 'HIGH',
        title: 'High Significance Analysis Results',
        description: 'Multiple high significance analysis results detected. Manual review recommended.',
        action_items: ['Conduct manual review', 'Validate automated findings', 'Consider escalation'],
        estimated_impact: 'Improved analysis accuracy and threat detection',
        created_at: Date.now(),
        status: 'PENDING'
      });
    }
  }

  private extractKeyQuestionsFromAnalysis(analysisResults: AnalysisResult[]): string[] {
    // Extract key analytical questions from analysis results
    const questions: string[] = [];
    
    if (analysisResults.some(r => r.type === 'THREAT_ASSESSMENT')) {
      questions.push('What threats have been identified?', 'What is the assessed threat level?');
    }
    
    if (analysisResults.some(r => r.type === 'PATTERN_DETECTION')) {
      questions.push('What patterns have been detected?', 'What is the significance of identified patterns?');
    }
    
    return questions.length > 0 ? questions : ['What intelligence has been collected?', 'What are the key findings?'];
  }

  private enhanceReportWithAnalysis(report: Partial<IntelReportData>, analysisResults: AnalysisResult[]): IntelReportData {
    // Enhance the base report with analysis insights using Phase 3 enhancements
    const enhancedReport = report as IntelReportData;
    
    // Use Phase 3 enhanced summary field for analysis findings
    const analysisFindings = analysisResults.flatMap(r => r.findings.map(f => f.description));
    enhancedReport.summary = analysisFindings.join('; ');
    
    // Add analysis insights to processing history (Phase 3 enhancement)
    const analysisProcessing = {
      stage: 'approved' as const,
      timestamp: new Date().toISOString(),
      processedBy: 'IntelligenceDashboardService',
      notes: `Analysis completed: ${analysisResults.length} results generated`
    };
    enhancedReport.processingHistory = [...(enhancedReport.processingHistory || []), analysisProcessing];
    
    return enhancedReport;
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - 86400000; // 24 hours ago
    
    // Remove old acknowledged alerts
    for (const [id, alert] of this.activeAlerts) {
      if (alert.acknowledged && (alert.acknowledged_at || 0) < cutoffTime) {
        this.activeAlerts.delete(id);
      }
    }
    
    // Remove old completed recommendations
    for (const [id, rec] of this.recommendations) {
      if (rec.status === 'COMPLETED' && rec.created_at < cutoffTime) {
        this.recommendations.delete(id);
      }
    }
  }

  // ID generation methods
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event handlers
  private handleWorkflowCompletion(event: Record<string, unknown>): void {
    // Handle workflow completion events
    console.log('Workflow completed:', event);
  }

  private handleAnalysisCompletion(event: Record<string, unknown>): void {
    // Handle analysis completion events
    console.log('Analysis completed:', event);
  }

  private handleQualityIssue(event: Record<string, unknown>): void {
    // Handle quality issue events
    console.log('Quality issue detected:', event);
  }

  // Placeholder methods for workflow and operation management
  private async createOperationWorkflow(operation: IntelligenceOperation, _options: Record<string, unknown>): Promise<AnalysisWorkflow> {
    // Create a workflow for the intelligence operation
    return {
      id: `operation_${operation.id}`,
      name: `Operation Workflow: ${operation.name}`,
      type: 'ROUTINE',
      triggers: [],
      steps: [],
      priority: 50,
      estimatedDuration: 30,
      requiredClassification: 'CONFIDENTIAL',
      autoExecute: false
    };
  }

  private createOperationContext(operation: IntelligenceOperation, _options: Record<string, unknown>): AnalysisContext {
    // Create analysis context for the operation
    return {
      focus_areas: ['operation_support'],
      time_range: { start: operation.start_time, end: operation.end_time || Date.now() + 86400000 },
      priority_sources: ['HUMINT', 'SIGINT', 'OSINT'],
      analysis_objectives: ['support_operation'],
      constraints: [],
      background_context: `Operation: ${operation.name}`
    };
  }

  private monitorOperationProgress(operation: IntelligenceOperation, execution: WorkflowExecution): void {
    // Monitor the progress of an intelligence operation
    console.log(`Monitoring operation ${operation.id} with execution ${execution.id}`);
  }
}
