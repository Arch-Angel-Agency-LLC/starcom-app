/**
 * Unit tests for DataMigrationManager
 */

import { 
  dataMigrationManager, 
  MigrationBuilder, 
  MigrationStatus,
  MigrationOpType
} from '../storage/dataMigrationManager';
import { intelDataStore } from '../store/intelDataStore';
import { indexedDBAdapter } from '../storage/indexedDBAdapter';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { NodeEntity, EdgeRelationship } from '../types/intelDataModels';

// Mock dependencies
jest.mock('../store/intelDataStore');
jest.mock('../storage/indexedDBAdapter');
jest.mock('../events/enhancedEventEmitter');

describe('DataMigrationManager', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    (intelDataStore.queryEntities as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'node1',
          type: 'node',
          label: 'Test Node 1',
          properties: { oldField: 'value' },
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'node2',
          type: 'node',
          label: 'Test Node 2',
          properties: { oldField: 'value2' },
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ]
    });
    
    (intelDataStore.updateEntity as jest.Mock).mockImplementation((id, updates) => {
      return Promise.resolve({
        success: true,
        data: { id, ...updates }
      });
    });
    
    (indexedDBAdapter.storeEntity as jest.Mock).mockResolvedValue({
      success: true
    });
    
    (enhancedEventEmitter.emit as jest.Mock).mockImplementation(() => {});
  });
  
  describe('MigrationBuilder', () => {
    it('should build a migration plan with operations', () => {
      const builder = new MigrationBuilder();
      
      const plan = builder
        .forEntityTypes('node')
        .addField('newField', 'defaultValue')
        .renameField('oldField', 'renamedField')
        .build(
          'Test Migration', 
          'A test migration plan', 
          '1.1.0', 
          '1.0.0'
        );
      
      expect(plan).toBeDefined();
      expect(plan.name).toBe('Test Migration');
      expect(plan.version).toBe('1.1.0');
      expect(plan.previousVersion).toBe('1.0.0');
      expect(plan.entityTypes).toContain('node');
      expect(plan.operations.length).toBe(2);
      expect(plan.operations[0].type).toBe(MigrationOpType.ADD_FIELD);
      expect(plan.operations[1].type).toBe(MigrationOpType.RENAME_FIELD);
    });
    
    it('should allow chaining multiple operations for different entity types', () => {
      const builder = new MigrationBuilder();
      
      const plan = builder
        .forEntityTypes('node')
        .addField('nodeField', 'nodeValue')
        .forEntityTypes('edge')
        .addField('edgeField', 'edgeValue')
        .build(
          'Multi-Entity Migration', 
          'Migration for multiple entity types', 
          '1.2.0', 
          '1.1.0'
        );
      
      expect(plan).toBeDefined();
      expect(plan.entityTypes).toContain('node');
      expect(plan.entityTypes).toContain('edge');
      expect(plan.operations.length).toBe(2);
      expect(plan.operations[0].entityTypes).toContain('node');
      expect(plan.operations[1].entityTypes).toContain('edge');
    });
  });
  
  describe('executeMigration', () => {
    it('should execute a migration plan successfully', async () => {
      // Create migration plan
      const builder = new MigrationBuilder();
      const plan = builder
        .forEntityTypes('node')
        .addField('newField', 'defaultValue')
        .renameField('oldField', 'renamedField')
        .build(
          'Test Migration', 
          'A test migration plan', 
          '1.1.0', 
          '1.0.0'
        );
      
      // Execute migration
      const result = await dataMigrationManager.executeMigration(plan);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.status).toBe(MigrationStatus.COMPLETED);
      expect(result.processedEntities).toBe(2);
      expect(result.failedEntities).toBe(0);
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('migration:start', expect.any(Object));
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('migration:complete', expect.any(Object));
      
      // Verify operations were applied
      expect(intelDataStore.updateEntity).toHaveBeenCalledTimes(2);
      expect(indexedDBAdapter.storeEntity).toHaveBeenCalledTimes(2);
    });
    
    it('should handle errors during migration', async () => {
      // Setup error condition
      (intelDataStore.updateEntity as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));
      
      // Create migration plan
      const builder = new MigrationBuilder();
      const plan = builder
        .forEntityTypes('node')
        .addField('newField', 'defaultValue')
        .build(
          'Error Migration', 
          'A migration that will fail', 
          '1.1.0', 
          '1.0.0'
        );
      
      // Execute migration
      const result = await dataMigrationManager.executeMigration(plan);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.status).toBe(MigrationStatus.FAILED);
      expect(result.errorMessages.length).toBeGreaterThan(0);
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('migration:failed', expect.any(Object));
    });
  });
  
  describe('applyOperation', () => {
    it('should add a field to an entity', () => {
      const entity = {
        id: 'test1',
        type: 'test',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };
      
      // Use private method through any to access it for testing
      const updatedEntity = (dataMigrationManager as any).applyOperation(
        entity,
        {
          type: MigrationOpType.ADD_FIELD,
          targetField: 'newField',
          defaultValue: 'testValue'
        }
      );
      
      expect(updatedEntity).toHaveProperty('newField', 'testValue');
      expect(updatedEntity.updatedAt).not.toBe(entity.updatedAt);
    });
    
    it('should rename a field in an entity', () => {
      const entity = {
        id: 'test1',
        type: 'test',
        oldField: 'originalValue',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };
      
      // Use private method through any to access it for testing
      const updatedEntity = (dataMigrationManager as any).applyOperation(
        entity,
        {
          type: MigrationOpType.RENAME_FIELD,
          sourceField: 'oldField',
          targetField: 'newField'
        }
      );
      
      expect(updatedEntity).not.toHaveProperty('oldField');
      expect(updatedEntity).toHaveProperty('newField', 'originalValue');
      expect(updatedEntity.updatedAt).not.toBe(entity.updatedAt);
    });
    
    it('should transform a field value', () => {
      const entity = {
        id: 'test1',
        type: 'test',
        number: 123,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };
      
      // Use private method through any to access it for testing
      const updatedEntity = (dataMigrationManager as any).applyOperation(
        entity,
        {
          type: MigrationOpType.TRANSFORM_FIELD,
          sourceField: 'number',
          transformFn: (value: number) => value * 2
        }
      );
      
      expect(updatedEntity.number).toBe(246);
      expect(updatedEntity.updatedAt).not.toBe(entity.updatedAt);
    });
  });
  
  describe('getMigrationLog', () => {
    it('should return log entries for a specific migration', async () => {
      // Create and execute a migration to generate logs
      const builder = new MigrationBuilder();
      const plan = builder
        .forEntityTypes('node')
        .addField('testLog', 'logValue')
        .build(
          'Log Test Migration', 
          'Testing migration logs', 
          '1.0.1', 
          '1.0.0'
        );
      
      await dataMigrationManager.executeMigration(plan);
      
      // Get logs for the migration
      const logs = dataMigrationManager.getMigrationLog(plan.id);
      
      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].planId).toBe(plan.id);
    });
    
    it('should clear migration logs', async () => {
      // Create and execute a migration to generate logs
      const builder = new MigrationBuilder();
      const plan = builder
        .forEntityTypes('node')
        .addField('clearTest', 'clearValue')
        .build(
          'Clear Logs Migration', 
          'Testing clearing migration logs', 
          '1.0.2', 
          '1.0.1'
        );
      
      await dataMigrationManager.executeMigration(plan);
      
      // Verify logs exist
      const logsBefore = dataMigrationManager.getMigrationLog();
      expect(logsBefore.length).toBeGreaterThan(0);
      
      // Clear logs
      dataMigrationManager.clearMigrationLog();
      
      // Verify logs are cleared
      const logsAfter = dataMigrationManager.getMigrationLog();
      expect(logsAfter.length).toBe(0);
    });
  });
});
