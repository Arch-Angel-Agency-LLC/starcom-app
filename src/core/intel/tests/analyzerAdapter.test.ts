/**
 * AnalyzerAdapter Unit Tests
 * 
 * This file contains tests for the AnalyzerAdapter, verifying that it correctly
 * interfaces with the IntelDataCore system and provides proper analysis functionality.
 */

import { analyzerAdapter, AnalysisEntity, AnalysisRequest } from '../adapters/analyzerAdapter';
import { storageOrchestrator } from '../storage/storageOrchestrator';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { ClassificationLevel } from '../types/intelDataModels';

// Mock the dependencies
jest.mock('../storage/storageOrchestrator', () => ({
  storageOrchestrator: {
    getEntity: jest.fn(),
    queryEntities: jest.fn(),
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn()
  }
}));

jest.mock('../events/enhancedEventEmitter', () => ({
  enhancedEventEmitter: {
    on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    emit: jest.fn()
  }
}));

describe('AnalyzerAdapter', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Analysis operations', () => {
    test('getAnalysis returns null when analysis is not found', async () => {
      // Mock storage orchestrator to return null
      (storageOrchestrator.getEntity as jest.Mock).mockResolvedValue(null);
      
      const result = await analyzerAdapter.getAnalysis('non-existent-id');
      
      expect(result).toBeNull();
      expect(storageOrchestrator.getEntity).toHaveBeenCalledWith('non-existent-id');
    });
    
    test('getAnalysis transforms and returns a valid analysis', async () => {
      // Mock an analysis entity
      const mockAnalysisEntity = {
        id: 'analysis-123',
        type: 'analysis_entity',
        title: 'Test Analysis',
        description: 'Analysis of test data',
        classification: ClassificationLevel.CONFIDENTIAL,
        source: 'STARCOM Analyzer',
        sourceUrl: 'http://example.com/data',
        verified: true,
        tags: ['test', 'analysis'],
        createdAt: '2025-07-01T00:00:00Z',
        updatedAt: '2025-07-02T00:00:00Z',
        createdBy: 'user-1',
        metadata: {
          entityType: 'text',
          content: 'This is test content for analysis',
          extracted: {
            entities: [
              {
                id: 'entity-1',
                text: 'Test',
                type: 'KEYWORD',
                relevance: 0.8,
                confidence: 0.9,
                position: { start: 8, end: 12 }
              }
            ],
            relationships: [],
            concepts: [],
            sentiments: []
          },
          analysisDate: '2025-07-01T00:00:00Z',
          analysisTechniques: ['nlp'],
          confidence: 85,
          relatedCases: ['case-456']
        }
      };
      
      (storageOrchestrator.getEntity as jest.Mock).mockResolvedValue(mockAnalysisEntity);
      
      const result = await analyzerAdapter.getAnalysis('analysis-123');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('analysis-123');
      expect(result?.title).toBe('Test Analysis');
      expect(result?.entityType).toBe('text');
      expect(result?.confidence).toBe(85);
      expect(result?.extracted.entities.length).toBe(1);
      expect(result?.relatedCases).toContain('case-456');
      expect(storageOrchestrator.getEntity).toHaveBeenCalledWith('analysis-123');
    });
    
    test('createAnalysis properly transforms and creates an analysis', async () => {
      // Analysis data to create
      const analysisData = {
        title: 'New Analysis',
        description: 'Analysis of new data',
        entityType: 'text',
        source: 'STARCOM Analyzer',
        sourceUrl: 'http://example.com/newdata',
        content: 'This is new content for analysis',
        extracted: {
          entities: [],
          relationships: [],
          concepts: [],
          sentiments: []
        },
        classification: ClassificationLevel.CONFIDENTIAL,
        confidence: 75,
        analysisDate: '2025-07-07T00:00:00Z',
        analysisTechniques: ['nlp', 'sentiment'],
        tags: ['new', 'analysis'],
        metadata: { importance: 'high' },
        relatedCases: [],
        createdBy: 'user-1'
      };
      
      // Mock the created entity
      const createdEntity = {
        id: 'analysis-456',
        type: 'analysis_entity',
        title: 'New Analysis',
        description: 'Analysis of new data',
        classification: ClassificationLevel.CONFIDENTIAL,
        source: 'STARCOM Analyzer',
        sourceUrl: 'http://example.com/newdata',
        verified: false,
        tags: ['new', 'analysis'],
        createdAt: '2025-07-07T00:00:00Z',
        updatedAt: '2025-07-07T00:00:00Z',
        createdBy: 'user-1',
        metadata: {
          entityType: 'text',
          content: 'This is new content for analysis',
          extracted: {
            entities: [],
            relationships: [],
            concepts: [],
            sentiments: []
          },
          analysisDate: '2025-07-07T00:00:00Z',
          analysisTechniques: ['nlp', 'sentiment'],
          confidence: 75,
          relatedCases: [],
          importance: 'high'
        }
      };
      
      (storageOrchestrator.createEntity as jest.Mock).mockResolvedValue(createdEntity);
      
      const result = await analyzerAdapter.createAnalysis(analysisData);
      
      expect(result).not.toBeNull();
      expect(result.id).toBe('analysis-456');
      expect(result.title).toBe('New Analysis');
      expect(result.entityType).toBe('text');
      expect(result.confidence).toBe(75);
      expect(storageOrchestrator.createEntity).toHaveBeenCalled();
      
      // Verify the entity was transformed correctly for storage
      const createdAnalysisEntity = (storageOrchestrator.createEntity as jest.Mock).mock.calls[0][0];
      expect(createdAnalysisEntity.type).toBe('analysis_entity');
      expect(createdAnalysisEntity.title).toBe('New Analysis');
      expect(createdAnalysisEntity.metadata.entityType).toBe('text');
      expect(createdAnalysisEntity.metadata.confidence).toBe(75);
    });
    
    test('updateAnalysis properly updates an analysis', async () => {
      // Mock existing analysis
      const existingAnalysis = {
        id: 'analysis-123',
        type: 'analysis_entity',
        title: 'Test Analysis',
        description: 'Analysis of test data',
        classification: ClassificationLevel.CONFIDENTIAL,
        source: 'STARCOM Analyzer',
        sourceUrl: 'http://example.com/data',
        verified: true,
        tags: ['test', 'analysis'],
        createdAt: '2025-07-01T00:00:00Z',
        updatedAt: '2025-07-02T00:00:00Z',
        createdBy: 'user-1',
        metadata: {
          entityType: 'text',
          content: 'This is test content for analysis',
          extracted: {
            entities: [],
            relationships: [],
            concepts: [],
            sentiments: []
          },
          analysisDate: '2025-07-01T00:00:00Z',
          analysisTechniques: ['nlp'],
          confidence: 85,
          relatedCases: []
        }
      };
      
      // Updated analysis
      const updatedAnalysis = {
        ...existingAnalysis,
        title: 'Updated Analysis',
        description: 'Updated analysis description',
        updatedAt: '2025-07-07T00:00:00Z',
        metadata: {
          ...existingAnalysis.metadata,
          confidence: 90,
          analysisTechniques: ['nlp', 'entity-extraction'],
          relatedCases: ['case-789']
        }
      };
      
      (storageOrchestrator.getEntity as jest.Mock).mockResolvedValue(existingAnalysis);
      (storageOrchestrator.updateEntity as jest.Mock).mockResolvedValue(updatedAnalysis);
      
      const result = await analyzerAdapter.updateAnalysis('analysis-123', {
        title: 'Updated Analysis',
        description: 'Updated analysis description',
        confidence: 90,
        analysisTechniques: ['nlp', 'entity-extraction'],
        relatedCases: ['case-789']
      });
      
      expect(result).not.toBeNull();
      expect(result.title).toBe('Updated Analysis');
      expect(result.description).toBe('Updated analysis description');
      expect(result.confidence).toBe(90);
      expect(result.analysisTechniques).toContain('entity-extraction');
      expect(result.relatedCases).toContain('case-789');
      
      // Verify correct update was sent
      expect(storageOrchestrator.updateEntity).toHaveBeenCalled();
      const updateData = (storageOrchestrator.updateEntity as jest.Mock).mock.calls[0][1];
      expect(updateData.title).toBe('Updated Analysis');
      expect(updateData.description).toBe('Updated analysis description');
      expect(updateData.metadata.confidence).toBe(90);
      expect(updateData.metadata.analysisTechniques).toContain('entity-extraction');
      expect(updateData.metadata.relatedCases).toContain('case-789');
    });
    
    test('deleteAnalysis removes an analysis', async () => {
      // Mock a successful deletion
      (storageOrchestrator.deleteEntity as jest.Mock).mockResolvedValue(true);
      
      const result = await analyzerAdapter.deleteAnalysis('analysis-123');
      
      expect(result).toBe(true);
      expect(storageOrchestrator.deleteEntity).toHaveBeenCalledWith('analysis-123');
    });
  });
  
  describe('Content analysis', () => {
    test('analyzeContent processes content and returns results', async () => {
      // Mock successful analysis creation
      const mockAnalysis = {
        id: 'analysis-789',
        title: 'Analysis of text content',
        description: 'Automated analysis of text content',
        entityType: 'text',
        source: 'STARCOM Analyzer',
        sourceUrl: 'http://example.com/sample',
        content: 'This is a sample text with mentions of John and New York.',
        extracted: {
          entities: [
            {
              id: 'entity-1',
              text: 'John',
              type: 'PERSON',
              relevance: 0.8,
              confidence: 0.9,
              position: { start: 35, end: 39 }
            },
            {
              id: 'entity-2',
              text: 'New York',
              type: 'LOCATION',
              relevance: 0.7,
              confidence: 0.85,
              position: { start: 44, end: 52 }
            }
          ],
          relationships: [
            {
              id: 'rel-1',
              type: 'LOCATED_IN',
              sourceId: 'entity-1',
              targetId: 'entity-2',
              sourceText: 'John',
              targetText: 'New York',
              confidence: 0.6,
              context: 'mentions of John and New York'
            }
          ],
          concepts: [],
          sentiments: []
        },
        classification: ClassificationLevel.UNCLASSIFIED,
        confidence: 85,
        analysisDate: '2025-07-07T00:00:00Z',
        analysisTechniques: ['natural language processing', 'entity extraction'],
        tags: ['automated-analysis', 'text'],
        metadata: {},
        relatedCases: [],
        createdAt: '2025-07-07T00:00:00Z',
        updatedAt: '2025-07-07T00:00:00Z',
        createdBy: 'system'
      };
      
      // Spy on createAnalysis to return our mock result
      jest.spyOn(analyzerAdapter, 'createAnalysis').mockResolvedValue(mockAnalysis);
      
      // Analysis request
      const request: AnalysisRequest = {
        content: 'This is a sample text with mentions of John and New York.',
        contentType: 'text',
        sourceUrl: 'http://example.com/sample',
        options: {
          extractEntities: true,
          extractRelationships: true
        }
      };
      
      const result = await analyzerAdapter.analyzeContent(request);
      
      expect(result.status).toBe('complete');
      expect(result.entity).toBe(mockAnalysis);
      expect(result.entity.extracted.entities.length).toBe(2);
      expect(result.entity.extracted.relationships.length).toBe(1);
      
      // Clean up mock
      (analyzerAdapter.createAnalysis as jest.Mock).mockRestore();
    });
    
    test('analyzeContent handles errors gracefully', async () => {
      // Spy on createAnalysis to throw an error
      jest.spyOn(analyzerAdapter, 'createAnalysis').mockImplementation(() => {
        throw new Error('Analysis failed');
      });
      
      // Analysis request
      const request: AnalysisRequest = {
        content: 'Test content',
        contentType: 'text'
      };
      
      const result = await analyzerAdapter.analyzeContent(request);
      
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Analysis failed');
      
      // Clean up mock
      (analyzerAdapter.createAnalysis as jest.Mock).mockRestore();
    });
  });
  
  describe('Link to case', () => {
    test('linkAnalysisToCase links analysis to case correctly', async () => {
      // Mock existing analysis
      const mockAnalysis = {
        id: 'analysis-123',
        title: 'Test Analysis',
        description: 'Analysis description',
        entityType: 'text',
        source: 'STARCOM Analyzer',
        sourceUrl: '',
        content: 'Test content',
        extracted: {
          entities: [],
          relationships: [],
          concepts: [],
          sentiments: []
        },
        classification: ClassificationLevel.UNCLASSIFIED,
        confidence: 80,
        analysisDate: '2025-07-07T00:00:00Z',
        analysisTechniques: [],
        tags: [],
        metadata: {},
        relatedCases: ['case-456'],
        createdAt: '2025-07-07T00:00:00Z',
        updatedAt: '2025-07-07T00:00:00Z',
        createdBy: 'user-1'
      };
      
      // Mock existing case
      const mockCase = {
        id: 'case-789',
        type: 'case_record',
        title: 'Test Case',
        description: 'Case description',
        caseNumber: 'CASE-001',
        status: 'open',
        priority: 'medium',
        assignedTo: ['user-1'],
        relatedEntities: [],
        classification: ClassificationLevel.UNCLASSIFIED,
        tags: [],
        createdAt: '2025-07-01T00:00:00Z',
        updatedAt: '2025-07-01T00:00:00Z',
        createdBy: 'user-1',
        metadata: {}
      };
      
      // Mock updated analysis after linking
      const updatedAnalysis = {
        ...mockAnalysis,
        relatedCases: ['case-456', 'case-789'],
        updatedAt: '2025-07-08T00:00:00Z'
      };
      
      // Mock updated case after linking
      const updatedCase = {
        ...mockCase,
        relatedEntities: ['analysis-123'],
        updatedAt: '2025-07-08T00:00:00Z'
      };
      
      // Setup mocks
      (analyzerAdapter.getAnalysis as jest.Mock) = jest.fn().mockResolvedValue(mockAnalysis);
      (analyzerAdapter.updateAnalysis as jest.Mock) = jest.fn().mockResolvedValue(updatedAnalysis);
      (storageOrchestrator.getEntity as jest.Mock).mockResolvedValue(mockCase);
      (storageOrchestrator.updateEntity as jest.Mock).mockResolvedValue(updatedCase);
      
      const result = await analyzerAdapter.linkAnalysisToCase('analysis-123', 'case-789');
      
      expect(result).toBe(true);
      expect(analyzerAdapter.updateAnalysis).toHaveBeenCalledWith('analysis-123', {
        relatedCases: ['case-456', 'case-789']
      });
      expect(storageOrchestrator.updateEntity).toHaveBeenCalledWith('case-789', {
        relatedEntities: ['analysis-123']
      });
      
      // Clean up mocks
      (analyzerAdapter.getAnalysis as jest.Mock).mockRestore();
      (analyzerAdapter.updateAnalysis as jest.Mock).mockRestore();
    });
  });
  
  describe('Event listeners', () => {
    test('setupEventListeners registers the correct event handlers', () => {
      // Create a new instance to trigger setupEventListeners
      const adapter = new (analyzerAdapter.constructor as any)();
      
      // Verify that the event listeners were registered
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('entity:created', expect.any(Function));
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('entity:updated', expect.any(Function));
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('entity:deleted', expect.any(Function));
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('case:updated', expect.any(Function));
    });
    
    test('dispose unsubscribes all event listeners', () => {
      const unsubscribe = jest.fn();
      
      // Mock the enhancedEventEmitter.on to return our mock unsubscribe
      (enhancedEventEmitter.on as jest.Mock).mockReturnValue({ unsubscribe });
      
      // Create an adapter instance
      const adapter = new (analyzerAdapter.constructor as any)();
      
      // Call dispose
      adapter.dispose();
      
      // Verify that unsubscribe was called for each listener
      expect(unsubscribe).toHaveBeenCalledTimes(4); // 4 event listeners
    });
  });
});
