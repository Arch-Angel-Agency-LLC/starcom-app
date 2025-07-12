/**
 * NetRunner Error Handling Services
 * 
 * Centralized export for all error handling components including error classes,
 * factory methods, and error handler service.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

// Error classes and types
export {
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
} from './NetRunnerError';

export type {
  NetRunnerErrorType,
  NetRunnerErrorCode
} from './NetRunnerError';

// Error factory
export { ErrorFactory } from './ErrorFactory';

// Error handler service
export {
  NetRunnerErrorHandler,
  ErrorHandlingStrategy
} from './ErrorHandler';

export type {
  ErrorContext,
  ErrorHandlingResult,
  UserNotifier,
  RecoveryStrategy
} from './ErrorHandler';
