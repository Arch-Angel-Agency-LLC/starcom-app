import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResultsPanel from '../components/panels/ResultsPanel';
import { useOSINTSearch } from '../hooks/useOSINTSearch';
import { ErrorDetail } from '../types/errors';

// Mock the OSINT Search hook
jest.mock('../hooks/useOSINTSearch');

describe('ResultsPanel', () => {
  // Setup mock implementation of useOSINTSearch
  const mockSearch = jest.fn();
  const mockSetQuery = jest.fn();
  const mockSetFilters = jest.fn();
  const mockSetSources = jest.fn();
  const mockClearResults = jest.fn();
  const mockClearError = jest.fn();
  const mockRetryLastOperation = jest.fn();
  
  const mockResults = [
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
    },
    {
      id: 'result-2',
      type: 'entity',
      title: 'Test Organization',
      snippet: 'Organization involved in testing',
      source: 'Entity Database',
      timestamp: new Date().toISOString(),
      confidence: 0.75,
      score: 0.8,
      url: '#',
      entityIds: ['ent-2'],
      metadata: { tags: ['organization', 'testing'] }
    },
    {
      id: 'result-3',
      type: 'document',
      title: 'Test Document',
      snippet: 'A document for testing purposes',
      source: 'Document Database',
      timestamp: new Date().toISOString(),
      confidence: 0.65,
      score: 0.7,
      url: '#',
      entityIds: [],
      metadata: { tags: ['document', 'confidential'] }
    }
  ];
  
  const defaultHookReturn = {
    query: 'test query',
    setQuery: mockSetQuery,
    filters: {},
    setFilters: mockSetFilters,
    sources: [],
    setSources: mockSetSources,
    results: mockResults,
    searchHistory: ['test query', 'previous query'],
    loading: false,
    operationLoading: { search: false },
    error: null,
    search: mockSearch,
    clearResults: mockClearResults,
    clearError: mockClearError,
    retryLastOperation: mockRetryLastOperation
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useOSINTSearch as jest.Mock).mockReturnValue(defaultHookReturn);
  });
  
  it('renders the results panel with data', () => {
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    expect(screen.getByText('Results for "test query"')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });
  
  it('shows the correct number of results', () => {
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    expect(screen.getByText('3 results')).toBeInTheDocument();
  });
  
  it('toggles between list and grid views', () => {
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    // Should start in list view by default
    const listButton = screen.getByTitle('List view');
    const gridButton = screen.getByTitle('Grid view');
    
    expect(listButton.classList.contains('activeView')).toBe(true);
    expect(gridButton.classList.contains('activeView')).toBe(false);
    
    // Click grid view
    fireEvent.click(gridButton);
    
    expect(listButton.classList.contains('activeView')).toBe(false);
    expect(gridButton.classList.contains('activeView')).toBe(true);
    
    // Click list view again
    fireEvent.click(listButton);
    
    expect(listButton.classList.contains('activeView')).toBe(true);
    expect(gridButton.classList.contains('activeView')).toBe(false);
  });
  
  it('filters results by type', () => {
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    // Should show all results initially
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    
    // Click the person filter
    fireEvent.click(screen.getByText(/People/));
    
    // Should only show person results
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Test Organization')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Document')).not.toBeInTheDocument();
    
    // Click the organization filter
    fireEvent.click(screen.getByText(/Orgs/));
    
    // Should only show organization results
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.queryByText('Test Document')).not.toBeInTheDocument();
    
    // Click back to All
    fireEvent.click(screen.getByText(/All/));
    
    // Should show all results again
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });
  
  it('shows loading state when loading is true', () => {
    (useOSINTSearch as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      loading: true
    });
    
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    expect(screen.getByText('Searching intelligence sources...')).toBeInTheDocument();
    expect(screen.queryByText('Results for "test query"')).not.toBeInTheDocument();
  });
  
  it('shows empty state when query exists but no results', () => {
    (useOSINTSearch as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      results: []
    });
    
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    expect(screen.getByText('Results for "test query"')).toBeInTheDocument();
    expect(screen.getByText('No results found matching the current filters.')).toBeInTheDocument();
  });
  
  it('shows prompt when no query is provided', () => {
    (useOSINTSearch as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      query: '',
      results: []
    });
    
    render(<ResultsPanel data={{ query: '' }} panelId="results-panel-1" />);
    
    expect(screen.getByText('Enter a search query to see results.')).toBeInTheDocument();
  });
  
  it('displays error state when error is present', () => {
    const mockError: ErrorDetail = {
      message: 'Failed to retrieve search results',
      timestamp: new Date().toISOString(),
      recoverable: true,
      retryable: true,
      severity: 'error',
      category: 'network',
      operation: 'search',
      userActions: ['Check your connection', 'Try again later']
    };
    
    (useOSINTSearch as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      error: mockError
    });
    
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    expect(screen.getByText('Failed to retrieve search results')).toBeInTheDocument();
    expect(screen.getByText('Operation: search')).toBeInTheDocument();
    expect(screen.getByText('Check your connection')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });
  
  it('calls retryLastOperation when retry button is clicked', async () => {
    const mockError: ErrorDetail = {
      message: 'Failed to retrieve search results',
      timestamp: new Date().toISOString(),
      recoverable: true,
      retryable: true,
      severity: 'error',
      category: 'network',
      operation: 'search',
      userActions: ['Check your connection', 'Try again later']
    };
    
    (useOSINTSearch as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      error: mockError
    });
    
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    fireEvent.click(screen.getByText('Retry'));
    
    expect(mockRetryLastOperation).toHaveBeenCalled();
  });
  
  it('calls clearError when dismiss button is clicked', async () => {
    const mockError: ErrorDetail = {
      message: 'Failed to retrieve search results',
      timestamp: new Date().toISOString(),
      recoverable: true,
      retryable: true,
      severity: 'error',
      category: 'network',
      operation: 'search',
      userActions: ['Check your connection', 'Try again later']
    };
    
    (useOSINTSearch as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      error: mockError
    });
    
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    fireEvent.click(screen.getByText('Dismiss'));
    
    expect(mockClearError).toHaveBeenCalled();
  });
  
  it('calls search when query changes', async () => {
    render(<ResultsPanel data={{ query: 'new query' }} panelId="results-panel-1" />);
    
    expect(mockSetQuery).toHaveBeenCalledWith('new query');
    await waitFor(() => expect(mockSearch).toHaveBeenCalled());
  });
  
  it('shows counts in filter buttons', () => {
    render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
    
    // Verify the counts in filter buttons
    expect(screen.getByText('All (3)')).toBeInTheDocument();
    expect(screen.getByText(/People \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Orgs \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Docs \(1\)/)).toBeInTheDocument();
  });
});
