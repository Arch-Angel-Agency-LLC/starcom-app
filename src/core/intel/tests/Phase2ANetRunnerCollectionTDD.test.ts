/**
 * TDD Test Suite for Phase 2A: NetRunner Collection Error Types
 * Testing comprehensive error handling for NetRunner website scanning and data collection
 */

import {
  // Website Scanner Errors
  WebsiteScannerError,
  ScanInitializationError,
  URLValidationError,
  ProxyConnectionError,
  ContentRetrievalError,
  HTMLParsingError,
  TechnologyDetectionError,
  EmailExtractionError,
  SocialMediaExtractionError,
  SubdomainDiscoveryError,
  ServerInfoExtractionError,
  HeaderAnalysisError,
  CertificateAnalysisError,
  DNSLookupError,
  VulnerabilityDetectionError,
  SecurityHeaderAnalysisError,
  
  // Intel Generation Errors
  IntelGenerationError,
  EmailIntelGenerationError,
  SocialIntelGenerationError,
  TechnologyIntelGenerationError,
  SubdomainIntelGenerationError,
  ServerIntelGenerationError,
  
  // Quality Assessment Errors
  QualityAssessmentError,
  ReliabilityCalculationError,
  ConfidenceScoreError,
  QualityMetricsError,
  DataValidationError,
  CorrelationAnalysisError
} from '../errors/NetRunnerErrorTypes';

describe('TDD Phase 2A: NetRunner Collection Error Types', () => {
  
  describe('ScanInitializationError', () => {
    it('should create scan initialization error with proper structure', () => {
      const url = 'https://example.com';
      const reason = 'Network timeout during scan setup';
      const error = new ScanInitializationError(url, reason, {
        timeout: 30000,
        retryAttempts: 3,
        userAgent: 'NetRunner/1.0'
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WebsiteScannerError);
      expect(error.name).toBe('ScanInitializationError');
      expect(error.code).toBe('SCAN_INIT_FAILED');
      expect(error.category).toBe('WEBSITE_SCANNER');
      expect(error.severity).toBe('medium');
      expect(error.message).toContain(url);
      expect(error.message).toContain(reason);
      expect(error.context?.timeout).toBe(30000);
    });

    it('should handle network connectivity failures', () => {
      const url = 'https://offline-site.com';
      const error = new ScanInitializationError(url, 'Network unreachable', {
        networkError: 'ENETUNREACH',
        retryable: true,
        backoffTime: 5000
      });

      expect(error.context?.networkError).toBe('ENETUNREACH');
      expect(error.context?.retryable).toBe(true);
      expect(error.context?.backoffTime).toBe(5000);
    });
  });

  describe('URLValidationError', () => {
    it('should create URL validation error with validation context', () => {
      const invalidUrl = 'not-a-valid-url';
      const error = new URLValidationError(invalidUrl, 'Invalid URL format', {
        validationRule: 'url-format',
        expectedProtocol: ['http', 'https'],
        actualProtocol: null
      });

      expect(error.name).toBe('URLValidationError');
      expect(error.code).toBe('URL_VALIDATION_FAILED');
      expect(error.message).toContain(invalidUrl);
      expect(error.context?.validationRule).toBe('url-format');
      expect(error.context?.expectedProtocol).toEqual(['http', 'https']);
    });

    it('should handle blocked domain scenarios', () => {
      const blockedUrl = 'https://blocked-domain.com';
      const error = new URLValidationError(blockedUrl, 'Domain is blocked', {
        blockReason: 'security-policy',
        blockList: 'corporate-blacklist',
        override: false
      });

      expect(error.context?.blockReason).toBe('security-policy');
      expect(error.context?.override).toBe(false);
    });
  });

  describe('ContentRetrievalError', () => {
    it('should create content retrieval error with HTTP context', () => {
      const url = 'https://protected-site.com';
      const statusCode = 403;
      const reason = 'Access forbidden';
      const error = new ContentRetrievalError(url, statusCode, reason, {
        httpMethod: 'GET',
        headers: { 'User-Agent': 'NetRunner/1.0' },
        redirectCount: 2,
        responseTime: 1500
      });

      expect(error.name).toBe('ContentRetrievalError');
      expect(error.code).toBe('CONTENT_RETRIEVAL_FAILED');
      expect(error.message).toContain(url);
      expect(error.message).toContain('403');
      expect(error.context?.httpMethod).toBe('GET');
      expect(error.context?.redirectCount).toBe(2);
    });

    it('should handle rate limiting scenarios', () => {
      const url = 'https://rate-limited-api.com';
      const error = new ContentRetrievalError(url, 429, 'Too many requests', {
        retryAfter: 60,
        requestsRemaining: 0,
        rateLimitType: 'per-hour'
      });

      expect(error.message).toContain('429');
      expect(error.context?.retryAfter).toBe(60);
      expect(error.context?.rateLimitType).toBe('per-hour');
    });
  });

  describe('HTMLParsingError', () => {
    it('should create HTML parsing error with parser context', () => {
      const url = 'https://malformed-html.com';
      const reason = 'Unclosed div tags detected';
      const error = new HTMLParsingError(url, reason, {
        parser: 'cheerio',
        parseErrors: ['unclosed-div', 'invalid-nesting'],
        recoveryAttempted: true,
        parsedPartially: true
      });

      expect(error.name).toBe('HTMLParsingError');
      expect(error.code).toBe('HTML_PARSING_FAILED');
      expect(error.message).toContain(url);
      expect(error.context?.parser).toBe('cheerio');
      expect(error.context?.parseErrors).toContain('unclosed-div');
      expect(error.context?.recoveryAttempted).toBe(true);
    });
  });

  describe('TechnologyDetectionError', () => {
    it('should create technology detection error with detection context', () => {
      const url = 'https://tech-site.com';
      const technology = 'React';
      const reason = 'Signature not found in source';
      const error = new TechnologyDetectionError(url, technology, reason, {
        detectionMethod: 'signature-analysis',
        signatureVersion: '1.2.3',
        confidence: 0.25,
        threshold: 0.7
      });

      expect(error.name).toBe('TechnologyDetectionError');
      expect(error.code).toBe('TECH_DETECTION_FAILED');
      expect(error.message).toContain(technology);
      expect(error.context?.detectionMethod).toBe('signature-analysis');
      expect(error.context?.confidence).toBe(0.25);
    });
  });

  describe('EmailExtractionError', () => {
    it('should create email extraction error with extraction context', () => {
      const url = 'https://contact-site.com';
      const reason = 'No valid email patterns found';
      const error = new EmailExtractionError(url, reason, {
        extractionMethod: 'regex-pattern',
        patternsChecked: ['standard-email', 'obfuscated-email'],
        candidatesFound: 0,
        domainFilters: ['@example.com']
      });

      expect(error.name).toBe('EmailExtractionError');
      expect(error.code).toBe('EMAIL_EXTRACTION_FAILED');
      expect(error.message).toContain(url);
      expect(error.context?.extractionMethod).toBe('regex-pattern');
      expect(error.context?.candidatesFound).toBe(0);
    });
  });

  describe('SocialMediaExtractionError', () => {
    it('should create social media extraction error with platform context', () => {
      const url = 'https://business-site.com';
      const platform = 'LinkedIn';
      const reason = 'Platform links obfuscated';
      const error = new SocialMediaExtractionError(url, platform, reason, {
        extractionMethod: 'link-analysis',
        platformPatterns: ['linkedin.com/company/', 'linkedin.com/in/'],
        obfuscationDetected: true,
        alternativeSearch: false
      });

      expect(error.name).toBe('SocialMediaExtractionError');
      expect(error.code).toBe('SOCIAL_EXTRACTION_FAILED');
      expect(error.message).toContain(platform);
      expect(error.context?.obfuscationDetected).toBe(true);
      expect(error.context?.platformPatterns).toContain('linkedin.com/company/');
    });
  });

  describe('EmailIntelGenerationError', () => {
    it('should create email intel generation error with validation context', () => {
      const email = 'invalid@domain';
      const reason = 'Domain validation failed';
      const error = new EmailIntelGenerationError(email, reason, {
        validationStep: 'domain-mx-check',
        mxRecords: [],
        domainAge: null,
        reputation: 'unknown'
      });

      expect(error.name).toBe('EmailIntelGenerationError');
      expect(error.code).toBe('EMAIL_INTEL_FAILED');
      expect(error.message).toContain(email);
      expect(error.context?.validationStep).toBe('domain-mx-check');
      expect(error.context?.mxRecords).toEqual([]);
    });
  });

  describe('TechnologyIntelGenerationError', () => {
    it('should create technology intel generation error with enrichment context', () => {
      const technology = 'Vue.js';
      const reason = 'Version detection failed';
      const error = new TechnologyIntelGenerationError(technology, reason, {
        detectedVersion: null,
        versionSources: ['headers', 'source-code', 'meta-tags'],
        confidence: 0.45,
        enrichmentSources: ['wappalyzer', 'builtwith']
      });

      expect(error.name).toBe('TechnologyIntelGenerationError');
      expect(error.code).toBe('TECH_INTEL_FAILED');
      expect(error.message).toContain(technology);
      expect(error.context?.versionSources).toContain('headers');
      expect(error.context?.confidence).toBe(0.45);
    });
  });

  describe('ReliabilityCalculationError', () => {
    it('should create reliability calculation error with calculation context', () => {
      const dataType = 'email-intel';
      const reason = 'Insufficient validation factors';
      const error = new ReliabilityCalculationError(dataType, reason, {
        algorithm: 'weighted-factors',
        requiredFactors: ['domain-age', 'mx-records', 'reputation'],
        availableFactors: ['domain-age'],
        minimumFactors: 2,
        fallbackReliability: 0.3
      });

      expect(error.name).toBe('ReliabilityCalculationError');
      expect(error.code).toBe('RELIABILITY_CALC_FAILED');
      expect(error.message).toContain(dataType);
      expect(error.context?.algorithm).toBe('weighted-factors');
      expect(error.context?.availableFactors).toHaveLength(1);
    });
  });

  describe('CorrelationAnalysisError', () => {
    it('should create correlation analysis error with analysis context', () => {
      const sourceId = 'intel-source-123';
      const targetId = 'intel-target-456';
      const reason = 'Insufficient data points for correlation';
      const error = new CorrelationAnalysisError(sourceId, targetId, reason, {
        correlationMethod: 'temporal-overlap',
        dataPoints: 3,
        minimumDataPoints: 10,
        timeWindow: '7d',
        correlationStrength: null
      });

      expect(error.name).toBe('CorrelationAnalysisError');
      expect(error.code).toBe('CORRELATION_ANALYSIS_FAILED');
      expect(error.message).toContain(sourceId);
      expect(error.message).toContain(targetId);
      expect(error.context?.correlationMethod).toBe('temporal-overlap');
      expect(error.context?.dataPoints).toBe(3);
    });
  });
});
