/**
 * Unit tests for CacheManager
 * 
 * Tests the functionality of the cache manager, including
 * basic operations, eviction policies, and query caching.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
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
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });
  
  afterEach(() => {
    cacheManager.dispose();
    jest.restoreAllMocks();
    jest.useRealTimers();
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
      jest.spyOn(Date, 'now').mockImplementation(() => 1051);
      
      // Assert
      expect(cacheManager.get('expires-soon')).toBeNull();
      expect(cacheManager.has('expires-soon')).toBe(false);
    });
    
    it('should evict least recently used entries when full', () => {
      const smallCache = new CacheManager({ maxSize: 1000, defaultTtl: 100, maxEntries: 10 });

      smallCache.set('key-old', 'x'.repeat(300)); // ~600 bytes
      smallCache.set('key-recent', 'y'.repeat(100)); // ~200 bytes

      // Touch recent to ensure it is newest
      smallCache.get('key-recent');

      // Act - this insert should evict the oldest entry to free space
      smallCache.set('key-new', 'z'.repeat(300)); // ~600 bytes triggers eviction

      expect(smallCache.has('key-old')).toBe(false);
      expect(smallCache.has('key-recent')).toBe(true);
      expect(smallCache.has('key-new')).toBe(true);

      smallCache.dispose();
    });

    it('should increment eviction stats when evicting to free space', () => {
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`heavy-${i}`, 'x'.repeat(2000));
      }

      const stats = cacheManager.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
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

  describe('Cleanup scheduler', () => {
    it('removes expired entries on scheduled cleanup', () => {
      cacheManager.dispose();
      jest.restoreAllMocks();
      jest.useFakeTimers();
      jest.setSystemTime(0);

      const scheduledCache = new CacheManager({ defaultTtl: 10, maxSize: 1000, maxEntries: 10 });
      try {
        scheduledCache.set('short-lived', 'value');

        expect(scheduledCache.has('short-lived')).toBe(true);

        jest.advanceTimersByTime(60000);
        jest.runOnlyPendingTimers();

        expect(scheduledCache.has('short-lived')).toBe(false);
      } finally {
        scheduledCache.dispose();
        jest.useRealTimers();
      }
    });

    it('stops the cleanup interval when disposed', () => {
      cacheManager.dispose();
      jest.restoreAllMocks();
      jest.useFakeTimers();

      const scheduledCache = new CacheManager({ defaultTtl: 10 });
      try {
        expect(jest.getTimerCount()).toBeGreaterThan(0);

        scheduledCache.dispose();
        expect(jest.getTimerCount()).toBe(0);
      } finally {
        jest.useRealTimers();
      }
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
      
      // Assert: type-scoped entries removed
      expect(cacheManager.has('entity:type-a:e1')).toBe(false);
      expect(cacheManager.has('entity:type-a:e2')).toBe(false);
      expect(cacheManager.has('entity:type-b:e3')).toBe(true);
      // ID-based lookups remain available
      expect(cacheManager.getEntity('e1')).not.toBeNull();
      expect(cacheManager.getEntity('e2')).not.toBeNull();
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
      // Mock localStorage with writable descriptor
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
          length: 0,
          key: jest.fn()
        },
        writable: true,
        configurable: true
      });
    });

    afterEach(() => {
      // Clean up mocked storage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).localStorage;
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
      const getItemMock = localStorage.getItem as jest.Mock;
      getItemMock.mockReturnValue(JSON.stringify({
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

      persistentCache.dispose();
    });
  });
});
