/**
 * Transaction Tracker Hook for Web3 Authentication
 * Monitors transaction status with real-time confirmation tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkValidation } from './useNetworkValidation';

export type TransactionStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'finalized' 
  | 'failed' 
  | 'timeout' 
  | 'cancelled';

export interface TrackedTransaction {
  signature: string;
  status: TransactionStatus;
  timestamp: number;
  confirmations: number;
  slot?: number;
  blockTime?: number;
  error?: string;
  retryCount: number;
  estimatedConfirmationTime?: number;
}

export interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageConfirmationTime: number;
  successRate: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export function useTransactionTracker() {
  const { publicKey } = useWallet();
  const { currentNetwork } = useNetworkValidation();
  
  const [transactions, setTransactions] = useState<Map<string, TrackedTransaction>>(new Map());
  const [metrics, setMetrics] = useState<TransactionMetrics>({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    averageConfirmationTime: 0,
    successRate: 0
  });
  const [isTracking, setIsTracking] = useState(false);
  
  const connectionRef = useRef<Connection | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  // Initialize connection when network changes
  useEffect(() => {
    if (currentNetwork.isConnected && currentNetwork.endpoint) {
      connectionRef.current = new Connection(currentNetwork.endpoint, 'confirmed');
    }
  }, [currentNetwork.endpoint, currentNetwork.isConnected]);

  /**
   * Track a new transaction
   */
  const trackTransaction = useCallback((
    signature: string, 
    retryConfig: Partial<RetryConfig> = {}
  ): void => {
    const config = { ...defaultRetryConfig, ...retryConfig };
    const now = Date.now();
    
    const newTransaction: TrackedTransaction = {
      signature,
      status: 'pending',
      timestamp: now,
      confirmations: 0,
      retryCount: 0,
      estimatedConfirmationTime: 30000 // 30 seconds estimate
    };

    setTransactions(prev => new Map(prev).set(signature, newTransaction));
    
    // Start monitoring this transaction
    monitorTransaction(signature, config);
    
    setMetrics(prev => ({
      ...prev,
      totalTransactions: prev.totalTransactions + 1
    }));
  }, []);

  /**
   * Monitor individual transaction with retry logic
   */
  const monitorTransaction = useCallback(async (
    signature: string, 
    retryConfig: RetryConfig
  ): Promise<void> => {
    if (!connectionRef.current) return;

    try {
      const signatureStatuses = await connectionRef.current.getSignatureStatuses([signature]);
      const status = signatureStatuses.value[0];

      if (status === null) {
        // Transaction not found, schedule retry
        scheduleRetry(signature, retryConfig);
        return;
      }

      const confirmationStatus = status.confirmationStatus;
      let newStatus: TransactionStatus = 'pending';
      
      if (status.err) {
        newStatus = 'failed';
        updateTransactionStatus(signature, newStatus, status.err.toString());
        return;
      }

      switch (confirmationStatus) {
        case 'processed':
          newStatus = 'pending';
          break;
        case 'confirmed':
          newStatus = 'confirmed';
          break;
        case 'finalized':
          newStatus = 'finalized';
          break;
      }

      updateTransactionStatus(signature, newStatus, undefined, {
        confirmations: status.confirmations || 0,
        slot: status.slot
      });

      // Continue monitoring until finalized
      if (newStatus === 'pending' || newStatus === 'confirmed') {
        setTimeout(() => monitorTransaction(signature, retryConfig), 2000);
      }

    } catch (error) {
      console.error('Transaction monitoring error:', error);
      scheduleRetry(signature, retryConfig);
    }
  }, []);

  /**
   * Schedule retry with exponential backoff
   */
  const scheduleRetry = useCallback((
    signature: string, 
    retryConfig: RetryConfig
  ): void => {
    const transaction = transactions.get(signature);
    if (!transaction || transaction.retryCount >= retryConfig.maxRetries) {
      if (transaction) {
        updateTransactionStatus(signature, 'timeout', 'Transaction confirmation timeout');
      }
      return;
    }

    const delay = Math.min(
      retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, transaction.retryCount),
      retryConfig.maxDelay
    );

    const timeoutId = setTimeout(() => {
      updateTransactionRetryCount(signature);
      monitorTransaction(signature, retryConfig);
      retryTimeoutsRef.current.delete(signature);
    }, delay);

    retryTimeoutsRef.current.set(signature, timeoutId);
  }, [transactions]);

  /**
   * Update transaction status
   */
  const updateTransactionStatus = useCallback((
    signature: string,
    status: TransactionStatus,
    error?: string,
    additionalData?: Partial<TrackedTransaction>
  ): void => {
    setTransactions(prev => {
      const transaction = prev.get(signature);
      if (!transaction) return prev;

      const confirmationTime = status === 'finalized' || status === 'confirmed'
        ? Date.now() - transaction.timestamp
        : undefined;

      const updatedTransaction: TrackedTransaction = {
        ...transaction,
        status,
        error,
        ...additionalData,
        ...(confirmationTime && { estimatedConfirmationTime: confirmationTime })
      };

      const newMap = new Map(prev);
      newMap.set(signature, updatedTransaction);
      return newMap;
    });

    // Update metrics when transaction completes
    if (status === 'finalized' || status === 'failed') {
      updateMetrics(signature, status);
    }
  }, []);

  /**
   * Update retry count for transaction
   */
  const updateTransactionRetryCount = useCallback((signature: string): void => {
    setTransactions(prev => {
      const transaction = prev.get(signature);
      if (!transaction) return prev;

      const newMap = new Map(prev);
      newMap.set(signature, {
        ...transaction,
        retryCount: transaction.retryCount + 1
      });
      return newMap;
    });
  }, []);

  /**
   * Update metrics when transaction completes
   */
  const updateMetrics = useCallback((signature: string, status: TransactionStatus): void => {
    const transaction = transactions.get(signature);
    if (!transaction) return;

    setMetrics(prev => {
      const successful = status === 'finalized' || status === 'confirmed';
      const newSuccessful = prev.successfulTransactions + (successful ? 1 : 0);
      const newFailed = prev.failedTransactions + (successful ? 0 : 1);
      const completedTransactions = newSuccessful + newFailed;
      
      // Calculate average confirmation time
      const confirmationTime = transaction.estimatedConfirmationTime || 0;
      const newAverageTime = completedTransactions > 0
        ? (prev.averageConfirmationTime * (completedTransactions - 1) + confirmationTime) / completedTransactions
        : 0;

      return {
        ...prev,
        successfulTransactions: newSuccessful,
        failedTransactions: newFailed,
        averageConfirmationTime: newAverageTime,
        successRate: completedTransactions > 0 ? (newSuccessful / completedTransactions) * 100 : 0
      };
    });
  }, [transactions]);

  /**
   * Get transactions for current user
   */
  const getUserTransactions = useCallback((): TrackedTransaction[] => {
    return Array.from(transactions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  /**
   * Get pending transactions
   */
  const getPendingTransactions = useCallback((): TrackedTransaction[] => {
    return getUserTransactions().filter(tx => 
      tx.status === 'pending' || tx.status === 'confirmed'
    );
  }, [getUserTransactions]);

  /**
   * Clear completed transactions
   */
  const clearCompletedTransactions = useCallback((): void => {
    setTransactions(prev => {
      const newMap = new Map();
      prev.forEach((transaction, signature) => {
        if (transaction.status === 'pending' || transaction.status === 'confirmed') {
          newMap.set(signature, transaction);
        }
      });
      return newMap;
    });
  }, []);

  /**
   * Cancel transaction tracking
   */
  const cancelTransactionTracking = useCallback((signature: string): void => {
    // Clear any pending retries
    const timeoutId = retryTimeoutsRef.current.get(signature);
    if (timeoutId) {
      clearTimeout(timeoutId);
      retryTimeoutsRef.current.delete(signature);
    }

    // Update status to cancelled
    updateTransactionStatus(signature, 'cancelled');
  }, [updateTransactionStatus]);

  /**
   * Start periodic tracking for all pending transactions
   */
  useEffect(() => {
    if (isTracking && connectionRef.current) {
      trackingIntervalRef.current = setInterval(() => {
        const pendingTxs = getPendingTransactions();
        pendingTxs.forEach(tx => {
          if (tx.retryCount < defaultRetryConfig.maxRetries) {
            monitorTransaction(tx.signature, defaultRetryConfig);
          }
        });
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isTracking, getPendingTransactions, monitorTransaction]);

  /**
   * Auto-start tracking when wallet connects
   */
  useEffect(() => {
    setIsTracking(!!publicKey && currentNetwork.isConnected);
  }, [publicKey, currentNetwork.isConnected]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all retry timeouts
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutsRef.current.clear();
      
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  return {
    transactions: getUserTransactions(),
    pendingTransactions: getPendingTransactions(),
    metrics,
    isTracking,
    trackTransaction,
    cancelTransactionTracking,
    clearCompletedTransactions,
    updateTransactionStatus
  };
}
