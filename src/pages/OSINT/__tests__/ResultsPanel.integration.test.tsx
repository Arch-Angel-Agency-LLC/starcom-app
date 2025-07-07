import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ResultsPanel from '../components/panels/ResultsPanel';
import { useOSINTSearch } from '../hooks/useOSINTSearch';
import { searchService } from '../services/search/searchService';

// Create a real implementation with mock service
jest.mock('../services/search/searchService', () => ({
  searchService: {
    search: jest.fn(),
    getSearchHistory: jest.fn()
  }
}));

// Use the real hook with mocked service
jest.unmock('../hooks/useOSINTSearch');

describe('ResultsPanel Integration', () => {
  const mockSearchResults = [
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
      metadata: { tags: ['test', 'person'] }
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful responses
    (searchService.search as jest.Mock).mockResolvedValue(mockSearchResults);
    (searchService.getSearchHistory as jest.Mock).mockResolvedValue(['test query']);
  });
  
  it('loads and displays search results', async () => {
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-integration" />);
    
    // Should be in loading state initially
    expect(screen.getByText('Searching intelligence sources...')).toBeInTheDocument();
    
    // Wait for search to complete
    await waitFor(() => {
      expect(screen.getByText('Results for "test query"')).toBeInTheDocument();
    });
    
    // Results should be displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test snippet about John Doe')).toBeInTheDocument();
    
    // Service should have been called with correct query
    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'test query'
      })
    );
  });
  
  it('handles and displays service errors', async () => {
    // Setup search to fail
    (searchService.search as jest.Mock).mockRejectedValue(
      new Error('Network connection error')
    );
    
    render(<ResultsPanel data={{ query: 'test query' }} />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Network connection error/)).toBeInTheDocument();
    });
    
    // Error display component should be visible
    expect(screen.getByText('Operation:')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
  
  it('retries failed searches', async () => {
    // Setup search to fail first then succeed
    (searchService.search as jest.Mock)
      .mockRejectedValueOnce(new Error('Network connection error'))
      .mockResolvedValueOnce(mockSearchResults);
    
    render(<ResultsPanel data={{ query: 'test query' }} />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Network connection error/)).toBeInTheDocument();
    });
    
    // Click retry button
    fireEvent.click(screen.getByText('Retry'));
    
    // Should show loading again
    expect(screen.getByText('Searching intelligence sources...')).toBeInTheDocument();
    
    // Wait for search to complete after retry
    await waitFor(() => {
      expect(screen.getByText('Results for "test query"')).toBeInTheDocument();
    });
    
    // Results should be displayed after successful retry
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Search should have been called twice (initial + retry)
    expect(searchService.search).toHaveBeenCalledTimes(2);
  });
  
  it('updates search when query changes', async () => {
    const { rerender } = render(<ResultsPanel data={{ query: 'initial query' }} />);
    
    // Wait for initial search to complete
    await waitFor(() => {
      expect(screen.getByText('Results for "initial query"')).toBeInTheDocument();
    });
    
    // Reset mock to track new calls
    (searchService.search as jest.Mock).mockClear();
    
    // Update with new query
    rerender(<ResultsPanel data={{ query: 'new query' }} />);
    
    // Should trigger another search
    await waitFor(() => {
      expect(searchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'new query'
        })
      );
    });
  });
  
  it('filters and navigates results correctly', async () => {
    // Create more diverse mock results
    const diverseResults = [
      {
        id: 'result-1',
        type: 'person',
        title: 'John Doe',
        snippet: 'Person result',
        source: 'Entity Database',
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        score: 0.9,
        url: '#',
        entityIds: ['ent-1'],
        metadata: { tags: ['test', 'person'] }
      },
      {
        id: 'result-2',
        type: 'organization',
        title: 'Test Corp',
        snippet: 'Organization result',
        source: 'Entity Database',
        timestamp: new Date().toISOString(),
        confidence: 0.75,
        score: 0.8,
        url: '#',
        entityIds: ['ent-2'],
        metadata: { tags: ['test', 'organization'] }
      }
    ];
    
    (searchService.search as jest.Mock).mockResolvedValue(diverseResults);
    
    render(<ResultsPanel data={{ query: 'test query' }} />);
    
    // Wait for search to complete
    await waitFor(() => {
      expect(screen.getByText('Results for "test query"')).toBeInTheDocument();
    });
    
    // Both results should be visible initially
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Corp')).toBeInTheDocument();
    
    // Filter for people only
    fireEvent.click(screen.getByText(/People/));
    
    // Should only show person results
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Test Corp')).not.toBeInTheDocument();
    
    // Switch to grid view
    fireEvent.click(screen.getByTitle('Grid view'));
    
    // Should still maintain the person filter in grid view
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Test Corp')).not.toBeInTheDocument();
    
    // Switch back to all results
    fireEvent.click(screen.getByText(/All/));
    
    // Both results should be visible again
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Corp')).toBeInTheDocument();
  });
});
