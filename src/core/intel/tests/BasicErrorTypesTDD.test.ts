/**
 * TDD Red Phase: Basic Error Type Validation Test
 * 
 * Starting with the simplest test to validate error creation
 * Following TDD methodology: Red -> Green -> Refactor
 */

import { describe, it, expect } from '@jest/globals';

// Import basic error classes
import { 
  NetRunnerIntelError,
  IntelProcessingError,
  VisualizationError,
  BridgeAdapterError
} from '../errors/NetRunnerErrorTypes';

describe('TDD Phase: Basic Error Type Creation', () => {
  
  describe('RED PHASE: NetRunnerIntelError Base Class', () => {
    it('should create a basic NetRunnerIntelError with required properties', () => {
      // TDD Red: This test should pass if basic error structure exists
      const error = new NetRunnerIntelError(
        'Test error message',
        'TEST_ERROR_CODE',
        'TEST_CATEGORY',
        'medium'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NetRunnerIntelError);
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR_CODE');
      expect(error.category).toBe('TEST_CATEGORY');
      expect(error.severity).toBe('medium');
      expect(error.name).toBe('NetRunnerIntelError');
    });

    it('should create error with optional context', () => {
      const context = { 
        testId: 'test-123',
        timestamp: new Date().toISOString(),
        additionalInfo: 'test data'
      };
      
      const error = new NetRunnerIntelError(
        'Test with context',
        'TEST_WITH_CONTEXT',
        'TEST_CATEGORY',
        'high',
        context
      );

      expect(error.context).toEqual(context);
      expect(error.context.testId).toBe('test-123');
    });
  });

  describe('RED PHASE: Derived Error Classes', () => {
    it('should create IntelProcessingError correctly', () => {
      const error = new IntelProcessingError(
        'Processing failed',
        'PROCESSING_FAILED',
        { step: 'data-extraction' }
      );

      expect(error).toBeInstanceOf(NetRunnerIntelError);
      expect(error).toBeInstanceOf(IntelProcessingError);
      expect(error.category).toBe('INTEL_PROCESSING');
      expect(error.severity).toBe('high');
      expect(error.name).toBe('IntelProcessingError');
    });

    it('should create VisualizationError correctly', () => {
      const error = new VisualizationError(
        'Visualization rendering failed',
        'RENDER_FAILED',
        { component: 'NodeWeb' }
      );

      expect(error).toBeInstanceOf(NetRunnerIntelError);
      expect(error).toBeInstanceOf(VisualizationError);
      expect(error.category).toBe('VISUALIZATION');
      expect(error.severity).toBe('medium');
      expect(error.name).toBe('VisualizationError');
    });

    it('should create BridgeAdapterError correctly', () => {
      const error = new BridgeAdapterError(
        'Bridge adapter initialization failed',
        'BRIDGE_INIT_FAILED',
        { adapter: 'NodeWebAdapter' }
      );

      expect(error).toBeInstanceOf(NetRunnerIntelError);
      expect(error).toBeInstanceOf(BridgeAdapterError);
      expect(error.category).toBe('BRIDGE_ADAPTER');
      expect(error.severity).toBe('high');
      expect(error.name).toBe('BridgeAdapterError');
    });
  });
});
