/**
 * FullTextSearchManager tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fullTextSearchManager } from '../storage/fullTextSearchManager';
import { storageOrchestrator } from '../storage/storageOrchestrator';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';

// Mock dependencies
vi.mock('../storage/storageOrchestrator', () => ({
  storageOrchestrator: {
    queryEntities: vi.fn(),
    getEntity: vi.fn()
  }
}));

vi.mock('../events/enhancedEventEmitter', () => ({
  enhancedEventEmitter: {
    subscribe: vi.fn().mockReturnValue('mock-subscription-id'),
    emit: vi.fn()
  }
}));

describe('FullTextSearchManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the fullTextSearchManager's internal state
    // @ts-ignore - accessing private property for testing
    fullTextSearchManager.initialized = false;
    // @ts-ignore - accessing private property for testing
    fullTextSearchManager.invertedIndex = new Map();
    // @ts-ignore - accessing private property for testing
    fullTextSearchManager.documents = new Map();
  });
  
  describe('initialize', () => {
    it('should subscribe to entity events', async () => {
      // Mock successful queryEntities response
      vi.mocked(storageOrchestrator.queryEntities).mockResolvedValue({
        success: true,
        data: []
      });
      
      await fullTextSearchManager.initialize();
      
      // Check that we subscribed to entity events
      expect(enhancedEventEmitter.subscribe).toHaveBeenCalledTimes(1);
      expect(enhancedEventEmitter.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          topics: ['entity:created', 'entity:updated', 'entity:deleted']
        })
      );
    });
    
    it('should build initial index from existing entities', async () => {
      // Mock sample entities
      const sampleEntities = [
        {
          id: 'entity1',
          type: 'node',
          title: 'Test Node',
          description: 'This is a test node about cybersecurity',
          tags: ['test', 'security'],
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'entity2',
          type: 'report',
          title: 'Security Report',
          content: 'Detailed analysis of security vulnerabilities',
          tags: ['report', 'security', 'analysis'],
          createdAt: '2025-01-02T00:00:00Z'
        }
      ];
      
      // Mock successful queryEntities response
      vi.mocked(storageOrchestrator.queryEntities).mockResolvedValue({
        success: true,
        data: sampleEntities
      });
      
      await fullTextSearchManager.initialize();
      
      // Check that the index contains the entities
      // @ts-ignore - accessing private property for testing
      expect(fullTextSearchManager.documents.size).toBe(2);
      // @ts-ignore - accessing private property for testing
      expect(fullTextSearchManager.invertedIndex.size).toBeGreaterThan(0);
      
      // Verify that specific terms are in the index
      // @ts-ignore - accessing private property for testing
      expect(fullTextSearchManager.invertedIndex.has('security')).toBe(true);
      // @ts-ignore - accessing private property for testing
      expect(fullTextSearchManager.invertedIndex.has('test')).toBe(true);
    });
  });
  
  describe('search', () => {
    beforeEach(async () => {
      // Mock sample entities for initialization
      const sampleEntities = [
        {
          id: 'entity1',
          type: 'node',
          title: 'Test Node',
          description: 'This is a test node about cybersecurity',
          tags: ['test', 'security'],
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'entity2',
          type: 'report',
          title: 'Security Report',
          content: 'Detailed analysis of security vulnerabilities',
          tags: ['report', 'security', 'analysis'],
          createdAt: '2025-01-02T00:00:00Z'
        },
        {
          id: 'entity3',
          type: 'note',
          title: 'Meeting Notes',
          content: 'Discussion about network infrastructure',
          tags: ['meeting', 'network'],
          createdAt: '2025-01-03T00:00:00Z'
        }
      ];
      
      // Mock successful queryEntities response for initialization
      vi.mocked(storageOrchestrator.queryEntities).mockResolvedValue({
        success: true,
        data: sampleEntities
      });
      
      // Mock getEntity responses
      vi.mocked(storageOrchestrator.getEntity)
        .mockImplementation((id) => {
          const entity = sampleEntities.find(e => e.id === id);
          return Promise.resolve({
            success: !!entity,
            data: entity
          });
        });
      
      // Initialize the search manager
      await fullTextSearchManager.initialize();
    });
    
    it('should find entities matching a single term', async () => {
      const results = await fullTextSearchManager.search({
        query: 'security'
      });
      
      expect(results.length).toBe(2);
      expect(results.some(r => r.entity.id === 'entity1')).toBe(true);
      expect(results.some(r => r.entity.id === 'entity2')).toBe(true);
      expect(results.some(r => r.entity.id === 'entity3')).toBe(false);
    });
    
    it('should find entities matching a phrase', async () => {
      const results = await fullTextSearchManager.search({
        query: '"security vulnerabilities"',
        phraseMatching: true
      });
      
      expect(results.length).toBe(1);
      expect(results[0].entity.id).toBe('entity2');
    });
    
    it('should support boolean operators', async () => {
      const results = await fullTextSearchManager.search({
        query: 'security -report',
        booleanOperators: true
      });
      
      expect(results.length).toBe(1);
      expect(results[0].entity.id).toBe('entity1');
    });
    
    it('should provide highlighted snippets in results', async () => {
      const results = await fullTextSearchManager.search({
        query: 'security'
      });
      
      expect(results.length).toBeGreaterThan(0);
      
      // Check for highlights in the first result
      const firstResult = results[0];
      expect(firstResult.highlights).toBeDefined();
      
      // At least one field should have highlights
      const highlightedFields = Object.keys(firstResult.highlights);
      expect(highlightedFields.length).toBeGreaterThan(0);
      
      // The highlighted snippets should contain the query term with <b> tags
      const firstHighlightField = highlightedFields[0];
      expect(firstResult.highlights[firstHighlightField][0]).toContain('<b>security</b>');
    });
    
    it('should limit results based on limit parameter', async () => {
      const results = await fullTextSearchManager.search({
        query: 'security',
        limit: 1
      });
      
      expect(results.length).toBe(1);
    });
  });
});
