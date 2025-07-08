import { describe, test, expect, vi, beforeEach } from 'vitest';
import { 
  WorkflowEngine,
  Workflow,
  WorkflowStep,
  WorkflowTrigger,
  WorkflowSchedule,
  WorkflowConfiguration,
  DataFlowConfiguration,
  StepCondition,
  WorkflowExecutionState
} from '../WorkflowEngine';
import { OsintBot, BotCapability } from '../BotRosterIntegration';
import { NetRunnerTool } from '../../tools/NetRunnerPowerTools';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

vi.mock('../../tools/adapters/AdapterRegistry', () => ({
  getAdapter: vi.fn(() => ({
    execute: vi.fn(() => Promise.resolve({ 
      status: 'success',
      data: { result: 'Test result' },
      metadata: { timestamp: Date.now() }
    }))
  }))
}));

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine;
  let mockBots: OsintBot[];
  let mockTools: NetRunnerTool[];
  
  beforeEach(() => {
    // Create mock bots with required capabilities
    mockBots = [
      {
        id: 'bot-1',
        name: 'Test Bot 1',
        description: 'A test bot',
        avatar: 'bot-avatar.png',
        capabilities: ['collection', 'analysis'] as BotCapability[],
        compatibleTools: ['test-tool'],
        specializations: ['network', 'identity'],
        autonomyLevel: 'supervised' as const,
        scope: 'general' as const,
        author: 'test-user',
        version: '1.0.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        performance: {
          accuracy: 0.9,
          speed: 5,
          successRate: 0.95,
          intelQualityScore: 0.85,
          totalOperations: 105,
          totalIntelGenerated: 95,
          lastEvaluation: new Date().toISOString()
        },
        status: 'active' as const,
        configuration: {
          maxConcurrentOperations: 3,
          maxDailyOperations: 100,
          rateLimiting: true,
          proxyRotation: true,
          obfuscation: false,
          loggingLevel: 'standard' as const,
          notifyOnCompletion: true,
          saveResultsAutomatically: true,
          customParameters: {}
        }
      }
    ];
    
    // Create mock tools
    mockTools = [
      {
        id: 'test-tool',
        name: 'Test Tool',
        description: 'A test tool',
        category: 'analysis' as const,
        capabilities: ['Test capability'],
        premium: false,
        automationCompatible: true,
        source: 'Test',
        license: 'MIT',
        intelTypes: ['network', 'identity']
      }
    ];
    
    workflowEngine = new WorkflowEngine(mockBots, mockTools);
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
          requiredCapabilities: ['collection'] as BotCapability[],
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
          type: 'manual' as const,
          configuration: { enabled: true },
          enabled: true
        }
      ],
      botIds: ['bot-1'],
      tags: ['test'],
      owner: 'test-user',
      configuration: {
        timeout: 300,
        maxConcurrentSteps: 5,
        errorHandling: 'stop' as const,
        notifyOnCompletion: true,
        notifyOnError: true,
        saveResultsAutomatically: true,
        priority: 'medium' as const,
        customParameters: {}
      },
      dataFlow: {
        mergeResults: true,
        transformations: [],
        outputFormat: 'intel_report' as const,
        outputDestination: 'intel_library' as const,
        shareWorkflowMetadata: false
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
    expect(workflow.status).toBe('inactive'); // Default status is inactive
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
      tags: []
    };
    
    const workflow = workflowEngine.createWorkflow(workflowData);
    const retrievedWorkflow = workflowEngine.getWorkflow(workflow.id);
    
    expect(retrievedWorkflow).toBeDefined();
    expect(retrievedWorkflow?.id).toBe(workflow.id);
    expect(retrievedWorkflow?.name).toBe(workflow.name);
  });
  
  test('should update a workflow', async () => {
    // Create a workflow first
    const workflowData = {
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [],
      parallelExecution: false,
      triggers: [],
      botIds: [],
      tags: []
    };
    
    const workflow = workflowEngine.createWorkflow(workflowData);
    
    // Add a small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updatedData = {
      name: 'Updated Workflow',
      description: 'An updated workflow',
      parallelExecution: true
    };
    
    const updatedWorkflow = workflowEngine.updateWorkflow(workflow.id, updatedData);
    
    expect(updatedWorkflow).toBeDefined();
    expect(updatedWorkflow?.id).toBe(workflow.id);
    expect(updatedWorkflow?.name).toBe('Updated Workflow');
    expect(updatedWorkflow?.description).toBe('An updated workflow');
    expect(updatedWorkflow?.parallelExecution).toBe(true);
    expect(updatedWorkflow?.updated).not.toBe(workflow.updated);
    expect(new Date(updatedWorkflow!.updated).getTime()).toBeGreaterThan(new Date(workflow.updated).getTime());
  });
  
  test('should delete a workflow', () => {
    // Create a workflow first
    const workflowData = {
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [],
      parallelExecution: false,
      triggers: [],
      botIds: [],
      tags: []
    };
    
    const workflow = workflowEngine.createWorkflow(workflowData);
    
    const success = workflowEngine.deleteWorkflow(workflow.id);
    expect(success).toBe(true);
    
    const retrievedWorkflow = workflowEngine.getWorkflow(workflow.id);
    expect(retrievedWorkflow).toBeUndefined();
  });
  
  test('should execute a workflow', async () => {
    // Create a workflow first
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
          requiredCapabilities: ['collection'] as BotCapability[],
          dependsOn: [],
          timeout: 60,
          retryCount: 3,
          retryDelay: 5
        }
      ],
      parallelExecution: false,
      triggers: [],
      botIds: ['bot-1'],
      tags: []
    };
    
    const workflow = workflowEngine.createWorkflow(workflowData);
    
    const execution = await workflowEngine.executeWorkflow(workflow.id);
    
    expect(execution).toBeDefined();
    expect(execution.executionId).toBeDefined();
    expect(execution.workflowId).toBe(workflow.id);
    expect(execution.status).toBe('completed');
    expect(execution.startTime).toBeDefined();
    expect(execution.endTime).toBeDefined();
    expect(execution.results).toBeDefined();
    expect(Object.keys(execution.results)).toContain('step-1');
    expect(execution.completedSteps).toContain('step-1');
  });
});
