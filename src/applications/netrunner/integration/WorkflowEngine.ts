/**
 * WorkflowEngine.ts
 * 
 * This module provides workflow management for BotRoster bots,
 * enabling the orchestration of automated OSINT operations.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  OsintBot, 
  BotCapability
} from './BotRosterIntegration';
import { 
  NetRunnerTool, 
  ToolExecutionRequest, 
  ToolExecutionResponse 
} from '../tools/NetRunnerPowerTools';
import { getAdapter } from '../tools/adapters/AdapterRegistry';

// Workflow definition for bot automation
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  parallelExecution: boolean;
  triggers: WorkflowTrigger[];
  schedule?: WorkflowSchedule;
  botIds: string[];
  created: string;
  updated: string;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'inactive' | 'archived';
  tags: string[];
  owner: string;
  executionCount: number;
  averageDuration: number;
  configuration: WorkflowConfiguration;
  dataFlow: DataFlowConfiguration;
}

// Workflow step definition
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  toolId: string;
  botId?: string;  // If undefined, the system assigns a compatible bot
  parameters: Record<string, unknown>;
  requiredCapabilities: BotCapability[];
  dependsOn: string[];  // IDs of steps that must complete before this step
  timeout: number;  // In seconds
  retryCount: number;
  retryDelay: number;  // In seconds
  condition?: StepCondition;
  onSuccess?: string[];  // IDs of steps to execute on success
  onFailure?: string[];  // IDs of steps to execute on failure
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: ToolExecutionResponse;
}

// Step condition for conditional execution
export interface StepCondition {
  type: 'expression' | 'script';
  value: string;  // Expression or script to evaluate
  context?: Record<string, unknown>;  // Additional context for evaluation
}

// Workflow trigger definition
export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'event' | 'manual' | 'api';
  configuration: Record<string, unknown>;
  enabled: boolean;
}

// Workflow schedule definition
export interface WorkflowSchedule {
  type: 'once' | 'recurring' | 'cron';
  startTime?: string;  // ISO date string
  endTime?: string;  // ISO date string
  interval?: number;  // In minutes for recurring
  cronExpression?: string;  // For cron-based scheduling
  timezone?: string;
}

// Workflow configuration
export interface WorkflowConfiguration {
  timeout: number;  // Overall timeout in seconds
  maxConcurrentSteps: number;
  errorHandling: 'continue' | 'stop' | 'retry';
  notifyOnCompletion: boolean;
  notifyOnError: boolean;
  saveResultsAutomatically: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  customParameters: Record<string, unknown>;
}

// Data flow configuration
export interface DataFlowConfiguration {
  mergeResults: boolean;
  transformations: DataTransformation[];
  outputFormat: 'raw' | 'intel_report' | 'summary' | 'custom';
  outputDestination: 'intel_library' | 'marketplace' | 'api' | 'notification';
  shareWorkflowMetadata: boolean;
}

// Data transformation
export interface DataTransformation {
  id: string;
  name: string;
  type: 'filter' | 'map' | 'reduce' | 'enrich';
  configuration: Record<string, unknown>;
  enabled: boolean;
}

// Workflow execution state
export interface WorkflowExecutionState {
  workflowId: string;
  executionId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;  // 0-100 percentage
  currentStepId?: string;
  completedSteps: string[];
  failedSteps: string[];
  results: Record<string, ToolExecutionResponse>;
  errors: WorkflowError[];
  logs: WorkflowLogEntry[];
  botAssignments: Record<string, string>;  // stepId -> botId
}

// Workflow error
export interface WorkflowError {
  stepId?: string;
  message: string;
  timestamp: string;
  severity: 'warning' | 'error' | 'critical';
  details?: unknown;
}

// Workflow log entry
export interface WorkflowLogEntry {
  stepId?: string;
  message: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  data?: unknown;
}

/**
 * Workflow Engine Class
 * 
 * Manages the execution of workflows for bot automation.
 */
export class WorkflowEngine {
  private workflows: Workflow[] = [];
  private executions: WorkflowExecutionState[] = [];
  private bots: OsintBot[] = [];
  private tools: NetRunnerTool[] = [];
  
  constructor(bots: OsintBot[], tools: NetRunnerTool[]) {
    this.bots = bots;
    this.tools = tools;
  }
  
  /**
   * Create a new workflow
   */
  createWorkflow(workflowData: Partial<Workflow>): Workflow {
    const now = new Date().toISOString();
    
    const workflow: Workflow = {
      id: uuidv4(),
      name: workflowData.name || 'New Workflow',
      description: workflowData.description || '',
      steps: workflowData.steps || [],
      parallelExecution: workflowData.parallelExecution || false,
      triggers: workflowData.triggers || [],
      schedule: workflowData.schedule,
      botIds: workflowData.botIds || [],
      created: now,
      updated: now,
      status: 'inactive',
      tags: workflowData.tags || [],
      owner: workflowData.owner || 'system',
      executionCount: 0,
      averageDuration: 0,
      configuration: workflowData.configuration || {
        timeout: 3600,  // 1 hour default timeout
        maxConcurrentSteps: 5,
        errorHandling: 'stop',
        notifyOnCompletion: true,
        notifyOnError: true,
        saveResultsAutomatically: true,
        priority: 'medium',
        customParameters: {}
      },
      dataFlow: workflowData.dataFlow || {
        mergeResults: true,
        transformations: [],
        outputFormat: 'intel_report',
        outputDestination: 'intel_library',
        shareWorkflowMetadata: false
      }
    };
    
    this.workflows.push(workflow);
    return workflow;
  }
  
  /**
   * Get a workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.find(workflow => workflow.id === workflowId);
  }
  
  /**
   * Update a workflow
   */
  updateWorkflow(workflowId: string, updates: Partial<Workflow>): Workflow | null {
    const index = this.workflows.findIndex(workflow => workflow.id === workflowId);
    if (index === -1) return null;
    
    const workflow = this.workflows[index];
    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updated: new Date().toISOString()
    };
    
    this.workflows[index] = updatedWorkflow;
    return updatedWorkflow;
  }
  
  /**
   * Delete a workflow
   */
  deleteWorkflow(workflowId: string): boolean {
    const initialLength = this.workflows.length;
    this.workflows = this.workflows.filter(workflow => workflow.id !== workflowId);
    return this.workflows.length < initialLength;
  }
  
  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string): Promise<WorkflowExecutionState> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }
    
    // Create execution state
    const executionId = uuidv4();
    const executionState: WorkflowExecutionState = {
      workflowId,
      executionId,
      startTime: new Date().toISOString(),
      status: 'running',
      progress: 0,
      completedSteps: [],
      failedSteps: [],
      results: {},
      errors: [],
      logs: [],
      botAssignments: {}
    };
    
    this.executions.push(executionState);
    
    // Log workflow start
    this.logWorkflowEvent(executionState, 'info', `Starting workflow execution: ${workflow.name}`);
    
    try {
      // Assign bots to steps
      this.assignBotsToSteps(workflow, executionState);
      
      // Execute the workflow steps
      if (workflow.parallelExecution) {
        await this.executeParallelSteps(workflow, executionState);
      } else {
        await this.executeSequentialSteps(workflow, executionState);
      }
      
      // Update workflow metadata
      this.updateWorkflowMetadata(workflow, executionState);
      
      return executionState;
    } catch (error) {
      // Handle workflow execution error
      executionState.status = 'failed';
      executionState.endTime = new Date().toISOString();
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logWorkflowError(executionState, 'critical', errorMessage);
      
      return executionState;
    }
  }
  
  /**
   * Assign bots to workflow steps
   */
  private assignBotsToSteps(workflow: Workflow, executionState: WorkflowExecutionState): void {
    // For each step, find a compatible bot
    for (const step of workflow.steps) {
      // If a bot is already assigned to the step, use it
      if (step.botId && workflow.botIds.includes(step.botId)) {
        executionState.botAssignments[step.id] = step.botId;
        continue;
      }
      
      // Find compatible bots based on capabilities and tool compatibility
      const compatibleBots = this.bots.filter(bot => 
        workflow.botIds.includes(bot.id) && 
        step.requiredCapabilities.every(cap => bot.capabilities.includes(cap)) &&
        bot.compatibleTools.includes(step.toolId)
      );
      
      if (compatibleBots.length === 0) {
        this.logWorkflowError(
          executionState, 
          'error', 
          `No compatible bot found for step: ${step.name}`
        );
        continue;
      }
      
      // Assign the bot with the highest success rate
      const assignedBot = compatibleBots.sort(
        (a, b) => b.performance.successRate - a.performance.successRate
      )[0];
      
      executionState.botAssignments[step.id] = assignedBot.id;
      this.logWorkflowEvent(
        executionState, 
        'info', 
        `Assigned bot ${assignedBot.name} to step ${step.name}`
      );
    }
  }
  
  /**
   * Execute workflow steps in sequence
   */
  private async executeSequentialSteps(
    workflow: Workflow, 
    executionState: WorkflowExecutionState
  ): Promise<void> {
    const { steps } = workflow;
    const totalSteps = steps.length;
    
    // Execute steps in sequence
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Check dependencies
      if (!this.areDependenciesMet(step, executionState)) {
        step.status = 'skipped';
        this.logWorkflowEvent(
          executionState, 
          'info', 
          `Skipping step ${step.name} due to unmet dependencies`
        );
        continue;
      }
      
      // Check condition
      if (step.condition && !this.evaluateCondition(step.condition, executionState)) {
        step.status = 'skipped';
        this.logWorkflowEvent(
          executionState, 
          'info', 
          `Skipping step ${step.name} due to condition evaluation`
        );
        continue;
      }
      
      // Execute the step
      try {
        executionState.currentStepId = step.id;
        step.status = 'running';
        this.logWorkflowEvent(executionState, 'info', `Executing step: ${step.name}`);
        
        const result = await this.executeStep(step, executionState);
        
        // Store result
        executionState.results[step.id] = result;
        
        // Update step status
        if (result.status === 'success') {
          step.status = 'completed';
          executionState.completedSteps.push(step.id);
        } else {
          step.status = 'failed';
          executionState.failedSteps.push(step.id);
          
          // Handle error based on workflow configuration
          if (workflow.configuration.errorHandling === 'stop') {
            throw new Error(`Step ${step.name} failed: ${result.error}`);
          }
        }
        
        // Update progress
        executionState.progress = Math.round(
          (executionState.completedSteps.length / totalSteps) * 100
        );
      } catch (error) {
        step.status = 'failed';
        executionState.failedSteps.push(step.id);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logWorkflowError(executionState, 'error', errorMessage, step.id);
        
        // Handle error based on workflow configuration
        if (workflow.configuration.errorHandling === 'stop') {
          throw error;
        }
      }
    }
    
    // Mark workflow as completed
    executionState.status = 'completed';
    executionState.endTime = new Date().toISOString();
    executionState.progress = 100;
    
    this.logWorkflowEvent(
      executionState, 
      'info', 
      `Workflow completed with ${executionState.completedSteps.length} successful steps and ${executionState.failedSteps.length} failed steps`
    );
  }
  
  /**
   * Execute workflow steps in parallel
   */
  private async executeParallelSteps(
    workflow: Workflow, 
    executionState: WorkflowExecutionState
  ): Promise<void> {
    const { steps } = workflow;
    const { maxConcurrentSteps } = workflow.configuration;
    const totalSteps = steps.length;
    
    // Group steps by their dependencies
    const stepsByLevel = this.groupStepsByDependencyLevel(steps);
    
    // Execute steps level by level
    for (const levelSteps of stepsByLevel) {
      // Execute steps in this level concurrently, but limited by maxConcurrentSteps
      const chunks = this.chunkArray(levelSteps, maxConcurrentSteps);
      
      for (const chunk of chunks) {
        // Execute this chunk of steps in parallel
        const stepPromises = chunk.map(step => this.executeStepWithTracking(step, workflow, executionState));
        await Promise.all(stepPromises);
        
        // Update progress
        executionState.progress = Math.round(
          ((executionState.completedSteps.length + executionState.failedSteps.length) / totalSteps) * 100
        );
      }
    }
    
    // Mark workflow as completed
    executionState.status = 'completed';
    executionState.endTime = new Date().toISOString();
    executionState.progress = 100;
    
    this.logWorkflowEvent(
      executionState, 
      'info', 
      `Workflow completed with ${executionState.completedSteps.length} successful steps and ${executionState.failedSteps.length} failed steps`
    );
  }
  
  /**
   * Execute a step with tracking for parallel execution
   */
  private async executeStepWithTracking(
    step: WorkflowStep,
    workflow: Workflow,
    executionState: WorkflowExecutionState
  ): Promise<void> {
    // Check dependencies
    if (!this.areDependenciesMet(step, executionState)) {
      step.status = 'skipped';
      this.logWorkflowEvent(
        executionState, 
        'info', 
        `Skipping step ${step.name} due to unmet dependencies`
      );
      return;
    }
    
    // Check condition
    if (step.condition && !this.evaluateCondition(step.condition, executionState)) {
      step.status = 'skipped';
      this.logWorkflowEvent(
        executionState, 
        'info', 
        `Skipping step ${step.name} due to condition evaluation`
      );
      return;
    }
    
    // Execute the step
    try {
      step.status = 'running';
      this.logWorkflowEvent(executionState, 'info', `Executing step: ${step.name}`);
      
      const result = await this.executeStep(step, executionState);
      
      // Store result
      executionState.results[step.id] = result;
      
      // Update step status
      if (result.status === 'success') {
        step.status = 'completed';
        executionState.completedSteps.push(step.id);
      } else {
        step.status = 'failed';
        executionState.failedSteps.push(step.id);
        
        // Handle error based on workflow configuration
        if (workflow.configuration.errorHandling === 'stop') {
          throw new Error(`Step ${step.name} failed: ${result.error}`);
        }
      }
    } catch (error) {
      step.status = 'failed';
      executionState.failedSteps.push(step.id);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logWorkflowError(executionState, 'error', errorMessage, step.id);
    }
  }
  
  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep, 
    executionState: WorkflowExecutionState
  ): Promise<ToolExecutionResponse> {
    const botId = executionState.botAssignments[step.id];
    if (!botId) {
      throw new Error(`No bot assigned for step: ${step.name}`);
    }
    
    // Get the tool adapter
    const adapter = getAdapter(step.toolId);
    if (!adapter) {
      throw new Error(`No adapter found for tool: ${step.toolId}`);
    }

    // Create execution request
    const request: ToolExecutionRequest = {
      requestId: uuidv4(),
      toolId: step.toolId,
      parameters: step.parameters,
      timestamp: Date.now()
    };
    
    // Execute the tool with retry logic
    let lastError: Error | null = null;
    let attempt = 0;
    
    while (attempt <= step.retryCount) {
      try {
        // Execute the tool
        const response = await adapter.execute(request);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log retry attempt
        this.logWorkflowEvent(
          executionState, 
          'warning', 
          `Step ${step.name} failed on attempt ${attempt + 1}/${step.retryCount + 1}: ${lastError.message}`
        );
        
        // If we've reached max retries, rethrow the error
        if (attempt >= step.retryCount) {
          throw lastError;
        }
        
        // Wait for retry delay
        await new Promise(resolve => setTimeout(resolve, step.retryDelay * 1000));
        attempt++;
      }
    }
    
    // This should never happen, but TypeScript needs a return value
    throw lastError || new Error('Unknown error in step execution');
  }
  
  /**
   * Check if all dependencies for a step are met
   */
  private areDependenciesMet(step: WorkflowStep, executionState: WorkflowExecutionState): boolean {
    // If no dependencies, they're automatically met
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }
    
    // Check if all dependencies are in the completed steps
    return step.dependsOn.every(depId => executionState.completedSteps.includes(depId));
  }
  
  /**
   * Evaluate a step condition safely using sandboxed environment
   */
  /**
   * Safely evaluate a condition expression
   * This is a simple implementation that handles basic expressions securely
   * Note: In production, this should use a proper sandboxed evaluation library
   */
  private safeEvaluate(expression: string, context: Record<string, unknown>): unknown {
    try {
      // For basic safety, only allow simple property access and basic operations
      // This is a placeholder implementation - in production, use a proper expression evaluator
      
      // Simple boolean expressions for testing
      if (expression === 'true') return true;
      if (expression === 'false') return false;
      
      // Simple context property access
      if (expression.startsWith('results.') || expression.startsWith('completedSteps.')) {
        const parts = expression.split('.');
        let result: unknown = context;
        for (const part of parts) {
          if (result && typeof result === 'object' && result !== null && part in result) {
            result = (result as Record<string, unknown>)[part];
          } else {
            return undefined;
          }
        }
        return result;
      }
      
      // For mock testing, return true for most expressions
      return true;
    } catch (error) {
      console.error('Error in safe evaluation:', error);
      return false;
    }
  }

  private evaluateCondition(condition: StepCondition, executionState: WorkflowExecutionState): boolean {
    try {
      // For simple expression evaluation
      if (condition.type === 'expression') {
        // Create a secure context for evaluation
        const context = {
          results: executionState.results,
          completedSteps: executionState.completedSteps,
          failedSteps: executionState.failedSteps,
          ...condition.context
        };
        
        // Use safe evaluation instead of vm2
        const result = this.safeEvaluate(condition.value, context);
        return Boolean(result);
      }
      
      // For script-based conditions
      if (condition.type === 'script') {
        const context = {
          results: executionState.results,
          completedSteps: executionState.completedSteps,
          failedSteps: executionState.failedSteps,
          ...condition.context
        };
        
        // Use safe evaluation instead of vm2
        const result = this.safeEvaluate(condition.value, context);
        return Boolean(result);
      }
      
      return true;
    } catch (error) {
      console.error('Error evaluating condition safely:', error);
      return false;
    }
  }
  
  /**
   * Group steps by their dependency level (for parallel execution)
   */
  private groupStepsByDependencyLevel(steps: WorkflowStep[]): WorkflowStep[][] {
    const levels: WorkflowStep[][] = [];
    const unprocessedSteps = [...steps];
    
    // Steps with no dependencies are at level 0
    let currentLevel = unprocessedSteps.filter(step => !step.dependsOn || step.dependsOn.length === 0);
    
    while (currentLevel.length > 0) {
      // Add current level to levels
      levels.push(currentLevel);
      
      // Remove processed steps
      const processedStepIds = currentLevel.map(step => step.id);
      currentLevel.forEach(step => {
        const index = unprocessedSteps.findIndex(s => s.id === step.id);
        if (index !== -1) {
          unprocessedSteps.splice(index, 1);
        }
      });
      
      // Find steps for next level (those whose dependencies are all satisfied)
      currentLevel = unprocessedSteps.filter(step => 
        step.dependsOn.every(depId => 
          processedStepIds.includes(depId) || 
          levels.flat().map(s => s.id).includes(depId)
        )
      );
    }
    
    // If there are still unprocessed steps, they have circular dependencies
    if (unprocessedSteps.length > 0) {
      console.warn('Circular dependencies detected in workflow steps', unprocessedSteps);
      // Add them to the last level as a fallback
      levels.push(unprocessedSteps);
    }
    
    return levels;
  }
  
  /**
   * Update workflow metadata after execution
   */
  private updateWorkflowMetadata(workflow: Workflow, executionState: WorkflowExecutionState): void {
    // Calculate execution duration
    const startTime = new Date(executionState.startTime).getTime();
    const endTime = new Date(executionState.endTime || new Date().toISOString()).getTime();
    const duration = (endTime - startTime) / 1000;  // Duration in seconds
    
    // Update workflow
    workflow.executionCount += 1;
    workflow.lastRun = executionState.startTime;
    
    // Update average duration
    workflow.averageDuration = 
      (workflow.averageDuration * (workflow.executionCount - 1) + duration) / 
      workflow.executionCount;
    
    // Update next run time if scheduled
    if (workflow.schedule) {
      workflow.nextRun = this.calculateNextRunTime(workflow.schedule);
    }
    
    // Update workflow in the workflows array
    const index = this.workflows.findIndex(w => w.id === workflow.id);
    if (index !== -1) {
      this.workflows[index] = workflow;
    }
  }
  
  /**
   * Calculate the next run time based on schedule
   */
  private calculateNextRunTime(schedule: WorkflowSchedule): string {
    const now = new Date();
    
    switch (schedule.type) {
      case 'once':
        return schedule.startTime || now.toISOString();
        
      case 'recurring': {
        if (!schedule.interval) return now.toISOString();
        
        // Calculate next run based on interval
        const nextRun = new Date(now.getTime() + schedule.interval * 60 * 1000);
        
        // Check if we're past the end time
        if (schedule.endTime && nextRun > new Date(schedule.endTime)) {
          return schedule.endTime;
        }
        
        return nextRun.toISOString();
      }
        
      case 'cron':
        // Cron calculation would go here
        // For now, just return a time 24 hours in the future
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        
      default:
        return now.toISOString();
    }
  }
  
  /**
   * Log a workflow event
   */
  private logWorkflowEvent(
    executionState: WorkflowExecutionState,
    level: 'info' | 'warning' | 'error' | 'debug',
    message: string,
    stepId?: string,
    data?: unknown
  ): void {
    executionState.logs.push({
      stepId,
      message,
      timestamp: new Date().toISOString(),
      level,
      data
    });
  }
  
  /**
   * Log a workflow error
   */
  private logWorkflowError(
    executionState: WorkflowExecutionState,
    severity: 'warning' | 'error' | 'critical',
    message: string,
    stepId?: string,
    details?: unknown
  ): void {
    // Add to logs
    this.logWorkflowEvent(executionState, 'error', message, stepId, details);
    
    // Add to errors
    executionState.errors.push({
      stepId,
      message,
      timestamp: new Date().toISOString(),
      severity,
      details
    });
  }
  
  /**
   * Utility to chunk an array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Get all workflows
   */
  getWorkflows(): Workflow[] {
    return [...this.workflows];
  }
  
  /**
   * Get active workflows
   */
  getActiveWorkflows(): Workflow[] {
    return this.workflows.filter(workflow => workflow.status === 'active');
  }
  
  /**
   * Get workflow execution by ID
   */
  getExecution(executionId: string): WorkflowExecutionState | undefined {
    return this.executions.find(execution => execution.executionId === executionId);
  }
  
  /**
   * Get executions for a workflow
   */
  getWorkflowExecutions(workflowId: string): WorkflowExecutionState[] {
    return this.executions.filter(execution => execution.workflowId === workflowId);
  }
  
  /**
   * Cancel a running workflow execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.find(exec => exec.executionId === executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }
    
    execution.status = 'cancelled';
    execution.endTime = new Date().toISOString();
    
    this.logWorkflowEvent(execution, 'warning', 'Workflow execution cancelled by user');
    
    return true;
  }
}

// Sample workflows for testing
export const sampleWorkflows: Partial<Workflow>[] = [
  {
    name: 'Basic Reconnaissance',
    description: 'Gather basic information about a target domain or company',
    parallelExecution: false,
    botIds: [], // Will be filled with actual bot IDs
    steps: [
      {
        id: uuidv4(),
        name: 'Domain Reconnaissance',
        description: 'Gather information about the target domain',
        toolId: '', // Will be filled with actual tool ID (e.g., Shodan)
        requiredCapabilities: ['collection'],
        parameters: {
          target: '{input.target}'
        },
        dependsOn: [],
        timeout: 300,
        retryCount: 2,
        retryDelay: 30
      },
      {
        id: uuidv4(),
        name: 'Email Harvesting',
        description: 'Find email addresses associated with the domain',
        toolId: '', // Will be filled with actual tool ID (e.g., theHarvester)
        requiredCapabilities: ['collection'],
        parameters: {
          domain: '{input.target}',
          includeSubdomains: true
        },
        dependsOn: [], // Will be set to the ID of the Domain Reconnaissance step
        timeout: 300,
        retryCount: 2,
        retryDelay: 30
      },
      {
        id: uuidv4(),
        name: 'Intelligence Analysis',
        description: 'Analyze collected data to extract intelligence',
        toolId: '', // Will be filled with actual tool ID (IntelAnalyzer)
        requiredCapabilities: ['analysis'],
        parameters: {
          data: '{results.step1.data}',
          packageType: 'entity_extraction',
          analysisDepth: 'standard'
        },
        dependsOn: [], // Will be set to the IDs of previous steps
        timeout: 300,
        retryCount: 1,
        retryDelay: 30
      }
    ],
    triggers: [
      {
        id: uuidv4(),
        type: 'manual',
        configuration: {},
        enabled: true
      }
    ],
    tags: ['reconnaissance', 'basic', 'domain'],
    configuration: {
      timeout: 1800, // 30 minutes
      maxConcurrentSteps: 2,
      errorHandling: 'continue',
      notifyOnCompletion: true,
      notifyOnError: true,
      saveResultsAutomatically: true,
      priority: 'medium',
      customParameters: {
        requireUserReview: true
      }
    },
    dataFlow: {
      mergeResults: true,
      transformations: [],
      outputFormat: 'intel_report',
      outputDestination: 'intel_library',
      shareWorkflowMetadata: false
    }
  },
  {
    name: 'Threat Monitoring',
    description: 'Continuously monitor for potential threats related to a target',
    parallelExecution: true,
    botIds: [], // Will be filled with actual bot IDs
    steps: [
      {
        id: uuidv4(),
        name: 'Vulnerability Scanning',
        description: 'Scan for vulnerabilities in target infrastructure',
        toolId: '', // Will be filled with actual tool ID
        requiredCapabilities: ['collection', 'monitoring'],
        parameters: {
          target: '{input.target}',
          scanType: 'basic'
        },
        dependsOn: [],
        timeout: 600,
        retryCount: 2,
        retryDelay: 60
      },
      {
        id: uuidv4(),
        name: 'Dark Web Monitoring',
        description: 'Monitor dark web for mentions of target',
        toolId: '', // Will be filled with actual tool ID
        requiredCapabilities: ['monitoring', 'alerting'],
        parameters: {
          keywords: ['{input.target}', '{input.alternativeNames}'],
          depth: 'standard'
        },
        dependsOn: [],
        timeout: 900,
        retryCount: 1,
        retryDelay: 120
      },
      {
        id: uuidv4(),
        name: 'Threat Intelligence Analysis',
        description: 'Analyze collected threat data',
        toolId: '', // Will be filled with actual tool ID (IntelAnalyzer)
        requiredCapabilities: ['analysis'],
        parameters: {
          data: {
            vulnerabilityData: '{results.step1.data}',
            darkWebData: '{results.step2.data}'
          },
          packageType: 'threat_assessment',
          analysisDepth: 'deep'
        },
        dependsOn: [], // Will be set to the IDs of previous steps
        timeout: 600,
        retryCount: 1,
        retryDelay: 60
      }
    ],
    schedule: {
      type: 'recurring',
      interval: 1440 // Daily
    },
    triggers: [
      {
        id: uuidv4(),
        type: 'schedule',
        configuration: {},
        enabled: true
      },
      {
        id: uuidv4(),
        type: 'event',
        configuration: {
          eventType: 'security_alert'
        },
        enabled: true
      }
    ],
    tags: ['monitoring', 'threat', 'continuous'],
    configuration: {
      timeout: 3600, // 1 hour
      maxConcurrentSteps: 3,
      errorHandling: 'continue',
      notifyOnCompletion: true,
      notifyOnError: true,
      saveResultsAutomatically: true,
      priority: 'high',
      customParameters: {
        alertThreshold: 'medium'
      }
    },
    dataFlow: {
      mergeResults: true,
      transformations: [
        {
          id: uuidv4(),
          name: 'Filter Low Severity',
          type: 'filter',
          configuration: {
            condition: 'item.severity >= 0.6'
          },
          enabled: true
        }
      ],
      outputFormat: 'intel_report',
      outputDestination: 'notification',
      shareWorkflowMetadata: true
    }
  }
];
