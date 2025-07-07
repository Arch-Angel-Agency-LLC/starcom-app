/**
 * BlockchainAdapter tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blockchainAdapter, BlockchainTransactionStatus } from '../blockchain/blockchainAdapter';

describe('BlockchainAdapter', () => {
  beforeEach(() => {
    // Reset the adapter's internal state
    // @ts-ignore - accessing private property for testing
    blockchainAdapter.initialized = false;
    // @ts-ignore - accessing private property for testing
    blockchainAdapter.pendingTransactions = new Map();
  });
  
  describe('generateHash', () => {
    it('should generate a consistent hash for the same entity', async () => {
      const entity = {
        id: 'test-entity-1',
        type: 'test',
        name: 'Test Entity',
        description: 'A test entity for blockchain verification',
        tags: ['test', 'blockchain'],
        createdAt: '2025-07-07T12:00:00Z'
      };
      
      const hash1 = await blockchainAdapter.generateHash(entity);
      const hash2 = await blockchainAdapter.generateHash(entity);
      
      expect(hash1).toBeDefined();
      expect(hash1).toBe(hash2);
    });
    
    it('should generate different hashes for different entities', async () => {
      const entity1 = {
        id: 'test-entity-1',
        type: 'test',
        name: 'Test Entity 1',
        description: 'A test entity for blockchain verification',
        tags: ['test', 'blockchain'],
        createdAt: '2025-07-07T12:00:00Z'
      };
      
      const entity2 = {
        id: 'test-entity-2',
        type: 'test',
        name: 'Test Entity 2',
        description: 'Another test entity for blockchain verification',
        tags: ['test', 'blockchain'],
        createdAt: '2025-07-07T12:00:00Z'
      };
      
      const hash1 = await blockchainAdapter.generateHash(entity1);
      const hash2 = await blockchainAdapter.generateHash(entity2);
      
      expect(hash1).not.toBe(hash2);
    });
  });
  
  describe('storeEntityHash', () => {
    it('should store an entity hash and return a transaction', async () => {
      const entity = {
        id: 'test-entity-1',
        type: 'test',
        name: 'Test Entity',
        description: 'A test entity for blockchain verification',
        tags: ['test', 'blockchain'],
        createdAt: '2025-07-07T12:00:00Z'
      };
      
      const transaction = await blockchainAdapter.storeEntityHash(entity);
      
      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.hash).toBeDefined();
      expect(transaction.entityId).toBe(entity.id);
      expect(transaction.status).toBe(BlockchainTransactionStatus.PENDING);
    });
  });
  
  describe('verifyEntity', () => {
    it('should verify an entity against its stored hash', async () => {
      const entity = {
        id: 'test-entity-1',
        type: 'test',
        name: 'Test Entity',
        description: 'A test entity for blockchain verification',
        tags: ['test', 'blockchain'],
        createdAt: '2025-07-07T12:00:00Z'
      };
      
      // First store the hash
      await blockchainAdapter.storeEntityHash(entity);
      
      // Then verify the entity
      const result = await blockchainAdapter.verifyEntity(entity);
      
      expect(result).toBeDefined();
      expect(result.verified).toBe(true);
      expect(result.entityHash).toBeDefined();
      expect(result.storedHash).toBeDefined();
    });
  });
  
  describe('getTransaction', () => {
    it('should retrieve transaction details for a valid transaction ID', async () => {
      const entity = {
        id: 'test-entity-1',
        type: 'test',
        name: 'Test Entity',
        description: 'A test entity for blockchain verification',
        tags: ['test', 'blockchain'],
        createdAt: '2025-07-07T12:00:00Z'
      };
      
      // Create a transaction
      const transaction = await blockchainAdapter.storeEntityHash(entity);
      
      // Retrieve the transaction details
      const retrievedTransaction = await blockchainAdapter.getTransaction(transaction.id);
      
      expect(retrievedTransaction).toBeDefined();
      expect(retrievedTransaction?.id).toBe(transaction.id);
      expect(retrievedTransaction?.entityId).toBe(entity.id);
    });
    
    it('should return null for an invalid transaction ID', async () => {
      const invalidTxId = 'invalid-transaction-id';
      
      const transaction = await blockchainAdapter.getTransaction(invalidTxId);
      
      expect(transaction).toBeNull();
    });
  });
});
