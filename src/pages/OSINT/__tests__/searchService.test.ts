import { searchService } from '../services/search/searchService';
import { osintApi } from '../services/api/osintApi';
import { SearchQuery } from '../types/osint';

// Mock the osintApi
jest.mock('../services/api/osintApi', () => ({
  osintApi: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

describe('searchService', () => {
  const mockSearchQuery: SearchQuery = {
    text: 'test query',
    filters: {},
    authenticated: true
  };
  
  const mockSearchResults = [
    {
      id: 'result-1',
      type: 'person',
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
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.env for development mode
    process.env.NODE_ENV = 'development';
    
    // Default successful response
    (osintApi.post as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSearchResults
    });
    
    (osintApi.get as jest.Mock).mockResolvedValue({
      success: true,
      data: ['test query', 'previous query']
    });
    
    // Override Math.random to always return 0.2 (above the 0.1 threshold for errors)
    const originalRandom = Math.random;
    global.Math.random = jest.fn(() => 0.2);
    
    // Restore after tests
    afterAll(() => {
      global.Math.random = originalRandom;
    });
  });
  
  describe('search', () => {
    it('returns mock results in development environment', async () => {
      const results = await searchService.search(mockSearchQuery);
      
      // Should return some mock results
      expect(results.length).toBeGreaterThan(0);
      // Should not call the API in dev mode when using mock data
      expect(osintApi.post).not.toHaveBeenCalled();
    });
    
    it('throws error when no valid providers are available', async () => {
      await expect(searchService.search({ 
        text: 'test',
        authenticated: false,
        sources: ['darkweb'] // darkweb requires auth
      })).rejects.toThrow('No valid search providers available for this query');
    });
    
    it('throws error when random number is below threshold (simulated error)', async () => {
      // Override Math.random to return 0.05 (below the 0.1 threshold)
      const originalRandom = Math.random;
      global.Math.random = jest.fn(() => 0.05);
      
      await expect(searchService.search(mockSearchQuery))
        .rejects.toThrow('Simulated error: Failed to retrieve search results');
      
      // Restore Math.random
      global.Math.random = originalRandom;
    });
    
    it('handles API errors from all providers', async () => {
      // Switch to production mode to test API calls
      process.env.NODE_ENV = 'production';
      
      // Make all API calls fail
      (osintApi.post as jest.Mock).mockResolvedValue({
        success: false,
        error: 'API Error'
      });
      
      await expect(searchService.search(mockSearchQuery))
        .rejects.toThrow('All search providers failed');
    });
    
    it('combines results from multiple providers', async () => {
      // Switch to production mode to test API calls
      process.env.NODE_ENV = 'production';
      
      // Set up different results for different providers
      (osintApi.post as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: 'result-1', type: 'person', score: 0.8 }]
        })
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: 'result-2', type: 'organization', score: 0.9 }]
        });
      
      const results = await searchService.search(mockSearchQuery);
      
      // Should have two results combined
      expect(results.length).toBe(2);
      // Should have called the API for each provider
      expect(osintApi.post).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getSearchHistory', () => {
    it('returns mock history in development environment', async () => {
      const history = await searchService.getSearchHistory();
      
      // Should return some mock history
      expect(history.length).toBeGreaterThan(0);
      // Should not call the API in dev mode
      expect(osintApi.get).not.toHaveBeenCalled();
    });
    
    it('throws error when random number is below threshold (simulated error)', async () => {
      // Override Math.random to return 0.05 (below the 0.1 threshold)
      const originalRandom = Math.random;
      global.Math.random = jest.fn(() => 0.05);
      
      await expect(searchService.getSearchHistory())
        .rejects.toThrow('Simulated error: Failed to retrieve search history');
      
      // Restore Math.random
      global.Math.random = originalRandom;
    });
    
    it('handles API errors', async () => {
      // Switch to production mode to test API calls
      process.env.NODE_ENV = 'production';
      
      // Make API call fail
      (osintApi.get as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to fetch search history'
      });
      
      await expect(searchService.getSearchHistory())
        .rejects.toThrow('Failed to fetch search history');
    });
    
    it('handles network errors', async () => {
      // Switch to production mode to test API calls
      process.env.NODE_ENV = 'production';
      
      // Make API call throw network error
      (osintApi.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(searchService.getSearchHistory())
        .rejects.toThrow('Network error');
    });
  });
});
