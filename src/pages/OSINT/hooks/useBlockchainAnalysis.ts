/**
 * useBlockchainAnalysis Hook
 * 
 * React hook for blockchain analysis in the OSINT module.
 * Provides functionality for wallet analysis, transaction tracking,
 * and smart contract inspection.
 */

import { useState, useCallback } from 'react';
import { 
  blockchainService, 
  WalletInfo, 
  TransactionInfo, 
  SmartContractInfo, 
  TransactionFlow,
  WalletHistoricalAnalysis,
  BlockchainNetwork
} from '../services/blockchain/blockchainService';
import { ErrorDetail, createErrorDetail, ErrorUtils } from '../types/errors';

// Search type for blockchain analysis
export type BlockchainSearchType = 'wallet' | 'transaction' | 'smartContract' | 'flow' | 'history';

// Search options for blockchain queries
export interface BlockchainSearchOptions {
  network?: BlockchainNetwork;
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxResults?: number;
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
  maxHops?: number;
}

// Types of data that can be returned by the hook
export type BlockchainData = 
  | WalletInfo 
  | TransactionInfo[] 
  | SmartContractInfo 
  | TransactionFlow 
  | WalletHistoricalAnalysis 
  | null;

// Types of operations that can be performed
type OperationType = 'search' | 'expandData' | 'filter';

/**
 * Hook for blockchain analysis in the OSINT module
 */
export function useBlockchainAnalysis() {
  // State for search query
  const [query, setQuery] = useState<string>('');
  
  // State for search type
  const [searchType, setSearchType] = useState<BlockchainSearchType>('wallet');
  
  // State for search options
  const [options, setOptions] = useState<BlockchainSearchOptions>({
    network: 'ethereum',
    maxResults: 25
  });
  
  // State for loading operations
  const [loadingOperations, setLoadingOperations] = useState<Record<string, boolean>>({});
  
  // State for errors
  const [error, setError] = useState<ErrorDetail | null>(null);
  
  // State for search results
  const [data, setData] = useState<BlockchainData>(null);
  
  // Helper to determine if any operation is loading
  const isLoading = Object.values(loadingOperations).some(Boolean);
  
  // Set loading state for a specific operation
  const setOperationLoading = useCallback((operation: OperationType, isLoading: boolean) => {
    setLoadingOperations(prev => ({
      ...prev,
      [operation]: isLoading
    }));
  }, []);
  
  /**
   * Execute a blockchain search based on current parameters
   */
  const search = useCallback(async () => {
    if (!query) {
      setError(createErrorDetail(
        'Please enter a search query',
        {
          severity: 'warning',
          operation: 'search',
          component: 'useBlockchainAnalysis',
          recoverable: true,
          retryable: false,
          userActions: ['Enter a wallet address, transaction hash, or other search term']
        }
      ));
      return;
    }
    
    setOperationLoading('search', true);
    setError(null);
    
    try {
      let result: BlockchainData | ErrorDetail = null;
      
      switch (searchType) {
        case 'wallet':
          result = await blockchainService.getWalletInfo(
            query, 
            options.network
          );
          break;
          
        case 'transaction':
          result = await blockchainService.searchTransactions(
            query, 
            options
          );
          break;
          
        case 'smartContract':
          result = await blockchainService.getSmartContractInfo(
            query, 
            options.network
          );
          break;
          
        case 'flow':
          result = await blockchainService.getTransactionFlow(
            query, 
            {
              network: options.network,
              maxHops: options.maxHops,
              startDate: options.startDate,
              endDate: options.endDate,
              minValue: options.minValue
            }
          );
          break;
          
        case 'history':
          result = await blockchainService.getWalletHistory(
            query, 
            {
              network: options.network,
              timeframe: options.timeframe,
              startDate: options.startDate,
              endDate: options.endDate
            }
          );
          break;
          
        default:
          setError(createErrorDetail(
            'Invalid search type',
            {
              severity: 'error',
              operation: 'search',
              component: 'useBlockchainAnalysis',
              recoverable: true,
              retryable: false,
              userActions: ['Select a valid search type']
            }
          ));
          setOperationLoading('search', false);
          return;
      }
      
      // Check if the result is an error or data
      if ('message' in result && 'timestamp' in result) {
        setError(result);
        setData(null);
      } else {
        setData(result);
      }
    } catch (error) {
      console.error('Blockchain analysis error:', error);
      setError(createErrorDetail(
        ErrorUtils.createUserFriendlyMessage(error),
        {
          severity: 'error',
          operation: 'search',
          component: 'useBlockchainAnalysis',
          originalError: error instanceof Error ? error : undefined,
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
          retryable: true,
          context: { query, searchType, options },
          userActions: [
            'Check your network connection',
            'Verify the input is correct for the selected search type',
            'Try a different search type'
          ]
        }
      ));
      setData(null);
    } finally {
      setOperationLoading('search', false);
    }
  }, [query, searchType, options, setOperationLoading]);
  
  /**
   * Set search parameters and execute search
   */
  const executeSearch = useCallback((
    newQuery: string,
    newType: BlockchainSearchType = 'wallet',
    newOptions: Partial<BlockchainSearchOptions> = {}
  ) => {
    setQuery(newQuery);
    setSearchType(newType);
    setOptions(prev => ({ ...prev, ...newOptions }));
    
    // If we have a valid query, execute the search
    if (newQuery) {
      search();
    }
  }, [search]);
  
  /**
   * Update search options
   */
  const updateOptions = useCallback((newOptions: Partial<BlockchainSearchOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);
  
  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setData(null);
    setError(null);
  }, []);

  // Return the hook API
  return {
    // State
    query,
    searchType,
    options,
    isLoading,
    error,
    data,
    loadingOperations,
    
    // Actions
    setQuery,
    setSearchType,
    updateOptions,
    search,
    executeSearch,
    clearSearch,
    
    // Typing helpers for the returned data
    isWalletInfo: (data: BlockchainData): data is WalletInfo => 
      data !== null && 'address' in data && !Array.isArray(data),
    isTransactions: (data: BlockchainData): data is TransactionInfo[] => 
      data !== null && Array.isArray(data),
    isSmartContract: (data: BlockchainData): data is SmartContractInfo => 
      data !== null && 'methods' in data && !Array.isArray(data),
    isTransactionFlow: (data: BlockchainData): data is TransactionFlow => 
      data !== null && 'flows' in data && !Array.isArray(data),
    isWalletHistory: (data: BlockchainData): data is WalletHistoricalAnalysis => 
      data !== null && 'dataPoints' in data && !Array.isArray(data)
  };
}

export default useBlockchainAnalysis;
