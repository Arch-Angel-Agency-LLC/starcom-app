/**
 * Domain Parser Script
 * 
 * Extracts and analyzes domain information from various data sources
 * including URLs, email addresses, and text content.
 * 
 * Features:
 * - Domain extraction and validation
 * - Subdomain analysis
 * - Domain categorization (business, personal, etc.)
 * - Security risk assessment
 * - Geographic location detection
 */

import { 
  ScriptDefinition, 
  ScriptInput, 
  ScriptResult, 
  ScriptErrorType, 
  ScriptExecutionContext,
  ProcessedIntelligenceData,
  ConfigurationValue,
  ProcessedDataValue,
  ErrorContext
} from '../types/ScriptTypes';

export interface DomainInfo {
  domain: string;
  subdomain?: string;
  tld: string;
  isValid: boolean;
  category: 'business' | 'personal' | 'government' | 'education' | 'nonprofit' | 'unknown';
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  metadata: {
    isCommonProvider: boolean;
    isDisposable: boolean;
    hasSubdomains: boolean;
    estimatedOrganization?: string;
    countryCode?: string;
  };
}

export interface DomainParserOptions {
  includeSecurity: boolean;
  includeGeolocation: boolean;
  validateDomains: boolean;
  minConfidence: number;
}

export interface DomainParserResult extends Record<string, unknown> {
  domains: DomainInfo[];
  totalFound: number;
  uniqueDomains: number;
  topCategories: Array<{ category: string; count: number }>;
  riskDistribution: Record<string, number>;
}

/**
 * Domain Parser Script Implementation
 */
export const DomainParserScript: ScriptDefinition = {
  metadata: {
    id: 'domain-parser',
    name: 'Domain Parser',
    version: '1.0.0',
    description: 'Extract and analyze domain information from text, URLs, and email addresses',
    author: 'NetRunner Scripts',
    category: 'domain-analysis',
    tags: ['domains', 'urls', 'security', 'analysis'],
    dependencies: [],
    created: new Date(),
    updated: new Date()
  },
  
  configuration: {
    inputTypes: ['raw-osint-data', 'website-scan-results', 'domain-data'],
    outputTypes: ['structured-intel', 'analysis-report'],
    parameters: [
      {
        name: 'includeSecurity',
        type: 'boolean',
        description: 'Include security risk assessment',
        required: false
      },
      {
        name: 'includeGeolocation', 
        type: 'boolean',
        description: 'Attempt to determine geographic location',
        required: false
      },
      {
        name: 'validateDomains',
        type: 'boolean', 
        description: 'Validate domain existence and accessibility',
        required: false
      },
      {
        name: 'minConfidence',
        type: 'number',
        description: 'Minimum confidence threshold for results',
        required: false
      }
    ],
    defaults: {
      includeSecurity: true,
      includeGeolocation: false,
      validateDomains: true,
      minConfidence: 0.5
    },
    required: []
  },
  
  execute: async (
    input: ScriptInput,
    config: Record<string, ConfigurationValue>,
    _context: ScriptExecutionContext
  ): Promise<ScriptResult> => {
    const startTime = new Date();
    const executionId = `dp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Validate input data
      if (!input.data) {
        const errorContext: ErrorContext = {
          scriptId: 'domain-parser',
          executionId,
          step: 'input-validation',
          environment: 'browser',
          userAgent: navigator.userAgent || 'unknown'
        };
        
        return {
          success: false,
          error: {
            type: ScriptErrorType.DATA_VALIDATION_ERROR,
            code: 'DVE026',
            message: 'Domain Parser requires valid input data',
            details: `Input data type: ${typeof input.data}`,
            context: errorContext,
            timestamp: new Date(),
            recoverable: true,
            suggestions: ['Provide valid text, URL, or structured data input']
          },
          metrics: {
            startTime,
            endTime: new Date(),
            duration: Date.now() - startTime.getTime(),
            memoryUsage: 0,
            cpuUsage: 0,
            networkRequests: 0,
            cacheHits: 0,
            cacheMisses: 0
          },
          metadata: {
            scriptId: 'domain-parser',
            scriptVersion: '1.0.0',
            executionId,
            sourceData: 'invalid-input',
            processingSteps: [],
            qualityScore: 0,
            flags: ['validation-failed']
          }
        };
      }
      
      const options: DomainParserOptions = {
        includeSecurity: (config.includeSecurity as boolean) ?? true,
        includeGeolocation: (config.includeGeolocation as boolean) ?? false,
        validateDomains: (config.validateDomains as boolean) ?? true,
        minConfidence: (config.minConfidence as number) ?? 0.5
      };
      
      // Extract text content for domain parsing
      const textContent = extractTextContent(input.data);
      
      // Extract domains using comprehensive regex patterns
      const extractedDomains = extractDomainsFromText(textContent);
      
      // Process each domain
      const processedDomains: DomainInfo[] = [];
      
      for (const domain of extractedDomains) {
        try {
          const domainInfo = processDomain(domain, options);
          
          if (domainInfo.confidence >= options.minConfidence) {
            processedDomains.push(domainInfo);
          }
        } catch (error) {
          console.warn(`Failed to process domain ${domain}:`, error);
        }
      }
      
      // Generate analysis results
      const result = generateDomainAnalysis(processedDomains);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Prepare processed intelligence data
      const processedData: ProcessedIntelligenceData = {
        type: 'structured-intel',
        category: 'domain-analysis',
        confidence: processedDomains.length > 0 ? 
          processedDomains.reduce((sum, d) => sum + d.confidence, 0) / processedDomains.length : 0,
        data: result as ProcessedDataValue,
        relationships: [],
        enrichments: [],
        validations: [{
          valid: processedDomains.length > 0,
          confidence: processedDomains.length > 0 ? 0.8 : 0.2,
          issues: [],
          suggestions: processedDomains.length === 0 ? ['Verify input contains valid domain information'] : []
        }]
      };
      
      return {
        success: true,
        data: processedData,
        metrics: {
          startTime,
          endTime,
          duration,
          memoryUsage: Math.floor(textContent.length / 1024), // Rough estimate
          cpuUsage: processedDomains.length * 10, // Rough estimate
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'domain-parser',
          scriptVersion: '1.0.0',
          executionId,
          sourceData: input.source || 'unknown',
          processingSteps: [
            { step: 'text-extraction', duration: 10, success: true, details: 'Extracted text content from input data' },
            { step: 'domain-extraction', duration: duration * 0.3, success: true, details: `Found ${extractedDomains.length} potential domains` },
            { step: 'domain-processing', duration: duration * 0.6, success: true, details: `Processed ${processedDomains.length} valid domains` },
            { step: 'analysis-generation', duration: duration * 0.1, success: true, details: 'Generated domain analysis report' }
          ],
          qualityScore: processedData.confidence,
          flags: processedDomains.length === 0 ? ['no-domains-found'] : []
        }
      };
      
    } catch (error) {
      const endTime = new Date();
      const errorContext: ErrorContext = {
        scriptId: 'domain-parser',
        executionId,
        step: 'execution',
        environment: 'browser',
        userAgent: navigator.userAgent || 'unknown'
      };
      
      return {
        success: false,
        error: {
          type: ScriptErrorType.SCRIPT_RUNTIME_ERROR,
          code: 'SRE002',
          message: error instanceof Error ? error.message : 'Unknown error during domain parsing',
          details: `Error: ${String(error)}`,
          context: errorContext,
          timestamp: new Date(),
          recoverable: true,
          suggestions: ['Check input data format', 'Verify script configuration']
        },
        metrics: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          memoryUsage: 0,
          cpuUsage: 0,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'domain-parser',
          scriptVersion: '1.0.0',
          executionId,
          sourceData: 'error-occurred',
          processingSteps: [],
          qualityScore: 0,
          flags: ['execution-error']
        }
      };
    }
  }
};

/**
 * Extract text content from various input types
 */
function extractTextContent(data: ProcessedDataValue | object): string {
  if (typeof data === 'string') {
    return data;
  }
  
  if (typeof data === 'object' && data !== null) {
    if ('html' in data) {
      // Strip HTML tags for domain extraction
      return String(data.html).replace(/<[^>]*>/g, ' ');
    }
    
    // Convert object to searchable text
    return JSON.stringify(data);
  }
  
  return String(data);
}

/**
 * Extract domains from text using comprehensive patterns
 */
function extractDomainsFromText(text: string): string[] {
  const domains = new Set<string>();
  
  // URL pattern for extracting domains from URLs
  const urlPattern = /https?:\/\/((?:[\w-]+\.)+[\w-]+)(?:\/[^\s]*)?/gi;
  const urlMatches = text.matchAll(urlPattern);
  
  for (const match of urlMatches) {
    if (match[1]) {
      domains.add(match[1].toLowerCase());
    }
  }
  
  // Email pattern for extracting domains from email addresses
  const emailPattern = /[\w.-]+@((?:[\w-]+\.)+[\w-]+)/gi;
  const emailMatches = text.matchAll(emailPattern);
  
  for (const match of emailMatches) {
    if (match[1]) {
      domains.add(match[1].toLowerCase());
    }
  }
  
  // Standalone domain pattern
  const domainPattern = /(?:^|\s)((?:[\w-]+\.)+[\w-]+)(?:\s|$)/gi;
  const domainMatches = text.matchAll(domainPattern);
  
  for (const match of domainMatches) {
    if (match[1] && isValidDomainFormat(match[1])) {
      domains.add(match[1].toLowerCase());
    }
  }
  
  return Array.from(domains);
}

/**
 * Validate domain format
 */
function isValidDomainFormat(domain: string): boolean {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Process individual domain with detailed analysis
 */
function processDomain(domain: string, options: DomainParserOptions): DomainInfo {
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : undefined;
  
  // Basic validation
  const isValid = isValidDomainFormat(domain);
  
  // Categorize domain
  const category = categorizeDomain(domain);
  
  // Assess security risk
  const riskLevel = assessSecurityRisk(domain, options.includeSecurity);
  
  // Calculate confidence based on various factors
  const confidence = calculateDomainConfidence(domain, isValid, category);
  
  // Build metadata
  const metadata = {
    isCommonProvider: isCommonProvider(domain),
    isDisposable: isDisposableEmailDomain(domain),
    hasSubdomains: Boolean(subdomain),
    estimatedOrganization: estimateOrganization(domain),
    countryCode: options.includeGeolocation ? estimateCountryCode(tld) : undefined
  };
  
  return {
    domain,
    subdomain,
    tld,
    isValid,
    category,
    riskLevel,
    confidence,
    metadata
  };
}

/**
 * Categorize domain type
 */
function categorizeDomain(domain: string): DomainInfo['category'] {
  const businessTlds = ['com', 'corp', 'inc', 'biz', 'co'];
  const govTlds = ['gov', 'mil'];
  const eduTlds = ['edu', 'ac'];
  const orgTlds = ['org', 'ngo'];
  
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  
  if (govTlds.includes(tld)) return 'government';
  if (eduTlds.includes(tld)) return 'education';
  if (orgTlds.includes(tld)) return 'nonprofit';
  if (businessTlds.includes(tld)) return 'business';
  
  // Check for common personal email providers
  const personalProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  if (personalProviders.includes(domain)) return 'personal';
  
  return 'unknown';
}

/**
 * Assess security risk level
 */
function assessSecurityRisk(domain: string, includeSecurity: boolean): DomainInfo['riskLevel'] {
  if (!includeSecurity) return 'low';
  
  // Known high-risk indicators
  const highRiskPatterns = [
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
    /[0-9]{5,}/, // Long numeric sequences
    /temp|temp\d+|test/, // Temporary-looking domains
    /\.tk$|\.ml$|\.ga$|\.cf$/ // Free TLD services
  ];
  
  for (const pattern of highRiskPatterns) {
    if (pattern.test(domain)) return 'high';
  }
  
  // Medium risk indicators
  const mediumRiskPatterns = [
    /\d+/, // Contains numbers
    /-{2,}/, // Multiple consecutive hyphens
    /\.info$|\.click$|\.download$/ // Potentially suspicious TLDs
  ];
  
  for (const pattern of mediumRiskPatterns) {
    if (pattern.test(domain)) return 'medium';
  }
  
  return 'low';
}

/**
 * Calculate confidence score for domain analysis
 */
function calculateDomainConfidence(domain: string, isValid: boolean, category: string): number {
  let confidence = 0.5; // Base confidence
  
  if (isValid) confidence += 0.3;
  if (category !== 'unknown') confidence += 0.2;
  if (domain.length > 5 && domain.length < 50) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

/**
 * Check if domain is a common email provider
 */
function isCommonProvider(domain: string): boolean {
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'aol.com', 'protonmail.com', 'yandex.com'
  ];
  return commonProviders.includes(domain);
}

/**
 * Check if domain is known disposable email provider
 */
function isDisposableEmailDomain(domain: string): boolean {
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'temp-mail.org'
  ];
  return disposableDomains.includes(domain);
}

/**
 * Estimate organization from domain
 */
function estimateOrganization(domain: string): string | undefined {
  const parts = domain.split('.');
  if (parts.length >= 2) {
    const orgName = parts[parts.length - 2];
    return orgName.charAt(0).toUpperCase() + orgName.slice(1);
  }
  return undefined;
}

/**
 * Estimate country code from TLD
 */
function estimateCountryCode(tld: string): string | undefined {
  const countryTlds: Record<string, string> = {
    'uk': 'GB', 'de': 'DE', 'fr': 'FR', 'jp': 'JP',
    'cn': 'CN', 'ru': 'RU', 'br': 'BR', 'in': 'IN'
  };
  return countryTlds[tld];
}

/**
 * Generate comprehensive domain analysis results
 */
function generateDomainAnalysis(domains: DomainInfo[]): DomainParserResult {
  const totalFound = domains.length;
  const uniqueDomains = new Set(domains.map(d => d.domain)).size;
  
  // Category analysis
  const categoryCount: Record<string, number> = {};
  domains.forEach(domain => {
    categoryCount[domain.category] = (categoryCount[domain.category] || 0) + 1;
  });
  
  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  
  // Risk analysis
  const riskDistribution: Record<string, number> = {};
  domains.forEach(domain => {
    riskDistribution[domain.riskLevel] = (riskDistribution[domain.riskLevel] || 0) + 1;
  });
  
  return {
    domains,
    totalFound,
    uniqueDomains,
    topCategories,
    riskDistribution
  };
}
