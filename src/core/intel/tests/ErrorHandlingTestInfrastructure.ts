/**
 * NetRunner Error Handling Test Suite - TDD Infrastructure
 * 
 * Comprehensive test setup for 100+ error types covering:
 * - Phase 1: Core Integration (25 types)
 * - Phase 2A: NetRunner Collection (35 types) 
 * - Phase 2B: Enhanced Visualization (25 types)
 * - Integration & Workflow (10 types)
 * - Performance & Resource (10 types)
 * 
 * This file establishes the TDD foundation for error handling validation.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  // Core Integration Errors
  BridgeAdapterInitializationError,
  IntelToEntityTransformationError,
  EntityToIntelTransformationError,
  LineageTrackingError,
  ConfidenceScorePropagationError,
  IntelStorageError,
  IntelligenceStorageError,
  
  // NetRunner Collection Errors
  ScanInitializationError,
  URLValidationError,
  ProxyConnectionError,
  ContentRetrievalError,
  EmailExtractionError,
  TechnologyDetectionError,
  IntelGenerationError,
  
  // Enhanced Visualization Errors
  GraphDataGenerationError,
  NodeTransformationError,
  ConfidenceVisualizationError,
  TimelineDataGenerationError,
  ProcessingTimelineError,
  
  // Real-time & Performance Errors
  WebSocketConnectionError,
  ProcessingTimeoutError,
  MemoryLimitError,
  ConcurrencyLimitError,
  
  // Utility Classes
  NetRunnerErrorHandler,
  NetRunnerErrorAnalytics,
  NetRunnerErrorTypes
} from '../errors/NetRunnerErrorTypes';

// ============================================================================
// TEST INFRASTRUCTURE & UTILITIES
// ============================================================================

/**
 * Test utility class for error validation and setup
 */
export class ErrorTestUtils {
  static createMockContext(overrides: Record<string, any> = {}): Record<string, any> {
    return {
      timestamp: Date.now(),
      component: 'test-component',
      operation: 'test-operation',
      userId: 'test-user',
      sessionId: 'test-session',
      ...overrides
    };
  }

  static createMockIntelEntity(overrides: any = {}): any {
    return {
      id: 'test-intel-123',
      title: 'Test Intel Entity',
      description: 'Test description',
      classification: 'UNCLASS',
      confidence: 75,
      reliability: 'B',
      timestamp: Date.now(),
      source: 'test-source',
      tags: ['test', 'intel'],
      ...overrides
    };
  }

  static createMockScanResult(overrides: any = {}): any {
    return {
      url: 'https://example.com',
      title: 'Test Website',
      status: 'complete',
      progress: 100,
      sourceCode: '<html><body>Test</body></html>',
      vulnerabilities: [],
      osintData: {
        emails: ['test@example.com'],
        socialMedia: ['https://twitter.com/test'],
        technologies: [{ name: 'React', version: '18.0.0' }],
        serverInfo: ['nginx/1.18.0'],
        subdomains: ['api.example.com'],
        certificates: [],
        dns: []
      },
      metadata: {
        ip: '192.168.1.1',
        server: 'nginx',
        lastModified: new Date().toISOString(),
        size: '1024',
        responseTime: 250
      },
      ...overrides
    };
  }

  static validateErrorStructure(error: any, expectedType: string): void {
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(expectedType);
    expect(error.message).toBeDefined();
    expect(error.code).toBeDefined();
    expect(error.category).toBeDefined();
    expect(error.severity).toMatch(/^(low|medium|high|critical)$/);
  }

  static validateErrorContext(error: any, expectedContext?: Record<string, any>): void {
    expect(error.context).toBeDefined();
    if (expectedContext) {
      Object.keys(expectedContext).forEach(key => {
        expect(error.context[key]).toEqual(expectedContext[key]);
      });
    }
  }

  static async expectAsyncError(
    asyncFn: () => Promise<any>,
    expectedErrorType: any
  ): Promise<any> {
    try {
      await asyncFn();
      throw new Error('Expected async function to throw error');
    } catch (error) {
      expect(error).toBeInstanceOf(expectedErrorType);
      return error;
    }
  }

  static expectErrorThrow(
    fn: () => any,
    expectedErrorType: any
  ): any {
    try {
      fn();
      throw new Error('Expected function to throw error');
    } catch (error) {
      expect(error).toBeInstanceOf(expectedErrorType);
      return error;
    }
  }
}

/**
 * Mock factory for creating test doubles
 */
export class MockFactory {
  static createMockWebSocket(behavior: 'success' | 'failure' | 'timeout' = 'success'): WebSocket {
    const mockWS = {
      readyState: WebSocket.CONNECTING,
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null
    } as any;

    if (behavior === 'failure') {
      setTimeout(() => {
        if (mockWS.onerror) mockWS.onerror(new Event('error'));
      }, 10);
    } else if (behavior === 'success') {
      mockWS.readyState = WebSocket.OPEN;
      setTimeout(() => {
        if (mockWS.onopen) mockWS.onopen(new Event('open'));
      }, 10);
    }

    return mockWS;
  }

  static createMockFetch(
    behavior: 'success' | 'network-error' | 'timeout' | 'server-error' = 'success',
    responseData?: any
  ): jest.Mock {
    return jest.fn().mockImplementation(async (url: string) => {
      switch (behavior) {
        case 'network-error':
          throw new Error('Network error');
        case 'timeout':
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          });
        case 'server-error':
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve('Server Error'),
            json: () => Promise.resolve({ error: 'Server Error' })
          };
        case 'success':
        default:
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            text: () => Promise.resolve(responseData || '<html><body>Test</body></html>'),
            json: () => Promise.resolve(responseData || { success: true })
          };
      }
    });
  }

  static createMockStorageOrchestrator(behavior: 'success' | 'failure' = 'success'): any {
    const mockStorage = {
      storeIntel: jest.fn(),
      storeIntelligence: jest.fn(),
      batchStoreIntel: jest.fn(),
      queryByLineage: jest.fn(),
      getProcessingHistory: jest.fn(),
      addProcessingStep: jest.fn()
    };

    if (behavior === 'failure') {
      Object.keys(mockStorage).forEach(key => {
        mockStorage[key as keyof typeof mockStorage].mockRejectedValue(
          new Error(`Storage operation failed: ${key}`)
        );
      });
    } else {
      mockStorage.storeIntel.mockResolvedValue(undefined);
      mockStorage.storeIntelligence.mockResolvedValue(undefined);
      mockStorage.batchStoreIntel.mockResolvedValue(undefined);
      mockStorage.queryByLineage.mockResolvedValue([]);
      mockStorage.getProcessingHistory.mockResolvedValue([]);
      mockStorage.addProcessingStep.mockResolvedValue(undefined);
    }

    return mockStorage;
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  }

  static createMemoryPressure(sizeMB: number): ArrayBuffer[] {
    const buffers = [];
    for (let i = 0; i < sizeMB; i++) {
      buffers.push(new ArrayBuffer(1024 * 1024)); // 1MB buffer
    }
    return buffers;
  }

  static async createConcurrentOperations<T>(
    operation: () => Promise<T>,
    count: number
  ): Promise<Array<{ success: boolean; result?: T; error?: Error; duration: number }>> {
    const operations = Array(count).fill(null).map(async () => {
      const start = performance.now();
      try {
        const result = await operation();
        return {
          success: true,
          result,
          duration: performance.now() - start
        };
      } catch (error) {
        return {
          success: false,
          error: error as Error,
          duration: performance.now() - start
        };
      }
    });

    return Promise.all(operations);
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  static generateLargeDataset(size: number): any[] {
    return Array(size).fill(null).map((_, index) => ({
      id: `item-${index}`,
      data: `Large data content ${index}`.repeat(100),
      timestamp: Date.now() + index,
      metadata: {
        index,
        size: Math.random() * 1000,
        category: `category-${index % 10}`
      }
    }));
  }

  static generateInvalidUrlList(): string[] {
    return [
      '',
      'invalid-url',
      'ftp://invalid-protocol.com',
      'http://',
      'https://',
      'not-a-url-at-all',
      'javascript:alert("xss")',
      'file:///etc/passwd',
      'data:text/html,<script>alert(1)</script>'
    ];
  }

  static generateValidUrlList(): string[] {
    return [
      'https://example.com',
      'http://test.example.com',
      'https://api.example.com/v1',
      'https://subdomain.example.org',
      'http://localhost:3000',
      'https://192.168.1.1',
      'https://[::1]:8080'
    ];
  }

  static generateCorruptedHtml(): string[] {
    return [
      '<html><body><div>Unclosed div<body></html>',
      '<html><script>broken script<html>',
      '<html><style>broken { css }</html>',
      '<<invalid>><<tags>></html>',
      '<html>Mixed encoding: ñáéíóú中文日本語</html>'
    ];
  }
}

// ============================================================================
// SHARED TEST SETUP AND TEARDOWN
// ============================================================================

/**
 * Global test setup and configuration
 */
export class GlobalTestSetup {
  private static originalConsole: typeof console;
  private static errorAnalytics: NetRunnerErrorAnalytics;

  static setup(): void {
    // Store original console for restoration
    this.originalConsole = { ...console };
    
    // Create error analytics instance for testing
    this.errorAnalytics = new NetRunnerErrorAnalytics();
    
    // Mock global objects
    global.fetch = MockFactory.createMockFetch();
    global.WebSocket = MockFactory.createMockWebSocket as any;
    
    // Suppress console output during tests (optional)
    if (process.env.NODE_ENV === 'test') {
      console.log = jest.fn();
      console.warn = jest.fn();
      console.error = jest.fn();
    }
  }

  static teardown(): void {
    // Restore original console
    Object.assign(console, this.originalConsole);
    
    // Clear any global mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();
  }

  static getErrorAnalytics(): NetRunnerErrorAnalytics {
    return this.errorAnalytics;
  }

  static resetErrorAnalytics(): void {
    this.errorAnalytics = new NetRunnerErrorAnalytics();
  }
}

// ============================================================================
// TEST CONFIGURATION AND CONSTANTS
// ============================================================================

export const TEST_CONSTANTS = {
  TIMEOUTS: {
    SHORT: 1000,      // 1 second
    MEDIUM: 5000,     // 5 seconds
    LONG: 30000,      // 30 seconds
    PERFORMANCE: 100  // 100ms for performance tests
  },
  
  ERROR_PATTERNS: {
    RETRYABLE_CODES: [
      'PROXY_CONNECTION_FAILED',
      'CONTENT_RETRIEVAL_FAILED',
      'WEBSOCKET_CONNECTION_FAILED',
      'DATA_STREAM_ERROR',
      'PROCESSING_TIMEOUT',
      'RESOURCE_EXHAUSTION'
    ],
    
    CRITICAL_CODES: [
      'BRIDGE_INIT_FAILED',
      'STORAGE_CONSISTENCY_FAILED',
      'DATA_MIGRATION_FAILED',
      'MEMORY_LIMIT_EXCEEDED',
      'THREAD_POOL_EXHAUSTION'
    ]
  },
  
  PERFORMANCE_THRESHOLDS: {
    ERROR_CREATION: 1,        // 1ms
    ERROR_HANDLING: 5,        // 5ms
    ERROR_ANALYTICS: 10,      // 10ms
    BATCH_PROCESSING: 100     // 100ms
  },
  
  SAMPLE_DATA: {
    VALID_URLS: TestDataGenerator.generateValidUrlList(),
    INVALID_URLS: TestDataGenerator.generateInvalidUrlList(),
    CORRUPTED_HTML: TestDataGenerator.generateCorruptedHtml()
  }
};

// Export test suite utilities
export {
  ErrorTestUtils,
  MockFactory,
  PerformanceTestUtils,
  TestDataGenerator,
  GlobalTestSetup,
  TEST_CONSTANTS
};
