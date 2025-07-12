/**
 * Workflow Services Index
 * 
 * Exports all workflow-related services and utilities for NetRunner.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

export {
  WorkflowEngine,
  type WorkflowDefinition,
  type WorkflowTask,
  type WorkflowExecution,
  type WorkflowStatus,
  type TaskStatus,
  type TriggerType,
  type WorkflowTemplate,
  type WorkflowSchedule,
  type TaskExecution,
  type ExecutionMetrics,
  type ResourceUsage,
  type WorkflowInput,
  type WorkflowOutput,
  type ValidationRule,
  type RetryPolicy,
  type TaskCondition
} from './WorkflowEngine';

export {
  WORKFLOW_TEMPLATES,
  DOMAIN_INTELLIGENCE_TEMPLATE,
  IP_INVESTIGATION_TEMPLATE,
  EMAIL_INVESTIGATION_TEMPLATE,
  getAllWorkflowTemplates,
  getWorkflowTemplate,
  getWorkflowTemplatesByCategory,
  getWorkflowTemplatesByDifficulty,
  searchWorkflowTemplates
} from './WorkflowTemplates';

// Create singleton workflow engine instance
import { WorkflowEngine } from './WorkflowEngine';
export const workflowEngine = new WorkflowEngine();
