/**
 * Phase 2A: NetRunner Collection Error Handling Tests
 * 
 * Test-Driven Development suite for NetRunner Collection errors covering:
 * - NetRunner Proxy Errors (15 types)
 * - Content Collection Errors (10 types) 
 * - Performance/Resource Errors (10 types)
 * 
 * Total: 35 comprehensive test cases following TDD principles
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  // NetRunner Proxy Errors
  ProxyConnectionError,
  ProxyTimeoutError,
  ProxyAuthenticationError,
  ProxyConfigurationError,
  ProxyPoolExhaustionError,
  ProxyRotationError,
  ProxyBlacklistError,
  ProxyHealthCheckError,
  ProxyLoadBalancingError,
  ProxyChainError,
  ProxyTunnelError,
  ProxySSLError,
  ProxyDNSError,
  ProxyGeolocationError,
  ProxyQuotaExceededError,
  
  // Content Collection Errors
  ContentRetrievalError,
  WebScrapingError,
  DataExtractionError,
  ContentParsingError,
  HTMLParsingError,
  JavaScriptExecutionError,
  DynamicContentError,
  AntiScrapingDetectionError,
  ContentValidationError,
  MetadataExtractionError,
  
  // Performance/Resource Errors
  MemoryLimitExceededError,
  ProcessingTimeoutError,
  RateLimitExceededError,
  ConcurrencyLimitError,
  ResourceExhaustionError,
  PerformanceDegradationError,
  QueueOverflowError,
  ThreadPoolExhaustionError,
  CacheEvictionError,
  StorageQuotaExceededError,
  
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
// NETRUNNER PROXY ERROR TESTS (15 types)
// ============================================================================

describe('NetRunner Proxy Error Handling', () => {
  let mockWebSocket: any;
  let mockProxyPool: any;
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    mockWebSocket = MockFactory.createMockWebSocket('error');
    mockProxyPool = {
      proxies: [],
      activeConnections: 0,
      maxConnections: 10,
      getAvailableProxy: jest.fn(),
      releaseProxy: jest.fn(),
      markProxyUnhealthy: jest.fn()
    };
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('ProxyConnectionError', () => {
    it('should create proxy connection error with connection details', () => {
      const proxyAddress = 'proxy-1.example.com:8080';
      
      const error = new ProxyConnectionError(
        proxyAddress,
        'Connection refused by proxy server',
        {
          proxyType: 'HTTP',
          authRequired: true,
          lastSuccessfulConnection: Date.now() - 3600000, // 1 hour ago
          connectionAttempts: 3,
          responseCode: 'ECONNREFUSED'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyConnectionError');
      expect(error.message).toContain(proxyAddress);
      expect(error.context.proxyType).toBe('HTTP');
      expect(error.context.connectionAttempts).toBe(3);
    });

    it('should handle multiple proxy connection failures', async () => {
      const proxyList = [
        'proxy-1.example.com:8080',
        'proxy-2.example.com:8080', 
        'proxy-3.example.com:8080',
        'proxy-4.example.com:8080',
        'proxy-5.example.com:8080'
      ];

      const connectionErrors = [];

      for (const proxy of proxyList) {
        try {
          // Simulate connection attempt
          await new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), 100);
          });
        } catch (connectionError) {
          const error = new ProxyConnectionError(
            proxy,
            connectionError.message,
            { 
              proxyIndex: proxyList.indexOf(proxy),
              totalProxies: proxyList.length,
              originalError: connectionError
            }
          );
          connectionErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(connectionErrors.length).toBe(proxyList.length);
      
      const metrics = errorAnalytics.getMetrics();
      expect(metrics.errorsByCategory['NETRUNNER_PROXY']).toBe(proxyList.length);
    });
  });

  describe('ProxyTimeoutError', () => {
    it('should create timeout error with timing information', () => {
      const proxyAddress = 'slow-proxy.example.com:8080';
      const timeoutMs = 30000;
      
      const error = new ProxyTimeoutError(
        proxyAddress,
        timeoutMs,
        'Request exceeded configured timeout',
        {
          requestStartTime: Date.now() - timeoutMs - 1000,
          actualDuration: timeoutMs + 1000,
          timeoutType: 'connect-timeout',
          retryable: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyTimeoutError');
      expect(error.context.timeoutMs).toBe(timeoutMs);
      expect(error.context.actualDuration).toBeGreaterThan(timeoutMs);
    });

    it('should test timeout scenarios with different durations', async () => {
      const timeoutScenarios = [
        { timeout: 1000, expectedResult: 'fast-timeout' },
        { timeout: 5000, expectedResult: 'medium-timeout' },
        { timeout: 15000, expectedResult: 'slow-timeout' },
        { timeout: 30000, expectedResult: 'very-slow-timeout' }
      ];

      const timeoutErrors = [];

      for (const scenario of timeoutScenarios) {
        const { duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
          const error = new ProxyTimeoutError(
            'test-proxy.example.com:8080',
            scenario.timeout,
            `Timeout after ${scenario.timeout}ms`,
            { scenario: scenario.expectedResult }
          );
          timeoutErrors.push(error);
          errorAnalytics.addError(error);
        });

        expect(duration).toBeLessThan(100); // Error creation should be fast
      }

      expect(timeoutErrors.length).toBe(timeoutScenarios.length);
    });
  });

  describe('ProxyAuthenticationError', () => {
    it('should handle proxy authentication failures', () => {
      const proxyAddress = 'auth-proxy.example.com:8080';
      
      const error = new ProxyAuthenticationError(
        proxyAddress,
        'Invalid proxy credentials',
        {
          authMethod: 'basic',
          username: 'testuser',
          credentialsExpired: false,
          lastAuthSuccess: null,
          responseHeaders: {
            'Proxy-Authenticate': 'Basic realm="Proxy"',
            'Connection': 'close'
          }
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyAuthenticationError');
      expect(error.context.authMethod).toBe('basic');
      expect(error.context.credentialsExpired).toBe(false);
    });
  });

  describe('ProxyConfigurationError', () => {
    it('should handle proxy configuration errors', () => {
      const configKey = 'proxy.pool.rotation.strategy';
      
      const error = new ProxyConfigurationError(
        configKey,
        'Invalid rotation strategy: round-robin-weighted',
        {
          providedValue: 'round-robin-weighted',
          validValues: ['round-robin', 'least-connections', 'random', 'health-based'],
          configurationFile: '/config/proxy-settings.json',
          severity: 'high'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyConfigurationError');
      expect(error.context.validValues).toHaveLength(4);
    });
  });

  describe('ProxyPoolExhaustionError', () => {
    it('should handle proxy pool exhaustion', () => {
      const poolId = 'primary-proxy-pool';
      
      const error = new ProxyPoolExhaustionError(
        poolId,
        'All proxies in pool are unhealthy or busy',
        {
          totalProxies: 50,
          healthyProxies: 0,
          busyProxies: 25,
          blacklistedProxies: 25,
          poolUtilization: 1.0,
          waitQueueSize: 100
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyPoolExhaustionError');
      expect(error.context.poolUtilization).toBe(1.0);
      expect(error.context.waitQueueSize).toBe(100);
    });

    it('should test pool exhaustion scenarios', () => {
      const poolScenarios = [
        { total: 10, healthy: 0, busy: 5, blacklisted: 5 },
        { total: 25, healthy: 2, busy: 20, blacklisted: 3 },
        { total: 100, healthy: 10, busy: 70, blacklisted: 20 }
      ];

      const exhaustionErrors = [];

      for (const scenario of poolScenarios) {
        const utilization = (scenario.busy + scenario.blacklisted) / scenario.total;
        
        if (utilization >= 0.9) { // 90% utilization triggers warning
          const error = new ProxyPoolExhaustionError(
            `pool-${scenario.total}`,
            'Pool utilization critical',
            {
              ...scenario,
              poolUtilization: utilization,
              criticalThreshold: 0.9
            }
          );
          exhaustionErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(exhaustionErrors.length).toBeGreaterThan(0);
    });
  });

  describe('ProxyRotationError', () => {
    it('should handle proxy rotation failures', () => {
      const currentProxy = 'proxy-3.example.com:8080';
      const nextProxy = 'proxy-4.example.com:8080';
      
      const error = new ProxyRotationError(
        currentProxy,
        nextProxy,
        'Next proxy in rotation is blacklisted',
        {
          rotationStrategy: 'round-robin',
          rotationIndex: 3,
          totalProxiesInRotation: 10,
          blacklistReason: 'too-many-failures',
          fallbackProxy: 'proxy-5.example.com:8080'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyRotationError');
      expect(error.context.rotationStrategy).toBe('round-robin');
      expect(error.context.fallbackProxy).toBeDefined();
    });
  });

  describe('ProxyBlacklistError', () => {
    it('should handle proxy blacklisting scenarios', () => {
      const proxyAddress = 'problematic-proxy.example.com:8080';
      
      const error = new ProxyBlacklistError(
        proxyAddress,
        'Proxy blacklisted due to repeated failures',
        {
          blacklistReason: 'failure-rate-exceeded',
          failureCount: 15,
          failureThreshold: 10,
          blacklistDuration: 3600000, // 1 hour
          blacklistExpiry: Date.now() + 3600000,
          lastFailureType: 'ProxyTimeoutError'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyBlacklistError');
      expect(error.context.failureCount).toBeGreaterThan(error.context.failureThreshold);
    });
  });

  describe('ProxyHealthCheckError', () => {
    it('should handle proxy health check failures', () => {
      const proxyAddress = 'unhealthy-proxy.example.com:8080';
      
      const error = new ProxyHealthCheckError(
        proxyAddress,
        'Health check failed: HTTP 500 response',
        {
          healthCheckUrl: 'http://httpbin.org/status/200',
          expectedStatusCode: 200,
          actualStatusCode: 500,
          responseTime: 5000,
          maxResponseTime: 3000,
          consecutiveFailures: 3,
          healthCheckInterval: 30000
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyHealthCheckError');
      expect(error.context.actualStatusCode).not.toBe(error.context.expectedStatusCode);
      expect(error.context.responseTime).toBeGreaterThan(error.context.maxResponseTime);
    });
  });

  describe('ProxyLoadBalancingError', () => {
    it('should handle load balancing failures', () => {
      const algorithm = 'least-connections';
      
      const error = new ProxyLoadBalancingError(
        algorithm,
        'Unable to select proxy: all proxies at maximum capacity',
        {
          availableProxies: [
            { address: 'proxy-1.example.com:8080', connections: 10, maxConnections: 10 },
            { address: 'proxy-2.example.com:8080', connections: 8, maxConnections: 8 },
            { address: 'proxy-3.example.com:8080', connections: 15, maxConnections: 15 }
          ],
          selectionCriteria: 'connection-count',
          fallbackStrategy: 'queue-request'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyLoadBalancingError');
      expect(error.context.availableProxies).toHaveLength(3);
    });
  });

  describe('ProxyChainError', () => {
    it('should handle proxy chain failures', () => {
      const proxyChain = [
        'entry-proxy.example.com:8080',
        'middle-proxy.example.com:8080',
        'exit-proxy.example.com:8080'
      ];
      
      const error = new ProxyChainError(
        proxyChain,
        'Chain broken at middle proxy',
        {
          failedAtIndex: 1,
          failedProxy: proxyChain[1],
          chainLength: proxyChain.length,
          establishedConnections: 1,
          chainType: 'sequential-tunneling'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyChainError');
      expect(error.context.failedAtIndex).toBe(1);
      expect(error.context.failedProxy).toBe(proxyChain[1]);
    });
  });

  describe('ProxyTunnelError', () => {
    it('should handle tunnel establishment failures', () => {
      const proxyAddress = 'tunnel-proxy.example.com:8080';
      const targetHost = 'secure-target.example.com';
      
      const error = new ProxyTunnelError(
        proxyAddress,
        targetHost,
        'CONNECT method failed with 407 Proxy Authentication Required',
        {
          connectMethod: 'HTTP CONNECT',
          targetPort: 443,
          tunnelType: 'HTTPS',
          proxyResponse: {
            statusCode: 407,
            statusText: 'Proxy Authentication Required',
            headers: { 'Proxy-Authenticate': 'Basic realm="Proxy"' }
          }
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyTunnelError');
      expect(error.context.proxyResponse.statusCode).toBe(407);
    });
  });

  describe('ProxySSLError', () => {
    it('should handle SSL/TLS errors in proxy connections', () => {
      const proxyAddress = 'ssl-proxy.example.com:8443';
      
      const error = new ProxySSLError(
        proxyAddress,
        'SSL certificate verification failed',
        {
          sslError: 'CERT_AUTHORITY_INVALID',
          certificateFingerprint: 'SHA256:abc123def456...',
          certificateExpiry: new Date('2023-12-31'),
          allowSelfSigned: false,
          sslVersion: 'TLSv1.3',
          cipherSuite: 'TLS_AES_256_GCM_SHA384'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxySSLError');
      expect(error.context.sslError).toBe('CERT_AUTHORITY_INVALID');
    });
  });

  describe('ProxyDNSError', () => {
    it('should handle DNS resolution failures for proxies', () => {
      const proxyHostname = 'nonexistent-proxy.example.com';
      
      const error = new ProxyDNSError(
        proxyHostname,
        'DNS resolution failed: NXDOMAIN',
        {
          dnsError: 'NXDOMAIN',
          resolverUsed: '8.8.8.8',
          queryType: 'A',
          resolutionTime: 5000,
          dnsCache: false,
          alternativeIPs: []
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyDNSError');
      expect(error.context.dnsError).toBe('NXDOMAIN');
    });
  });

  describe('ProxyGeolocationError', () => {
    it('should handle geolocation-based proxy errors', () => {
      const proxyAddress = 'geo-proxy.example.com:8080';
      const requiredLocation = 'US';
      
      const error = new ProxyGeolocationError(
        proxyAddress,
        requiredLocation,
        'Proxy location does not match requirements',
        {
          actualLocation: 'CN',
          requiredLocations: ['US', 'CA', 'GB'],
          geolocationService: 'MaxMind GeoIP2',
          confidenceScore: 0.95,
          alternativeProxies: ['us-proxy-1.example.com:8080', 'us-proxy-2.example.com:8080']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyGeolocationError');
      expect(error.context.actualLocation).not.toBe(requiredLocation);
      expect(error.context.requiredLocations).toContain(requiredLocation);
    });
  });

  describe('ProxyQuotaExceededError', () => {
    it('should handle proxy usage quota exceeded', () => {
      const proxyProvider = 'premium-proxy-service';
      
      const error = new ProxyQuotaExceededError(
        proxyProvider,
        'Monthly bandwidth quota exceeded',
        {
          quotaType: 'bandwidth',
          quotaLimit: '100GB',
          quotaUsed: '102GB',
          quotaPeriod: 'monthly',
          quotaResetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          overage: '2GB',
          additionalCost: '$5.00'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProxyQuotaExceededError');
      expect(error.context.quotaUsed).toBe('102GB');
      expect(error.context.quotaLimit).toBe('100GB');
    });
  });
});

// ============================================================================
// CONTENT COLLECTION ERROR TESTS (10 types)
// ============================================================================

describe('Content Collection Error Handling', () => {
  let mockFetch: any;
  let mockPuppeteer: any;
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    mockFetch = MockFactory.createMockFetch('error');
    mockPuppeteer = {
      page: {
        goto: jest.fn().mockRejectedValue(new Error('Navigation failed')),
        content: jest.fn().mockRejectedValue(new Error('Content extraction failed')),
        evaluate: jest.fn().mockRejectedValue(new Error('Script execution failed'))
      }
    };
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('ContentRetrievalError', () => {
    it('should create content retrieval error with HTTP details', () => {
      const url = 'https://example.com/protected-content';
      const statusCode = 403;
      
      const error = new ContentRetrievalError(
        url,
        statusCode,
        'Access forbidden: requires authentication',
        {
          method: 'GET',
          headers: { 'User-Agent': 'NetRunner/1.0' },
          responseHeaders: {
            'WWW-Authenticate': 'Bearer realm="API"',
            'Content-Type': 'application/json'
          },
          responseBody: '{"error": "insufficient_privileges"}',
          retryAfter: 300
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ContentRetrievalError');
      expect(error.context.statusCode).toBe(statusCode);
      expect(error.context.url).toBe(url);
    });

    it('should test various HTTP error scenarios', async () => {
      const httpScenarios = [
        { url: 'https://example.com/not-found', statusCode: 404, retryable: false },
        { url: 'https://example.com/server-error', statusCode: 500, retryable: true },
        { url: 'https://example.com/rate-limited', statusCode: 429, retryable: true },
        { url: 'https://example.com/timeout', statusCode: 408, retryable: true },
        { url: 'https://example.com/forbidden', statusCode: 403, retryable: false }
      ];

      const retrievalErrors = [];

      for (const scenario of httpScenarios) {
        const error = new ContentRetrievalError(
          scenario.url,
          scenario.statusCode,
          `HTTP ${scenario.statusCode} error`,
          { scenario: scenario }
        );
        
        retrievalErrors.push(error);
        errorAnalytics.addError(error);
        
        expect(NetRunnerErrorHandler.isRetryableError(error)).toBe(scenario.retryable);
      }

      expect(retrievalErrors.length).toBe(httpScenarios.length);
    });
  });

  describe('WebScrapingError', () => {
    it('should handle web scraping specific errors', () => {
      const url = 'https://example.com/dynamic-content';
      
      const error = new WebScrapingError(
        url,
        'Failed to extract data: selector not found',
        {
          scrapingMethod: 'puppeteer',
          failedSelectors: ['.main-content', '#data-table', '.pagination'],
          pageLoadTime: 15000,
          jsEnabled: true,
          screenshotTaken: true,
          screenshotPath: '/tmp/screenshot-12345.png'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'WebScrapingError');
      expect(error.context.failedSelectors).toHaveLength(3);
      expect(error.context.scrapingMethod).toBe('puppeteer');
    });
  });

  describe('DataExtractionError', () => {
    it('should handle data extraction failures', () => {
      const dataType = 'email-addresses';
      
      const error = new DataExtractionError(
        dataType,
        'Regex pattern failed to match expected format',
        {
          extractionPattern: /[\w\.-]+@[\w\.-]+\.\w+/g,
          sampleText: 'Contact us at info[at]example[dot]com',
          expectedMatches: 1,
          actualMatches: 0,
          alternativePatterns: [
            /[\w\.-]+\[at\][\w\.-]+\[dot\]\w+/g,
            /[\w\.-]+\s*@\s*[\w\.-]+\.\w+/g
          ]
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'DataExtractionError');
      expect(error.context.actualMatches).toBe(0);
      expect(error.context.expectedMatches).toBe(1);
    });

    it('should test multiple data extraction patterns', () => {
      const extractionTests = [
        { type: 'emails', pattern: /[\w\.-]+@[\w\.-]+\.\w+/g, text: 'No emails here' },
        { type: 'urls', pattern: /https?:\/\/[^\s]+/g, text: 'Visit our website' },
        { type: 'phones', pattern: /\d{3}-\d{3}-\d{4}/g, text: 'Call us anytime' },
        { type: 'ips', pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, text: 'Server info' }
      ];

      const extractionErrors = [];

      for (const test of extractionTests) {
        const matches = test.text.match(test.pattern);
        if (!matches || matches.length === 0) {
          const error = new DataExtractionError(
            test.type,
            `No ${test.type} found in content`,
            {
              pattern: test.pattern.toString(),
              text: test.text,
              expectedMatches: 1,
              actualMatches: 0
            }
          );
          extractionErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(extractionErrors.length).toBe(extractionTests.length);
    });
  });

  describe('ContentParsingError', () => {
    it('should handle content parsing failures', () => {
      const contentType = 'application/json';
      
      const error = new ContentParsingError(
        contentType,
        'Invalid JSON: unexpected token at position 42',
        {
          rawContent: '{"name": "test", "data": [1, 2, 3, invalid]}',
          parsingPosition: 42,
          expectedFormat: 'valid JSON',
          parsingEngine: 'JSON.parse',
          contentLength: 42
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ContentParsingError');
      expect(error.context.parsingPosition).toBe(42);
    });
  });

  describe('HTMLParsingError', () => {
    it('should handle HTML parsing specific errors', () => {
      const selector = '.main-content > div.article';
      
      const error = new HTMLParsingError(
        selector,
        'Malformed HTML: unclosed tag detected',
        {
          htmlSnippet: '<div class="article"><h1>Title</h1><p>Content without closing div',
          parsingEngine: 'cheerio',
          domPath: 'html > body > main > div.content',
          unclosedTags: ['div.article'],
          lineNumber: 15,
          columnNumber: 8
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'HTMLParsingError');
      expect(error.context.unclosedTags).toContain('div.article');
    });
  });

  describe('JavaScriptExecutionError', () => {
    it('should handle JavaScript execution errors in browser context', () => {
      const scriptContent = 'document.querySelector(".nonexistent").click()';
      
      const error = new JavaScriptExecutionError(
        scriptContent,
        'Cannot read property "click" of null',
        {
          executionContext: 'puppeteer-page',
          errorLine: 1,
          errorColumn: 47,
          stackTrace: [
            'at eval (eval at <anonymous> (script.js:1:1))',
            'at script.js:1:1'
          ],
          pageUrl: 'https://example.com/test-page',
          timeoutDuration: 5000
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'JavaScriptExecutionError');
      expect(error.context.executionContext).toBe('puppeteer-page');
    });
  });

  describe('DynamicContentError', () => {
    it('should handle dynamic content loading failures', () => {
      const contentType = 'lazy-loaded-articles';
      
      const error = new DynamicContentError(
        contentType,
        'Content failed to load after scroll trigger',
        {
          triggerEvent: 'scroll-to-bottom',
          waitTime: 10000,
          expectedElements: 20,
          loadedElements: 5,
          infiniteScrollActive: true,
          ajaxRequests: [
          'https://api.example.com/articles?page=2',
          'https://api.example.com/articles?page=3'
        ],
          lastSuccessfulLoad: Date.now() - 30000
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'DynamicContentError');
      expect(error.context.loadedElements).toBeLessThan(error.context.expectedElements);
    });
  });

  describe('AntiScrapingDetectionError', () => {
    it('should handle anti-scraping detection', () => {
      const detectionMethod = 'cloudflare-challenge';
      
      const error = new AntiScrapingDetectionError(
        detectionMethod,
        'Cloudflare bot detection triggered',
        {
          detectionIndicators: [
            'cf-ray header present',
            'javascript challenge page',
            'captcha requirement'
          ],
          cloudflareRayId: 'cf-ray-12345678',
          challengeType: 'js-challenge',
          bypassAttempted: true,
          bypassSuccess: false,
          userAgentDetected: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'AntiScrapingDetectionError');
      expect(error.context.bypassSuccess).toBe(false);
    });
  });

  describe('ContentValidationError', () => {
    it('should handle content validation failures', () => {
      const validationType = 'data-completeness';
      
      const error = new ContentValidationError(
        validationType,
        'Required fields missing from extracted data',
        {
          requiredFields: ['title', 'author', 'date', 'content'],
          extractedFields: ['title', 'content'],
          missingFields: ['author', 'date'],
          dataCompleteness: 0.5,
          minimumCompleteness: 0.8,
          validationRules: ['all-required-fields', 'minimum-content-length', 'valid-dates']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ContentValidationError');
      expect(error.context.dataCompleteness).toBeLessThan(error.context.minimumCompleteness);
    });
  });

  describe('MetadataExtractionError', () => {
    it('should handle metadata extraction failures', () => {
      const metadataType = 'open-graph-tags';
      
      const error = new MetadataExtractionError(
        metadataType,
        'Open Graph tags malformed or missing',
        {
          expectedTags: ['og:title', 'og:description', 'og:image', 'og:url'],
          foundTags: ['og:title'],
          malformedTags: [
            { tag: 'og:image', issue: 'invalid-url-format' },
            { tag: 'og:description', issue: 'empty-content' }
          ],
          alternativeMetadata: {
            'twitter:title': 'Available',
            'meta[name="description"]': 'Available'
          }
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'MetadataExtractionError');
      expect(error.context.malformedTags).toHaveLength(2);
    });
  });
});

// ============================================================================
// PERFORMANCE/RESOURCE ERROR TESTS (10 types)
// ============================================================================

describe('Performance/Resource Error Handling', () => {
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  describe('MemoryLimitExceededError', () => {
    it('should handle memory limit exceeded scenarios', () => {
      const processId = 'netrunner-worker-3';
      const memoryUsage = 2048; // MB
      
      const error = new MemoryLimitExceededError(
        processId,
        memoryUsage,
        'Process memory usage exceeded configured limit',
        {
          memoryLimit: 1536, // MB
          heapUsed: 1800,
          heapTotal: 2000,
          external: 100,
          arrayBuffers: 48,
          processUptime: 3600000, // 1 hour
          gcFrequency: 'high',
          memoryLeakSuspected: true
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'MemoryLimitExceededError');
      expect(error.context.memoryUsage).toBeGreaterThan(error.context.memoryLimit);
    });

    it('should test memory usage patterns', async () => {
      const memoryScenarios = [
        { process: 'worker-1', usage: 512, limit: 1024, severity: 'low' },
        { process: 'worker-2', usage: 900, limit: 1024, severity: 'medium' },
        { process: 'worker-3', usage: 1100, limit: 1024, severity: 'high' },
        { process: 'worker-4', usage: 1500, limit: 1024, severity: 'critical' }
      ];

      const memoryErrors = [];

      for (const scenario of memoryScenarios) {
        if (scenario.usage > scenario.limit) {
          const error = new MemoryLimitExceededError(
            scenario.process,
            scenario.usage,
            `Memory limit exceeded: ${scenario.severity}`,
            { ...scenario }
          );
          memoryErrors.push(error);
          errorAnalytics.addError(error);
        }
      }

      expect(memoryErrors.length).toBe(2); // worker-3 and worker-4
    });
  });

  describe('ProcessingTimeoutError', () => {
    it('should handle processing timeout errors', () => {
      const operation = 'large-dataset-analysis';
      const timeoutMs = 300000; // 5 minutes
      
      const error = new ProcessingTimeoutError(
        operation,
        timeoutMs,
        'Analysis operation exceeded maximum processing time',
        {
          datasetSize: '500MB',
          recordsProcessed: 150000,
          totalRecords: 200000,
          processingRate: '500 records/sec',
          memoryUsage: 1200,
          cpuUsage: 0.95,
          operationStartTime: Date.now() - timeoutMs - 10000
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ProcessingTimeoutError');
      expect(error.context.recordsProcessed).toBeLessThan(error.context.totalRecords);
    });
  });

  describe('RateLimitExceededError', () => {
    it('should handle rate limiting scenarios', () => {
      const service = 'external-api-service';
      
      const error = new RateLimitExceededError(
        service,
        'API rate limit exceeded: 1000 requests per hour',
        {
          requestCount: 1001,
          rateLimit: 1000,
          timePeriod: '1 hour',
          resetTime: Date.now() + 3600000, // 1 hour from now
          retryAfter: 3600,
          currentWindow: {
            startTime: Date.now() - 3600000,
            requestsMade: 1001,
            remaining: 0
          }
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'RateLimitExceededError');
      expect(error.context.requestCount).toBeGreaterThan(error.context.rateLimit);
    });
  });

  describe('ConcurrencyLimitError', () => {
    it('should handle concurrency limit errors', () => {
      const resource = 'browser-instances';
      
      const error = new ConcurrencyLimitError(
        resource,
        'Maximum concurrent browser instances reached',
        {
          currentConcurrency: 25,
          maxConcurrency: 20,
          queuedRequests: 15,
          averageExecutionTime: 45000, // 45 seconds
          resourceType: 'puppeteer-browser',
          availableMemory: 2048,
          requiredMemoryPerInstance: 150
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ConcurrencyLimitError');
      expect(error.context.currentConcurrency).toBeGreaterThan(error.context.maxConcurrency);
    });
  });

  describe('ResourceExhaustionError', () => {
    it('should handle general resource exhaustion', () => {
      const resourceType = 'file-handles';
      
      const error = new ResourceExhaustionError(
        resourceType,
        'System file handle limit reached',
        {
          currentUsage: 65536,
          systemLimit: 65536,
          processLimit: 8192,
          resourceUtilization: 1.0,
          topConsumers: [
          { process: 'netrunner-main', usage: 2048 },
          { process: 'netrunner-worker-1', usage: 1024 },
          { process: 'netrunner-worker-2', usage: 1024 }
        ],
          mitigationSuggestions: ['close-idle-connections', 'increase-system-limits', 'restart-workers']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ResourceExhaustionError');
      expect(error.context.currentUsage).toBe(error.context.systemLimit);
    });
  });

  describe('PerformanceDegradationError', () => {
    it('should handle performance degradation detection', () => {
      const operation = 'content-scraping';
      
      const error = new PerformanceDegradationError(
        operation,
        'Processing speed degraded below acceptable threshold',
        {
          currentThroughput: 50, // items/minute
          expectedThroughput: 200,
          degradationPercent: 75,
          degradationThreshold: 50,
          samplePeriod: '10 minutes',
          performanceHistory: [
            { timestamp: Date.now() - 600000, throughput: 180 },
            { timestamp: Date.now() - 300000, throughput: 120 },
            { timestamp: Date.now(), throughput: 50 }
          ],
          possibleCauses: ['memory-pressure', 'cpu-throttling', 'network-latency']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'PerformanceDegradationError');
      expect(error.context.degradationPercent).toBeGreaterThan(error.context.degradationThreshold);
    });
  });

  describe('QueueOverflowError', () => {
    it('should handle queue overflow scenarios', () => {
      const queueName = 'content-processing-queue';
      
      const error = new QueueOverflowError(
        queueName,
        'Processing queue capacity exceeded',
        {
          currentSize: 10000,
          maxSize: 5000,
          overflowItems: 5000,
          processingRate: 100, // items/minute
          estimatedClearTime: 50, // minutes
          queueType: 'priority-queue',
          droppedItems: 1000,
          overflowPolicy: 'drop-oldest'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'QueueOverflowError');
      expect(error.context.currentSize).toBeGreaterThan(error.context.maxSize);
    });
  });

  describe('ThreadPoolExhaustionError', () => {
    it('should handle thread pool exhaustion', () => {
      const poolName = 'worker-thread-pool';
      
      const error = new ThreadPoolExhaustionError(
        poolName,
        'All worker threads busy, unable to process new tasks',
        {
          totalThreads: 8,
          busyThreads: 8,
          idleThreads: 0,
          queuedTasks: 50,
          averageTaskDuration: 30000, // 30 seconds
          threadUtilization: 1.0,
          threadStates: {
            'thread-1': 'executing-scraping-task',
            'thread-2': 'executing-analysis-task',
            'thread-3': 'executing-storage-task'
          }
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'ThreadPoolExhaustionError');
      expect(error.context.busyThreads).toBe(error.context.totalThreads);
    });
  });

  describe('CacheEvictionError', () => {
    it('should handle cache eviction errors', () => {
      const cacheKey = 'scraped-content-cache';
      
      const error = new CacheEvictionError(
        cacheKey,
        'Critical cache entry evicted during active use',
        {
          evictionReason: 'memory-pressure',
          cacheSize: '2GB',
          maxCacheSize: '1.5GB',
          evictedEntries: 1500,
          hitRate: 0.85,
          entryAge: 300000, // 5 minutes
          accessFrequency: 'high',
          evictionPolicy: 'LRU'
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'CacheEvictionError');
      expect(error.context.evictionReason).toBe('memory-pressure');
    });
  });

  describe('StorageQuotaExceededError', () => {
    it('should handle storage quota exceeded errors', () => {
      const storageType = 'content-database';
      
      const error = new StorageQuotaExceededError(
        storageType,
        'Database storage quota exceeded',
        {
          currentUsage: '500GB',
          quotaLimit: '450GB',
          utilizationPercent: 111,
          growthRate: '10GB/day',
          estimatedDaysToFull: -5, // Already exceeded
          largestTables: [
            { name: 'scraped_content', size: '200GB' },
            { name: 'intel_entities', size: '150GB' },
            { name: 'processing_logs', size: '100GB' }
          ],
          cleanupRecommendations: ['archive-old-content', 'compress-logs', 'remove-duplicates']
        }
      );

      ErrorTestUtils.validateErrorStructure(error, 'StorageQuotaExceededError');
      expect(error.context.utilizationPercent).toBeGreaterThan(100);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS FOR PHASE 2A ERRORS
// ============================================================================

describe('Phase 2A NetRunner Collection Error Handling - Integration Tests', () => {
  let errorAnalytics: NetRunnerErrorAnalytics;

  beforeEach(() => {
    errorAnalytics = new NetRunnerErrorAnalytics();
    GlobalTestSetup.setup();
  });

  afterEach(() => {
    GlobalTestSetup.teardown();
  });

  it('should handle complex multi-layer error scenarios', async () => {
    // Simulate complex error cascade in NetRunner collection
    const url = 'https://complex-site.example.com';
    
    // 1. Proxy fails
    const proxyError = new ProxyConnectionError(
      'primary-proxy.example.com:8080',
      'Connection refused',
      { failover: true }
    );
    errorAnalytics.addError(proxyError);

    // 2. Content retrieval fails due to proxy
    const contentError = new ContentRetrievalError(
      url,
      0, // No response due to proxy failure
      'Failed to establish connection',
      { cascadingFrom: proxyError.code }
    );
    errorAnalytics.addError(contentError);

    // 3. Memory pressure from retry attempts
    const memoryError = new MemoryLimitExceededError(
      'retry-worker',
      1800,
      'Memory exhausted during retry operations',
      { cascadingFrom: contentError.code, memoryLimit: 1536 }
    );
    errorAnalytics.addError(memoryError);

    const metrics = errorAnalytics.getMetrics();
    expect(metrics.totalErrors).toBe(3);
    expect(metrics.errorsByCategory['NETRUNNER_PROXY']).toBe(1);
    expect(metrics.errorsByCategory['CONTENT_COLLECTION']).toBe(1);
    expect(metrics.errorsByCategory['PERFORMANCE_RESOURCE']).toBe(1);
  });

  it('should test performance under high error load', async () => {
    const errorTypes = [
      ProxyConnectionError,
      ContentRetrievalError,
      WebScrapingError,
      MemoryLimitExceededError,
      RateLimitExceededError
    ];

    const { result, duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
      const errors = [];
      
      for (let i = 0; i < 5000; i++) {
        const ErrorType = errorTypes[i % errorTypes.length];
        const error = new ErrorType(`Performance test error ${i}`, { testIndex: i });
        errors.push(error);
        errorAnalytics.addError(error);
      }
      
      return {
        totalErrors: errors.length,
        metrics: errorAnalytics.getMetrics(),
        commonErrors: errorAnalytics.getMostCommonErrors(5)
      };
    });

    expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.BATCH_PROCESSING);
    expect(result.totalErrors).toBe(5000);
    expect(result.metrics.totalErrors).toBe(5000);
  });

  it('should validate error recovery and retry logic', async () => {
    const retryableScenarios = [
      { error: new ProxyTimeoutError('proxy.example.com:8080', 30000, 'Timeout'), expectedRetry: true },
      { error: new ContentRetrievalError('https://example.com', 503, 'Service unavailable'), expectedRetry: true },
      { error: new RateLimitExceededError('api-service', 'Rate limit exceeded'), expectedRetry: true },
      { error: new ProcessingTimeoutError('analysis', 60000, 'Processing timeout'), expectedRetry: true }
    ];

    const nonRetryableScenarios = [
      { error: new ProxyAuthenticationError('proxy.example.com:8080', 'Invalid credentials'), expectedRetry: false },
      { error: new ContentRetrievalError('https://example.com', 404, 'Not found'), expectedRetry: false },
      { error: new AntiScrapingDetectionError('captcha', 'CAPTCHA required'), expectedRetry: false },
      { error: new MemoryLimitExceededError('worker', 2048, 'Out of memory', { memoryLimit: 1536 }), expectedRetry: false }
    ];

    // Test retryable errors
    for (const scenario of retryableScenarios) {
      expect(NetRunnerErrorHandler.isRetryableError(scenario.error)).toBe(scenario.expectedRetry);
      errorAnalytics.addError(scenario.error);
    }

    // Test non-retryable errors
    for (const scenario of nonRetryableScenarios) {
      expect(NetRunnerErrorHandler.isRetryableError(scenario.error)).toBe(scenario.expectedRetry);
      errorAnalytics.addError(scenario.error);
    }

    const metrics = errorAnalytics.getMetrics();
    expect(metrics.retryableErrors).toBe(retryableScenarios.length);
  });

  it('should test error pattern recognition', async () => {
    // Create patterns of related errors
    const patterns = [
      // Pattern 1: Proxy cascade
      [
        new ProxyConnectionError('proxy-1.example.com:8080', 'Connection failed'),
        new ProxyConnectionError('proxy-2.example.com:8080', 'Connection failed'),
        new ProxyPoolExhaustionError('primary-pool', 'No healthy proxies')
      ],
      // Pattern 2: Content collection cascade
      [
        new ContentRetrievalError('https://site1.example.com', 403, 'Forbidden'),
        new AntiScrapingDetectionError('cloudflare', 'Bot detection'),
        new ContentValidationError('data-extraction', 'Incomplete data')
      ],
      // Pattern 3: Resource exhaustion cascade
      [
        new MemoryLimitExceededError('worker-1', 1800, 'Memory exceeded', { memoryLimit: 1536 }),
        new ThreadPoolExhaustionError('worker-pool', 'All threads busy'),
        new QueueOverflowError('processing-queue', 'Queue capacity exceeded')
      ]
    ];

    for (const pattern of patterns) {
      for (const error of pattern) {
        errorAnalytics.addError(error);
      }
    }

    const criticalPatterns = errorAnalytics.getCriticalErrorPatterns();
    expect(criticalPatterns.length).toBeGreaterThan(0);

    const metrics = errorAnalytics.getMetrics();
    expect(metrics.totalErrors).toBe(patterns.flat().length);
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
