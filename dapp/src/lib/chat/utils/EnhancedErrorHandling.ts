/**
 * Enhances the ChatErrorHandling module with robust error detection helpers.
 * 
 * This file adds extra utilities to improve error handling and provide
 * more context for debugging chat-related errors.
 */

import { 
  ChatError, 
  ChatErrorType, 
  createChatError,
  ensureChatError,
  isErrorOfType
} from './ChatErrorHandling';

/**
 * Validates a chat message structure
 * @param message The message to validate
 * @returns True if valid, throws descriptive error if invalid
 */
export function validateChatMessage(message: any): boolean {
  if (!message) {
    throw createChatError(
      'Message is null or undefined',
      ChatErrorType.INVALID_INPUT,
      'invalid_message_null',
      false
    );
  }
  
  if (typeof message !== 'object') {
    throw createChatError(
      `Message must be an object, got ${typeof message}`,
      ChatErrorType.INVALID_INPUT,
      'invalid_message_type',
      false,
      { actualType: typeof message }
    );
  }
  
  if (!message.id) {
    throw createChatError(
      'Message is missing required ID field',
      ChatErrorType.INVALID_INPUT,
      'invalid_message_missing_id',
      false,
      { message }
    );
  }
  
  // Check content
  if (!message.content && !message.deletedAt) {
    throw createChatError(
      'Message is missing content and is not marked as deleted',
      ChatErrorType.INVALID_INPUT,
      'invalid_message_no_content',
      false,
      { message }
    );
  }
  
  // Additional validations could be added here
  return true;
}

/**
 * Captures detailed contextual information when an error occurs
 * @param operation Name of the operation that failed
 * @param error The error that occurred
 * @param context Additional context (parameters, state, etc.)
 * @returns Enhanced ChatError with rich context
 */
export function captureErrorContext(
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): ChatError {
  const chatError = ensureChatError(error);
  
  // Add operation and timestamp to context
  const enhancedContext = {
    operation,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  // Preserve original context if it exists
  if (chatError.context) {
    Object.assign(enhancedContext, chatError.context);
  }
  
  // Set the enhanced context
  chatError.context = enhancedContext;
  
  // Add stack trace to details if not already present
  if (!chatError.details) {
    chatError.details = {};
  }
  
  if (error instanceof Error && error.stack && !chatError.details.stack) {
    chatError.details.stack = error.stack;
  }
  
  return chatError;
}

/**
 * Creates a standardized timeout error with the provided context
 */
export function createTimeoutError(
  operation: string,
  timeoutMs: number,
  context?: Record<string, unknown>
): ChatError {
  return createChatError(
    `Operation "${operation}" timed out after ${timeoutMs}ms`,
    ChatErrorType.TIMEOUT,
    'operation_timeout',
    true, // Most timeouts are recoverable with retry
    { timeoutMs, operation },
    context
  );
}

/**
 * Creates a network error with standardized format
 */
export function createNetworkError(
  message: string,
  originalError?: unknown,
  context?: Record<string, unknown>
): ChatError {
  // Extract details from original error
  let details: Record<string, unknown> = { originalError };
  
  if (originalError instanceof Error) {
    details = {
      ...details,
      originalMessage: originalError.message,
      originalStack: originalError.stack
    };
  }
  
  return createChatError(
    message,
    ChatErrorType.NETWORK,
    'network_error',
    true, // Network errors are usually recoverable
    details,
    context
  );
}

/**
 * Wraps an async operation with timeout and error context
 */
export async function withTimeoutAndContext<T>(
  operation: () => Promise<T>,
  operationName: string,
  timeoutMs: number,
  context?: Record<string, unknown>
): Promise<T> {
  // Create timeout promise
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(createTimeoutError(operationName, timeoutMs, context));
    }, timeoutMs);
  });
  
  try {
    // Race the operation against timeout
    return await Promise.race([
      operation(),
      timeoutPromise
    ]);
  } catch (error) {
    // Add context to the error
    throw captureErrorContext(operationName, error, context);
  } finally {
    // Clean up timeout
    clearTimeout(timeoutId!);
  }
}
