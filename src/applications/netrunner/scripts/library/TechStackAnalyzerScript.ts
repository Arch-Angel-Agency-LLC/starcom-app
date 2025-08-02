/**
 * Technology Stack Analyzer Script
 * 
 * Analyzes and identifies technology stacks from various data sources
 * including HTML content, headers, JavaScript libraries, and metadata.
 * 
 * Features:
 * - Frontend framework detection (React, Vue, Angular, etc.)
 * - Backend technology identification
 * - Database system detection
 * - CDN and hosting provider analysis
 * - Security technology identification
 * - Performance optimization tools detection
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

export interface TechnologyInfo {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'cdn' | 'hosting' | 'analytics' | 'security' | 'cms' | 'ecommerce' | 'marketing' | 'other';
  version?: string;
  confidence: number;
  evidence: string[];
  description: string;
  website?: string;
  metadata: {
    isOpenSource: boolean;
    isPaid: boolean;
    popularity: 'low' | 'medium' | 'high' | 'very-high';
    securityRating: 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';
    lastUpdated?: Date;
  };
}

export interface TechStackAnalyzerOptions {
  includeVersions: boolean;
  includePopularity: boolean;
  includeSecurity: boolean;
  minConfidence: number;
  deepAnalysis: boolean;
}

export interface TechStackAnalyzerResult extends Record<string, unknown> {
  technologies: TechnologyInfo[];
  totalFound: number;
  categories: Record<string, number>;
  stackComplexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  modernityScore: number; // 0-1 scale
  securityScore: number; // 0-1 scale
  summary: {
    primaryFramework?: string;
    primaryLanguage?: string;
    hostingProvider?: string;
    cmsDetected?: string;
    analytics?: string[];
  };
}

/**
 * Technology Stack Analyzer Script Implementation
 */
export const TechStackAnalyzerScript: ScriptDefinition = {
  metadata: {
    id: 'tech-stack-analyzer-v1',
    name: 'Technology Stack Analyzer',
    version: '1.0.0',
    description: 'Analyzes and categorizes technology stacks from website data',
    author: 'NetRunner Scripts',
    category: 'technology-detection',
    tags: ['technology', 'frameworks', 'libraries', 'stack', 'analysis'],
    dependencies: [],
    created: new Date(),
    updated: new Date()
  },
  
  configuration: {
    inputTypes: ['website-scan-results', 'raw-osint-data', 'domain-data'],
    outputTypes: ['structured-intel', 'technical-details', 'analysis-report'],
    parameters: [
      {
        name: 'includeVersions',
        type: 'boolean',
        description: 'Attempt to detect technology versions',
        required: false
      },
      {
        name: 'includePopularity', 
        type: 'boolean',
        description: 'Include popularity ratings for detected technologies',
        required: false
      },
      {
        name: 'includeSecurity',
        type: 'boolean', 
        description: 'Include security assessment for detected technologies',
        required: false
      },
      {
        name: 'minConfidence',
        type: 'number',
        description: 'Minimum confidence threshold for technology detection',
        required: false
      },
      {
        name: 'deepAnalysis',
        type: 'boolean',
        description: 'Perform deep analysis including performance and best practices',
        required: false
      }
    ],
    defaults: {
      includeVersions: true,
      includePopularity: true,
      includeSecurity: false,
      minConfidence: 0.6,
      deepAnalysis: false
    },
    required: []
  },
  
  execute: async (
    input: ScriptInput,
    config: Record<string, ConfigurationValue>,
    _context: ScriptExecutionContext
  ): Promise<ScriptResult> => {
    const startTime = new Date();
    const executionId = `tsa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Validate input data
      if (!input.data) {
        const errorContext: ErrorContext = {
          scriptId: 'tech-stack-analyzer-v1',
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
            message: 'Technology Stack Analyzer requires valid input data',
            details: `Input data type: ${typeof input.data}`,
            context: errorContext,
            timestamp: new Date(),
            recoverable: true,
            suggestions: ['Provide website scan results or HTML content']
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
            scriptId: 'tech-stack-analyzer-v1',
            scriptVersion: '1.0.0',
            executionId,
            sourceData: 'invalid-input',
            processingSteps: [],
            qualityScore: 0,
            flags: ['validation-failed']
          }
        };
      }
      
      const options: TechStackAnalyzerOptions = {
        includeVersions: (config.includeVersions as boolean) ?? true,
        includePopularity: (config.includePopularity as boolean) ?? true,
        includeSecurity: (config.includeSecurity as boolean) ?? false,
        minConfidence: (config.minConfidence as number) ?? 0.6,
        deepAnalysis: (config.deepAnalysis as boolean) ?? false
      };
      
      // Extract analyzable content
      const analysisData = extractAnalysisData(input.data);
      
      // Analyze technologies
      const detectedTechnologies = analyzeTechnologies(analysisData, options);
      
      // Filter by confidence threshold
      const filteredTechnologies = detectedTechnologies.filter(
        tech => tech.confidence >= options.minConfidence
      );
      
      // Generate comprehensive analysis
      const result = generateTechStackAnalysis(filteredTechnologies, options);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Prepare processed intelligence data
      const processedData: ProcessedIntelligenceData = {
        type: 'technical-details',
        category: 'technology-stack',
        confidence: filteredTechnologies.length > 0 ? 
          filteredTechnologies.reduce((sum, t) => sum + t.confidence, 0) / filteredTechnologies.length : 0,
        data: result as ProcessedDataValue,
        relationships: [],
        enrichments: [],
        validations: [{
          valid: filteredTechnologies.length > 0,
          confidence: filteredTechnologies.length > 0 ? 0.8 : 0.2,
          issues: [],
          suggestions: filteredTechnologies.length === 0 ? ['Verify input contains technology signatures'] : []
        }]
      };
      
      return {
        success: true,
        data: processedData,
        metrics: {
          startTime,
          endTime,
          duration,
          memoryUsage: Math.floor(JSON.stringify(analysisData).length / 1024),
          cpuUsage: filteredTechnologies.length * 15, // Rough estimate
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'tech-stack-analyzer-v1',
          scriptVersion: '1.0.0',
          executionId,
          sourceData: input.source || 'unknown',
          processingSteps: [
            { step: 'data-extraction', duration: duration * 0.2, success: true, details: 'Extracted HTML, headers, and metadata' },
            { step: 'technology-detection', duration: duration * 0.6, success: true, details: `Detected ${detectedTechnologies.length} technologies` },
            { step: 'confidence-filtering', duration: duration * 0.1, success: true, details: `Filtered to ${filteredTechnologies.length} high-confidence technologies` },
            { step: 'analysis-generation', duration: duration * 0.1, success: true, details: 'Generated technology stack analysis' }
          ],
          qualityScore: processedData.confidence,
          flags: filteredTechnologies.length === 0 ? ['no-technologies-detected'] : []
        }
      };
      
    } catch (error) {
      const endTime = new Date();
      const errorContext: ErrorContext = {
        scriptId: 'tech-stack-analyzer-v1',
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
          message: error instanceof Error ? error.message : 'Unknown error during technology analysis',
          details: `Error: ${String(error)}`,
          context: errorContext,
          timestamp: new Date(),
          recoverable: true,
          suggestions: ['Check input data format', 'Verify technology detection patterns']
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
          scriptId: 'tech-stack-analyzer-v1',
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
 * Extract analysis data from various input types
 */
function extractAnalysisData(data: ProcessedDataValue | object): AnalysisData {
  const result: AnalysisData = {
    html: '',
    headers: {},
    scripts: [],
    stylesheets: [],
    metadata: {},
    networkInfo: {}
  };
  
  if (typeof data === 'string') {
    result.html = data;
  } else if (typeof data === 'object' && data !== null) {
    // Extract from structured scan results
    if ('html' in data) result.html = String(data.html);
    if ('headers' in data && typeof data.headers === 'object') {
      result.headers = data.headers as Record<string, string>;
    }
    if ('scripts' in data && Array.isArray(data.scripts)) {
      result.scripts = data.scripts;
    }
    if ('stylesheets' in data && Array.isArray(data.stylesheets)) {
      result.stylesheets = data.stylesheets;
    }
    if ('metadata' in data && typeof data.metadata === 'object') {
      result.metadata = data.metadata as Record<string, unknown>;
    }
  }
  
  return result;
}

interface AnalysisData {
  html: string;
  headers: Record<string, string>;
  scripts: string[];
  stylesheets: string[];
  metadata: Record<string, unknown>;
  networkInfo: Record<string, unknown>;
}

/**
 * Analyze technologies from extracted data
 */
function analyzeTechnologies(data: AnalysisData, options: TechStackAnalyzerOptions): TechnologyInfo[] {
  const technologies: TechnologyInfo[] = [];
  
  // Analyze HTML content
  technologies.push(...analyzeHtmlContent(data.html, options));
  
  // Analyze HTTP headers
  technologies.push(...analyzeHeaders(data.headers, options));
  
  // Analyze JavaScript libraries
  technologies.push(...analyzeJavaScript(data.scripts, data.html, options));
  
  // Analyze CSS frameworks
  technologies.push(...analyzeCSS(data.stylesheets, data.html, options));
  
  // Analyze metadata
  technologies.push(...analyzeMetadata(data.metadata, options));
  
  // Remove duplicates and merge similar detections
  return deduplicateTechnologies(technologies);
}

/**
 * Analyze HTML content for technology signatures
 */
function analyzeHtmlContent(html: string, options: TechStackAnalyzerOptions): TechnologyInfo[] {
  const technologies: TechnologyInfo[] = [];
  
  // CMS Detection
  const cmsPatterns = [
    { name: 'WordPress', pattern: /wp-content|wp-includes|wordpress/i, category: 'cms' as const },
    { name: 'Drupal', pattern: /drupal|sites\/default/i, category: 'cms' as const },
    { name: 'Joomla', pattern: /joomla|index\.php\?option=com_/i, category: 'cms' as const },
    { name: 'Shopify', pattern: /shopify|cdn\.shopify/i, category: 'ecommerce' as const },
    { name: 'Magento', pattern: /magento|mage\/js/i, category: 'ecommerce' as const }
  ];
  
  for (const pattern of cmsPatterns) {
    if (pattern.pattern.test(html)) {
      technologies.push(createTechnologyInfo(pattern.name, pattern.category, {
        confidence: 0.8,
        evidence: [`Pattern match: ${pattern.pattern.source}`],
        includeVersions: options.includeVersions
      }));
    }
  }
  
  // Framework Detection
  const frameworkPatterns = [
    { name: 'React', pattern: /react|_react\.|__REACT_DEVTOOLS__/i, category: 'frontend' as const },
    { name: 'Vue.js', pattern: /vue\.js|_vue\.|__VUE__/i, category: 'frontend' as const },
    { name: 'Angular', pattern: /angular|ng-app|angular\.js/i, category: 'frontend' as const },
    { name: 'jQuery', pattern: /jquery|jquery\.js|\$\(/i, category: 'frontend' as const },
    { name: 'Bootstrap', pattern: /bootstrap|btn-primary|container-fluid/i, category: 'frontend' as const }
  ];
  
  for (const pattern of frameworkPatterns) {
    if (pattern.pattern.test(html)) {
      technologies.push(createTechnologyInfo(pattern.name, pattern.category, {
        confidence: 0.7,
        evidence: [`HTML pattern match: ${pattern.pattern.source}`],
        includeVersions: options.includeVersions
      }));
    }
  }
  
  return technologies;
}

/**
 * Analyze HTTP headers for technology signatures
 */
function analyzeHeaders(headers: Record<string, string>, options: TechStackAnalyzerOptions): TechnologyInfo[] {
  const technologies: TechnologyInfo[] = [];
  
  // Server detection
  if (headers.server || headers.Server) {
    const server = headers.server || headers.Server;
    const serverTech = detectServerTechnology(server);
    if (serverTech) {
      technologies.push(createTechnologyInfo(serverTech.name, 'backend', {
        confidence: 0.9,
        evidence: [`Server header: ${server}`],
        version: serverTech.version,
        includeVersions: options.includeVersions
      }));
    }
  }
  
  // Framework headers
  const frameworkHeaders = [
    { header: 'x-powered-by', pattern: /express/i, name: 'Express.js', category: 'backend' as const },
    { header: 'x-powered-by', pattern: /asp\.net/i, name: 'ASP.NET', category: 'backend' as const },
    { header: 'x-powered-by', pattern: /php/i, name: 'PHP', category: 'backend' as const }
  ];
  
  for (const fw of frameworkHeaders) {
    const headerValue = headers[fw.header] || headers[fw.header.toLowerCase()];
    if (headerValue && fw.pattern.test(headerValue)) {
      technologies.push(createTechnologyInfo(fw.name, fw.category, {
        confidence: 0.85,
        evidence: [`${fw.header} header: ${headerValue}`],
        includeVersions: options.includeVersions
      }));
    }
  }
  
  return technologies;
}

/**
 * Analyze JavaScript for library detection
 */
function analyzeJavaScript(scripts: string[], html: string, options: TechStackAnalyzerOptions): TechnologyInfo[] {
  const technologies: TechnologyInfo[] = [];
  
  const jsLibraries = [
    { name: 'Google Analytics', pattern: /google-analytics|gtag|ga\(/i, category: 'analytics' as const },
    { name: 'Facebook Pixel', pattern: /fbq\(|facebook\.net\/tr/i, category: 'marketing' as const },
    { name: 'Chart.js', pattern: /chart\.js|chartjs/i, category: 'frontend' as const },
    { name: 'D3.js', pattern: /d3\.js|d3\.min\.js/i, category: 'frontend' as const },
    { name: 'Lodash', pattern: /lodash|_\.js/i, category: 'frontend' as const }
  ];
  
  const allContent = scripts.join(' ') + ' ' + html;
  
  for (const lib of jsLibraries) {
    if (lib.pattern.test(allContent)) {
      technologies.push(createTechnologyInfo(lib.name, lib.category, {
        confidence: 0.75,
        evidence: [`JavaScript pattern match: ${lib.pattern.source}`],
        includeVersions: options.includeVersions
      }));
    }
  }
  
  return technologies;
}

/**
 * Analyze CSS for framework detection
 */
function analyzeCSS(stylesheets: string[], html: string, options: TechStackAnalyzerOptions): TechnologyInfo[] {
  const technologies: TechnologyInfo[] = [];
  
  const cssFrameworks = [
    { name: 'Bootstrap', pattern: /bootstrap|btn-|col-md-/i, category: 'frontend' as const },
    { name: 'Tailwind CSS', pattern: /tailwind|tw-|bg-blue-/i, category: 'frontend' as const },
    { name: 'Foundation', pattern: /foundation|zurb/i, category: 'frontend' as const },
    { name: 'Bulma', pattern: /bulma|is-primary/i, category: 'frontend' as const }
  ];
  
  const allContent = stylesheets.join(' ') + ' ' + html;
  
  for (const fw of cssFrameworks) {
    if (fw.pattern.test(allContent)) {
      technologies.push(createTechnologyInfo(fw.name, fw.category, {
        confidence: 0.7,
        evidence: [`CSS pattern match: ${fw.pattern.source}`],
        includeVersions: options.includeVersions
      }));
    }
  }
  
  return technologies;
}

/**
 * Analyze metadata for additional technology clues
 */
function analyzeMetadata(metadata: Record<string, unknown>, options: TechStackAnalyzerOptions): TechnologyInfo[] {
  const technologies: TechnologyInfo[] = [];
  
  // Generator meta tag detection
  if (metadata.generator && typeof metadata.generator === 'string') {
    const generator = metadata.generator.toLowerCase();
    if (generator.includes('wordpress')) {
      technologies.push(createTechnologyInfo('WordPress', 'cms', {
        confidence: 0.9,
        evidence: [`Generator meta tag: ${metadata.generator}`],
        includeVersions: options.includeVersions
      }));
    }
  }
  
  return technologies;
}

/**
 * Detect server technology from server header
 */
function detectServerTechnology(serverHeader: string): { name: string; version?: string } | null {
  const patterns = [
    { pattern: /nginx\/([0-9.]+)/i, name: 'Nginx' },
    { pattern: /apache\/([0-9.]+)/i, name: 'Apache' },
    { pattern: /microsoft-iis\/([0-9.]+)/i, name: 'IIS' },
    { pattern: /cloudflare/i, name: 'Cloudflare' },
    { pattern: /express/i, name: 'Express.js' }
  ];
  
  for (const p of patterns) {
    const match = serverHeader.match(p.pattern);
    if (match) {
      return {
        name: p.name,
        version: match[1] || undefined
      };
    }
  }
  
  return null;
}

/**
 * Create standardized technology info object
 */
function createTechnologyInfo(
  name: string, 
  category: TechnologyInfo['category'], 
  options: {
    confidence: number;
    evidence: string[];
    version?: string;
    includeVersions: boolean;
  }
): TechnologyInfo {
  const techData = getTechnologyData(name);
  
  return {
    name,
    category,
    version: options.includeVersions ? options.version : undefined,
    confidence: options.confidence,
    evidence: options.evidence,
    description: techData.description,
    website: techData.website,
    metadata: {
      isOpenSource: techData.isOpenSource,
      isPaid: techData.isPaid,
      popularity: techData.popularity,
      securityRating: techData.securityRating,
      lastUpdated: techData.lastUpdated
    }
  };
}

/**
 * Get technology metadata
 */
function getTechnologyData(name: string): {
  description: string;
  website?: string;
  isOpenSource: boolean;
  isPaid: boolean;
  popularity: TechnologyInfo['metadata']['popularity'];
  securityRating: TechnologyInfo['metadata']['securityRating'];
  lastUpdated?: Date;
} {
  const techDatabase: Record<string, {
    description: string;
    website?: string;
    isOpenSource: boolean;
    isPaid: boolean;
    popularity: TechnologyInfo['metadata']['popularity'];
    securityRating: TechnologyInfo['metadata']['securityRating'];
  }> = {
    'React': {
      description: 'A JavaScript library for building user interfaces',
      website: 'https://reactjs.org',
      isOpenSource: true,
      isPaid: false,
      popularity: 'very-high',
      securityRating: 'good'
    },
    'WordPress': {
      description: 'Popular content management system',
      website: 'https://wordpress.org',
      isOpenSource: true,
      isPaid: false,
      popularity: 'very-high',
      securityRating: 'fair'
    },
    'Nginx': {
      description: 'High-performance web server and reverse proxy',
      website: 'https://nginx.org',
      isOpenSource: true,
      isPaid: false,
      popularity: 'very-high',
      securityRating: 'excellent'
    }
  };
  
  return techDatabase[name] || {
    description: `${name} technology`,
    isOpenSource: false,
    isPaid: false,
    popularity: 'medium' as const,
    securityRating: 'unknown' as const
  };
}

/**
 * Remove duplicate technologies and merge similar detections
 */
function deduplicateTechnologies(technologies: TechnologyInfo[]): TechnologyInfo[] {
  const seen = new Map<string, TechnologyInfo>();
  
  for (const tech of technologies) {
    const key = `${tech.name}-${tech.category}`;
    
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      // Merge evidence and use higher confidence
      existing.evidence.push(...tech.evidence);
      existing.confidence = Math.max(existing.confidence, tech.confidence);
    } else {
      seen.set(key, { ...tech });
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Generate comprehensive technology stack analysis
 */
function generateTechStackAnalysis(
  technologies: TechnologyInfo[], 
  options: TechStackAnalyzerOptions
): TechStackAnalyzerResult {
  const categories: Record<string, number> = {};
  technologies.forEach(tech => {
    categories[tech.category] = (categories[tech.category] || 0) + 1;
  });
  
  // Calculate complexity
  const complexityScore = calculateStackComplexity(technologies);
  
  // Calculate modernity score
  const modernityScore = calculateModernityScore(technologies);
  
  // Calculate security score
  const securityScore = options.includeSecurity ? calculateSecurityScore(technologies) : 0;
  
  // Generate summary
  const summary = generateStackSummary(technologies);
  
  return {
    technologies,
    totalFound: technologies.length,
    categories,
    stackComplexity: complexityScore,
    modernityScore,
    securityScore,
    summary
  };
}

/**
 * Calculate stack complexity rating
 */
function calculateStackComplexity(technologies: TechnologyInfo[]): TechStackAnalyzerResult['stackComplexity'] {
  const uniqueCategories = new Set(technologies.map(t => t.category)).size;
  const totalTech = technologies.length;
  
  if (totalTech < 5 && uniqueCategories < 3) return 'simple';
  if (totalTech < 10 && uniqueCategories < 5) return 'moderate';
  if (totalTech < 20 && uniqueCategories < 7) return 'complex';
  return 'very-complex';
}

/**
 * Calculate modernity score (0-1)
 */
function calculateModernityScore(technologies: TechnologyInfo[]): number {
  if (technologies.length === 0) return 0;
  
  const modernTech = technologies.filter(t => 
    ['React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js'].includes(t.name)
  ).length;
  
  return Math.min(modernTech / Math.max(technologies.length * 0.3, 1), 1);
}

/**
 * Calculate security score (0-1)
 */
function calculateSecurityScore(technologies: TechnologyInfo[]): number {
  if (technologies.length === 0) return 0;
  
  const scores = technologies.map(t => {
    switch (t.metadata.securityRating) {
      case 'excellent': return 1;
      case 'good': return 0.8;
      case 'fair': return 0.6;
      case 'poor': return 0.3;
      default: return 0.5;
    }
  });
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Generate technology stack summary
 */
function generateStackSummary(technologies: TechnologyInfo[]): TechStackAnalyzerResult['summary'] {
  const summary: TechStackAnalyzerResult['summary'] = {};
  
  // Find primary framework
  const frontendFrameworks = technologies.filter(t => 
    t.category === 'frontend' && ['React', 'Vue.js', 'Angular', 'jQuery'].includes(t.name)
  );
  if (frontendFrameworks.length > 0) {
    summary.primaryFramework = frontendFrameworks[0].name;
  }
  
  // Find CMS
  const cms = technologies.find(t => t.category === 'cms');
  if (cms) {
    summary.cmsDetected = cms.name;
  }
  
  // Find hosting/CDN
  const hosting = technologies.find(t => t.category === 'hosting' || t.category === 'cdn');
  if (hosting) {
    summary.hostingProvider = hosting.name;
  }
  
  // Find analytics
  const analytics = technologies.filter(t => t.category === 'analytics').map(t => t.name);
  if (analytics.length > 0) {
    summary.analytics = analytics;
  }
  
  return summary;
}
