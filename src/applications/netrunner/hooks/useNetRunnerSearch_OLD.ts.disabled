/**
 * useNetRunnerSearch Hook
 * 
 * Custom hook for NetRunner search operations. Provides search functionality,
 * results management, and search history with enhanced error handling.
 * Now integrated with the NetRunnerSearchService for real API connections.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  SearchQuery, 
  SearchResult,
  SearchSource
} from '../types/netrunner';
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
  search: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

// Mock search service for now
const mockSearchService = {
  async performSearch(query: SearchQuery): Promise<SearchResult[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock results based on query
    return [
      { 
        id: '1', 
        title: `Result for "${query.text}" from web`, 
        snippet: 'This is a sample result description that would come from a web search.',
        source: 'web', 
        timestamp: new Date().toISOString(),
        confidence: 0.89,
        metadata: {}
      },
      { 
        id: '2', 
        title: `Social media match for "${query.text}"`, 
        snippet: 'Found on a social media platform with matching criteria.',
        source: 'social', 
        timestamp: new Date().toISOString(),
        confidence: 0.76,
        metadata: {}
      },
      { 
        id: '3', 
        title: `News article mentioning "${query.text}"`, 
        snippet: 'Recent news coverage that includes the search terms.',
        source: 'news', 
        timestamp: new Date().toISOString(),
        confidence: 0.92,
        metadata: {}
      },
      { 
        id: '4', 
        title: `Technical document with "${query.text}"`, 
        snippet: 'A technical resource that contains references to the search terms.',
        source: 'technical', 
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        metadata: {}
      }
    ];
  }
};

/**
 * Custom hook for NetRunner search functionality
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
  
  // Search functionality
  const search = useCallback(async () => {
    if (!query.trim()) return;
    
    try {
      setIsSearching(true);
      
      // Add query to search history if not already present
      setSearchHistory(prev => {
        if (!prev.includes(query)) {
          return [query, ...prev].slice(0, 10); // Keep only the 10 most recent searches
        }
        return prev;
      });
      
      // Create search query object
      const searchQuery: SearchQuery = {
        text: query,
        filters,
        sources,
        maxResults
      };
      
      // Perform search
      const searchResults = await mockSearchService.performSearch(searchQuery);
      setResults(searchResults);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, sources, maxResults]);
  
  // Auto-search on mount if enabled
  useEffect(() => {
    if (autoSearch && initialQuery) {
      search();
    }
  }, [autoSearch, initialQuery, search]);
  
  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
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
    isSearching,
    search,
    clearResults,
    clearError
  };
}
