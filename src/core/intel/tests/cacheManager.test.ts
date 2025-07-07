/**
 * Unit tests for CacheManager
 * 
 * Tests the functionality of the cache manager, including
 * basic operations, eviction policies, and query caching.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheManager } from '../storage/cacheManager';
import { BaseEntity, IntelQueryOptions } from '../types/intelDataModels';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  
  beforeEach(() => {
    // Create a new cache manager for each test
    cacheManager = new CacheManager({
      maxSize: 10000, // Small size for testing eviction
      defaultTtl: 100, // Short TTL for testing expiration
      maxEntries: 10 // Small number for testing entry limits
    });
    
    // Mock Date.now for deterministic testing
    vi.spyOn(Date, 'now').mockImplementation(() => 1000);
  });
  
  afterEach(() => {
    cacheManager.dispose();
    vi.restoreAllMocks();
  });
  
  describe('Basic cache operations', () => {
    it('should store and retrieve values', () => {
      // Arrange
      const key = 'test-key';
      const value = { name: 'Test Value', data: [1, 2, 3] };
      
      // Act
      cacheManager.set(key, value);
      const retrieved = cacheManager.get(key);
      
      // Assert
      expect(retrieved).toEqual(value);
    });
    
    it('should return null for non-existent keys', () => {
      // Act
      const value = cacheManager.get('non-existent');
      
      // Assert
      expect(value).toBeNull();
    });
    
    it('should correctly report if a key exists', () => {
      // Arrange
      cacheManager.set('exists', 'value');
      
      // Act & Assert
      expect(cacheManager.has('exists')).toBe(true);
      expect(cacheManager.has('does-not-exist')).toBe(false);
    });
    
    it('should delete entries', () => {
      // Arrange
      cacheManager.set('to-delete', 'value');
      
      // Act
      const deleted = cacheManager.delete('to-delete');
      
      // Assert
      expect(deleted).toBe(true);
      expect(cacheManager.has('to-delete')).toBe(false);
    });
    
    it('should clear all entries', () => {
      // Arrange
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      
      // Act
      cacheManager.clear();
      
      // Assert
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
      expect(cacheManager.getStats().entries).toBe(0);
    });
  });
  
  describe('Expiration and eviction', () => {
    it('should expire entries based on TTL', () => {
      // Arrange
      cacheManager.set('expires-soon', 'value', 50);
      
      // Act - advance time beyond TTL
      vi.spyOn(Date, 'now').mockImplementation(() => 1051);
      
      // Assert
      expect(cacheManager.get('expires-soon')).toBeNull();
      expect(cacheManager.has('expires-soon')).toBe(false);
    });
    
    it('should evict least recently used entries when full', () => {
      // Arrange - fill the cache
      for (let i = 0; i < 10; i++) {
        cacheManager.set(`key-${i}`, `A very long string value for key ${i}`.repeat(10));
      }
      
      // Access some keys to update their last accessed time
      cacheManager.get('key-5');
      cacheManager.get('key-8');
      
      // Act - add one more entry to trigger eviction
      cacheManager.set('new-key', 'This should cause eviction');
      
      // Assert - the least recently accessed entries should be evicted
      expect(cacheManager.has('key-0')).toBe(false);
      expect(cacheManager.has('key-5')).toBe(true); // Recently accessed
      expect(cacheManager.has('key-8')).toBe(true); // Recently accessed
      expect(cacheManager.has('new-key')).toBe(true); // Just added
    });
    
    it('should track cache statistics', () => {
      // Arrange
      cacheManager.set('stats-test', 'value');
      cacheManager.get('stats-test');
      cacheManager.get('missing');
      
      // Act
      const stats = cacheManager.getStats();
      
      // Assert
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.entries).toBe(1);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
  
  describe('Entity caching', () => {
    it('should cache and retrieve entities', () => {
      // Arrange
      const entity: BaseEntity = {
        id: 'entity-1',
        type: 'test-entity',
        createdAt: '2025-07-01T00:00:00Z',
        updatedAt: '2025-07-01T00:00:00Z'
      };
      
      // Act
      cacheManager.cacheEntity(entity);
      
      // Assert
      expect(cacheManager.getEntity(entity.id)).toEqual(entity);
    });
    
    it('should invalidate entities by type', () => {
      // Arrange
      const entities = [
        { id: 'e1', type: 'type-a', createdAt: '', updatedAt: '' },
        { id: 'e2', type: 'type-a', createdAt: '', updatedAt: '' },
        { id: 'e3', type: 'type-b', createdAt: '', updatedAt: '' }
      ];
      
      entities.forEach(e => cacheManager.cacheEntity(e));
      
      // Act
      cacheManager.invalidateEntityType('type-a');
      
      // Assert
      expect(cacheManager.getEntity('e1')).toBeNull();
      expect(cacheManager.getEntity('e2')).toBeNull();
      expect(cacheManager.getEntity('e3')).not.toBeNull();
    });
  });
  
  describe('Query caching', () => {
    it('should cache and retrieve query results', () => {
      // Arrange
      const query: IntelQueryOptions = {
        types: ['test-type'],
        sortBy: 'createdAt',
        sortDirection: 'desc'
      };
      
      const results = [
        { id: 'r1', type: 'test-type', createdAt: '', updatedAt: '' },
        { id: 'r2', type: 'test-type', createdAt: '', updatedAt: '' }
      ];
      
      // Act
      cacheManager.cacheQueryResult(query, results);
      
      // Assert
      expect(cacheManager.getQueryResult(query)).toEqual(results);
    });
    
    it('should handle complex query objects', () => {
      // Arrange
      const query1: IntelQueryOptions = {
        types: ['test-type'],
        filters: [
          { field: 'name', operator: 'eq', value: 'Test' }
        ],
        sortBy: 'createdAt'
      };
      
      const query2: IntelQueryOptions = {
        types: ['test-type'],
        filters: [
          { field: 'name', operator: 'eq', value: 'Different' }
        ],
        sortBy: 'createdAt'
      };
      
      const results1 = [{ id: 'r1', name: 'Test' }];
      const results2 = [{ id: 'r2', name: 'Different' }];
      
      // Act
      cacheManager.cacheQueryResult(query1, results1);
      cacheManager.cacheQueryResult(query2, results2);
      
      // Assert
      expect(cacheManager.getQueryResult(query1)).toEqual(results1);
      expect(cacheManager.getQueryResult(query2)).toEqual(results2);
    });
    
    it('should invalidate all query results', () => {
      // Arrange
      const query1: IntelQueryOptions = { types: ['type-1'] };
      const query2: IntelQueryOptions = { types: ['type-2'] };
      
      cacheManager.cacheQueryResult(query1, [{ id: '1' }]);
      cacheManager.cacheQueryResult(query2, [{ id: '2' }]);
      
      // Act
      cacheManager.invalidateQueries();
      
      // Assert
      expect(cacheManager.getQueryResult(query1)).toBeNull();
      expect(cacheManager.getQueryResult(query2)).toBeNull();
    });
  });
  
  describe('Local storage integration', () => {
    beforeEach(() => {
      // Mock localStorage
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };
    });
    
    it('should save to localStorage when configured', () => {
      // Arrange
      const persistentCache = new CacheManager({
        persistToLocalStorage: true
      });
      
      // Act
      persistentCache.set('persist-test', 'value');
      persistentCache.dispose();
      
      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'intelDataCore_cache',
        expect.any(String)
      );
    });
    
    it('should load from localStorage when configured', () => {
      // Arrange
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
        entries: [['cached-key', {
          id: 'test-id',
          key: 'cached-key',
          data: 'cached-value',
          expires: Date.now() + 1000,
          lastAccessed: Date.now(),
          size: 100
        }]],
        stats: { hits: 0, misses: 0, size: 100, entries: 1, evictions: 0, oldestEntry: 0, newestEntry: 0 }
      }));
      
      // Act
      const persistentCache = new CacheManager({
        persistToLocalStorage: true
      });
      
      // Assert
      expect(localStorage.getItem).toHaveBeenCalledWith('intelDataCore_cache');
      expect(persistentCache.get('cached-key')).toBe('cached-value');
    });
  });
});
