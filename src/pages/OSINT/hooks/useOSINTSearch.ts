/**
 * useOSINTSearch Hook
 * 
 * Custom hook for OSINT search operations. Provides search functionality,
 * results management, and search history with enhanced error handling.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { SearchQuery, SearchResult } from '../types/osint';
import { searchService } from '../services/search/searchService';
import { ErrorDetail, ErrorUtils, createErrorDetail } from '../types/errors';

interface UseOSINTSearchOptions {
  initialQuery?: string;
  initialFilters?: Record<string, unknown>;
  initialSources?: string[];
  maxResults?: number;
  autoSearch?: boolean;
}

interface UseOSINTSearchResult {
  query: string;
  setQuery: (query: string) => void;
  filters: Record<string, unknown>;
  setFilters: (filters: Record<string, unknown>) => void;
  sources: string[];
  setSources: (sources: string[]) => void;
  results: SearchResult[];
  searchHistory: string[];
  loading: boolean;
  operationLoading: Record<string, boolean>;
  error: ErrorDetail | null;
  search: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
}

/**
 * Custom hook for OSINT search functionality with enhanced error handling
 */
export function useOSINTSearch({
  initialQuery = '',
  initialFilters = {},
  initialSources = [],
  maxResults,
  autoSearch = false
}: UseOSINTSearchOptions = {}): UseOSINTSearchResult {
  // State management
  const [query, setQuery] = useState<string>(initialQuery);
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);
  const [sources, setSources] = useState<string[]>(initialSources);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<ErrorDetail | null>(null);
  
  // Track last operation for retry functionality
  const lastOperationRef = useRef<{ name: string; args: unknown[] } | null>(null);
  
  // Track retry attempts
  const retryAttemptsRef = useRef<Record<string, number>>({});
  
  // Maximum retry attempts
  const MAX_RETRIES = 3;
  
  // Helper to check if any operation is loading
  const loading = Object.values(operationLoading).some(isLoading => isLoading);
  
  // Helper to set loading state for an operation
  const setOperationLoadingState = useCallback((operation: string, isLoading: boolean) => {
    setOperationLoading(prev => ({
      ...prev,
      [operation]: isLoading
    }));
  }, []);
  
  // Helper function to handle errors
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
        component: 'useOSINTSearch',
        retryCount: retryCount + 1,
        originalError: error instanceof Error ? error : undefined,
        recoverable: retryCount < MAX_RETRIES,
        retryable: retryCount < MAX_RETRIES,
        userActions: [
          'Try the operation again',
          'Check your search query and filters',
          'Try different search sources'
        ]
      }
    );
    
    // Log error for debugging
    console.error(`[useOSINTSearch] Error during ${operation} (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
    
    // Set error state
    setError(errorDetail);
    
    return errorDetail;
  }, []);
  
  // Helper to clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Retry last operation
  const retryLastOperation = useCallback(async () => {
    if (!lastOperationRef.current) return;
    
    const { name } = lastOperationRef.current;
    
    if (name === 'search') {
      await search();
    } else if (name === 'loadSearchHistory') {
      await loadSearchHistory();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Load search history
  const loadSearchHistory = useCallback(async () => {
    lastOperationRef.current = { name: 'loadSearchHistory', args: [] };
    setOperationLoadingState('loadSearchHistory', true);
    
    try {
      const history = await searchService.getSearchHistory();
      setSearchHistory(history);
      clearError();
    } catch (err) {
      handleError(err, 'loadSearchHistory');
    } finally {
      setOperationLoadingState('loadSearchHistory', false);
    }
  }, [clearError, handleError, setOperationLoadingState]);
  
  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);
  
  // Auto-search effect
  useEffect(() => {
    if (autoSearch && query.trim()) {
      search();
    }
  }, [autoSearch, query]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Search function
  const search = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    lastOperationRef.current = { name: 'search', args: [] };
    setOperationLoadingState('search', true);
    clearError();
    
    try {
      // Build search query
      const searchQuery: SearchQuery = {
        text: query,
        filters,
        sources: sources.length > 0 ? sources : undefined,
        maxResults,
        authenticated: true // This would come from auth context in a real implementation
      };
      
      // Execute search
      const searchResults = await searchService.search(searchQuery);
      setResults(searchResults);
      
      // Add to search history if not already present
      if (query.trim() && !searchHistory.includes(query.trim())) {
        setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10)); // Keep last 10 searches
      }
      
      // Reset retry counter for successful operation
      retryAttemptsRef.current['search'] = 0;
    } catch (err) {
      handleError(err, 'search');
    } finally {
      setOperationLoadingState('search', false);
    }
  }, [query, filters, sources, maxResults, searchHistory, handleError, clearError, setOperationLoadingState]);
  
  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);
  
  return {
    query,
    setQuery,
    filters,
    setFilters,
    sources,
    setSources,
    results,
    searchHistory,
    loading,
    operationLoading,
    error,
    search,
    clearResults,
    clearError,
    retryLastOperation
  };
}
