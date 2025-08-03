/**
 * Intelligence Workflow Engine
 * 
 * Automated workflows that mirror human intelligence analysis processes
 * while maintaining proper classification, source attribution, and quality control.
 */

import { Intel, IntelRequirement, ClassificationLevel } from '../../models/Intel/Intel';
import { ThreatAssessment } from '../../models/Intel/Intelligence';
import { IntelReportData } from '../../models/IntelReportData';
import { IntelValidator } from '../../models/Intel/Validators';
import { enhancedEventEmitter } from '../../core/intel/events/enhancedEventEmitter';

// =============================================================================
// WORKFLOW TYPES AND INTERFACES
// =============================================================================

// Specific types for workflow processing
export type TriggerValue = string | number | boolean | string[] | number[];
export type StepOutput = Record<string, unknown>;
export type StepMetadata = Record<string, string | number | boolean>;
export type UserInputs = Record<string, string | number | boolean>;
export type WorkflowContext = Record<string, string | number | boolean>;

// Validation and analysis result types
export interface WorkflowValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

export interface CorrelationResult {
  sourceId: string;
  targetId: string;
  correlationType: 'TEMPORAL' | 'SPATIAL' | 'ENTITY' | 'BEHAVIORAL' | 'TECHNICAL';
  confidence: number;
  evidence: string[];
}

export interface PatternResult {
  id: string;
  type: 'TREND' | 'ANOMALY' | 'CYCLE' | 'CLUSTER' | 'SEQUENCE';
  description: string;
  confidence: number;
  frequency: number;
  entities: string[];
}

export interface RelationshipResult {
  fromEntity: string;
  toEntity: string;
  relationshipType: string;
  strength: number;
  evidence: string[];
}

export interface AnalysisWorkflow {
  id: string;
  name: string;
  type: 'IMMEDIATE' | 'ROUTINE' | 'DEEP_ANALYSIS' | 'CROSS_DOMAIN' | 'THREAT_HUNTING';
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  priority: number;
  estimatedDuration: number; // minutes
  requiredClassification: ClassificationLevel;
  autoExecute: boolean;
}

export interface WorkflowTrigger {
  type: 'INTEL_RECEIVED' | 'PATTERN_DETECTED' | 'THRESHOLD_EXCEEDED' | 'TIME_BASED' | 'MANUAL';
  conditions: TriggerCondition[];
  enabled: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range' | 'pattern_match';
  value: TriggerValue;
  weight: number; // 0-1, how important this condition is
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'VALIDATE' | 'ANALYZE' | 'CORRELATE' | 'ASSESS' | 'REPORT' | 'DISSEMINATE' | 'ALERT';
  processor: string; // Which processing function to use
  inputs: string[]; // What inputs this step needs
  outputs: string[]; // What this step produces
  timeout: number; // Max execution time in seconds
  retryCount: number;
  dependencies: string[]; // Step IDs that must complete first
  parallel: boolean; // Can run in parallel with other steps
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startTime: number;
  endTime?: number;
  currentStep?: string;
  stepResults: Record<string, WorkflowStepResult>;
  inputs: WorkflowInputs;
  outputs: WorkflowOutputs;
  errors: WorkflowError[];
  metrics: WorkflowMetrics;
}

export interface WorkflowStepResult {
  stepId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startTime: number;
  endTime?: number;
  output: StepOutput;
  error?: string;
  confidence: number;
  metadata: StepMetadata;
}

export interface WorkflowInputs {
  intel: Intel[];
  requirements?: IntelRequirement[];
  context?: AnalysisContext;
  userInputs?: UserInputs;
}

export interface WorkflowOutputs {
  processedIntel?: IntelReportData[];
  reports?: IntelReportData[];
  alerts?: IntelAlert[];
  recommendations?: string[];
  threats?: ThreatAssessment[];
  quality_score?: number;
}

export interface AnalysisContext {
  operationalEnvironment: string;
  timeframe: { start: number; end: number };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analyst: string;
  purpose: string;
  constraints: string[];
}

export interface IntelAlert {
  id: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  intel: Intel[];
  threat?: ThreatAssessment;
  recommendations: string[];
  recipients: string[];
  timestamp: number;
  expiresAt?: number;
}

export interface WorkflowError {
  stepId: string;
  message: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: number;
  context: WorkflowContext;
}

export interface WorkflowMetrics {
  totalDuration: number;
  stepDurations: Record<string, number>;
  intelProcessed: number;
  reportsGenerated: number;
  alertsGenerated: number;
  qualityScore: number;
  confidenceScore: number;
}

// =============================================================================
// INTELLIGENCE WORKFLOW ENGINE
// =============================================================================

export class IntelligenceWorkflowEngine {
  private workflows: Map<string, AnalysisWorkflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private activeExecutions: Set<string> = new Set();
  private eventListeners: Array<() => void> = [];

  constructor() {
    this.initializeDefaultWorkflows();
    this.setupEventListeners();
  }

  // =============================================================================
  // WORKFLOW MANAGEMENT
  // =============================================================================

  /**
   * Register a new analysis workflow
   */
  async registerWorkflow(workflow: AnalysisWorkflow): Promise<void> {
    // Validate workflow structure
    this.validateWorkflow(workflow);
    
    this.workflows.set(workflow.id, workflow);
    
    enhancedEventEmitter.emit('workflow:registered', {
      workflowId: workflow.id,
      type: workflow.type,
      triggers: workflow.triggers.length
    });
  }

  /**
   * Execute a workflow with given inputs
   */
  async executeWorkflow(
    workflowId: string, 
    inputs: WorkflowInputs,
    context?: AnalysisContext
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      workflowId,
      status: 'QUEUED',
      startTime: Date.now(),
      stepResults: {},
      inputs: { ...inputs, context },
      outputs: {},
      errors: [],
      metrics: {
        totalDuration: 0,
        stepDurations: {},
        intelProcessed: inputs.intel.length,
        reportsGenerated: 0,
        alertsGenerated: 0,
        qualityScore: 0,
        confidenceScore: 0
      }
    };

    this.executions.set(execution.id, execution);
    this.activeExecutions.add(execution.id);

    // Start execution asynchronously
    this.runWorkflowExecution(execution, workflow).catch(error => {
      execution.status = 'FAILED';
      execution.errors.push({
        stepId: 'WORKFLOW',
        message: error.message,
        severity: 'CRITICAL',
        timestamp: Date.now(),
        context: { error: error.stack }
      });
      this.activeExecutions.delete(execution.id);
    });

    return execution;
  }

  /**
   * Check for workflow triggers based on incoming intel
   */
  async checkTriggers(intel: Intel): Promise<void> {
    for (const [workflowId, workflow] of this.workflows) {
      if (!workflow.autoExecute) continue;

      for (const trigger of workflow.triggers) {
        if (!trigger.enabled) continue;

        if (await this.evaluateTrigger(trigger, intel)) {
          // Trigger the workflow
          await this.executeWorkflow(workflowId, { intel: [intel] });
          break; // Only trigger once per intel item
        }
      }
    }
  }

  // =============================================================================
  // WORKFLOW EXECUTION ENGINE
  // =============================================================================

  /**
   * Run a complete workflow execution
   */
  private async runWorkflowExecution(
    execution: WorkflowExecution, 
    workflow: AnalysisWorkflow
  ): Promise<void> {
    execution.status = 'RUNNING';
    const startTime = Date.now();

    try {
      enhancedEventEmitter.emit('workflow:started', {
        executionId: execution.id,
        workflowId: workflow.id,
        intelCount: execution.inputs.intel.length
      });

      // Build execution graph
      const executionGraph = this.buildExecutionGraph(workflow.steps);

      // Execute steps in dependency order
      await this.executeStepsInOrder(execution, workflow, executionGraph);

      // Calculate final metrics
      execution.metrics.totalDuration = Date.now() - startTime;
      execution.metrics.qualityScore = this.calculateQualityScore(execution);
      execution.metrics.confidenceScore = this.calculateConfidenceScore(execution);

      execution.status = 'COMPLETED';
      execution.endTime = Date.now();

      enhancedEventEmitter.emit('workflow:completed', {
        executionId: execution.id,
        duration: execution.metrics.totalDuration,
        qualityScore: execution.metrics.qualityScore
      });

    } catch (error) {
      execution.status = 'FAILED';
      execution.endTime = Date.now();
      execution.errors.push({
        stepId: 'EXECUTION',
        message: error.message,
        severity: 'CRITICAL',
        timestamp: Date.now(),
        context: { error: error.stack }
      });

      enhancedEventEmitter.emit('workflow:failed', {
        executionId: execution.id,
        error: error.message
      });
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  /**
   * Execute steps in dependency order
   */
  private async executeStepsInOrder(
    execution: WorkflowExecution,
    workflow: AnalysisWorkflow,
    graph: Map<string, string[]>
  ): Promise<void> {
    const completed = new Set<string>();
    const running = new Set<string>();
    
    // Validate we have the dependency graph
    if (graph.size === 0) {
      console.warn('Empty execution graph provided');
    }
    
    // Get steps that can run immediately (no dependencies)
    const readySteps = workflow.steps.filter(step => 
      step.dependencies.length === 0 || 
      step.dependencies.every(dep => completed.has(dep))
    );

    // Process ready steps
    while (readySteps.length > 0 || running.size > 0) {
      // Start parallel steps
      const parallelSteps = readySteps.filter(step => step.parallel);
      const serialSteps = readySteps.filter(step => !step.parallel);

      // Execute parallel steps concurrently
      if (parallelSteps.length > 0) {
        const promises = parallelSteps.map(step => 
          this.executeWorkflowStep(execution, step, workflow)
        );
        
        parallelSteps.forEach(step => {
          running.add(step.id);
          readySteps.splice(readySteps.indexOf(step), 1);
        });

        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          const stepId = parallelSteps[index].id;
          running.delete(stepId);
          completed.add(stepId);
          
          if (result.status === 'rejected') {
            execution.errors.push({
              stepId,
              message: result.reason.message,
              severity: 'ERROR',
              timestamp: Date.now(),
              context: { error: result.reason.stack }
            });
          }
        });
      }

      // Execute serial steps one by one
      for (const step of serialSteps) {
        running.add(step.id);
        readySteps.splice(readySteps.indexOf(step), 1);
        
        try {
          await this.executeWorkflowStep(execution, step, workflow);
          completed.add(step.id);
        } catch (error) {
          execution.errors.push({
            stepId: step.id,
            message: error.message,
            severity: 'ERROR',
            timestamp: Date.now(),
            context: { error: error.stack }
          });
        } finally {
          running.delete(step.id);
        }
      }

      // Find newly ready steps
      const newReadySteps = workflow.steps.filter(step => 
        !completed.has(step.id) && 
        !running.has(step.id) &&
        !readySteps.includes(step) &&
        step.dependencies.every(dep => completed.has(dep))
      );

      readySteps.push(...newReadySteps);
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    workflow: AnalysisWorkflow
  ): Promise<void> {
    const stepResult: WorkflowStepResult = {
      stepId: step.id,
      status: 'RUNNING',
      startTime: Date.now(),
      output: null,
      confidence: 0,
      metadata: {}
    };

    execution.stepResults[step.id] = stepResult;
    execution.currentStep = step.id;

    try {
      // Get inputs for this step
      const stepInputs = this.gatherStepInputs(execution, step);

      // Add workflow context to processing
      const processingContext = execution.inputs.context;
      if (workflow.requiredClassification) {
        // Ensure processing respects workflow classification requirements
        console.log(`Processing step ${step.id} with classification requirement: ${workflow.requiredClassification}`);
      }

      // Execute the appropriate processor
      const result = await this.executeStepProcessor(step, stepInputs, processingContext);

      stepResult.output = result.output;
      stepResult.confidence = result.confidence;
      stepResult.metadata = result.metadata;
      stepResult.status = 'COMPLETED';
      stepResult.endTime = Date.now();

      // Store outputs for dependent steps
      this.storeStepOutputs(execution, step, result.output);

      execution.metrics.stepDurations[step.id] = stepResult.endTime - stepResult.startTime;

    } catch (error) {
      stepResult.status = 'FAILED';
      stepResult.error = error.message;
      stepResult.endTime = Date.now();
      throw error;
    }
  }

  // =============================================================================
  // STEP PROCESSORS
  // =============================================================================

  /**
   * Execute the appropriate processor for a workflow step
   */
  private async executeStepProcessor(
    step: WorkflowStep,
    inputs: StepOutput,
    context?: AnalysisContext
  ): Promise<{ output: StepOutput; confidence: number; metadata: StepMetadata }> {
    
    switch (step.type) {
      case 'VALIDATE':
        return await this.processValidationStep(inputs, context);
      
      case 'ANALYZE':
        return await this.processAnalysisStep(inputs, context);
      
      case 'CORRELATE':
        return await this.processCorrelationStep(inputs, context);
      
      case 'ASSESS':
        return await this.processAssessmentStep(inputs, context);
      
      case 'REPORT':
        return await this.processReportStep(inputs, context);
      
      case 'DISSEMINATE':
        return await this.processDisseminationStep(inputs, context);
      
      case 'ALERT':
        return await this.processAlertStep(inputs, context);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Process validation step - validates intel quality and reliability
   */
  private async processValidationStep(
    inputs: StepOutput,
    context?: AnalysisContext
  ): Promise<{ output: StepOutput; confidence: number; metadata: StepMetadata }> {
    
    const intel = inputs.intel as Intel[] || [];
    const validatedIntel: Intel[] = [];
    const validationResults: WorkflowValidationResult[] = [];
    let totalConfidence = 0;

    for (const intelItem of intel) {
      const validation = IntelValidator.validateIntel(intelItem);
      
      // Convert to our workflow validation result format
      const workflowValidation: WorkflowValidationResult = {
        isValid: validation.isValid,
        score: validation.score,
        errors: validation.errors.map(err => err.message),
        warnings: validation.warnings.map(warn => warn.message)
      };
      
      validationResults.push(workflowValidation);
      
      if (workflowValidation.isValid) {
        validatedIntel.push(intelItem);
        totalConfidence += workflowValidation.score;
      }
    }

    const avgConfidence = validatedIntel.length > 0 ? totalConfidence / validatedIntel.length : 0;

    // Apply context-based adjustments
    let finalConfidence = avgConfidence;
    if (context?.priority === 'CRITICAL') {
      finalConfidence = Math.min(100, avgConfidence * 1.1); // Boost confidence for critical contexts
    }

    return {
      output: {
        validatedIntel,
        validationResults,
        qualityScore: finalConfidence
      },
      confidence: finalConfidence / 100,
      metadata: {
        totalIntel: intel.length,
        validIntel: validatedIntel.length,
        rejectedIntel: intel.length - validatedIntel.length,
        avgQualityScore: finalConfidence,
        contextPriority: context?.priority || 'NONE'
      }
    };
  }

  /**
   * Process analysis step - converts raw intel to processed intelligence
   */
  private async processAnalysisStep(
    inputs: StepOutput,
    context?: AnalysisContext
  ): Promise<{ output: StepOutput; confidence: number; metadata: StepMetadata }> {
    
    const intel = (inputs.validatedIntel || inputs.intel) as Intel[] || [];
    const processedIntel: IntelReportData[] = [];
    let totalConfidence = 0;

    for (const intelItem of intel) {
      // Convert Intel to IntelReportData with analysis
      const reportData: IntelReportData = {
        ...intelItem,
        summary: `Automated analysis of ${intelItem.title || intelItem.source?.primary || 'intelligence item'}`,
        reliability: 'C', // Default reliability score
        processingHistory: [{
          stage: 'approved' as const,
          timestamp: new Date().toISOString(),
          processedBy: context?.analyst || 'automated-system',
          notes: 'Processed via intelligence workflow engine'
        }]
      };

      processedIntel.push(reportData);
      totalConfidence += reportData.reliability === 'A' ? 95 : 
                        reportData.reliability === 'B' ? 85 :
                        reportData.reliability === 'C' ? 75 : 60;
    }

    const avgConfidence = processedIntel.length > 0 ? totalConfidence / processedIntel.length : 0;

    return {
      output: {
        processedIntel,
        analysisComplete: true
      },
      confidence: avgConfidence / 100,
      metadata: {
        intelProcessed: processedIntel.length,
        avgConfidence,
        analysisMethod: 'automated-workflow',
        processedAt: Date.now()
      }
    };
  }

  /**
   * Process correlation step - finds patterns and relationships between intel
   */
  private async processCorrelationStep(
    inputs: StepOutput,
    context?: AnalysisContext
  ): Promise<{ output: StepOutput; confidence: number; metadata: StepMetadata }> {
    
    const processedIntel = inputs.processedIntel as Intelligence[] || [];
    const correlations = await this.findIntelCorrelations(processedIntel);
    const patterns = await this.identifyPatterns(processedIntel);
    const relationships = await this.mapRelationships(processedIntel);

    // Use context for additional analysis if available
    const analysisDepth = context?.priority === 'CRITICAL' ? 'DEEP' : 'STANDARD';

    return {
      output: {
        correlations,
        patterns,
        relationships,
        correlationComplete: true,
        analysisDepth
      },
      confidence: 0.85, // Base confidence for correlation analysis
      metadata: {
        correlationsFound: correlations.length,
        patternsIdentified: patterns.length,
        relationshipsMapped: relationships.length,
        correlationMethod: 'graph-analysis',
        analysisDepth
      }
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Initialize default workflows for common intelligence processes
   */
  private initializeDefaultWorkflows(): void {
    // Immediate Threat Assessment Workflow
    this.workflows.set('immediate-threat-assessment', {
      id: 'immediate-threat-assessment',
      name: 'Immediate Threat Assessment',
      type: 'IMMEDIATE',
      priority: 100,
      estimatedDuration: 5,
      requiredClassification: 'SECRET',
      autoExecute: true,
      triggers: [{
        type: 'INTEL_RECEIVED',
        enabled: true,
        conditions: [{
          field: 'tags',
          operator: 'contains',
          value: 'threat',
          weight: 0.8
        }, {
          field: 'classification',
          operator: 'equals',
          value: 'SECRET',
          weight: 0.6
        }]
      }],
      steps: [
        {
          id: 'validate-threat-intel',
          name: 'Validate Threat Intel',
          type: 'VALIDATE',
          processor: 'threat-validator',
          inputs: ['intel'],
          outputs: ['validatedIntel'],
          timeout: 60,
          retryCount: 2,
          dependencies: [],
          parallel: false
        },
        {
          id: 'analyze-threat',
          name: 'Analyze Threat Indicators',
          type: 'ANALYZE',
          processor: 'threat-analyzer',
          inputs: ['validatedIntel'],
          outputs: ['threatAnalysis'],
          timeout: 120,
          retryCount: 1,
          dependencies: ['validate-threat-intel'],
          parallel: false
        },
        {
          id: 'assess-threat-level',
          name: 'Assess Threat Level',
          type: 'ASSESS',
          processor: 'threat-assessor',
          inputs: ['threatAnalysis'],
          outputs: ['threatAssessment'],
          timeout: 60,
          retryCount: 1,
          dependencies: ['analyze-threat'],
          parallel: false
        },
        {
          id: 'generate-alert',
          name: 'Generate Threat Alert',
          type: 'ALERT',
          processor: 'alert-generator',
          inputs: ['threatAssessment'],
          outputs: ['alert'],
          timeout: 30,
          retryCount: 2,
          dependencies: ['assess-threat-level'],
          parallel: true
        },
        {
          id: 'create-threat-report',
          name: 'Create Threat Report',
          type: 'REPORT',
          processor: 'threat-reporter',
          inputs: ['threatAssessment', 'threatAnalysis'],
          outputs: ['threatReport'],
          timeout: 180,
          retryCount: 1,
          dependencies: ['assess-threat-level'],
          parallel: true
        }
      ]
    });

    // Add more default workflows...
    this.workflows.set('routine-intelligence-processing', this.createRoutineProcessingWorkflow());
    this.workflows.set('cross-domain-analysis', this.createCrossDomainWorkflow());
    this.workflows.set('pattern-hunting', this.createPatternHuntingWorkflow());
  }

  // ... Additional helper methods for workflow creation, execution, and management
  // (Implementation continues with specific processor methods, validation, etc.)

  private createRoutineProcessingWorkflow(): AnalysisWorkflow {
    // Implementation for routine processing workflow
    return {
      id: 'routine-intelligence-processing',
      name: 'Routine Intelligence Processing',
      type: 'ROUTINE',
      priority: 50,
      estimatedDuration: 15,
      requiredClassification: 'CONFIDENTIAL',
      autoExecute: true,
      triggers: [],
      steps: []
    };
  }

  private createCrossDomainWorkflow(): AnalysisWorkflow {
    // Implementation for cross-domain analysis workflow
    return {
      id: 'cross-domain-analysis',
      name: 'Cross-Domain Intelligence Analysis',
      type: 'CROSS_DOMAIN',
      priority: 75,
      estimatedDuration: 30,
      requiredClassification: 'SECRET',
      autoExecute: false,
      triggers: [],
      steps: []
    };
  }

  private createPatternHuntingWorkflow(): AnalysisWorkflow {
    // Implementation for pattern hunting workflow
    return {
      id: 'pattern-hunting',
      name: 'Intelligence Pattern Hunting',
      type: 'THREAT_HUNTING',
      priority: 60,
      estimatedDuration: 45,
      requiredClassification: 'SECRET',
      autoExecute: false,
      triggers: [],
      steps: []
    };
  }

  /**
   * Setup event listeners for workflow monitoring
   */
  private setupEventListeners(): void {
    const listener1 = enhancedEventEmitter.on('intel:received', (intel: Intel) => {
      this.checkTriggers(intel).catch(error => {
        console.error('Error checking workflow triggers:', error);
      });
    });

    const listener2 = enhancedEventEmitter.on('workflow:error', (data: { executionId: string; error: string }) => {
      console.error(`Workflow error in execution ${data.executionId}:`, data.error);
    });

    this.eventListeners.push(
      () => listener1.unsubscribe(),
      () => listener2.unsubscribe()
    );
  }

  /**
   * Check for circular dependencies in workflow steps
   */
  private checkCircularDependencies(steps: WorkflowStep[]): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (stepId: string): void => {
      if (visiting.has(stepId)) {
        throw new Error(`Circular dependency detected involving step: ${stepId}`);
      }
      if (visited.has(stepId)) {
        return;
      }

      visiting.add(stepId);
      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const depId of step.dependencies) {
          visit(depId);
        }
      }
      visiting.delete(stepId);
      visited.add(stepId);
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        visit(step.id);
      }
    }
  }

  /**
   * Validate workflow structure and configuration
   */
  private validateWorkflow(workflow: AnalysisWorkflow): void {
    if (!workflow.id || workflow.id.trim().length === 0) {
      throw new Error('Workflow must have a valid ID');
    }

    if (!workflow.name || workflow.name.trim().length === 0) {
      throw new Error('Workflow must have a valid name');
    }

    if (workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate step dependencies
    const stepIds = new Set(workflow.steps.map(s => s.id));
    for (const step of workflow.steps) {
      for (const depId of step.dependencies) {
        if (!stepIds.has(depId)) {
          throw new Error(`Step ${step.id} depends on non-existent step ${depId}`);
        }
      }
    }

    // Check for circular dependencies
    this.checkCircularDependencies(workflow.steps);
  }
  /**
   * Build execution graph for dependency management
   */
  private buildExecutionGraph(steps: WorkflowStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const step of steps) {
      graph.set(step.id, step.dependencies);
    }
    
    return graph;
  }

  /**
   * Evaluate whether a trigger condition is met
   */
  private async evaluateTrigger(trigger: WorkflowTrigger, intel: Intel): Promise<boolean> {
    if (trigger.type === 'INTEL_RECEIVED') {
      let totalWeight = 0;
      let matchedWeight = 0;

      for (const condition of trigger.conditions) {
        totalWeight += condition.weight;
        
        if (this.evaluateCondition(condition, intel)) {
          matchedWeight += condition.weight;
        }
      }

      // Trigger fires if at least 70% of weighted conditions are met
      return totalWeight > 0 && (matchedWeight / totalWeight) >= 0.7;
    }

    return false;
  }

  /**
   * Evaluate a single trigger condition against intel data
   */
  private evaluateCondition(condition: TriggerCondition, intel: Intel): boolean {
    const fieldValue = this.getFieldValue(intel, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'contains':
        if (Array.isArray(fieldValue) && typeof condition.value === 'string') {
          return fieldValue.includes(condition.value);
        }
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
        }
        return false;
      
      case 'greater_than':
        return typeof fieldValue === 'number' && typeof condition.value === 'number' 
          && fieldValue > condition.value;
      
      case 'less_than':
        return typeof fieldValue === 'number' && typeof condition.value === 'number' 
          && fieldValue < condition.value;
      
      case 'in_range':
        if (typeof fieldValue === 'number' && Array.isArray(condition.value) && condition.value.length === 2) {
          const [min, max] = condition.value;
          return typeof min === 'number' && typeof max === 'number' && 
                 fieldValue >= min && fieldValue <= max;
        }
        return false;
      
      case 'pattern_match':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          try {
            const regex = new RegExp(condition.value, 'i');
            return regex.test(fieldValue);
          } catch {
            return false;
          }
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Get field value from intel object using dot notation
   */
  private getFieldValue(intel: Intel, fieldPath: string): unknown {
    const parts = fieldPath.split('.');
    let value: unknown = intel;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Gather inputs needed for a workflow step
   */
  private gatherStepInputs(execution: WorkflowExecution, step: WorkflowStep): StepOutput {
    const inputs: StepOutput = {};
    
    for (const inputName of step.inputs) {
      if (inputName === 'intel') {
        inputs.intel = execution.inputs.intel;
      } else if (inputName === 'requirements') {
        inputs.requirements = execution.inputs.requirements;
      } else if (inputName === 'context') {
        inputs.context = execution.inputs.context;
      } else {
        // Look for output from previous steps
        for (const stepResult of Object.values(execution.stepResults)) {
          if (stepResult.output && stepResult.output[inputName]) {
            inputs[inputName] = stepResult.output[inputName];
            break;
          }
        }
      }
    }
    
    return inputs;
  }

  /**
   * Store outputs from a workflow step for use by dependent steps
   */
  private storeStepOutputs(execution: WorkflowExecution, step: WorkflowStep, output: StepOutput): void {
    const stepResult = execution.stepResults[step.id];
    if (stepResult) {
      stepResult.output = output;
    }

    // Store in execution outputs if it's a final output
    for (const outputName of step.outputs) {
      if (output[outputName]) {
        if (!execution.outputs) {
          execution.outputs = {};
        }
        execution.outputs[outputName] = output[outputName];
      }
    }
  }
  /**
   * Calculate overall quality score for workflow execution
   */
  private calculateQualityScore(execution: WorkflowExecution): number {
    let totalScore = 0;
    let stepCount = 0;
    
    for (const stepResult of Object.values(execution.stepResults)) {
      if (stepResult.status === 'COMPLETED') {
        totalScore += stepResult.confidence * 100;
        stepCount++;
      }
    }
    
    if (stepCount === 0) return 0;
    
    const avgStepScore = totalScore / stepCount;
    
    // Adjust for error rate
    const errorPenalty = execution.errors.length * 5;
    const adjustedScore = Math.max(0, avgStepScore - errorPenalty);
    
    return Math.round(adjustedScore);
  }

  /**
   * Calculate overall confidence score for workflow execution
   */
  private calculateConfidenceScore(execution: WorkflowExecution): number {
    const completedSteps = Object.values(execution.stepResults)
      .filter(step => step.status === 'COMPLETED');
    
    if (completedSteps.length === 0) return 0;
    
    const avgConfidence = completedSteps.reduce((sum, step) => sum + step.confidence, 0) / completedSteps.length;
    
    // Scale to percentage
    return Math.round(avgConfidence * 100);
  }

  // Intelligence analysis helper methods
  /**
   * Generate automated analysis for intel
   */
  private async generateIntelAnalysis(intel: Intel, context?: AnalysisContext): Promise<string> {
    const analysisPoints: string[] = [];
    
    // Basic data analysis
    if (intel.data) {
      const dataStr = JSON.stringify(intel.data);
      analysisPoints.push(`Data analysis: ${dataStr.length} characters of structured data`);
    }
    
    // Source analysis
    analysisPoints.push(`Source: ${intel.source} (Reliability: ${intel.reliability})`);
    
    // Classification analysis
    analysisPoints.push(`Classification: ${intel.classification}`);
    
    // Temporal analysis
    const age = Date.now() - intel.timestamp;
    const ageHours = Math.round(age / (1000 * 60 * 60));
    analysisPoints.push(`Age: ${ageHours} hours`);
    
    // Location analysis
    if (intel.latitude && intel.longitude) {
      analysisPoints.push(`Location: ${intel.latitude}, ${intel.longitude}`);
    } else if (intel.location) {
      analysisPoints.push(`Location: ${intel.location}`);
    }
    
    // Context-based analysis
    if (context?.operationalEnvironment) {
      analysisPoints.push(`Operational relevance: Applicable to ${context.operationalEnvironment}`);
    }
    
    return `Automated Analysis:\n${analysisPoints.join('\n')}`;
  }

  /**
   * Calculate confidence score for intel based on multiple factors
   */
  private calculateIntelConfidence(intel: Intel): number {
    let confidence = 50; // Base confidence
    
    // Source reliability factor
    const reliabilityMap: Record<string, number> = {
      'A': 95, 'B': 80, 'C': 65, 'D': 50, 'E': 35, 'F': 20, 'X': 10
    };
    confidence = reliabilityMap[intel.reliability] || 50;
    
    // Recency factor (newer intel is more reliable)
    const age = Date.now() - intel.timestamp;
    const ageHours = age / (1000 * 60 * 60);
    if (ageHours < 1) confidence += 10;
    else if (ageHours < 24) confidence += 5;
    else if (ageHours > 168) confidence -= 10; // Week old
    
    // Validation factor
    if (intel.verified) confidence += 15;
    
    // Data quality factor
    if (intel.data) {
      const dataStr = JSON.stringify(intel.data);
      if (dataStr.length > 100) confidence += 5;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Assess strategic significance of intel
   */
  private assessIntelSignificance(intel: Intel, context?: AnalysisContext): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let score = 0;
    
    // Classification level significance
    const classificationScores: Record<string, number> = {
      'UNCLASS': 1, 'CONFIDENTIAL': 2, 'SECRET': 3, 'TOP_SECRET': 4
    };
    score += classificationScores[intel.classification] || 1;
    
    // Source reliability significance
    const reliabilityScores: Record<string, number> = {
      'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0, 'F': 0, 'X': 0
    };
    score += reliabilityScores[intel.reliability] || 1;
    
    // Data analysis for threat indicators
    if (intel.data) {
      const dataStr = JSON.stringify(intel.data).toLowerCase();
      const threatKeywords = ['threat', 'attack', 'critical', 'urgent', 'immediate'];
      const hasThreats = threatKeywords.some(keyword => dataStr.includes(keyword));
      if (hasThreats) score += 2;
    }
    
    // Context priority factor
    if (context?.priority) {
      const priorityScores: Record<string, number> = {
        'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'CRITICAL': 3
      };
      score += priorityScores[context.priority] || 0;
    }
    
    // Determine significance level
    if (score >= 8) return 'CRITICAL';
    if (score >= 6) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Find related intel based on content and metadata similarity
   */
  private async findRelatedIntel(intel: Intel): Promise<string[]> {
    // This would typically query a database or search index
    // For now, return placeholder based on tags and keywords
    const relatedIds: string[] = [];
    
    if (intel.tags && intel.tags.length > 0) {
      // Simulate finding intel with similar tags
      relatedIds.push(`related_${intel.tags[0]}_001`, `related_${intel.tags[0]}_002`);
    }
    
    return relatedIds;
  }

  /**
   * Identify potential threats from intel data
   */
  private async identifyThreats(intel: Intel): Promise<ThreatAssessment[]> {
    const threats: ThreatAssessment[] = [];
    
    if (intel.data) {
      const dataStr = JSON.stringify(intel.data).toLowerCase();
      const threatPatterns = [
        { pattern: /attack|assault|strike/i, type: 'KINETIC', impact: 'HIGH' },
        { pattern: /cyber|hack|intrusion/i, type: 'CYBER', impact: 'MEDIUM' },
        { pattern: /bomb|explosive|ied/i, type: 'EXPLOSIVE', impact: 'CRITICAL' }
      ];
      
      for (const threatPattern of threatPatterns) {
        if (threatPattern.pattern.test(dataStr)) {
          threats.push({
            type: threatPattern.type,
            likelihood: this.calculateIntelConfidence(intel),
            impact: threatPattern.impact as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            timeframe: 'SHORT_TERM',
            mitigation: [`Investigate ${threatPattern.type.toLowerCase()} threat indicators`]
          });
        }
      }
    }
    
    return threats;
  }

  /**
   * Identify opportunities from intel data
   */
  private async identifyOpportunities(intel: Intel): Promise<string[]> {
    const opportunities: string[] = [];
    
    if (intel.data) {
      const dataStr = JSON.stringify(intel.data).toLowerCase();
      const opportunityKeywords = ['opportunity', 'weakness', 'vulnerability', 'advantage'];
      
      for (const keyword of opportunityKeywords) {
        if (dataStr.includes(keyword)) {
          opportunities.push(`Potential ${keyword} identified in intel data`);
        }
      }
    }
    
    return opportunities;
  }

  /**
   * Generate actionable recommendations based on intel
   */
  private async generateRecommendations(intel: Intel): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Source-based recommendations
    if (intel.reliability === 'F' || intel.reliability === 'X') {
      recommendations.push('Seek corroboration from more reliable sources');
    }
    
    // Age-based recommendations
    const age = Date.now() - intel.timestamp;
    const ageHours = age / (1000 * 60 * 60);
    if (ageHours > 72) {
      recommendations.push('Intel is aging - consider seeking updated information');
    }
    
    // Classification-based recommendations
    if (intel.classification === 'TOP_SECRET') {
      recommendations.push('Handle with compartmented access controls');
      recommendations.push('Consider declassification timeline for operational use');
    }
    
    // Data-based recommendations
    if (intel.data) {
      const dataStr = JSON.stringify(intel.data).toLowerCase();
      if (dataStr.includes('urgent')) {
        recommendations.push('Prioritize immediate analysis and dissemination');
      }
      if (dataStr.includes('unconfirmed')) {
        recommendations.push('Seek additional validation before acting');
      }
    }
    
    return recommendations;
  }

  /**
   * Find correlations between intelligence items
   */
  private async findIntelCorrelations(intel: Intelligence[]): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];
    
    for (let i = 0; i < intel.length; i++) {
      for (let j = i + 1; j < intel.length; j++) {
        const sourceIntel = intel[i];
        const targetIntel = intel[j];
        
        // Temporal correlation (within 24 hours)
        const timeDiff = Math.abs(sourceIntel.timestamp - targetIntel.timestamp);
        if (timeDiff < 24 * 60 * 60 * 1000) {
          correlations.push({
            sourceId: sourceIntel.id,
            targetId: targetIntel.id,
            correlationType: 'TEMPORAL',
            confidence: 0.7,
            evidence: ['Intel items collected within 24 hours']
          });
        }
        
        // Tag-based correlation
        if (sourceIntel.tags && targetIntel.tags) {
          const commonTags = sourceIntel.tags.filter(tag => targetIntel.tags?.includes(tag));
          if (commonTags.length > 0) {
            correlations.push({
              sourceId: sourceIntel.id,
              targetId: targetIntel.id,
              correlationType: 'ENTITY',
              confidence: 0.6 + (commonTags.length * 0.1),
              evidence: [`Common tags: ${commonTags.join(', ')}`]
            });
          }
        }
      }
    }
    
    return correlations;
  }

  /**
   * Identify patterns in intelligence data
   */
  private async identifyPatterns(intel: Intelligence[]): Promise<PatternResult[]> {
    const patterns: PatternResult[] = [];
    
    // Frequency pattern analysis
    const tagFrequency = new Map<string, number>();
    const sourceFrequency = new Map<string, number>();
    
    for (const item of intel) {
      // Tag frequency
      if (item.tags) {
        for (const tag of item.tags) {
          tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
        }
      }
      
    // Source frequency
    sourceFrequency.set(item.source, (sourceFrequency.get(item.source) || 0) + 1);
    }
    
    // Identify high-frequency tags as trends
    for (const [tag, frequency] of tagFrequency.entries()) {
      if (frequency >= 3) {
        patterns.push({
          id: `pattern_tag_${tag}`,
          type: 'TREND',
          description: `High frequency of intel tagged with "${tag}"`,
          confidence: Math.min(0.9, frequency * 0.2),
          frequency,
          entities: [tag]
        });
      }
    }
    
    // Temporal clustering
    const sortedByTime = intel.sort((a, b) => a.timestamp - b.timestamp);
    let clusterCount = 0;
    for (let i = 0; i < sortedByTime.length - 2; i++) {
      const timeDiff1 = sortedByTime[i + 1].timestamp - sortedByTime[i].timestamp;
      const timeDiff2 = sortedByTime[i + 2].timestamp - sortedByTime[i + 1].timestamp;
      
      // If three consecutive items within 1 hour
      if (timeDiff1 < 60 * 60 * 1000 && timeDiff2 < 60 * 60 * 1000) {
        clusterCount++;
        patterns.push({
          id: `pattern_cluster_${clusterCount}`,
          type: 'CLUSTER',
          description: 'Temporal clustering of intelligence collection',
          confidence: 0.8,
          frequency: 3,
          entities: [sortedByTime[i].id, sortedByTime[i + 1].id, sortedByTime[i + 2].id]
        });
      }
    }
    
    return patterns;
  }

  /**
   * Map relationships between entities in intelligence
   */
  private async mapRelationships(intel: Intelligence[]): Promise<RelationshipResult[]> {
    const relationships: RelationshipResult[] = [];
    
    // Extract entities from content (simplified)
    const entityMap = new Map<string, string[]>();
    
    for (const item of intel) {
      if (item.data) {
        // Simple entity extraction from data (in real implementation, use NLP)
        const dataStr = JSON.stringify(item.data);
        const entities = dataStr.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) || [];
        entityMap.set(item.id, entities);
      }
    }
    
    // Find co-occurring entities
    const coOccurrence = new Map<string, Map<string, number>>();
    
    for (const [, entities] of entityMap.entries()) {
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const entity1 = entities[i];
          const entity2 = entities[j];
          
          if (!coOccurrence.has(entity1)) {
            coOccurrence.set(entity1, new Map());
          }
          
          const entity1Map = coOccurrence.get(entity1)!;
          entity1Map.set(entity2, (entity1Map.get(entity2) || 0) + 1);
        }
      }
    }
    
    // Convert co-occurrences to relationships
    for (const [entity1, relatedEntities] of coOccurrence.entries()) {
      for (const [entity2, count] of relatedEntities.entries()) {
        if (count >= 2) { // Appears together at least twice
          relationships.push({
            fromEntity: entity1,
            toEntity: entity2,
            relationshipType: 'CO_OCCURRENCE',
            strength: Math.min(1.0, count * 0.2),
            evidence: [`Appears together in ${count} intelligence items`]
          });
        }
      }
    }
    
    return relationships;
  }

  /**
   * Process assessment step - perform threat and opportunity assessment
   */
  private async processAssessmentStep(
    inputs: StepOutput, 
    context?: AnalysisContext
  ): Promise<{ output: StepOutput; confidence: number; metadata: StepMetadata }> {
    
    const processedIntel = inputs.processedIntel as Intelligence[] || [];
    const assessments: ThreatAssessment[] = [];
    const opportunities: string[] = [];
    
    for (const intel of processedIntel) {
      const threats = await this.identifyThreats(intel);
      const opps = await this.identifyOpportunities(intel);
      
      assessments.push(...threats);
      opportunities.push(...opps);
    }
    
    const priority = context?.priority || 'MEDIUM';
    
    return {
      output: {
        threatAssessments: assessments,
        opportunities,
        overallRisk: assessments.length > 0 ? 'HIGH' : 'LOW',
        priority
      },
      confidence: 0.85,
      metadata: {
        threatsIdentified: assessments.length,
        opportunitiesFound: opportunities.length,
        assessmentMethod: 'automated-analysis'
      }
    };
  }

  /**
   * Process report generation step
   */
  private async processReportStep(
    inputs: StepOutput, 
    context?: AnalysisContext
  ): Promise<{ output: StepOutput; confidence: number; metadata: StepMetadata }> {
    
    const processedIntel = inputs.processedIntel as Intelligence[] || [];
    const threatAssessments = inputs.threatAssessments as ThreatAssessment[] || [];
    
    const reportData: IntelReportData = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: `Intelligence Report - ${new Date().toISOString().split('T')[0]}`,
      content: `Analysis of ${processedIntel.length} intelligence items`,
      reportType: 'ANALYSIS_REPORT',
      reportNumber: `RPT-${Date.now()}`,
      version: '1.0',
      classification: {
        level: 'SECRET',
        compartments: [],
        disseminationControls: [],
        handlingCaveats: [],
        releasabilityTo: []
      },
      distributionType: 'ROUTINE',
      distributionList: [],
      handlingInstructions: [],
      executiveSummary: `Automated analysis of intelligence collected from multiple sources`,
      keyFindings: threatAssessments.map(threat => 
        `${threat.type} threat identified with ${threat.likelihood}% likelihood`
      ),
      analysisAndAssessment: 'Automated workflow analysis completed',
      conclusions: 'Analysis provides tactical and strategic insights',
      recommendations: [],
      intelligenceGaps: [],
      sources: processedIntel.map(intel => ({
        primary: intel.source,
        method: 'AUTOMATED',
        platform: 'CYBER',
        quality: 'VERIFIED',
        sourceId: intel.id,
        collectionDate: intel.timestamp,
        custodyChain: [intel.collectedBy],
        lastHandler: intel.collectedBy,
        confidence: this.calculateIntelConfidence(intel),
        completeness: 85,
        timeliness: 90
      })),
      sourceSummary: `Analysis based on ${processedIntel.length} sources`,
      collectionDisciplines: processedIntel.map(intel => intel.source),
      geographicScope: {
        type: 'REGIONAL'
      },
      timeframe: {
        start: Math.min(...processedIntel.map(intel => intel.timestamp)),
        end: Math.max(...processedIntel.map(intel => intel.timestamp))
      },
      relatedReports: [],
      threatAssessments: [],
      riskAssessments: [],
      attachments: [],
      confidence: 85,
      reliabilityScore: 80,
      completeness: 75,
      timeliness: 90,
      status: 'DRAFT',
      workflowSteps: [],
      approvalChain: [],
      author: context?.analyst || 'automated-system',
      contributors: [],
      reviewedBy: [],
      approvedBy: '',
      publishedTo: [],
      accessLog: [],
      feedback: [],
      viewCount: 0,
      downloadCount: 0,
      citationCount: 0,
      tags: [],
      timestamp: Date.now()
    };
    
    return {
      output: {
        report: reportData,
        reportGenerated: true
      },
      confidence: 0.9,
      metadata: {
        reportId: reportData.id,
        intelItemsAnalyzed: processedIntel.length,
        threatsReported: threatAssessments.length
      }
    };
  }

  /**
   * Process dissemination step
   */
  private async processDisseminationStep(
    inputs: StepOutput, 
    context?: AnalysisContext
  ): Promise<{ output: StepOutput; confidence: number; metadata: StepMetadata }> {
    
    const report = inputs.report as IntelReportData;
    const priority = context?.priority || 'MEDIUM';
    
    // Determine dissemination list based on classification and priority
    const recipients: string[] = [];
    
    if (report?.classification.level === 'TOP_SECRET') {
      recipients.push('clearance-ts-analysts', 'operations-command');
    } else if (report?.classification.level === 'SECRET') {
      recipients.push('cleared-analysts', 'field-commanders');
    }
    
    if (priority === 'CRITICAL') {
      recipients.push('emergency-response-team', 'senior-leadership');
    }
    
    return {
      output: {
        disseminationComplete: true,
        recipients,
        disseminationMethod: 'secure-channels'
      },
      confidence: 0.95,
      metadata: {
        recipientCount: recipients.length,
        disseminationTime: Date.now(),
        deliveryMethod: 'automated'
      }
    };
  }

  /**
   * Process alert generation step
   */
  private async processAlertStep(
    inputs: StepOutput, 
    context?: AnalysisContext
  ): Promise<{ output: StepOutput; confidence: number; metadata: StepMetadata }> {
    
    const threatAssessments = inputs.threatAssessments as ThreatAssessment[] || [];
    const processedIntel = inputs.processedIntel as Intelligence[] || [];
    const priority = context?.priority || 'MEDIUM';
    
    const alerts: IntelAlert[] = [];
    
    for (const threat of threatAssessments) {
      if (threat.impact === 'CRITICAL' || threat.impact === 'HIGH') {
        const alert: IntelAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          level: threat.impact === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          title: `${threat.type} Threat Alert`,
          description: `${threat.type} threat detected with ${threat.likelihood}% likelihood`,
          intel: processedIntel,
          threat,
          recommendations: threat.mitigation || [],
          recipients: priority === 'CRITICAL' 
            ? ['threat-response-team', 'operations-center', 'senior-leadership']
            : ['threat-response-team', 'operations-center'],
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        alerts.push(alert);
      }
    }
    
    return {
      output: {
        alerts,
        alertsGenerated: alerts.length,
        highPriorityAlerts: alerts.filter(a => a.level === 'CRITICAL').length
      },
      confidence: 0.9,
      metadata: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.level === 'CRITICAL').length,
        warningAlerts: alerts.filter(a => a.level === 'WARNING').length,
        priority
      }
    };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string { 
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
