/**
 * NetRunner Error Handling Test Suite
 * 
 * Comprehensive tests for the NetRunner error handling framework including
 * error classes, factory methods, and error handler service.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  NetRunnerError,
  ToolExecutionError,
  AdapterError,
  SearchError,
  WorkflowError,
  BotError,
  AnalyzerError,
  IntegrationError,
  NetRunnerErrorCategory,
  NETRUNNER_ERROR_CODES
} from '../NetRunnerError';
import { ErrorFactory } from '../ErrorFactory';
import { NetRunnerErrorHandler } from '../ErrorHandler';

describe('NetRunnerError', () => {
  it('should create base NetRunner error with all properties', () => {
    const error = new NetRunnerError('Test error message', {
      type: 'TOOL_EXECUTION_ERROR',
      code: NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED,
      category: NetRunnerErrorCategory.TOOL,
      component: 'TestComponent',
      severity: 'high',
      details: { toolId: 'shodan' },
      userMessage: 'Tool execution failed',
      recoverable: true
    });

    expect(error.message).toBe('Test error message');
    expect(error.type).toBe('TOOL_EXECUTION_ERROR');
    expect(error.code).toBe('NET-TOOL-001');
    expect(error.category).toBe(NetRunnerErrorCategory.TOOL);
    expect(error.component).toBe('TestComponent');
    expect(error.severity).toBe('high');
    expect(error.details).toEqual({ toolId: 'shodan' });
    expect(error.userMessage).toBe('Tool execution failed');
    expect(error.recoverable).toBe(true);
    expect(error.timestamp).toBeDefined();
  });

  it('should inherit from Error class', () => {
    const error = new NetRunnerError('Test error', {
      type: 'TOOL_EXECUTION_ERROR',
      code: NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED,
      category: NetRunnerErrorCategory.TOOL,
      component: 'TestComponent',
      severity: 'medium'
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(NetRunnerError);
  });

  it('should generate standardized error object for API responses', () => {
    const error = new NetRunnerError('Test error', {
      type: 'TOOL_EXECUTION_ERROR',
      code: NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED,
      category: NetRunnerErrorCategory.TOOL,
      component: 'TestComponent',
      severity: 'medium'
    });

    const errorObject = error.toObject();
    expect(errorObject).toHaveProperty('code');
    expect(errorObject).toHaveProperty('message');
    expect(errorObject).toHaveProperty('timestamp');
    expect(errorObject).toHaveProperty('component');
  });

  it('should check if error is recoverable', () => {
    const recoverableError = new NetRunnerError('Recoverable error', {
      type: 'TOOL_EXECUTION_ERROR',
      code: NETRUNNER_ERROR_CODES.TOOL_TIMEOUT,
      category: NetRunnerErrorCategory.TOOL,
      component: 'TestComponent',
      severity: 'medium',
      recoverable: true
    });

    const nonRecoverableError = new NetRunnerError('Non-recoverable error', {
      type: 'TOOL_EXECUTION_ERROR',
      code: NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED,
      category: NetRunnerErrorCategory.TOOL,
      component: 'TestComponent',
      severity: 'high',
      recoverable: false
    });

    expect(recoverableError.isRecoverable()).toBe(true);
    expect(nonRecoverableError.isRecoverable()).toBe(false);
  });
});

describe('Specialized Error Classes', () => {
  describe('ToolExecutionError', () => {
    it('should create tool execution error with correct properties', () => {
      const error = new ToolExecutionError('Tool failed to execute', {
        code: NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED,
        component: 'ShodanAdapter',
        severity: 'high'
      });

      expect(error.type).toBe('TOOL_EXECUTION_ERROR');
      expect(error.category).toBe(NetRunnerErrorCategory.TOOL);
      expect(error.component).toBe('ShodanAdapter');
    });
  });

  describe('AdapterError', () => {
    it('should create adapter error with correct properties', () => {
      const error = new AdapterError('Adapter initialization failed', {
        code: NETRUNNER_ERROR_CODES.ADAPTER_INITIALIZATION_FAILED,
        component: 'TheHarvesterAdapter',
        severity: 'high'
      });

      expect(error.type).toBe('ADAPTER_ERROR');
      expect(error.category).toBe(NetRunnerErrorCategory.ADAPTER);
    });
  });

  describe('SearchError', () => {
    it('should create search error with correct properties', () => {
      const error = new SearchError('Search query failed', {
        code: NETRUNNER_ERROR_CODES.SEARCH_QUERY_INVALID,
        component: 'NetRunnerSearchService',
        severity: 'medium'
      });

      expect(error.type).toBe('SEARCH_ERROR');
      expect(error.category).toBe(NetRunnerErrorCategory.SEARCH);
    });
  });

  describe('WorkflowError', () => {
    it('should create workflow error with correct properties', () => {
      const error = new WorkflowError('Workflow step failed', {
        code: NETRUNNER_ERROR_CODES.WORKFLOW_STEP_FAILED,
        component: 'WorkflowEngine',
        severity: 'high'
      });

      expect(error.type).toBe('WORKFLOW_ERROR');
      expect(error.category).toBe(NetRunnerErrorCategory.WORKFLOW);
    });
  });

  describe('BotError', () => {
    it('should create bot error with correct properties', () => {
      const error = new BotError('Bot execution failed', {
        code: NETRUNNER_ERROR_CODES.BOT_EXECUTION_FAILED,
        component: 'BotRoster',
        severity: 'medium'
      });

      expect(error.type).toBe('BOT_ERROR');
      expect(error.category).toBe(NetRunnerErrorCategory.BOT);
    });
  });

  describe('AnalyzerError', () => {
    it('should create analyzer error with correct properties', () => {
      const error = new AnalyzerError('Analysis failed', {
        code: NETRUNNER_ERROR_CODES.ANALYZER_PROCESSING_FAILED,
        component: 'IntelAnalyzer',
        severity: 'high'
      });

      expect(error.type).toBe('ANALYZER_ERROR');
      expect(error.category).toBe(NetRunnerErrorCategory.ANALYZER);
    });
  });

  describe('IntegrationError', () => {
    it('should create integration error with correct properties', () => {
      const error = new IntegrationError('Integration connection failed', {
        code: NETRUNNER_ERROR_CODES.INTEGRATION_CONNECTION_FAILED,
        component: 'MarketplaceIntegration',
        severity: 'high'
      });

      expect(error.type).toBe('INTEGRATION_ERROR');
      expect(error.category).toBe(NetRunnerErrorCategory.INTEGRATION);
    });
  });
});

describe('ErrorFactory', () => {
  describe('createToolError', () => {
    it('should create tool error with minimal parameters', () => {
      const error = ErrorFactory.createToolError(
        'Tool execution failed',
        NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED
      );

      expect(error).toBeInstanceOf(ToolExecutionError);
      expect(error.message).toBe('Tool execution failed');
      expect(error.code).toBe(NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED);
    });

    it('should create tool error with custom options', () => {
      const error = ErrorFactory.createToolError(
        'Tool timeout',
        NETRUNNER_ERROR_CODES.TOOL_TIMEOUT,
        {
          component: 'CustomTool',
          severity: 'low',
          details: { timeout: 30000 },
          recoverable: true
        }
      );

      expect(error.component).toBe('CustomTool');
      expect(error.severity).toBe('low');
      expect(error.details).toEqual({ timeout: 30000 });
      expect(error.recoverable).toBe(true);
    });
  });

  describe('createAdapterError', () => {
    it('should create adapter error', () => {
      const error = ErrorFactory.createAdapterError(
        'Adapter failed',
        NETRUNNER_ERROR_CODES.ADAPTER_API_ERROR,
        { component: 'TestAdapter' }
      );

      expect(error).toBeInstanceOf(AdapterError);
      expect(error.component).toBe('TestAdapter');
    });
  });

  describe('createSearchError', () => {
    it('should create search error', () => {
      const error = ErrorFactory.createSearchError(
        'Search failed',
        NETRUNNER_ERROR_CODES.SEARCH_TIMEOUT,
        { component: 'SearchService' }
      );

      expect(error).toBeInstanceOf(SearchError);
      expect(error.component).toBe('SearchService');
    });
  });

  describe('createWorkflowError', () => {
    it('should create workflow error', () => {
      const error = ErrorFactory.createWorkflowError(
        'Workflow failed',
        NETRUNNER_ERROR_CODES.WORKFLOW_EXECUTION_FAILED,
        { component: 'WorkflowEngine' }
      );

      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.component).toBe('WorkflowEngine');
    });
  });

  describe('createBotError', () => {
    it('should create bot error', () => {
      const error = ErrorFactory.createBotError(
        'Bot failed',
        NETRUNNER_ERROR_CODES.BOT_COMMUNICATION_FAILED,
        { component: 'BotManager' }
      );

      expect(error).toBeInstanceOf(BotError);
      expect(error.component).toBe('BotManager');
    });
  });

  describe('createAnalyzerError', () => {
    it('should create analyzer error', () => {
      const error = ErrorFactory.createAnalyzerError(
        'Analysis failed',
        NETRUNNER_ERROR_CODES.ANALYZER_PROCESSING_FAILED,
        { component: 'IntelAnalyzer' }
      );

      expect(error).toBeInstanceOf(AnalyzerError);
      expect(error.component).toBe('IntelAnalyzer');
    });
  });

  describe('createIntegrationError', () => {
    it('should create integration error', () => {
      const error = ErrorFactory.createIntegrationError(
        'Integration failed',
        NETRUNNER_ERROR_CODES.INTEGRATION_DATA_SYNC_FAILED,
        { component: 'DataSyncService' }
      );

      expect(error).toBeInstanceOf(IntegrationError);
      expect(error.component).toBe('DataSyncService');
    });
  });
});

describe('NetRunnerErrorHandler', () => {
  let errorHandler: NetRunnerErrorHandler;

  beforeEach(() => {
    errorHandler = new NetRunnerErrorHandler();
  });

  describe('handleError', () => {
    it('should handle NetRunner errors', async () => {
      const error = ErrorFactory.createToolError(
        'Tool failed',
        NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED,
        { component: 'TestTool', recoverable: true }
      );

      const result = await errorHandler.handleError(error, {
        component: 'TestComponent',
        operation: 'testOperation'
      });

      expect(result.handled).toBe(true);
      expect(result.recoveryAttempted).toBe(true);
      expect(result.userMessage).toBeDefined();
    });

    it('should handle generic errors', async () => {
      const error = new Error('Generic error');

      const result = await errorHandler.handleError(error, {
        component: 'TestComponent',
        operation: 'testOperation'
      });

      expect(result.handled).toBe(true);
      expect(result.recoveryAttempted).toBe(false);
    });

    it('should determine error severity correctly', () => {
      const highSeverityError = ErrorFactory.createToolError(
        'Critical tool failure',
        NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED,
        { severity: 'critical' }
      );

      const lowSeverityError = ErrorFactory.createToolError(
        'Minor tool issue',
        NETRUNNER_ERROR_CODES.TOOL_PARAMETER_INVALID,
        { severity: 'low' }
      );

      expect(errorHandler.getErrorSeverity(highSeverityError)).toBe('critical');
      expect(errorHandler.getErrorSeverity(lowSeverityError)).toBe('low');
    });

    it('should suggest recovery strategies for recoverable errors', () => {
      const recoverableError = ErrorFactory.createToolError(
        'Tool timeout',
        NETRUNNER_ERROR_CODES.TOOL_TIMEOUT,
        { recoverable: true }
      );

      const strategies = errorHandler.getRecoveryStrategies(recoverableError);
      expect(strategies).toBeInstanceOf(Array);
      expect(strategies.length).toBeGreaterThan(0);
    });

    it('should format user-friendly error messages', () => {
      const error = ErrorFactory.createSearchError(
        'Search API timeout',
        NETRUNNER_ERROR_CODES.SEARCH_TIMEOUT,
        { component: 'SearchService' }
      );

      const userMessage = errorHandler.formatUserMessage(error);
      expect(userMessage).toBeDefined();
      expect(typeof userMessage).toBe('string');
      expect(userMessage.length).toBeGreaterThan(0);
    });
  });
});

describe('NETRUNNER_ERROR_CODES', () => {
  it('should have consistent code format', () => {
    Object.values(NETRUNNER_ERROR_CODES).forEach(code => {
      expect(code).toMatch(/^NET-[A-Z]+-\d+$/);
    });
  });

  it('should have all required error codes', () => {
    // Tool errors
    expect(NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED).toBeDefined();
    expect(NETRUNNER_ERROR_CODES.TOOL_TIMEOUT).toBeDefined();
    expect(NETRUNNER_ERROR_CODES.TOOL_NOT_FOUND).toBeDefined();
    
    // Adapter errors
    expect(NETRUNNER_ERROR_CODES.ADAPTER_NOT_FOUND).toBeDefined();
    expect(NETRUNNER_ERROR_CODES.ADAPTER_API_ERROR).toBeDefined();
    
    // Search errors
    expect(NETRUNNER_ERROR_CODES.SEARCH_TIMEOUT).toBeDefined();
    expect(NETRUNNER_ERROR_CODES.SEARCH_QUERY_INVALID).toBeDefined();
    
    // Workflow errors
    expect(NETRUNNER_ERROR_CODES.WORKFLOW_EXECUTION_FAILED).toBeDefined();
    expect(NETRUNNER_ERROR_CODES.WORKFLOW_STEP_FAILED).toBeDefined();
    
    // Bot errors
    expect(NETRUNNER_ERROR_CODES.BOT_EXECUTION_FAILED).toBeDefined();
    expect(NETRUNNER_ERROR_CODES.BOT_COMMUNICATION_FAILED).toBeDefined();
    
    // Analyzer errors
    expect(NETRUNNER_ERROR_CODES.ANALYZER_PROCESSING_FAILED).toBeDefined();
    expect(NETRUNNER_ERROR_CODES.ANALYZER_CONNECTION_FAILED).toBeDefined();
    
    // Integration errors
    expect(NETRUNNER_ERROR_CODES.INTEGRATION_CONNECTION_FAILED).toBeDefined();
    expect(NETRUNNER_ERROR_CODES.INTEGRATION_DATA_SYNC_FAILED).toBeDefined();
  });
});
