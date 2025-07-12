/**
 * OSINT Search Service
 * 
 * Provides universal search functionality across all OSINT data sources.
 * Enhanced to integrate with NetRunner's unified API configuration for real intelligence gathering.
 */

import { osintApi, ApiResponse } from '../api/osintApi';
import osintEndpoints from '../api/endpoints';
import { SearchQuery, SearchResult } from '../../types/osint';
import { enhancedSearchService } from './enhancedSearchService';

/**
 * Search provider configuration
 */
interface SearchProviderConfig {
  id: string;
  name: string;
  endpoint: string;
  requiresAuth: boolean;
  enabled: boolean;
  weight: number; // For result ranking
}

/**
 * Available search providers (for backward compatibility)
 */
const searchProviders: SearchProviderConfig[] = [
  {
    id: 'entities',
    name: 'Entity Database',
    endpoint: osintEndpoints.search.entities,
    requiresAuth: false,
    enabled: true,
    weight: 1.0,
  },
  {
    id: 'relationships',
    name: 'Relationship Network',
    endpoint: osintEndpoints.search.relationships,
    requiresAuth: false,
    enabled: true,
    weight: 0.8,
  },
  {
    id: 'events',
    name: 'Timeline Events',
    endpoint: osintEndpoints.search.events,
    requiresAuth: false,
    enabled: true,
    weight: 0.7,
  },
  {
    id: 'darkweb',
    name: 'Dark Web Monitor',
    endpoint: osintEndpoints.search.darkweb,
    requiresAuth: true, // Dark web search requires authentication
    enabled: true,
    weight: 0.9,
  },
];

/**
 * Enhanced Search service for OSINT operations
 * Now uses the enhanced search service that integrates NetRunner adapters
 */
class SearchService {
  private providers: SearchProviderConfig[];
  private useEnhancedSearch: boolean = true;
  
  constructor(providers: SearchProviderConfig[] = searchProviders) {
    this.providers = providers;
  }
  
  /**
   * Execute a universal search across all enabled providers
   * Now routes through enhanced search service for real API integration
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // For empty queries, return empty results
    if (!query.text.trim()) {
      return [];
    }

    // Use enhanced search service if available and enabled
    if (this.useEnhancedSearch) {
      try {
        console.log('🔍 Using enhanced search service with real API integration');
        return await enhancedSearchService.search(query);
      } catch (error) {
        console.warn('Enhanced search failed, falling back to legacy search:', error);
        // Fall back to legacy search on error
      }
    }

    // Legacy search implementation (for fallback)
    return this.legacySearch(query);
  }

  /**
   * Legacy search implementation (maintained for fallback)
   */
  private async legacySearch(query: SearchQuery): Promise<SearchResult[]> {
    // Determine which providers to use based on filters and authentication
    const enabledProviders = this.providers.filter(provider => {
      // Skip disabled providers
      if (!provider.enabled) return false;
      
      // Skip providers that require auth if query doesn't have auth
      if (provider.requiresAuth && !query.authenticated) return false;
      
      // If specific sources are requested, only use those
      if (query.sources && query.sources.length > 0) {
        return query.sources.includes(provider.id);
      }
      
      return true;
    });
    
    if (enabledProviders.length === 0) {
      throw new Error('No valid search providers available for this query');
    }
    
    // For testing purposes, return mock data until backend is implemented
    if (process.env.NODE_ENV === 'development') {
      // Randomly throw an error for testing purposes (~10% of the time)
      if (Math.random() < 0.1) {
        throw new Error('Simulated error: Failed to retrieve search results');
      }
      return this.getMockResults(query);
    }
    
    try {
      // Execute searches in parallel
      const searchPromises = enabledProviders.map(provider => 
        osintApi.post<SearchResult[]>(provider.endpoint, { ...query } as Record<string, unknown>, {
          requiresAuth: provider.requiresAuth
        }).catch(error => {
          console.error(`Error searching provider ${provider.id}:`, error);
          // Return a failed response with context
          return { 
            success: false, 
            error: `Failed to search ${provider.name}: ${error.message || 'Unknown error'}`,
            data: null 
          } as ApiResponse<SearchResult[]>;
        })
      );
      
      // Wait for all searches to complete
      const results = await Promise.all(searchPromises);
      
      // Check if all requests failed
      const allFailed = results.every(result => !result.success);
      if (allFailed) {
        const errors = results
          .map(result => result.error)
          .filter(Boolean)
          .join('; ');
        throw new Error(`All search providers failed: ${errors}`);
      }
      
      // Combine and rank results
      let allResults: SearchResult[] = [];
      
      results.forEach((result, index) => {
        if (result.success && result.data) {
          // Apply provider weight to results
          const providerWeight = enabledProviders[index].weight;
          const weightedResults = result.data.map(item => ({
            ...item,
            score: (item.score || 0) * providerWeight
          }));
          
          allResults = [...allResults, ...weightedResults];
        }
      });
      
      // Sort by score (descending)
      allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Apply pagination if requested
      if (query.maxResults) {
        allResults = allResults.slice(0, query.maxResults);
      }
      
      return allResults;
    } catch (error) {
      console.error('Error executing search:', error);
      throw error; // Re-throw to be handled by the hook
    }
  }
  
  /**
   * Get search history for the current user
   */
  async getSearchHistory(): Promise<string[]> {
    // For testing purposes, return mock data
    if (process.env.NODE_ENV === 'development') {
      // Randomly throw an error for testing purposes (~10% of the time)
      if (Math.random() < 0.1) {
        throw new Error('Simulated error: Failed to retrieve search history');
      }
      
      return [
        'Satellite Communications',
        'Orbital Defense Network',
        'Martian Supply Chain',
        'Alpha Centauri Trade Routes',
        'Deep Space Monitoring'
      ];
    }
    
    try {
      const result = await osintApi.get<string[]>('/search/history', {
        requiresAuth: true
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch search history');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching search history:', error);
      throw error; // Re-throw to be handled by the hook
    }
  }

  /**
   * Enable or disable enhanced search
   */
  setEnhancedSearch(enabled: boolean): void {
    this.useEnhancedSearch = enabled;
  }

  /**
   * Check if enhanced search is enabled
   */
  isEnhancedSearchEnabled(): boolean {
    return this.useEnhancedSearch;
  }

  /**
   * Get enhanced search service providers
   */
  getEnhancedProviders() {
    return enhancedSearchService.getProviders();
  }

  /**
   * Get enhanced search service real API providers
   */
  getRealApiProviders() {
    return enhancedSearchService.getRealApiProviders();
  }
  
  /**
   * Generate mock search results for development
   */
  private getMockResults(query: SearchQuery): SearchResult[] {
    // Simple mock data generator
    const results: SearchResult[] = [];
    
    // Generate 5-15 mock results
    const count = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < count; i++) {
      // Create mock entities
      if (i % 3 === 0) {
        results.push({
          id: `entity-${i}`,
          type: 'entity',
          title: `Entity related to "${query.text}"`,
          snippet: `This entity matches your search for "${query.text}" with high confidence.`,
          source: 'Entity Database',
          timestamp: new Date().toISOString(),
          confidence: 0.7 + (Math.random() * 0.3),
          score: 0.8 + (Math.random() * 0.2),
          url: '#',
          entityIds: [`ent-${i}`],
          metadata: {}
        });
      } 
      // Create mock events
      else if (i % 3 === 1) {
        results.push({
          id: `event-${i}`,
          type: 'event',
          title: `Timeline event for "${query.text}"`,
          snippet: `This event occurred on ${new Date().toLocaleDateString()} and relates to "${query.text}".`,
          source: 'Timeline Database',
          timestamp: new Date().toISOString(),
          confidence: 0.6 + (Math.random() * 0.3),
          score: 0.7 + (Math.random() * 0.2),
          url: '#',
          entityIds: [`ent-${i * 2}`, `ent-${i * 2 + 1}`],
          metadata: {}
        });
      } 
      // Create mock relationships
      else {
        results.push({
          id: `rel-${i}`,
          type: 'relationship',
          title: `Connection related to "${query.text}"`,
          snippet: `This relationship connects entities involved with "${query.text}".`,
          source: 'Relationship Network',
          timestamp: new Date().toISOString(),
          confidence: 0.5 + (Math.random() * 0.3),
          score: 0.6 + (Math.random() * 0.2),
          url: '#',
          entityIds: [`ent-${i * 3}`, `ent-${i * 3 + 2}`],
          metadata: {}
        });
      }
    }
    
    return results;
  }
}

// Create singleton instance
export const searchService = new SearchService();

// Export types
export type { SearchProviderConfig };
