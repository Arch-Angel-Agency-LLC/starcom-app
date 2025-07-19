/**
 * Results Categorization Engine Tests
 * 
 * Test-Driven Development for the Results System
 * Testing results categorization, inspection, and display capabilities
 * 
 * @author GitHub Copilot
 * @date July 17, 2025
 */

import { 
  ResultsCategorizationEngine,
  CategorizedResult,
  ResultCategory
} from '../results/ResultsCategorizationEngine';
import { ScriptResult, ScriptErrorType } from '../types/ScriptTypes';

describe('ResultsCategorizationEngine', () => {
  let engine: ResultsCategorizationEngine;

  beforeEach(() => {
    engine = new ResultsCategorizationEngine();
  });

  describe('Result Categorization', () => {
    test('should categorize email extraction results correctly', () => {
      const emailResult: ScriptResult = {
        success: true,
        data: {
          type: 'contact-information',
          category: 'email-extraction',
          confidence: 0.9,
          data: {
            emails: ['test@example.com', 'admin@company.org'],
            domains: ['example.com', 'company.org']
          },
          relationships: [],
          enrichments: [],
          validations: []
        },
        metrics: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 1000,
          memoryUsage: 10,
          cpuUsage: 15,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'email-extractor',
          scriptVersion: '1.0.0',
          executionId: 'test-exec-1',
          sourceData: 'test-source',
          processingSteps: [],
          qualityScore: 0.9,
          flags: []
        }
      };

      const categorized = engine.categorizeResult(emailResult);

      expect(categorized.category).toBe(ResultCategory.CONTACTS);
      expect(categorized.subcategory).toBe('email-addresses');
      expect(categorized.priority).toBe('high');
      expect(categorized.confidence).toBe(0.9);
      expect(categorized.itemCount).toBe(2);
    });

    test('should categorize domain analysis results correctly', () => {
      const domainResult: ScriptResult = {
        success: true,
        data: {
          type: 'structured-intel',
          category: 'domain-analysis',
          confidence: 0.85,
          data: {
            domains: [
              { domain: 'example.com', category: 'business', riskLevel: 'low' },
              { domain: 'test.org', category: 'nonprofit', riskLevel: 'medium' }
            ],
            totalFound: 2
          },
          relationships: [],
          enrichments: [],
          validations: []
        },
        metrics: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 800,
          memoryUsage: 8,
          cpuUsage: 12,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'domain-parser',
          scriptVersion: '1.0.0',
          executionId: 'test-exec-2',
          sourceData: 'test-source',
          processingSteps: [],
          qualityScore: 0.85,
          flags: []
        }
      };

      const categorized = engine.categorizeResult(domainResult);

      expect(categorized.category).toBe(ResultCategory.INFRASTRUCTURE);
      expect(categorized.subcategory).toBe('domains');
      expect(categorized.priority).toBe('medium');
      expect(categorized.confidence).toBe(0.85);
      expect(categorized.itemCount).toBe(2);
    });

    test('should categorize technology stack results correctly', () => {
      const techStackResult: ScriptResult = {
        success: true,
        data: {
          type: 'technical-details',
          category: 'technology-stack',
          confidence: 0.92,
          data: {
            technologies: [
              { name: 'React', category: 'frontend', confidence: 0.95 },
              { name: 'Node.js', category: 'backend', confidence: 0.88 },
              { name: 'MongoDB', category: 'database', confidence: 0.90 }
            ],
            totalFound: 3
          },
          relationships: [],
          enrichments: [],
          validations: []
        },
        metrics: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 1200,
          memoryUsage: 15,
          cpuUsage: 20,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'tech-stack-analyzer',
          scriptVersion: '1.0.0',
          executionId: 'test-exec-3',
          sourceData: 'test-source',
          processingSteps: [],
          qualityScore: 0.92,
          flags: []
        }
      };

      const categorized = engine.categorizeResult(techStackResult);

      expect(categorized.category).toBe(ResultCategory.TECHNOLOGY);
      expect(categorized.subcategory).toBe('frameworks-libraries');
      expect(categorized.priority).toBe('high');
      expect(categorized.confidence).toBe(0.92);
      expect(categorized.itemCount).toBe(3);
    });

    test('should handle failed script results', () => {
      const failedResult: ScriptResult = {
        success: false,
        error: {
          type: ScriptErrorType.DATA_VALIDATION_ERROR,
          code: 'DVE026',
          message: 'Invalid input data',
          details: 'Input data was null',
          context: {
            scriptId: 'test-script',
            executionId: 'test-exec-fail',
            step: 'validation',
            environment: 'browser',
            userAgent: 'test-agent'
          },
          timestamp: new Date(),
          recoverable: true,
          suggestions: ['Check input data']
        },
        metrics: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 100,
          memoryUsage: 1,
          cpuUsage: 2,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'failed-script',
          scriptVersion: '1.0.0',
          executionId: 'test-exec-fail',
          sourceData: 'invalid-source',
          processingSteps: [],
          qualityScore: 0,
          flags: ['execution-error']
        }
      };

      const categorized = engine.categorizeResult(failedResult);

      expect(categorized.category).toBe(ResultCategory.ERRORS);
      expect(categorized.subcategory).toBe('validation-errors');
      expect(categorized.priority).toBe('low');
      expect(categorized.confidence).toBe(0);
      expect(categorized.itemCount).toBe(0);
    });
  });

  describe('Result Priority Assignment', () => {
    test('should assign high priority to high-confidence results with many items', () => {
      const result = {
        confidence: 0.95,
        itemCount: 20,
        category: ResultCategory.CONTACTS
      } as CategorizedResult;

      const priority = engine.calculatePriority(result);
      expect(priority).toBe('high');
    });

    test('should assign medium priority to moderate results', () => {
      const result = {
        confidence: 0.75,
        itemCount: 5,
        category: ResultCategory.INFRASTRUCTURE
      } as CategorizedResult;

      const priority = engine.calculatePriority(result);
      expect(priority).toBe('medium');
    });

    test('should assign low priority to low-confidence or error results', () => {
      const result = {
        confidence: 0.3,
        itemCount: 1,
        category: ResultCategory.ERRORS
      } as CategorizedResult;

      const priority = engine.calculatePriority(result);
      expect(priority).toBe('low');
    });
  });

  describe('Result Inspection Data Generation', () => {
    test('should generate detailed inspection data for email results', () => {
      const emailResult: CategorizedResult = {
        id: 'test-result-1',
        scriptId: 'email-extractor',
        category: ResultCategory.CONTACTS,
        subcategory: 'email-addresses',
        title: 'Email Addresses Found',
        description: 'Extracted email addresses from scan data',
        confidence: 0.9,
        priority: 'high',
        itemCount: 3,
        timestamp: new Date(),
        data: {
          emails: ['admin@example.com', 'contact@test.org', 'info@company.net'],
          domains: ['example.com', 'test.org', 'company.net'],
          categories: { business: 2, nonprofit: 1 }
        },
        metadata: {
          executionTime: 1200,
          dataQuality: 0.95,
          sources: ['html-content', 'meta-tags']
        }
      };

      const inspectionData = engine.generateInspectionData(emailResult);

      expect(inspectionData.overview.title).toBe('Email Addresses Found');
      expect(inspectionData.overview.confidence).toBe(0.9);
      expect(inspectionData.overview.itemCount).toBe(3);
      expect(inspectionData.details.length).toBeGreaterThan(0);
      expect(inspectionData.metrics.executionTime).toBe(1200);
      expect(inspectionData.actions.length).toBeGreaterThan(0);
    });

    test('should generate appropriate actions for different result types', () => {
      const techResult: CategorizedResult = {
        id: 'test-result-2',
        scriptId: 'tech-stack-analyzer',
        category: ResultCategory.TECHNOLOGY,
        subcategory: 'frameworks-libraries',
        title: 'Technology Stack Detected',
        description: 'Identified technology frameworks and libraries',
        confidence: 0.88,
        priority: 'high',
        itemCount: 5,
        timestamp: new Date(),
        data: {
          technologies: [
            { name: 'React', category: 'frontend', version: '18.2.0' },
            { name: 'Express', category: 'backend', version: '4.18.0' }
          ]
        },
        metadata: {
          executionTime: 1500,
          dataQuality: 0.85,
          sources: ['script-tags', 'http-headers']
        }
      };

      const inspectionData = engine.generateInspectionData(techResult);

      expect(inspectionData.actions).toContainEqual(
        expect.objectContaining({
          type: 'export',
          label: 'Export Technology List'
        })
      );
      expect(inspectionData.actions).toContainEqual(
        expect.objectContaining({
          type: 'correlate',
          label: 'Find Related Technologies'
        })
      );
    });
  });

  describe('Result Filtering and Sorting', () => {
    test('should filter results by category', () => {
      const results: CategorizedResult[] = [
        createMockResult('1', ResultCategory.CONTACTS),
        createMockResult('2', ResultCategory.TECHNOLOGY),
        createMockResult('3', ResultCategory.CONTACTS),
        createMockResult('4', ResultCategory.INFRASTRUCTURE)
      ];

      const filtered = engine.filterResults(results, { category: ResultCategory.CONTACTS });
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.category === ResultCategory.CONTACTS)).toBe(true);
    });

    test('should filter results by confidence threshold', () => {
      const results: CategorizedResult[] = [
        createMockResult('1', ResultCategory.CONTACTS, 0.9),
        createMockResult('2', ResultCategory.TECHNOLOGY, 0.5),
        createMockResult('3', ResultCategory.CONTACTS, 0.8),
        createMockResult('4', ResultCategory.INFRASTRUCTURE, 0.3)
      ];

      const filtered = engine.filterResults(results, { minConfidence: 0.7 });
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.confidence >= 0.7)).toBe(true);
    });

    test('should sort results by priority and confidence', () => {
      const results: CategorizedResult[] = [
        createMockResult('1', ResultCategory.CONTACTS, 0.7, 'medium'),
        createMockResult('2', ResultCategory.TECHNOLOGY, 0.9, 'high'),
        createMockResult('3', ResultCategory.CONTACTS, 0.8, 'high'),
        createMockResult('4', ResultCategory.INFRASTRUCTURE, 0.5, 'low')
      ];

      const sorted = engine.sortResults(results);
      
      // High priority items should come first
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('high');
      
      // Within same priority, higher confidence should come first
      expect(sorted[0].confidence).toBeGreaterThanOrEqual(sorted[1].confidence);
    });
  });
});

// Helper function to create mock results for testing
function createMockResult(
  id: string, 
  category: ResultCategory, 
  confidence: number = 0.8, 
  priority: 'low' | 'medium' | 'high' = 'medium'
): CategorizedResult {
  return {
    id,
    scriptId: 'mock-script',
    category,
    subcategory: 'mock-subcategory',
    title: `Mock Result ${id}`,
    description: `Mock description for result ${id}`,
    confidence,
    priority,
    itemCount: Math.floor(Math.random() * 10) + 1,
    timestamp: new Date(),
    data: { mockData: true },
    metadata: {
      executionTime: 1000,
      dataQuality: confidence,
      sources: ['mock-source']
    }
  };
}
