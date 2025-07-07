/**
 * useQueryCache - A React hook for caching query results
 * 
 * This hook provides an idiomatic React approach to query result caching.
 * It replaces the caching functionality from the PerformanceOptimizationManager
 * with a React-specific implementation that integrates with the component lifecycle.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { IntelQueryOptions } from '../types/intelDataModels';

// Define cache storage outside of the hook for persistence across renders
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
};

// Cache storage with generics to support different result types
const queryCache = new Map<string, CacheEntry<any>>();

// Default TTL - 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// Default max cache size
const DEFAULT_MAX_CACHE_SIZE = 100;

interface QueryCacheConfig {
  ttl?: number;                 // Time to live in milliseconds
  maxSize?: number;             // Maximum number of entries in cache
  persistToStorage?: boolean;   // Whether to persist cache to localStorage
  storageKey?: string;          // Key to use for localStorage
}

interface QueryCacheResult<T> {
  data: T | null;               // The cached data or null if not found
  isLoading: boolean;           // Whether the data is currently being fetched
  error: Error | null;          // Any error that occurred during fetching
  isCached: boolean;            // Whether the data was retrieved from cache
  refresh: () => Promise<void>; // Function to force a refresh of the data
  cacheStats: {                 // Statistics about the cache
    hitCount: number;
    missCount: number;
    hitRate: number;
    entryCount: number;
  };
}

/**
 * Calculate a cache key from a query object
 */
function calculateCacheKey(query: IntelQueryOptions): string {
  return JSON.stringify(query);
}

/**
 * Calculate the complexity of a query to determine if it should be cached
 */
function calculateQueryComplexity(query: IntelQueryOptions): number {
  let complexity = 0;
  
  // Base complexity for any query
  complexity += 1;
  
  // Add complexity for each filter type
  if (query.types && query.types.length > 0) complexity += query.types.length;
  if (query.fullTextSearch) complexity += 3; // Full text search is expensive
  if (query.startDate || query.endDate) complexity += 2;
  if (query.relationshipDepth && query.relationshipDepth > 1) complexity += query.relationshipDepth;
  if (query.graphTraversal) complexity += 5; // Graph traversal is very expensive
  
  // Fields add complexity
  if (query.fields) {
    complexity += Object.keys(query.fields).length;
  }
  
  return complexity;
}

/**
 * Determine if a query result should be cached based on its characteristics
 */
function shouldCacheQueryResult(
  query: IntelQueryOptions, 
  resultSize: number
): boolean {
  const complexity = calculateQueryComplexity(query);
  
  // Always cache complex queries
  if (complexity > 5) return true;
  
  // Cache large result sets, even if the query is simple
  if (resultSize > 100) return true;
  
  // Don't cache very simple queries with small result sets
  if (complexity < 3 && resultSize < 20) return false;
  
  // Cache by default for other cases
  return true;
}

/**
 * Prune the cache when it exceeds the maximum size
 */
function pruneCache(maxSize: number): void {
  if (queryCache.size <= maxSize) return;
  
  // Convert to array for sorting
  const entries = Array.from(queryCache.entries());
  
  // Sort by priority (combination of access count and recency)
  entries.sort(([, a], [, b]) => {
    const scoreA = a.accessCount * 10 - (Date.now() - a.lastAccessed) / 1000;
    const scoreB = b.accessCount * 10 - (Date.now() - b.lastAccessed) / 1000;
    return scoreB - scoreA; // Higher score = higher priority
  });
  
  // Keep only the highest priority entries
  const entriesToKeep = entries.slice(0, maxSize);
  
  // Clear the cache and add back the entries to keep
  queryCache.clear();
  entriesToKeep.forEach(([key, value]) => {
    queryCache.set(key, value);
  });
}

/**
 * Save the cache to localStorage
 */
function persistCache(storageKey: string): void {
  try {
    const serialized = JSON.stringify(Array.from(queryCache.entries()));
    localStorage.setItem(storageKey, serialized);
  } catch (error) {
    console.error('Failed to persist query cache:', error);
  }
}

/**
 * Load the cache from localStorage
 */
function loadCacheFromStorage(storageKey: string, ttl: number): void {
  try {
    const serialized = localStorage.getItem(storageKey);
    if (!serialized) return;
    
    const entries = JSON.parse(serialized);
    if (!Array.isArray(entries)) return;
    
    const now = Date.now();
    
    entries.forEach(([key, value]: [string, CacheEntry<any>]) => {
      // Skip expired entries
      if (now - value.timestamp > ttl) return;
      
      queryCache.set(key, value);
    });
  } catch (error) {
    console.error('Failed to load query cache from storage:', error);
  }
}

/**
 * A React hook for caching query results
 * 
 * @param queryFn - Function that performs the actual query
 * @param query - The query parameters
 * @param config - Configuration options for caching
 * @returns The query result and cache information
 */
export function useQueryCache<T>(
  queryFn: (query: IntelQueryOptions) => Promise<T>,
  query: IntelQueryOptions,
  config: QueryCacheConfig = {}
): QueryCacheResult<T> {
  // Extract config with defaults
  const { 
    ttl = DEFAULT_TTL, 
    maxSize = DEFAULT_MAX_CACHE_SIZE,
    persistToStorage = false,
    storageKey = 'intelDataCore.queryCache'
  } = config;
  
  // State for tracking cache statistics
  const [stats, setStats] = useState({
    hitCount: 0,
    missCount: 0,
    hitRate: 0,
    entryCount: queryCache.size
  });
  
  // State for the current request
  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    isCached: boolean;
  }>({
    data: null,
    isLoading: true,
    error: null,
    isCached: false
  });
  
  // Calculate the cache key for this query
  const cacheKey = useMemo(() => calculateCacheKey(query), [query]);
  
  // Load cache from storage on initial render
  useEffect(() => {
    if (persistToStorage) {
      loadCacheFromStorage(storageKey, ttl);
    }
  }, [persistToStorage, storageKey, ttl]);
  
  // Function to execute the query and update the cache
  const executeQuery = useCallback(async (skipCache = false): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check cache first (unless skipping)
      if (!skipCache) {
        const cached = queryCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < ttl) {
          // Update access information
          cached.accessCount += 1;
          cached.lastAccessed = Date.now();
          queryCache.set(cacheKey, cached);
          
          // Update state with cached data
          setState({
            data: cached.data,
            isLoading: false,
            error: null,
            isCached: true
          });
          
          // Update statistics
          setStats(prev => {
            const newHitCount = prev.hitCount + 1;
            const total = newHitCount + prev.missCount;
            return {
              hitCount: newHitCount,
              missCount: prev.missCount,
              hitRate: total > 0 ? newHitCount / total : 0,
              entryCount: queryCache.size
            };
          });
          
          return;
        }
      }
      
      // Cache miss or skip - execute the query
      const result = await queryFn(query);
      
      // Determine if we should cache this result
      const resultSize = Array.isArray(result) ? result.length : 1;
      const shouldCache = shouldCacheQueryResult(query, resultSize);
      
      // Cache the result if appropriate
      if (shouldCache) {
        queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          accessCount: 1,
          lastAccessed: Date.now()
        });
        
        // Prune cache if needed
        pruneCache(maxSize);
        
        // Persist to storage if enabled
        if (persistToStorage) {
          persistCache(storageKey);
        }
      }
      
      // Update state with fresh data
      setState({
        data: result,
        isLoading: false,
        error: null,
        isCached: false
      });
      
      // Update statistics
      setStats(prev => {
        const newMissCount = prev.missCount + 1;
        const total = prev.hitCount + newMissCount;
        return {
          hitCount: prev.hitCount,
          missCount: newMissCount,
          hitRate: total > 0 ? prev.hitCount / total : 0,
          entryCount: queryCache.size
        };
      });
      
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        isCached: false
      });
    }
  }, [cacheKey, maxSize, persistToStorage, query, queryFn, storageKey, ttl]);
  
  // Execute the query on initial render and when dependencies change
  useEffect(() => {
    executeQuery();
  }, [executeQuery]);
  
  // Function to force a refresh of the data
  const refresh = useCallback(async (): Promise<void> => {
    return executeQuery(true);
  }, [executeQuery]);
  
  // Return result with cache stats and refresh function
  return {
    ...state,
    refresh,
    cacheStats: stats
  };
}
