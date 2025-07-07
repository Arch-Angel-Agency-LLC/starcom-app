/**
 * Tests for IntelDataStore
 * 
 * This file contains unit tests for the in-memory data store
 * used by IntelDataCore.
 */

import { intelDataStore } from '../store/intelDataStore';
import { 
  NodeEntity, 
  EdgeRelationship, 
  NodeType,
  ClassificationLevel
} from '../types/intelDataModels';

describe('IntelDataStore', () => {
  // Clear the store before each test
  beforeEach(async () => {
    const allEntities = await intelDataStore.queryEntities({});
    if (allEntities.success && allEntities.data) {
      for (const entity of allEntities.data) {
        await intelDataStore.deleteEntity(entity.id);
      }
    }
  });
  
  describe('Entity CRUD operations', () => {
    it('should create an entity successfully', async () => {
      const testNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.PERSON,
        title: 'Test Person',
        description: 'A test person entity',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: true,
        confidence: 90,
        createdBy: 'test-user',
        properties: {
          firstName: 'Test',
          lastName: 'Person'
        },
        tags: ['test', 'person']
      };
      
      const result = await intelDataStore.createEntity<NodeEntity>(testNode);
      
      expect(result.success).toBeTruthy();
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeDefined();
      expect(result.data?.title).toBe('Test Person');
    });
    
    it('should retrieve an entity by ID', async () => {
      // Create a test entity first
      const testNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.ORGANIZATION,
        title: 'Test Organization',
        description: 'A test organization entity',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: true,
        confidence: 85,
        createdBy: 'test-user'
      };
      
      const createResult = await intelDataStore.createEntity<NodeEntity>(testNode);
      expect(createResult.success).toBeTruthy();
      const entityId = createResult.data!.id;
      
      // Now retrieve it
      const getResult = await intelDataStore.getEntity<NodeEntity>(entityId);
      
      expect(getResult.success).toBeTruthy();
      expect(getResult.data).toBeDefined();
      expect(getResult.data?.id).toBe(entityId);
      expect(getResult.data?.title).toBe('Test Organization');
    });
    
    it('should update an entity', async () => {
      // Create a test entity first
      const testNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.LOCATION,
        title: 'Original Location',
        description: 'A test location entity',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: false,
        confidence: 70,
        createdBy: 'test-user'
      };
      
      const createResult = await intelDataStore.createEntity<NodeEntity>(testNode);
      expect(createResult.success).toBeTruthy();
      const entityId = createResult.data!.id;
      
      // Update it
      const updates: Partial<NodeEntity> = {
        title: 'Updated Location',
        verified: true,
        confidence: 90
      };
      
      const updateResult = await intelDataStore.updateEntity<NodeEntity>(entityId, updates);
      
      expect(updateResult.success).toBeTruthy();
      expect(updateResult.data).toBeDefined();
      expect(updateResult.data?.id).toBe(entityId);
      expect(updateResult.data?.title).toBe('Updated Location');
      expect(updateResult.data?.verified).toBe(true);
      expect(updateResult.data?.confidence).toBe(90);
      
      // Original fields should be preserved
      expect(updateResult.data?.nodeType).toBe(NodeType.LOCATION);
      expect(updateResult.data?.description).toBe('A test location entity');
    });
    
    it('should delete an entity', async () => {
      // Create a test entity first
      const testNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.DOMAIN,
        title: 'Test Domain',
        description: 'A test domain entity',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: true,
        confidence: 80,
        createdBy: 'test-user'
      };
      
      const createResult = await intelDataStore.createEntity<NodeEntity>(testNode);
      expect(createResult.success).toBeTruthy();
      const entityId = createResult.data!.id;
      
      // Delete it
      const deleteResult = await intelDataStore.deleteEntity(entityId);
      
      expect(deleteResult.success).toBeTruthy();
      
      // Verify it's gone
      const getResult = await intelDataStore.getEntity<NodeEntity>(entityId);
      expect(getResult.success).toBeFalsy();
    });
  });
  
  describe('Relationship operations', () => {
    it('should create a relationship between entities', async () => {
      // Create two test entities
      const personNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.PERSON,
        title: 'Test Person',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: true,
        confidence: 90,
        createdBy: 'test-user'
      };
      
      const organizationNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.ORGANIZATION,
        title: 'Test Organization',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: true,
        confidence: 90,
        createdBy: 'test-user'
      };
      
      const personResult = await intelDataStore.createEntity<NodeEntity>(personNode);
      const orgResult = await intelDataStore.createEntity<NodeEntity>(organizationNode);
      
      expect(personResult.success).toBeTruthy();
      expect(orgResult.success).toBeTruthy();
      
      // Create a relationship
      const relationship: Partial<EdgeRelationship> = {
        type: 'MEMBER_OF',
        sourceId: personResult.data!.id,
        targetId: orgResult.data!.id,
        strength: 80,
        direction: 'unidirectional',
        createdBy: 'test-user',
        confidence: 85,
        tags: ['test', 'membership']
      };
      
      const relResult = await intelDataStore.createRelationship(relationship);
      
      expect(relResult.success).toBeTruthy();
      expect(relResult.data).toBeDefined();
      expect(relResult.data?.sourceId).toBe(personResult.data!.id);
      expect(relResult.data?.targetId).toBe(orgResult.data!.id);
      expect(relResult.data?.type).toBe('MEMBER_OF');
    });
    
    it('should retrieve relationships for an entity', async () => {
      // Create two test entities
      const personNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.PERSON,
        title: 'Test Person',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: true,
        confidence: 90,
        createdBy: 'test-user'
      };
      
      const organizationNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.ORGANIZATION,
        title: 'Test Organization',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: true,
        confidence: 90,
        createdBy: 'test-user'
      };
      
      const personResult = await intelDataStore.createEntity<NodeEntity>(personNode);
      const orgResult = await intelDataStore.createEntity<NodeEntity>(organizationNode);
      
      // Create a relationship
      const relationship: Partial<EdgeRelationship> = {
        type: 'MEMBER_OF',
        sourceId: personResult.data!.id,
        targetId: orgResult.data!.id,
        strength: 80,
        direction: 'unidirectional',
        createdBy: 'test-user',
        confidence: 85
      };
      
      await intelDataStore.createRelationship(relationship);
      
      // Get relationships for the person
      const personRels = await intelDataStore.getRelationships(personResult.data!.id);
      
      expect(personRels.success).toBeTruthy();
      expect(personRels.data).toBeDefined();
      expect(personRels.data?.length).toBe(1);
      expect(personRels.data?.[0].sourceId).toBe(personResult.data!.id);
      expect(personRels.data?.[0].targetId).toBe(orgResult.data!.id);
      
      // Get relationships for the organization
      const orgRels = await intelDataStore.getRelationships(orgResult.data!.id);
      
      expect(orgRels.success).toBeTruthy();
      expect(orgRels.data).toBeDefined();
      expect(orgRels.data?.length).toBe(1);
      expect(orgRels.data?.[0].sourceId).toBe(personResult.data!.id);
      expect(orgRels.data?.[0].targetId).toBe(orgResult.data!.id);
    });
  });
  
  describe('Query operations', () => {
    beforeEach(async () => {
      // Create some test data for queries
      const entities = [
        {
          type: 'node',
          nodeType: NodeType.PERSON,
          title: 'Alice Smith',
          classification: ClassificationLevel.UNCLASSIFIED,
          source: 'Unit Test',
          verified: true,
          confidence: 90,
          createdBy: 'test-user',
          tags: ['high-value', 'person']
        },
        {
          type: 'node',
          nodeType: NodeType.PERSON,
          title: 'Bob Jones',
          classification: ClassificationLevel.CONFIDENTIAL,
          source: 'Unit Test',
          verified: true,
          confidence: 75,
          createdBy: 'test-user',
          tags: ['person']
        },
        {
          type: 'node',
          nodeType: NodeType.ORGANIZATION,
          title: 'Acme Corp',
          classification: ClassificationLevel.UNCLASSIFIED,
          source: 'Unit Test',
          verified: true,
          confidence: 95,
          createdBy: 'test-user',
          tags: ['high-value', 'organization']
        },
        {
          type: 'node',
          nodeType: NodeType.LOCATION,
          title: 'New York',
          classification: ClassificationLevel.UNCLASSIFIED,
          source: 'Unit Test',
          verified: false,
          confidence: 60,
          createdBy: 'test-user',
          tags: ['location']
        }
      ];
      
      for (const entity of entities) {
        await intelDataStore.createEntity<NodeEntity>(entity);
      }
    });
    
    it('should query entities by type', async () => {
      const result = await intelDataStore.queryEntities<NodeEntity>({
        types: ['node'],
        filters: {
          nodeType: NodeType.PERSON
        }
      });
      
      expect(result.success).toBeTruthy();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.every(e => e.nodeType === NodeType.PERSON)).toBeTruthy();
    });
    
    it('should query entities by tags', async () => {
      const result = await intelDataStore.queryEntities<NodeEntity>({
        tags: ['high-value']
      });
      
      expect(result.success).toBeTruthy();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.some(e => e.title === 'Alice Smith')).toBeTruthy();
      expect(result.data?.some(e => e.title === 'Acme Corp')).toBeTruthy();
    });
    
    it('should query entities by confidence threshold', async () => {
      const result = await intelDataStore.queryEntities<NodeEntity>({
        filters: {
          confidence: 80
        }
      });
      
      expect(result.success).toBeTruthy();
      expect(result.data).toBeDefined();
      // Should include Alice (90) and Acme Corp (95), but not Bob (75) or New York (60)
      expect(result.data?.length).toBe(2);
      expect(result.data?.some(e => e.title === 'Alice Smith')).toBeTruthy();
      expect(result.data?.some(e => e.title === 'Acme Corp')).toBeTruthy();
    });
  });
  
  describe('Event system', () => {
    it('should emit events when entities are created', async () => {
      // Setup an event listener
      const eventPromise = new Promise<any>(resolve => {
        const unsubscribe = intelDataStore.subscribe(['entity.node'], event => {
          unsubscribe(['entity.node'], eventHandler);
          resolve(event);
        });
        
        const eventHandler = (event: any) => {
          unsubscribe(['entity.node'], eventHandler);
          resolve(event);
        };
      });
      
      // Create an entity to trigger the event
      const testNode: Partial<NodeEntity> = {
        type: 'node',
        nodeType: NodeType.PERSON,
        title: 'Event Test Person',
        classification: ClassificationLevel.UNCLASSIFIED,
        source: 'Unit Test',
        verified: true,
        confidence: 90,
        createdBy: 'test-user'
      };
      
      await intelDataStore.createEntity<NodeEntity>(testNode);
      
      // Wait for the event
      const event = await eventPromise;
      
      expect(event).toBeDefined();
      expect(event.type).toBe('create');
      expect(event.topic).toBe('entity.node');
      expect(event.data.title).toBe('Event Test Person');
    });
  });
});
