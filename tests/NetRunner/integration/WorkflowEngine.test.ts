import { describe, test, expect, vi, beforeEach } from 'vitest';
import { 
  WorkflowEngine,
  Workflow,
  WorkflowStep,
  WorkflowStepResult,
  WorkflowTrigger,
  WorkflowSchedule,
  WorkflowConfiguration,
  DataFlowConfiguration,
  StepCondition
} from '../../../../src/pages/NetRunner/integration/WorkflowEngine';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

vi.mock('../../../../src/pages/NetRunner/tools/adapters/AdapterRegistry', () => ({
  getAdapter: vi.fn(() => ({
    execute: vi.fn(() => Promise.resolve({ success: true, result: 'Test result' }))
  }))
}));

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine;
  
  beforeEach(() => {
    workflowEngine = new WorkflowEngine();
  });
  
  test('should create a new workflow', () => {
    const workflowData = {
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [
        {
          id: 'step-1',
          name: 'Test Step',
          description: 'A test step',
          toolId: 'test-tool',
          parameters: { test: true },
          requiredCapabilities: ['collection'],
          dependsOn: [],
          timeout: 60,
          retryCount: 3,
          retryDelay: 5
        }
      ],
      parallelExecution: false,
      triggers: [
        {
          id: 'trigger-1',
          type: 'manual',
          name: 'Manual Trigger',
          description: 'Manual execution trigger',
          condition: { type: 'always' }
        }
      ],
      botIds: ['bot-1'],
      tags: ['test'],
      owner: 'test-user',
      configuration: {
        notifyOnCompletion: true,
        allowPartialSuccess: true,
        maxTotalDuration: 300,
        priority: 'normal'
      },
      dataFlow: {
        outputDestination: 'default',
        saveIntermediateResults: true,
        resultHandling: {
          success: 'save',
          failure: 'retry'
        }
      }
    };
    
    const workflow = workflowEngine.createWorkflow(workflowData);
    
    expect(workflow).toBeDefined();
    expect(workflow.id).toBeDefined();
    expect(workflow.name).toBe('Test Workflow');
    expect(workflow.description).toBe('A test workflow');
    expect(workflow.steps).toHaveLength(1);
    expect(workflow.steps[0].id).toBe('step-1');
    expect(workflow.created).toBeDefined();
    expect(workflow.updated).toBeDefined();
    expect(workflow.status).toBe('active');
    expect(workflow.executionCount).toBe(0);
  });
  
  test('should retrieve a workflow by ID', () => {
    // Create a workflow first
    const workflowData = {
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [],
      parallelExecution: false,
      triggers: [],
      botIds: [],
      tags: [],
      owner: 'test-user',
      configuration: {
        notifyOnCompletion: true,
        allowPartialSuccess: true,
        maxTotalDuration: 300,
        priority: 'normal'
      },
      dataFlow: {
        outputDestination: 'default',
        saveIntermediateResults: true,
        resultHandling: {
          success: 'save',
          failure: 'retry'
        }
      }
    };
    
    const workflow = workflowEngine.createWorkflow(workflowData);
    const retrievedWorkflow = workflowEngine.getWorkflow(workflow.id);
    
    expect(retrievedWorkflow).toBeDefined();
    expect(retrievedWorkflow?.id).toBe(workflow.id);
    expect(retrievedWorkflow?.name).toBe(workflow.name);
  });
  
  test('should update a workflow', () => {
    // Create a workflow first
    const workflowData = {
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [],
      parallelExecution: false,
      triggers: [],
      botIds: [],
      tags: [],
      owner: 'test-user',
      configuration: {
        notifyOnCompletion: true,
        allowPartialSuccess: true,
        maxTotalDuration: 300,
        priority: 'normal'
      },
      dataFlow: {
        outputDestination: 'default',
        saveIntermediateResults: true,
        resultHandling: {
          success: 'save',
          failure: 'retry'
        }
      }
    };
    
    const workflow = workflowEngine.createWorkflow(workflowData);
    
    // Update the workflow
    const updatedWorkflow = workflowEngine.updateWorkflow(workflow.id, {
      name: 'Updated Workflow',
      description: 'Updated description'
    });
    
    expect(updatedWorkflow).toBeDefined();
    expect(updatedWorkflow?.id).toBe(workflow.id);
    expect(updatedWorkflow?.name).toBe('Updated Workflow');
    expect(updatedWorkflow?.description).toBe('Updated description');
    
    // Verify the update was persisted
    const retrievedWorkflow = workflowEngine.getWorkflow(workflow.id);
    expect(retrievedWorkflow?.name).toBe('Updated Workflow');
  });
  
  test('should execute a workflow and return results', async () => {
    // Create a workflow with steps
    const workflowData = {
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [
        {
          id: 'step-1',
          name: 'Test Step 1',
          description: 'A test step',
          toolId: 'test-tool-1',
          parameters: { test: true },
          requiredCapabilities: ['collection'],
          dependsOn: [],
          timeout: 60,
          retryCount: 3,
          retryDelay: 5
        },
        {
          id: 'step-2',
          name: 'Test Step 2',
          description: 'Another test step',
          toolId: 'test-tool-2',
          parameters: { test: true },
          requiredCapabilities: ['analysis'],
          dependsOn: ['step-1'],  // Depends on step 1
          timeout: 60,
          retryCount: 3,
          retryDelay: 5
        }
      ],
      parallelExecution: false,
      triggers: [],
      botIds: ['bot-1'],
      tags: [],
      owner: 'test-user',
      configuration: {
        notifyOnCompletion: true,
        allowPartialSuccess: true,
        maxTotalDuration: 300,
        priority: 'normal'
      },
      dataFlow: {
        outputDestination: 'default',
        saveIntermediateResults: true,
        resultHandling: {
          success: 'save',
          failure: 'retry'
        }
      }
    };
    
    const workflow = workflowEngine.createWorkflow(workflowData);
    
    // Execute the workflow
    const executionResult = await workflowEngine.executeWorkflow(workflow.id);
    
    expect(executionResult).toBeDefined();
    expect(executionResult.success).toBe(true);
    expect(executionResult.workflowId).toBe(workflow.id);
    expect(executionResult.stepResults).toBeDefined();
    expect(Object.keys(executionResult.stepResults)).toHaveLength(2);
    
    // Verify the workflow execution count was incremented
    const updatedWorkflow = workflowEngine.getWorkflow(workflow.id);
    expect(updatedWorkflow?.executionCount).toBe(1);
    expect(updatedWorkflow?.lastRun).toBeDefined();
  });
});
