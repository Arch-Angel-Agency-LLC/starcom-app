/**
 * Production Shodan API Adapter
 * 
 * Real integration with Shodan API for OSINT intelligence gathering.
 * Implements rate limiting, error handling, and comprehensive data processing.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { BaseToolAdapter } from '../core/BaseAdapter';
import { LoggerFactory, OperationLogger } from '../../services/logging';
import { ErrorFactory, NETRUNNER_ERROR_CODES } from '../../services/error';
import { ApiConfigManager } from '../../services/api/ApiConfigManager';
import { 
  OSINTResult, 
  OSINTSource, 
  OSINTDataItem, 
  NetworkHost, 
  Vulnerability, 
  IntelType, 
  SourceType, 
  ClassificationLevel 
} from '../../models/OSINTDataModels';
import { ToolExecutionRequest } from '../../models';

const logger = LoggerFactory.getLogger('NetRunner:ShodanAdapter');

// Shodan API Types
export interface ShodanSearchRequest {
  query: string;
  facets?: string[];
  page?: number;
  minify?: boolean;
}

export interface ShodanHostRequest {
  ip: string;
  history?: boolean;
  minify?: boolean;
}

export interface ShodanSearchResult {
  matches: ShodanHost[];
  total: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface ShodanHost {
  ip_str: string;
  port: number;
  timestamp: string;
  hostnames: string[];
  domains: string[];
  org: string;
  isp: string;
  asn: string;
  country_code: string;
  country_name: string;
  city: string;
  region_code: string;
  postal_code: string;
  longitude: number;
  latitude: number;
  os: string;
  product: string;
  version: string;
  title: string;
  html: string;
  banner: string;
  transport: string;
  devicetype: string;
  cpe: string[];
  tags: string[];
  vulns: string[];
  ssl?: {
    cert: {
      subject: Record<string, string>;
      issuer: Record<string, string>;
      fingerprint: string;
      serial: string;
      expired: boolean;
    };
    cipher: {
      version: string;
      name: string;
      bits: number;
    };
  };
  location: {
    country_code: string;
    country_name: string;
    city: string;
    region_code: string;
    area_code: number;
    latitude: number;
    longitude: number;
  };
  _shodan: {
    id: string;
    module: string;
    crawler: string;
  };
}

export interface ShodanApiInfo {
  query_credits: number;
  scan_credits: number;
  telnet: boolean;
  plan: string;
  https: boolean;
  unlocked: boolean;
}

/**
 * Production Shodan API Adapter
 * 
 * Implements comprehensive Shodan API integration with real-time data collection,
 * advanced error handling, and intelligent rate limiting.
 */
export class ShodanAdapter extends BaseToolAdapter {
  private apiManager: ApiConfigManager;
  private baseUrl: string = 'https://api.shodan.io';
  private credentialId: string | null = null;

  constructor(apiManager: ApiConfigManager) {
    super(
      {
        id: 'shodan',
        name: 'Shodan',
        description: 'Internet-connected device search engine for security research',
        version: '1.0',
        capabilities: [
          'host_search',
          'ip_lookup', 
          'vulnerability_scan',
          'service_detection',
          'geolocation',
          'ssl_analysis',
          'banner_grabbing'
        ],
        timeout: 30000,
        retries: 3,
        rateLimit: {
          requestsPerSecond: 1,
          burstLimit: 5
        },
        authentication: {
          type: 'api_key',
          config: { required: true }
        }
      },
      {
        parameters: {
          required: ['query'],
          optional: ['page', 'facets', 'minify'],
          types: {
            query: 'string',
            page: 'number',
            facets: 'array',
            minify: 'boolean'
          },
          validation: {
            query: (value: unknown) => typeof value === 'string' && value.length > 0,
            page: (value: unknown) => typeof value === 'number' && value > 0,
            facets: (value: unknown) => Array.isArray(value),
            minify: (value: unknown) => typeof value === 'boolean'
          }
        }
      }
    );
    
    this.apiManager = apiManager;
  }

  /**
   * Search Shodan for hosts matching query
   */
  async searchHosts(request: ShodanSearchRequest): Promise<OSINTResult> {
    const correlationId = this.generateCorrelationId();
    
    try {
      logger.info('Executing Shodan host search', {
        correlationId,
        query: request.query,
        page: request.page || 1
      });

      // Get active credentials
      const credentials = await this.apiManager.getActiveCredentials('shodan');
      if (!credentials) {
        throw ErrorFactory.createIntegrationError(
          'No active Shodan credentials available',
          NETRUNNER_ERROR_CODES.INTEGRATION_AUTHENTICATION_FAILED
        );
      }

      this.credentialId = credentials.id;

      // Check rate limits
      const rateLimitCheck = await this.apiManager.checkRateLimit(credentials.id);
      if (!rateLimitCheck.allowed) {
        throw ErrorFactory.createAdapterError(
          'Shodan API rate limit exceeded',
          NETRUNNER_ERROR_CODES.ADAPTER_RATE_LIMITED,
          {
            details: {
              remaining: rateLimitCheck.remaining,
              resetTime: rateLimitCheck.resetTime
            }
          }
        );
      }

      // Build API URL
      const url = this.buildSearchUrl(request);
      
      logger.debug('Making Shodan API request', {
        correlationId,
        url: url.toString(),
        remainingQuota: rateLimitCheck.remaining
      });

      // Execute API request
      const startTime = Date.now();
      const response = await this.makeAuthenticatedRequest(url.toString(), credentials.apiKey);
      const requestTime = Date.now() - startTime;

      // Record usage
      await this.apiManager.recordUsage(credentials.id);

      // Parse response
      const data: ShodanSearchResult = await response.json();

      logger.info('Shodan search completed successfully', {
        correlationId,
        resultCount: data.matches?.length || 0,
        totalResults: data.total,
        requestTime
      });

      // Transform to OSINT format
      const osintResult = this.transformSearchResult(data, request, correlationId);
      
      return {
        success: true,
        data: osintResult,
        metadata: {
          correlationId,
          source: 'shodan',
          timestamp: new Date().toISOString(),
          requestTime,
          creditsUsed: 1,
          remainingCredits: rateLimitCheck.remaining.day
        }
      };

    } catch (error) {
      logger.error('Shodan search failed', error, { correlationId, query: request.query });
      
      if (this.credentialId) {
        // Don't record usage for failed requests
      }
      
      return this.handleError(error, correlationId);
    }
  }

  /**
   * Get detailed information about a specific host
   */
  async getHostInfo(request: ShodanHostRequest): Promise<OSINTResult> {
    const correlationId = this.generateCorrelationId();
    
    try {
      logger.info('Getting Shodan host information', {
        correlationId,
        ip: request.ip,
        includeHistory: request.history || false
      });

      const credentials = await this.apiManager.getActiveCredentials('shodan');
      if (!credentials) {
        throw ErrorFactory.createIntegrationError(
          'No active Shodan credentials available',
          NETRUNNER_ERROR_CODES.INTEGRATION_AUTHENTICATION_FAILED
        );
      }

      // Check rate limits
      const rateLimitCheck = await this.apiManager.checkRateLimit(credentials.id);
      if (!rateLimitCheck.allowed) {
        throw ErrorFactory.createAdapterError(
          'Shodan API rate limit exceeded',
          NETRUNNER_ERROR_CODES.ADAPTER_RATE_LIMITED,
          { details: { remaining: rateLimitCheck.remaining } }
        );
      }

      // Build API URL
      const url = this.buildHostUrl(request);
      
      logger.debug('Making Shodan host API request', {
        correlationId,
        url: url.toString()
      });

      // Execute API request
      const startTime = Date.now();
      const response = await this.makeAuthenticatedRequest(url.toString(), credentials.apiKey);
      const requestTime = Date.now() - startTime;

      // Record usage
      await this.apiManager.recordUsage(credentials.id);

      // Parse response
      const host: ShodanHost = await response.json();

      logger.info('Shodan host lookup completed', {
        correlationId,
        ip: request.ip,
        servicesFound: host.port ? 1 : 0,
        requestTime
      });

      // Transform to OSINT format
      const osintResult = this.transformHostResult(host, correlationId);
      
      return {
        success: true,
        data: osintResult,
        metadata: {
          correlationId,
          source: 'shodan',
          timestamp: new Date().toISOString(),
          requestTime,
          creditsUsed: 1
        }
      };

    } catch (error) {
      logger.error('Shodan host lookup failed', error, { correlationId, ip: request.ip });
      return this.handleError(error, correlationId);
    }
  }

  /**
   * Get API account information and quota status
   */
  async getApiInfo(): Promise<{ info: ShodanApiInfo; creditsRemaining: number }> {
    try {
      const credentials = await this.apiManager.getActiveCredentials('shodan');
      if (!credentials) {
        throw ErrorFactory.createIntegrationError(
          'No active Shodan credentials available',
          NETRUNNER_ERROR_CODES.INTEGRATION_AUTHENTICATION_FAILED
        );
      }

      const url = `${this.baseUrl}/api-info?key=${credentials.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API info request failed: ${response.status} ${response.statusText}`);
      }

      const info: ShodanApiInfo = await response.json();
      
      logger.info('Retrieved Shodan API info', {
        plan: info.plan,
        queryCredits: info.query_credits,
        scanCredits: info.scan_credits
      });

      return {
        info,
        creditsRemaining: info.query_credits
      };
    } catch (error) {
      logger.error('Failed to get Shodan API info', error);
      throw error;
    }
  }

  /**
   * Implementation of BaseAdapter's executeInternal method
   */
  protected async executeInternal(
    request: ToolExecutionRequest, 
    operationLogger: OperationLogger
  ): Promise<OSINTDataItem[]> {
    try {
      operationLogger.step('execution_start', 'Executing Shodan adapter request', {
        toolId: request.toolId,
        query: request.parameters?.query
      });

      const operation = request.parameters.operation as string || 'search';
      
      switch (operation) {
        case 'search':
        case 'host_search':
          return await this.executeSearch(request, operationLogger);
          
        case 'host_lookup':
        case 'ip_lookup':
          return await this.executeHostLookup(request, operationLogger);
          
        default:
          throw ErrorFactory.createToolError(
            `Unsupported operation: ${operation}`,
            NETRUNNER_ERROR_CODES.TOOL_PARAMETER_INVALID
          );
      }
    } catch (error) {
      operationLogger.failure(error as Error, 'Shodan adapter execution failed');
      throw error;
    }
  }

  private async executeSearch(
    request: ToolExecutionRequest,
    operationLogger: OperationLogger
  ): Promise<OSINTDataItem[]> {
    const searchRequest: ShodanSearchRequest = {
      query: request.parameters.query as string,
      page: request.parameters.page as number || 1,
      facets: request.parameters.facets as string[] || undefined,
      minify: request.parameters.minify as boolean || false
    };

    operationLogger.step('search_execute', 'Executing Shodan search', { searchRequest });

    const result = await this.searchHosts(searchRequest);
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Search failed');
    }

    // Convert OSINTSource to OSINTDataItem array
    const hosts = (result.data.data as { hosts?: NetworkHost[] })?.hosts || [];
    return hosts.map((host: NetworkHost) => ({
      id: `host_${host.ip}_${host.port}`,
      type: 'network' as IntelType,
      sourceType: 'api' as SourceType,
      classification: 'public' as ClassificationLevel,
      collectedAt: new Date().toISOString(),
      collectedBy: 'shodan-adapter',
      correlationId: result.metadata?.correlationId,
      source: {
        name: 'Shodan',
        url: 'https://shodan.io',
        tool: 'shodan-api',
        reliability: 'high' as const
      },
      content: host as unknown as Record<string, unknown>,
      metadata: {
        collectionMethod: 'api_search',
        processingStatus: 'raw' as const,
        confidence: 90,
        creditsUsed: result.metadata?.creditsUsed,
        correlationId: result.metadata?.correlationId
      }
    }));
  }

  private async executeHostLookup(
    request: ToolExecutionRequest,
    operationLogger: OperationLogger
  ): Promise<OSINTDataItem[]> {
    const hostRequest: ShodanHostRequest = {
      ip: request.parameters.ip as string,
      history: request.parameters.history as boolean || false,
      minify: request.parameters.minify as boolean || false
    };

    operationLogger.step('host_lookup', 'Executing Shodan host lookup', { hostRequest });

    const result = await this.getHostInfo(hostRequest);
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Host lookup failed');
    }

    // Convert OSINTSource to OSINTDataItem
    const host = (result.data.data as { host?: NetworkHost })?.host;
    if (!host) {
      return [];
    }

    return [{
      id: `host_${host.ip}`,
      type: 'network' as IntelType,
      sourceType: 'api' as SourceType,
      classification: 'public' as ClassificationLevel,
      collectedAt: new Date().toISOString(),
      collectedBy: 'shodan-adapter',
      correlationId: result.metadata?.correlationId,
      source: {
        name: 'Shodan',
        url: 'https://shodan.io',
        tool: 'shodan-api',
        reliability: 'high' as const
      },
      content: host as unknown as Record<string, unknown>,
      metadata: {
        collectionMethod: 'api_lookup',
        processingStatus: 'raw' as const,
        confidence: 95,
        creditsUsed: result.metadata?.creditsUsed,
        correlationId: result.metadata?.correlationId
      }
    }];
  }

  // Private helper methods
  private buildSearchUrl(request: ShodanSearchRequest): URL {
    const url = new URL(`${this.baseUrl}/shodan/host/search`);
    url.searchParams.set('query', request.query);
    
    if (request.facets) {
      url.searchParams.set('facets', request.facets.join(','));
    }
    
    if (request.page && request.page > 1) {
      url.searchParams.set('page', request.page.toString());
    }
    
    if (request.minify) {
      url.searchParams.set('minify', 'true');
    }
    
    return url;
  }

  private buildHostUrl(request: ShodanHostRequest): URL {
    const url = new URL(`${this.baseUrl}/shodan/host/${request.ip}`);
    
    if (request.history) {
      url.searchParams.set('history', 'true');
    }
    
    if (request.minify) {
      url.searchParams.set('minify', 'true');
    }
    
    return url;
  }

  private async makeAuthenticatedRequest(url: string, apiKey: string): Promise<Response> {
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}key=${apiKey}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'NetRunner/1.0 OSINT Platform',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw ErrorFactory.createIntegrationError(
          'Shodan API authentication failed',
          NETRUNNER_ERROR_CODES.INTEGRATION_AUTHENTICATION_FAILED,
          { details: { status: response.status, statusText: response.statusText } }
        );
      } else if (response.status === 429) {
        throw ErrorFactory.createAdapterError(
          'Shodan API rate limit exceeded',
          NETRUNNER_ERROR_CODES.ADAPTER_RATE_LIMITED,
          { details: { status: response.status } }
        );
      } else {
        throw ErrorFactory.createAdapterError(
          `Shodan API request failed: ${response.statusText}`,
          NETRUNNER_ERROR_CODES.ADAPTER_API_ERROR,
          { details: { status: response.status, statusText: response.statusText } }
        );
      }
    }

    return response;
  }

  private transformSearchResult(data: ShodanSearchResult, request: ShodanSearchRequest, correlationId: string): OSINTSource {
    const hosts: NetworkHost[] = data.matches.map(host => this.transformShodanHost(host));
    
    return {
      id: `shodan_search_${Date.now()}`,
      name: `Shodan Search: ${request.query}`,
      type: 'infrastructure',
      description: `Shodan search results for query: ${request.query}`,
      url: `https://www.shodan.io/search?query=${encodeURIComponent(request.query)}`,
      lastUpdated: new Date().toISOString(),
      trustLevel: 'high',
      data: {
        hosts,
        totalResults: data.total,
        currentPage: request.page || 1,
        facets: data.facets
      },
      metadata: {
        correlationId,
        source: 'shodan',
        query: request.query,
        resultCount: hosts.length
      }
    };
  }

  private transformHostResult(host: ShodanHost, correlationId: string): OSINTSource {
    const networkHost = this.transformShodanHost(host);
    
    return {
      id: `shodan_host_${host.ip_str}`,
      name: `Shodan Host: ${host.ip_str}`,
      type: 'infrastructure',
      description: `Detailed information for host ${host.ip_str}`,
      url: `https://www.shodan.io/host/${host.ip_str}`,
      lastUpdated: new Date().toISOString(),
      trustLevel: 'high',
      data: {
        host: networkHost
      },
      metadata: {
        correlationId,
        source: 'shodan',
        ip: host.ip_str
      }
    };
  }

  private transformShodanHost(host: ShodanHost): NetworkHost {
    const vulnerabilities: Vulnerability[] = host.vulns ? host.vulns.map(cve => ({
      id: cve,
      type: 'cve',
      severity: 'unknown',
      description: `CVE vulnerability: ${cve}`,
      references: [`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}`]
    })) : [];

    return {
      ip: host.ip_str,
      port: host.port,
      hostname: host.hostnames?.[0] || '',
      hostnames: host.hostnames || [],
      domains: host.domains || [],
      organization: host.org || '',
      isp: host.isp || '',
      asn: host.asn || '',
      country: host.country_name || '',
      countryCode: host.country_code || '',
      city: host.city || '',
      region: host.region_code || '',
      postalCode: host.postal_code || '',
      location: {
        latitude: host.latitude,
        longitude: host.longitude
      },
      services: [{
        port: host.port,
        protocol: host.transport || 'tcp',
        service: host.product || 'unknown',
        version: host.version || '',
        banner: host.banner || '',
        title: host.title || '',
        ssl: host.ssl ? {
          certificate: {
            subject: host.ssl.cert.subject,
            issuer: host.ssl.cert.issuer,
            fingerprint: host.ssl.cert.fingerprint,
            serial: host.ssl.cert.serial,
            expired: host.ssl.cert.expired
          },
          cipher: {
            version: host.ssl.cipher.version,
            name: host.ssl.cipher.name,
            bits: host.ssl.cipher.bits
          }
        } : undefined
      }],
      operatingSystem: host.os || '',
      deviceType: host.devicetype || 'unknown',
      tags: host.tags || [],
      vulnerabilities,
      lastSeen: host.timestamp,
      metadata: {
        shodanId: host._shodan.id,
        module: host._shodan.module,
        crawler: host._shodan.crawler,
        cpes: host.cpe || []
      }
    };
  }

  private handleError(error: unknown, correlationId: string): OSINTResult {
    if (error instanceof Error && 'code' in error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: (error as { code?: string }).code || 'UNKNOWN_ERROR',
          correlationId
        }
      };
    }

    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'ADAPTER_EXECUTION_FAILED',
        correlationId
      }
    };
  }

  private generateCorrelationId(): string {
    return `shodan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ShodanAdapter;
