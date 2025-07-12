/**
 * useNetRunnerSearch Hook
 * 
 * Enhanced custom hook for NetRunner search operations that integrates with
 * the NetRunnerSearchService for real API connections and comprehensive
 * error handling with logging.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { useState, useCallback, useEffect } from 'react';
import { SearchQuery, SearchResult } from '../types/netrunner';
import { netRunnerSearchService } from '../services/search';
import { LoggerFactory } from '../services/logging';

interface UseNetRunnerSearchOptions {
  initialQuery?: string;
  initialFilters?: Record<string, unknown>;
  initialSources?: string[];
  maxResults?: number;
  autoSearch?: boolean;
}

interface UseNetRunnerSearchResult {
  query: string;
  setQuery: (query: string) => void;
  filters: Record<string, unknown>;
  setFilters: (filters: Record<string, unknown>) => void;
  sources: string[];
  setSources: (sources: string[]) => void;
  results: SearchResult[];
  searchHistory: string[];
  isSearching: boolean;
  error: Error | null;
  search: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Custom hook for NetRunner search functionality with real search service integration
 */
export function useNetRunnerSearch({
  initialQuery = '',
  initialFilters = {},
  initialSources = [],
  maxResults = 20,
  autoSearch = false
}: UseNetRunnerSearchOptions = {}): UseNetRunnerSearchResult {
  // State management
  const [query, setQuery] = useState<string>(initialQuery);
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);
  const [sources, setSources] = useState<string[]>(initialSources);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize logger
  const logger = LoggerFactory.getLogger('NetRunner:useNetRunnerSearch');

  // Search function using NetRunnerSearchService
  const search = useCallback(async () => {
    if (!query.trim()) {
      setError(new Error('Search query cannot be empty'));
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      logger.info('Starting search operation', {
        query,
        sources: sources.length > 0 ? sources : 'all',
        maxResults
      });

      // Create search query object
      const searchQuery: SearchQuery = {
        text: query,
        filters,
        sources: sources.length > 0 ? sources : undefined,
        maxResults,
        authenticated: true
      };

      // Use the NetRunnerSearchService
      const searchResults = await netRunnerSearchService.performSearch(searchQuery);
      
      setResults(searchResults);
      
      // Add to search history (avoid duplicates)
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 9)]); // Keep last 10 searches
      }

      logger.info('Search completed successfully', {
        query,
        resultCount: searchResults.length
      });

    } catch (searchError) {
      const errorMessage = searchError instanceof Error ? searchError : new Error('Search failed');
      setError(errorMessage);
      
      logger.error('Search operation failed', errorMessage, {
        searchQuery: query
      });
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, sources, maxResults, searchHistory, logger]);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    logger.debug('Search results cleared');
  }, [logger]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-search when enabled
  useEffect(() => {
    if (autoSearch && query.trim() && !isSearching) {
      const debounceTimeout = setTimeout(() => {
        search();
      }, 500); // 500ms debounce

      return () => clearTimeout(debounceTimeout);
    }
  }, [autoSearch, query, search, isSearching]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    sources,
    setSources,
    results,
    searchHistory,
    isSearching,
    error,
    search,
    clearResults,
    clearError
  };
}
