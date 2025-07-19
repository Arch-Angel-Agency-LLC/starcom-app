/**
 * Phase 2B: Enhanced Visualization Error Handling Tests
 * 
 * Test-Driven Development suite for Enhanced Visualization errors covering:
 * - NodeWeb Adapter Errors (12 types)
 * - Timeline Adapter Errors (8 types)
 * - Integration/Workflow Errors (10 types)
 * 
 * Total: 30 comprehensive test cases following TDD principles
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  // NodeWeb Adapter Errors
  NodeWebInitializationError,
  NodeWebMappingError,
  NodeWebRenderingError,
  NodeWebInteractionError,
  NodeLayoutError,
  EdgeRenderingError,
  GraphTraversalError,
  NodeWebPerformanceError,
  VisualizationDataError,
  NodeWebEventError,
  GraphComplexityError,
  NodeWebMemoryError,
  
  // Timeline Adapter Errors
  TimelineInitializationError,
  TemporalMappingError,
  TimelineRenderingError,
  EventSequencingError,
  TimelineDataError,
  TemporalAnalysisError,
  TimelinePerformanceError,
  TimelineEventError,
  
  // Integration/Workflow Errors
  IntegrationConfigurationError,
  WorkflowOrchestrationError,
  AdapterCommunicationError,
  DataSynchronizationError,
  EventHandlingError,
  StateManagementError,
  ConfigurationValidationError,
  DependencyResolutionError,
  ServiceDiscoveryError,
  LifecycleManagementError,
  
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
// NODEWEB ADAPTER ERROR TESTS (12 types)
// ============================================================================

describe('NodeWeb Adapter Error Handling', () => {
  let mockNodeWebAdapter: any;
  let mockGraphEngine: any;
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    mockNodeWebAdapter = {
      nodes: new Map(),
      edges: new Map(),
      layout: null,
      renderingContext: null,
      addNode: jest.fn(),
      addEdge: jest.fn(),
      render: jest.fn().mockRejectedValue(new Error('Rendering failed')),
      updateLayout: jest.fn()
    };
    
    mockGraphEngine = {
      forceLayout: jest.fn(),
      hierarchicalLayout: jest.fn(),
      circularLayout: jest.fn(),
      calculateMetrics: jest.fn()
    };
    
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('NodeWebInitializationError', () => {
    it('should create NodeWeb initialization error with context', () => {
      const component = 'graph-renderer';
      
      const error = new NodeWebInitializationError(
        component,
        'WebGL context creation failed',
        {
          requiredFeatures: ['WebGL2', 'vertex-shaders', 'fragment-shaders'],
          availableFeatures: ['WebGL1'],
          browserInfo: {
            userAgent: 'Mozilla/5.0...',
            webglVersion: '1.0',
            maxTextureSize: 4096,
            maxVertexUniforms: 1024
          },
          fallbackOptions: ['canvas-2d', 'svg-renderer']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'NodeWebInitializationError');
      expect(error.context.requiredFeatures).toHaveLength(3);
      expect(error.context.availableFeatures).not.toContain('WebGL2');
    });

    it('should test initialization with various browser capabilities', () => {
      const browserConfigs = [
        { name: 'Chrome', webgl: 'WebGL2', support: true },
        { name: 'Firefox', webgl: 'WebGL2', support: true },
        { name: 'Safari', webgl: 'WebGL1', support: false },
        { name: 'IE11', webgl: 'none', support: false },
        { name: 'Edge', webgl: 'WebGL2', support: true }
      ];

      const initErrors = [];

      for (const config of browserConfigs) {
        if (!config.support) {
          const error = new NodeWebInitializationError(
            'webgl-context',
            `WebGL2 not supported in ${config.name}`,
            {
              browser: config.name,
              webglSupport: config.webgl,
              requiresPolyfill: true,
              degradedPerformance: true
            }
          );
          initErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(initErrors.length).toBe(2); // Safari and IE11
    });
  });

  describe('NodeWebMappingError', () => {
    it('should handle entity to node mapping failures', () => {
      const entityId = 'entity-invalid-mapping';
      
      const error = new NodeWebMappingError(
        entityId,
        'Entity type not supported in NodeWeb visualization',
        {
          entityType: 'quantum-entanglement',
          supportedTypes: ['email', 'technology', 'social', 'location', 'organization'],
          mappingStrategy: 'type-based-rendering',
          fallbackNode: {
            type: 'generic',
            color: '#cccccc',
            size: 'medium'
          },
          customMappingRequired: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'NodeWebMappingError');
      expect(error.context.supportedTypes).not.toContain(error.context.entityType);
    });

    it('should test complex mapping scenarios', () => {
      const complexEntities = [
        { id: 'entity-1', type: 'hybrid-email-social', complexity: 'high' },
        { id: 'entity-2', type: 'nested-organization', complexity: 'very-high' },
        { id: 'entity-3', type: 'temporal-location', complexity: 'medium' },
        { id: 'entity-4', type: 'encrypted-communication', complexity: 'extreme' }
      ];

      const mappingErrors = [];

      for (const entity of complexEntities) {
        if (entity.complexity === 'extreme' || entity.complexity === 'very-high') {
          const error = new NodeWebMappingError(
            entity.id,
            `Mapping complexity too high for standard visualization`,
            {
              entity,
              complexityThreshold: 'high',
              requiresCustomRenderer: true,
              estimatedRenderTime: '5000ms'
            }
          );
          mappingErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(mappingErrors.length).toBe(2); // entity-2 and entity-4
    });
  });

  describe('NodeWebRenderingError', () => {
    it('should handle rendering pipeline failures', () => {
      const renderStage = 'vertex-buffer-creation';
      
      const error = new NodeWebRenderingError(
        renderStage,
        'Vertex buffer allocation failed: insufficient GPU memory',
        {
          nodeCount: 50000,
          edgeCount: 125000,
          vertexDataSize: '200MB',
          availableGPUMemory: '150MB',
          memoryPressure: true,
          renderingBackend: 'WebGL2',
          lastSuccessfulRender: Date.now() - 30000
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'NodeWebRenderingError');
      expect(error.context.nodeCount).toBe(50000);
      expect(error.context.memoryPressure).toBe(true);
    });

    it('should test rendering performance under load', async () => {
      const renderingSizes = [
        { nodes: 1000, edges: 2000, expected: 'fast' },
        { nodes: 10000, edges: 25000, expected: 'medium' },
        { nodes: 50000, edges: 125000, expected: 'slow' },
        { nodes: 100000, edges: 500000, expected: 'critical' }
      ];

      const renderingErrors = [];

      for (const size of renderingSizes) {
        const { duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
          if (size.expected === 'critical' || size.expected === 'slow') {
            const error = new NodeWebRenderingError(
              'performance-degradation',
              `Rendering performance degraded with ${size.nodes} nodes`,
              {
                nodeCount: size.nodes,
                edgeCount: size.edges,
                expectedPerformance: size.expected,
                performanceThreshold: 'medium'
              }
            );
            renderingErrors.push(error);
            errorAnalytics.addError(error);
          }
        });

        expect(duration).toBeLessThan(100); // Error creation should be fast
      }

      expect(renderingErrors.length).toBe(2); // slow and critical
    });
  });

  describe('NodeWebInteractionError', () => {
    it('should handle user interaction failures', () => {
      const interactionType = 'node-selection';
      
      const error = new NodeWebInteractionError(
        interactionType,
        'Node selection failed: hit testing error',
        {
          mousePosition: { x: 150, y: 300 },
          viewport: { x: 0, y: 0, width: 1920, height: 1080, scale: 1.5 },
          candidateNodes: ['node-123', 'node-456'],
          hitTestMethod: 'bounding-box',
          zoomLevel: 1.5,
          panOffset: { x: -200, y: -150 },
          lastSuccessfulInteraction: Date.now() - 5000
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'NodeWebInteractionError');
      expect(error.context.candidateNodes).toHaveLength(2);
    });
  });

  describe('NodeLayoutError', () => {
    it('should handle layout algorithm failures', () => {
      const algorithm = 'force-directed-3d';
      
      const error = new NodeLayoutError(
        algorithm,
        'Layout convergence failed after maximum iterations',
        {
          iterations: 10000,
          maxIterations: 10000,
          energyLevel: 0.85,
          convergenceThreshold: 0.01,
          nodeCount: 5000,
          layoutDimensions: 3,
          stabilityMetric: 'low',
          alternativeAlgorithms: ['hierarchical', 'circular', 'grid']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'NodeLayoutError');
      expect(error.context.energyLevel).toBeGreaterThan(error.context.convergenceThreshold);
    });
  });

  describe('EdgeRenderingError', () => {
    it('should handle edge rendering specific failures', () => {
      const edgeId = 'edge-complex-curved';
      
      const error = new EdgeRenderingError(
        edgeId,
        'Curved edge path calculation failed',
        {
          sourceNode: { id: 'node-1', position: { x: 100, y: 200 } },
          targetNode: { id: 'node-2', position: { x: 500, y: 600 } },
          edgeType: 'curved-arrow',
          pathComplexity: 'bezier-cubic',
          controlPoints: [
            { x: 200, y: 300 },
            { x: 400, y: 500 }
          ],
          renderingMethod: 'path2d',
          strokeWidth: 2,
          animationFrames: 60
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'EdgeRenderingError');
      expect(error.context.pathComplexity).toBe('bezier-cubic');
    });
  });

  describe('GraphTraversalError', () => {
    it('should handle graph traversal algorithm errors', () => {
      const traversalType = 'shortest-path-dijkstra';
      
      const error = new GraphTraversalError(
        traversalType,
        'Negative edge weight detected in shortest path calculation',
        {
          sourceNode: 'node-start',
          targetNode: 'node-end',
          negativeEdges: ['edge-1', 'edge-5', 'edge-12'],
          graphSize: 10000,
          algorithmUsed: 'dijkstra',
          alternativeAlgorithm: 'bellman-ford',
          traversalDepth: 15,
          visitedNodes: 250
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'GraphTraversalError');
      expect(error.context.negativeEdges).toHaveLength(3);
    });
  });

  describe('NodeWebPerformanceError', () => {
    it('should handle performance monitoring errors', () => {
      const metric = 'frames-per-second';
      
      const error = new NodeWebPerformanceError(
        metric,
        'Frame rate dropped below acceptable threshold',
        {
          currentFPS: 15,
          targetFPS: 60,
          acceptableThreshold: 30,
          performanceBudget: {
            renderTime: 16.67, // ms per frame
            actualRenderTime: 66.67
          },
          bottlenecks: ['vertex-processing', 'fragment-shading', 'buffer-swapping'],
          gpuUtilization: 0.95,
          cpuUtilization: 0.85
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'NodeWebPerformanceError');
      expect(error.context.currentFPS).toBeLessThan(error.context.acceptableThreshold);
    });
  });

  describe('VisualizationDataError', () => {
    it('should handle visualization data integrity errors', () => {
      const dataType = 'graph-topology';
      
      const error = new VisualizationDataError(
        dataType,
        'Graph contains cycles in hierarchical layout',
        {
          detectedCycles: [
            ['node-1', 'node-2', 'node-3', 'node-1'],
            ['node-5', 'node-6', 'node-5']
          ],
          layoutRequirement: 'acyclic-graph',
          nodeCount: 1000,
          edgeCount: 1500,
          cycleDetectionMethod: 'dfs',
          suggestedFix: 'remove-back-edges'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'VisualizationDataError');
      expect(error.context.detectedCycles).toHaveLength(2);
    });
  });

  describe('NodeWebEventError', () => {
    it('should handle event system errors', () => {
      const eventType = 'node-hover';
      
      const error = new NodeWebEventError(
        eventType,
        'Event listener registration failed',
        {
          targetElement: 'canvas-overlay',
          eventPhase: 'bubble',
          listenerCount: 150,
          maxListeners: 100,
          memoryLeakSuspected: true,
          eventFrequency: 'high',
          lastEventTimestamp: Date.now() - 1000
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'NodeWebEventError');
      expect(error.context.listenerCount).toBeGreaterThan(error.context.maxListeners);
    });
  });

  describe('GraphComplexityError', () => {
    it('should handle graph complexity limit errors', () => {
      const complexityMetric = 'total-visualization-elements';
      
      const error = new GraphComplexityError(
        complexityMetric,
        'Graph complexity exceeds visualization capabilities',
        {
          nodeCount: 100000,
          edgeCount: 1000000,
          totalElements: 1100000,
          complexityLimit: 500000,
          memoryRequirement: '8GB',
          availableMemory: '4GB',
          renderingStrategy: 'level-of-detail',
          simplificationRequired: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'GraphComplexityError');
      expect(error.context.totalElements).toBeGreaterThan(error.context.complexityLimit);
    });
  });

  describe('NodeWebMemoryError', () => {
    it('should handle NodeWeb specific memory errors', () => {
      const memoryType = 'texture-buffers';
      
      const error = new NodeWebMemoryError(
        memoryType,
        'GPU texture memory exhausted',
        {
          currentUsage: '2GB',
          memoryLimit: '1.5GB',
          textureCount: 5000,
          textureResolution: '512x512',
          compressionEnabled: false,
          mipmapsEnabled: true,
          memoryPressureLevel: 'critical',
          garbageCollectionNeeded: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'NodeWebMemoryError');
      expect(error.context.memoryPressureLevel).toBe('critical');
    });
  });
});

// ============================================================================
// TIMELINE ADAPTER ERROR TESTS (8 types)
// ============================================================================

describe('Timeline Adapter Error Handling', () => {
  let mockTimelineAdapter: any;
  let mockTemporalEngine: any;
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    mockTimelineAdapter = {
      events: [],
      timeRange: { start: null, end: null },
      resolution: 'day',
      addEvent: jest.fn(),
      render: jest.fn().mockRejectedValue(new Error('Timeline rendering failed')),
      setTimeRange: jest.fn()
    };
    
    mockTemporalEngine = {
      parseTimestamp: jest.fn(),
      calculateDuration: jest.fn(),
      sequenceEvents: jest.fn(),
      detectPatterns: jest.fn()
    };
    
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('TimelineInitializationError', () => {
    it('should create timeline initialization error with temporal context', () => {
      const component = 'temporal-axis-renderer';
      
      const error = new TimelineInitializationError(
        component,
        'Invalid time range configuration',
        {
          startTime: '2023-13-45T25:70:80Z', // Invalid date
          endTime: '2023-07-15T10:30:00Z',
          resolution: 'microsecond',
          supportedResolutions: ['year', 'month', 'day', 'hour', 'minute', 'second'],
          timeZone: 'UTC',
          localization: 'en-US'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'TimelineInitializationError');
      expect(error.context.supportedResolutions).not.toContain(error.context.resolution);
    });

    it('should test various temporal configuration errors', () => {
      const configTests = [
        { start: 'invalid-date', end: '2023-07-15T10:30:00Z', valid: false },
        { start: '2023-07-15T10:30:00Z', end: '2023-07-14T10:30:00Z', valid: false }, // End before start
        { start: '1900-01-01T00:00:00Z', end: '2100-12-31T23:59:59Z', valid: false }, // Too large range
        { start: '2023-07-15T10:30:00Z', end: '2023-07-15T10:30:01Z', valid: true } // Valid
      ];

      const initErrors = [];

      for (const test of configTests) {
        if (!test.valid) {
          const error = new TimelineInitializationError(
            'date-validation',
            'Invalid temporal configuration',
            {
              startTime: test.start,
              endTime: test.end,
              validationFailure: true
            }
          );
          initErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(initErrors.length).toBe(3);
    });
  });

  describe('TemporalMappingError', () => {
    it('should handle temporal data mapping failures', () => {
      const eventId = 'event-temporal-invalid';
      
      const error = new TemporalMappingError(
        eventId,
        'Event timestamp format not recognized',
        {
          rawTimestamp: '2023/07/15 10:30 AM PST',
          expectedFormats: ['ISO 8601', 'Unix timestamp', 'RFC 3339'],
          parsedValues: {
            year: 2023,
            month: 7,
            day: 15,
            hour: null, // Parsing failed here
            timezone: 'PST'
          },
          fallbackStrategy: 'assume-utc',
          confidenceLevel: 'low'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'TemporalMappingError');
      expect(error.context.parsedValues.hour).toBeNull();
    });
  });

  describe('TimelineRenderingError', () => {
    it('should handle timeline rendering pipeline failures', () => {
      const renderStage = 'event-positioning';
      
      const error = new TimelineRenderingError(
        renderStage,
        'Event overlap resolution failed',
        {
          eventCount: 10000,
          overlappingEvents: 2500,
          timelineWidth: 1920,
          pixelsPerSecond: 0.001, // Very dense timeline
          overlapStrategy: 'stacking',
          maxStackHeight: 10,
          renderingMethod: 'svg',
          performanceImpact: 'high'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'TimelineRenderingError');
      expect(error.context.overlappingEvents).toBeGreaterThan(0);
    });

    it('should test timeline rendering performance', async () => {
      const eventCounts = [100, 1000, 10000, 100000];
      const renderingErrors = [];

      for (const eventCount of eventCounts) {
        const { duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
          if (eventCount >= 10000) {
            const error = new TimelineRenderingError(
              'performance-degradation',
              `Timeline rendering slow with ${eventCount} events`,
              {
                eventCount,
                estimatedRenderTime: eventCount * 0.1, // ms
                performanceThreshold: 1000 // ms
              }
            );
            renderingErrors.push(error);
            errorAnalytics.addError(error);
          }
        });

        expect(duration).toBeLessThan(100);
      }

      expect(renderingErrors.length).toBe(2); // 10000 and 100000
    });
  });

  describe('EventSequencingError', () => {
    it('should handle event sequencing logic errors', () => {
      const sequenceId = 'sequence-causal-chain';
      
      const error = new EventSequencingError(
        sequenceId,
        'Causal relationship cycle detected',
        {
          events: [
            { id: 'event-1', timestamp: '2023-07-15T10:00:00Z', causes: ['event-2'] },
            { id: 'event-2', timestamp: '2023-07-15T10:05:00Z', causes: ['event-3'] },
            { id: 'event-3', timestamp: '2023-07-15T10:10:00Z', causes: ['event-1'] } // Cycle!
          ],
          detectedCycle: ['event-1', 'event-2', 'event-3', 'event-1'],
          sequencingAlgorithm: 'topological-sort',
          resolutionStrategy: 'break-weakest-link'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'EventSequencingError');
      expect(error.context.detectedCycle).toHaveLength(4); // Including return to start
    });
  });

  describe('TimelineDataError', () => {
    it('should handle timeline data integrity errors', () => {
      const dataType = 'event-temporal-consistency';
      
      const error = new TimelineDataError(
        dataType,
        'Event duration inconsistency detected',
        {
          inconsistentEvents: [
            { id: 'event-1', start: '2023-07-15T10:00:00Z', end: '2023-07-15T09:30:00Z' }, // End before start
            { id: 'event-2', start: '2023-07-15T10:00:00Z', end: null, duration: -300 } // Negative duration
          ],
          validationRules: ['start-before-end', 'positive-duration', 'consistent-timezone'],
          failedValidations: 2,
          dataSource: 'external-api',
          dataQualityScore: 0.65
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'TimelineDataError');
      expect(error.context.inconsistentEvents).toHaveLength(2);
    });
  });

  describe('TemporalAnalysisError', () => {
    it('should handle temporal pattern analysis errors', () => {
      const analysisType = 'periodic-pattern-detection';
      
      const error = new TemporalAnalysisError(
        analysisType,
        'Insufficient data points for pattern analysis',
        {
          dataPoints: 15,
          minimumRequired: 50,
          analysisWindow: '30 days',
          patternTypes: ['daily', 'weekly', 'monthly'],
          confidenceThreshold: 0.8,
          detectedPatterns: [],
          alternativeAnalysis: 'trend-analysis'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'TemporalAnalysisError');
      expect(error.context.dataPoints).toBeLessThan(error.context.minimumRequired);
    });
  });

  describe('TimelinePerformanceError', () => {
    it('should handle timeline performance issues', () => {
      const operation = 'event-aggregation';
      
      const error = new TimelinePerformanceError(
        operation,
        'Event aggregation exceeds performance budget',
        {
          operationDuration: 5000, // ms
          performanceBudget: 1000, // ms
          eventCount: 50000,
          aggregationLevel: 'minute',
          memoryUsage: '500MB',
          cpuUsage: 0.9,
          optimizationSuggestions: ['reduce-resolution', 'implement-caching', 'use-web-workers']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'TimelinePerformanceError');
      expect(error.context.operationDuration).toBeGreaterThan(error.context.performanceBudget);
    });
  });

  describe('TimelineEventError', () => {
    it('should handle timeline event system errors', () => {
      const eventType = 'zoom-change';
      
      const error = new TimelineEventError(
        eventType,
        'Zoom event handling caused viewport corruption',
        {
          zoomLevel: 0.001, // Extreme zoom out
          viewportBounds: {
            start: '1970-01-01T00:00:00Z',
            end: '2070-12-31T23:59:59Z'
          },
          pixelRatio: 0.0001,
          renderingElements: 1000000,
          viewportCorruption: true,
          recoveryStrategy: 'reset-viewport'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'TimelineEventError');
      expect(error.context.viewportCorruption).toBe(true);
    });
  });
});

// ============================================================================
// INTEGRATION/WORKFLOW ERROR TESTS (10 types)
// ============================================================================

describe('Integration/Workflow Error Handling', () => {
  let mockWorkflowOrchestrator: any;
  let mockServiceRegistry: any;
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    mockWorkflowOrchestrator = {
      services: new Map(),
      workflows: new Map(),
      execute: jest.fn().mockRejectedValue(new Error('Workflow execution failed')),
      registerService: jest.fn(),
      discoverServices: jest.fn()
    };
    
    mockServiceRegistry = {
      services: new Map(),
      register: jest.fn(),
      discover: jest.fn(),
      healthCheck: jest.fn()
    };
    
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('IntegrationConfigurationError', () => {
    it('should handle integration configuration errors', () => {
      const configKey = 'adapters.nodeweb.rendering.engine';
      
      const error = new IntegrationConfigurationError(
        configKey,
        'Rendering engine configuration invalid',
        {
          providedValue: 'nonexistent-engine',
          validValues: ['webgl', 'canvas2d', 'svg'],
          configurationFile: '/config/integration.json',
          dependentServices: ['NodeWebAdapter', 'VisualizationService'],
          configurationSchema: 'integration-config-v2.1',
          validationErrors: [
            'engine "nonexistent-engine" not found',
            'missing required property "fallbackEngine"'
          ]
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'IntegrationConfigurationError');
      expect(error.context.validValues).not.toContain(error.context.providedValue);
    });

    it('should test comprehensive configuration validation', () => {
      const configTests = [
        { key: 'service.timeout', value: -1000, valid: false, reason: 'negative-timeout' },
        { key: 'adapter.maxNodes', value: 'unlimited', valid: false, reason: 'invalid-type' },
        { key: 'workflow.retries', value: 1000, valid: false, reason: 'exceeds-maximum' },
        { key: 'rendering.quality', value: 'ultra', valid: false, reason: 'unsupported-value' }
      ];

      const configErrors = [];

      for (const test of configTests) {
        if (!test.valid) {
          const error = new IntegrationConfigurationError(
            test.key,
            `Configuration validation failed: ${test.reason}`,
            {
              configKey: test.key,
              providedValue: test.value,
              validationFailure: test.reason
            }
          );
          configErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(configErrors.length).toBe(configTests.length);
    });
  });

  describe('WorkflowOrchestrationError', () => {
    it('should handle workflow orchestration failures', () => {
      const workflowId = 'intel-to-visualization-pipeline';
      
      const error = new WorkflowOrchestrationError(
        workflowId,
        'Step execution failed: NodeWeb adapter timeout',
        {
          currentStep: 3,
          totalSteps: 5,
          failedStep: {
            name: 'nodeweb-rendering',
            adapter: 'NodeWebAdapter',
            timeout: 30000,
            retryCount: 2
          },
          workflowState: {
            step1: 'completed',
            step2: 'completed',
            step3: 'failed',
            step4: 'pending',
            step5: 'pending'
          },
          rollbackRequired: true,
          partialResults: {
            processedEntities: 1500,
            totalEntities: 2000
          }
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'WorkflowOrchestrationError');
      expect(error.context.rollbackRequired).toBe(true);
    });
  });

  describe('AdapterCommunicationError', () => {
    it('should handle adapter communication failures', () => {
      const sourceAdapter = 'IntelBridgeAdapter';
      const targetAdapter = 'NodeWebAdapter';
      
      const error = new AdapterCommunicationError(
        sourceAdapter,
        targetAdapter,
        'Message serialization failed: circular reference detected',
        {
          messageType: 'entity-batch-update',
          messageSize: '50MB',
          serializationFormat: 'JSON',
          circularReferences: [
            { path: 'entities[0].sourceIntel.relatedEntities[2]', target: 'entities[0]' },
            { path: 'entities[5].metadata.processingHistory[1]', target: 'entities[5]' }
          ],
          communicationProtocol: 'message-bus',
          retryAttempts: 3
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'AdapterCommunicationError');
      expect(error.context.circularReferences).toHaveLength(2);
    });
  });

  describe('DataSynchronizationError', () => {
    it('should handle data synchronization failures', () => {
      const syncOperation = 'entity-state-synchronization';
      
      const error = new DataSynchronizationError(
        syncOperation,
        'Conflict resolution failed: concurrent modifications detected',
        {
          conflictingAdapters: ['NodeWebAdapter', 'TimelineAdapter'],
          conflictingEntities: ['entity-123', 'entity-456', 'entity-789'],
          conflictType: 'concurrent-modification',
          lastSyncTimestamp: Date.now() - 30000,
          conflictResolutionStrategy: 'last-writer-wins',
          automaticResolution: false,
          manualInterventionRequired: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'DataSynchronizationError');
      expect(error.context.manualInterventionRequired).toBe(true);
    });
  });

  describe('EventHandlingError', () => {
    it('should handle event system errors', () => {
      const eventType = 'entity-update-cascade';
      
      const error = new EventHandlingError(
        eventType,
        'Event handler chain execution failed',
        {
          eventSource: 'BridgeAdapter',
          eventPayload: {
            entityId: 'entity-cascade-test',
            updateType: 'metadata-change',
            affectedAdapters: ['NodeWebAdapter', 'TimelineAdapter']
          },
          handlerChain: [
            { handler: 'ValidationHandler', status: 'completed' },
            { handler: 'SynchronizationHandler', status: 'failed' },
            { handler: 'NotificationHandler', status: 'skipped' }
          ],
          failureReason: 'synchronization-timeout',
          eventPropagation: 'stopped'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'EventHandlingError');
      expect(error.context.eventPropagation).toBe('stopped');
    });
  });

  describe('StateManagementError', () => {
    it('should handle state management failures', () => {
      const stateType = 'adapter-coordination-state';
      
      const error = new StateManagementError(
        stateType,
        'State consistency violation detected',
        {
          inconsistentState: {
            nodewebAdapterState: 'rendering-active',
            timelineAdapterState: 'data-loading',
            expectedCoordination: 'both-ready-for-update'
          },
          stateTransition: {
            from: 'synchronized',
            to: 'inconsistent',
            trigger: 'async-update-race-condition'
          },
          affectedOperations: ['entity-updates', 'visualization-refresh'],
          recoveryAction: 'force-state-synchronization',
          statePersistence: false
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'StateManagementError');
      expect(error.context.statePersistence).toBe(false);
    });
  });

  describe('ConfigurationValidationError', () => {
    it('should handle configuration validation errors', () => {
      const configSection = 'adapter-dependencies';
      
      const error = new ConfigurationValidationError(
        configSection,
        'Circular dependency detected in adapter configuration',
        {
          detectedCycle: ['NodeWebAdapter', 'TimelineAdapter', 'BridgeAdapter', 'NodeWebAdapter'],
          dependencyGraph: {
            'NodeWebAdapter': ['BridgeAdapter'],
            'TimelineAdapter': ['BridgeAdapter'],
            'BridgeAdapter': ['NodeWebAdapter', 'TimelineAdapter']
          },
          validationRules: ['no-circular-dependencies', 'required-dependencies-available'],
          suggestedFix: 'introduce-dependency-injection',
          configurationVersion: '2.1.0'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ConfigurationValidationError');
      expect(error.context.detectedCycle).toHaveLength(4);
    });
  });

  describe('DependencyResolutionError', () => {
    it('should handle dependency resolution failures', () => {
      const dependency = 'VisualizationEngine';
      
      const error = new DependencyResolutionError(
        dependency,
        'Required dependency version not compatible',
        {
          requiredVersion: '^3.0.0',
          availableVersion: '2.8.5',
          compatibility: 'breaking-changes',
          dependentServices: [
            'NodeWebAdapter',
            'TimelineAdapter',
            'VisualizationService'
          ],
          upgradePathAvailable: true,
          migrationRequired: true,
          estimatedMigrationTime: '4 hours'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'DependencyResolutionError');
      expect(error.context.migrationRequired).toBe(true);
    });
  });

  describe('ServiceDiscoveryError', () => {
    it('should handle service discovery failures', () => {
      const serviceName = 'NodeWebVisualizationService';
      
      const error = new ServiceDiscoveryError(
        serviceName,
        'Service instance not found in registry',
        {
          registryEndpoint: 'http://service-registry:8080',
          serviceQuery: {
            name: serviceName,
            version: '>=2.0.0',
            capabilities: ['3d-rendering', 'large-graphs']
          },
          registeredServices: [
            { name: 'BasicVisualizationService', version: '1.5.0' },
            { name: 'TimelineService', version: '2.1.0' }
          ],
          discoveryTimeout: 5000,
          fallbackServices: ['BasicVisualizationService'],
          serviceHealth: 'unknown'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ServiceDiscoveryError');
      expect(error.context.serviceHealth).toBe('unknown');
    });
  });

  describe('LifecycleManagementError', () => {
    it('should handle service lifecycle management errors', () => {
      const serviceName = 'IntegratedVisualizationPipeline';
      
      const error = new LifecycleManagementError(
        serviceName,
        'Service shutdown timeout: adapters not responding',
        {
          lifecyclePhase: 'shutdown',
          nonResponsiveAdapters: ['NodeWebAdapter', 'TimelineAdapter'],
          shutdownTimeout: 30000,
          gracefulShutdown: false,
          pendingOperations: [
            { operation: 'rendering-batch-123', status: 'in-progress' },
            { operation: 'data-sync-456', status: 'waiting' }
          ],
          forceShutdownRequired: true,
          dataLossRisk: 'medium'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'LifecycleManagementError');
      expect(error.context.forceShutdownRequired).toBe(true);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS FOR PHASE 2B ERRORS
// ============================================================================

describe('Phase 2B Enhanced Visualization Error Handling - Integration Tests', () => {
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  it('should handle complex visualization pipeline failures', async () => {
    // Simulate complex visualization pipeline failure
    const mockIntel = ErrorTestUtils.createMockIntelEntity();

    // 1. NodeWeb mapping fails
    const mappingError = new NodeWebMappingError(
      mockIntel.id,
      'Complex entity type requires custom visualization',
      { entityType: 'multi-dimensional-relationship' }
    );
    errorAnalytics.addError(mappingError);

    // 2. Timeline synchronization fails  
    const syncError = new DataSynchronizationError(
      'nodeweb-timeline-sync',
      'Adapters out of sync during entity update',
      { cascadingFrom: mappingError.code }
    );
    errorAnalytics.addError(syncError);

    // 3. Workflow orchestration fails
    const workflowError = new WorkflowOrchestrationError(
      'visualization-pipeline',
      'Pipeline step failed due to adapter issues',
      { cascadingFrom: syncError.code }
    );
    errorAnalytics.addError(workflowError);

    // 4. Performance degrades
    const performanceError = new NodeWebPerformanceError(
      'frame-rate',
      'Performance degraded due to error recovery attempts',
      { cascadingFrom: workflowError.code }
    );
    errorAnalytics.addError(performanceError);

    const metrics = errorAnalytics.getMetrics();
    expect(metrics.totalErrors).toBe(4);
    expect(metrics.errorsByCategory['ENHANCED_VISUALIZATION']).toBe(2);
    expect(metrics.errorsByCategory['INTEGRATION_WORKFLOW']).toBe(2);
  });

  it('should test visualization scalability limits', async () => {
    const scalabilityTests = [
      { nodes: 1000, edges: 2000, timelineEvents: 500, expected: 'good' },
      { nodes: 10000, edges: 25000, timelineEvents: 5000, expected: 'acceptable' },
      { nodes: 50000, edges: 125000, timelineEvents: 25000, expected: 'degraded' },
      { nodes: 100000, edges: 500000, timelineEvents: 100000, expected: 'critical' }
    ];

    const scalabilityErrors = [];

    for (const test of scalabilityTests) {
      const totalElements = test.nodes + test.edges + test.timelineEvents;
      
      if (test.expected === 'critical' || test.expected === 'degraded') {
        // NodeWeb complexity error
        const nodewebError = new GraphComplexityError(
          'total-elements',
          `Visualization complexity critical with ${totalElements} elements`,
          { 
            nodeCount: test.nodes,
            edgeCount: test.edges,
            totalElements,
            complexityLimit: 100000
          }
        );
        scalabilityErrors.push(nodewebError);
        errorAnalytics.addError(nodewebError);

        // Timeline performance error
        const timelineError = new TimelinePerformanceError(
          'event-rendering',
          `Timeline performance degraded with ${test.timelineEvents} events`,
          {
            eventCount: test.timelineEvents,
            performanceBudget: 1000,
            operationDuration: test.timelineEvents * 0.1
          }
        );
        scalabilityErrors.push(timelineError);
        errorAnalytics.addError(timelineError);
      }
    }

    expect(scalabilityErrors.length).toBe(4); // 2 critical scenarios × 2 errors each
  });

  it('should validate cross-adapter coordination', async () => {
    // Test coordination between NodeWeb and Timeline adapters
    const coordinationScenarios = [
      {
        scenario: 'entity-update-coordination',
        nodewebReady: true,
        timelineReady: false,
        expectedIssue: 'timing-mismatch'
      },
      {
        scenario: 'data-synchronization',
        nodewebReady: true,
        timelineReady: true,
        expectedIssue: 'none'
      },
      {
        scenario: 'rendering-coordination',
        nodewebReady: false,
        timelineReady: true,
        expectedIssue: 'adapter-not-ready'
      }
    ];

    const coordinationErrors = [];

    for (const scenario of coordinationScenarios) {
      if (scenario.expectedIssue !== 'none') {
        const error = new AdapterCommunicationError(
          'NodeWebAdapter',
          'TimelineAdapter',
          `Coordination failed: ${scenario.expectedIssue}`,
          {
            scenario: scenario.scenario,
            nodewebReady: scenario.nodewebReady,
            timelineReady: scenario.timelineReady,
            coordinationRequired: true
          }
        );
        coordinationErrors.push(error);
        errorAnalytics.addError(error);
      }
    }

    expect(coordinationErrors.length).toBe(2); // Two scenarios with issues
  });

  it('should test error recovery mechanisms', async () => {
    // Test error recovery for different error types
    const recoveryTests = [
      { error: new NodeWebRenderingError('webgl-context', 'Context lost'), recoverable: true },
      { error: new TimelineRenderingError('svg-rendering', 'SVG parsing error'), recoverable: true },
      { error: new GraphComplexityError('memory-limit', 'Complexity too high'), recoverable: false },
      { error: new WorkflowOrchestrationError('pipeline', 'Critical step failed'), recoverable: true }
    ];

    const recoveryResults = [];

    for (const test of recoveryTests) {
      const isRecoverable = NetRunnerErrorHandler.isRetryableError(test.error);
      
      recoveryResults.push({
        errorType: test.error.constructor.name,
        expectedRecoverable: test.recoverable,
        actualRecoverable: isRecoverable,
        matches: test.recoverable === isRecoverable
      });
      
      errorAnalytics.addError(test.error);
    }

    // All recovery expectations should match
    const allMatch = recoveryResults.every(result => result.matches);
    expect(allMatch).toBe(true);

    const metrics = errorAnalytics.getMetrics();
    expect(metrics.totalErrors).toBe(recoveryTests.length);
  });

  it('should measure comprehensive error analytics performance', async () => {
    // Generate diverse error set representing real-world scenario
    const diverseErrors = [
      // NodeWeb errors
      ...Array(20).fill(null).map((_, i) => new NodeWebRenderingError(`render-stage-${i}`, 'Rendering failed')),
      // Timeline errors  
      ...Array(15).fill(null).map((_, i) => new TimelineDataError(`temporal-data-${i}`, 'Data inconsistency')),
      // Integration errors
      ...Array(10).fill(null).map((_, i) => new WorkflowOrchestrationError(`workflow-${i}`, 'Orchestration failed')),
      // Complex errors with relationships
      ...Array(5).fill(null).map((_, i) => new DataSynchronizationError(`sync-${i}`, 'Sync conflict'))
    ];

    const { result, duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
      // Add all errors
      for (const error of diverseErrors) {
        errorAnalytics.addError(error);
      }
      
      // Perform comprehensive analytics
      const analytics = {
        metrics: errorAnalytics.getMetrics(),
        commonErrors: errorAnalytics.getMostCommonErrors(10),
        criticalPatterns: errorAnalytics.getCriticalErrorPatterns(),
        categoryBreakdown: errorAnalytics.getMetrics().errorsByCategory
      };
      
      return analytics;
    });

    expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.BATCH_PROCESSING);
    expect(result.metrics.totalErrors).toBe(diverseErrors.length);
    expect(Object.keys(result.categoryBreakdown)).toContain('ENHANCED_VISUALIZATION');
    expect(Object.keys(result.categoryBreakdown)).toContain('INTEGRATION_WORKFLOW');
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
