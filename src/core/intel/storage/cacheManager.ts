/**
 * CacheManager - Optimized data caching for IntelDataCore
 * 
 * This module provides intelligent caching capabilities for the
 * IntelDataCore system, including time-based expiration, LRU
 * eviction, and query result caching.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseEntity, IntelQueryOptions } from '../types/intelDataModels';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  id: string;
  key: string;
  data: T;
  expires: number; // Timestamp when this entry expires
  lastAccessed: number; // Timestamp when this entry was last accessed
  size: number; // Approximate size in bytes
  queryHash?: string; // For query results
  entityId?: string; // For entity cache
  entityType?: string; // For entity cache
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  // Maximum cache size in bytes (default: 10MB)
  maxSize?: number;
  
  // Default time-to-live in milliseconds (default: 5 minutes)
  defaultTtl?: number;
  
  // Maximum number of entries (default: 1000)
  maxEntries?: number;
  
  // Whether to use local storage for persistence (default: false)
  persistToLocalStorage?: boolean;
  
  // Custom serializer and deserializer
  serializer?: (data: any) => string;
  deserializer?: (data: string) => any;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 1000,
  persistToLocalStorage: false
};

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  evictions: number;
  oldestEntry: number;
  newestEntry: number;
}

/**
 * Main cache manager class
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    evictions: 0,
    oldestEntry: Date.now(),
    newestEntry: 0
  };
  private cleanupInterval: number | null = null;

  /**
   * Constructor
   */
  constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.removeExpiredEntries();
    }, 60000); // Check every minute
    
    // Load from local storage if enabled
    if (this.config.persistToLocalStorage) {
      this.loadFromLocalStorage();
    }
  }

  /**
   * Set a cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiry = now + (ttl || this.config.defaultTtl || DEFAULT_CACHE_CONFIG.defaultTtl!);
    
    // Serialize to estimate size
    const serialized = this.serialize(data);
    const size = serialized.length * 2; // Rough estimate: 2 bytes per character
    
    const entry: CacheEntry<T> = {
      id: uuidv4(),
      key,
      data,
      expires: expiry,
      lastAccessed: now,
      size
    };
    
    // Check if we need to make room
    if (this.stats.size + size > (this.config.maxSize || DEFAULT_CACHE_CONFIG.maxSize!)) {
      this.evictEntries(size);
    }
    
    // Store the entry
    this.cache.set(key, entry);
    
    // Update stats
    this.stats.size += size;
    this.stats.entries = this.cache.size;
    this.stats.newestEntry = Math.max(this.stats.newestEntry, now);
    
    // Persist if needed
    if (this.config.persistToLocalStorage) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Get a cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T>;
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (entry.expires < now) {
      this.cache.delete(key);
      this.stats.size -= entry.size;
      this.stats.entries = this.cache.size;
      this.stats.misses++;
      return null;
    }
    
    // Update last accessed time
    entry.lastAccessed = now;
    this.stats.hits++;
    
    return entry.data;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.size -= entry.size;
      this.stats.entries = this.cache.size;
      return false;
    }
    
    return true;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    this.cache.delete(key);
    this.stats.size -= entry.size;
    this.stats.entries = this.cache.size;
    
    // Persist if needed
    if (this.config.persistToLocalStorage) {
      this.saveToLocalStorage();
    }
    
    return true;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0,
      evictions: 0,
      oldestEntry: Date.now(),
      newestEntry: 0
    };
    
    // Persist if needed
    if (this.config.persistToLocalStorage) {
      localStorage.removeItem('intelDataCore_cache');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Cache an entity
   */
  cacheEntity<T extends BaseEntity>(entity: T, ttl?: number): void {
    // Create two cache entries:
    // 1. By ID for direct lookup
    const idKey = `entity:${entity.id}`;
    this.set(idKey, entity, ttl);
    
    // 2. By type and ID for type-based queries
    if (entity.type) {
      const typeKey = `entity:${entity.type}:${entity.id}`;
      this.set(typeKey, entity, ttl);
    }
  }

  /**
   * Get an entity by ID
   */
  getEntity<T extends BaseEntity>(id: string): T | null {
    const key = `entity:${id}`;
    return this.get<T>(key);
  }

  /**
   * Cache a query result
   */
  cacheQueryResult<T>(query: IntelQueryOptions, result: T[], ttl?: number): void {
    const queryHash = this.hashQuery(query);
    const key = `query:${queryHash}`;
    
    const entry: CacheEntry<T[]> = {
      id: uuidv4(),
      key,
      data: result,
      expires: Date.now() + (ttl || this.config.defaultTtl || DEFAULT_CACHE_CONFIG.defaultTtl!),
      lastAccessed: Date.now(),
      size: this.estimateSize(result),
      queryHash
    };
    
    // Check if we need to make room
    if (this.stats.size + entry.size > (this.config.maxSize || DEFAULT_CACHE_CONFIG.maxSize!)) {
      this.evictEntries(entry.size);
    }
    
    // Store the entry
    this.cache.set(key, entry);
    
    // Update stats
    this.stats.size += entry.size;
    this.stats.entries = this.cache.size;
    
    // Persist if needed
    if (this.config.persistToLocalStorage) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Get a cached query result
   */
  getQueryResult<T>(query: IntelQueryOptions): T[] | null {
    const queryHash = this.hashQuery(query);
    const key = `query:${queryHash}`;
    return this.get<T[]>(key);
  }

  /**
   * Invalidate all entities of a specific type
   */
  invalidateEntityType(type: string): void {
    const typePrefix = `entity:${type}:`;
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (key.startsWith(typePrefix)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Invalidate all query results
   */
  invalidateQueries(): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (key.startsWith('query:')) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Create a hash of a query for caching
   */
  private hashQuery(query: IntelQueryOptions): string {
    // Sort the query to ensure consistent hashing
    const sortedQuery = this.sortObject(query);
    const queryString = JSON.stringify(sortedQuery);
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  }

  /**
   * Sort an object's keys for consistent serialization
   */
  private sortObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }
    
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    
    keys.forEach(key => {
      sorted[key] = this.sortObject(obj[key]);
    });
    
    return sorted;
  }

  /**
   * Remove expired entries
   */
  private removeExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.expires < now) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.stats.size -= entry.size;
      }
    });
    
    this.stats.entries = this.cache.size;
    
    // Persist if needed
    if (this.config.persistToLocalStorage && keysToDelete.length > 0) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Evict entries to make room for new ones
   */
  private evictEntries(sizeNeeded: number): void {
    // Sort entries by last accessed time (oldest first)
    const entries = Array.from(this.cache.values())
      .sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    let freedSize = 0;
    const keysToDelete: string[] = [];
    
    for (const entry of entries) {
      keysToDelete.push(entry.key);
      freedSize += entry.size;
      this.stats.evictions++;
      
      if (freedSize >= sizeNeeded) {
        break;
      }
    }
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.stats.size -= entry.size;
      }
    });
    
    this.stats.entries = this.cache.size;
  }

  /**
   * Estimate the size of data in bytes
   */
  private estimateSize(data: any): number {
    const serialized = this.serialize(data);
    return serialized.length * 2; // Rough estimate: 2 bytes per character
  }

  /**
   * Serialize data for storage
   */
  private serialize(data: any): string {
    if (this.config.serializer) {
      return this.config.serializer(data);
    }
    return JSON.stringify(data);
  }

  /**
   * Deserialize data from storage
   */
  private deserialize(data: string): any {
    if (this.config.deserializer) {
      return this.config.deserializer(data);
    }
    return JSON.parse(data);
  }

  /**
   * Save cache to local storage
   */
  private saveToLocalStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      // Convert Map to array for serialization
      const cacheArray = Array.from(this.cache.entries());
      
      // Only save non-expired entries
      const now = Date.now();
      const validEntries = cacheArray.filter(([_, entry]) => entry.expires > now);
      
      localStorage.setItem('intelDataCore_cache', JSON.stringify({
        entries: validEntries,
        stats: this.stats
      }));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Load cache from local storage
   */
  private loadFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const cached = localStorage.getItem('intelDataCore_cache');
      
      if (!cached) {
        return;
      }
      
      const data = JSON.parse(cached);
      
      // Restore entries
      if (data.entries && Array.isArray(data.entries)) {
        data.entries.forEach(([key, entry]: [string, CacheEntry<any>]) => {
          this.cache.set(key, entry);
        });
      }
      
      // Restore stats
      if (data.stats) {
        this.stats = data.stats;
      }
      
      // Clean up expired entries
      this.removeExpiredEntries();
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Persist if needed
    if (this.config.persistToLocalStorage) {
      this.saveToLocalStorage();
    }
  }
}

// Export a singleton instance
export const cacheManager = new CacheManager();
