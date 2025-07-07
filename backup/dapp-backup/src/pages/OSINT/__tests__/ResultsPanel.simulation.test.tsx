/**
 * Example test demonstrating human simulation utilities
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { humanSimulation, randomTiming } from '../../../test/utils/humanSimulation';
import { ResultsPanel } from '../components/panels/ResultsPanel';

// Mock search data
const mockSearchData = {
  query: 'test query',
  results: [
    {
      id: 'result-1',
      type: 'entity',
      title: 'Test Entity',
      snippet: 'This is a test entity with relevant information',
      source: 'Test Database',
      timestamp: new Date().toISOString(),
      confidence: 0.85,
      score: 0.9,
      url: '#',
      entityIds: ['ent-1'],
      metadata: {}
    },
    {
      id: 'result-2',
      type: 'document',
      title: 'Test Document',
      snippet: 'This document contains relevant information',
      source: 'Document Repository',
      timestamp: new Date().toISOString(),
      confidence: 0.75,
      score: 0.8,
      url: '#',
      entityIds: [],
      metadata: {}
    }
  ]
};

describe('ResultsPanel with Human Interaction Simulation', () => {
  test('user views and interacts with search results like a human', async () => {
    // Render the component
    render(<ResultsPanel data={mockSearchData} panelId="test-results" />);
    
    // Create user with realistic timing
    const user = userEvent.setup({ delay: humanSimulation.timing.averageHuman() });
    
    // Wait for search results to be fully displayed
    await screen.findByText('Test Entity');
    
    // Simulate a user reading the results
    await humanSimulation.behavior.simulateReading(mockSearchData.results[0].snippet.length);
    
    // Find a result item to interact with
    const resultItem = screen.getByText('Test Entity').closest('div');
    
    if (resultItem) {
      // Simulate hovering behavior - user examining the result
      await user.hover(resultItem);
      
      // Simulate thinking time
      await humanSimulation.timing.thinkingPause();
      
      // Simulate clicking on the result
      await user.click(resultItem);
    }
    
    // Find filter elements if they exist
    const filterElements = screen.queryAllByRole('checkbox');
    
    if (filterElements.length > 0) {
      // Simulate user deciding which filter to use
      await humanSimulation.behavior.simulateDecisionMaking(filterElements.length);
      
      // Select a random filter
      const randomFilterIndex = Math.floor(Math.random() * filterElements.length);
      await user.click(filterElements[randomFilterIndex]);
    }
    
    // Simulate frustration if "No results" appears
    const noResultsElement = screen.queryByText(/no results/i);
    if (noResultsElement) {
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await humanSimulation.behavior.impatientClicking(user, retryButton);
    }
  });
  
  test('user under cognitive load interacts with results', async () => {
    // Set up moderate distraction cognitive state
    const cognitiveState = humanSimulation.cognitiveLoad.moderateDistraction();
    const { timing, behavior } = humanSimulation.cognitiveLoad.applyLoad(cognitiveState);
    
    // Render component
    render(<ResultsPanel data={mockSearchData} panelId="test-results" />);
    
    // Create user with cognitive-load-adjusted timing
    const user = userEvent.setup({ delay: timing.averageHuman() });
    
    // Wait for results with potential "distraction" delay
    await screen.findByText('Test Entity');
    
    // User is distracted briefly
    await behavior.simulateDistraction(2000);
    
    // After distraction, user interacts with a result
    const resultItem = screen.getByText('Test Entity').closest('div');
    
    if (resultItem) {
      await user.click(resultItem);
    }
  });
  
  test('user experiences network issues', async () => {
    // Mock data that will be loaded with network simulation
    let displayData = { ...mockSearchData, results: [] };
    
    // Initial render with empty results
    const { rerender } = render(<ResultsPanel data={displayData} panelId="test-results" />);
    
    // Simulate network delay for data loading
    try {
      // Use flaky network condition
      const results = await humanSimulation.network.simulateNetworkCall(
        () => Promise.resolve(mockSearchData.results),
        'flaky'
      );
      
      // Update display data after "network" call
      displayData = { ...mockSearchData, results };
      
      // Rerender with new data
      rerender(<ResultsPanel data={displayData} panelId="test-results" />);
      
      // Now user should see results
      await screen.findByText('Test Entity');
      
    } catch (error) {
      // Network error simulation
      console.log('Simulated network error occurred');
      
      // Render error state
      rerender(<ResultsPanel data={{ ...mockSearchData, error: 'Network request failed' }} panelId="test-results" />);
      
      // User should see error message
      const errorMessage = await screen.findByText(/network request failed/i);
      expect(errorMessage).toBeInTheDocument();
      
      // User tries to retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      const user = userEvent.setup({ delay: humanSimulation.timing.frustratedUser() });
      await user.click(retryButton);
    }
  });
});
