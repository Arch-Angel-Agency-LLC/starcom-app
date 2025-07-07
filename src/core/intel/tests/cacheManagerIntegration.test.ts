/**
 * Unit tests for CacheManager integration with StorageOrchestrator
 */

import { storageOrchestrator } from '../storage/storageOrchestrator';
import { cacheManager } from '../storage/cacheManager';
import { intelDataStore } from '../store/intelDataStore';
import { indexedDBAdapter } from '../storage/indexedDBAdapter';
import { NodeEntity, TimelineEvent } from '../types/intelDataModels';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';

// Mock dependencies
jest.mock('../storage/cacheManager');
jest.mock('../store/intelDataStore');
jest.mock('../storage/indexedDBAdapter');
jest.mock('../events/enhancedEventEmitter');

describe('StorageOrchestrator with CacheManager', () => {
  // Sample test entities
  const testNode: NodeEntity = {
    id: 'test-node-1',
    type: 'node',
    label: 'Test Node',
    properties: { key: 'value' },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  };
  
  const testEvent: TimelineEvent = {
    id: 'test-event-1',
    type: 'timeline_event',
    title: 'Test Event',
    description: 'Test event description',
    timestamp: '2025-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock intelDataStore methods
    (intelDataStore.createEntity as jest.Mock).mockResolvedValue({
      success: true,
      data: testNode
    });
    
    (intelDataStore.getEntity as jest.Mock).mockResolvedValue({
      success: true,
      data: testNode
    });
    
    (intelDataStore.updateEntity as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...testNode, properties: { key: 'updated' } }
    });
    
    (intelDataStore.deleteEntity as jest.Mock).mockResolvedValue({
      success: true
    });
    
    (intelDataStore.queryEntities as jest.Mock).mockResolvedValue({
      success: true,
      data: [testNode, testEvent]
    });
    
    // Mock indexedDBAdapter methods
    (indexedDBAdapter.initialize as jest.Mock).mockResolvedValue(true);
    
    (indexedDBAdapter.storeEntity as jest.Mock).mockResolvedValue({
      success: true
    });
    
    (indexedDBAdapter.getEntity as jest.Mock).mockResolvedValue({
      success: true,
      data: testNode
    });
    
    (indexedDBAdapter.deleteEntity as jest.Mock).mockResolvedValue({
      success: true
    });
    
    (indexedDBAdapter.queryEntities as jest.Mock).mockResolvedValue({
      success: true,
      data: [testNode, testEvent]
    });
    
    // Mock cacheManager methods
    (cacheManager.cacheEntity as jest.Mock).mockImplementation(() => {});
    (cacheManager.getEntity as jest.Mock).mockReturnValue(null);
    (cacheManager.delete as jest.Mock).mockImplementation(() => {});
    (cacheManager.cacheQueryResult as jest.Mock).mockImplementation(() => {});
    (cacheManager.getQueryResult as jest.Mock).mockReturnValue(null);
    
    // Mock enhancedEventEmitter
    (enhancedEventEmitter.emit as jest.Mock).mockImplementation(() => {});
  });
  
  describe('storeEntity', () => {
    it('should cache entities when storing them', async () => {
      const result = await storageOrchestrator.storeEntity(testNode);
      
      expect(result.success).toBe(true);
      expect(cacheManager.cacheEntity).toHaveBeenCalledWith(testNode);
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('entity:created', expect.objectContaining({
        entityId: testNode.id,
        entityType: testNode.type
      }));
    });
  });
  
  describe('getEntity', () => {
    it('should retrieve from cache when available', async () => {
      // Setup cache hit
      (cacheManager.getEntity as jest.Mock).mockReturnValueOnce(testNode);
      
      const result = await storageOrchestrator.getEntity(testNode.id);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testNode);
      expect(intelDataStore.getEntity).not.toHaveBeenCalled();
      expect(indexedDBAdapter.getEntity).not.toHaveBeenCalled();
    });
    
    it('should retrieve from memory and cache when not in cache', async () => {
      const result = await storageOrchestrator.getEntity(testNode.id);
      
      expect(result.success).toBe(true);
      expect(cacheManager.cacheEntity).toHaveBeenCalledWith(testNode);
      expect(intelDataStore.getEntity).toHaveBeenCalledWith(testNode.id);
    });
    
    it('should retrieve from persistent storage and cache when not in memory', async () => {
      // Setup memory miss
      (intelDataStore.getEntity as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Not found in memory'
      });
      
      const result = await storageOrchestrator.getEntity(testNode.id);
      
      expect(result.success).toBe(true);
      expect(indexedDBAdapter.getEntity).toHaveBeenCalledWith(testNode.id);
      expect(cacheManager.cacheEntity).toHaveBeenCalledWith(testNode);
    });
  });
  
  describe('updateEntity', () => {
    it('should update cache when entity is updated', async () => {
      const updates = { properties: { key: 'updated' } };
      const updatedNode = { ...testNode, ...updates };
      
      (intelDataStore.updateEntity as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: updatedNode
      });
      
      const result = await storageOrchestrator.updateEntity(testNode.id, updates);
      
      expect(result.success).toBe(true);
      expect(cacheManager.cacheEntity).toHaveBeenCalledWith(updatedNode);
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('entity:updated', expect.objectContaining({
        entityId: testNode.id,
        entityType: testNode.type
      }));
    });
  });
  
  describe('deleteEntity', () => {
    it('should remove entity from cache when deleted', async () => {
      const result = await storageOrchestrator.deleteEntity(testNode.id);
      
      expect(result.success).toBe(true);
      expect(cacheManager.delete).toHaveBeenCalledWith(`entity:${testNode.id}`);
      expect(cacheManager.delete).toHaveBeenCalledWith(`entity:${testNode.type}:${testNode.id}`);
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('entity:deleted', expect.objectContaining({
        entityId: testNode.id,
        entityType: testNode.type
      }));
    });
  });
  
  describe('queryEntities', () => {
    it('should use cached query results when available', async () => {
      // Setup cache hit
      const cachedResults = [testNode];
      (cacheManager.getQueryResult as jest.Mock).mockReturnValueOnce(cachedResults);
      
      const result = await storageOrchestrator.queryEntities({ types: ['node'] });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedResults);
      expect(intelDataStore.queryEntities).not.toHaveBeenCalled();
      expect(indexedDBAdapter.queryEntities).not.toHaveBeenCalled();
    });
    
    it('should cache query results from memory', async () => {
      const queryOptions = { types: ['node'] };
      const queryResult = [testNode];
      
      (intelDataStore.queryEntities as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: queryResult
      });
      
      const result = await storageOrchestrator.queryEntities(queryOptions);
      
      expect(result.success).toBe(true);
      expect(cacheManager.cacheQueryResult).toHaveBeenCalledWith(queryOptions, queryResult);
    });
    
    it('should bypass cache when forceRefresh is true', async () => {
      const queryOptions = { types: ['node'], forceRefresh: true };
      
      await storageOrchestrator.queryEntities(queryOptions);
      
      expect(cacheManager.getQueryResult).not.toHaveBeenCalled();
      expect(intelDataStore.queryEntities).toHaveBeenCalledWith(queryOptions);
    });
  });
  
  describe('close', () => {
    it('should dispose of cacheManager resources on close', async () => {
      await storageOrchestrator.close();
      
      expect(cacheManager.dispose).toHaveBeenCalled();
      expect(indexedDBAdapter.close).toHaveBeenCalled();
    });
  });
});
