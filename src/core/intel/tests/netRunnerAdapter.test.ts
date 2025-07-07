/**
 * NetRunnerAdapter Unit Tests
 * 
 * This file contains tests for the NetRunnerAdapter, verifying that it correctly
 * interfaces with the IntelDataCore system and provides proper network data handling.
 */

import { netRunnerAdapter, NetworkNode, NetworkEdge } from '../adapters/netRunnerAdapter';
import { storageOrchestrator } from '../storage/storageOrchestrator';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { ClassificationLevel } from '../types/intelDataModels';

// Mock the dependencies
jest.mock('../storage/storageOrchestrator', () => ({
  storageOrchestrator: {
    getEntity: jest.fn(),
    getRelationship: jest.fn(),
    getRelationships: jest.fn(),
    queryEntities: jest.fn(),
    queryRelationships: jest.fn(),
    createEntity: jest.fn(),
    createRelationship: jest.fn(),
    updateEntity: jest.fn(),
    updateRelationship: jest.fn(),
    deleteEntity: jest.fn(),
    deleteRelationship: jest.fn()
  }
}));

jest.mock('../events/enhancedEventEmitter', () => ({
  enhancedEventEmitter: {
    on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    emit: jest.fn()
  }
}));

describe('NetRunnerAdapter', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Node operations', () => {
    test('getNode returns null when node is not found', async () => {
      // Mock storage orchestrator to return null
      (storageOrchestrator.getEntity as jest.Mock).mockResolvedValue(null);
      
      const result = await netRunnerAdapter.getNode('non-existent-id');
      
      expect(result).toBeNull();
      expect(storageOrchestrator.getEntity).toHaveBeenCalledWith('non-existent-id');
    });
    
    test('getNode transforms and returns a valid node', async () => {
      // Mock a node entity
      const mockNodeEntity = {
        id: 'node-123',
        type: 'node_entity',
        nodeType: 'person',
        title: 'John Doe',
        description: 'Test person',
        category: 'suspect',
        importance: 5,
        properties: { age: 30 },
        classification: ClassificationLevel.CONFIDENTIAL,
        sourceReferences: ['ref-1'],
        tags: ['person', 'suspect'],
        createdAt: '2025-07-01T00:00:00Z',
        updatedAt: '2025-07-02T00:00:00Z',
        createdBy: 'user-1',
        metadata: { confidence: 85 }
      };
      
      (storageOrchestrator.getEntity as jest.Mock).mockResolvedValue(mockNodeEntity);
      
      const result = await netRunnerAdapter.getNode('node-123');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('node-123');
      expect(result?.label).toBe('John Doe');
      expect(result?.type).toBe('person');
      expect(result?.importance).toBe(5);
      expect(result?.confidence).toBe(85);
      expect(storageOrchestrator.getEntity).toHaveBeenCalledWith('node-123');
    });
    
    test('createNode properly transforms and creates a node', async () => {
      // Node data to create
      const nodeData = {
        label: 'Jane Smith',
        type: 'person',
        properties: { age: 28 },
        category: 'witness',
        importance: 3,
        confidence: 75,
        notes: 'Potential witness',
        tags: ['person', 'witness'],
        sourceReferences: ['interview-1'],
        classification: ClassificationLevel.CONFIDENTIAL,
        createdBy: 'user-1',
        metadata: { location: 'New York' }
      };
      
      // Mock the created entity
      const createdEntity = {
        id: 'node-456',
        type: 'node_entity',
        nodeType: 'person',
        title: 'Jane Smith',
        label: 'Jane Smith',
        description: 'Potential witness',
        category: 'witness',
        importance: 3,
        properties: { age: 28 },
        classification: ClassificationLevel.CONFIDENTIAL,
        sourceReferences: ['interview-1'],
        tags: ['person', 'witness'],
        createdAt: '2025-07-07T00:00:00Z',
        updatedAt: '2025-07-07T00:00:00Z',
        createdBy: 'user-1',
        metadata: { location: 'New York', confidence: 75 }
      };
      
      (storageOrchestrator.createEntity as jest.Mock).mockResolvedValue(createdEntity);
      
      const result = await netRunnerAdapter.createNode(nodeData);
      
      expect(result).not.toBeNull();
      expect(result.id).toBe('node-456');
      expect(result.label).toBe('Jane Smith');
      expect(result.type).toBe('person');
      expect(result.importance).toBe(3);
      expect(result.confidence).toBe(75);
      expect(storageOrchestrator.createEntity).toHaveBeenCalled();
      
      // Verify the entity was transformed correctly for storage
      const createdNodeEntity = (storageOrchestrator.createEntity as jest.Mock).mock.calls[0][0];
      expect(createdNodeEntity.nodeType).toBe('person');
      expect(createdNodeEntity.title).toBe('Jane Smith');
      expect(createdNodeEntity.description).toBe('Potential witness');
    });
    
    test('updateNode properly updates a node', async () => {
      // Mock existing node
      const existingNode = {
        id: 'node-123',
        type: 'node_entity',
        nodeType: 'person',
        title: 'John Doe',
        label: 'John Doe',
        description: 'Test person',
        category: 'suspect',
        importance: 5,
        properties: { age: 30 },
        classification: ClassificationLevel.CONFIDENTIAL,
        sourceReferences: ['ref-1'],
        tags: ['person', 'suspect'],
        createdAt: '2025-07-01T00:00:00Z',
        updatedAt: '2025-07-02T00:00:00Z',
        createdBy: 'user-1',
        metadata: { confidence: 85 }
      };
      
      // Updated node
      const updatedNode = {
        ...existingNode,
        label: 'John R. Doe',
        description: 'Updated person description',
        importance: 8,
        updatedAt: '2025-07-07T00:00:00Z',
        metadata: { ...existingNode.metadata, confidence: 90 }
      };
      
      (storageOrchestrator.getEntity as jest.Mock).mockResolvedValue(existingNode);
      (storageOrchestrator.updateEntity as jest.Mock).mockResolvedValue(updatedNode);
      
      const result = await netRunnerAdapter.updateNode('node-123', {
        label: 'John R. Doe',
        notes: 'Updated person description',
        importance: 8,
        confidence: 90
      });
      
      expect(result).not.toBeNull();
      expect(result.label).toBe('John R. Doe');
      expect(result.notes).toBe('Updated person description');
      expect(result.importance).toBe(8);
      expect(result.confidence).toBe(90);
      
      // Verify correct update was sent
      expect(storageOrchestrator.updateEntity).toHaveBeenCalled();
      const updateData = (storageOrchestrator.updateEntity as jest.Mock).mock.calls[0][1];
      expect(updateData.label).toBe('John R. Doe');
      expect(updateData.description).toBe('Updated person description');
      expect(updateData.importance).toBe(8);
      expect(updateData.metadata.confidence).toBe(90);
    });
    
    test('deleteNode removes a node and its connections', async () => {
      // Mock a successful deletion
      (storageOrchestrator.deleteEntity as jest.Mock).mockResolvedValue(true);
      
      // Mock connections to be deleted
      const connectedEdges = [
        { id: 'edge-1', source: 'node-123', target: 'node-456' },
        { id: 'edge-2', source: 'node-789', target: 'node-123' }
      ];
      
      (storageOrchestrator.queryRelationships as jest.Mock).mockResolvedValue(connectedEdges);
      (storageOrchestrator.deleteRelationship as jest.Mock).mockResolvedValue(true);
      
      const result = await netRunnerAdapter.deleteNode('node-123');
      
      expect(result).toBe(true);
      expect(storageOrchestrator.deleteEntity).toHaveBeenCalledWith('node-123');
      
      // Should have deleted connected edges
      expect(storageOrchestrator.deleteRelationship).toHaveBeenCalledTimes(2);
      expect(storageOrchestrator.deleteRelationship).toHaveBeenCalledWith('edge-1');
      expect(storageOrchestrator.deleteRelationship).toHaveBeenCalledWith('edge-2');
    });
  });
  
  describe('Edge operations', () => {
    test('getEdge returns null when edge is not found', async () => {
      // Mock storage orchestrator to return null
      (storageOrchestrator.getRelationship as jest.Mock).mockResolvedValue(null);
      
      const result = await netRunnerAdapter.getEdge('non-existent-id');
      
      expect(result).toBeNull();
      expect(storageOrchestrator.getRelationship).toHaveBeenCalledWith('non-existent-id');
    });
    
    test('createEdge properly transforms and creates an edge', async () => {
      // Edge data to create
      const edgeData = {
        source: 'node-123',
        target: 'node-456',
        label: 'KNOWS',
        properties: { since: 2020 },
        weight: 2,
        directed: true,
        confidence: 70,
        notes: 'Professional relationship',
        tags: ['relationship', 'professional'],
        sourceReferences: ['document-1'],
        classification: ClassificationLevel.CONFIDENTIAL,
        createdBy: 'user-1',
        metadata: { verified: true }
      };
      
      // Mock the created relationship
      const createdRelationship = {
        id: 'edge-789',
        type: 'edge_knows',
        sourceId: 'node-123',
        targetId: 'node-456',
        label: 'KNOWS',
        description: 'Professional relationship',
        weight: 2,
        directed: true,
        properties: { since: 2020 },
        classification: ClassificationLevel.CONFIDENTIAL,
        sourceReferences: ['document-1'],
        confidence: 70,
        tags: ['relationship', 'professional'],
        createdAt: '2025-07-07T00:00:00Z',
        updatedAt: '2025-07-07T00:00:00Z',
        createdBy: 'user-1',
        metadata: { verified: true }
      };
      
      (storageOrchestrator.createRelationship as jest.Mock).mockResolvedValue(createdRelationship);
      
      const result = await netRunnerAdapter.createEdge(edgeData);
      
      expect(result).not.toBeNull();
      expect(result.id).toBe('edge-789');
      expect(result.source).toBe('node-123');
      expect(result.target).toBe('node-456');
      expect(result.label).toBe('KNOWS');
      expect(result.weight).toBe(2);
      expect(result.confidence).toBe(70);
      expect(storageOrchestrator.createRelationship).toHaveBeenCalled();
      
      // Verify the relationship was transformed correctly for storage
      const createdEdgeRelationship = (storageOrchestrator.createRelationship as jest.Mock).mock.calls[0][0];
      expect(createdEdgeRelationship.type).toBe('edge_knows');
      expect(createdEdgeRelationship.sourceId).toBe('node-123');
      expect(createdEdgeRelationship.targetId).toBe('node-456');
    });
  });
  
  describe('Network operations', () => {
    test('getNetwork returns filtered network data', async () => {
      // Mock node query results
      const mockNodes = [
        {
          id: 'node-1',
          type: 'node_entity',
          nodeType: 'person',
          title: 'Person 1',
          label: 'Person 1',
          description: 'Description 1',
          properties: {},
          classification: ClassificationLevel.UNCLASSIFIED,
          tags: [],
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-01T00:00:00Z',
          createdBy: 'user-1',
          metadata: {}
        },
        {
          id: 'node-2',
          type: 'node_entity',
          nodeType: 'location',
          title: 'Location 1',
          label: 'Location 1',
          description: 'Description 2',
          properties: {},
          classification: ClassificationLevel.UNCLASSIFIED,
          tags: [],
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-01T00:00:00Z',
          createdBy: 'user-1',
          metadata: {}
        }
      ];
      
      // Mock edge query results
      const mockEdges = [
        {
          id: 'edge-1',
          type: 'edge_visited',
          sourceId: 'node-1',
          targetId: 'node-2',
          label: 'VISITED',
          description: '',
          weight: 1,
          directed: true,
          properties: {},
          classification: ClassificationLevel.UNCLASSIFIED,
          confidence: 50,
          tags: [],
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-01T00:00:00Z',
          createdBy: 'user-1',
          metadata: {}
        }
      ];
      
      (storageOrchestrator.queryEntities as jest.Mock).mockResolvedValue(mockNodes);
      (storageOrchestrator.queryRelationships as jest.Mock).mockResolvedValue(mockEdges);
      
      const result = await netRunnerAdapter.getNetwork(
        [{ property: 'type', operator: 'equals', value: 'person' }],
        [{ property: 'type', operator: 'equals', value: 'edge_visited' }]
      );
      
      expect(result.nodes.length).toBe(2);
      expect(result.edges.length).toBe(1);
      expect(result.nodes[0].id).toBe('node-1');
      expect(result.edges[0].id).toBe('edge-1');
    });
    
    test('getNetworkStats calculates correct statistics', async () => {
      // Mock network data
      const mockNodes = [
        {
          id: 'node-1',
          type: 'person',
          label: 'Person 1',
          properties: {},
          category: 'suspect',
          importance: 1,
          confidence: 50,
          notes: '',
          tags: [],
          sourceReferences: [],
          classification: ClassificationLevel.UNCLASSIFIED,
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-01T00:00:00Z',
          createdBy: 'user-1',
          metadata: {}
        },
        {
          id: 'node-2',
          type: 'person',
          label: 'Person 2',
          properties: {},
          category: 'witness',
          importance: 1,
          confidence: 50,
          notes: '',
          tags: [],
          sourceReferences: [],
          classification: ClassificationLevel.UNCLASSIFIED,
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-01T00:00:00Z',
          createdBy: 'user-1',
          metadata: {}
        },
        {
          id: 'node-3',
          type: 'location',
          label: 'Location 1',
          properties: {},
          category: 'place',
          importance: 1,
          confidence: 50,
          notes: '',
          tags: [],
          sourceReferences: [],
          classification: ClassificationLevel.UNCLASSIFIED,
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-01T00:00:00Z',
          createdBy: 'user-1',
          metadata: {}
        }
      ];
      
      const mockEdges = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          label: 'KNOWS',
          properties: {},
          weight: 1,
          directed: true,
          confidence: 50,
          notes: '',
          tags: [],
          sourceReferences: [],
          classification: ClassificationLevel.UNCLASSIFIED,
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-01T00:00:00Z',
          createdBy: 'user-1',
          metadata: {}
        },
        {
          id: 'edge-2',
          source: 'node-1',
          target: 'node-3',
          label: 'VISITED',
          properties: {},
          weight: 1,
          directed: true,
          confidence: 50,
          notes: '',
          tags: [],
          sourceReferences: [],
          classification: ClassificationLevel.UNCLASSIFIED,
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-01T00:00:00Z',
          createdBy: 'user-1',
          metadata: {}
        }
      ];
      
      // Mock the getNetwork function to return this data
      jest.spyOn(netRunnerAdapter, 'getNetwork').mockResolvedValue({
        nodes: mockNodes,
        edges: mockEdges
      });
      
      const stats = await netRunnerAdapter.getNetworkStats();
      
      expect(stats.totalNodes).toBe(3);
      expect(stats.totalEdges).toBe(2);
      expect(stats.nodeTypeDistribution.person).toBe(2);
      expect(stats.nodeTypeDistribution.location).toBe(1);
      expect(stats.edgeTypeDistribution.KNOWS).toBe(1);
      expect(stats.edgeTypeDistribution.VISITED).toBe(1);
      
      // Check connectivity metrics
      expect(stats.connectivityMetrics.averageDegree).toBeGreaterThan(0);
      expect(stats.connectivityMetrics.density).toBeGreaterThan(0);
      
      // Clean up mock
      (netRunnerAdapter.getNetwork as jest.Mock).mockRestore();
    });
  });
  
  describe('Event listeners', () => {
    test('setupEventListeners registers the correct event handlers', () => {
      // Create a new instance to trigger setupEventListeners
      const adapter = new (netRunnerAdapter.constructor as any)();
      
      // Verify that the event listeners were registered
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('entity:created', expect.any(Function));
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('entity:updated', expect.any(Function));
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('entity:deleted', expect.any(Function));
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('relationship:created', expect.any(Function));
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('relationship:updated', expect.any(Function));
      expect(enhancedEventEmitter.on).toHaveBeenCalledWith('relationship:deleted', expect.any(Function));
    });
    
    test('dispose unsubscribes all event listeners', () => {
      const unsubscribe = jest.fn();
      
      // Mock the enhancedEventEmitter.on to return our mock unsubscribe
      (enhancedEventEmitter.on as jest.Mock).mockReturnValue({ unsubscribe });
      
      // Create an adapter instance
      const adapter = new (netRunnerAdapter.constructor as any)();
      
      // Call dispose
      adapter.dispose();
      
      // Verify that unsubscribe was called for each listener
      expect(unsubscribe).toHaveBeenCalledTimes(6); // 6 event listeners
    });
  });
});
