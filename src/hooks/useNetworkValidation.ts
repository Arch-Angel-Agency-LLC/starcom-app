/**
 * Network Validation Hook for Solana Web3 Login
 * Handles cluster detection, validation, and switching
 */

import { useState, useEffect, useCallback } from 'react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

export type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta';

export interface NetworkInfo {
  cluster: SolanaCluster;
  endpoint: string;
  isConnected: boolean;
  blockHeight: number | null;
  tps: number | null;
  error: string | null;
}

export interface NetworkValidationResult {
  isValid: boolean;
  cluster: SolanaCluster;
  endpoint: string;
  latency: number;
  error?: string;
}

export function useNetworkValidation() {
  const { wallet } = useWallet();
  const [currentNetwork, setCurrentNetwork] = useState<NetworkInfo>({
    cluster: 'devnet',
    endpoint: clusterApiUrl('devnet'),
    isConnected: false,
    blockHeight: null,
    tps: null,
    error: null
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [supportedNetworks] = useState<SolanaCluster[]>(['devnet', 'testnet', 'mainnet-beta']);

  /**
   * Validate network connectivity and health
   */
  const validateNetwork = useCallback(async (cluster: SolanaCluster): Promise<NetworkValidationResult> => {
    const startTime = Date.now();
    const endpoint = clusterApiUrl(cluster);
    
    try {
      const connection = new Connection(endpoint, 'confirmed');
      
      // Test connection with multiple checks
      await Promise.all([
        connection.getSlot(),
        connection.getBlockHeight(),
        connection.getVersion()
      ]);

      const latency = Date.now() - startTime;

      return {
        isValid: true,
        cluster,
        endpoint,
        latency,
      };
    } catch (error) {
      return {
        isValid: false,
        cluster,
        endpoint,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown network error'
      };
    }
  }, []);

  /**
   * Switch to different Solana cluster
   */
  const switchNetwork = useCallback(async (cluster: SolanaCluster): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      const validation = await validateNetwork(cluster);
      
      if (validation.isValid) {
        setCurrentNetwork({
          cluster,
          endpoint: validation.endpoint,
          isConnected: true,
          blockHeight: null, // Will be updated by monitoring
          tps: null,
          error: null
        });
        
        // Store user preference
        localStorage.setItem('starcom-preferred-cluster', cluster);
        return true;
      } else {
        setCurrentNetwork(prev => ({
          ...prev,
          error: validation.error || 'Network validation failed'
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network switch failed';
      setCurrentNetwork(prev => ({
        ...prev,
        error: errorMessage
      }));
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validateNetwork]);

  /**
   * Auto-detect optimal network
   */
  const autoDetectNetwork = useCallback(async (): Promise<SolanaCluster> => {
    const validationPromises = supportedNetworks.map(cluster => 
      validateNetwork(cluster).then(result => ({ cluster, result }))
    );
    
    const results = await Promise.all(validationPromises);
    
    // Find fastest responding network
    const validNetworks = results
      .filter(({ result }) => result.isValid)
      .sort((a, b) => a.result.latency - b.result.latency);
    
    if (validNetworks.length > 0) {
      return validNetworks[0].cluster;
    }
    
    // Fallback to devnet
    return 'devnet';
  }, [supportedNetworks, validateNetwork]);

  /**
   * Monitor network health
   */
  const monitorNetworkHealth = useCallback(async () => {
    if (!currentNetwork.isConnected) return;
    
    try {
      const connection = new Connection(currentNetwork.endpoint, 'confirmed');
      const [blockHeight, recentPerformance] = await Promise.all([
        connection.getBlockHeight(),
        connection.getRecentPerformanceSamples(1)
      ]);

      const tps = recentPerformance.length > 0 
        ? recentPerformance[0].numTransactions / recentPerformance[0].samplePeriodSecs
        : null;

      setCurrentNetwork(prev => ({
        ...prev,
        blockHeight,
        tps,
        error: null
      }));
    } catch (error) {
      setCurrentNetwork(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Network monitoring failed'
      }));
    }
  }, [currentNetwork.endpoint, currentNetwork.isConnected]);

  /**
   * Get network display name
   */
  const getNetworkDisplayName = useCallback((cluster: SolanaCluster): string => {
    const names = {
      'devnet': 'Devnet',
      'testnet': 'Testnet', 
      'mainnet-beta': 'Mainnet'
    };
    return names[cluster];
  }, []);

  /**
   * Check if wallet supports current network
   */
  const isWalletCompatible = useCallback((): boolean => {
    // Most Solana wallets support all clusters
    // This could be enhanced to check specific wallet capabilities
    return !!wallet;
  }, [wallet]);

  // Initialize network on mount
  useEffect(() => {
    const initializeNetwork = async () => {
      // Check for user preference
      const savedCluster = localStorage.getItem('starcom-preferred-cluster') as SolanaCluster;
      
      if (savedCluster && supportedNetworks.includes(savedCluster)) {
        await switchNetwork(savedCluster);
      } else {
        // Auto-detect best network
        const optimalCluster = await autoDetectNetwork();
        await switchNetwork(optimalCluster);
      }
    };

    initializeNetwork();
  }, [switchNetwork, autoDetectNetwork, supportedNetworks]);

  // Monitor network health periodically
  useEffect(() => {
    if (!currentNetwork.isConnected) return;

    const interval = setInterval(monitorNetworkHealth, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [currentNetwork.isConnected, monitorNetworkHealth]);

  return {
    currentNetwork,
    supportedNetworks,
    isValidating,
    validateNetwork,
    switchNetwork,
    autoDetectNetwork,
    getNetworkDisplayName,
    isWalletCompatible,
    monitorNetworkHealth
  };
}
