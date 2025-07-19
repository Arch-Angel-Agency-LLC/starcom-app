/**
 * TDD Phase 1A: Core Integration Errors - Focused Test
 * 
 * Testing Bridge Adapter errors step by step following TDD methodology
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Import specific error types we're testing
import { 
  BridgeAdapterInitializationError,
  IntelToEntityTransformationError,
  EntityToIntelTransformationError,
  LineageTrackingError
} from '../errors/NetRunnerErrorTypes';

describe('TDD Phase 1A: Bridge Adapter Error Types', () => {
  
  describe('BridgeAdapterInitializationError', () => {
    it('should create bridge initialization error with proper structure', () => {
      const context = { 
        configPath: '/config/bridge.json',
        missingDependencies: ['storageOrchestrator', 'intelProcessor']
      };
      
      const error = new BridgeAdapterInitializationError(
        'Missing required dependencies',
        context
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('BridgeAdapterInitializationError');
      expect(error.code).toBe('BRIDGE_INIT_FAILED');
      expect(error.category).toBe('BRIDGE_ADAPTER');
      expect(error.severity).toBe('high');
      expect(error.context).toEqual(context);
    });

    it('should be retryable for certain failure scenarios', () => {
      const networkTimeoutError = new BridgeAdapterInitializationError(
        'Network timeout during initialization',
        { reason: 'network-timeout', retryable: true }
      );

      const configMissingError = new BridgeAdapterInitializationError(
        'Configuration file missing',
        { reason: 'config-missing', retryable: false }
      );

      // These would connect to error handling utilities once implemented
      expect(networkTimeoutError.context?.retryable).toBe(true);
      expect(configMissingError.context?.retryable).toBe(false);
    });
  });

  describe('IntelToEntityTransformationError', () => {
    it('should create transformation error with Intel context', () => {
      const intelId = 'intel-12345';
      const mockIntel = { 
        id: intelId, 
        type: 'email',
        rawData: 'test@example.com',
        confidence: 0.85
      };
      
      const error = new IntelToEntityTransformationError(
        intelId,
        'Missing required field: title',
        { intel: mockIntel, failedField: 'title' }
      );

      expect(error.name).toBe('IntelToEntityTransformationError');
      expect(error.code).toBe('INTEL_TO_ENTITY_TRANSFORM_FAILED');
      expect(error.message).toContain(intelId);
      expect(error.context?.intel?.id).toBe(intelId);
      expect(error.context?.failedField).toBe('title');
    });
  });

  describe('EntityToIntelTransformationError', () => {
    it('should create reverse transformation error', () => {
      const entityId = 'entity-67890';
      const mockEntity = { 
        id: entityId, 
        title: 'Test Entity', 
        type: 'invalid-type' 
      };
      
      const error = new EntityToIntelTransformationError(
        entityId,
        'Invalid entity type for Intel conversion',
        { 
          entity: mockEntity, 
          validTypes: ['email', 'technology', 'social'] 
        }
      );

      expect(error.name).toBe('EntityToIntelTransformationError');
      expect(error.code).toBe('ENTITY_TO_INTEL_TRANSFORM_FAILED');
      expect(error.message).toContain(entityId);
      expect(error.context?.validTypes).toEqual(['email', 'technology', 'social']);
    });
  });

  describe('LineageTrackingError', () => {
    it('should track lineage errors with source and target context', () => {
      const sourceId = 'source-123';
      const targetId = 'target-456';
      
      const error = new LineageTrackingError(
        sourceId,
        targetId,
        'Circular dependency detected',
        { 
          lineagePath: [sourceId, 'intermediate-789', targetId, sourceId],
          detectionMethod: 'graph-traversal'
        }
      );

      expect(error.name).toBe('LineageTrackingError');
      expect(error.code).toBe('LINEAGE_TRACKING_FAILED');
      expect(error.message).toContain(sourceId);
      expect(error.message).toContain(targetId);
      expect(error.context?.lineagePath).toHaveLength(4);
    });
  });
});
