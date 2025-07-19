/**
 * Results Categorization Engine
 * 
 * Intelligent categorization and organization of script execution results
 * Provides structured result analysis, inspection capabilities, and data export
 * 
 * @author GitHub Copilot
 * @date July 17, 2025
 */

import { ScriptResult } from '../types/ScriptTypes';

/**
 * Result Categories for intelligent organization
 */
export enum ResultCategory {
  CONTACTS = 'contacts',
  INFRASTRUCTURE = 'infrastructure', 
  TECHNOLOGY = 'technology',
  BUSINESS_INTEL = 'business-intelligence',
  SECURITY = 'security',
  ERRORS = 'errors',
  UNKNOWN = 'unknown'
}

/**
 * Categorized result with enhanced metadata
 */
export interface CategorizedResult {
  id: string;
  scriptId: string;
  category: ResultCategory;
  subcategory: string;
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  itemCount: number;
  timestamp: Date;
  data: Record<string, unknown> | null;
  metadata: {
    executionTime: number;
    dataQuality: number;
    sources: string[];
    [key: string]: unknown;
  };
}

/**
 * Result filtering options
 */
export interface ResultFilter {
  category?: ResultCategory;
  subcategory?: string;
  minConfidence?: number;
  maxAge?: number; // in hours
  priority?: 'low' | 'medium' | 'high';
  scriptId?: string;
}

/**
 * Result inspection data for detailed analysis
 */
export interface ResultInspectionData {
  overview: {
    title: string;
    description: string;
    confidence: number;
    itemCount: number;
    category: ResultCategory;
    subcategory: string;
    timestamp: Date;
  };
  details: Array<{
    label: string;
    value: unknown;
    type: 'text' | 'number' | 'list' | 'object';
    confidence?: number;
  }>;
  metrics: {
    executionTime: number;
    dataQuality: number;
    memoryUsage?: number;
    sources: string[];
  };
  actions: Array<{
    type: 'export' | 'correlate' | 'enhance' | 'validate';
    label: string;
    description: string;
    enabled: boolean;
  }>;
  relationships: Array<{
    type: 'related' | 'derived' | 'conflicting';
    target: string;
    confidence: number;
  }>;
}

/**
 * Results Categorization Engine
 * 
 * Provides intelligent categorization, filtering, sorting, and inspection
 * of script execution results for enhanced user experience
 */
export class ResultsCategorizationEngine {
  private readonly categoryRules: Map<string, ResultCategory>;
  private readonly subcategoryRules: Map<string, string>;
  private readonly priorityWeights: Map<string, number>;

  constructor() {
    this.categoryRules = new Map([
      // Contact Information Rules
      ['email-extraction', ResultCategory.CONTACTS],
      ['contact-harvester', ResultCategory.CONTACTS],
      ['social-media', ResultCategory.CONTACTS],
      ['phone-numbers', ResultCategory.CONTACTS],
      
      // Infrastructure Rules
      ['domain-analysis', ResultCategory.INFRASTRUCTURE],
      ['domain-parser', ResultCategory.INFRASTRUCTURE],
      ['subdomain-enumeration', ResultCategory.INFRASTRUCTURE],
      ['dns-analysis', ResultCategory.INFRASTRUCTURE],
      ['network-mapping', ResultCategory.INFRASTRUCTURE],
      
      // Technology Rules
      ['technology-stack', ResultCategory.TECHNOLOGY],
      ['tech-stack-analyzer', ResultCategory.TECHNOLOGY],
      ['framework-detection', ResultCategory.TECHNOLOGY],
      ['library-analysis', ResultCategory.TECHNOLOGY],
      ['version-detection', ResultCategory.TECHNOLOGY],
      
      // Business Intelligence Rules
      ['company-information', ResultCategory.BUSINESS_INTEL],
      ['business-analysis', ResultCategory.BUSINESS_INTEL],
      ['market-research', ResultCategory.BUSINESS_INTEL],
      ['competitor-analysis', ResultCategory.BUSINESS_INTEL],
      
      // Security Rules
      ['vulnerability-scan', ResultCategory.SECURITY],
      ['security-headers', ResultCategory.SECURITY],
      ['ssl-analysis', ResultCategory.SECURITY],
      ['port-scan', ResultCategory.SECURITY]
    ]);

    this.subcategoryRules = new Map([
      // Contact subcategories
      ['email-extraction', 'email-addresses'],
      ['contact-harvester', 'contact-information'],
      ['social-media', 'social-profiles'],
      
      // Infrastructure subcategories
      ['domain-analysis', 'domains'],
      ['domain-parser', 'domains'],
      ['subdomain-enumeration', 'subdomains'],
      ['dns-analysis', 'dns-records'],
      
      // Technology subcategories
      ['technology-stack', 'frameworks-libraries'],
      ['tech-stack-analyzer', 'frameworks-libraries'],
      ['framework-detection', 'frameworks'],
      ['library-analysis', 'libraries'],
      
      // Error subcategories
      ['validation-error', 'validation-errors'],
      ['execution-error', 'execution-errors'],
      ['network-error', 'network-errors']
    ]);

    this.priorityWeights = new Map([
      ['confidence', 0.4],
      ['itemCount', 0.3],
      ['dataQuality', 0.2],
      ['category', 0.1]
    ]);
  }

  /**
   * Categorize a script result into structured categories
   */
  public categorizeResult(result: ScriptResult): CategorizedResult {
    const id = this.generateResultId(result);
    const category = this.determineCategory(result);
    const subcategory = this.determineSubcategory(result, category);
    const confidence = this.extractConfidence(result);
    const itemCount = this.countResultItems(result);
    const priority = this.calculatePriority({
      confidence,
      itemCount,
      category
    } as CategorizedResult);

    const categorizedResult: CategorizedResult = {
      id,
      scriptId: result.metadata.scriptId,
      category,
      subcategory,
      title: this.generateTitle(result, category, subcategory),
      description: this.generateDescription(result, category),
      confidence,
      priority,
      itemCount,
      timestamp: new Date(),
      data: result.success && result.data?.data && typeof result.data.data === 'object' 
        ? result.data.data as Record<string, unknown> 
        : null,
      metadata: {
        executionTime: result.metrics.duration,
        dataQuality: result.metadata.qualityScore,
        sources: this.extractSources(result),
        scriptVersion: result.metadata.scriptVersion,
        executionId: result.metadata.executionId
      }
    };

    return categorizedResult;
  }

  /**
   * Calculate priority based on multiple factors
   */
  public calculatePriority(result: Pick<CategorizedResult, 'confidence' | 'itemCount' | 'category'>): 'low' | 'medium' | 'high' {
    // High priority criteria
    if (result.confidence >= 0.85 && result.itemCount >= 10) {
      return 'high';
    }
    
    if (result.confidence >= 0.9 && result.itemCount >= 5) {
      return 'high';
    }

    // Medium priority criteria
    if (result.confidence >= 0.7 && result.itemCount >= 3) {
      return 'medium';
    }

    if (result.confidence >= 0.8) {
      return 'medium';
    }

    // Category-based priority boost
    if (result.category === ResultCategory.CONTACTS && result.confidence >= 0.6) {
      return 'medium';
    }

    if (result.category === ResultCategory.SECURITY && result.confidence >= 0.5) {
      return 'high';
    }

    // Default to low priority
    return 'low';
  }

  /**
   * Generate detailed inspection data for a result
   */
  public generateInspectionData(result: CategorizedResult): ResultInspectionData {
    return {
      overview: {
        title: result.title,
        description: result.description,
        confidence: result.confidence,
        itemCount: result.itemCount,
        category: result.category,
        subcategory: result.subcategory,
        timestamp: result.timestamp
      },
      details: this.generateDetailBreakdown(result),
      metrics: {
        executionTime: result.metadata.executionTime,
        dataQuality: result.metadata.dataQuality,
        sources: result.metadata.sources
      },
      actions: this.generateAvailableActions(result),
      relationships: this.findRelatedResults(result)
    };
  }

  /**
   * Filter results based on criteria
   */
  public filterResults(results: CategorizedResult[], filter: ResultFilter): CategorizedResult[] {
    return results.filter(result => {
      // Category filter
      if (filter.category && result.category !== filter.category) {
        return false;
      }

      // Subcategory filter
      if (filter.subcategory && result.subcategory !== filter.subcategory) {
        return false;
      }

      // Confidence filter
      if (filter.minConfidence && result.confidence < filter.minConfidence) {
        return false;
      }

      // Age filter
      if (filter.maxAge) {
        const ageHours = (Date.now() - result.timestamp.getTime()) / (1000 * 60 * 60);
        if (ageHours > filter.maxAge) {
          return false;
        }
      }

      // Priority filter
      if (filter.priority && result.priority !== filter.priority) {
        return false;
      }

      // Script ID filter
      if (filter.scriptId && result.scriptId !== filter.scriptId) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort results by priority and confidence
   */
  public sortResults(results: CategorizedResult[]): CategorizedResult[] {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    
    return results.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Then by confidence
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) {
        return confidenceDiff;
      }

      // Finally by item count
      return b.itemCount - a.itemCount;
    });
  }

  // Private helper methods

  private generateResultId(result: ScriptResult): string {
    const timestamp = Date.now().toString(36);
    const scriptId = result.metadata.scriptId.substring(0, 3);
    const executionId = result.metadata.executionId.substring(0, 8);
    return `${scriptId}-${timestamp}-${executionId}`;
  }

  private determineCategory(result: ScriptResult): ResultCategory {
    if (!result.success) {
      return ResultCategory.ERRORS;
    }

    const scriptId = result.metadata.scriptId;
    const dataCategory = result.data?.category || '';
    
    // Check script ID first
    for (const [pattern, category] of this.categoryRules) {
      if (scriptId.includes(pattern) || dataCategory.includes(pattern)) {
        return category;
      }
    }

    return ResultCategory.UNKNOWN;
  }

  private determineSubcategory(result: ScriptResult, category: ResultCategory): string {
    if (category === ResultCategory.ERRORS) {
      const errorType = result.error?.type;
      if (errorType?.includes('VALIDATION')) {
        return 'validation-errors';
      }
      if (errorType?.includes('NETWORK')) {
        return 'network-errors';
      }
      return 'execution-errors';
    }

    const scriptId = result.metadata.scriptId;
    const dataCategory = result.data?.category || '';

    for (const [pattern, subcategory] of this.subcategoryRules) {
      if (scriptId.includes(pattern) || dataCategory.includes(pattern)) {
        return subcategory;
      }
    }

    return 'general';
  }

  private extractConfidence(result: ScriptResult): number {
    if (!result.success) {
      return 0;
    }
    return result.data?.confidence || result.metadata.qualityScore || 0.5;
  }

  private countResultItems(result: ScriptResult): number {
    if (!result.success || !result.data?.data) {
      return 0;
    }

    const data = result.data.data;
    
    // Try different common data structures
    if (Array.isArray(data)) {
      return data.length;
    }

    // Type guard for object data
    if (typeof data === 'object' && data !== null) {
      const objData = data as Record<string, unknown>;
      
      if (objData.emails && Array.isArray(objData.emails)) {
        return objData.emails.length;
      }

      if (objData.domains && Array.isArray(objData.domains)) {
        return objData.domains.length;
      }

      if (objData.technologies && Array.isArray(objData.technologies)) {
        return objData.technologies.length;
      }

      if (objData.contacts && Array.isArray(objData.contacts)) {
        return objData.contacts.length;
      }

      if (objData.totalFound && typeof objData.totalFound === 'number') {
        return objData.totalFound;
      }
    }

    return 1; // Default for single result
  }

  private generateTitle(result: ScriptResult, category: ResultCategory, _subcategory: string): string {
    const itemCount = this.countResultItems(result);
    
    if (!result.success) {
      return `Script Execution Error - ${result.metadata.scriptId}`;
    }

    const categoryTitles: Record<ResultCategory, string> = {
      [ResultCategory.CONTACTS]: `${itemCount} Contact${itemCount !== 1 ? 's' : ''} Found`,
      [ResultCategory.INFRASTRUCTURE]: `${itemCount} Infrastructure Item${itemCount !== 1 ? 's' : ''} Discovered`,
      [ResultCategory.TECHNOLOGY]: `${itemCount} Technolog${itemCount !== 1 ? 'ies' : 'y'} Detected`,
      [ResultCategory.BUSINESS_INTEL]: `Business Intelligence Gathered`,
      [ResultCategory.SECURITY]: `Security Analysis Complete`,
      [ResultCategory.ERRORS]: `Execution Error`,
      [ResultCategory.UNKNOWN]: `Analysis Results`
    };

    return categoryTitles[category] || 'Script Results';
  }

  private generateDescription(result: ScriptResult, category: ResultCategory): string {
    if (!result.success) {
      return `Script execution failed: ${result.error?.message || 'Unknown error'}`;
    }

    const descriptions: Record<ResultCategory, string> = {
      [ResultCategory.CONTACTS]: 'Contact information extracted from scan data',
      [ResultCategory.INFRASTRUCTURE]: 'Infrastructure and domain information discovered',
      [ResultCategory.TECHNOLOGY]: 'Technology stack and framework analysis',
      [ResultCategory.BUSINESS_INTEL]: 'Business intelligence and company information',
      [ResultCategory.SECURITY]: 'Security assessment and vulnerability analysis',
      [ResultCategory.ERRORS]: 'Script execution encountered errors',
      [ResultCategory.UNKNOWN]: 'Analysis results from script execution'
    };

    return descriptions[category] || 'Script execution results';
  }

  private extractSources(result: ScriptResult): string[] {
    const sources: string[] = [];
    
    if (result.metadata.sourceData) {
      sources.push(result.metadata.sourceData);
    }

    // Extract sources from processing steps  
    if (result.metadata.processingSteps) {
      result.metadata.processingSteps.forEach(step => {
        // Processing steps have step name and duration, use step name as source indicator
        if (step.step && typeof step.step === 'string') {
          sources.push(`step-${step.step}`);
        }
      });
    }

    return sources.length > 0 ? sources : ['scan-data'];
  }

  private generateDetailBreakdown(result: CategorizedResult): Array<{
    label: string;
    value: unknown;
    type: 'text' | 'number' | 'list' | 'object';
    confidence?: number;
  }> {
    const details: Array<{
      label: string;
      value: unknown;
      type: 'text' | 'number' | 'list' | 'object';
      confidence?: number;
    }> = [];

    if (result.data) {
      Object.entries(result.data).forEach(([key, value]) => {
        const type = Array.isArray(value) ? 'list' : 
                    typeof value === 'object' ? 'object' :
                    typeof value === 'number' ? 'number' : 'text';
        
        details.push({
          label: this.formatLabel(key),
          value,
          type,
          confidence: result.confidence
        });
      });
    }

    return details;
  }

  private generateAvailableActions(result: CategorizedResult): Array<{
    type: 'export' | 'correlate' | 'enhance' | 'validate';
    label: string;
    description: string;
    enabled: boolean;
  }> {
    const actions = [];

    // Export action (always available)
    actions.push({
      type: 'export' as const,
      label: 'Export Results',
      description: 'Export this result data to JSON or CSV format',
      enabled: true
    });

    // Category-specific actions
    if (result.category === ResultCategory.CONTACTS) {
      actions.push({
        type: 'enhance' as const,
        label: 'Enhance Contact Data',
        description: 'Enrich contact information with additional sources',
        enabled: result.itemCount > 0
      });
    }

    if (result.category === ResultCategory.TECHNOLOGY) {
      actions.push({
        type: 'correlate' as const,
        label: 'Find Related Technologies',
        description: 'Search for related or dependent technologies',
        enabled: result.itemCount > 0
      });
    }

    if (result.category === ResultCategory.INFRASTRUCTURE) {
      actions.push({
        type: 'validate' as const,
        label: 'Validate Infrastructure',
        description: 'Verify domain and infrastructure information',
        enabled: result.itemCount > 0
      });
    }

    return actions;
  }

  private findRelatedResults(_result: CategorizedResult): Array<{
    type: 'related' | 'derived' | 'conflicting';
    target: string;
    confidence: number;
  }> {
    // Implement basic result correlation logic
    const correlations: Array<{
      type: 'related' | 'derived' | 'conflicting';
      target: string;
      confidence: number;
    }> = [];

    // Find domain correlations (e.g., emails from same domain)
    if (_result.category === ResultCategory.CONTACTS && _result.data && Array.isArray(_result.data.emails)) {
      const emailDomains = _result.data.emails
        .map((email: string) => email.split('@')[1])
        .filter(Boolean);
      
      emailDomains.forEach(domain => {
        correlations.push({
          type: 'related',
          target: `domain:${domain}`,
          confidence: 0.8
        });
      });
    }

    // Find technology stack correlations
    if (_result.category === ResultCategory.TECHNOLOGY && _result.data && _result.data.technologies) {
      const techs = Object.keys(_result.data.technologies);
      techs.forEach(tech => {
        correlations.push({
          type: 'related',
          target: `tech:${tech}`,
          confidence: 0.7
        });
      });
    }

    return correlations;
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }
}
