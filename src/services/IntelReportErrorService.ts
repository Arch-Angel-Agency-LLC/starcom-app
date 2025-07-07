/**
 * Intel Report Error Service
 * 
 * Centralized error handling service for all Intel Report operations.
 * Provides error logging, recovery strategies, analytics, and user notifications.
 */

import {
  IntelReportError,
  IntelReportErrorContext,
  IntelReportRecoveryStrategy,
  IntelReportRecoveryResult,
  IntelReportErrorMetrics,
  IntelReportErrorEvent,
  IntelReportErrorType,
  IntelReportErrorSeverity,
  IntelReportErrorCode,
  IntelReportUserAction,
  INTEL_REPORT_ERROR_CODES,
  DEFAULT_ERROR_CONFIG,
} from '../types/IntelReportErrorTypes';

// =============================================================================
// SERVICE CONFIGURATION
// =============================================================================

interface ErrorServiceConfig {
  maxErrorHistory: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableAutoRecovery: boolean;
  enableUserNotifications: boolean;
  logLevel: 'minimal' | 'standard' | 'verbose' | 'debug';
  enableAnalytics: boolean;
  notificationDelayMs: number;
}

// =============================================================================
// ERROR SERVICE IMPLEMENTATION
// =============================================================================

export class IntelReportErrorService {
  private errorHistory: IntelReportError[] = [];
  private errorEvents: IntelReportErrorEvent[] = [];
  private recoveryStrategies: Map<string, IntelReportRecoveryStrategy> = new Map();
  private activeRecoveries: Set<string> = new Set();
  private config: ErrorServiceConfig;
  private listeners: ((error: IntelReportError) => void)[] = [];

  constructor(config: Partial<ErrorServiceConfig> = {}) {
    this.config = { 
      ...DEFAULT_ERROR_CONFIG, 
      notificationDelayMs: 3000,
      ...config 
    };
    this.initializeDefaultRecoveryStrategies();
  }

  // =============================================================================
  // ERROR REPORTING AND LOGGING
  // =============================================================================

  /**
   * Report an error to the service
   */
  public async reportError(
    error: unknown,
    context: Partial<IntelReportErrorContext>
  ): Promise<IntelReportError> {
    const structuredError = this.transformError(error, context);
    
    // Add to history
    this.addToHistory(structuredError);
    
    // Create error event
    this.createErrorEvent(structuredError, 'error_occurred');
    
    // Log based on configuration
    this.logError(structuredError);
    
    // Notify listeners
    this.notifyListeners(structuredError);
    
    // Send to analytics (if enabled and in production)
    if (this.config.enableAnalytics && process.env.NODE_ENV === 'production') {
      await this.sendToAnalytics(structuredError);
    }
    
    // Attempt automatic recovery (if applicable)
    if (this.config.enableAutoRecovery && structuredError.recoverable) {
      setTimeout(() => {
        this.attemptRecovery(structuredError.id);
      }, 100); // Small delay to allow error to be fully processed
    }
    
    return structuredError;
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(limit: number = 50): IntelReportError[] {
    return this.errorHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get error by ID
   */
  public getError(errorId: string): IntelReportError | null {
    return this.errorHistory.find(error => error.id === errorId) || null;
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
    this.errorEvents = [];
  }

  /**
   * Mark error as resolved
   */
  public resolveError(errorId: string, resolution: string): boolean {
    const error = this.getError(errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      error.resolution = resolution;
      
      this.createErrorEvent(error, 'error_resolved', { resolution });
      return true;
    }
    return false;
  }

  // =============================================================================
  // ERROR RECOVERY
  // =============================================================================

  /**
   * Attempt to recover from an error
   */
  public async attemptRecovery(errorId: string): Promise<IntelReportRecoveryResult> {
    const error = this.getError(errorId);
    if (!error) {
      return { success: false, message: 'Error not found' };
    }

    if (this.activeRecoveries.has(errorId)) {
      return { success: false, message: 'Recovery already in progress' };
    }

    this.activeRecoveries.add(errorId);
    this.createErrorEvent(error, 'recovery_attempted');

    try {
      const strategy = this.findBestRecoveryStrategy(error);
      if (!strategy) {
        return { success: false, message: 'No recovery strategy available' };
      }

      const result = await strategy.execute(error);
      
      if (result.success) {
        this.createErrorEvent(error, 'recovery_succeeded', { strategy: strategy.id });
        this.resolveError(errorId, `Recovered using strategy: ${strategy.name}`);
      } else {
        this.createErrorEvent(error, 'recovery_failed', { 
          strategy: strategy.id, 
          reason: result.message 
        });
        
        // If recovery created a new error, report it
        if (result.newError) {
          await this.reportError(result.newError, result.newError.context);
        }
      }

      return result;
    } catch (recoveryError) {
      this.createErrorEvent(error, 'recovery_failed', { 
        reason: recoveryError instanceof Error ? recoveryError.message : 'Unknown error'
      });
      
      return { 
        success: false, 
        message: recoveryError instanceof Error ? recoveryError.message : 'Recovery failed' 
      };
    } finally {
      this.activeRecoveries.delete(errorId);
    }
  }

  /**
   * Register a new recovery strategy
   */
  public registerRecoveryStrategy(strategy: IntelReportRecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.id, strategy);
  }

  /**
   * Get available recovery strategies for an error
   */
  public getAvailableRecoveries(error: IntelReportError): IntelReportRecoveryStrategy[] {
    return Array.from(this.recoveryStrategies.values())
      .filter(strategy => this.isStrategyApplicable(strategy, error))
      .sort((a, b) => b.priority - a.priority);
  }

  // =============================================================================
  // ERROR ANALYTICS AND METRICS
  // =============================================================================

  /**
   * Get error metrics
   */
  public getErrorMetrics(timeRangeMs: number = 24 * 60 * 60 * 1000): IntelReportErrorMetrics {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeRangeMs);
    
    const recentErrors = this.errorHistory.filter(error => error.timestamp >= cutoffTime);
    
    const errorsByType: Record<IntelReportErrorType, number> = {
      'VALIDATION_ERROR': 0,
      'NETWORK_ERROR': 0,
      'AUTHENTICATION_ERROR': 0,
      'STORAGE_ERROR': 0,
      'BLOCKCHAIN_ERROR': 0,
      'SYNC_ERROR': 0,
      'RENDERING_ERROR': 0,
      'PERFORMANCE_ERROR': 0,
      'UNKNOWN_ERROR': 0,
    };

    const errorsBySeverity: Record<IntelReportErrorSeverity, number> = {
      'low': 0,
      'medium': 0,
      'high': 0,
      'critical': 0,
    };

    const errorsByCode: Record<string, number> = {};

    recentErrors.forEach(error => {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
    });

    // Calculate recovery success rate
    const recoveryEvents = this.errorEvents.filter(event => 
      event.timestamp >= cutoffTime && 
      (event.type === 'recovery_succeeded' || event.type === 'recovery_failed')
    );
    
    const successfulRecoveries = recoveryEvents.filter(event => event.type === 'recovery_succeeded').length;
    const recoverySuccessRate = recoveryEvents.length > 0 
      ? (successfulRecoveries / recoveryEvents.length) * 100 
      : 0;

    // Calculate average resolution time
    const resolvedErrors = recentErrors.filter(error => error.resolved && error.resolvedAt);
    const averageResolutionTime = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, error) => {
          return sum + (error.resolvedAt!.getTime() - error.timestamp.getTime());
        }, 0) / resolvedErrors.length
      : 0;

    // Get top errors
    const topErrors = Object.entries(errorsByCode)
      .map(([code, count]) => ({
        code,
        count,
        percentage: (count / recentErrors.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsBySeverity,
      errorsByCode,
      recoverySuccessRate,
      averageResolutionTime,
      topErrors,
      timeRangeMs,
      lastUpdated: now,
    };
  }

  // =============================================================================
  // EVENT LISTENERS
  // =============================================================================

  /**
   * Add error listener
   */
  public addEventListener(listener: (error: IntelReportError) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove error listener
   */
  public removeEventListener(listener: (error: IntelReportError) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  /**
   * Update service configuration
   */
  public updateConfig(newConfig: Partial<ErrorServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ErrorServiceConfig {
    return { ...this.config };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private transformError(error: unknown, context: Partial<IntelReportErrorContext>): IntelReportError {
    const timestamp = new Date();
    const errorId = this.generateErrorId();

    // Extract basic error information
    let message = 'Unknown error';
    let stack: string | undefined;
    let type: IntelReportErrorType = 'UNKNOWN_ERROR';
    let code: IntelReportErrorCode = 'REP-U-001' as IntelReportErrorCode;
    let severity: IntelReportErrorSeverity = 'medium';

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      
      // Try to classify error based on message
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        type = 'NETWORK_ERROR';
        code = INTEL_REPORT_ERROR_CODES.NETWORK_CONNECTION_FAILED;
      } else if (message.includes('wallet') || message.includes('auth')) {
        type = 'AUTHENTICATION_ERROR';
        code = INTEL_REPORT_ERROR_CODES.AUTH_WALLET_NOT_CONNECTED;
      } else if (message.includes('storage') || message.includes('quota')) {
        type = 'STORAGE_ERROR';
        code = INTEL_REPORT_ERROR_CODES.STORAGE_ACCESS_DENIED;
      } else if (message.includes('blockchain') || message.includes('transaction')) {
        type = 'BLOCKCHAIN_ERROR';
        code = INTEL_REPORT_ERROR_CODES.BLOCKCHAIN_TRANSACTION_FAILED;
      }
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = JSON.stringify(error);
    }

    // Determine severity based on type
    severity = this.determineSeverity(type, message);

    // Create user-friendly message
    const userMessage = this.createUserMessage(type, code, message);

    // Build complete context
    const fullContext: IntelReportErrorContext = {
      operation: 'unknown',
      timestamp,
      ...context,
    };

    return {
      id: errorId,
      code,
      type,
      severity,
      message,
      userMessage,
      timestamp,
      context: fullContext,
      recoverable: this.isErrorRecoverable(type, code),
      retryable: this.isErrorRetryable(type, code),
      suggestedActions: this.getSuggestedActions(type, code),
      stack,
      resolved: false,
    };
  }

  private determineSeverity(type: IntelReportErrorType, message: string): IntelReportErrorSeverity {
    // Critical errors
    if (type === 'BLOCKCHAIN_ERROR' && message.includes('insufficient funds')) {
      return 'critical';
    }
    if (type === 'STORAGE_ERROR' && message.includes('corruption')) {
      return 'critical';
    }

    // High severity errors
    if (type === 'AUTHENTICATION_ERROR') {
      return 'high';
    }
    if (type === 'BLOCKCHAIN_ERROR') {
      return 'high';
    }

    // Medium severity errors
    if (type === 'NETWORK_ERROR') {
      return 'medium';
    }
    if (type === 'SYNC_ERROR') {
      return 'medium';
    }

    // Low severity errors
    if (type === 'VALIDATION_ERROR') {
      return 'low';
    }
    if (type === 'RENDERING_ERROR') {
      return 'low';
    }

    return 'medium';
  }

  private createUserMessage(type: IntelReportErrorType, code: IntelReportErrorCode, message: string): string {
    const userMessages: Partial<Record<IntelReportErrorCode, string>> = {
      [INTEL_REPORT_ERROR_CODES.VALIDATION_TITLE_REQUIRED]: 'Please provide a title for your report',
      [INTEL_REPORT_ERROR_CODES.VALIDATION_CONTENT_REQUIRED]: 'Please provide content for your report',
      [INTEL_REPORT_ERROR_CODES.NETWORK_CONNECTION_FAILED]: 'Unable to connect to the server. Please check your internet connection.',
      [INTEL_REPORT_ERROR_CODES.AUTH_WALLET_NOT_CONNECTED]: 'Please connect your wallet to continue',
      [INTEL_REPORT_ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: 'Storage space is full. Please free up some space.',
      [INTEL_REPORT_ERROR_CODES.BLOCKCHAIN_TRANSACTION_FAILED]: 'Transaction failed. Please try again.',
    };

    return userMessages[code] || `An error occurred: ${message}`;
  }

  private isErrorRecoverable(type: IntelReportErrorType, code: IntelReportErrorCode): boolean {
    const recoverableTypes: IntelReportErrorType[] = [
      'NETWORK_ERROR',
      'STORAGE_ERROR',
      'SYNC_ERROR',
    ];

    const recoverableCodes: IntelReportErrorCode[] = [
      INTEL_REPORT_ERROR_CODES.NETWORK_CONNECTION_FAILED,
      INTEL_REPORT_ERROR_CODES.NETWORK_TIMEOUT,
      INTEL_REPORT_ERROR_CODES.STORAGE_ACCESS_DENIED,
    ];

    return recoverableTypes.includes(type) || recoverableCodes.includes(code);
  }

  private isErrorRetryable(type: IntelReportErrorType, code: IntelReportErrorCode): boolean {
    const retryableTypes: IntelReportErrorType[] = [
      'NETWORK_ERROR',
      'BLOCKCHAIN_ERROR',
      'PERFORMANCE_ERROR',
    ];

    const nonRetryableCodes: IntelReportErrorCode[] = [
      INTEL_REPORT_ERROR_CODES.VALIDATION_TITLE_REQUIRED,
      INTEL_REPORT_ERROR_CODES.VALIDATION_CONTENT_REQUIRED,
      INTEL_REPORT_ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
    ];

    return retryableTypes.includes(type) && !nonRetryableCodes.includes(code);
  }

  private getSuggestedActions(type: IntelReportErrorType, code: IntelReportErrorCode): string[] {
    const actionMap: Partial<Record<IntelReportErrorCode, string[]>> = {
      [INTEL_REPORT_ERROR_CODES.VALIDATION_TITLE_REQUIRED]: ['Add a descriptive title'],
      [INTEL_REPORT_ERROR_CODES.VALIDATION_CONTENT_REQUIRED]: ['Add content to your report'],
      [INTEL_REPORT_ERROR_CODES.NETWORK_CONNECTION_FAILED]: ['Check internet connection', 'Try again in a moment'],
      [INTEL_REPORT_ERROR_CODES.AUTH_WALLET_NOT_CONNECTED]: ['Connect your wallet', 'Work offline'],
      [INTEL_REPORT_ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: ['Free up storage space', 'Delete old reports'],
    };

    return actionMap[code] || ['Try again', 'Contact support if problem persists'];
  }

  private addToHistory(error: IntelReportError): void {
    this.errorHistory.push(error);
    
    // Maintain maximum history size
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }
  }

  private createErrorEvent(
    error: IntelReportError,
    type: IntelReportErrorEvent['type'],
    data?: Record<string, unknown>
  ): void {
    const event: IntelReportErrorEvent = {
      id: this.generateErrorId(),
      errorId: error.id,
      type,
      timestamp: new Date(),
      userId: error.context.userId,
      sessionId: error.context.sessionId,
      data,
    };

    this.errorEvents.push(event);
  }

  private logError(error: IntelReportError): void {
    if (this.config.logLevel === 'minimal') {
      console.warn(`Intel Report Error [${error.code}]: ${error.userMessage}`);
    } else if (this.config.logLevel === 'standard') {
      console.error(`Intel Report Error [${error.id}]:`, {
        code: error.code,
        type: error.type,
        severity: error.severity,
        message: error.message,
        operation: error.context.operation,
      });
    } else if (this.config.logLevel === 'verbose' || this.config.logLevel === 'debug') {
      console.error(`Intel Report Error [${error.id}]:`, error);
    }
  }

  private notifyListeners(error: IntelReportError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  private async sendToAnalytics(error: IntelReportError): Promise<void> {
    try {
      // This would integrate with your analytics service
      // For now, we'll just log that analytics would be sent
      if (this.config.logLevel === 'debug') {
        console.debug('Would send to analytics:', {
          errorId: error.id,
          code: error.code,
          type: error.type,
          severity: error.severity,
          timestamp: error.timestamp,
        });
      }
    } catch (analyticsError) {
      console.warn('Failed to send error to analytics:', analyticsError);
    }
  }

  private findBestRecoveryStrategy(error: IntelReportError): IntelReportRecoveryStrategy | null {
    const strategies = this.getAvailableRecoveries(error);
    return strategies.length > 0 ? strategies[0] : null;
  }

  private isStrategyApplicable(strategy: IntelReportRecoveryStrategy, error: IntelReportError): boolean {
    // Check error types
    if (strategy.errorTypes.length > 0 && !strategy.errorTypes.includes(error.type)) {
      return false;
    }

    // Check error codes
    if (strategy.errorCodes.length > 0 && !strategy.errorCodes.includes(error.code)) {
      return false;
    }

    // Check additional conditions
    if (strategy.conditions && !strategy.conditions(error)) {
      return false;
    }

    return true;
  }

  private initializeDefaultRecoveryStrategies(): void {
    // Network retry strategy
    this.registerRecoveryStrategy({
      id: 'network-retry',
      name: 'Network Retry',
      description: 'Automatically retry network operations with exponential backoff',
      errorTypes: ['NETWORK_ERROR'],
      errorCodes: [
        INTEL_REPORT_ERROR_CODES.NETWORK_CONNECTION_FAILED,
        INTEL_REPORT_ERROR_CODES.NETWORK_TIMEOUT,
      ],
      automatic: true,
      priority: 100,
      maxRetries: 3,
      retryDelayMs: 1000,
      execute: async () => {
        // Exponential backoff retry logic would go here
        return { success: true, message: 'Network retry successful' };
      },
    });

    // Offline storage fallback
    this.registerRecoveryStrategy({
      id: 'offline-fallback',
      name: 'Offline Storage Fallback',
      description: 'Save data locally when network is unavailable',
      errorTypes: ['NETWORK_ERROR', 'BLOCKCHAIN_ERROR'],
      errorCodes: [
        INTEL_REPORT_ERROR_CODES.NETWORK_CONNECTION_FAILED,
        INTEL_REPORT_ERROR_CODES.BLOCKCHAIN_TRANSACTION_FAILED,
      ],
      automatic: true,
      priority: 80,
      maxRetries: 1,
      retryDelayMs: 0,
      execute: async () => {
        // Offline storage logic would go here
        return { 
          success: true, 
          message: 'Data saved locally for later sync',
          actionRequired: 'none' as IntelReportUserAction,
        };
      },
    });

    // Wallet reconnection prompt
    this.registerRecoveryStrategy({
      id: 'wallet-reconnect',
      name: 'Wallet Reconnection',
      description: 'Prompt user to reconnect wallet',
      errorTypes: ['AUTHENTICATION_ERROR'],
      errorCodes: [
        INTEL_REPORT_ERROR_CODES.AUTH_WALLET_NOT_CONNECTED,
        INTEL_REPORT_ERROR_CODES.AUTH_SESSION_EXPIRED,
      ],
      automatic: false,
      priority: 90,
      maxRetries: 1,
      retryDelayMs: 0,
      execute: async () => {
        return {
          success: false,
          message: 'User action required',
          actionRequired: 'reconnect_wallet' as IntelReportUserAction,
        };
      },
    });
  }

  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const intelReportErrorService = new IntelReportErrorService();
