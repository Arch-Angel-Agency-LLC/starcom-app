/**
 * useOPSECSecurity Hook
 * 
 * React hook for operational security in the OSINT module.
 * Provides functionality for securing connections, prote  const getConnectionStatus = useCallback(async () => {
    setOperationLoading('getConnectionStatus', true);
    
    try {
      const status = await opsecService.getConnectionStatus();
      setConnectionStatus(status);
      clearError();
      return status;
    } catch (error) {
      // Handle error with context
      handleError(error, 'getConnectionStatus');
      return null;
    } finally {
      setOperationLoading('getConnectionStatus', false);
    }
  }, [clearError, handleError, setOperationLoading]); * and monitoring for security threats.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  opsecService, 
  ConnectionStatus, 
  SecurityAlert,
  ThreatScanResult,
  SecurityCheck,
  RoutingMethod,
  SecurityLevel
} from '../services/opsec/opsecService';
import { ErrorDetail, ErrorUtils, createErrorDetail } from '../types/errors';

/**
 * OPSEC security hook for OSINT module
 */
export function useOPSECSecurity() {
  // State for connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  
  // State for security level
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('enhanced');
  
  // State for routing method
  const [routingMethod, setRoutingMethod] = useState<RoutingMethod>('vpn');
  
  // State for fingerprint protection
  const [fingerprintProtection, setFingerprintProtection] = useState<boolean>(true);
  
  // State for security alerts
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  
  // State for threat scan results
  const [threatScanResult, setThreatScanResult] = useState<ThreatScanResult | null>(null);
  
  // State for security checks
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  
  // State for loading status (with operation context)
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set());
  
  // Computed loading state from loadingOperations
  const isLoading = loadingOperations.size > 0;
  
  // State for errors with detailed information
  const [error, setError] = useState<ErrorDetail | null>(null);
  
  // Reference to track retry attempts
  const retryAttemptsRef = useRef<Record<string, number>>({});

  // Maximum retry attempts
  const MAX_RETRIES = 3;
  
  // Helper to set loading state for an operation
  const setOperationLoading = useCallback((operation: string, isLoading: boolean) => {
    setLoadingOperations(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(operation);
      } else {
        newSet.delete(operation);
      }
      return newSet;
    });
  }, []);
  
  // Helper function to create detailed error
  const handleError = useCallback((error: unknown, operation: string): ErrorDetail => {
    // Get current retry count
    const retryCount = retryAttemptsRef.current[operation] || 0;
    retryAttemptsRef.current[operation] = retryCount + 1;
    
    // Create error detail
    const errorDetail = createErrorDetail(
      ErrorUtils.getErrorMessage(error), 
      {
        category: ErrorUtils.getErrorCategory(error),
        operation,
        component: 'useOPSECSecurity',
        retryCount: retryCount + 1,
        originalError: error instanceof Error ? error : undefined,
        recoverable: retryCount < MAX_RETRIES,
        retryable: retryCount < MAX_RETRIES,
        userActions: [
          'Try the operation again',
          'Check your network connection',
          'Contact support if the problem persists'
        ]
      }
    );
    
    // Log error for debugging
    console.error(`[useOPSECSecurity] Error during ${operation} (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
    
    // Set error state
    setError(errorDetail);
    
    return errorDetail;
  }, []);
  
  // Helper to clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Fix dependency arrays for useEffect and useCallback hooks
  useEffect(() => {
    const loadInitialData = async () => {
      // Mark loading state for initial load
      setOperationLoading('initialLoad', true);
      
      try {
        // Get connection status with automatic retry
        const status = await opsecService.getConnectionStatus();
        setConnectionStatus(status);
        
        // Set routing method from status
        setRoutingMethod(status.routingMethod);
        
        // Set fingerprint protection from status
        setFingerprintProtection(status.fingerprintProtection);
        
        // Get security alerts with automatic retry
        const alerts = await opsecService.getSecurityAlerts();
        setSecurityAlerts(alerts);
        
        // Clear any existing errors
        clearError();
      } catch (error) {
        // Handle error with context
        handleError(error, 'initialLoad');
      } finally {
        // Clear loading state
        setOperationLoading('initialLoad', false);
      }
    };
    
    loadInitialData();
  }, [clearError, handleError, setOperationLoading]);
  
  /**
   * Get connection status
   */
  const getConnectionStatus = useCallback(async () => {
    setOperationLoading('getConnectionStatus', true);
    
    try {
      const status = await opsecService.getConnectionStatus(true);
      setConnectionStatus(status);
      clearError();
      return status;
    } catch (error) {
      // Handle error with context
      handleError(error, 'getConnectionStatus');
      return null;
    } finally {
      setOperationLoading('getConnectionStatus', false);
    }
  }, [clearError, handleError, setOperationLoading]);
  
  /**
   * Set routing method
   */
  const changeRoutingMethod = useCallback(async (method: RoutingMethod) => {
    setOperationLoading('changeRoutingMethod', true);
    
    try {
      const success = await opsecService.setRoutingMethod(method);
      
      if (success) {
        setRoutingMethod(method);
        // Refresh connection status
        const status = await opsecService.getConnectionStatus();
        setConnectionStatus(status);
        clearError();
      } else {
        // Create error with context
        handleError(
          new Error(`Failed to change routing method to ${method}`), 
          'changeRoutingMethod'
        );
      }
      
      return success;
    } catch (error) {
      // Handle error with context
      handleError(error, 'changeRoutingMethod');
      return false;
    } finally {
      setOperationLoading('changeRoutingMethod', false);
    }
  }, [clearError, handleError, setOperationLoading]);
  
  /**
   * Set security level
   */
  const changeSecurityLevel = useCallback(async (level: SecurityLevel) => {
    setOperationLoading('changeSecurityLevel', true);
    
    try {
      const success = await opsecService.setSecurityLevel(level, true);
      
      if (success) {
        setSecurityLevel(level);
        clearError();
      } else {
        // Create error with context
        handleError(
          new Error(`Failed to change security level to ${level}`),
          'changeSecurityLevel'
        );
      }
      
      return success;
    } catch (error) {
      // Handle error with context
      handleError(error, 'changeSecurityLevel');
      return false;
    } finally {
      setOperationLoading('changeSecurityLevel', false);
    }
  }, []);
  
  /**
   * Toggle fingerprint protection
   */
  const toggleFingerprintProtection = useCallback(async (enabled: boolean) => {
    setOperationLoading('toggleFingerprintProtection', true);
    
    try {
      const success = await opsecService.setFingerprintProtection(enabled, true);
      
      if (success) {
        setFingerprintProtection(enabled);
        // Refresh connection status
        const status = await opsecService.getConnectionStatus(true);
        setConnectionStatus(status);
        clearError();
      } else {
        // Create error with context
        handleError(
          new Error(`Failed to ${enabled ? 'enable' : 'disable'} fingerprint protection`),
          'toggleFingerprintProtection'
        );
      }
      
      return success;
    } catch (error) {
      // Handle error with context
      handleError(error, 'toggleFingerprintProtection');
      return false;
    } finally {
      setOperationLoading('toggleFingerprintProtection', false);
    }
  }, []);
  
  /**
   * Get security alerts
   */
  const getSecurityAlerts = useCallback(async () => {
    setOperationLoading('getSecurityAlerts', true);
    
    try {
      const alerts = await opsecService.getSecurityAlerts(true);
      setSecurityAlerts(alerts);
      clearError();
      return alerts;
    } catch (error) {
      // Handle error with context
      handleError(error, 'getSecurityAlerts');
      return [];
    } finally {
      setOperationLoading('getSecurityAlerts', false);
    }
  }, []);
  
  /**
   * Acknowledge security alert
   */
  const acknowledgeAlert = useCallback(async (id: number) => {
    setOperationLoading('acknowledgeAlert', true);
    
    try {
      const success = await opsecService.acknowledgeAlert(id);
      
      if (success) {
        // Update local state
        setSecurityAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.id === id ? { ...alert, acknowledged: true } : alert
          )
        );
        clearError();
      } else {
        // Create error with context
        handleError(
          new Error(`Failed to acknowledge alert #${id}`),
          'acknowledgeAlert'
        );
      }
      
      return success;
    } catch (error) {
      // Handle error with context
      handleError(error, 'acknowledgeAlert');
      return false;
    } finally {
      setOperationLoading('acknowledgeAlert', false);
    }
  }, []);
  
  /**
   * Scan for threats
   */
  const scanForThreats = useCallback(async () => {
    setOperationLoading('scanForThreats', true);
    
    try {
      const result = await opsecService.scanForThreats(true);
      setThreatScanResult(result);
      clearError();
      return result;
    } catch (error) {
      // Handle error with context
      handleError(error, 'scanForThreats');
      return null;
    } finally {
      setOperationLoading('scanForThreats', false);
    }
  }, []);
  
  /**
   * Run security checks
   */
  const runSecurityChecks = useCallback(async () => {
    setOperationLoading('runSecurityChecks', true);
    
    try {
      const checks = await opsecService.runSecurityChecks(true);
      setSecurityChecks(checks);
      clearError();
      return checks;
    } catch (error) {
      // Handle error with context
      handleError(error, 'runSecurityChecks');
      return [];
    } finally {
      setOperationLoading('runSecurityChecks', false);
    }
  }, []);
  
  /**
   * Generate new identity
   */
  const generateNewIdentity = useCallback(async () => {
    setOperationLoading('generateNewIdentity', true);
    
    try {
      const success = await opsecService.generateNewIdentity(true);
      
      if (success) {
        // Refresh connection status
        const status = await opsecService.getConnectionStatus(true);
        setConnectionStatus(status);
        clearError();
      } else {
        // Create error with context
        handleError(
          new Error('Failed to generate new identity'),
          'generateNewIdentity'
        );
      }
      
      return success;
    } catch (error) {
      // Handle error with context
      handleError(error, 'generateNewIdentity');
      return false;
    } finally {
      setOperationLoading('generateNewIdentity', false);
    }
  }, []);
  
  /**
   * Check identity
   */
  const checkIdentity = useCallback(async () => {
    setOperationLoading('checkIdentity', true);
    
    try {
      const identityInfo = await opsecService.checkIdentity(true);
      clearError();
      return identityInfo;
    } catch (error) {
      // Handle error with context
      handleError(error, 'checkIdentity');
      return null;
    } finally {
      setOperationLoading('checkIdentity', false);
    }
  }, []);
  
  return {
    // State
    connectionStatus,
    securityLevel,
    routingMethod,
    fingerprintProtection,
    securityAlerts,
    threatScanResult,
    securityChecks,
    isLoading,
    error,
    
    // Error handling
    clearError,
    
    // Actions
    getConnectionStatus,
    changeRoutingMethod,
    changeSecurityLevel,
    toggleFingerprintProtection,
    getSecurityAlerts,
    acknowledgeAlert,
    scanForThreats,
    runSecurityChecks,
    generateNewIdentity,
    checkIdentity,
  };
}
