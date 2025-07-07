/**
 * Intel Report Error Handling Hook
 * 
 * React hook that provides comprehensive error handling for Intel Report operations.
 * Integrates with the centralized error service and provides UI-friendly error management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { intelReportErrorService } from '../services/IntelReportErrorService';
import { intelReportValidationService } from '../services/IntelReportValidationService';
import {
  IntelReportError,
  IntelReportErrorContext,
  IntelReportValidationResult,
  IntelReportRecoveryResult,
  IntelReportErrorMetrics,
  IntelReportUserAction,
} from '../types/IntelReportErrorTypes';
import { IntelReportData } from '../models/IntelReportData';

// =============================================================================
// HOOK INTERFACES
// =============================================================================

export interface UseIntelReportErrorHandlingOptions {
  enableAutoRecovery?: boolean;
  enableUserNotifications?: boolean;
  maxRecentErrors?: number;
  notificationDuration?: number;
  onError?: (error: IntelReportError) => void;
  onRecovery?: (result: IntelReportRecoveryResult) => void;
}

export interface IntelReportErrorNotification {
  id: string;
  error: IntelReportError;
  visible: boolean;
  dismissed: boolean;
  timestamp: Date;
  autoHide: boolean;
  actionTaken: boolean;
}

export interface UseIntelReportErrorHandlingReturn {
  // Error reporting
  reportError: (error: unknown, context?: Partial<IntelReportErrorContext>) => Promise<IntelReportError>;
  
  // Validation
  validateData: (data: Partial<IntelReportData>) => IntelReportValidationResult;
  validateField: (field: keyof IntelReportData, value: unknown) => IntelReportValidationResult;
  
  // Error recovery
  attemptRecovery: (errorId: string) => Promise<IntelReportRecoveryResult>;
  
  // Error management
  clearErrors: () => void;
  dismissError: (errorId: string) => void;
  resolveError: (errorId: string, resolution: string) => void;
  
  // User actions
  handleUserAction: (action: IntelReportUserAction, errorId: string) => Promise<void>;
  
  // State
  recentErrors: IntelReportError[];
  notifications: IntelReportErrorNotification[];
  hasErrors: boolean;
  isRecovering: boolean;
  errorMetrics: IntelReportErrorMetrics | null;
  
  // Error checks
  hasValidationErrors: boolean;
  hasNetworkErrors: boolean;
  hasAuthErrors: boolean;
  hasStorageErrors: boolean;
  hasBlockchainErrors: boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useIntelReportErrorHandling(
  options: UseIntelReportErrorHandlingOptions = {}
): UseIntelReportErrorHandlingReturn {
  const {
    enableUserNotifications = true,
    maxRecentErrors = 50,
    notificationDuration = 5000,
    onError,
    onRecovery,
  } = options;

  // State
  const [recentErrors, setRecentErrors] = useState<IntelReportError[]>([]);
  const [notifications, setNotifications] = useState<IntelReportErrorNotification[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [errorMetrics, setErrorMetrics] = useState<IntelReportErrorMetrics | null>(null);

  // Refs
  const errorListenerRef = useRef<((error: IntelReportError) => void) | null>(null);
  const notificationTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // =============================================================================
  // NOTIFICATION HELPERS
  // =============================================================================

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, visible: false, dismissed: true }
          : notif
      )
    );

    // Clear timeout
    const timeout = notificationTimeoutsRef.current.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      notificationTimeoutsRef.current.delete(notificationId);
    }
  }, []);

  // =============================================================================
  // ERROR REPORTING AND MANAGEMENT
  // =============================================================================

  const reportError = useCallback(
    async (error: unknown, context?: Partial<IntelReportErrorContext>): Promise<IntelReportError> => {
      const reportedError = await intelReportErrorService.reportError(error, context || {});
      
      // Update recent errors
      setRecentErrors(prev => {
        const updated = [...prev, reportedError];
        return updated.slice(-maxRecentErrors);
      });

      // Create notification if enabled
      if (enableUserNotifications) {
        const notification: IntelReportErrorNotification = {
          id: `notif-${reportedError.id}`,
          error: reportedError,
          visible: true,
          dismissed: false,
          timestamp: new Date(),
          autoHide: reportedError.severity === 'low' || reportedError.severity === 'medium',
          actionTaken: false,
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-hide notification after duration
        if (notification.autoHide) {
          const timeout = setTimeout(() => {
            dismissNotification(notification.id);
          }, notificationDuration);

          notificationTimeoutsRef.current.set(notification.id, timeout);
        }
      }

      // Call custom error handler
      if (onError) {
        onError(reportedError);
      }

      return reportedError;
    },
    [maxRecentErrors, enableUserNotifications, notificationDuration, onError, dismissNotification]
  );

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const validateData = useCallback((data: Partial<IntelReportData>): IntelReportValidationResult => {
    return intelReportValidationService.validateCreate(data);
  }, []);

  const validateField = useCallback(
    (field: keyof IntelReportData, value: unknown): IntelReportValidationResult => {
      return intelReportValidationService.validateField(field, value);
    },
    []
  );

  // =============================================================================
  // ERROR RECOVERY
  // =============================================================================

  const attemptRecovery = useCallback(
    async (errorId: string): Promise<IntelReportRecoveryResult> => {
      setIsRecovering(true);
      
      try {
        const result = await intelReportErrorService.attemptRecovery(errorId);
        
        if (result.success) {
          // Remove error from recent errors if recovery was successful
          setRecentErrors(prev => prev.filter(error => error.id !== errorId));
          
          // Dismiss related notifications
          setNotifications(prev => 
            prev.map(notif => 
              notif.error.id === errorId 
                ? { ...notif, visible: false, dismissed: true }
                : notif
            )
          );
        }

        // Call custom recovery handler
        if (onRecovery) {
          onRecovery(result);
        }

        return result;
      } finally {
        setIsRecovering(false);
      }
    },
    [onRecovery]
  );

  // =============================================================================
  // ERROR MANAGEMENT
  // =============================================================================

  const clearErrors = useCallback(() => {
    setRecentErrors([]);
    setNotifications([]);
    intelReportErrorService.clearErrorHistory();
    
    // Clear all notification timeouts
    notificationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    notificationTimeoutsRef.current.clear();
  }, []);

  const dismissError = useCallback((errorId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.error.id === errorId 
          ? { ...notif, visible: false, dismissed: true }
          : notif
      )
    );

    // Clear timeout if exists
    const notification = notifications.find(n => n.error.id === errorId);
    if (notification) {
      const timeout = notificationTimeoutsRef.current.get(notification.id);
      if (timeout) {
        clearTimeout(timeout);
        notificationTimeoutsRef.current.delete(notification.id);
      }
    }
  }, [notifications]);

  const resolveError = useCallback((errorId: string, resolution: string) => {
    intelReportErrorService.resolveError(errorId, resolution);
    
    // Update local state
    setRecentErrors(prev => 
      prev.map(error => 
        error.id === errorId 
          ? { ...error, resolved: true, resolvedAt: new Date(), resolution }
          : error
      )
    );

    // Dismiss related notifications
    dismissError(errorId);
  }, [dismissError]);

  // =============================================================================
  // USER ACTIONS
  // =============================================================================

  const handleUserAction = useCallback(
    async (action: IntelReportUserAction, errorId: string): Promise<void> => {
      const error = recentErrors.find(e => e.id === errorId);
      if (!error) return;

      // Mark notification as action taken
      setNotifications(prev => 
        prev.map(notif => 
          notif.error.id === errorId 
            ? { ...notif, actionTaken: true }
            : notif
        )
      );

      switch (action) {
        case 'retry':
          // Attempt to retry the original operation
          await attemptRecovery(errorId);
          break;

        case 'reconnect_wallet':
          // This would typically be handled by the wallet connection system
          // For now, we'll just mark the error as resolved
          resolveError(errorId, 'User initiated wallet reconnection');
          break;

        case 'check_connection':
          // This would typically be handled by the network layer
          resolveError(errorId, 'User checked connection');
          break;

        case 'reload_page':
          // This would typically reload the page
          window.location.reload();
          break;

        case 'contact_support':
          // This would typically open support interface
          resolveError(errorId, 'User contacted support');
          break;

        case 'update_data':
          // This would typically redirect to data update interface
          resolveError(errorId, 'User updated data');
          break;

        case 'wait_and_retry':
          // Wait for a period then retry
          setTimeout(() => {
            attemptRecovery(errorId);
          }, 5000);
          break;

        case 'switch_mode':
          // This would typically switch between online/offline modes
          resolveError(errorId, 'User switched mode');
          break;

        case 'none':
        default:
          // No action required
          break;
      }
    },
    [recentErrors, attemptRecovery, resolveError]
  );

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const hasErrors = recentErrors.length > 0;
  const hasValidationErrors = recentErrors.some(error => error.type === 'VALIDATION_ERROR');
  const hasNetworkErrors = recentErrors.some(error => error.type === 'NETWORK_ERROR');
  const hasAuthErrors = recentErrors.some(error => error.type === 'AUTHENTICATION_ERROR');
  const hasStorageErrors = recentErrors.some(error => error.type === 'STORAGE_ERROR');
  const hasBlockchainErrors = recentErrors.some(error => error.type === 'BLOCKCHAIN_ERROR');

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Set up error listener
  useEffect(() => {
    const handleError = (error: IntelReportError) => {
      setRecentErrors(prev => {
        const updated = [...prev, error];
        return updated.slice(-maxRecentErrors);
      });
    };

    intelReportErrorService.addEventListener(handleError);
    errorListenerRef.current = handleError;

    return () => {
      if (errorListenerRef.current) {
        intelReportErrorService.removeEventListener(errorListenerRef.current);
      }
    };
  }, [maxRecentErrors]);

  // Update error metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const metrics = intelReportErrorService.getErrorMetrics();
      setErrorMetrics(metrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = notificationTimeoutsRef.current;
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // Error reporting
    reportError,
    
    // Validation
    validateData,
    validateField,
    
    // Error recovery
    attemptRecovery,
    
    // Error management
    clearErrors,
    dismissError,
    resolveError,
    
    // User actions
    handleUserAction,
    
    // State
    recentErrors,
    notifications: notifications.filter(n => n.visible),
    hasErrors,
    isRecovering,
    errorMetrics,
    
    // Error checks
    hasValidationErrors,
    hasNetworkErrors,
    hasAuthErrors,
    hasStorageErrors,
    hasBlockchainErrors,
  };
}
