/**
 * Example test demonstrating human simulation utilities (enhanced version)
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, jest } from '@jest/globals';
import { humanSimulation, randomTiming } from '../../../test/utils/humanSimulation';
import ResultsPanel from '../components/panels/ResultsPanel';

// Test IDs for elements
const TEST_IDS = {
  LOADING_INDICATOR: 'loading-indicator',
  RETRY_BUTTON: 'retry-button',
  RESULTS_PANEL: 'results-panel'
};

// Mock search data
const mockSearchData = {
  query: 'test query'
};

describe('ResultsPanel with Human Interaction Simulation', () => {
  test('user views and interacts with search results like a human', async () => {
    // Mock search results to show up after rendering
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          id: 'result-1',
          type: 'entity',
          title: 'Test Entity',
          snippet: 'This is a test entity with relevant information',
          source: 'Test Database',
          timestamp: new Date().toISOString()
        }
      ])
    } as Response);
    
    // Render the component
    render(<ResultsPanel data={mockSearchData} panelId="test-results" />);
    
    // Wait for search results to be fully displayed
    await screen.findByText('Test Entity');
    
    // Simulate a user reading the results (wait an appropriate time)
    await randomTiming.thinkingPause();
    
    // Find a result item to interact with
    const resultItem = screen.getByText('Test Entity').closest('div');
    
    if (resultItem) {
      // Simulate thinking before clicking
      await randomTiming.naturalPause();
      
      // Click the result item with realistic timing
      await humanSimulation.click(resultItem);
      
      // Check if any filter elements exist
      const filterElements = screen.queryAllByRole('checkbox');
      
      if (filterElements.length > 0) {
        // Simulate decision making pause
        await randomTiming.longConsideration();
        
        // Select a random filter
        const randomFilter = filterElements[Math.floor(Math.random() * filterElements.length)];
        await humanSimulation.click(randomFilter);
      }
    }
  });

  test('simulates impatient user behavior with network issues', async () => {
    // Mock a slow loading state
    jest.useFakeTimers();
    
    // Render component with empty results initially
    const { rerender } = render(
      <ResultsPanel 
        data={{ query: 'test query' }} 
        panelId="test-results-2" 
      />
    );
    
    // Simulate cognitive load for an impatient user
    const cognitiveState = {
      typingErrorRate: 0.2,
      reactionTimeMultiplier: 0.7, // Faster reactions due to impatience
      distractionProbability: 0.15
    };
    
    // Find loading indicator
    const loadingElement = screen.getByTestId(TEST_IDS.LOADING_INDICATOR);
    expect(loadingElement).toBeInTheDocument();
    
    // Simulate impatient waiting
    await randomTiming.naturalPause();
    
    // Try to interact with results even while loading (impatient behavior)
    await humanSimulation.click(loadingElement, { 
      timing: 'frustrated', 
      cognitiveLoad: cognitiveState 
    });
    
    // Create a mock API error hook state
    const mockUseOSINTSearchWithError = {
      error: "Network error occurred",
      loading: false,
      results: []
    };
    
    // Mock the useOSINTSearch hook to return an error
    jest.mock('../../hooks/useOSINTSearch', () => ({
      useOSINTSearch: () => mockUseOSINTSearchWithError
    }));
    
    // Rerender with the mocked error state
    rerender(
      <ResultsPanel 
        data={{ query: 'test query' }}
        panelId="test-results-2"
      />
    );
    
    // Find retry button
    const retryButton = screen.getByTestId(TEST_IDS.RETRY_BUTTON);
    
    // Click retry button like an impatient user
    await humanSimulation.click(retryButton, { 
      timing: 'frustrated',
      cognitiveLoad: cognitiveState
    });
    
    // Finally, simulate successful results
    rerender(
      <ResultsPanel 
        data={mockSearchData}
        panelId="test-results-2"
      />
    );
    
    // Verify results appear and simulate browsing them
    const resultsContainer = screen.getByTestId(TEST_IDS.RESULTS_PANEL);
    await humanSimulation.browseResults(resultsContainer, {
      scrollDepth: 'shallow', // Impatient users don't scroll deeply
      cognitiveLoad: cognitiveState
    });
    
    jest.useRealTimers();
  });
  
  test('simulates realistic form filling in search filters', async () => {
    // Render component
    render(<ResultsPanel data={mockSearchData} panelId="test-filters" />);
    
    // Wait for component to render
    await screen.findByText('Test Entity');
    
    // Locate any filter form elements if they exist
    const dateInput = screen.queryByLabelText(/date/i);
    const sourceInput = screen.queryByLabelText(/source/i);
    const typeSelect = screen.queryByLabelText(/type/i);
    
    // If we have form elements, fill them like a human would
    if (dateInput && sourceInput && typeSelect) {
      const formElements = {
        date: dateInput,
        source: sourceInput,
        type: typeSelect
      };
      
      const formData = {
        date: '2025-07-01',
        source: 'OSINT Database',
        type: 'entity'
      };
      
      // Simulate realistic form filling with thinking pauses between fields
      await humanSimulation.fillForm(formElements, formData, {
        thinkBetweenFields: true,
        cognitiveLoad: {
          typingErrorRate: 0.05,
          reactionTimeMultiplier: 1.2,
          distractionProbability: 0.1
        }
      });
      
      // Submit the form if there's a submit button
      const submitButton = screen.queryByRole('button', { name: /apply|filter|search/i });
      if (submitButton) {
        await randomTiming.naturalPause();
        await humanSimulation.click(submitButton);
      }
    }
  });
});
