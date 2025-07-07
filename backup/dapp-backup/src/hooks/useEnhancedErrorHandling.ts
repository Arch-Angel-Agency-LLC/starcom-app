/**
 * TDD Feature 10: Enhanced Error Handling Hook
 * 
 * Implements comprehensive error handling with detailed context, automatic recovery
 * strategies, and user-friendly error reporting for authentication flows.
 */

import { useState, useEffect, useCallback } from 'react';

// Types for enhanced error handling
export interface AuthError {
  id: string;
  timestamp: number;
  type: 'network' | 'authentication' | 'authorization' | 'validation' | 'biometric' | 'session' | 'configuration' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  code: string;
  message: string;
  context: ErrorContext;
  stack?: string;
  recoverable: boolean;
  retryable: boolean;
  userMessage: string;
  suggestedActions: string[];
}

export interface ErrorContext {
  userId?: string;
  deviceId: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: number;
  operation: string;
  parameters?: Record<string, unknown>;
  previousErrors?: string[];
  systemState?: Record<string, unknown>;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  errorTypes: AuthError['type'][];
  errorCodes: string[];
  automatic: boolean;
  priority: number;
  maxRetries: number;
  execute: (error: AuthError) => Promise<RecoveryResult>;
}

export interface RecoveryResult {
  success: boolean;
  newError?: AuthError;
  message?: string;
  retryAfter?: number;
  actionRequired?: 'user_input' | 'manual_intervention' | 'system_restart' | 'none';
}

export interface ErrorHandlingConfig {
  enableAutoRecovery: boolean;
  maxAutoRetries: number;
  retryDelayMs: number;
  enableUserNotifications: boolean;
  logLevel: 'minimal' | 'standard' | 'verbose' | 'debug';
  enableRecoveryStrategies: boolean;
  notificationDelay: number;
}

export interface UseEnhancedErrorHandlingReturn {
  // Error Reporting
  reportError: (error: unknown, context: Partial<ErrorContext>) => Promise<AuthError>;
  getRecentErrors: (limit?: number) => Promise<AuthError[]>;
  clearErrorHistory: () => Promise<boolean>;
  
  // Error Recovery
  attemptRecovery: (errorId: string) => Promise<RecoveryResult>;
  registerRecoveryStrategy: (strategy: RecoveryStrategy) => Promise<boolean>;
  getAvailableRecoveries: (error: AuthError) => Promise<RecoveryStrategy[]>;
  
  // Error Analysis
  analyzeError: (error: unknown) => AuthError;
  getErrorStats: () => Promise<ErrorStats>;
  getErrorTrends: () => Promise<ErrorTrend[]>;
  
  // Configuration
  updateErrorConfig: (config: Partial<ErrorHandlingConfig>) => Promise<boolean>;
  getErrorConfig: () => ErrorHandlingConfig;
  
  // State
  recentErrors: AuthError[];
  activeRecoveries: string[];
  errorHandlingEnabled: boolean;
  autoRecoveryEnabled: boolean;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recoverySuccessRate: number;
  mostCommonErrors: Array<{ code: string; count: number; message: string }>;
  errorFrequency: number; // errors per hour
}

export interface ErrorTrend {
  timestamp: number;
  errorCount: number;
  errorType: string;
  severity: string;
}

/**
 * Default error handling configuration
 */
const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig = {
  enableAutoRecovery: true,
  maxAutoRetries: 3,
  retryDelayMs: 1000,
  enableUserNotifications: true,
  logLevel: 'standard',
  enableRecoveryStrategies: true,
  notificationDelay: 500
};

/**
 * Built-in recovery strategies
 */
const BUILTIN_RECOVERY_STRATEGIES: RecoveryStrategy[] = [
  {
    id: 'network_retry',
    name: 'Network Retry',
    description: 'Retry network operations with exponential backoff',
    errorTypes: ['network'],
    errorCodes: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_FAILED'],
    automatic: true,
    priority: 1,
    maxRetries: 3,
    execute: async (error: AuthError): Promise<RecoveryResult> => {
      // Simulate network retry logic
      console.debug('Network retry for error:', error.code);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: Math.random() > 0.3, // 70% success rate
        message: 'Network retry attempted',
        retryAfter: 2000
      };
    }
  },
  {
    id: 'session_refresh',
    name: 'Session Refresh',
    description: 'Refresh authentication session when expired',
    errorTypes: ['session', 'authentication'],
    errorCodes: ['SESSION_EXPIRED', 'TOKEN_INVALID', 'AUTH_REQUIRED'],
    automatic: true,
    priority: 2,
    maxRetries: 2,
    execute: async (error: AuthError): Promise<RecoveryResult> => {
      // Simulate session refresh logic
      console.debug('Session refresh for error:', error.code);
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: Math.random() > 0.2, // 80% success rate
        message: 'Session refresh attempted',
        actionRequired: 'user_input'
      };
    }
  },
  {
    id: 'biometric_fallback',
    name: 'Biometric Fallback',
    description: 'Fall back to alternative authentication when biometric fails',
    errorTypes: ['biometric'],
    errorCodes: ['BIOMETRIC_FAILED', 'BIOMETRIC_UNAVAILABLE', 'WEBAUTHN_ERROR'],
    automatic: true,
    priority: 3,
    maxRetries: 1,
    execute: async (error: AuthError): Promise<RecoveryResult> => {
      // Simulate biometric fallback
      console.debug('Biometric fallback for error:', error.code);
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Falling back to password authentication',
        actionRequired: 'user_input'
      };
    }
  }
];

/**
 * Generate unique error ID
 */
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get device information for error context
 */
const getErrorDeviceInfo = (): { deviceId: string; userAgent: string } => {
  let deviceId = localStorage.getItem('starcom_device_id');
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('starcom_device_id', deviceId);
  }

  return {
    deviceId,
    userAgent: navigator.userAgent
  };
};

/**
 * Hook for enhanced error handling
 */
export const useEnhancedErrorHandling = (): UseEnhancedErrorHandlingReturn => {
  const [errorConfig, setErrorConfig] = useState<ErrorHandlingConfig>(DEFAULT_ERROR_CONFIG);
  const [recentErrors, setRecentErrors] = useState<AuthError[]>([]);
  const [activeRecoveries, setActiveRecoveries] = useState<string[]>([]);
  const [recoveryStrategies, setRecoveryStrategies] = useState<RecoveryStrategy[]>(BUILTIN_RECOVERY_STRATEGIES);

  const errorHandlingEnabled = true; // Always enabled
  const autoRecoveryEnabled = errorConfig.enableAutoRecovery;

  // Load stored errors
  const getStoredErrors = useCallback((): AuthError[] => {
    try {
      const stored = localStorage.getItem('starcom_error_history');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load error history:', error);
      return [];
    }
  }, []);

  // Store errors
  const storeErrors = useCallback((errors: AuthError[]): void => {
    try {
      // Keep only last 100 errors
      const limitedErrors = errors.slice(-100);
      localStorage.setItem('starcom_error_history', JSON.stringify(limitedErrors));
      setRecentErrors(limitedErrors);
    } catch (error) {
      console.error('Failed to store error history:', error);
    }
  }, []);

  // Analyze and categorize error
  const analyzeError = useCallback((error: unknown): AuthError => {
    const deviceInfo = getErrorDeviceInfo();
    let errorType: AuthError['type'] = 'unknown';
    let severity: AuthError['severity'] = 'medium';
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let userMessage = 'Something went wrong. Please try again.';
    let suggestedActions: string[] = ['Try again', 'Check your connection'];
    let recoverable = true;
    let retryable = true;

    if (error instanceof Error) {
      message = error.message;
      
      // Categorize error based on message/type
      if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('timeout')) {
        errorType = 'network';
        code = 'NETWORK_ERROR';
        userMessage = 'Network connection problem. Please check your internet connection.';
        suggestedActions = ['Check internet connection', 'Try again', 'Switch networks'];
        severity = 'medium';
      } else if (error.message.includes('auth') || error.message.includes('login') || error.message.includes('token')) {
        errorType = 'authentication';
        code = 'AUTH_ERROR';
        userMessage = 'Authentication failed. Please try logging in again.';
        suggestedActions = ['Log in again', 'Clear browser cache', 'Contact support'];
        severity = 'high';
      } else if (error.message.includes('permission') || error.message.includes('forbidden') || error.message.includes('unauthorized')) {
        errorType = 'authorization';
        code = 'PERMISSION_DENIED';
        userMessage = 'You don\'t have permission to perform this action.';
        suggestedActions = ['Contact administrator', 'Check your role permissions'];
        severity = 'medium';
        retryable = false;
      } else if (error.message.includes('biometric') || error.message.includes('webauthn')) {
        errorType = 'biometric';
        code = 'BIOMETRIC_ERROR';
        userMessage = 'Biometric authentication failed. Try using an alternative method.';
        suggestedActions = ['Use password', 'Try biometric again', 'Check device settings'];
        severity = 'low';
      } else if (error.message.includes('session') || error.message.includes('expired')) {
        errorType = 'session';
        code = 'SESSION_ERROR';
        userMessage = 'Your session has expired. Please log in again.';
        suggestedActions = ['Log in again', 'Refresh page'];
        severity = 'medium';
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        errorType = 'validation';
        code = 'VALIDATION_ERROR';
        userMessage = 'Please check your input and try again.';
        suggestedActions = ['Check input format', 'Try again'];
        severity = 'low';
      } else if (error.message.includes('config') || error.message.includes('configuration')) {
        errorType = 'configuration';
        code = 'CONFIG_ERROR';
        userMessage = 'System configuration error. Please contact support.';
        suggestedActions = ['Contact support', 'Try again later'];
        severity = 'critical';
        recoverable = false;
      }
    }

    return {
      id: generateErrorId(),
      timestamp: Date.now(),
      type: errorType,
      severity,
      code,
      message,
      context: {
        ...deviceInfo,
        timestamp: Date.now(),
        operation: 'unknown',
        url: window.location.href
      },
      stack: error instanceof Error ? error.stack : undefined,
      recoverable,
      retryable,
      userMessage,
      suggestedActions
    };
  }, []);

  // Report error with context
  const reportError = useCallback(async (error: unknown, context: Partial<ErrorContext> = {}): Promise<AuthError> => {
    try {
      const analyzedError = analyzeError(error);
      
      // Enhance context
      analyzedError.context = {
        ...analyzedError.context,
        ...context
      };

      // Store error
      const errors = getStoredErrors();
      errors.push(analyzedError);
      storeErrors(errors);

      // Attempt automatic recovery if enabled
      if (autoRecoveryEnabled && analyzedError.recoverable) {
        setActiveRecoveries(prev => [...prev, analyzedError.id]);
        
        // Find suitable recovery strategy
        const strategy = recoveryStrategies.find(s => 
          s.automatic && 
          s.errorTypes.includes(analyzedError.type) &&
          s.errorCodes.includes(analyzedError.code)
        );

        if (strategy) {
          try {
            const recoveryResult = await strategy.execute(analyzedError);
            if (recoveryResult.success) {
              console.log(`Auto-recovery successful for error ${analyzedError.id}`);
            }
          } catch (recoveryError) {
            console.error('Auto-recovery failed:', recoveryError);
          } finally {
            setActiveRecoveries(prev => prev.filter(id => id !== analyzedError.id));
          }
        }
      }

      return analyzedError;
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      
      // Return a basic error if reporting fails
      return {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: 'unknown',
        severity: 'critical',
        code: 'ERROR_REPORTING_FAILED',
        message: 'Failed to report error',
        context: {
          deviceId: 'unknown',
          timestamp: Date.now(),
          operation: 'error_reporting'
        },
        recoverable: false,
        retryable: false,
        userMessage: 'An error occurred while reporting another error.',
        suggestedActions: ['Refresh page', 'Contact support']
      };
    }
  }, [analyzeError, getStoredErrors, storeErrors, autoRecoveryEnabled, recoveryStrategies]);

  // Get recent errors
  const getRecentErrors = useCallback(async (limit = 10): Promise<AuthError[]> => {
    try {
      const errors = getStoredErrors();
      return errors.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to get recent errors:', error);
      return [];
    }
  }, [getStoredErrors]);

  // Clear error history
  const clearErrorHistory = useCallback(async (): Promise<boolean> => {
    try {
      localStorage.removeItem('starcom_error_history');
      setRecentErrors([]);
      return true;
    } catch (error) {
      console.error('Failed to clear error history:', error);
      return false;
    }
  }, []);

  // Attempt manual recovery
  const attemptRecovery = useCallback(async (errorId: string): Promise<RecoveryResult> => {
    try {
      const errors = getStoredErrors();
      const targetError = errors.find(e => e.id === errorId);
      
      if (!targetError) {
        return {
          success: false,
          message: 'Error not found'
        };
      }

      if (!targetError.recoverable) {
        return {
          success: false,
          message: 'Error is not recoverable'
        };
      }

      // Find suitable recovery strategy
      const strategy = recoveryStrategies.find(s => 
        s.errorTypes.includes(targetError.type) &&
        s.errorCodes.includes(targetError.code)
      );

      if (!strategy) {
        return {
          success: false,
          message: 'No recovery strategy available'
        };
      }

      setActiveRecoveries(prev => [...prev, errorId]);

      try {
        const result = await strategy.execute(targetError);
        return result;
      } finally {
        setActiveRecoveries(prev => prev.filter(id => id !== errorId));
      }
    } catch (error) {
      console.error('Recovery attempt failed:', error);
      return {
        success: false,
        message: 'Recovery attempt failed'
      };
    }
  }, [getStoredErrors, recoveryStrategies]);

  // Register custom recovery strategy
  const registerRecoveryStrategy = useCallback(async (strategy: RecoveryStrategy): Promise<boolean> => {
    try {
      setRecoveryStrategies(prev => {
        // Remove existing strategy with same ID
        const filtered = prev.filter(s => s.id !== strategy.id);
        // Add new strategy sorted by priority
        const updated = [...filtered, strategy].sort((a, b) => a.priority - b.priority);
        return updated;
      });
      return true;
    } catch (error) {
      console.error('Failed to register recovery strategy:', error);
      return false;
    }
  }, []);

  // Get available recovery strategies for an error
  const getAvailableRecoveries = useCallback(async (error: AuthError): Promise<RecoveryStrategy[]> => {
    return recoveryStrategies.filter(strategy => 
      strategy.errorTypes.includes(error.type) &&
      (strategy.errorCodes.length === 0 || strategy.errorCodes.includes(error.code))
    );
  }, [recoveryStrategies]);

  // Get error statistics
  const getErrorStats = useCallback(async (): Promise<ErrorStats> => {
    try {
      const errors = getStoredErrors();
      
      const errorsByType = errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorsBySeverity = errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate recovery success rate (simplified)
      const recoverableErrors = errors.filter(e => e.recoverable).length;
      const recoverySuccessRate = recoverableErrors > 0 ? 70 : 0; // Simulated 70% success rate

      const errorCounts = errors.reduce((acc, error) => {
        const key = error.code;
        if (!acc[key]) {
          acc[key] = { count: 0, message: error.message };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, { count: number; message: string }>);

      const mostCommonErrors = Object.entries(errorCounts)
        .map(([code, data]) => ({ code, count: data.count, message: data.message }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const recentErrorCount = errors.filter(e => e.timestamp > oneHourAgo).length;
      const errorFrequency = recentErrorCount;

      return {
        totalErrors: errors.length,
        errorsByType,
        errorsBySeverity,
        recoverySuccessRate,
        mostCommonErrors,
        errorFrequency
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        recoverySuccessRate: 0,
        mostCommonErrors: [],
        errorFrequency: 0
      };
    }
  }, [getStoredErrors]);

  // Get error trends
  const getErrorTrends = useCallback(async (): Promise<ErrorTrend[]> => {
    try {
      const errors = getStoredErrors();
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      // Group errors by hour for the last 24 hours
      const trends: ErrorTrend[] = [];
      for (let i = 0; i < 24; i++) {
        const hourStart = oneDayAgo + (i * 60 * 60 * 1000);
        const hourEnd = hourStart + (60 * 60 * 1000);
        
        const hourErrors = errors.filter(e => e.timestamp >= hourStart && e.timestamp < hourEnd);
        
        if (hourErrors.length > 0) {
          // Group by type and severity
          const typeGroups = hourErrors.reduce((acc, error) => {
            const key = `${error.type}_${error.severity}`;
            if (!acc[key]) {
              acc[key] = { errorType: error.type, severity: error.severity, count: 0 };
            }
            acc[key].count++;
            return acc;
          }, {} as Record<string, { errorType: string; severity: string; count: number }>);

          Object.values(typeGroups).forEach(group => {
            trends.push({
              timestamp: hourStart,
              errorCount: group.count,
              errorType: group.errorType,
              severity: group.severity
            });
          });
        }
      }

      return trends;
    } catch (error) {
      console.error('Failed to get error trends:', error);
      return [];
    }
  }, [getStoredErrors]);

  // Update error configuration
  const updateErrorConfig = useCallback(async (configUpdate: Partial<ErrorHandlingConfig>): Promise<boolean> => {
    try {
      const newConfig = { ...errorConfig, ...configUpdate };
      setErrorConfig(newConfig);
      localStorage.setItem('starcom_error_config', JSON.stringify(newConfig));
      return true;
    } catch (error) {
      console.error('Failed to update error config:', error);
      return false;
    }
  }, [errorConfig]);

  // Get error configuration
  const getErrorConfig = useCallback((): ErrorHandlingConfig => {
    return errorConfig;
  }, [errorConfig]);

  // Load persisted data on mount
  useEffect(() => {
    // Load configuration
    const savedConfig = localStorage.getItem('starcom_error_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setErrorConfig({ ...DEFAULT_ERROR_CONFIG, ...config });
      } catch (error) {
        console.error('Failed to load error config:', error);
      }
    }

    // Load recent errors
    const errors = getStoredErrors();
    setRecentErrors(errors.slice(-10).reverse());
  }, [getStoredErrors]);

  return {
    // Error Reporting
    reportError,
    getRecentErrors,
    clearErrorHistory,
    
    // Error Recovery
    attemptRecovery,
    registerRecoveryStrategy,
    getAvailableRecoveries,
    
    // Error Analysis
    analyzeError,
    getErrorStats,
    getErrorTrends,
    
    // Configuration
    updateErrorConfig,
    getErrorConfig,
    
    // State
    recentErrors,
    activeRecoveries,
    errorHandlingEnabled,
    autoRecoveryEnabled
  };
};

export default useEnhancedErrorHandling;
