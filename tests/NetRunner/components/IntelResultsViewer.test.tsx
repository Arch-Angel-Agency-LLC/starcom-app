import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntelResultsViewer from '../../../../src/pages/NetRunner/components/IntelResultsViewer';
import { SearchResult } from '../../../../src/pages/NetRunner/types/netrunner';

// Mock props
const mockSearchResults: SearchResult[] = [
  {
    id: 'result-1',
    title: 'Test Result 1',
    snippet: 'This is a test result snippet with important information.',
    source: 'web',
    timestamp: new Date().toISOString(),
    confidence: 0.9,
    score: 0.95,
    url: 'https://example.com/result-1',
    entityIds: ['entity-1', 'entity-2'],
    metadata: { type: 'article', keywords: ['test', 'example'] }
  },
  {
    id: 'result-2',
    title: 'Test Result 2',
    snippet: 'This is another test result with different information.',
    source: 'social',
    timestamp: new Date().toISOString(),
    confidence: 0.8,
    score: 0.85,
    url: 'https://example.com/result-2',
    entityIds: ['entity-3'],
    metadata: { type: 'post', keywords: ['example', 'different'] }
  }
];

// Mock functions
const mockOnResultSelect = vi.fn();
const mockOnAnalyzeResults = vi.fn();
const mockOnExportResults = vi.fn();

describe('IntelResultsViewer', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });
  
  test('should render search results', () => {
    render(
      <IntelResultsViewer 
        results={mockSearchResults}
        onResultSelect={mockOnResultSelect}
        onAnalyzeResults={mockOnAnalyzeResults}
        onExportResults={mockOnExportResults}
      />
    );
    
    // Check that results are rendered
    expect(screen.getByText('Test Result 1')).toBeInTheDocument();
    expect(screen.getByText('This is a test result snippet with important information.')).toBeInTheDocument();
    expect(screen.getByText('Test Result 2')).toBeInTheDocument();
    expect(screen.getByText('This is another test result with different information.')).toBeInTheDocument();
    
    // Check for source indicators
    expect(screen.getByText('web')).toBeInTheDocument();
    expect(screen.getByText('social')).toBeInTheDocument();
  });
  
  test('should call onResultSelect when a result is clicked', () => {
    render(
      <IntelResultsViewer 
        results={mockSearchResults}
        onResultSelect={mockOnResultSelect}
        onAnalyzeResults={mockOnAnalyzeResults}
        onExportResults={mockOnExportResults}
      />
    );
    
    // Click on the first result
    fireEvent.click(screen.getByText('Test Result 1'));
    
    // Check that onResultSelect was called with the correct result
    expect(mockOnResultSelect).toHaveBeenCalledWith(mockSearchResults[0]);
  });
  
  test('should call onAnalyzeResults when Analyze button is clicked', () => {
    render(
      <IntelResultsViewer 
        results={mockSearchResults}
        onResultSelect={mockOnResultSelect}
        onAnalyzeResults={mockOnAnalyzeResults}
        onExportResults={mockOnExportResults}
      />
    );
    
    // Find and click the Analyze button
    const analyzeButton = screen.getByText('Analyze');
    fireEvent.click(analyzeButton);
    
    // Check that onAnalyzeResults was called with all results
    expect(mockOnAnalyzeResults).toHaveBeenCalledWith(mockSearchResults);
  });
  
  test('should call onExportResults when Export button is clicked', () => {
    render(
      <IntelResultsViewer 
        results={mockSearchResults}
        onResultSelect={mockOnResultSelect}
        onAnalyzeResults={mockOnAnalyzeResults}
        onExportResults={mockOnExportResults}
      />
    );
    
    // Find and click the Export button
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    // Check that onExportResults was called with all results
    expect(mockOnExportResults).toHaveBeenCalledWith(mockSearchResults);
  });
  
  test('should display a message when no results are available', () => {
    render(
      <IntelResultsViewer 
        results={[]}
        onResultSelect={mockOnResultSelect}
        onAnalyzeResults={mockOnAnalyzeResults}
        onExportResults={mockOnExportResults}
      />
    );
    
    // Check for the no results message
    expect(screen.getByText('No results available')).toBeInTheDocument();
    
    // Analyze and Export buttons should be disabled
    const analyzeButton = screen.getByText('Analyze');
    const exportButton = screen.getByText('Export');
    
    expect(analyzeButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
  });
  
  test('should filter results when search filter is used', () => {
    render(
      <IntelResultsViewer 
        results={mockSearchResults}
        onResultSelect={mockOnResultSelect}
        onAnalyzeResults={mockOnAnalyzeResults}
        onExportResults={mockOnExportResults}
      />
    );
    
    // Find the search filter input
    const searchInput = screen.getByPlaceholderText('Filter results...');
    
    // Type "important" to filter results
    fireEvent.change(searchInput, { target: { value: 'important' } });
    
    // Should only show the first result
    expect(screen.getByText('Test Result 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Result 2')).not.toBeInTheDocument();
    
    // Clear the filter
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Should show both results again
    expect(screen.getByText('Test Result 1')).toBeInTheDocument();
    expect(screen.getByText('Test Result 2')).toBeInTheDocument();
  });
  
  test('should sort results by confidence when sort option is changed', () => {
    render(
      <IntelResultsViewer 
        results={mockSearchResults}
        onResultSelect={mockOnResultSelect}
        onAnalyzeResults={mockOnAnalyzeResults}
        onExportResults={mockOnExportResults}
      />
    );
    
    // Find the sort dropdown
    const sortDropdown = screen.getByLabelText('Sort by:');
    
    // Change sort to "confidence"
    fireEvent.change(sortDropdown, { target: { value: 'confidence' } });
    
    // Results should be sorted by confidence (already in order in our mock data)
    const resultElements = screen.getAllByTestId('result-item');
    expect(resultElements[0].textContent).toContain('Test Result 1');
    expect(resultElements[1].textContent).toContain('Test Result 2');
    
    // Change sort direction to ascending
    const sortDirectionButton = screen.getByLabelText('Toggle sort direction');
    fireEvent.click(sortDirectionButton);
    
    // Results should now be in reverse order
    const reversedResultElements = screen.getAllByTestId('result-item');
    expect(reversedResultElements[0].textContent).toContain('Test Result 2');
    expect(reversedResultElements[1].textContent).toContain('Test Result 1');
  });
});
