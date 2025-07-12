/**
 * NetRunner Error Factory
 * 
 * Provides convenient factory methods for creating standardized NetRunner errors
 * with consistent messaging and error codes.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

// Error factory - no need to import IntelReportErrorSeverity as it's handled by error classes
import {
  NetRunnerError,
  ToolExecutionError,
  AdapterError,
  SearchError,
  WorkflowError,
  BotError,
  AnalyzerError,
  IntegrationError,
  NetRunnerErrorCode,
  NETRUNNER_ERROR_CODES
} from './NetRunnerError';

/**
 * Error Factory
 * 
 * Simplifies the creation of NetRunner errors with predefined configurations
 * and consistent error messages.
 */
export class ErrorFactory {
  
  /**
   * Create a tool execution error
   */
  static createToolError(
    message: string,
    code: NetRunnerErrorCode,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>> = {}
  ): ToolExecutionError {
    return new ToolExecutionError(message, {
      code,
      component: options.component || 'NetRunner:Tool',
      severity: options.severity || 'medium',
      recoverable: options.recoverable ?? true,
      ...options
    });
  }

  /**
   * Create an adapter error
   */
  static createAdapterError(
    message: string,
    code: NetRunnerErrorCode,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>> = {}
  ): AdapterError {
    return new AdapterError(message, {
      code,
      component: options.component || 'NetRunner:Adapter',
      severity: options.severity || 'medium',
      recoverable: options.recoverable ?? true,
      ...options
    });
  }

  /**
   * Create a search error
   */
  static createSearchError(
    message: string,
    code: NetRunnerErrorCode,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>> = {}
  ): SearchError {
    return new SearchError(message, {
      code,
      component: options.component || 'NetRunner:Search',
      severity: options.severity || 'medium',
      recoverable: options.recoverable ?? true,
      ...options
    });
  }

  /**
   * Create a workflow error
   */
  static createWorkflowError(
    message: string,
    code: NetRunnerErrorCode,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>> = {}
  ): WorkflowError {
    return new WorkflowError(message, {
      code,
      component: options.component || 'NetRunner:Workflow',
      severity: options.severity || 'medium',
      recoverable: options.recoverable ?? false,
      ...options
    });
  }

  /**
   * Create a bot error
   */
  static createBotError(
    message: string,
    code: NetRunnerErrorCode,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>> = {}
  ): BotError {
    return new BotError(message, {
      code,
      component: options.component || 'NetRunner:Bot',
      severity: options.severity || 'medium',
      recoverable: options.recoverable ?? true,
      ...options
    });
  }

  /**
   * Create an analyzer error
   */
  static createAnalyzerError(
    message: string,
    code: NetRunnerErrorCode,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>> = {}
  ): AnalyzerError {
    return new AnalyzerError(message, {
      code,
      component: options.component || 'NetRunner:Analyzer',
      severity: options.severity || 'medium',
      recoverable: options.recoverable ?? false,
      ...options
    });
  }

  /**
   * Create an integration error
   */
  static createIntegrationError(
    message: string,
    code: NetRunnerErrorCode,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>> = {}
  ): IntegrationError {
    return new IntegrationError(message, {
      code,
      component: options.component || 'NetRunner:Integration',
      severity: options.severity || 'high',
      recoverable: options.recoverable ?? false,
      ...options
    });
  }

  // Convenience methods for common error scenarios

  /**
   * Tool not found error
   */
  static toolNotFound(toolId: string, correlationId?: string): ToolExecutionError {
    return this.createToolError(
      `Tool with ID '${toolId}' was not found`,
      NETRUNNER_ERROR_CODES.TOOL_NOT_FOUND,
      {
        userMessage: `The requested tool is not available`,
        details: { toolId },
        correlationId,
        recoverable: false
      }
    );
  }

  /**
   * Tool timeout error
   */
  static toolTimeout(toolId: string, timeoutMs: number, correlationId?: string): ToolExecutionError {
    return this.createToolError(
      `Tool '${toolId}' execution timed out after ${timeoutMs}ms`,
      NETRUNNER_ERROR_CODES.TOOL_TIMEOUT,
      {
        userMessage: `Tool execution took too long and was cancelled`,
        details: { toolId, timeoutMs },
        correlationId,
        recoverable: true
      }
    );
  }

  /**
   * Invalid search query error
   */
  static invalidSearchQuery(query: string, reason: string, correlationId?: string): SearchError {
    return this.createSearchError(
      `Invalid search query: ${reason}`,
      NETRUNNER_ERROR_CODES.SEARCH_QUERY_INVALID,
      {
        userMessage: `Please check your search query and try again`,
        details: { query, reason },
        correlationId,
        recoverable: true
      }
    );
  }

  /**
   * Adapter not found error
   */
  static adapterNotFound(adapterId: string, correlationId?: string): AdapterError {
    return this.createAdapterError(
      `Adapter '${adapterId}' was not found`,
      NETRUNNER_ERROR_CODES.ADAPTER_NOT_FOUND,
      {
        userMessage: `The requested data source is not available`,
        details: { adapterId },
        correlationId,
        recoverable: false
      }
    );
  }

  /**
   * Rate limit error
   */
  static rateLimited(adapterId: string, retryAfter?: number, correlationId?: string): AdapterError {
    return this.createAdapterError(
      `Rate limit exceeded for adapter '${adapterId}'`,
      NETRUNNER_ERROR_CODES.ADAPTER_RATE_LIMITED,
      {
        userMessage: retryAfter 
          ? `Rate limit exceeded. Please try again in ${retryAfter} seconds`
          : `Rate limit exceeded. Please try again later`,
        details: { adapterId, retryAfter },
        correlationId,
        recoverable: true,
        severity: 'low'
      }
    );
  }

  /**
   * Bot not available error
   */
  static botNotAvailable(botId: string, reason: string, correlationId?: string): BotError {
    return this.createBotError(
      `Bot '${botId}' is not available: ${reason}`,
      NETRUNNER_ERROR_CODES.BOT_NOT_AVAILABLE,
      {
        userMessage: `The requested bot is currently unavailable`,
        details: { botId, reason },
        correlationId,
        recoverable: true
      }
    );
  }

  /**
   * Integration connection failed error
   */
  static integrationConnectionFailed(service: string, cause?: Error, correlationId?: string): IntegrationError {
    return this.createIntegrationError(
      `Failed to connect to service '${service}'`,
      NETRUNNER_ERROR_CODES.INTEGRATION_CONNECTION_FAILED,
      {
        userMessage: `Unable to connect to external service`,
        details: { service },
        cause,
        correlationId,
        recoverable: true
      }
    );
  }

  /**
   * Workflow validation error
   */
  static workflowInvalid(workflowId: string, errors: string[], correlationId?: string): WorkflowError {
    return this.createWorkflowError(
      `Workflow '${workflowId}' validation failed: ${errors.join(', ')}`,
      NETRUNNER_ERROR_CODES.WORKFLOW_INVALID,
      {
        userMessage: `The workflow configuration is invalid`,
        details: { workflowId, validationErrors: errors },
        correlationId,
        recoverable: false
      }
    );
  }
}
