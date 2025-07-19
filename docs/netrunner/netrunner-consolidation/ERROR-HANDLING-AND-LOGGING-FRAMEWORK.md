# NetRunner Error Handling and Logging Framework

**Document Date**: July 10, 2025  
**Author**: GitHub Copilot  
**Status**: Draft  

## 1. Introduction

This document defines a comprehensive error handling and logging framework for the NetRunner sub-application and its integration points with other applications. It provides standardized approaches to error management, user feedback, and system monitoring to ensure robustness and maintainability.

The framework is specifically designed for the NetRunner application and its boundaries, with special attention to handling errors at integration points with the separate IntelAnalyzer application and the Intelligence Exchange Marketplace.

## 2. Error Handling Philosophy

### 2.1 Key Principles

1. **Comprehensive Coverage**: All operations should have proper error handling
2. **Contextual Information**: Errors should include relevant context for debugging
3. **User-Friendly Messages**: Users should receive clear, actionable error messages
4. **Recovery Paths**: Common errors should have defined recovery mechanisms
5. **Centralized Handling**: Use a unified approach to error management
6. **Hierarchical Classification**: Organize errors in a logical hierarchy
7. **Performance Consideration**: Error handling should not significantly impact performance

### 2.2 Error Flow

The error handling flow follows these steps:

1. **Detection**: Identify and capture errors at their source
2. **Enrichment**: Add context, categorization, and additional information
3. **Logging**: Record detailed error information for debugging
4. **Recovery Attempt**: Try to recover from the error if possible
5. **User Notification**: Inform the user with appropriate messaging
6. **Telemetry**: Report error metrics for monitoring

## 3. Error Handling Framework

### 3.1 Error Hierarchy

The NetRunner error handling framework extends the existing IntelReportErrorTypes:

```typescript
// Import existing error types
import { 
  IntelReportErrorType, 
  IntelReportErrorSeverity,
  INTEL_REPORT_ERROR_CODES
} from '../../../types/IntelReportErrorTypes';

// NetRunner-specific error types
export type NetRunnerErrorType = 
  | IntelReportErrorType       // Reuse Intel Report error types
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
};
```

### 3.2 Base Error Class

The base error class provides a foundation for all NetRunner errors:

```typescript
// Base NetRunner Error
export class NetRunnerError extends Error {
  type: NetRunnerErrorType;
  code: string;
  category: NetRunnerErrorCategory;
  component: string;
  timestamp: string;
  severity: IntelReportErrorSeverity;
  details?: Record<string, unknown>;
  cause?: Error;
  correlationId?: string;
  userMessage?: string;
  recoverable: boolean;
  
  constructor(message: string, options: {
    type: NetRunnerErrorType;
    code: string;
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
  
  // Generate a standardized error object for logging and API responses
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
  
  // Create a user-friendly error message
  public getUserMessage(): string {
    return this.userMessage || this.message;
  }
  
  // Check if this error can be automatically recovered from
  public isRecoverable(): boolean {
    return this.recoverable;
  }
}
```

### 3.3 Specialized Error Classes

Specialized error classes for different error types:

```typescript
// Tool Execution Error
export class ToolExecutionError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'TOOL_EXECUTION_ERROR',
      category: NetRunnerErrorCategory.TOOL
    });
  }
}

// Adapter Error
export class AdapterError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'ADAPTER_ERROR',
      category: NetRunnerErrorCategory.ADAPTER
    });
  }
}

// Search Error
export class SearchError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'SEARCH_ERROR',
      category: NetRunnerErrorCategory.SEARCH
    });
  }
}

// Workflow Error
export class WorkflowError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'WORKFLOW_ERROR',
      category: NetRunnerErrorCategory.WORKFLOW
    });
  }
}

// Bot Error
export class BotError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'BOT_ERROR',
      category: NetRunnerErrorCategory.BOT
    });
  }
}

// Analyzer Error
export class AnalyzerError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'ANALYZER_ERROR',
      category: NetRunnerErrorCategory.ANALYZER
    });
  }
}

// Integration Error
export class IntegrationError extends NetRunnerError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category'>) {
    super(message, { 
      ...options, 
      type: 'INTEGRATION_ERROR',
      category: NetRunnerErrorCategory.INTEGRATION
    });
  }
}
```

### 3.4 Error Factory

An error factory to simplify error creation:

```typescript
// Error Factory
export class ErrorFactory {
  // Create a tool execution error
  static createToolError(
    message: string,
    code: string,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>>
  ): ToolExecutionError {
    return new ToolExecutionError(message, {
      code,
      component: options.component || 'NetRunner:Tool',
      severity: options.severity || 'medium',
      ...options
    });
  }
  
  // Create an adapter error
  static createAdapterError(
    message: string,
    code: string,
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>>
  ): AdapterError {
    return new AdapterError(message, {
      code,
      component: options.component || 'NetRunner:Adapter',
      severity: options.severity || 'medium',
      ...options
    });
  }
  
  // Additional factory methods for other error types...
  
  // Create an error from an unknown error
  static createFromUnknown(
    error: unknown,
    defaultMessage: string = 'An unexpected error occurred',
    options: Partial<Omit<ConstructorParameters<typeof NetRunnerError>[1], 'type' | 'category' | 'code'>> = {}
  ): NetRunnerError {
    if (error instanceof NetRunnerError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new NetRunnerError(error.message, {
        type: 'UNKNOWN_ERROR',
        code: 'NET-SYS-001',
        category: NetRunnerErrorCategory.TOOL,
        component: options.component || 'NetRunner:System',
        severity: options.severity || 'high',
        cause: error,
        ...options
      });
    }
    
    return new NetRunnerError(defaultMessage, {
      type: 'UNKNOWN_ERROR',
      code: 'NET-SYS-001',
      category: NetRunnerErrorCategory.TOOL,
      component: options.component || 'NetRunner:System',
      severity: options.severity || 'high',
      details: { originalError: error },
      ...options
    });
  }
}
```

## 4. Logging Framework

### 4.1 Logging Levels

The logging framework defines multiple log levels:

```typescript
// Log Levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Log level numeric values for comparison
export const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.CRITICAL]: 4
};
```

### 4.2 Logger Interface

The logger interface defines the core logging functionality:

```typescript
// Log Entry Interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  correlationId?: string;
  data?: Record<string, unknown>;
  error?: NetRunnerError | Error;
}

// Logger Interface
export interface Logger {
  // Log methods
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  critical(message: string, error?: Error, data?: Record<string, unknown>): void;
  
  // Create a new logger with the same configuration but a different correlation ID
  withCorrelation(correlationId: string): Logger;
  
  // Create a new logger with the same configuration but a different component name
  withComponent(component: string): Logger;
  
  // Create a new logger with a different log level
  withLevel(level: LogLevel): Logger;
}
```

### 4.3 Logger Implementation

The implementation of the logger interface:

```typescript
// Logger Configuration
export interface LoggerConfig {
  level: LogLevel;
  component: string;
  correlationId?: string;
  includeTimestamp: boolean;
  destinations: LogDestination[];
}

// Log Destination
export type LogDestination = 'console' | 'file' | 'remote';

// Logger Implementation
export class NetRunnerLogger implements Logger {
  private config: LoggerConfig;
  
  constructor(config: LoggerConfig) {
    this.config = {
      level: config.level || LogLevel.INFO,
      component: config.component || 'NetRunner',
      correlationId: config.correlationId,
      includeTimestamp: config.includeTimestamp !== false,
      destinations: config.destinations || ['console']
    };
  }
  
  // Log a message at DEBUG level
  public debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, undefined, data);
  }
  
  // Log a message at INFO level
  public info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, undefined, data);
  }
  
  // Log a message at WARN level
  public warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, undefined, data);
  }
  
  // Log a message at ERROR level
  public error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, error, data);
  }
  
  // Log a message at CRITICAL level
  public critical(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.CRITICAL, message, error, data);
  }
  
  // Create a new logger with a correlation ID
  public withCorrelation(correlationId: string): Logger {
    return new NetRunnerLogger({
      ...this.config,
      correlationId
    });
  }
  
  // Create a new logger with a different component name
  public withComponent(component: string): Logger {
    return new NetRunnerLogger({
      ...this.config,
      component
    });
  }
  
  // Create a new logger with a different log level
  public withLevel(level: LogLevel): Logger {
    return new NetRunnerLogger({
      ...this.config,
      level
    });
  }
  
  // Internal logging implementation
  private log(level: LogLevel, message: string, error?: Error, data?: Record<string, unknown>): void {
    // Check if this log level should be processed
    if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[this.config.level]) {
      return;
    }
    
    // Create log entry
    const entry: LogEntry = {
      timestamp: this.config.includeTimestamp ? new Date().toISOString() : '',
      level,
      component: this.config.component,
      message,
      correlationId: this.config.correlationId,
      data,
      error
    };
    
    // Process log entry based on destinations
    for (const destination of this.config.destinations) {
      this.writeToDestination(destination, entry);
    }
  }
  
  // Write log entry to a specific destination
  private writeToDestination(destination: LogDestination, entry: LogEntry): void {
    switch (destination) {
      case 'console':
        this.writeToConsole(entry);
        break;
      case 'file':
        this.writeToFile(entry);
        break;
      case 'remote':
        this.writeToRemote(entry);
        break;
    }
  }
  
  // Write log entry to console
  private writeToConsole(entry: LogEntry): void {
    // Format the log message
    const timestamp = entry.timestamp ? `[${entry.timestamp}]` : '';
    const level = `[${entry.level.toUpperCase()}]`;
    const component = `[${entry.component}]`;
    const correlation = entry.correlationId ? `[cor-id:${entry.correlationId}]` : '';
    const message = `${timestamp}${level}${component}${correlation} ${entry.message}`;
    
    // Choose console method based on log level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.error, entry.data);
        break;
    }
  }
  
  // Write log entry to file
  private writeToFile(entry: LogEntry): void {
    // Implementation for file logging...
  }
  
  // Write log entry to remote service
  private writeToRemote(entry: LogEntry): void {
    // Implementation for remote logging...
  }
}
```

### 4.4 Logger Factory

A factory for creating loggers:

```typescript
// Logger Factory
export class LoggerFactory {
  private static defaultConfig: LoggerConfig = {
    level: LogLevel.INFO,
    component: 'NetRunner',
    includeTimestamp: true,
    destinations: ['console']
  };
  
  // Create a new logger with default configuration
  static getLogger(component: string): Logger {
    return new NetRunnerLogger({
      ...this.defaultConfig,
      component
    });
  }
  
  // Create a new logger with custom configuration
  static createLogger(config: Partial<LoggerConfig>): Logger {
    return new NetRunnerLogger({
      ...this.defaultConfig,
      ...config
    });
  }
  
  // Set default configuration for all loggers
  static setDefaultConfig(config: Partial<LoggerConfig>): void {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config
    };
  }
}
```

## 5. Integration Examples

### 5.1 Tool Adapter with Error Handling and Logging

```typescript
import { Logger, LoggerFactory } from '../services/logging';
import { ToolExecutionError, ErrorFactory, NETRUNNER_ERROR_CODES } from '../services/error';

export class ShodanAdapter extends BaseAdapter {
  private logger: Logger;
  
  constructor() {
    super('shodan', shodanSchema);
    this.logger = LoggerFactory.getLogger('NetRunner:ShodanAdapter');
  }
  
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    const correlationId = request.correlationId || uuidv4();
    const contextLogger = this.logger.withCorrelation(correlationId);
    
    contextLogger.info('Executing Shodan tool request', {
      parameters: request.parameters
    });
    
    try {
      // Validate parameters
      if (!this.validateParameters(request.parameters)) {
        const error = ErrorFactory.createToolError(
          'Invalid parameters for Shodan tool',
          NETRUNNER_ERROR_CODES.TOOL_PARAMETER_INVALID,
          {
            component: 'ShodanAdapter',
            severity: 'high',
            details: { parameters: request.parameters },
            correlationId,
            userMessage: 'The search parameters provided are invalid. Please check your input and try again.'
          }
        );
        
        contextLogger.error('Parameter validation failed', error, {
          parameters: request.parameters
        });
        
        return {
          success: false,
          error: error.toErrorObject(),
          correlationId
        };
      }
      
      // Execute tool logic
      contextLogger.debug('Connecting to Shodan API', {
        query: request.parameters.query
      });
      
      try {
        const result = await this.client.search(
          request.parameters.query,
          request.parameters.limit
        );
        
        contextLogger.info('Shodan search completed successfully', {
          resultCount: result.matches?.length || 0
        });
        
        return {
          success: true,
          data: result,
          correlationId
        };
      } catch (apiError) {
        // Handle API errors
        const error = ErrorFactory.createToolError(
          'Failed to execute Shodan search',
          NETRUNNER_ERROR_CODES.TOOL_EXECUTION_FAILED,
          {
            component: 'ShodanAdapter',
            severity: 'high',
            cause: apiError instanceof Error ? apiError : new Error(String(apiError)),
            details: { 
              parameters: request.parameters,
              apiError: apiError instanceof Error ? apiError.message : String(apiError)
            },
            correlationId,
            userMessage: 'Unable to complete the search operation. Please try again later.'
          }
        );
        
        contextLogger.error('Shodan API error', error, {
          parameters: request.parameters
        });
        
        return {
          success: false,
          error: error.toErrorObject(),
          correlationId
        };
      }
    } catch (unexpectedError) {
      // Handle unexpected errors
      const error = ErrorFactory.createFromUnknown(
        unexpectedError,
        'Unexpected error executing Shodan tool',
        {
          component: 'ShodanAdapter',
          severity: 'critical',
          details: { parameters: request.parameters },
          correlationId,
          userMessage: 'An unexpected error occurred. Our team has been notified.'
        }
      );
      
      contextLogger.critical('Unexpected error in Shodan adapter', error, {
        parameters: request.parameters
      });
      
      return {
        success: false,
        error: error.toErrorObject(),
        correlationId
      };
    }
  }
}
```

### 5.2 React Component with Error Handling

```tsx
import React, { useState, useEffect } from 'react';
import { useNetRunnerSearch } from '../hooks/useNetRunnerSearch';
import { ErrorBoundary, ErrorFallback } from '../components/ErrorHandling';
import { useLogger } from '../hooks/useLogger';
import { SearchError, NETRUNNER_ERROR_CODES } from '../services/error';

interface SearchResultsProps {
  query: string;
  limit?: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ query, limit = 10 }) => {
  const logger = useLogger('NetRunner:SearchResults');
  const { results, loading, error, search } = useNetRunnerSearch();
  const [correlationId] = useState(() => uuidv4());
  
  useEffect(() => {
    const contextLogger = logger.withCorrelation(correlationId);
    
    if (!query) {
      contextLogger.debug('No query provided, skipping search');
      return;
    }
    
    contextLogger.info('Executing search', { query, limit });
    
    search({ query, limit, correlationId })
      .then(() => {
        contextLogger.info('Search completed successfully');
      })
      .catch((searchError) => {
        contextLogger.error('Search failed', searchError);
      });
  }, [query, limit, correlationId]);
  
  // Handle loading state
  if (loading) {
    return <div className="loading">Searching...</div>;
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="error-container">
        <h3>Search Error</h3>
        <p>{error.userMessage || 'An error occurred during the search operation.'}</p>
        <button onClick={() => search({ query, limit, correlationId })}>
          Retry Search
        </button>
      </div>
    );
  }
  
  // Render results
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback 
          error={error} 
          reset={reset} 
          message="An error occurred while displaying search results." 
        />
      )}
    >
      <div className="search-results">
        <h3>Search Results</h3>
        {results.length === 0 ? (
          <p>No results found for "{query}"</p>
        ) : (
          <ul>
            {results.map((result) => (
              <li key={result.id}>
                <h4>{result.title}</h4>
                <p>{result.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ErrorBoundary>
  );
};
```

### 5.3 Cross-Application Integration with Error Handling

```typescript
// Example of IntelAnalyzerAdapter with proper error handling for cross-application communication
import { Logger, LoggerFactory } from '../services/logging';
import { IntegrationError, ErrorFactory, NETRUNNER_ERROR_CODES } from '../services/error';

export class IntelAnalyzerAdapter extends BaseAdapter {
  private logger: Logger;
  private apiClient: IntelAnalyzerApiClient;
  
  constructor() {
    super('intelanalyzer', intelAnalyzerSchema);
    this.logger = LoggerFactory.getLogger('NetRunner:IntelAnalyzerAdapter');
    this.apiClient = new IntelAnalyzerApiClient();
  }
  
  async transferDataToAnalyzer(data: OsintData, options: AnalysisOptions): Promise<TransferResult> {
    const correlationId = options.correlationId || uuidv4();
    const contextLogger = this.logger.withCorrelation(correlationId);
    
    contextLogger.info('Transferring OSINT data to IntelAnalyzer application', {
      dataSize: JSON.stringify(data).length,
      dataType: data.type,
      options
    });
    
    try {
      // Validate data before sending across application boundary
      if (!this.validateDataForTransfer(data)) {
        const error = ErrorFactory.createToolError(
          'Invalid OSINT data for transfer to IntelAnalyzer',
          NETRUNNER_ERROR_CODES.INTEGRATION_DATA_TRANSFORMATION_FAILED,
          {
            component: 'IntelAnalyzerAdapter',
            severity: 'high',
            details: { dataType: data.type },
            correlationId,
            userMessage: 'The collected intelligence data cannot be processed. Please check the data and try again.'
          }
        );
        
        contextLogger.error('Data validation failed before transfer', error);
        return {
          success: false,
          error: error.toErrorObject(),
          correlationId
        };
      }
      
      // Prepare data for transfer to the separate IntelAnalyzer application
      const transferPackage = this.prepareDataForTransfer(data, correlationId);
      
      contextLogger.debug('Connecting to IntelAnalyzer API', {
        endpoint: this.apiClient.getEndpoint(),
        packageSize: JSON.stringify(transferPackage).length
      });
      
      // Call the separate IntelAnalyzer application's API
      try {
        const transferResponse = await this.apiClient.submitData(transferPackage);
        
        contextLogger.info('Successfully transferred data to IntelAnalyzer', {
          analysisId: transferResponse.analysisId,
          status: transferResponse.status
        });
        
        return {
          success: true,
          analysisId: transferResponse.analysisId,
          status: transferResponse.status,
          correlationId
        };
      } catch (apiError) {
        // Handle cross-application communication errors
        const error = new IntegrationError(
          'Failed to communicate with IntelAnalyzer application',
          {
            code: NETRUNNER_ERROR_CODES.INTEGRATION_CONNECTION_FAILED,
            category: 'INTEGRATION',
            component: 'IntelAnalyzerAdapter',
            severity: 'high',
            cause: apiError instanceof Error ? apiError : new Error(String(apiError)),
            details: { 
              endpoint: this.apiClient.getEndpoint(),
              apiError: apiError instanceof Error ? apiError.message : String(apiError)
            },
            correlationId,
            userMessage: 'Unable to connect to the analysis service. The system will retry automatically.'
          }
        );
        
        contextLogger.error('IntelAnalyzer API communication error', error);
        
        // Attempt recovery by queueing the data for retry
        this.queueForRetry(data, options);
        
        return {
          success: false,
          error: error.toErrorObject(),
          queued: true,
          correlationId
        };
      }
    } catch (unexpectedError) {
      // Handle unexpected errors
      const error = ErrorFactory.createFromUnknown(
        unexpectedError,
        'Unexpected error during data transfer to IntelAnalyzer',
        {
          component: 'IntelAnalyzerAdapter',
          severity: 'critical',
          details: { dataType: data.type },
          correlationId,
          userMessage: 'An unexpected error occurred while processing intelligence data. Our team has been notified.'
        }
      );
      
      contextLogger.critical('Unexpected error in IntelAnalyzer adapter', error);
      
      return {
        success: false,
        error: error.toErrorObject(),
        correlationId
      };
    }
  }
  
  // Other methods...
}
```

## 6. Error Presentation Guidelines

### 6.1 Error Notification Types

1. **Toast Notifications**:
   - For non-critical errors
   - Brief and informative
   - Auto-dismiss after a few seconds
   - Include a retry action when applicable

2. **Error Dialogs**:
   - For critical errors requiring user attention
   - Clear error message and explanation
   - Provide actionable steps for resolution
   - Include error code for support reference

3. **Inline Error Messages**:
   - For form validation errors
   - Display next to the relevant field
   - Clear explanation of the issue
   - Guidance on how to resolve

4. **Error Boundaries**:
   - For component-level errors
   - Prevent entire application crashes
   - Provide reset functionality
   - Include technical details for developers

### 6.2 User Message Guidelines

1. **Be Clear and Specific**:
   - Clearly state what went wrong
   - Use plain language, not technical jargon
   - Be specific about the issue

2. **Be Constructive**:
   - Provide next steps or solutions
   - Offer alternatives when possible
   - Don't blame the user

3. **Be Consistent**:
   - Use consistent terminology
   - Follow established patterns
   - Maintain the same tone across all errors

4. **Include Recovery Options**:
   - Provide retry functionality
   - Offer alternative actions
   - Include support information when needed

### 6.3 Error Recovery Strategies

1. **Automatic Retry**:
   - Implement exponential backoff for network errors
   - Retry idempotent operations automatically
   - Limit retry attempts to avoid infinite loops

2. **Graceful Degradation**:
   - Provide reduced functionality when full features are unavailable
   - Use cached data when live data is inaccessible
   - Maintain core functionality during partial system failures

3. **User-Initiated Recovery**:
   - Provide clear retry buttons
   - Offer alternative workflows
   - Allow users to save progress and continue later

4. **Preventive Measures**:
   - Validate input before submission
   - Confirm destructive actions
   - Provide clear guidance to prevent errors

## 7. Implementation Guidelines

### 7.1 Development Guidelines

1. **Always Handle Errors**:
   - Never leave potential error points unhandled
   - Use try/catch blocks for all async operations
   - Provide default error handlers for common scenarios

2. **Add Context to Errors**:
   - Include relevant operation details
   - Add correlation IDs for tracking
   - Preserve original error information

3. **Log Appropriately**:
   - Use the correct log level for each situation
   - Include relevant context in log entries
   - Don't log sensitive information

4. **Provide Recovery Paths**:
   - Mark errors as recoverable when applicable
   - Implement retry mechanisms for transient errors
   - Provide clear user guidance for resolution

### 7.2 Testing Guidelines

1. **Test Error Paths**:
   - Create tests specifically for error scenarios
   - Verify error handling behavior
   - Test recovery mechanisms

2. **Mock External Dependencies**:
   - Simulate API failures
   - Test timeout scenarios
   - Verify error propagation

3. **Verify Logging**:
   - Ensure errors are properly logged
   - Verify log levels and content
   - Check correlation ID propagation

4. **Test UI Error Presentation**:
   - Verify error messages are displayed correctly
   - Test error boundaries
   - Ensure recovery options work as expected

## 8. Conclusion

The NetRunner Error Handling and Logging Framework provides a comprehensive approach to managing errors and logging throughout the application. By implementing this framework, we can ensure robust, maintainable, and user-friendly error handling that enhances the overall quality of the NetRunner sub-application.

Key benefits of this framework include:
1. Standardized error handling across all components
2. Comprehensive logging for debugging and monitoring
3. User-friendly error messages and recovery options
4. Clear guidelines for developers and testers

This framework should be implemented consistently across all NetRunner components to ensure a uniform approach to error management and logging.

---

## Appendices

### Appendix A: Error Code Reference

Complete listing of all error codes with descriptions and recovery strategies.

### Appendix B: Log Format Reference

Detailed specifications of log formats and destinations.

### Appendix C: Error Handling Examples

Additional examples of error handling in different contexts.
