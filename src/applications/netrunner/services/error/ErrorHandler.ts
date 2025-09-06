/**
 * NetRunner Error Handler Service
 * 
 * Centralized error handling service for the NetRunner application that provides
 * standardized error processing, user notification, and recovery mechanisms.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { NetRunnerError, NetRunnerErrorCategory } from './NetRunnerError';
import { Logger, LoggerFactory } from '../logging/NetRunnerLogger';

/**
 * Error handling strategy
 */
export enum ErrorHandlingStrategy {
  LOG_ONLY = 'log_only',           // Just log the error
  LOG_AND_NOTIFY = 'log_and_notify', // Log and show user notification
  LOG_AND_RETRY = 'log_and_retry',   // Log and attempt recovery
  ESCALATE = 'escalate'              // Escalate to higher level handler
}

/**
 * Error handling context
 */
export interface ErrorContext {
  operation: string;
  component: string;
  user?: string;
  correlationId?: string;
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult {
  handled: boolean;
  strategy: ErrorHandlingStrategy;
  userMessage?: string;
  shouldRetry: boolean;
  retryDelay?: number;
  escalated: boolean;
  recoveryAttempted: boolean;
}

/**
 * User notification interface
 */
export interface UserNotifier {
  showError(message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void;
  showWarning(message: string): void;
  showInfo(message: string): void;
}

/**
 * Recovery strategy interface
 */
export interface RecoveryStrategy {
  canRecover(error: NetRunnerError, context: ErrorContext): boolean;
  recover(error: NetRunnerError, context: ErrorContext): Promise<boolean>;
}

/**
 * NetRunner Error Handler
 * 
 * Centralized error handling service that processes NetRunner errors according
 * to their type, severity, and context, providing appropriate recovery and
 * user notification strategies.
 */
export class NetRunnerErrorHandler {
  private logger: Logger;
  private userNotifier?: UserNotifier;
  private recoveryStrategies: Map<NetRunnerErrorCategory, RecoveryStrategy[]>;

  constructor(userNotifier?: UserNotifier) {
    this.logger = LoggerFactory.getLogger('NetRunner:ErrorHandler');
    this.userNotifier = userNotifier;
    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies();
  }

  /**
   * Handle a NetRunner error
   */
  async handleError(error: NetRunnerError | Error, context: ErrorContext): Promise<ErrorHandlingResult> {
    if (!(error instanceof NetRunnerError)) {
      return this.handleGenericError(error, context);
    }
    // Set correlation ID for logging
    if (context.correlationId) {
      this.logger.setCorrelationId(context.correlationId);
    }

    // Log the error
    this.logError(error, context);

    // Determine handling strategy
    const strategy = this.determineHandlingStrategy(error, context);

    // Execute the strategy
  const result = await this.executeStrategy(error, context, strategy);

    // Log the result
    this.logger.debug('Error handling completed', {
      strategy: result.strategy,
      handled: result.handled,
      shouldRetry: result.shouldRetry
    });

    return result;
  }

  /**
   * Handle a generic error (convert to NetRunnerError first)
   */
  async handleGenericError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult> {
    // Convert to NetRunnerError if it's not already
    const netRunnerError = error instanceof NetRunnerError 
      ? error 
      : this.convertToNetRunnerError(error, context);

    return this.handleError(netRunnerError, context);
  }

  /**
   * Register a recovery strategy for a specific error category
   */
  registerRecoveryStrategy(category: NetRunnerErrorCategory, strategy: RecoveryStrategy): void {
    if (!this.recoveryStrategies.has(category)) {
      this.recoveryStrategies.set(category, []);
    }
    this.recoveryStrategies.get(category)!.push(strategy);
  }

  /**
   * Set user notifier
   */
  setUserNotifier(notifier: UserNotifier): void {
    this.userNotifier = notifier;
  }

  /**
   * Log the error with appropriate detail
   */
  private logError(error: NetRunnerError, context: ErrorContext): void {
    const logData = {
      ...error.toErrorObject(),
      context: {
        operation: context.operation,
        component: context.component,
        user: context.user,
        retryCount: context.retryCount,
        maxRetries: context.maxRetries,
        ...context.metadata
      }
    };

    switch (error.severity) {
      case 'critical':
        this.logger.critical(error.message, error.cause, logData);
        break;
      case 'high':
        this.logger.error(error.message, error.cause, logData);
        break;
      case 'medium':
        this.logger.warn(error.message, logData);
        break;
      case 'low':
        this.logger.info(error.message, logData);
        break;
    }
  }

  // Utility helpers for tests/consumers
  public getErrorSeverity(error: NetRunnerError): 'low' | 'medium' | 'high' | 'critical' {
    return error.severity;
  }

  public getRecoveryStrategies(error: NetRunnerError): RecoveryStrategy[] {
    return this.recoveryStrategies.get(error.category) || [];
  }

  public formatUserMessage(error: NetRunnerError): string {
    return error.getUserMessage();
  }

  /**
   * Determine the appropriate handling strategy
   */
  private determineHandlingStrategy(error: NetRunnerError, context: ErrorContext): ErrorHandlingStrategy {
    // Critical errors should be escalated
    if (error.severity === 'critical') {
      return ErrorHandlingStrategy.ESCALATE;
    }

    // Recoverable errors should attempt recovery by default
    if (error.isRecoverable()) {
      return ErrorHandlingStrategy.LOG_AND_RETRY;
    }

    // High severity errors should notify user
    if (error.severity === 'high') {
      return ErrorHandlingStrategy.LOG_AND_NOTIFY;
    }

    // Medium severity errors should notify user if they affect user operations
    if (error.severity === 'medium' && this.isUserFacingOperation(context.operation)) {
      return ErrorHandlingStrategy.LOG_AND_NOTIFY;
    }

    // Default to just logging
    return ErrorHandlingStrategy.LOG_ONLY;
  }

  /**
   * Execute the chosen error handling strategy
   */
  private async executeStrategy(
    error: NetRunnerError, 
    context: ErrorContext, 
    strategy: ErrorHandlingStrategy
  ): Promise<ErrorHandlingResult> {
    const result: ErrorHandlingResult = {
      handled: false,
      strategy,
      shouldRetry: false,
      escalated: false,
      recoveryAttempted: false
    };

    switch (strategy) {
      case ErrorHandlingStrategy.LOG_ONLY:
        result.handled = true;
        break;

      case ErrorHandlingStrategy.LOG_AND_NOTIFY:
        this.notifyUser(error);
        result.handled = true;
        result.userMessage = error.getUserMessage();
        break;

      case ErrorHandlingStrategy.LOG_AND_RETRY: {
  const recovered = await this.attemptRecovery(error, context);
        result.handled = recovered;
        result.shouldRetry = !recovered;
        result.retryDelay = this.calculateRetryDelay(context.retryCount || 0);
  result.recoveryAttempted = true;
        break;
      }

      case ErrorHandlingStrategy.ESCALATE:
        result.escalated = true;
        result.handled = false;
        this.escalateError(error, context);
        break;
    }

    return result;
  }

  /**
   * Attempt to recover from the error
   */
  private async attemptRecovery(error: NetRunnerError, context: ErrorContext): Promise<boolean> {
    const strategies = this.recoveryStrategies.get(error.category) || [];
    
    for (const strategy of strategies) {
      if (strategy.canRecover(error, context)) {
        try {
          const recovered = await strategy.recover(error, context);
          if (recovered) {
            this.logger.info('Error recovery successful', {
              strategyName: strategy.constructor.name
            });
            return true;
          }
        } catch (recoveryError) {
          this.logger.warn('Error recovery failed', {
            strategyName: strategy.constructor.name,
            recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
          });
        }
      }
    }

    return false;
  }

  /**
   * Notify the user about the error
   */
  private notifyUser(error: NetRunnerError): void {
    if (!this.userNotifier) {
      this.logger.warn('No user notifier available for error notification');
      return;
    }

    const message = error.getUserMessage();
    this.userNotifier.showError(message, error.severity);
  }

  /**
   * Escalate the error to a higher level handler
   */
  private escalateError(netRunnerError: NetRunnerError, context: ErrorContext): void {
    this.logger.critical(`Error escalated: ${netRunnerError.code} in operation ${context.operation} at component ${context.component}`);

    // TODO: Implement escalation mechanism (e.g., send to monitoring system, alert admins)
  }

  /**
   * Convert a generic error to a NetRunnerError
   */
  private convertToNetRunnerError(error: Error, context: ErrorContext): NetRunnerError {
    return new NetRunnerError(error.message, {
      type: 'INTEGRATION_ERROR',
      code: 'NET-INTG-004' as const, // Generic integration error
      category: NetRunnerErrorCategory.INTEGRATION,
      component: context.component,
      severity: 'medium',
      cause: error,
      correlationId: context.correlationId
    });
  }

  /**
   * Check if the operation is user-facing
   */
  private isUserFacingOperation(operation: string): boolean {
    const userFacingOperations = [
      'search',
      'tool_execution',
      'workflow_execution',
      'bot_operation',
      'export',
      'import'
    ];
    
    return userFacingOperations.some(op => operation.toLowerCase().includes(op));
  }

  /**
   * Calculate retry delay based on attempt count
   */
  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
    return Math.min(1000 * Math.pow(2, retryCount), 16000);
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // Tool recovery strategy
    this.registerRecoveryStrategy(NetRunnerErrorCategory.TOOL, {
      canRecover: (error) => error.code.includes('TIMEOUT') || error.code.includes('PARAMETER'),
      recover: async () => {
        // Implement tool-specific recovery logic
        return false; // Placeholder
      }
    });

    // Adapter recovery strategy
    this.registerRecoveryStrategy(NetRunnerErrorCategory.ADAPTER, {
      canRecover: (error) => error.code.includes('API_ERROR') || error.code.includes('RATE_LIMITED'),
      recover: async () => {
        // Implement adapter-specific recovery logic
        return false; // Placeholder
      }
    });

    // Search recovery strategy
    this.registerRecoveryStrategy(NetRunnerErrorCategory.SEARCH, {
      canRecover: (error) => error.code.includes('TIMEOUT') || error.code.includes('NO_RESULTS'),
      recover: async () => {
        // Implement search-specific recovery logic
        return false; // Placeholder
      }
    });
  }
}
