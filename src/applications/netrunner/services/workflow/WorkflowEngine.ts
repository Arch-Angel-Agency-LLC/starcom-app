/**
 * WorkflowEngine.ts
 * 
 * Automated workflow execution engine for NetRunner OSINT operations.
 * Provides scheduling, dependency management, and persistent execution.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { LoggerFactory, OperationLogger } from '../logging';
import { OSINTResult } from '../../models/OSINTDataModels';

const logger = LoggerFactory.getLogger('NetRunner:WorkflowEngine');

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type TriggerType = 'manual' | 'scheduled' | 'conditional' | 'webhook';

export interface WorkflowTask {
  id: string;
  name: string;
  description?: string;
  toolId: string;
  parameters: Record<string, unknown>;
  dependencies: string[]; // Task IDs this task depends on
  retryPolicy?: RetryPolicy;
  timeout?: number; // milliseconds
  condition?: TaskCondition;
  status: TaskStatus;
  startTime?: Date;
  endTime?: Date;
  result?: OSINTResult;
  error?: string;
  retryCount: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  tags: string[];
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  tasks: WorkflowTask[];
  maxExecutionTime?: number; // milliseconds
  retryPolicy?: RetryPolicy;
  metadata?: Record<string, unknown>;
}

export interface WorkflowInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  default?: unknown;
  validation?: ValidationRule[];
}

export interface WorkflowOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  source: string; // Task ID or expression
}

export interface ValidationRule {
  type: 'regex' | 'range' | 'enum' | 'custom';
  value: unknown;
  message?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number; // milliseconds
  maxDelay?: number; // milliseconds
  multiplier?: number;
}

export interface TaskCondition {
  type: 'success' | 'failure' | 'always' | 'expression';
  expression?: string; // For complex conditions
  dependsOn?: string[]; // Task IDs
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  triggeredBy: string;
  startTime: Date;
  endTime?: Date;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  taskExecutions: Map<string, TaskExecution>;
  error?: string;
  metrics: ExecutionMetrics;
}

export interface TaskExecution {
  taskId: string;
  status: TaskStatus;
  startTime?: Date;
  endTime?: Date;
  result?: OSINTResult;
  error?: string;
  retryCount: number;
  logs: string[];
}

export interface ExecutionMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  skippedTasks: number;
  averageTaskDuration: number;
  totalDataProcessed: number;
  resourcesConsumed: ResourceUsage;
}

export interface ResourceUsage {
  cpuTime: number; // milliseconds
  memoryPeak: number; // bytes
  networkRequests: number;
  apiCalls: number;
  storageUsed: number; // bytes
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  name: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  inputs: Record<string, unknown>;
  nextRun?: Date;
  lastRun?: Date;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  requiredTools: string[];
  definition: WorkflowDefinition;
  exampleInputs: Record<string, unknown>;
  documentation: string;
}

export class WorkflowEngine {
  private executions = new Map<string, WorkflowExecution>();
  private workflows = new Map<string, WorkflowDefinition>();
  private schedules = new Map<string, WorkflowSchedule>();
  private templates = new Map<string, WorkflowTemplate>();
  private isRunning = false;
  private executionQueue: string[] = [];
  private maxConcurrentExecutions = 5;
  private currentExecutions = 0;

  constructor() {
    logger.info('WorkflowEngine initialized');
  }

  /**
   * Start the workflow engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Workflow engine is already running');
      return;
    }

    logger.info('Starting workflow engine');
    this.isRunning = true;
    
    // Start the execution loop
    this.processExecutionQueue();
    
    // Start the scheduler
    this.startScheduler();
  }

  /**
   * Stop the workflow engine
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Workflow engine is not running');
      return;
    }

    logger.info('Stopping workflow engine');
    this.isRunning = false;
    
    // Cancel all running executions
    for (const execution of this.executions.values()) {
      if (execution.status === 'running') {
        await this.cancelExecution(execution.id);
      }
    }
  }

  /**
   * Register a workflow definition
   */
  async registerWorkflow(workflow: WorkflowDefinition): Promise<void> {
    const opLogger = new OperationLogger(logger, 'registerWorkflow', { workflowId: workflow.id, name: workflow.name });
    
    try {
      opLogger.start();
      
      // Validate workflow definition
      this.validateWorkflow(workflow);
      
      this.workflows.set(workflow.id, workflow);
      
      opLogger.success('Workflow registered successfully', {
        tasksCount: workflow.tasks.length
      });
      
    } catch (error) {
      opLogger.failure(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to register workflow'
      );
      throw new Error(`Failed to register workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, unknown>,
    triggerType: TriggerType = 'manual',
    triggeredBy: string = 'system'
  ): Promise<string> {
    const opLogger = new OperationLogger(logger, 'executeWorkflow', { workflowId, triggerType, triggeredBy });
    
    try {
      opLogger.start();
      
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Create execution instance
      const executionId = this.generateExecutionId();
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: 'pending',
        triggerType,
        triggeredBy,
        startTime: new Date(),
        inputs,
        taskExecutions: new Map(),
        metrics: {
          totalTasks: workflow.tasks.length,
          completedTasks: 0,
          failedTasks: 0,
          skippedTasks: 0,
          averageTaskDuration: 0,
          totalDataProcessed: 0,
          resourcesConsumed: {
            cpuTime: 0,
            memoryPeak: 0,
            networkRequests: 0,
            apiCalls: 0,
            storageUsed: 0
          }
        }
      };

      this.executions.set(executionId, execution);
      
      // Add to execution queue
      this.executionQueue.push(executionId);
      
      opLogger.success('Workflow execution queued', {
        executionId
      });
      
      return executionId;
      
    } catch (error) {
      opLogger.failure(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to execute workflow'
      );
      throw new Error(`Failed to execute workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel a workflow execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
    
    logger.info('Workflow execution cancelled', { executionId });
  }

  /**
   * Process the execution queue
   */
  private async processExecutionQueue(): Promise<void> {
    while (this.isRunning) {
      if (this.currentExecutions < this.maxConcurrentExecutions && this.executionQueue.length > 0) {
        const executionId = this.executionQueue.shift()!;
        this.currentExecutions++;
        
        // Execute workflow asynchronously
        this.executeWorkflowInternal(executionId)
          .finally(() => {
            this.currentExecutions--;
          });
      }
      
      // Wait before checking queue again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Internal workflow execution
   */
  private async executeWorkflowInternal(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return;

    const opLogger = new OperationLogger(logger, 'executeWorkflowInternal', { executionId, workflowId: execution.workflowId });
    
    try {
      opLogger.start();
      
      execution.status = 'running';
      
      // Execute tasks in dependency order
      const executionOrder = this.calculateExecutionOrder(workflow.tasks);
      
      for (const taskId of executionOrder) {
        // Guard: if execution was cancelled, stop processing further tasks
        if (this.isCancelled(execution.status)) break;
        
        const task = workflow.tasks.find(t => t.id === taskId);
        if (!task) continue;
        
        // Check if dependencies are satisfied
        if (!this.areDependenciesSatisfied(task, execution)) {
          // Skip task if dependencies failed
          const taskExecution: TaskExecution = {
            taskId: task.id,
            status: 'skipped',
            retryCount: 0,
            logs: ['Skipped due to failed dependencies']
          };
          execution.taskExecutions.set(taskId, taskExecution);
          execution.metrics.skippedTasks++;
          continue;
        }
        
        // Execute task
        await this.executeTask(task, execution, workflow);
      }
      
  // Determine final status
  if (!this.isCancelled(execution.status)) {
        const hasFailures = Array.from(execution.taskExecutions.values())
          .some(te => te.status === 'failed');
        execution.status = hasFailures ? 'failed' : 'completed';
      }
      
      execution.endTime = new Date();
      
      opLogger.success('Workflow execution completed', {
        status: execution.status,
        duration: execution.endTime.getTime() - execution.startTime.getTime()
      });
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      
      opLogger.failure(
        error instanceof Error ? error : new Error(String(error)),
        'Workflow execution failed'
      );
    }
  }

  /**
   * Type-safe cancellation status check to avoid literal narrowing issues
   */
  private isCancelled(status: WorkflowStatus): boolean {
    return status === 'cancelled';
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: WorkflowTask,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<void> {
    const taskExecution: TaskExecution = {
      taskId: task.id,
      status: 'running',
      startTime: new Date(),
      retryCount: 0,
      logs: []
    };
    
    execution.taskExecutions.set(task.id, taskExecution);
    
    const retryPolicy = task.retryPolicy || workflow.retryPolicy || {
      maxAttempts: 1,
      backoffStrategy: 'fixed',
      initialDelay: 1000
    };
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < retryPolicy.maxAttempts; attempt++) {
      try {
        taskExecution.retryCount = attempt;
        
        // TODO: Execute actual tool via adapter registry
        // For now, simulate task execution
        await this.simulateTaskExecution(task);
        
        taskExecution.status = 'completed';
        taskExecution.endTime = new Date();
        execution.metrics.completedTasks++;
        
        logger.debug('Task completed successfully', {
          taskId: task.id,
          attempt: attempt + 1
        });
        
        return;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        taskExecution.logs.push(`Attempt ${attempt + 1} failed: ${lastError.message}`);
        
        if (attempt < retryPolicy.maxAttempts - 1) {
          // Calculate backoff delay
          const delay = this.calculateBackoffDelay(retryPolicy, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    taskExecution.status = 'failed';
    taskExecution.error = lastError?.message || 'Unknown error';
    taskExecution.endTime = new Date();
    execution.metrics.failedTasks++;
    
    logger.error('Task failed after all retries', undefined, {
      attempts: retryPolicy.maxAttempts,
      error: lastError?.message,
      taskId: task.id
    });
  }

  /**
   * Simulate task execution (placeholder for real implementation)
   */
  private async simulateTaskExecution(
    task: WorkflowTask
  ): Promise<void> {
    // Simulate processing time
    const processingTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate potential failure (5% chance)
    if (Math.random() < 0.05) {
      throw new Error(`Simulated failure for task ${task.name}`);
    }
    
    logger.debug('Simulated task execution', {
      taskId: task.id,
      processingTime
    });
  }

  /**
   * Calculate task execution order based on dependencies
   */
  private calculateExecutionOrder(tasks: WorkflowTask[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (taskId: string) => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task: ${taskId}`);
      }
      
      if (visited.has(taskId)) {
        return;
      }
      
      visiting.add(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        // Visit all dependencies first
        for (const depId of task.dependencies) {
          visit(depId);
        }
      }
      
      visiting.delete(taskId);
      visited.add(taskId);
      order.push(taskId);
    };
    
    // Visit all tasks
    for (const task of tasks) {
      visit(task.id);
    }
    
    return order;
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesSatisfied(task: WorkflowTask, execution: WorkflowExecution): boolean {
    for (const depId of task.dependencies) {
      const depExecution = execution.taskExecutions.get(depId);
      if (!depExecution || depExecution.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate backoff delay for retries
   */
  private calculateBackoffDelay(retryPolicy: RetryPolicy, attempt: number): number {
    let delay = retryPolicy.initialDelay;
    
    switch (retryPolicy.backoffStrategy) {
      case 'linear':
        delay = retryPolicy.initialDelay + (attempt * (retryPolicy.multiplier || 1000));
        break;
      case 'exponential':
        delay = retryPolicy.initialDelay * Math.pow(retryPolicy.multiplier || 2, attempt);
        break;
      case 'fixed':
      default:
        delay = retryPolicy.initialDelay;
        break;
    }
    
    if (retryPolicy.maxDelay) {
      delay = Math.min(delay, retryPolicy.maxDelay);
    }
    
    return delay;
  }

  /**
   * Validate workflow definition
   */
  private validateWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.id || !workflow.name || !workflow.tasks || workflow.tasks.length === 0) {
      throw new Error('Invalid workflow definition: missing required fields');
    }
    
    // Validate task dependencies
    const taskIds = new Set(workflow.tasks.map(t => t.id));
    for (const task of workflow.tasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          throw new Error(`Invalid dependency: task ${task.id} depends on non-existent task ${depId}`);
        }
      }
    }
    
    // Check for circular dependencies
    try {
      this.calculateExecutionOrder(workflow.tasks);
    } catch (error) {
      throw new Error(`Workflow validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Start the scheduler for automated workflows
   */
  private startScheduler(): void {
    // TODO: Implement cron-based scheduling
    logger.info('Workflow scheduler started');
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
