import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useNetRunnerSearch } from '../../../../src/pages/NetRunner/hooks/useNetRunnerSearch';
import { SearchQuery, SearchResult, SearchSource } from '../../../../src/pages/NetRunner/types/netrunner';

// Mock fetch
global.fetch = vi.fn();

describe('useNetRunnerSearch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 'result-1',
            title: 'Test Result 1',
            snippet: 'This is a test result snippet.',
            source: 'test-source',
            timestamp: new Date().toISOString(),
            confidence: 0.9,
            score: 0.95,
            url: 'https://example.com/result-1',
            metadata: { type: 'test' }
          },
          {
            id: 'result-2',
            title: 'Test Result 2',
            snippet: 'This is another test result snippet.',
            source: 'test-source',
            timestamp: new Date().toISOString(),
            confidence: 0.8,
            score: 0.85,
            url: 'https://example.com/result-2',
            metadata: { type: 'test' }
          }
        ],
        totalResults: 2,
        executionTime: 0.5
      })
    });
  });
  
  test('should initialize with default values', () => {
    const { result } = renderHook(() => useNetRunnerSearch());
    
    expect(result.current.searchQuery).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchError).toBe(null);
    expect(result.current.totalResults).toBe(0);
    expect(result.current.executionTime).toBe(0);
  });
  
  test('should update search query', () => {
    const { result } = renderHook(() => useNetRunnerSearch());
    
    act(() => {
      result.current.setSearchQuery('test query');
    });
    
    expect(result.current.searchQuery).toBe('test query');
  });
  
  test('should perform a search and update results', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useNetRunnerSearch({ initialSources: [{ id: 'test-source', label: 'Test Source', checked: true }] })
    );
    
    act(() => {
      result.current.setSearchQuery('test query');
    });
    
    act(() => {
      result.current.performSearch();
    });
    
    expect(result.current.isSearching).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isSearching).toBe(false);
    expect(result.current.results).toHaveLength(2);
    expect(result.current.results[0].title).toBe('Test Result 1');
    expect(result.current.results[1].title).toBe('Test Result 2');
    expect(result.current.totalResults).toBe(2);
    expect(result.current.executionTime).toBe(0.5);
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/netrunner/search'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('test query')
      })
    );
  });
  
  test('should handle search errors', async () => {
    // Mock a failed search
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Search failed'));
    
    const { result, waitForNextUpdate } = renderHook(() => useNetRunnerSearch());
    
    act(() => {
      result.current.setSearchQuery('error query');
    });
    
    act(() => {
      result.current.performSearch();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchError).toBe('Search failed');
    expect(result.current.results).toHaveLength(0);
  });
  
  test('should toggle search sources', () => {
    const initialSources: SearchSource[] = [
      { id: 'source-1', label: 'Source 1', checked: true },
      { id: 'source-2', label: 'Source 2', checked: false }
    ];
    
    const { result } = renderHook(() => useNetRunnerSearch({ initialSources }));
    
    expect(result.current.sources).toHaveLength(2);
    expect(result.current.sources[0].checked).toBe(true);
    expect(result.current.sources[1].checked).toBe(false);
    
    act(() => {
      result.current.toggleSource('source-1');
    });
    
    expect(result.current.sources[0].checked).toBe(false);
    
    act(() => {
      result.current.toggleSource('source-2');
    });
    
    expect(result.current.sources[1].checked).toBe(true);
  });
  
  test('should clear search results', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetRunnerSearch());
    
    // Perform a search first
    act(() => {
      result.current.setSearchQuery('test query');
    });
    
    act(() => {
      result.current.performSearch();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.results).toHaveLength(2);
    
    // Clear results
    act(() => {
      result.current.clearResults();
    });
    
    expect(result.current.results).toHaveLength(0);
    expect(result.current.totalResults).toBe(0);
    expect(result.current.executionTime).toBe(0);
  });
});
