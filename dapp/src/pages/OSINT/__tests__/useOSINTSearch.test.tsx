import { renderHook, act, waitFor } from '@testing-library/react';
import { expect, jest, describe, it, beforeEach } from '@jest/globals';
import { useOSINTSearch } from '../hooks/useOSINTSearch';
import { searchService } from '../services/search/searchService';
import { SearchResult } from '../types/osint';

// Mock the searchService
jest.mock('../services/search/searchService', () => ({
  searchService: {
    search: jest.fn().mockImplementation(() => Promise.resolve([])),
    getSearchHistory: jest.fn().mockImplementation(() => Promise.resolve([]))
  }
}));

describe('useOSINTSearch', () => {
  const mockSearchResults: SearchResult[] = [
    {
      id: 'result-1',
      type: 'entity',
      title: 'John Doe',
      snippet: 'Test snippet about John Doe',
      source: 'Entity Database',
      timestamp: new Date().toISOString(),
      confidence: 0.85,
      score: 0.9,
      url: '#',
      entityIds: ['ent-1'],
      metadata: {}
    }
  ];
  
  const mockHistory = ['test query', 'previous query'];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful responses
    (searchService.search as jest.Mock).mockResolvedValue(mockSearchResults);
    (searchService.getSearchHistory as jest.Mock).mockResolvedValue(mockHistory);
  });
  
  it('initializes with default values', () => {
    const { result } = renderHook(() => useOSINTSearch());
    
    expect(result.current.query).toBe('');
    expect(result.current.filters).toEqual({});
    expect(result.current.sources).toEqual([]);
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(true); // Initially loading because it fetches history
    expect(result.current.error).toBeNull();
  });
  
  it('initializes with provided values', () => {
    const initialValues = {
      initialQuery: 'test query',
      initialFilters: { type: 'entity' },
      initialSources: ['database1']
    };
    
    const { result } = renderHook(() => useOSINTSearch(initialValues));
    
    expect(result.current.query).toBe('test query');
    expect(result.current.filters).toEqual({ type: 'entity' });
    expect(result.current.sources).toEqual(['database1']);
  });
  
  it('loads search history on mount', async () => {
    const { result } = renderHook(() => useOSINTSearch());
    
    // Wait for the history to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(searchService.getSearchHistory).toHaveBeenCalled();
    expect(result.current.searchHistory).toEqual(mockHistory);
    expect(result.current.loading).toBe(false);
  });
  
  it('handles search history error', async () => {
    (searchService.getSearchHistory as jest.Mock).mockRejectedValue(
      new Error('Failed to load history')
    );
    
    const { result, waitForNextUpdate } = renderHook(() => useOSINTSearch());
    
    // Wait for the error to be processed
    await waitForNextUpdate();
    
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Failed to load history');
    expect(result.current.loading).toBe(false);
  });
  
  it('performs search with current query and filters', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useOSINTSearch({ initialQuery: 'test query' })
    );
    
    // Wait for initial history to load
    await waitForNextUpdate();
    
    // Perform search
    act(() => {
      result.current.search();
    });
    
    // Wait for search to complete
    await waitForNextUpdate();
    
    expect(searchService.search).toHaveBeenCalledWith({
      text: 'test query',
      filters: {},
      sources: undefined,
      maxResults: undefined,
      authenticated: true
    });
    
    expect(result.current.results).toEqual(mockSearchResults);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('handles search error', async () => {
    (searchService.search as jest.Mock).mockRejectedValue(
      new Error('Search failed')
    );
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useOSINTSearch({ initialQuery: 'test query' })
    );
    
    // Wait for initial history to load
    await waitForNextUpdate();
    
    // Perform search
    act(() => {
      result.current.search();
    });
    
    // Wait for error to be processed
    await waitForNextUpdate();
    
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Search failed');
    expect(result.current.loading).toBe(false);
  });
  
  it('updates query, filters, and sources state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useOSINTSearch());
    
    // Wait for initial history to load
    await waitForNextUpdate();
    
    // Update query
    act(() => {
      result.current.setQuery('new query');
    });
    expect(result.current.query).toBe('new query');
    
    // Update filters
    act(() => {
      result.current.setFilters({ type: 'document' });
    });
    expect(result.current.filters).toEqual({ type: 'document' });
    
    // Update sources
    act(() => {
      result.current.setSources(['database2']);
    });
    expect(result.current.sources).toEqual(['database2']);
  });
  
  it('clears results', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useOSINTSearch());
    
    // Wait for initial history to load
    await waitForNextUpdate();
    
    // Set some results first
    act(() => {
      // @ts-ignore - Direct manipulation for testing
      result.current.results = mockSearchResults;
    });
    
    // Clear results
    act(() => {
      result.current.clearResults();
    });
    
    expect(result.current.results).toEqual([]);
  });
  
  it('clears error state', async () => {
    (searchService.search as jest.Mock).mockRejectedValue(
      new Error('Search failed')
    );
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useOSINTSearch({ initialQuery: 'test query' })
    );
    
    // Wait for initial history to load
    await waitForNextUpdate();
    
    // Perform search to trigger error
    act(() => {
      result.current.search();
    });
    
    // Wait for error to be processed
    await waitForNextUpdate();
    
    expect(result.current.error).not.toBeNull();
    
    // Clear error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });
  
  it('retries last operation', async () => {
    (searchService.search as jest.Mock)
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockResolvedValueOnce(mockSearchResults);
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useOSINTSearch({ initialQuery: 'test query' })
    );
    
    // Wait for initial history to load
    await waitForNextUpdate();
    
    // Perform search to trigger error
    act(() => {
      result.current.search();
    });
    
    // Wait for error to be processed
    await waitForNextUpdate();
    
    expect(result.current.error).not.toBeNull();
    
    // Reset the mock call count
    (searchService.search as jest.Mock).mockClear();
    
    // Retry operation
    act(() => {
      result.current.retryLastOperation();
    });
    
    // Wait for retry to complete
    await waitForNextUpdate();
    
    // Should have called search again
    expect(searchService.search).toHaveBeenCalled();
    expect(result.current.results).toEqual(mockSearchResults);
    expect(result.current.error).toBeNull();
  });
  
  it('automatically performs search with autoSearch enabled', async () => {
    const { waitForNextUpdate } = renderHook(() => 
      useOSINTSearch({ initialQuery: 'test query', autoSearch: true })
    );
    
    // Wait for initial operations to complete
    await waitForNextUpdate();
    
    // Should have called search due to autoSearch
    expect(searchService.search).toHaveBeenCalled();
  });
});
