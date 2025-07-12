/**
 * NetRunner Error Handling Framework
 * 
 * This module provides comprehensive error handling capabilities for the NetRunner
 * sub-application, including specialized error classes, error codes, and utilities
 * for managing errors across OSINT collection operations.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { 
  IntelReportErrorSeverity
} from '../../../../types/IntelReportErrorTypes';

// NetRunner-specific error types
export type NetRunnerErrorType = 
  | 'TOOL_EXECUTION_ERROR'     // Tool execution failures
  | 'ADAPTER_ERROR'            // Adapter-specific errors
  | 'SEARCH_ERROR'             // Search operation failures
  | 'WORKFLOW_ERROR'           // Workflow execution issues
  | 'BOT_ERROR'                // Bot automation issues
  | 'ANALYZER_ERROR'           // Intelligence analysis errors
  | 'INTEGRATION_ERROR';       // Integration with other systems

// NetRunner error categories
export enum NetRunnerErrorCategory {
  TOOL = 'TOOL',               // Tool-related errors
  ADAPTER = 'ADAPTER',         // Adapter-related errors
  SEARCH = 'SEARCH',           // Search-related errors
  WORKFLOW = 'WORKFLOW',       // Workflow-related errors
  BOT = 'BOT',                 // Bot-related errors
  ANALYZER = 'ANALYZER',       // Analyzer-related errors
  INTEGRATION = 'INTEGRATION'  // Integration-related errors
}

// NetRunner error codes
// Format: NET-[Category]-[Number]
export const NETRUNNER_ERROR_CODES = {
  // Tool Execution Errors (NET-TOOL-xxx)
  TOOL_EXECUTION_FAILED: 'NET-TOOL-001',
  TOOL_TIMEOUT: 'NET-TOOL-002',
  TOOL_PARAMETER_INVALID: 'NET-TOOL-003',
  TOOL_NOT_FOUND: 'NET-TOOL-004',
  TOOL_INITIALIZATION_FAILED: 'NET-TOOL-005',
  
  // Adapter Errors (NET-ADAPT-xxx)
  ADAPTER_NOT_FOUND: 'NET-ADAPT-001',
  ADAPTER_INITIALIZATION_FAILED: 'NET-ADAPT-002',
  ADAPTER_API_ERROR: 'NET-ADAPT-003',
  ADAPTER_RESPONSE_INVALID: 'NET-ADAPT-004',
  ADAPTER_RATE_LIMITED: 'NET-ADAPT-005',
  
  // Search Errors (NET-SRCH-xxx)
  SEARCH_QUERY_INVALID: 'NET-SRCH-001',
  SEARCH_TIMEOUT: 'NET-SRCH-002',
  SEARCH_NO_RESULTS: 'NET-SRCH-003',
  SEARCH_TOO_MANY_RESULTS: 'NET-SRCH-004',
  SEARCH_PARAMETER_INVALID: 'NET-SRCH-005',
  
  // Workflow Errors (NET-FLOW-xxx)
  WORKFLOW_INVALID: 'NET-FLOW-001',
  WORKFLOW_STEP_FAILED: 'NET-FLOW-002',
  WORKFLOW_DEPENDENCY_FAILED: 'NET-FLOW-003',
  WORKFLOW_TIMEOUT: 'NET-FLOW-004',
  WORKFLOW_CANCELLED: 'NET-FLOW-005',
  
  // Bot Errors (NET-BOT-xxx)
  BOT_NOT_AVAILABLE: 'NET-BOT-001',
  BOT_EXECUTION_FAILED: 'NET-BOT-002',
  BOT_TIMEOUT: 'NET-BOT-003',
  BOT_PARAMETER_INVALID: 'NET-BOT-004',
  BOT_QUOTA_EXCEEDED: 'NET-BOT-005',
  
  // Analyzer Errors (NET-ANLZ-xxx)
  ANALYZER_PROCESSING_FAILED: 'NET-ANLZ-001',
  ANALYZER_INSUFFICIENT_DATA: 'NET-ANLZ-002',
  ANALYZER_MODEL_ERROR: 'NET-ANLZ-003',
  ANALYZER_TIMEOUT: 'NET-ANLZ-004',
  ANALYZER_ENTITY_EXTRACTION_FAILED: 'NET-ANLZ-005',
  
  // Integration Errors (NET-INTG-xxx)
  INTEGRATION_CONNECTION_FAILED: 'NET-INTG-001',
  INTEGRATION_AUTHENTICATION_FAILED: 'NET-INTG-002',
  INTEGRATION_DATA_TRANSFORMATION_FAILED: 'NET-INTG-003',
  INTEGRATION_TIMEOUT: 'NET-INTG-004',
  INTEGRATION_SYNCHRONIZATION_FAILED: 'NET-INTG-005'
} as const;

export type NetRunnerErrorCode = typeof NETRUNNER_ERROR_CODES[keyof typeof NETRUNNER_ERROR_CODES];

/**
 * Base NetRunner Error Class
 * 
 * Provides a standardized foundation for all NetRunner errors with consistent
 * structure, metadata, and utility methods for error handling and logging.
 */
export class NetRunnerError extends Error {
  readonly type: NetRunnerErrorType;
  readonly code: NetRunnerErrorCode;
  readonly category: NetRunnerErrorCategory;
  readonly component: string;
  readonly timestamp: string;
  readonly severity: IntelReportErrorSeverity;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly correlationId?: string;
  readonly userMessage?: string;
  readonly recoverable: boolean;
  
  constructor(message: string, options: {
    type: NetRunnerErrorType;
    code: NetRunnerErrorCode;
    category: NetRunnerErrorCategory;
    component: string;
    severity: IntelReportErrorSeverity;
    details?: Record<string, unknown>;
    cause?: Error;
    correlationId?: string;
    userMessage?: string;
    recoverable?: boolean;
  }) {
    super(message);
    this.name = this.constructor.name;
    this.type = options.type;
    this.code = options.code;
    this.category = options.category;
    this.component = options.component;
    this.timestamp = new Date().toISOString();
    this.severity = options.severity;
    this.details = options.details;
    this.cause = options.cause;
    this.correlationId = options.correlationId;
    this.userMessage = options.userMessage || message;
    this.recoverable = options.recoverable ?? false;
  }
  
  /**
   * Generate a standardized error object for logging and API responses
   */
  public toErrorObject(): Record<string, unknown> {
    return {
      type: this.type,
      code: this.code,
      category: this.category,
      component: this.component,
      timestamp: this.timestamp,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      correlationId: this.correlationId,
      recoverable: this.recoverable,
      stack: this.stack
    };
  }
  
  /**
   * Create a user-friendly error message
   */
  public getUserMessage(): string {
    return this.userMessage || this.message;
  }
  
  /**
   * Check if this error can be automatically recovered from
   */
  public isRecoverable(): boolean {
    return this.recoverable;
  }
}

/**
 * Tool Execution Error
 * 
 * Specialized error for OSINT tool execution failures
 */
export class ToolExecutionError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'TOOL_EXECUTION_ERROR',
      category: NetRunnerErrorCategory.TOOL
    });
  }
}

/**
 * Adapter Error
 * 
 * Specialized error for tool adapter issues
 */
export class AdapterError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'ADAPTER_ERROR',
      category: NetRunnerErrorCategory.ADAPTER
    });
  }
}

/**
 * Search Error
 * 
 * Specialized error for OSINT search operation failures
 */
export class SearchError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'SEARCH_ERROR',
      category: NetRunnerErrorCategory.SEARCH
    });
  }
}

/**
 * Workflow Error
 * 
 * Specialized error for automated workflow issues
 */
export class WorkflowError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'WORKFLOW_ERROR',
      category: NetRunnerErrorCategory.WORKFLOW
    });
  }
}

/**
 * Bot Error
 * 
 * Specialized error for bot automation issues
 */
export class BotError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'BOT_ERROR',
      category: NetRunnerErrorCategory.BOT
    });
  }
}

/**
 * Analyzer Error
 * 
 * Specialized error for intelligence analysis operations
 */
export class AnalyzerError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'ANALYZER_ERROR',
      category: NetRunnerErrorCategory.ANALYZER
    });
  }
}

/**
 * Integration Error
 * 
 * Specialized error for system integration issues
 */
export class IntegrationError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'INTEGRATION_ERROR',
      category: NetRunnerErrorCategory.INTEGRATION
    });
  }
}
