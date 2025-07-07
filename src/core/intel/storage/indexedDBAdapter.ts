/**
 * IndexedDBAdapter - Persistent storage adapter for IntelDataCore
 * 
 * This adapter provides IndexedDB-based persistent storage capabilities
 * for the IntelDataCore system, enabling offline-first data persistence.
 */

import { 
  BaseEntity, 
  Relationship,
  StorageResult,
  PersistenceOptions
} from '../types/intelDataModels';

/**
 * IndexedDB storage configuration
 */
export interface IndexedDBConfig {
  databaseName: string;
  version: number;
  stores: {
    [key: string]: {
      keyPath: string;
      indices?: Array<{
        name: string;
        keyPath: string;
        options?: IDBIndexParameters;
      }>;
    };
  };
}

/**
 * Default configuration for IntelDataCore IndexedDB
 */
const DEFAULT_CONFIG: IndexedDBConfig = {
  databaseName: 'intel-data-core',
  version: 1,
  stores: {
    entities: {
      keyPath: 'id',
      indices: [
        { name: 'type', keyPath: 'type' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'tags', keyPath: 'tags', options: { multiEntry: true } }
      ]
    },
    relationships: {
      keyPath: 'id',
      indices: [
        { name: 'type', keyPath: 'type' },
        { name: 'sourceId', keyPath: 'sourceId' },
        { name: 'targetId', keyPath: 'targetId' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    }
  }
};

/**
 * IndexedDB implementation for persistent storage
 */
export class IndexedDBAdapter {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  
  /**
   * Constructor
   */
  constructor(private config: IndexedDBConfig = DEFAULT_CONFIG) {}
  
  /**
   * Initialize the database
   */
  async initialize(): Promise<boolean> {
    try {
      this.db = await this.openDatabase();
      return true;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      return false;
    }
  }
  
  /**
   * Open the IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }
    
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName, this.config.version);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores based on config
        for (const [storeName, storeConfig] of Object.entries(this.config.stores)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
            
            // Add indices
            if (storeConfig.indices) {
              for (const index of storeConfig.indices) {
                store.createIndex(index.name, index.keyPath, index.options);
              }
            }
          }
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };
      
      request.onerror = (event) => {
        reject(new Error(`Failed to open database: ${(event.target as IDBOpenDBRequest).error}`));
      };
    });
    
    return this.dbPromise;
  }
  
  /**
   * Store an entity
   */
  async storeEntity<T extends BaseEntity>(entity: T, options: PersistenceOptions = {}): Promise<StorageResult<T>> {
    try {
      const db = await this.openDatabase();
      
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('entities', 'readwrite');
        const store = transaction.objectStore('entities');
        
        // Add data serialization/encryption here based on options
        const serializedEntity = this.serializeEntity(entity, options);
        
        const request = store.put(serializedEntity);
        
        request.onsuccess = () => {
          resolve({ success: true, data: entity });
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to store entity: ${request.error}`));
        };
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error storing entity' 
      };
    }
  }
  
  /**
   * Retrieve an entity by ID
   */
  async getEntity<T extends BaseEntity>(id: string): Promise<StorageResult<T>> {
    try {
      const db = await this.openDatabase();
      
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('entities', 'readonly');
        const store = transaction.objectStore('entities');
        
        const request = store.get(id);
        
        request.onsuccess = () => {
          if (request.result) {
            // Deserialize the entity
            const entity = this.deserializeEntity<T>(request.result);
            resolve({ success: true, data: entity });
          } else {
            resolve({ success: false, error: `Entity with ID ${id} not found` });
          }
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to get entity: ${request.error}`));
        };
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error getting entity' 
      };
    }
  }
  
  /**
   * Delete an entity by ID
   */
  async deleteEntity(id: string): Promise<StorageResult<void>> {
    try {
      const db = await this.openDatabase();
      
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('entities', 'readwrite');
        const store = transaction.objectStore('entities');
        
        const request = store.delete(id);
        
        request.onsuccess = () => {
          resolve({ success: true });
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to delete entity: ${request.error}`));
        };
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error deleting entity' 
      };
    }
  }
  
  /**
   * Store a relationship
   */
  async storeRelationship(relationship: Relationship, options: PersistenceOptions = {}): Promise<StorageResult<Relationship>> {
    try {
      const db = await this.openDatabase();
      
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('relationships', 'readwrite');
        const store = transaction.objectStore('relationships');
        
        // Add data serialization/encryption here based on options
        const serializedRelationship = this.serializeRelationship(relationship, options);
        
        const request = store.put(serializedRelationship);
        
        request.onsuccess = () => {
          resolve({ success: true, data: relationship });
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to store relationship: ${request.error}`));
        };
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error storing relationship' 
      };
    }
  }
  
  /**
   * Query entities with basic filtering
   */
  async queryEntities<T extends BaseEntity>(
    options: {
      type?: string;
      tags?: string[];
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<StorageResult<T[]>> {
    try {
      const db = await this.openDatabase();
      
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('entities', 'readonly');
        const store = transaction.objectStore('entities');
        
        // Choose the appropriate index based on the query
        let source: IDBObjectStore | IDBIndex = store;
        let range: IDBKeyRange | null = null;
        
        if (options.type) {
          source = store.index('type');
          range = IDBKeyRange.only(options.type);
        }
        
        const request = source.getAll(range, options.limit);
        
        request.onsuccess = () => {
          let results = request.result as T[];
          
          // Apply client-side filtering
          if (options.tags && options.tags.length > 0) {
            results = results.filter(entity => 
              entity.tags.some(tag => options.tags!.includes(tag))
            );
          }
          
          if (options.startDate) {
            results = results.filter(entity => 
              new Date(entity.createdAt) >= new Date(options.startDate!)
            );
          }
          
          if (options.endDate) {
            results = results.filter(entity => 
              new Date(entity.createdAt) <= new Date(options.endDate!)
            );
          }
          
          // Apply offset
          if (options.offset) {
            results = results.slice(options.offset);
          }
          
          // Deserialize each entity
          const deserialized = results.map(entity => this.deserializeEntity<T>(entity));
          
          resolve({ success: true, data: deserialized });
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to query entities: ${request.error}`));
        };
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error querying entities' 
      };
    }
  }
  
  /**
   * Get relationships for an entity
   */
  async getRelationships(entityId: string): Promise<StorageResult<Relationship[]>> {
    try {
      const db = await this.openDatabase();
      
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('relationships', 'readonly');
        const store = transaction.objectStore('relationships');
        
        // Use sourceId and targetId indices
        const sourceIndex = store.index('sourceId');
        const targetIndex = store.index('targetId');
        
        const sourceRequest = sourceIndex.getAll(IDBKeyRange.only(entityId));
        
        sourceRequest.onsuccess = () => {
          const sourceRelationships = sourceRequest.result;
          
          const targetRequest = targetIndex.getAll(IDBKeyRange.only(entityId));
          
          targetRequest.onsuccess = () => {
            const targetRelationships = targetRequest.result;
            
            // Combine and deduplicate by ID
            const relationshipMap = new Map<string, Relationship>();
            
            [...sourceRelationships, ...targetRelationships].forEach(rel => {
              relationshipMap.set(rel.id, this.deserializeRelationship(rel));
            });
            
            resolve({ success: true, data: Array.from(relationshipMap.values()) });
          };
          
          targetRequest.onerror = () => {
            reject(new Error(`Failed to get target relationships: ${targetRequest.error}`));
          };
        };
        
        sourceRequest.onerror = () => {
          reject(new Error(`Failed to get source relationships: ${sourceRequest.error}`));
        };
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error getting relationships' 
      };
    }
  }
  
  /**
   * Clear all data from the database (for testing purposes)
   */
  async clearDatabase(): Promise<StorageResult<void>> {
    try {
      const db = await this.openDatabase();
      
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
        
        let completed = 0;
        let total = db.objectStoreNames.length;
        
        transaction.oncomplete = () => {
          resolve({ success: true });
        };
        
        transaction.onerror = () => {
          reject(new Error(`Failed to clear database: ${transaction.error}`));
        };
        
        for (let i = 0; i < total; i++) {
          const storeName = db.objectStoreNames[i];
          const clearRequest = transaction.objectStore(storeName).clear();
          
          clearRequest.onerror = () => {
            reject(new Error(`Failed to clear ${storeName}: ${clearRequest.error}`));
          };
        }
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error clearing database' 
      };
    }
  }
  
  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }
  
  /**
   * Serialize an entity for storage
   * This is where encryption and custom serialization would happen
   */
  private serializeEntity<T extends BaseEntity>(entity: T, options: PersistenceOptions): any {
    // For now, just return the entity directly
    // In the future, implement encryption or other transformations
    return { ...entity };
  }
  
  /**
   * Deserialize an entity from storage
   */
  private deserializeEntity<T extends BaseEntity>(data: any): T {
    // For now, just return the data directly
    // In the future, implement decryption or other transformations
    return data as T;
  }
  
  /**
   * Serialize a relationship for storage
   */
  private serializeRelationship(relationship: Relationship, options: PersistenceOptions): any {
    // For now, just return the relationship directly
    return { ...relationship };
  }
  
  /**
   * Deserialize a relationship from storage
   */
  private deserializeRelationship(data: any): Relationship {
    // For now, just return the data directly
    return data as Relationship;
  }
}

// Export singleton instance
export const indexedDBAdapter = new IndexedDBAdapter();
