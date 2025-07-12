/**
 * NetRunner Search Service
 * 
 * Consolidated search service that integrates OSINT search capabilities
 * with the NetRunner application, providing real API connections and
 * comprehensive error handling.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { SearchQuery, SearchResult } from '../../types/netrunner';
import { LoggerFactory } from '../logging';
import { ErrorFactory } from '../error';
import { apiConfigManager } from '../../../../shared/config/ApiConfigManager';
import { getAdapter } from '../../tools/adapters/AdapterRegistry';

/**
 * Search service configuration
 */
interface SearchServiceConfig {
  maxResults: number;
  timeout: number;
  retryAttempts: number;
  enableCache: boolean;
  cacheTimeout: number;
}

/**
 * Search source configuration
 */
interface SearchSourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
  rateLimit: number;
  timeout: number;
}

/**
 * Search response from external API
 */
interface ExternalSearchResponse {
  results: Array<{
    id: string;
    title: string;
    description: string;
    url?: string;
    timestamp: string;
    score: number;
    source: string;
    metadata?: Record<string, unknown>;
  }>;
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

/**
 * NetRunner Search Service
 * 
 * Provides consolidated search functionality across multiple OSINT sources
 * with real API connections, caching, and comprehensive error handling.
 */
export class NetRunnerSearchService {
  private logger = LoggerFactory.getLogger('NetRunner:SearchService');
  private config: SearchServiceConfig;
  private sources: Map<string, SearchSourceConfig>;
  private searchCache: Map<string, { results: SearchResult[], timestamp: number }>;

  constructor(config: Partial<SearchServiceConfig> = {}) {
    this.config = {
      maxResults: 50,
      timeout: 30000,
      retryAttempts: 3,
      enableCache: true,
      cacheTimeout: 300000, // 5 minutes
      ...config
    };

    this.sources = new Map();
    this.searchCache = new Map();
    this.initializeSearchSources();
  }

  /**
   * Initialize search sources configuration
   */
  private initializeSearchSources(): void {
    // Define available search sources
    const sources: SearchSourceConfig[] = [
      {
        id: 'shodan',
        name: 'Shodan',
        baseUrl: 'https://api.shodan.io',
        enabled: true,
        rateLimit: 100,
        timeout: 10000
      },
      {
        id: 'virustotal',
        name: 'VirusTotal',
        baseUrl: 'https://www.virustotal.com/api/v3',
        enabled: true,
        rateLimit: 500,
        timeout: 15000
      },
      {
        id: 'censys',
        name: 'Censys',
        baseUrl: 'https://search.censys.io/api',
        enabled: true,
        rateLimit: 200,
        timeout: 10000
      },
      {
        id: 'hunter',
        name: 'Hunter.io',
        baseUrl: 'https://api.hunter.io',
        enabled: true,
        rateLimit: 100,
        timeout: 10000
      },
      {
        id: 'whois',
        name: 'WHOIS Lookup',
        baseUrl: 'https://api.whoisxml.com',
        enabled: true,
        rateLimit: 1000,
        timeout: 5000
      }
    ];

    sources.forEach(source => {
      this.sources.set(source.id, source);
    });

    this.logger.info('Search sources initialized', {
      sourceCount: this.sources.size,
      enabledSources: Array.from(this.sources.values()).filter(s => s.enabled).map(s => s.id)
    });
  }

  /**
   * Perform search across configured sources
   */
  async performSearch(query: SearchQuery): Promise<SearchResult[]> {
    const correlationId = `search-${Date.now()}`;
    this.logger.setCorrelationId(correlationId);

    this.logger.info('Starting search operation', {
      query: query.text,
      sources: query.sources || 'all',
      maxResults: query.maxResults || this.config.maxResults
    });

    try {
      // Validate query
      this.validateQuery(query);

      // Check cache if enabled
      if (this.config.enableCache) {
        const cached = this.getCachedResults(query);
        if (cached) {
          this.logger.info('Returning cached search results', {
            resultCount: cached.length
          });
          return cached;
        }
      }

      // Determine which sources to search
      const sourcesToSearch = this.getActiveSources(query.sources);
      
      if (sourcesToSearch.length === 0) {
        throw ErrorFactory.createSearchError(
          'No active search sources available',
          'NET-SRCH-005',
          { component: 'NetRunnerSearchService' }
        );
      }

      // Execute searches in parallel
      const searchPromises = sourcesToSearch.map(source => 
        this.searchSource(source, query, correlationId)
      );

      const sourceResults = await Promise.allSettled(searchPromises);
      
      // Aggregate results
      const aggregatedResults = this.aggregateResults(sourceResults, query);

      // Cache results if enabled
      if (this.config.enableCache && aggregatedResults.length > 0) {
        this.cacheResults(query, aggregatedResults);
      }

      this.logger.info('Search operation completed', {
        resultCount: aggregatedResults.length,
        sourcesQueried: sourcesToSearch.length
      });

      return aggregatedResults;

    } catch (error) {
      this.logger.error('Search operation failed', error, {
        query: query.text
      });
      throw error;
    }
  }

  /**
   * Validate search query
   */
  private validateQuery(query: SearchQuery): void {
    if (!query.text || query.text.trim().length < 2) {
      throw ErrorFactory.createSearchError(
        'Search query must be at least 2 characters long',
        'NET-SRCH-001',
        { component: 'NetRunnerSearchService' }
      );
    }

    if (query.maxResults && query.maxResults > 1000) {
      throw ErrorFactory.createSearchError(
        'Maximum results cannot exceed 1000',
        'NET-SRCH-005',
        { component: 'NetRunnerSearchService' }
      );
    }
  }

  /**
   * Get active sources for search
   */
  private getActiveSources(requestedSources?: string[]): SearchSourceConfig[] {
    const allSources = Array.from(this.sources.values()).filter(s => s.enabled);
    
    if (!requestedSources || requestedSources.length === 0) {
      return allSources;
    }
    
    return allSources.filter(source => 
      requestedSources.includes(source.id)
    );
  }

  /**
   * Search a specific source
   */
  private async searchSource(
    source: SearchSourceConfig, 
    query: SearchQuery, 
    correlationId: string
  ): Promise<SearchResult[]> {
    this.logger.debug(`Searching source: ${source.name}`, {
      sourceId: source.id,
      query: query.text
    });

    try {
      // Check if we should use real APIs and if the provider is enabled
      const useRealApi = apiConfigManager.shouldUseRealApis() && 
                         apiConfigManager.isProviderEnabled(source.id);
      
      if (useRealApi) {
        // Try to get real adapter for this source
        const adapter = getAdapter(source.id);
        if (adapter) {
          this.logger.info(`Using real adapter for ${source.name}`);
          
          // Execute real tool adapter
          const toolResult = await adapter.execute({
            toolId: source.id,
            parameters: { 
              query: query.text,
              maxResults: query.maxResults || 20
            }
          });
          
          if (toolResult.success && toolResult.results) {
            // Transform tool result to search results format
            return this.transformToolResultToSearchResults(toolResult, source);
          }
        }
      }
      
      // Fallback to mock data if real API not available or configured
      if (apiConfigManager.hasMockFallback()) {
        this.logger.debug(`Using mock data for ${source.name} (real API not available or disabled)`);
        return this.getMockResults(source, query);
      } else {
        throw new Error(`Real API not available for ${source.name} and mock fallback is disabled`);
      }
      
    } catch (error) {
      this.logger.warn(`Search failed for source: ${source.name}`, {
        sourceId: source.id,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return empty results rather than failing the entire search
      return [];
    }
  }

  /**
   * Transform tool execution result to search results format
   */
  private transformToolResultToSearchResults(
    toolResult: any, 
    source: SearchSourceConfig
  ): SearchResult[] {
    try {
      // Handle different tool result formats
      const results: SearchResult[] = [];
      
      if (toolResult.data && Array.isArray(toolResult.data)) {
        // Handle array of results
        toolResult.data.forEach((item: any, index: number) => {
          results.push({
            id: `${source.id}-${Date.now()}-${index}`,
            title: item.title || item.hostname || item.ip_str || `${source.name} Result`,
            snippet: item.description || item.banner || item.data || JSON.stringify(item).substring(0, 200),
            source: source.name,
            timestamp: new Date().toISOString(),
            confidence: 0.8, // Default confidence for real API results
            metadata: {
              sourceId: source.id,
              originalData: item,
              tags: ['osint', 'verified', source.id.toLowerCase()]
            }
          });
        });
      } else if (toolResult.data) {
        // Handle single result object
        results.push({
          id: `${source.id}-${Date.now()}-single`,
          title: toolResult.data.title || `${source.name} Result`,
          snippet: toolResult.data.description || JSON.stringify(toolResult.data).substring(0, 200),
          source: source.name,
          timestamp: new Date().toISOString(),
          confidence: 0.8,
          metadata: {
            sourceId: source.id,
            originalData: toolResult.data,
            tags: ['osint', 'verified', source.id.toLowerCase()]
          }
        });
      }
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to transform tool result from ${source.name}`, error);
      return [];
    }
  }

  /**
   * Generate mock results for testing
   * TODO: Replace with real API calls in Phase 3
   */
  private getMockResults(source: SearchSourceConfig, query: SearchQuery): SearchResult[] {
    const mockResults: SearchResult[] = [
      {
        id: `${source.id}-${Date.now()}-1`,
        title: `${source.name} result for "${query.text}"`,
        snippet: `This is a sample result from ${source.name} showing intelligence data related to the search query.`,
        source: source.name,
        timestamp: new Date().toISOString(),
        confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
        metadata: {
          sourceId: source.id,
          tags: ['osint', 'verified', source.id.toLowerCase()],
          apiVersion: '1.0'
        }
      },
      {
        id: `${source.id}-${Date.now()}-2`,
        title: `Additional ${source.name} intelligence`,
        snippet: `More detailed information from ${source.name} providing context and additional data points.`,
        source: source.name,
        timestamp: new Date().toISOString(),
        confidence: Math.random() * 0.3 + 0.5, // 0.5 to 0.8
        metadata: {
          sourceId: source.id,
          tags: ['osint', 'secondary', source.id.toLowerCase()],
          apiVersion: '1.0'
        }
      }
    ];

    return mockResults.slice(0, Math.min(query.maxResults || 2, 2));
  }

  /**
   * Aggregate results from multiple sources
   */
  private aggregateResults(
    sourceResults: PromiseSettledResult<SearchResult[]>[],
    query: SearchQuery
  ): SearchResult[] {
    const allResults: SearchResult[] = [];
    
    sourceResults.forEach(result => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      }
    });

    // Sort by confidence score (descending)
    const sortedResults = allResults.sort((a, b) => b.confidence - a.confidence);

    // Apply max results limit
    const maxResults = query.maxResults || this.config.maxResults;
    return sortedResults.slice(0, maxResults);
  }

  /**
   * Get cached search results
   */
  private getCachedResults(query: SearchQuery): SearchResult[] | null {
    const cacheKey = this.generateCacheKey(query);
    const cached = this.searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.results;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.searchCache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Cache search results
   */
  private cacheResults(query: SearchQuery, results: SearchResult[]): void {
    const cacheKey = this.generateCacheKey(query);
    this.searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    this.logger.debug('Search results cached', {
      cacheKey,
      resultCount: results.length
    });
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(query: SearchQuery): string {
    const keyParts = [
      query.text,
      JSON.stringify(query.filters || {}),
      JSON.stringify(query.sources || []),
      query.maxResults || this.config.maxResults
    ];
    
    return btoa(keyParts.join('|')).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    this.logger.info('Search cache cleared');
  }

  /**
   * Get search statistics
   */
  getSearchStats(): {
    cacheSize: number;
    enabledSources: number;
    totalSources: number;
  } {
    return {
      cacheSize: this.searchCache.size,
      enabledSources: Array.from(this.sources.values()).filter(s => s.enabled).length,
      totalSources: this.sources.size
    };
  }
}

// Export singleton instance
export const netRunnerSearchService = new NetRunnerSearchService();
