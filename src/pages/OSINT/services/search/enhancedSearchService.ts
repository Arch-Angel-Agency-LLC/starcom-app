/**
 * Enhanced OSINT Search Service
 * 
 * Integrates NetRunner's unified API configuration with OSINT search capabilities.
 * This service bridges the mock OSINT implementation with real API integrations
 * from NetRunner, providing genuine intelligence gathering capabilities.
 * 
 * @author Enhanced NetRunner Integration
 * @date July 11, 2025
 */

import { osintApi } from '../api/osintApi';
import osintEndpoints from '../api/endpoints';
import { SearchQuery, SearchResult } from '../../types/osint';
import { apiConfigManager } from '../../../../shared/config/ApiConfigManager';
import { getAdapter } from '../../../../applications/netrunner/tools/adapters/AdapterRegistry';
import { SearchQuery as NetRunnerSearchQuery, SearchResult as NetRunnerSearchResult } from '../../../../applications/netrunner/types/netrunner';

/**
 * Enhanced search provider that can use both OSINT mock APIs and real NetRunner adapters
 */
interface EnhancedSearchProvider {
  id: string;
  name: string;
  type: 'osint_api' | 'netrunner_adapter';
  endpoint?: string; // For OSINT API providers
  adapterId?: string; // For NetRunner adapter providers
  requiresAuth: boolean;
  enabled: boolean;
  weight: number;
  realApiAvailable: boolean;
}

/**
 * Result transformation utilities
 */
class ResultTransformer {
  /**
   * Transform NetRunner search result to OSINT search result
   */
  static netRunnerToOSINT(result: NetRunnerSearchResult): SearchResult {
    return {
      id: result.id,
      type: 'entity', // Default to entity type
      title: result.title,
      snippet: result.snippet || '',
      source: result.source,
      timestamp: result.timestamp,
      confidence: result.confidence || 0.8,
      url: result.url,
      entityIds: result.entityIds || [],
      metadata: {
        ...result.metadata,
        originalSource: 'netrunner',
        tool: result.source
      }
    };
  }

  /**
   * Transform OSINT search query to NetRunner search query
   */
  static osintToNetRunner(query: SearchQuery): NetRunnerSearchQuery {
    return {
      text: query.text,
      filters: query.filters || {},
      sources: query.sources || [],
      maxResults: query.maxResults || 50,
      timeRange: query.timeRange,
      authenticated: false // Will be set by the service
    };
  }
}

/**
 * Enhanced Search Service with real API integration
 */
class EnhancedSearchService {
  private providers: EnhancedSearchProvider[] = [];
  
  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize search providers based on available APIs and adapters
   */
  private initializeProviders(): void {
    const osintProviders = apiConfigManager.getOSINTProviders();
    
    this.providers = [
      // Original OSINT API providers (mock/fallback)
      {
        id: 'entities',
        name: 'Entity Database',
        type: 'osint_api',
        endpoint: osintEndpoints.search.entities,
        requiresAuth: false,
        enabled: true,
        weight: 0.6,
        realApiAvailable: false
      },
      {
        id: 'relationships',
        name: 'Relationship Network',
        type: 'osint_api',
        endpoint: osintEndpoints.search.relationships,
        requiresAuth: false,
        enabled: true,
        weight: 0.5,
        realApiAvailable: false
      },
      
      // NetRunner adapter providers (real APIs)
      ...osintProviders.map(provider => ({
        id: provider.id,
        name: provider.name,
        type: 'netrunner_adapter' as const,
        adapterId: provider.id,
        requiresAuth: provider.requiresAuth,
        enabled: provider.enabled,
        weight: this.getProviderWeight(provider.id),
        realApiAvailable: provider.enabled
      }))
    ];

    console.log('Enhanced OSINT Search Service initialized:', {
      totalProviders: this.providers.length,
      enabledProviders: this.providers.filter(p => p.enabled).length,
      realApiProviders: this.providers.filter(p => p.realApiAvailable).length
    });
  }

  /**
   * Get provider weight for ranking
   */
  private getProviderWeight(providerId: string): number {
    const weights: Record<string, number> = {
      'shodan': 1.0,
      'virustotal': 0.9,
      'censys': 0.8,
      'theharvester': 0.7,
      'hunter': 0.6
    };
    return weights[providerId] || 0.5;
  }

  /**
   * Perform search across all available providers
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const enabledProviders = this.providers.filter(p => p.enabled);
    
    if (enabledProviders.length === 0) {
      console.warn('No search providers enabled');
      return [];
    }

    // Execute searches in parallel
    const searchPromises = enabledProviders.map(provider => 
      this.searchProvider(provider, query)
    );

    try {
      const allResults = await Promise.allSettled(searchPromises);
      
      // Combine and deduplicate results
      const combinedResults: SearchResult[] = [];
      
      allResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const provider = enabledProviders[index];
          const providerResults = result.value.map(r => ({
            ...r,
            metadata: {
              ...r.metadata,
              provider: provider.id,
              providerName: provider.name,
              weight: provider.weight,
              realApi: provider.realApiAvailable
            }
          }));
          combinedResults.push(...providerResults);
        } else if (result.status === 'rejected') {
          console.error(`Search failed for provider ${enabledProviders[index].name}:`, result.reason);
        }
      });

      // Sort by relevance (weight * confidence)
      combinedResults.sort((a, b) => {
        const weightA = (a.metadata?.weight as number) || 0.5;
        const weightB = (b.metadata?.weight as number) || 0.5;
        const scoreA = weightA * a.confidence;
        const scoreB = weightB * b.confidence;
        return scoreB - scoreA;
      });

      return combinedResults.slice(0, query.maxResults || 50);
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
  }

  /**
   * Search a specific provider
   */
  private async searchProvider(provider: EnhancedSearchProvider, query: SearchQuery): Promise<SearchResult[]> {
    if (provider.type === 'netrunner_adapter') {
      return this.searchNetRunnerAdapter(provider, query);
    } else {
      return this.searchOSINTApi(provider, query);
    }
  }

  /**
   * Search using NetRunner adapter (real API)
   */
  private async searchNetRunnerAdapter(provider: EnhancedSearchProvider, query: SearchQuery): Promise<SearchResult[]> {
    if (!provider.adapterId) {
      throw new Error(`No adapter ID specified for provider ${provider.id}`);
    }

    const adapter = getAdapter(provider.adapterId);
    if (!adapter) {
      console.warn(`Adapter ${provider.adapterId} not found`);
      return [];
    }

    try {
      // Transform query format
      const netRunnerQuery = ResultTransformer.osintToNetRunner(query);
      
      // Create execution request
      const executionRequest = {
        toolId: provider.adapterId,
        parameters: {
          query: netRunnerQuery.text,
          maxResults: netRunnerQuery.maxResults
        },
        requestId: `search-${Date.now()}-${Math.random()}`,
        timestamp: Date.now()
      };
      
      // Execute search via adapter
      const response = await adapter.execute(executionRequest);
      
      // Extract results from response
      if (response.status === 'success' && response.data) {
        const rawResults = Array.isArray(response.data) ? response.data : [response.data];
        // Transform results back to OSINT format
        return rawResults.map((result: Record<string, unknown>) => this.transformAdapterResult(result, provider.id));
      }
      
      return [];
    } catch (error) {
      console.error(`NetRunner adapter search failed for ${provider.adapterId}:`, error);
      return [];
    }
  }
  
  /**
   * Transform adapter result to OSINT SearchResult
   */
  private transformAdapterResult(result: Record<string, unknown>, providerId: string): SearchResult {
    return {
      id: (result.id as string) || `${providerId}-${Date.now()}-${Math.random()}`,
      type: 'entity',
      title: (result.title as string) || (result.name as string) || 'Unknown',
      snippet: (result.description as string) || (result.summary as string) || (result.snippet as string) || '',
      source: providerId,
      timestamp: (result.timestamp as string) || new Date().toISOString(),
      confidence: (result.confidence as number) || 0.8,
      url: result.url as string,
      entityIds: (result.entityIds as string[]) || [],
      metadata: {
        ...result,
        originalSource: 'netrunner',
        tool: providerId
      }
    };
  }

  /**
   * Search using OSINT API (mock/fallback)
   */
  private async searchOSINTApi(provider: EnhancedSearchProvider, query: SearchQuery): Promise<SearchResult[]> {
    if (!provider.endpoint) {
      throw new Error(`No endpoint specified for provider ${provider.id}`);
    }

    try {
      // Build query parameters into the URL
      const params = new URLSearchParams({
        q: query.text,
        filters: JSON.stringify(query.filters || {}),
        sources: query.sources?.join(',') || '',
        maxResults: query.maxResults?.toString() || '50',
      });
      
      const endpoint = `${provider.endpoint}?${params.toString()}`;
      
      const result = await osintApi.get<SearchResult[]>(endpoint);

      if (result.success && result.data) {
        return result.data;
      } else {
        console.warn(`OSINT API search failed for ${provider.id}:`, result.error);
        return [];
      }
    } catch (error) {
      console.error(`OSINT API search failed for ${provider.id}:`, error);
      return [];
    }
  }

  /**
   * Get available providers
   */
  getProviders(): EnhancedSearchProvider[] {
    return this.providers;
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders(): EnhancedSearchProvider[] {
    return this.providers.filter(p => p.enabled);
  }

  /**
   * Get providers with real API access
   */
  getRealApiProviders(): EnhancedSearchProvider[] {
    return this.providers.filter(p => p.realApiAvailable);
  }

  /**
   * Refresh provider configuration
   */
  refreshProviders(): void {
    this.initializeProviders();
  }
}

// Export singleton instance
export const enhancedSearchService = new EnhancedSearchService();
export default enhancedSearchService;
