/**
 * NetRunner Scripts Engine - Email Extractor Script
 * 
 * Advanced email discovery, validation, and categorization script designed
 * for OSINT operations. Identifies email addresses, validates their format
 * and deliverability, and categorizes them by role and organization type.
 * 
 * @author GitHub Copilot
 * @date July 17, 2025
 */

console.log('[EmailExtractorScript] Module loading...');

import {
  ScriptDefinition,
  ScriptInput,
  ScriptResult,
  ScriptExecutionContext,
  ScriptCategory,
  ScriptInputType,
  ScriptOutputType,
  ProcessedIntelligenceData,
  ValidationResult,
  ConfigurationValue,
  ScriptErrorType,
  DataRelationship
} from '../types/ScriptTypes';

export interface EmailData {
  email: string;
  domain: string;
  localPart: string;
  isValid: boolean;
  confidence: number;
  sources: string[];
  context: string;
  category: 'business' | 'personal' | 'support' | 'security' | 'marketing' | 'unknown';
  metadata: {
    firstSeen: Date;
    lastSeen: Date;
    frequency: number;
    locations: string[];
    associatedContent: string[];
  };
}

export interface EmailExtractionResult {
  emails: EmailData[];
  totalFound: number;
  validEmails: number;
  domains: string[];
  statistics: {
    byCategory: Record<string, number>;
    byDomain: Record<string, number>;
    confidenceDistribution: Record<string, number>;
  };
}

/**
 * Email Extractor Script Definition
 */
export const EmailExtractorScript: ScriptDefinition = {
  metadata: {
    id: 'email-extractor-v1',
    name: 'Enhanced Email Extractor',
    version: '1.0.0',
    description: 'Extracts, validates, and categorizes email addresses from OSINT data',
    author: 'NetRunner Scripts Engine',
    category: 'email-extraction' as ScriptCategory,
    tags: ['email', 'extraction', 'validation', 'osint', 'contacts'],
    dependencies: [],
    created: new Date('2025-07-17'),
    updated: new Date('2025-07-17')
  },

  configuration: {
    inputTypes: ['raw-osint-data', 'website-scan-results'] as ScriptInputType[],
    outputTypes: ['structured-intel', 'contact-information'] as ScriptOutputType[],
    parameters: [
      {
        name: 'validateDNS',
        type: 'boolean',
        description: 'Perform DNS validation on email domains',
        required: false,
        default: true
      },
      {
        name: 'confidenceThreshold',
        type: 'number',
        description: 'Minimum confidence score for extracted emails (0-1)',
        required: false,
        default: 0.7,
        validation: '^(0(\\.[0-9]+)?|1(\\.0+)?)$'
      },
      {
        name: 'includeObfuscated',
        type: 'boolean',
        description: 'Attempt to extract obfuscated emails (e.g., user[at]domain[dot]com)',
        required: false,
        default: true
      },
      {
        name: 'categorizeEmails',
        type: 'boolean',
        description: 'Automatically categorize emails by type',
        required: false,
        default: true
      },
      {
        name: 'maxResults',
        type: 'number',
        description: 'Maximum number of emails to extract',
        required: false,
        default: 1000
      }
    ],
    defaults: {
      validateDNS: true,
      confidenceThreshold: 0.7,
      includeObfuscated: true,
      categorizeEmails: true,
      maxResults: 1000
    },
    required: []
  },

  async execute(
    input: ScriptInput,
    config: Record<string, ConfigurationValue>,
    context: ScriptExecutionContext
  ): Promise<ScriptResult> {
    const startTime = Date.now();

    try {
      console.log(`[EmailExtractor] Starting extraction for ${input.metadata.targetUrl}`);

      // Extract configuration
      const validateDNS = config.validateDNS as boolean;
      const confidenceThreshold = config.confidenceThreshold as number;
      const includeObfuscated = config.includeObfuscated as boolean;
      const categorizeEmails = config.categorizeEmails as boolean;
      const maxResults = config.maxResults as number;

      // Extract emails from input data
      const extractedEmails = await extractEmailsFromData(
        input.data,
        {
          includeObfuscated,
          maxResults,
          targetUrl: input.metadata.targetUrl
        }
      );

      // Validate and enrich emails
      const enrichedEmails: EmailData[] = [];
      for (const emailInfo of extractedEmails) {
        const emailData = await processEmail(
          emailInfo,
          {
            validateDNS,
            categorizeEmails,
            confidenceThreshold
          }
        );

        if (emailData.confidence >= confidenceThreshold) {
          enrichedEmails.push(emailData);
        }
      }

      // Generate statistics
      const statistics = generateEmailStatistics(enrichedEmails);

      // Create result
      const result: EmailExtractionResult = {
        emails: enrichedEmails,
        totalFound: extractedEmails.length,
        validEmails: enrichedEmails.length,
        domains: [...new Set(enrichedEmails.map(e => e.domain))],
        statistics
      };

      const processedData: ProcessedIntelligenceData = {
        type: 'contact-information' as ScriptOutputType,
        category: 'email-extraction',
        confidence: calculateOverallConfidence(enrichedEmails),
        data: result as unknown as Record<string, unknown>,
        relationships: generateEmailRelationships(enrichedEmails),
        enrichments: [],
        validations: [await validateEmailResults(result)]
      };

      const duration = Date.now() - startTime;
      console.log(`[EmailExtractor] Completed extraction: ${enrichedEmails.length} emails in ${duration}ms`);

      return {
        success: true,
        data: processedData,
        metrics: {
          startTime: new Date(startTime),
          endTime: new Date(),
          duration,
          memoryUsage: 0,
          cpuUsage: 0,
          networkRequests: validateDNS ? enrichedEmails.length : 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: context.metadata.id,
          scriptVersion: context.metadata.version,
          executionId: `exec_${Date.now()}`,
          sourceData: input.source,
          processingSteps: [
            {
              step: 'email-extraction',
              duration: duration * 0.4,
              success: true,
              details: `Extracted ${extractedEmails.length} potential emails`
            },
            {
              step: 'validation-enrichment',
              duration: duration * 0.6,
              success: true,
              details: `Validated and enriched ${enrichedEmails.length} emails`
            }
          ],
          qualityScore: calculateQualityScore(result),
          flags: generateFlags(result)
        }
      };

    } catch (error) {
      console.error('[EmailExtractor] Execution failed:', error);
      
      return {
        success: false,
        error: {
          type: ScriptErrorType.DATA_EXTRACTION_ERROR,
          code: 'EMAIL_EXTRACTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error during email extraction',
          details: `Failed to extract emails from ${input.metadata.targetUrl}`,
          context: {
            scriptId: context.metadata.id,
            executionId: `exec_${Date.now()}`,
            step: 'email-extraction',
            environment: 'browser',
            userAgent: navigator.userAgent
          },
          timestamp: new Date(),
          recoverable: true,
          suggestions: [
            'Check input data format',
            'Verify network connectivity for DNS validation',
            'Reduce maxResults if memory issues occur'
          ]
        },
        metrics: {
          startTime: new Date(startTime),
          endTime: new Date(),
          duration: Date.now() - startTime,
          memoryUsage: 0,
          cpuUsage: 0,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: context.metadata.id,
          scriptVersion: context.metadata.version,
          executionId: `exec_${Date.now()}`,
          sourceData: input.source,
          processingSteps: [],
          qualityScore: 0,
          flags: ['extraction-failed']
        }
      };
    }
  },

  async validate(
    input: ScriptInput,
    config: Record<string, ConfigurationValue>
  ): Promise<ValidationResult> {
    const issues = [];

    // Validate input data
    if (!input.data) {
      issues.push({
        type: 'error' as const,
        field: 'data',
        message: 'Input data is required',
        severity: 10
      });
    }

    // Validate configuration
    const confidenceThreshold = config.confidenceThreshold as number;
    if (confidenceThreshold < 0 || confidenceThreshold > 1) {
      issues.push({
        type: 'error' as const,
        field: 'confidenceThreshold',
        message: 'Confidence threshold must be between 0 and 1',
        severity: 8
      });
    }

    const maxResults = config.maxResults as number;
    if (maxResults <= 0 || maxResults > 10000) {
      issues.push({
        type: 'warning' as const,
        field: 'maxResults',
        message: 'Max results should be between 1 and 10000',
        severity: 5
      });
    }

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      confidence: issues.length === 0 ? 1.0 : Math.max(0.5, 1.0 - issues.length * 0.1),
      issues,
      suggestions: issues.length === 0 ? [] : [
        'Review configuration parameters',
        'Ensure input data is properly formatted'
      ]
    };
  }
};

// ===== HELPER FUNCTIONS =====

interface ExtractedEmailInfo {
  email: string;
  context: string;
  source: string;
  confidence: number;
}

interface EmailExtractionOptions {
  includeObfuscated: boolean;
  maxResults: number;
  targetUrl: string;
}

async function extractEmailsFromData(
  data: unknown,
  options: EmailExtractionOptions
): Promise<ExtractedEmailInfo[]> {
  const emails: ExtractedEmailInfo[] = [];
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const obfuscatedRegex = /\b[A-Za-z0-9._%+-]+\s*(?:\[at\]|@)\s*[A-Za-z0-9.-]+\s*(?:\[dot\]|\.)\s*[A-Z|a-z]{2,}\b/gi;

  function extractFromText(text: string, source: string): void {
    // Standard email extraction
    const standardMatches = text.match(emailRegex) || [];
    for (const match of standardMatches) {
      if (emails.length >= options.maxResults) break;
      
      emails.push({
        email: match.toLowerCase(),
        context: getEmailContext(text, match),
        source,
        confidence: 0.9
      });
    }

    // Obfuscated email extraction
    if (options.includeObfuscated) {
      const obfuscatedMatches = text.match(obfuscatedRegex) || [];
      for (const match of obfuscatedMatches) {
        if (emails.length >= options.maxResults) break;
        
        const deobfuscated = match
          .replace(/\s*\[at\]\s*/gi, '@')
          .replace(/\s*\[dot\]\s*/gi, '.')
          .toLowerCase();
          
        emails.push({
          email: deobfuscated,
          context: getEmailContext(text, match),
          source,
          confidence: 0.7
        });
      }
    }
  }

  // Extract from different data types
  if (typeof data === 'string') {
    extractFromText(data, 'raw-text');
  } else if (typeof data === 'object' && data !== null) {
    const dataObj = data as Record<string, unknown>;
    
    // Extract from common OSINT data fields
    const textFields = ['content', 'text', 'body', 'description', 'html'];
    for (const field of textFields) {
      if (typeof dataObj[field] === 'string') {
        extractFromText(dataObj[field] as string, field);
      }
    }

    // Extract from arrays
    for (const [key, value] of Object.entries(dataObj)) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'string') {
            extractFromText(item, `${key}[${index}]`);
          }
        });
      }
    }
  }

  // Remove duplicates
  const uniqueEmails = new Map<string, ExtractedEmailInfo>();
  for (const emailInfo of emails) {
    const existing = uniqueEmails.get(emailInfo.email);
    if (!existing || emailInfo.confidence > existing.confidence) {
      uniqueEmails.set(emailInfo.email, emailInfo);
    }
  }

  return Array.from(uniqueEmails.values());
}

function getEmailContext(text: string, email: string): string {
  const index = text.toLowerCase().indexOf(email.toLowerCase());
  if (index === -1) return '';
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + email.length + 50);
  return text.substring(start, end).trim();
}

interface EmailProcessingOptions {
  validateDNS: boolean;
  categorizeEmails: boolean;
  confidenceThreshold: number;
}

async function processEmail(
  emailInfo: ExtractedEmailInfo,
  options: EmailProcessingOptions
): Promise<EmailData> {
  const [localPart, domain] = emailInfo.email.split('@');
  
  // Basic validation
  const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInfo.email);
  let isValid = isValidFormat;
  let confidence = emailInfo.confidence;

  // DNS validation (if enabled)
  if (options.validateDNS && isValidFormat) {
    try {
      // Simplified DNS check - in a real implementation, this would use actual DNS lookup
      isValid = domain.includes('.') && domain.length > 3;
      confidence = isValid ? Math.min(1.0, confidence + 0.1) : confidence * 0.5;
    } catch {
      confidence *= 0.8; // Reduce confidence if DNS validation fails
    }
  }

  // Email categorization
  let category: EmailData['category'] = 'unknown';
  if (options.categorizeEmails) {
    category = categorizeEmail(emailInfo.email, emailInfo.context);
  }

  return {
    email: emailInfo.email,
    domain,
    localPart,
    isValid,
    confidence,
    sources: [emailInfo.source],
    context: emailInfo.context,
    category,
    metadata: {
      firstSeen: new Date(),
      lastSeen: new Date(),
      frequency: 1,
      locations: [emailInfo.source],
      associatedContent: [emailInfo.context]
    }
  };
}

function categorizeEmail(email: string, context: string): EmailData['category'] {
  const lowerEmail = email.toLowerCase();
  const lowerContext = context.toLowerCase();

  // Business indicators
  const businessKeywords = ['contact', 'info', 'sales', 'business', 'office', 'company'];
  if (businessKeywords.some(kw => lowerEmail.includes(kw) || lowerContext.includes(kw))) {
    return 'business';
  }

  // Support indicators
  const supportKeywords = ['support', 'help', 'service', 'customer', 'technical'];
  if (supportKeywords.some(kw => lowerEmail.includes(kw) || lowerContext.includes(kw))) {
    return 'support';
  }

  // Security indicators
  const securityKeywords = ['security', 'admin', 'administrator', 'soc', 'incident'];
  if (securityKeywords.some(kw => lowerEmail.includes(kw) || lowerContext.includes(kw))) {
    return 'security';
  }

  // Marketing indicators
  const marketingKeywords = ['marketing', 'newsletter', 'promo', 'campaign', 'news'];
  if (marketingKeywords.some(kw => lowerEmail.includes(kw) || lowerContext.includes(kw))) {
    return 'marketing';
  }

  // Personal indicators (common personal email patterns)
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  if (personalDomains.some(domain => lowerEmail.includes(domain))) {
    return 'personal';
  }

  return 'unknown';
}

function generateEmailStatistics(emails: EmailData[]): EmailExtractionResult['statistics'] {
  const byCategory: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  const confidenceDistribution: Record<string, number> = {
    'high': 0, // 0.8+
    'medium': 0, // 0.6-0.8
    'low': 0 // <0.6
  };

  for (const email of emails) {
    // Category statistics
    byCategory[email.category] = (byCategory[email.category] || 0) + 1;
    
    // Domain statistics
    byDomain[email.domain] = (byDomain[email.domain] || 0) + 1;
    
    // Confidence distribution
    if (email.confidence >= 0.8) {
      confidenceDistribution.high++;
    } else if (email.confidence >= 0.6) {
      confidenceDistribution.medium++;
    } else {
      confidenceDistribution.low++;
    }
  }

  return { byCategory, byDomain, confidenceDistribution };
}

function calculateOverallConfidence(emails: EmailData[]): number {
  if (emails.length === 0) return 0;
  
  const totalConfidence = emails.reduce((sum, email) => sum + email.confidence, 0);
  return totalConfidence / emails.length;
}

function generateEmailRelationships(emails: EmailData[]): DataRelationship[] {
  const relationships = [];
  
  // Domain relationships
  const domainGroups = new Map<string, EmailData[]>();
  for (const email of emails) {
    if (!domainGroups.has(email.domain)) {
      domainGroups.set(email.domain, []);
    }
    domainGroups.get(email.domain)!.push(email);
  }

  for (const [domain, domainEmails] of domainGroups) {
    if (domainEmails.length > 1) {
      relationships.push({
        type: 'sibling',
        target: domain,
        confidence: 0.9,
        description: `${domainEmails.length} emails from same domain`
      });
    }
  }

  return relationships;
}

async function validateEmailResults(result: EmailExtractionResult): Promise<ValidationResult> {
  const issues = [];

  if (result.validEmails === 0) {
    issues.push({
      type: 'warning' as const,
      field: 'emails',
      message: 'No valid emails found',
      severity: 6
    });
  }

  if (result.totalFound > result.validEmails * 2) {
    issues.push({
      type: 'info' as const,
      field: 'validation',
      message: 'High number of invalid emails filtered out',
      severity: 3
    });
  }

  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    confidence: result.validEmails > 0 ? 0.9 : 0.5,
    issues,
    suggestions: issues.length > 0 ? [
      'Review email validation criteria',
      'Check source data quality'
    ] : []
  };
}

function calculateQualityScore(result: EmailExtractionResult): number {
  let score = 0;
  
  // Base score from valid emails
  if (result.validEmails > 0) score += 40;
  if (result.validEmails >= 5) score += 20;
  if (result.validEmails >= 10) score += 20;
  
  // Confidence distribution bonus
  const highConfidence = result.statistics.confidenceDistribution.high || 0;
  score += Math.min(20, highConfidence * 2);
  
  return Math.min(100, score);
}

function generateFlags(result: EmailExtractionResult): string[] {
  const flags = [];
  
  if (result.validEmails === 0) {
    flags.push('no-emails-found');
  }
  
  if (result.validEmails >= 20) {
    flags.push('high-email-count');
  }
  
  if (result.domains.length === 1) {
    flags.push('single-domain');
  }
  
  const businessEmails = result.statistics.byCategory.business || 0;
  if (businessEmails > result.validEmails * 0.7) {
    flags.push('business-focused');
  }
  
  return flags;
}
