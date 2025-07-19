/**
 * Connection Health Monitor for Web3 Authentication
 * Monitors wallet connectivity, network health, and provides diagnostics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkValidation } from './useNetworkValidation';

export interface ConnectionHealth {
  overall: 'excellent' | 'good' | 'poor' | 'critical';
  wallet: {
    connected: boolean;
    responsive: boolean;
    lastActivity: number;
    errorCount: number;
  };
  network: {
    latency: number;
    stability: number;
    blockHeight: number | null;
    lastCheck: number;
  };
  issues: string[];
  recommendations: string[];
}

export interface ConnectionDiagnostics {
  timestamp: number;
  walletInfo: {
    name: string;
    version?: string;
    connected: boolean;
    publicKey?: string;
  };
  networkInfo: {
    cluster: string;
    endpoint: string;
    blockHeight?: number;
    tps?: number;
  };
  performance: {
    connectionTime: number;
    responseTime: number;
    errorRate: number;
  };
  troubleshooting: {
    commonIssues: string[];
    solutions: string[];
  };
}

export function useConnectionHealth() {
  const { wallet, connected, publicKey } = useWallet();
  const { currentNetwork, validateNetwork } = useNetworkValidation();
  const [health, setHealth] = useState<ConnectionHealth>({
    overall: 'critical',
    wallet: {
      connected: false,
      responsive: false,
      lastActivity: 0,
      errorCount: 0
    },
    network: {
      latency: 0,
      stability: 0,
      blockHeight: null,
      lastCheck: 0
    },
    issues: [],
    recommendations: []
  });

  const performanceRef = useRef({
    connectionAttempts: 0,
    successfulConnections: 0,
    totalLatency: 0,
    errors: [] as { timestamp: number; error: string }[]
  });

  /**
   * Test wallet responsiveness
   */
  const testWalletResponsiveness = useCallback(async (): Promise<boolean> => {
    if (!wallet || !connected) return false;

    try {
      const startTime = Date.now();
      
      // Simple responsiveness test - check if wallet can provide public key
      if (publicKey) {
        const responseTime = Date.now() - startTime;
        
        // Update performance metrics
        performanceRef.current.totalLatency += responseTime;
        
        return responseTime < 5000; // Consider responsive if under 5 seconds
      }
      
      return false;
    } catch (error) {
      performanceRef.current.errors.push({
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown wallet error'
      });
      return false;
    }
  }, [wallet, connected, publicKey]);

  /**
   * Calculate overall health score
   */
  const calculateHealthScore = useCallback((
    walletHealth: number,
    networkHealth: number,
    errorRate: number
  ): ConnectionHealth['overall'] => {
    const combinedScore = (walletHealth * 0.4 + networkHealth * 0.4 + (1 - errorRate) * 0.2) * 100;
    
    if (combinedScore >= 90) return 'excellent';
    if (combinedScore >= 70) return 'good';
    if (combinedScore >= 50) return 'poor';
    return 'critical';
  }, []);

  /**
   * Generate diagnostic report
   */
  const generateDiagnostics = useCallback((): ConnectionDiagnostics => {
    const now = Date.now();
    const recentErrors = performanceRef.current.errors.filter(
      error => now - error.timestamp < 300000 // Last 5 minutes
    );

    const errorRate = performanceRef.current.connectionAttempts > 0
      ? recentErrors.length / performanceRef.current.connectionAttempts
      : 0;

    const avgLatency = performanceRef.current.connectionAttempts > 0
      ? performanceRef.current.totalLatency / performanceRef.current.connectionAttempts
      : 0;

    return {
      timestamp: now,
      walletInfo: {
        name: wallet?.adapter.name || 'No wallet',
        connected,
        publicKey: publicKey?.toString(),
      },
      networkInfo: {
        cluster: currentNetwork.cluster,
        endpoint: currentNetwork.endpoint,
        blockHeight: currentNetwork.blockHeight || undefined,
        tps: currentNetwork.tps || undefined,
      },
      performance: {
        connectionTime: avgLatency,
        responseTime: avgLatency,
        errorRate,
      },
      troubleshooting: {
        commonIssues: [
          ...(!connected ? ['Wallet not connected'] : []),
          ...(currentNetwork.error ? ['Network connectivity issues'] : []),
          ...(errorRate > 0.1 ? ['High error rate detected'] : []),
          ...(avgLatency > 3000 ? ['Slow response times'] : []),
        ],
        solutions: [
          ...(!connected ? ['Try reconnecting your wallet', 'Refresh the page', 'Check wallet extension is unlocked'] : []),
          ...(currentNetwork.error ? ['Check internet connection', 'Try switching networks', 'Verify firewall settings'] : []),
          ...(errorRate > 0.1 ? ['Clear browser cache', 'Try different wallet', 'Check for wallet updates'] : []),
          ...(avgLatency > 3000 ? ['Check network connection', 'Try different RPC endpoint', 'Close other browser tabs'] : []),
        ],
      },
    };
  }, [wallet, connected, publicKey, currentNetwork]);

  /**
   * Monitor connection health
   */
  const monitorHealth = useCallback(async () => {
    try {
      // Test wallet responsiveness
      const isWalletResponsive = await testWalletResponsiveness();
      
      // Test network connectivity
      const networkValidation = await validateNetwork(currentNetwork.cluster);
      
      // Calculate health metrics
      const walletHealth = connected && isWalletResponsive ? 1 : 0;
      const networkHealth = networkValidation.isValid ? Math.max(0, 1 - networkValidation.latency / 5000) : 0;
      
      const recentErrors = performanceRef.current.errors.filter(
        error => Date.now() - error.timestamp < 300000
      );
      const errorRate = performanceRef.current.connectionAttempts > 0
        ? recentErrors.length / performanceRef.current.connectionAttempts
        : 0;

      // Generate issues and recommendations
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!connected) {
        issues.push('Wallet not connected');
        recommendations.push('Connect your Solana wallet to continue');
      }

      if (!isWalletResponsive && connected) {
        issues.push('Wallet not responding');
        recommendations.push('Try refreshing the page or reconnecting wallet');
      }

      if (!networkValidation.isValid) {
        issues.push(`Network connectivity issues on ${currentNetwork.cluster}`);
        recommendations.push('Check internet connection or try different network');
      }

      if (networkValidation.latency > 3000) {
        issues.push('High network latency detected');
        recommendations.push('Consider switching to a faster network endpoint');
      }

      if (errorRate > 0.2) {
        issues.push('High error rate detected');
        recommendations.push('Clear browser cache and try again');
      }

      // Update health state
      setHealth({
        overall: calculateHealthScore(walletHealth, networkHealth, errorRate),
        wallet: {
          connected,
          responsive: isWalletResponsive,
          lastActivity: connected ? Date.now() : health.wallet.lastActivity,
          errorCount: recentErrors.length
        },
        network: {
          latency: networkValidation.latency,
          stability: networkHealth,
          blockHeight: currentNetwork.blockHeight,
          lastCheck: Date.now()
        },
        issues,
        recommendations
      });

      // Update performance tracking
      performanceRef.current.connectionAttempts++;
      if (connected && isWalletResponsive && networkValidation.isValid) {
        performanceRef.current.successfulConnections++;
      }

    } catch (error) {
      performanceRef.current.errors.push({
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Health monitoring error'
      });
    }
  }, [connected, testWalletResponsiveness, validateNetwork, currentNetwork, calculateHealthScore, health.wallet.lastActivity]);

  /**
   * Reset health monitoring
   */
  const resetHealthMonitoring = useCallback(() => {
    performanceRef.current = {
      connectionAttempts: 0,
      successfulConnections: 0,
      totalLatency: 0,
      errors: []
    };
    
    setHealth({
      overall: 'critical',
      wallet: {
        connected: false,
        responsive: false,
        lastActivity: 0,
        errorCount: 0
      },
      network: {
        latency: 0,
        stability: 0,
        blockHeight: null,
        lastCheck: 0
      },
      issues: [],
      recommendations: []
    });
  }, []);

  /**
   * Get health status color
   */
  const getHealthColor = useCallback((status: ConnectionHealth['overall']): string => {
    const colors = {
      excellent: '#00ff00',
      good: '#90EE90',
      poor: '#FFA500',
      critical: '#ff0000'
    };
    return colors[status];
  }, []);

  // Monitor health periodically
  useEffect(() => {
    // Initial health check
    monitorHealth();

    // Set up periodic monitoring
    const interval = setInterval(monitorHealth, 15000); // Every 15 seconds
    
    return () => clearInterval(interval);
  }, [monitorHealth]);

  // Reset monitoring when wallet changes
  useEffect(() => {
    if (wallet) {
      resetHealthMonitoring();
    }
  }, [wallet, resetHealthMonitoring]);

  return {
    health,
    generateDiagnostics,
    resetHealthMonitoring,
    getHealthColor,
    isMonitoring: true
  };
}
