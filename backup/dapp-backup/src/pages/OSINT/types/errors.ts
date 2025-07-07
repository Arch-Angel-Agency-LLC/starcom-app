/**
 * OSINT Error Types
 * 
 * Defines standardized error types and interfaces for the OSINT module.
 */

// Error severity levels
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

// Error categories
export type ErrorCategory = 
  | 'network'        // Network-related errors
  | 'authentication' // Authentication/authorization errors
  | 'data'           // Data-related errors
  | 'security'       // Security-related errors
  | 'api'            // API-related errors
  | 'timeout'        // Timeout errors
  | 'validation'     // Input validation errors
  | 'server'         // Server-side errors
  | 'client'         // Client-side errors
  | 'unknown';       // Unknown errors

// Error codes
export type ErrorCode = 
  | 'NETWORK_DISCONNECTED'
  | 'REQUEST_TIMEOUT'
  | 'SERVER_ERROR'
  | 'API_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHENTICATION_EXPIRED'
  | 'INVALID_DATA'
  | 'DATA_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'SECURITY_RISK'
  | 'UNEXPECTED_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'RETRY_FAILED'
  | 'OPERATION_ABORTED';

/**
 * Detailed error information
 */
export interface ErrorDetail {
  // Basic error information
  message: string;            // Human-readable error message
  code?: ErrorCode;           // Error code
  category?: ErrorCategory;   // Error category
  severity?: ErrorSeverity;   // Error severity
  
  // Context information
  operation?: string;         // Operation that failed
  component?: string;         // Component where error occurred
  timestamp: string;          // When the error occurred
  
  // Debugging information
  originalError?: Error;      // Original error object
  stack?: string;             // Stack trace
  
  // Recovery information
  recoverable: boolean;       // Whether error is recoverable
  retryable: boolean;         // Whether operation can be retried
  retryCount?: number;        // Number of retry attempts
  retryAfter?: number;        // Milliseconds to wait before retry
  userActions?: string[];     // Suggested user actions
  
  // Additional data
  context?: Record<string, unknown>; // Additional context
}

/**
 * Create a new error detail
 */
export function createErrorDetail(
  message: string,
  options: Partial<Omit<ErrorDetail, 'message' | 'timestamp'>> = {}
): ErrorDetail {
  return {
    message,
    timestamp: new Date().toISOString(),
    recoverable: options.recoverable ?? true,
    retryable: options.retryable ?? true,
    ...options
  };
}

/**
 * Error handling utilities
 */
export const ErrorUtils = {
  /**
   * Format error message from any error
   */
  getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    } else if (error === null) {
      return 'Null error';
    } else if (error === undefined) {
      return 'Undefined error';
    } else {
      return 'Unknown error';
    }
  },
  
  /**
   * Get error category from error
   */
  getErrorCategory(error: unknown): ErrorCategory {
    if (error instanceof Error) {
      if (error.name === 'TypeError') return 'client';
      if (error.name === 'SyntaxError') return 'data';
      if (error.name === 'ReferenceError') return 'client';
      if (error.name === 'RangeError') return 'validation';
      if (error.name === 'URIError') return 'client';
      if (error.name === 'EvalError') return 'client';
    }
    
    if (error instanceof DOMException) {
      if (error.name === 'NetworkError') return 'network';
      if (error.name === 'AbortError') return 'timeout';
      if (error.name === 'SecurityError') return 'security';
      if (error.name === 'InvalidStateError') return 'client';
    }
    
    const errorString = String(error).toLowerCase();
    if (errorString.includes('network') || errorString.includes('connection')) return 'network';
    if (errorString.includes('timeout') || errorString.includes('timed out')) return 'timeout';
    if (errorString.includes('auth') || errorString.includes('permission')) return 'authentication';
    if (errorString.includes('404') || errorString.includes('not found')) return 'data';
    if (errorString.includes('500') || errorString.includes('server error')) return 'server';
    if (errorString.includes('data') || errorString.includes('json') || errorString.includes('parse')) return 'data';
    
    return 'unknown';
  },
  
  /**
   * Create a user-friendly error message
   */
  createUserFriendlyMessage(error: unknown): string {
    const category = this.getErrorCategory(error);
    const message = this.getErrorMessage(error);
    
    // Default messages for common error categories
    const defaultMessages: Record<ErrorCategory, string> = {
      network: 'Network connection issue. Please check your connection and try again.',
      authentication: 'Authentication required or session expired. Please log in again.',
      data: 'There was a problem with the data. Please try again.',
      security: 'A security issue was detected. Please contact support if this persists.',
      api: 'The service is experiencing difficulties. Please try again later.',
      timeout: 'The operation timed out. Please try again.',
      validation: 'Invalid input data. Please check your input and try again.',
      server: 'The server encountered an error. Please try again later.',
      client: 'An error occurred in the application. Please refresh the page.',
      unknown: 'An unexpected error occurred. Please try again later.'
    };
    
    // If the error message is technical or non-descriptive, use the default message
    if (message.includes('Error:') || message.includes('Exception:') || 
        message.length < 10 || message.includes('undefined') || 
        message.includes('null') || message.includes('object Object')) {
      return defaultMessages[category];
    }
    
    return message;
  }
};
