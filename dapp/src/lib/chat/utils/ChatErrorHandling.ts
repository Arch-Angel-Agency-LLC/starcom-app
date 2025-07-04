/**
 * ChatErrorHandling.ts
 * 
 * Provides a standardized error handling mechanism for chat providers.
 * Implements the patterns outlined in the error handling specification.
 */

/**
 * Enum representing different types of chat errors.
 */
export enum ChatErrorType {
  CONNECTION = 'connection',
  AUTHENTICATION = 'authentication', 
  RATE_LIMIT = 'rate_limit',
  FEATURE_NOT_SUPPORTED = 'feature_not_supported',
  INVALID_INPUT = 'invalid_input',
  NETWORK = 'network',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  UNKNOWN = 'unknown'
}

/**
 * Interface for structured chat errors.
 */
export interface ChatError extends Error {
  type: ChatErrorType;
  code: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  timestamp: Date;
  context?: Record<string, unknown>; // Operation context when the error occurred
}

/**
 * Type guard to check if an error is a ChatError
 */
export function isChatError(error: unknown): error is ChatError {
  return (
    error instanceof Error && 
    'type' in error && 
    'code' in error && 
    'recoverable' in error && 
    'timestamp' in error
  );
}

/**
 * Creates a chat error with standardized format.
 */
export function createChatError(
  message: string,
  type: ChatErrorType = ChatErrorType.UNKNOWN,
  code: string = 'unknown',
  recoverable: boolean = false,
  details?: Record<string, unknown>,
  context?: Record<string, unknown>
): ChatError {
  const error = new Error(message) as ChatError;
  error.type = type;
  error.code = code;
  error.recoverable = recoverable;
  error.timestamp = new Date();
  error.details = details;
  error.context = context;
  
  return error;
}

/**
 * Ensures that an error is a ChatError, converting if necessary.
 */
export function ensureChatError(error: unknown): ChatError {
  if (error instanceof Error && 'type' in error) {
    return error as ChatError;
  }
  
  let message = 'Unknown error';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error !== null && error !== undefined) {
    try {
      message = JSON.stringify(error);
    } catch {
      message = String(error);
    }
  }
  
  return createChatError(message);
}

/**
 * Provides detailed information about an error, including stack trace if available.
 * This is useful for debugging and logging detailed error information.
 */
export function getDetailedErrorInfo(error: unknown): Record<string, unknown> {
  const details: Record<string, unknown> = {};
  
  if (error instanceof Error) {
    details.message = error.message;
    details.name = error.name;
    details.stack = error.stack;
    
    // Extract properties from ChatError
    if ('type' in error) {
      details.type = (error as ChatError).type;
      details.code = (error as ChatError).code;
      details.recoverable = (error as ChatError).recoverable;
      details.timestamp = (error as ChatError).timestamp;
      
      if ((error as ChatError).details) {
        details.errorDetails = (error as ChatError).details;
      }
    }
    
    // Extract additional properties from the error object
    for (const key in error) {
      if (!details[key] && key !== 'details') {
        try {
          // Need to use type assertion for safety, as Error properties aren't indexed
          details[key] = (error as unknown as Record<string, unknown>)[key];
        } catch {
          // Ignore errors when accessing properties
        }
      }
    }
  } else if (typeof error === 'string') {
    details.message = error;
    details.type = 'string';
  } else if (error === null) {
    details.type = 'null';
  } else if (error === undefined) {
    details.type = 'undefined';
  } else {
    try {
      details.value = JSON.stringify(error);
    } catch {
      details.value = String(error);
    }
    details.type = typeof error;
  }
  
  return details;
}

/**
 * Validates if an error is a specific type of ChatError.
 * Useful for testing and conditional error handling.
 */
export function isErrorOfType(error: unknown, type: ChatErrorType): boolean {
  if (error instanceof Error && 'type' in error) {
    return (error as ChatError).type === type;
  }
  return false;
}

/**
 * Enhanced version of ensureChatError that preserves more context
 * from the original error and provides better details.
 */
export function convertToChatError(
  error: unknown, 
  type: ChatErrorType = ChatErrorType.UNKNOWN,
  code: string = 'unknown',
  recoverable: boolean = false
): ChatError {
  if (error instanceof Error && 'type' in error) {
    return error as ChatError;
  }
  
  let message = 'Unknown error';
  const details: Record<string, unknown> = {};
  
  if (error instanceof Error) {
    message = error.message;
    details.originalStack = error.stack;
    details.originalName = error.name;
    
    // Copy additional properties
    for (const key in error) {
      if (key !== 'message' && key !== 'stack' && key !== 'name') {
        try {
          details[key] = (error as unknown as Record<string, unknown>)[key];
        } catch {
          // Ignore errors when accessing properties
        }
      }
    }
  } else if (typeof error === 'string') {
    message = error;
  } else if (error !== null && error !== undefined) {
    try {
      const serialized = JSON.stringify(error);
      message = `Serialized error: ${serialized}`;
      details.serializedValue = serialized;
    } catch {
      message = String(error);
      details.stringValue = String(error);
    }
    details.valueType = typeof error;
  }
  
  return createChatError(message, type, code, recoverable, details);
}

/**
 * Retry utility with exponential backoff.
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  {
    maxAttempts = 3,
    backoffMs = 300,
    exponential = true,
    retryableErrors = [ChatErrorType.NETWORK, ChatErrorType.TIMEOUT, ChatErrorType.SERVICE_UNAVAILABLE]
  }: {
    maxAttempts?: number;
    backoffMs?: number;
    exponential?: boolean;
    retryableErrors?: ChatErrorType[];
  } = {}
): Promise<T> {
  let lastError: ChatError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = ensureChatError(error);
      
      if (!retryableErrors.includes(lastError.type) || attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = exponential 
        ? backoffMs * Math.pow(2, attempt - 1)
        : backoffMs;
        
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Circuit breaker implementation to prevent repeated failed calls.
 */
export class CircuitBreaker {
  private failureCount = 0;
  private isOpen = false;
  private lastFailureTime?: Date;
  private readonly maxFailures: number;
  private readonly resetTimeoutMs: number;

  constructor(maxFailures = 5, resetTimeoutMs = 30000) {
    this.maxFailures = maxFailures;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      if (this.shouldReset()) {
        this.reset();
      } else {
        throw createChatError(
          'Circuit breaker is open, too many failures',
          ChatErrorType.SERVICE_UNAVAILABLE,
          'circuit_open',
          true,
          { timeUntilReset: this.getTimeUntilReset() }
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw ensureChatError(error);
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.maxFailures) {
      this.isOpen = true;
    }
  }

  private shouldReset(): boolean {
    if (!this.lastFailureTime) return true;
    
    const timeSinceLastFailure = new Date().getTime() - this.lastFailureTime.getTime();
    return timeSinceLastFailure > this.resetTimeoutMs;
  }
  
  private getTimeUntilReset(): number {
    if (!this.lastFailureTime) return 0;
    
    const timeSinceLastFailure = new Date().getTime() - this.lastFailureTime.getTime();
    return Math.max(0, this.resetTimeoutMs - timeSinceLastFailure);
  }

  private reset(): void {
    this.isOpen = false;
    this.failureCount = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * Logger implementation for chat operations.
 */
export class ChatLogger {
  private loggingLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
  private verboseMode = false;
  private maxErrorRetentionCount = 20;
  private recentErrors: Array<{ 
    timestamp: Date,
    message: string,
    error?: Error | ChatError,
    context?: Record<string, unknown>
  }> = [];
  
  constructor(
    private providerName: string,
    options?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
      enableVerboseMode?: boolean;
      maxErrorRetention?: number;
      outputToConsole?: boolean;
      outputToFile?: boolean;
      filePath?: string;
    }
  ) {
    if (options?.level) {
      this.loggingLevel = options.level;
    }
    
    // Enable verbose mode based on environment or options
    this.verboseMode = options?.enableVerboseMode || 
      (typeof process !== 'undefined' && (
        process.env.VERBOSE_LOGGING === 'true' ||
        process.env.DEBUG === 'true' ||
        process.env.NODE_ENV === 'development'
      )) ||
      false;
      
    if (options?.maxErrorRetention) {
      this.maxErrorRetentionCount = options.maxErrorRetention;
    }
    
    this.outputToConsole = options?.outputToConsole !== false;
    this.outputToFile = options?.outputToFile || false;
    this.filePath = options?.filePath || './chat-logs.log';
    
    // Initialize logger
    this.debug(`ChatLogger initialized for provider: ${this.providerName}`, { 
      verboseMode: this.verboseMode,
      level: this.loggingLevel,
      outputToConsole: this.outputToConsole,
      outputToFile: this.outputToFile
    });
  }
  
  private outputToConsole = true;
  private outputToFile = false;
  private filePath = './chat-logs.log';
  
  /**
   * Sets the logger to verbose mode, which includes more details in logs
   */
  enableVerboseMode(): void {
    this.verboseMode = true;
    this.debug('Verbose logging mode enabled');
  }
  
  /**
   * Disables verbose mode
   */
  disableVerboseMode(): void {
    this.verboseMode = false;
    this.debug('Verbose logging mode disabled');
  }
  
  /**
   * Sets the minimum logging level
   */
  setLoggingLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    const oldLevel = this.loggingLevel;
    this.loggingLevel = level;
    this.debug(`Logging level changed from ${oldLevel} to ${level}`);
  }
  
  /**
   * Gets the error history
   */
  getErrorHistory(): Array<{ timestamp: Date, message: string }> {
    return this.recentErrors.map(({ timestamp, message }) => ({ timestamp, message }));
  }
  
  /**
   * Returns the full error history with details if in verbose mode
   */
  getDetailedErrorHistory(): Array<{ 
    timestamp: Date, 
    message: string, 
    error?: Error | ChatError,
    context?: Record<string, unknown>
  }> {
    return this.verboseMode ? [...this.recentErrors] : this.getErrorHistory();
  }
  
  /**
   * Clears the error history
   */
  clearErrorHistory(): void {
    this.recentErrors = [];
    this.debug('Error history cleared');
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, data);
    }
  }
  
  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      this.log('info', message, data);
    }
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, unknown> | Error | ChatError): void {
    if (this.shouldLog('warn')) {
      // Handle the case where data is actually an error
      if (data instanceof Error) {
        this.log('warn', message, undefined, data);
        return;
      }
      
      this.log('warn', message, data);
    }
  }
  
  /**
   * Log an error message with detailed context
   */
  error(message: string, error?: Error | ChatError, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const errorData: Record<string, unknown> = { ...data };
      
      // Store error in history
      this.recentErrors.push({
        timestamp: new Date(),
        message,
        error,
        context: data
      });
      
      // Trim error history if it gets too large
      if (this.recentErrors.length > this.maxErrorRetentionCount) {
        this.recentErrors.shift();
      }
      
      if (error) {
        // Get detailed error information
        const details = getDetailedErrorInfo(error);
        
        // In verbose mode, include all error details
        if (this.verboseMode) {
          Object.assign(errorData, details);
          
          // Add operation context information if available
          if (isChatError(error) && error.context) {
            errorData.operationContext = error.context;
          }
          
          // Include stack trace for easier debugging
          if (error.stack) {
            errorData.stack = error.stack.split('\n');
          }
        } else {
          // In regular mode, include only essential error information
          errorData.error = error instanceof Error ? error.message : error;
          
          if (isChatError(error)) {
            errorData.errorType = error.type;
            errorData.errorCode = error.code;
            errorData.recoverable = error.recoverable;
          }
        }
      }
      
      this.log('error', message, errorData, error);
    }
  }
  
  /**
   * Logs a chat event with associated data
   */
  logEvent(eventName: string, data?: Record<string, unknown>): void {
    this.info(`Event: ${eventName}`, { 
      eventName,
      ...data
    });
  }
  
  /**
   * Logs performance metrics
   */
  logPerformance(operation: string, durationMs: number, success: boolean, context?: Record<string, unknown>): void {
    const level = success ? 'debug' : 'warn';
    const status = success ? 'completed' : 'failed';
    
    this[level](`Performance: ${operation} ${status} in ${durationMs}ms`, {
      operation,
      durationMs,
      success,
      ...context
    });
  }
  
  /**
   * Determines if a message at the specified level should be logged
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.loggingLevel];
  }
  
  /**
   * Log a message with the specified level and data
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error', 
    message: string, 
    data?: Record<string, unknown>,
    error?: Error | ChatError
  ): void {
    const timestamp = new Date();
    const logData: Record<string, unknown> = {
      provider: this.providerName,
      timestamp: timestamp.toISOString(),
      level,
      ...data
    };
    
    // Add context information in verbose mode
    if (this.verboseMode) {
      try {
        // Capture call stack for better debugging
        const stack = new Error().stack?.split('\n').slice(3);
        if (stack) {
          logData.callSite = stack[0]?.trim();
          logData.callStack = stack;
        }
        
        // Add process information if available (Node.js environment)
        if (typeof process !== 'undefined') {
          logData.pid = process.pid;
          logData.nodeVersion = process.version;
          logData.platform = process.platform;
        }
      } catch {
        // Ignore errors when capturing stack
      }
    }
    
    // Format the message with timestamp, level, and provider
    const formattedMessage = `[${timestamp.toISOString()}][${level.toUpperCase()}][${this.providerName}] ${message}`;
    
    // Output to console if enabled
    if (this.outputToConsole) {
      console[level](formattedMessage, logData);
      
      // Print stack trace for errors in verbose mode
      if (level === 'error' && this.verboseMode && error?.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    // Output to file if enabled (would be implemented for Node.js environment)
    if (this.outputToFile && typeof process !== 'undefined') {
      try {
        // This would be implemented with fs.appendFile or similar
        // fs.appendFileSync(this.filePath, `${formattedMessage}\n${JSON.stringify(logData)}\n`);
      } catch (err) {
        console.error(`Failed to write to log file: ${err}`);
      }
    }
  }
}

/**
 * Formats an error into a human-readable string with detailed context
 * for debugging and logging purposes.
 */
export function formatErrorForDisplay(error: unknown): string {
  if (!error) {
    return 'Unknown error (null or undefined)';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    // Start with basic error info
    let result = `Error: ${error.message}`;
    
    // Add ChatError specific details if available
    if (isChatError(error)) {
      result += `\nType: ${error.type}`;
      result += `\nCode: ${error.code}`;
      result += `\nRecoverable: ${error.recoverable ? 'Yes' : 'No'}`;
      result += `\nTimestamp: ${error.timestamp.toISOString()}`;
      
      // Add details if available
      if (error.details && Object.keys(error.details).length > 0) {
        result += '\nDetails:';
        for (const [key, value] of Object.entries(error.details)) {
          result += `\n  ${key}: ${formatValue(value)}`;
        }
      }
      
      // Add context if available
      if (error.context && Object.keys(error.context).length > 0) {
        result += '\nContext:';
        for (const [key, value] of Object.entries(error.context)) {
          result += `\n  ${key}: ${formatValue(value)}`;
        }
      }
    }
    
    // Add stack trace if available (indented for readability)
    if (error.stack) {
      result += '\nStack Trace:';
      const stackLines = error.stack.split('\n');
      // Skip the first line as it's usually just the error message again
      for (let i = 1; i < stackLines.length; i++) {
        result += `\n  ${stackLines[i].trim()}`;
      }
    }
    
    return result;
  }
  
  // For other types, try to stringify
  try {
    return `Non-Error object: ${JSON.stringify(error, null, 2)}`;
  } catch {
    return `Unserializable error: ${String(error)}`;
  }
}

/**
 * Helper function to format values for display
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

/**
 * Wraps a function with proper error handling that ensures all errors
 * are converted to ChatError format.
 */
export function createErrorHandler<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  options: {
    errorType?: ChatErrorType;
    errorCode?: string;
    recoverable?: boolean;
    message?: string;
  } = {}
): (...args: Args) => Result {
  const {
    errorType = ChatErrorType.UNKNOWN,
    errorCode = 'handler_error',
    recoverable = false,
    message
  } = options;
  
  return function errorHandlingWrapper(...args: Args): Result {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.catch(error => {
          // Extract function name if possible
          const fnName = fn.name || 'anonymous function';
          
          // Create a ChatError with useful details
          const chatError = createChatError(
            message || `Error in ${fnName}: ${error instanceof Error ? error.message : String(error)}`,
            errorType,
            errorCode,
            recoverable,
            {
              originalError: error instanceof Error ? error.message : String(error),
              function: fnName,
              args: args.map(arg => safeStringify(arg))
            }
          );
          
          // Preserve the stack trace if possible
          if (error instanceof Error && error.stack) {
            chatError.stack = error.stack;
          }
          
          throw chatError;
        }) as unknown as Result;
      }
      
      return result;
    } catch (error) {
      // Extract function name if possible
      const fnName = fn.name || 'anonymous function';
      
      // Create a ChatError with useful details
      const chatError = createChatError(
        message || `Error in ${fnName}: ${error instanceof Error ? error.message : String(error)}`,
        errorType,
        errorCode,
        recoverable,
        {
          originalError: error instanceof Error ? error.message : String(error),
          function: fnName,
          args: args.map(arg => safeStringify(arg))
        }
      );
      
      // Preserve the stack trace if possible
      if (error instanceof Error && error.stack) {
        chatError.stack = error.stack;
      }
      
      throw chatError;
    }
  };
}

/**
 * Safely stringify any value, handling circular references
 */
function safeStringify(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return '[Function]';
  if (typeof value !== 'object') return String(value);
  
  try {
    return JSON.stringify(value);
  } catch {
    // For circular structures or other JSON serialization issues
    return '[Object]';
  }
}

/**
 * Feature detection helper for chat adapters.
 */
export class FeatureDetector {
  private features: Set<string>;
  
  constructor(private providerName: string, supportedFeatures: string[] = []) {
    this.features = new Set(supportedFeatures);
  }
  
  supportsFeature(feature: string): boolean {
    return this.features.has(feature);
  }
  
  addFeature(feature: string): void {
    this.features.add(feature);
  }
  
  removeFeature(feature: string): void {
    this.features.delete(feature);
  }
  
  getFeatureList(): string[] {
    return Array.from(this.features);
  }
}
