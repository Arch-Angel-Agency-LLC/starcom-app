/**
 * Unit tests for IndexedDBAdapter
 */

import { v4 as uuidv4 } from 'uuid';
import { indexedDBAdapter, IndexedDBAdapter } from '../storage/indexedDBAdapter';
import { BaseEntity, Relationship } from '../types/intelDataModels';

/**
 * Mock IDB factories for testing
 */
const setupIndexedDBMock = () => {
  // This is a simplified mock for IndexedDB
  // In a real test environment, you would use a more comprehensive mock like fake-indexeddb
  
  const db = {
    objectStoreNames: ['entities', 'relationships'],
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        index: jest.fn().mockReturnValue({
          get: jest.fn(),
          getAll: jest.fn(),
          put: jest.fn()
        }),
        get: jest.fn(),
        getAll: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn()
      }),
      oncomplete: null,
      onerror: null
    }),
    close: jest.fn()
  };
  
  // Mock indexedDB.open
  const openRequest = {
    result: db,
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null
  };
  
  global.indexedDB = {
    open: jest.fn().mockReturnValue(openRequest)
  } as unknown as IDBFactory;
  
  return { db, openRequest };
};

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter;
  
  beforeEach(() => {
    const { db, openRequest } = setupIndexedDBMock();
    adapter = new IndexedDBAdapter({
      databaseName: 'test-db',
      version: 1,
      stores: {
        entities: { keyPath: 'id' },
        relationships: { keyPath: 'id' }
      }
    });
    
    // Manually trigger success to simulate DB open
    setTimeout(() => {
      if (openRequest.onsuccess) {
        openRequest.onsuccess({ target: openRequest } as unknown as Event);
      }
    }, 0);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('initialize should open the database', async () => {
    const result = await adapter.initialize();
    expect(result).toBe(true);
    expect(global.indexedDB.open).toHaveBeenCalledWith('test-db', 1);
  });
  
  test('storeEntity should store an entity in the database', async () => {
    const entity: BaseEntity = {
      id: uuidv4(),
      type: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test-user',
      metadata: {},
      tags: ['test']
    };
    
    const putMock = jest.fn();
    
    const db = (await adapter['openDatabase']()) as any;
    db.transaction().objectStore().put = putMock;
    
    // Setup success callback for put operation
    putMock.mockImplementation(() => {
      const request = { onsuccess: null, onerror: null };
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    });
    
    const result = await adapter.storeEntity(entity);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(entity);
    expect(putMock).toHaveBeenCalled();
  });
  
  test('getEntity should retrieve an entity by ID', async () => {
    const entityId = uuidv4();
    const entity: BaseEntity = {
      id: entityId,
      type: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test-user',
      metadata: {},
      tags: ['test']
    };
    
    const getMock = jest.fn();
    
    const db = (await adapter['openDatabase']()) as any;
    db.transaction().objectStore().get = getMock;
    
    // Setup success callback for get operation
    getMock.mockImplementation(() => {
      const request = { 
        result: entity,
        onsuccess: null, 
        onerror: null 
      };
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    });
    
    const result = await adapter.getEntity(entityId);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(entity);
    expect(getMock).toHaveBeenCalledWith(entityId);
  });
  
  test('getEntity should return error when entity not found', async () => {
    const entityId = uuidv4();
    
    const getMock = jest.fn();
    
    const db = (await adapter['openDatabase']()) as any;
    db.transaction().objectStore().get = getMock;
    
    // Setup success callback for get operation with no result
    getMock.mockImplementation(() => {
      const request = { 
        result: undefined,
        onsuccess: null, 
        onerror: null 
      };
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    });
    
    const result = await adapter.getEntity(entityId);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
    expect(getMock).toHaveBeenCalledWith(entityId);
  });
  
  test('deleteEntity should remove an entity by ID', async () => {
    const entityId = uuidv4();
    
    const deleteMock = jest.fn();
    
    const db = (await adapter['openDatabase']()) as any;
    db.transaction().objectStore().delete = deleteMock;
    
    // Setup success callback for delete operation
    deleteMock.mockImplementation(() => {
      const request = { onsuccess: null, onerror: null };
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    });
    
    const result = await adapter.deleteEntity(entityId);
    
    expect(result.success).toBe(true);
    expect(deleteMock).toHaveBeenCalledWith(entityId);
  });
  
  test('queryEntities should filter entities by type', async () => {
    const entities = [
      {
        id: uuidv4(),
        type: 'person',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test-user',
        metadata: {},
        tags: ['test']
      },
      {
        id: uuidv4(),
        type: 'organization',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test-user',
        metadata: {},
        tags: ['test']
      }
    ];
    
    const getAllMock = jest.fn();
    const indexMock = jest.fn().mockReturnValue({ getAll: getAllMock });
    
    const db = (await adapter['openDatabase']()) as any;
    db.transaction().objectStore().index = indexMock;
    
    // Setup success callback for getAll operation
    getAllMock.mockImplementation(() => {
      const request = { 
        result: [entities[0]],
        onsuccess: null, 
        onerror: null 
      };
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    });
    
    const result = await adapter.queryEntities({ type: 'person' });
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].type).toBe('person');
    expect(indexMock).toHaveBeenCalledWith('type');
  });
  
  test('clearDatabase should clear all object stores', async () => {
    const clearMock = jest.fn();
    
    const db = (await adapter['openDatabase']()) as any;
    db.transaction().objectStore().clear = clearMock;
    
    // Setup success callback for transaction
    const transaction = db.transaction();
    transaction.oncomplete = null;
    
    // Setup success callback for clear operation
    clearMock.mockImplementation(() => {
      const request = { onsuccess: null, onerror: null };
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
        if (transaction.oncomplete) transaction.oncomplete();
      }, 0);
      return request;
    });
    
    const result = await adapter.clearDatabase();
    
    expect(result.success).toBe(true);
    expect(clearMock).toHaveBeenCalled();
  });
});
