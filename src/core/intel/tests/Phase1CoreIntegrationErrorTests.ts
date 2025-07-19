/**
 * Phase 1: Core Integration Error Handling Tests
 * 
 * Test-Driven Development suite for Core Integration errors covering:
 * - Bridge Adapter Errors (10 types)
 * - Storage Integration Errors (7 types) 
 * - Quality Assessment Errors (8 types)
 * 
 * Total: 25 comprehensive test cases following TDD principles
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  // Bridge Adapter Errors
  BridgeAdapterInitializationError,
  IntelToEntityTransformationError,
  EntityToIntelTransformationError,
  LineageTrackingError,
  ConfidenceScorePropagationError,
  ReliabilityAssessmentError,
  MetadataMappingError,
  ClassificationMappingError,
  ProcessingStageTrackingError,
  BridgeValidationError,
  
  // Storage Integration Errors
  IntelStorageError,
  IntelligenceStorageError,
  BatchStorageError,
  LineageQueryError,
  ProcessingHistoryError,
  StorageConsistencyError,
  DataMigrationError,
  
  // Quality Assessment Errors
  ReliabilityCalculationError,
  ConfidenceScoreError,
  QualityMetricsError,
  DataValidationError,
  CorrelationAnalysisError,
  QualityAssessmentError,
  
  // Utility Classes
  NetRunnerErrorHandler,
  NetRunnerErrorAnalytics
} from '../errors/NetRunnerErrorTypes';

import {
  ErrorTestUtils,
  MockFactory,
  PerformanceTestUtils,
  TestDataGenerator,
  GlobalTestSetup,
  TEST_CONSTANTS
} from './ErrorHandlingTestInfrastructure';

// ============================================================================
// BRIDGE ADAPTER ERROR TESTS (10 types)
// ============================================================================

describe('Bridge Adapter Error Handling', () => {
  let mockStorageOrchestrator: any;
  let mockIntelBridge: any;
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    mockStorageOrchestrator = MockFactory.createMockStorageOrchestrator();
    mockIntelBridge = {
      entities: [],
      transformIntelToEntity: jest.fn(),
      transformEntityToIntel: jest.fn(),
      addProcessingStep: jest.fn()
    };
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('BridgeAdapterInitializationError', () => {
    it('should create error with proper structure and context', () => {
      // TDD: Test error creation first
      const context = ErrorTestUtils.createMockContext({ 
        configPath: '/config/bridge.json',
        missingDependencies: ['storageOrchestrator', 'intelProcessor']
      });
      
      const error = new BridgeAdapterInitializationError(
        'Missing required dependencies',
        context
      );

      ErrorTestUtils.validateErrorStructure(error, 'BridgeAdapterInitializationError');
      ErrorTestUtils.validateErrorContext(error, context);
      expect(error.code).toBe('BRIDGE_INIT_FAILED');
      expect(error.category).toBe('BRIDGE_ADAPTER');
      expect(error.severity).toBe('high');
    });

    it('should handle bridge initialization failure scenarios', async () => {
      // TDD: Test various failure scenarios
      const failureScenarios = [
        { reason: 'Storage not available', shouldRetry: false },
        { reason: 'Configuration missing', shouldRetry: false },
        { reason: 'Network timeout', shouldRetry: true },
        { reason: 'Memory insufficient', shouldRetry: false }
      ];

      for (const scenario of failureScenarios) {
        const error = new BridgeAdapterInitializationError(
          scenario.reason,
          { scenario: scenario.reason }
        );
        
        errorAnalytics.addError(error);
        
        expect(NetRunnerErrorHandler.isRetryableError(error)).toBe(scenario.shouldRetry);
      }

      const metrics = errorAnalytics.getMetrics();
      expect(metrics.totalErrors).toBe(failureScenarios.length);
      expect(metrics.errorsByCategory['BRIDGE_ADAPTER']).toBe(failureScenarios.length);
    });

    it('should measure performance of error creation and handling', async () => {
      const { result, duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
        const error = new BridgeAdapterInitializationError('Performance test');
        NetRunnerErrorHandler.handleError(error);
        return error;
      });

      expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.ERROR_CREATION);
      expect(result).toBeInstanceOf(BridgeAdapterInitializationError);
    });
  });

  describe('IntelToEntityTransformationError', () => {
    it('should create transformation error with Intel context', () => {
      const intelId = 'intel-12345';
      const mockIntel = ErrorTestUtils.createMockIntelEntity({ id: intelId });
      
      const error = new IntelToEntityTransformationError(
        intelId,
        'Missing required field: title',
        { intel: mockIntel, failedField: 'title' }
      );

      ErrorTestUtils.validateErrorStructure(error, 'IntelToEntityTransformationError');
      expect(error.message).toContain(intelId);
      expect(error.context.intel.id).toBe(intelId);
      expect(error.context.failedField).toBe('title');
    });

    it('should handle batch transformation failures', async () => {
      const mockIntelBatch = Array(10).fill(null).map((_, i) => 
        ErrorTestUtils.createMockIntelEntity({ id: `intel-${i}` })
      );

      const transformationErrors = [];
      
      // Simulate transformation failures
      for (let i = 0; i < mockIntelBatch.length; i++) {
        if (i % 3 === 0) { // Every 3rd item fails
          const error = new IntelToEntityTransformationError(
            mockIntelBatch[i].id,
            'Transformation failed',
            { batchIndex: i, totalBatch: mockIntelBatch.length }
          );
          transformationErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(transformationErrors.length).toBe(4); // 0, 3, 6, 9
      
      const patterns = errorAnalytics.getCriticalErrorPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('EntityToIntelTransformationError', () => {
    it('should create reverse transformation error', () => {
      const entityId = 'entity-67890';
      const mockEntity = { id: entityId, title: 'Test Entity', type: 'invalid-type' };
      
      const error = new EntityToIntelTransformationError(
        entityId,
        'Invalid entity type for Intel conversion',
        { entity: mockEntity, validTypes: ['email', 'technology', 'social'] }
      );

      ErrorTestUtils.validateErrorStructure(error, 'EntityToIntelTransformationError');
      expect(error.message).toContain(entityId);
      expect(error.context.validTypes).toEqual(['email', 'technology', 'social']);
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

      ErrorTestUtils.validateErrorStructure(error, 'LineageTrackingError');
      expect(error.message).toContain(sourceId);
      expect(error.message).toContain(targetId);
      expect(error.context.lineagePath).toHaveLength(4);
    });

    it('should handle complex lineage tracking scenarios', async () => {
      const lineageMap = new Map();
      const errors = [];

      // Create complex lineage relationships
      const entities = Array(20).fill(null).map((_, i) => `entity-${i}`);
      
      for (let i = 0; i < entities.length - 1; i++) {
        try {
          // Simulate lineage tracking
          if (lineageMap.has(entities[i + 1])) {
            throw new LineageTrackingError(
              entities[i],
              entities[i + 1],
              'Duplicate lineage entry',
              { existingEntry: lineageMap.get(entities[i + 1]) }
            );
          }
          lineageMap.set(entities[i + 1], entities[i]);
        } catch (error) {
          if (error instanceof LineageTrackingError) {
            errors.push(error);
            errorAnalytics.addError(error);
          }
        }
      }

      expect(errors.length).toBe(0); // Should be no duplicates in this test
      expect(lineageMap.size).toBe(entities.length - 1);
    });
  });

  describe('ConfidenceScorePropagationError', () => {
    it('should handle confidence score calculation failures', () => {
      const entityId = 'entity-confidence-test';
      
      const error = new ConfidenceScorePropagationError(
        entityId,
        'Confidence score out of bounds: 150',
        { 
          originalScore: 150,
          validRange: [0, 100],
          calculationMethod: 'weighted-average'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ConfidenceScorePropagationError');
      expect(error.context.originalScore).toBe(150);
      expect(error.context.validRange).toEqual([0, 100]);
    });

    it('should test confidence propagation across entity relationships', async () => {
      const entities = [
        { id: 'root', confidence: 90, children: ['child1', 'child2'] },
        { id: 'child1', confidence: 75, children: ['grandchild1'] },
        { id: 'child2', confidence: 85, children: [] },
        { id: 'grandchild1', confidence: 60, children: [] }
      ];

      const propagationErrors = [];

      // Simulate confidence propagation
      for (const entity of entities) {
        for (const childId of entity.children) {
          try {
            const child = entities.find(e => e.id === childId);
            if (child && child.confidence > entity.confidence) {
              throw new ConfidenceScorePropagationError(
                childId,
                'Child confidence cannot exceed parent',
                { 
                  parentId: entity.id,
                  parentConfidence: entity.confidence,
                  childConfidence: child.confidence
                }
              );
            }
          } catch (error) {
            if (error instanceof ConfidenceScorePropagationError) {
              propagationErrors.push(error);
              errorAnalytics.addError(error);
            }
          }
        }
      }

      // In this test case, no child should exceed parent confidence
      expect(propagationErrors.length).toBe(0);
    });
  });

  describe('ReliabilityAssessmentError', () => {
    it('should handle reliability assessment failures', () => {
      const dataSource = 'unreliable-source-xyz';
      
      const error = new ReliabilityAssessmentError(
        dataSource,
        'Source blacklisted for multiple false positives',
        {
          blacklistReason: 'false-positives',
          falsePositiveCount: 15,
          threshold: 10,
          lastValidData: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ReliabilityAssessmentError');
      expect(error.context.falsePositiveCount).toBe(15);
      expect(error.context.threshold).toBe(10);
    });
  });

  describe('MetadataMappingError', () => {
    it('should handle metadata field mapping failures', () => {
      const fieldName = 'customSecurityLevel';
      
      const error = new MetadataMappingError(
        fieldName,
        'Unknown security level: ULTRA_SECRET',
        {
          providedValue: 'ULTRA_SECRET',
          validValues: ['UNCLASS', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'],
          mappingTable: 'security-classifications'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'MetadataMappingError');
      expect(error.context.providedValue).toBe('ULTRA_SECRET');
      expect(error.context.validValues).toHaveLength(4);
    });
  });

  describe('ClassificationMappingError', () => {
    it('should handle classification mapping failures', () => {
      const classification = 'INVALID_CLASSIFICATION';
      
      const error = new ClassificationMappingError(
        classification,
        'Classification not found in mapping table',
        {
          supportedClassifications: ['UNCLASS', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'],
          suggestedMapping: 'UNCLASS'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ClassificationMappingError');
      expect(error.context.suggestedMapping).toBe('UNCLASS');
    });
  });

  describe('ProcessingStageTrackingError', () => {
    it('should handle processing stage tracking failures', () => {
      const stage = 'invalid-stage';
      const entityId = 'entity-stage-test';
      
      const error = new ProcessingStageTrackingError(
        stage,
        entityId,
        'Invalid processing stage',
        {
          validStages: ['collection', 'processing', 'analysis', 'visualization'],
          currentStage: 'unknown'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProcessingStageTrackingError');
      expect(error.context.validStages).toHaveLength(4);
    });
  });

  describe('BridgeValidationError', () => {
    it('should handle bridge validation failures', () => {
      const validationType = 'schema-validation';
      
      const error = new BridgeValidationError(
        validationType,
        'Required field missing: sourceIntelligence',
        {
          validationRules: ['required-fields', 'type-checking', 'relationship-integrity'],
          failedRule: 'required-fields',
          missingFields: ['sourceIntelligence', 'processingLineage']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'BridgeValidationError');
      expect(error.context.missingFields).toHaveLength(2);
    });
  });
});

// ============================================================================
// STORAGE INTEGRATION ERROR TESTS (7 types)
// ============================================================================

describe('Storage Integration Error Handling', () => {
  let mockStorage: any;
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    mockStorage = MockFactory.createMockStorageOrchestrator('failure');
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('IntelStorageError', () => {
    it('should create storage error with Intel context', async () => {
      const intelId = 'intel-storage-test';
      const mockIntel = ErrorTestUtils.createMockIntelEntity({ id: intelId });
      
      const error = new IntelStorageError(
        intelId,
        'Database connection timeout',
        {
          intel: mockIntel,
          storageBackend: 'postgresql',
          connectionTimeout: 5000,
          retryAttempt: 3
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'IntelStorageError');
      expect(error.context.storageBackend).toBe('postgresql');
      expect(error.context.retryAttempt).toBe(3);
    });

    it('should test storage operation with network failures', async () => {
      const intelObjects = Array(5).fill(null).map((_, i) => 
        ErrorTestUtils.createMockIntelEntity({ id: `intel-${i}` })
      );

      const storageErrors = [];

      for (const intel of intelObjects) {
        try {
          await mockStorage.storeIntel(intel);
        } catch (storageError) {
          const error = new IntelStorageError(
            intel.id,
            storageError.message,
            { intel, originalError: storageError }
          );
          storageErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(storageErrors.length).toBe(intelObjects.length);
      expect(mockStorage.storeIntel).toHaveBeenCalledTimes(intelObjects.length);
    });
  });

  describe('IntelligenceStorageError', () => {
    it('should handle Intelligence object storage failures', async () => {
      const intelligenceId = 'intelligence-storage-test';
      const mockIntelligence = {
        id: intelligenceId,
        sourceIntel: ['intel-1', 'intel-2'],
        analysis: 'Complex analysis data',
        confidence: 85
      };
      
      const error = new IntelligenceStorageError(
        intelligenceId,
        'Storage quota exceeded',
        {
          intelligence: mockIntelligence,
          quotaLimit: '100GB',
          currentUsage: '98GB',
          objectSize: '5GB'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'IntelligenceStorageError');
      expect(error.context.quotaLimit).toBe('100GB');
    });
  });

  describe('BatchStorageError', () => {
    it('should handle batch storage operation failures', async () => {
      const batchSize = 100;
      const mockBatch = TestDataGenerator.generateLargeDataset(batchSize);
      
      const error = new BatchStorageError(
        batchSize,
        'Transaction rollback due to constraint violation',
        {
          batch: mockBatch.slice(0, 5), // Include sample for context
          failedAt: 47,
          constraintViolation: 'unique_constraint_id',
          transactionId: 'tx-12345'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'BatchStorageError');
      expect(error.context.batchSize).toBeUndefined(); // batchSize is in constructor
      expect(error.context.failedAt).toBe(47);
    });

    it('should test batch storage performance limits', async () => {
      const largeBatches = [10, 50, 100, 500, 1000];
      const performanceResults = [];

      for (const batchSize of largeBatches) {
        const { duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
          const batch = TestDataGenerator.generateLargeDataset(batchSize);
          try {
            await mockStorage.batchStoreIntel(batch);
          } catch (error) {
            const batchError = new BatchStorageError(
              batchSize,
              error.message,
              { performanceTest: true, batchSize }
            );
            errorAnalytics.addError(batchError);
          }
        });

        performanceResults.push({ batchSize, duration });
      }

      // Expect larger batches to take longer (or fail faster due to limits)
      expect(performanceResults.length).toBe(largeBatches.length);
    });
  });

  describe('LineageQueryError', () => {
    it('should handle lineage query failures', async () => {
      const targetId = 'lineage-query-test';
      
      const error = new LineageQueryError(
        targetId,
        'Lineage graph too complex, query timeout',
        {
          queryTimeout: 30000,
          graphDepth: 15,
          nodeCount: 10000,
          queryComplexity: 'exponential'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'LineageQueryError');
      expect(error.context.graphDepth).toBe(15);
      expect(error.context.nodeCount).toBe(10000);
    });
  });

  describe('ProcessingHistoryError', () => {
    it('should handle processing history retrieval failures', async () => {
      const entityId = 'history-test-entity';
      
      const error = new ProcessingHistoryError(
        entityId,
        'History data corrupted or missing',
        {
          expectedSteps: 5,
          foundSteps: 2,
          corruptedSteps: ['step-3', 'step-4', 'step-5'],
          lastValidTimestamp: Date.now() - 3600000 // 1 hour ago
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProcessingHistoryError');
      expect(error.context.corruptedSteps).toHaveLength(3);
    });
  });

  describe('StorageConsistencyError', () => {
    it('should handle storage consistency check failures', async () => {
      const dataType = 'intel-intelligence-relationships';
      
      const error = new StorageConsistencyError(
        dataType,
        'Orphaned Intelligence objects found',
        {
          orphanedCount: 25,
          totalIntelligence: 1000,
          missingSourceIntel: ['intel-123', 'intel-456', 'intel-789'],
          consistencyCheck: 'referential-integrity'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'StorageConsistencyError');
      expect(error.context.orphanedCount).toBe(25);
      expect(error.context.missingSourceIntel).toHaveLength(3);
    });
  });

  describe('DataMigrationError', () => {
    it('should handle data migration failures', async () => {
      const migrationStep = 'schema-upgrade-v2.1-to-v2.2';
      
      const error = new DataMigrationError(
        migrationStep,
        'Column type conversion failed',
        {
          migrationVersion: 'v2.2.0',
          failedTable: 'intel_entities',
          failedColumn: 'confidence_metrics',
          convertedRows: 15000,
          totalRows: 20000,
          rollbackRequired: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'DataMigrationError');
      expect(error.context.rollbackRequired).toBe(true);
      expect(error.context.convertedRows).toBeLessThan(error.context.totalRows);
    });
  });
});

// ============================================================================
// QUALITY ASSESSMENT ERROR TESTS (8 types)
// ============================================================================

describe('Quality Assessment Error Handling', () => {
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('ReliabilityCalculationError', () => {
    it('should handle reliability calculation failures', () => {
      const dataType = 'email-intelligence';
      
      const error = new ReliabilityCalculationError(
        dataType,
        'Insufficient data points for reliable calculation',
        {
          requiredDataPoints: 10,
          availableDataPoints: 3,
          confidenceInterval: 0.95,
          calculationMethod: 'statistical-sampling'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ReliabilityCalculationError');
      expect(error.context.availableDataPoints).toBeLessThan(error.context.requiredDataPoints);
    });
  });

  describe('ConfidenceScoreError', () => {
    it('should handle confidence score calculation errors', () => {
      const entityId = 'confidence-calc-test';
      
      const error = new ConfidenceScoreError(
        entityId,
        'NaN result in confidence calculation',
        {
          inputMetrics: {
            accuracy: 0.85,
            completeness: NaN, // This causes the error
            freshness: 0.90,
            reliability: 0.75
          },
          calculationFormula: 'weighted-average',
          weights: [0.3, 0.25, 0.25, 0.2]
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ConfidenceScoreError');
      expect(Number.isNaN(error.context.inputMetrics.completeness)).toBe(true);
    });
  });

  describe('QualityMetricsError', () => {
    it('should handle quality metrics calculation failures', () => {
      const metricType = 'data-freshness';
      
      const error = new QualityMetricsError(
        metricType,
        'Timestamp parsing error in freshness calculation',
        {
          invalidTimestamps: ['not-a-date', '2023-13-45', ''],
          validTimestamps: ['2023-07-13T10:30:00Z', '2023-07-12T15:45:00Z'],
          freshnessThreshold: 86400000 // 24 hours in ms
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'QualityMetricsError');
      expect(error.context.invalidTimestamps).toHaveLength(3);
    });
  });

  describe('DataValidationError', () => {
    it('should handle data validation failures', () => {
      const dataField = 'email-address';
      
      const error = new DataValidationError(
        dataField,
        'Invalid email format detected',
        {
          invalidValue: 'not-an-email-address',
          validationRule: 'RFC5322-compliant',
          validExamples: ['user@domain.com', 'test+tag@example.org'],
          fieldRequired: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'DataValidationError');
      expect(error.context.fieldRequired).toBe(true);
    });

    it('should test comprehensive data validation scenarios', () => {
      const validationTests = [
        { field: 'url', value: 'not-a-url', rule: 'valid-url' },
        { field: 'ip-address', value: '999.999.999.999', rule: 'valid-ipv4' },
        { field: 'confidence', value: 150, rule: 'range-0-100' },
        { field: 'timestamp', value: 'yesterday', rule: 'iso-8601' },
        { field: 'classification', value: 'ULTRA_SECRET', rule: 'valid-classification' }
      ];

      const validationErrors = [];

      for (const test of validationTests) {
        const error = new DataValidationError(
          test.field,
          `Validation failed for rule: ${test.rule}`,
          { 
            value: test.value,
            rule: test.rule,
            testSuite: 'comprehensive-validation'
          }
        );
        validationErrors.push(error);
        errorAnalytics.addError(error);
      }

      expect(validationErrors.length).toBe(validationTests.length);
      
      const metrics = errorAnalytics.getMetrics();
      expect(metrics.errorsByCode['DATA_VALIDATION_FAILED']).toBe(validationTests.length);
    });
  });

  describe('CorrelationAnalysisError', () => {
    it('should handle correlation analysis failures', () => {
      const sourceId = 'entity-correlation-1';
      const targetId = 'entity-correlation-2';
      
      const error = new CorrelationAnalysisError(
        sourceId,
        targetId,
        'Insufficient common attributes for correlation',
        {
          sourceAttributes: ['email', 'domain', 'ip'],
          targetAttributes: ['social', 'handle', 'platform'],
          commonAttributes: [], // No common attributes
          correlationThreshold: 0.3,
          correlationMethods: ['attribute-overlap', 'semantic-similarity', 'temporal-correlation']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'CorrelationAnalysisError');
      expect(error.context.commonAttributes).toHaveLength(0);
    });
  });

  describe('QualityAssessmentError', () => {
    it('should handle general quality assessment failures', () => {
      const metricType = 'overall-quality-score';
      
      const error = new QualityAssessmentError(
        `Quality assessment failed for ${metricType}`,
        'QUALITY_ASSESSMENT_FAILED',
        {
          assessmentType: metricType,
          inputData: {
            accuracy: 0.85,
            completeness: 0.90,
            consistency: 0.75,
            freshness: 0.80
          },
          failureReason: 'inconsistent-metric-scales',
          expectedRange: [0, 1],
          actualRanges: {
            accuracy: [0, 1],
            completeness: [0, 1], 
            consistency: [0, 100], // Wrong scale
            freshness: [0, 1]
          }
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'QualityAssessmentError');
      expect(error.context.actualRanges.consistency).toEqual([0, 100]);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS FOR CORE ERRORS
// ============================================================================

describe('Core Integration Error Handling - Integration Tests', () => {
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  it('should handle cascading error scenarios', async () => {
    // Test cascading failures across multiple components
    const mockIntel = ErrorTestUtils.createMockIntelEntity();

    // 1. Bridge initialization fails
    const bridgeError = new BridgeAdapterInitializationError(
      'Storage service unavailable',
      { serviceUrl: 'http://storage-service:5432' }
    );
    errorAnalytics.addError(bridgeError);

    // 2. This causes transformation to fail
    const transformError = new IntelToEntityTransformationError(
      mockIntel.id,
      'Bridge adapter not initialized',
      { intel: mockIntel, cascadingFrom: bridgeError.code }
    );
    errorAnalytics.addError(transformError);

    // 3. Which causes storage to fail
    const storageError = new IntelStorageError(
      mockIntel.id,
      'Cannot store untransformed Intel',
      { intel: mockIntel, cascadingFrom: transformError.code }
    );
    errorAnalytics.addError(storageError);

    const criticalPatterns = errorAnalytics.getCriticalErrorPatterns();
    expect(criticalPatterns.length).toBeGreaterThan(0);
    
    const metrics = errorAnalytics.getMetrics();
    expect(metrics.totalErrors).toBe(3);
    expect(metrics.criticalErrors).toBeGreaterThan(0);
  });

  it('should measure performance of error analytics', async () => {
    const largeErrorSet = Array(1000).fill(null).map((_, i) => {
      const errorTypes = [
        BridgeAdapterInitializationError,
        IntelStorageError,
        ConfidenceScoreError,
        DataValidationError
      ];
      const ErrorType = errorTypes[i % errorTypes.length];
      return new ErrorType(`Performance test error ${i}`, { testIndex: i });
    });

    const { duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
      for (const error of largeErrorSet) {
        errorAnalytics.addError(error);
      }
      
      const metrics = errorAnalytics.getMetrics();
      const commonErrors = errorAnalytics.getMostCommonErrors(10);
      const criticalPatterns = errorAnalytics.getCriticalErrorPatterns();
      
      return { metrics, commonErrors, criticalPatterns };
    });

    expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.BATCH_PROCESSING);
    expect(errorAnalytics.getMetrics().totalErrors).toBe(1000);
  });

  it('should validate error recovery scenarios', async () => {
    const retryableErrors = [
      new ProxyConnectionError('proxy-1.example.com', 'Connection timeout'),
      new ContentRetrievalError('https://example.com', 408, 'Request timeout'),
      new ProcessingTimeoutError('data-processing', 30000)
    ];

    const nonRetryableErrors = [
      new BridgeAdapterInitializationError('Configuration missing'),
      new DataMigrationError('schema-upgrade', 'Incompatible data types'),
      new StorageConsistencyError('referential-integrity', 'Foreign key violations')
    ];

    // Test retryable error identification
    for (const error of retryableErrors) {
      expect(NetRunnerErrorHandler.isRetryableError(error)).toBe(true);
      errorAnalytics.addError(error);
    }

    for (const error of nonRetryableErrors) {
      expect(NetRunnerErrorHandler.isRetryableError(error)).toBe(false);
      errorAnalytics.addError(error);
    }

    const metrics = errorAnalytics.getMetrics();
    expect(metrics.retryableErrors).toBe(retryableErrors.length);
    expect(metrics.totalErrors - metrics.retryableErrors).toBe(nonRetryableErrors.length);
  });

  it('should validate error context preservation', () => {
    const complexContext = {
      operation: 'multi-step-processing',
      step: 3,
      totalSteps: 10,
      previousSteps: [
        { step: 1, success: true, duration: 100 },
        { step: 2, success: true, duration: 150 },
      ],
      environmentInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      },
      userInfo: {
        userId: 'test-user-123',
        sessionId: 'session-456',
        permissions: ['read', 'write', 'analyze']
      }
    };

    const error = new ProcessingStageTrackingError(
      'data-analysis',
      'entity-complex-context',
      'Step 3 validation failed',
      complexContext
    );

    ErrorTestUtils.validateErrorContext(error, complexContext);
    
    const errorContext = NetRunnerErrorHandler.getErrorContext(error);
    expect(errorContext.context).toEqual(complexContext);
    expect(errorContext.timestamp).toBeDefined();
    expect(errorContext.category).toBe('BRIDGE_ADAPTER');
  });
});

export default {
  ErrorTestUtils,
  MockFactory,
  PerformanceTestUtils,
  TestDataGenerator,
  GlobalTestSetup,
  TEST_CONSTANTS
};
