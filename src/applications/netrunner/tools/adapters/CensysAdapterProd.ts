/**
 * Production Censys API Adapter
 * 
 * Real integration with Censys API for certificate intelligence and network scanning.
 * Implements comprehensive host discovery, certificate analysis, and network reconnaissance.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import axios from 'axios';
import { 
  ToolExecutionRequest, 
  ToolExecutionResponse, 
  ToolSchema,
  findToolById
} from '../NetRunnerPowerTools';
import { BaseAdapter } from './BaseAdapter';
import { apiConfigManager } from '../../../../shared/config/ApiConfigManager';

// Censys API Types
export interface CensysSearchRequest {
  query: string;
  per_page?: number;
  cursor?: string;
}

export interface CensysSearchResult {
  code: number;
  status: string;
  result: {
    query: string;
    total: number;
    hits: CensysHost[];
    links: {
      next?: string;
      prev?: string;
    };
  };
}

export interface CensysHost {
  ip: string;
  services: CensysService[];
  location: {
    country: string;
    country_code: string;
    city: string;
    province: string;
    postal_code: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  autonomous_system: {
    asn: number;
    description: string;
    bgp_prefix: string;
    name: string;
    country_code: string;
  };
  dns: {
    reverse_dns: {
      names: string[];
    };
  };
  last_updated_at: string;
}

export interface CensysService {
  port: number;
  service_name: string;
  transport_protocol: string;
  certificate?: string;
  banner?: string;
  software?: {
    product?: string;
    version?: string;
    vendor?: string;
  };
}

// Real Censys API client implementation
class CensysApiClient {
  private apiId: string;
  private apiSecret: string;
  private baseUrl = 'https://search.censys.io/api';

  constructor(apiId: string, apiSecret: string) {
    this.apiId = apiId;
    this.apiSecret = apiSecret;
  }

  async searchHosts(query: string, limit: number = 10): Promise<Record<string, unknown>> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/hosts/search`, {
        q: query,
        per_page: Math.min(limit, 100)
      }, {
        auth: {
          username: this.apiId,
          password: this.apiSecret
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Censys API credentials');
        }
        if (error.response?.status === 429) {
          throw new Error('Censys API rate limit exceeded');
        }
        throw new Error(`Censys API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async getHost(ip: string): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/hosts/${ip}`, {
        auth: {
          username: this.apiId,
          password: this.apiSecret
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Censys API credentials');
        }
        if (error.response?.status === 404) {
          throw new Error(`Host ${ip} not found in Censys database`);
        }
        throw new Error(`Censys API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async searchCertificates(query: string, limit: number = 10): Promise<Record<string, unknown>> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/certificates/search`, {
        q: query,
        per_page: Math.min(limit, 100)
      }, {
        auth: {
          username: this.apiId,
          password: this.apiSecret
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Censys API credentials');
        }
        throw new Error(`Censys API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }
}

export class CensysAdapter extends BaseAdapter {
  private apiClient: CensysApiClient | null = null;

  constructor() {
    const tool = findToolById('censys');
    const toolSchema: ToolSchema = {
      id: 'censys',
      name: tool?.name || 'Censys',
      description: tool?.description || 'Censys network and certificate intelligence',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Search query (IP, domain, service, certificate, etc.)',
          required: true
        },
        {
          name: 'type',
          type: 'string',
          description: 'Type of search to perform',
          required: true,
          options: ['hosts', 'certificates', 'host']
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results to return',
          required: false
        }
      ],
      outputFormat: {
        type: 'json'
      }
    };
    super('censys', toolSchema);
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if we have valid API credentials
      const config = apiConfigManager.getProviderConfig('censys');
      if (config.enabled && config.apiId && config.secret) {
        this.apiClient = new CensysApiClient(config.apiId, config.secret);
        console.log('Censys adapter initialized with real API');
        return true;
      } else {
        console.log('Censys adapter initialized without API credentials (will use mock data)');
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize Censys adapter:', error);
      return false;
    }
  }

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    const startTime = Date.now();
    
    try {
      console.log('Executing Censys search request:', request.parameters);

      // Validate required parameters
      const { query, type, limit = 10 } = request.parameters;
      if (!query || !type) {
        return {
          requestId: request.requestId,
          toolId: this.getToolId(),
          status: 'error',
          error: 'Missing required parameters: query and type',
          data: null,
          timestamp: Date.now()
        };
      }

      let searchResult: Record<string, unknown>;

      // Use real API if available, otherwise mock data
      if (this.apiClient) {
        console.log(`Using real Censys API for ${type} search`);
        searchResult = await this.executeRealSearch(query as string, type as string, limit as number);
      } else {
        console.log(`Using mock Censys data for ${type} search`);
        searchResult = this.generateMockSearch(query as string, type as string, limit as number);
      }

      const executionTime = Date.now() - startTime;
      
      return {
        requestId: request.requestId,
        toolId: this.getToolId(),
        status: 'success',
        data: {
          ...searchResult,
          metadata: {
            execution_time_ms: executionTime,
            timestamp: new Date().toISOString(),
            source: this.apiClient ? 'censys-api' : 'mock-data',
            query: query,
            search_type: type,
            limit: limit
          }
        },
        executionTime,
        timestamp: Date.now()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Censys search failed:', error);
      
      return {
        requestId: request.requestId,
        toolId: this.getToolId(),
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        data: null,
        executionTime,
        timestamp: Date.now()
      };
    }
  }

  private async executeRealSearch(query: string, type: string, limit: number): Promise<Record<string, unknown>> {
    if (!this.apiClient) {
      throw new Error('API client not initialized');
    }

    // Add rate limiting (Censys free tier: 0.2 requests per second)
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

    let rawData: Record<string, unknown>;

    switch (type) {
      case 'hosts':
        rawData = await this.apiClient.searchHosts(query, limit);
        break;
      case 'certificates':
        rawData = await this.apiClient.searchCertificates(query, limit);
        break;
      case 'host':
        rawData = await this.apiClient.getHost(query);
        break;
      default:
        throw new Error(`Unsupported search type: ${type}`);
    }

    // Transform the raw API response into a structured format
    return this.transformApiResponse(rawData, type, query);
  }

  private transformApiResponse(rawData: Record<string, unknown>, type: string, query: string): Record<string, unknown> {
    const response = rawData as Record<string, unknown>;
    
    const commonFields = {
      query,
      type,
      status: 'success'
    };

    switch (type) {
      case 'hosts': {
        const result = response.result as Record<string, unknown>;
        const hits = (result.hits as unknown[]) || [];
        
        return {
          ...commonFields,
          total_results: result.total || 0,
          returned_results: hits.length,
          hosts: hits.map((host: unknown) => {
            const hostData = host as Record<string, unknown>;
            return {
              ip: hostData.ip,
              location: hostData.location,
              autonomous_system: hostData.autonomous_system,
              services: ((hostData.services as unknown[]) || []).map((service: unknown) => {
                const serviceData = service as Record<string, unknown>;
                return {
                  port: serviceData.port,
                  service_name: serviceData.service_name,
                  transport_protocol: serviceData.transport_protocol,
                  banner: serviceData.banner,
                  software: serviceData.software
                };
              }),
              dns: hostData.dns,
              last_updated: hostData.last_updated_at
            };
          })
        };
      }

      case 'host': {
        const result = response.result as Record<string, unknown>;
        return {
          ...commonFields,
          host: {
            ip: result.ip,
            location: result.location,
            autonomous_system: result.autonomous_system,
            services: ((result.services as unknown[]) || []).map((service: unknown) => {
              const serviceData = service as Record<string, unknown>;
              return {
                port: serviceData.port,
                service_name: serviceData.service_name,
                transport_protocol: serviceData.transport_protocol,
                banner: serviceData.banner,
                software: serviceData.software
              };
            }),
            dns: result.dns,
            last_updated: result.last_updated_at
          }
        };
      }

      case 'certificates': {
        const result = response.result as Record<string, unknown>;
        const hits = (result.hits as unknown[]) || [];
        
        return {
          ...commonFields,
          total_results: result.total || 0,
          returned_results: hits.length,
          certificates: hits.map((cert: unknown) => {
            const certData = cert as Record<string, unknown>;
            return {
              fingerprint: certData.fingerprint,
              parsed: certData.parsed,
              validation: certData.validation,
              seen_in_scan: certData.seen_in_scan
            };
          })
        };
      }

      default:
        return rawData;
    }
  }

  private generateMockSearch(query: string, type: string, limit: number): Record<string, unknown> {
    // Generate realistic mock data for testing
    const mockData = {
      query,
      type,
      status: 'success',
      source: 'mock-data'
    };

    switch (type) {
      case 'hosts': {
        const mockHosts = Array(Math.min(limit, Math.floor(Math.random() * 20) + 1)).fill(null).map(() => ({
          ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          location: {
            country: ['United States', 'China', 'Germany', 'France', 'Canada'][Math.floor(Math.random() * 5)],
            country_code: ['US', 'CN', 'DE', 'FR', 'CA'][Math.floor(Math.random() * 5)],
            city: ['New York', 'Beijing', 'Berlin', 'Paris', 'Toronto'][Math.floor(Math.random() * 5)]
          },
          autonomous_system: {
            asn: Math.floor(Math.random() * 65535),
            description: ['Amazon.com Inc.', 'Cloudflare Inc.', 'Google LLC', 'Microsoft Corporation'][Math.floor(Math.random() * 4)],
            name: ['AMAZON', 'CLOUDFLARE', 'GOOGLE', 'MICROSOFT'][Math.floor(Math.random() * 4)]
          },
          services: Array(Math.floor(Math.random() * 5) + 1).fill(null).map(() => ({
            port: [80, 443, 22, 25, 53, 3389][Math.floor(Math.random() * 6)],
            service_name: ['HTTP', 'HTTPS', 'SSH', 'SMTP', 'DNS', 'RDP'][Math.floor(Math.random() * 6)],
            transport_protocol: ['TCP', 'UDP'][Math.floor(Math.random() * 2)],
            banner: `Mock service banner ${Math.random().toString(36).substring(7)}`
          })),
          last_updated: new Date(Date.now() - Math.random() * 86400000).toISOString()
        }));

        return {
          ...mockData,
          total_results: Math.floor(Math.random() * 10000) + 100,
          returned_results: mockHosts.length,
          hosts: mockHosts
        };
      }

      case 'host': {
        return {
          ...mockData,
          host: {
            ip: query,
            location: {
              country: 'United States',
              country_code: 'US',
              city: 'San Francisco'
            },
            autonomous_system: {
              asn: Math.floor(Math.random() * 65535),
              description: 'Example ISP Inc.',
              name: 'EXAMPLE-ISP'
            },
            services: [
              {
                port: 80,
                service_name: 'HTTP',
                transport_protocol: 'TCP',
                banner: 'nginx/1.21.0'
              },
              {
                port: 443,
                service_name: 'HTTPS',
                transport_protocol: 'TCP',
                banner: 'nginx/1.21.0'
              }
            ],
            last_updated: new Date().toISOString()
          }
        };
      }

      case 'certificates': {
        const mockCerts = Array(Math.min(limit, Math.floor(Math.random() * 10) + 1)).fill(null).map(() => ({
          fingerprint: Array(64).fill(null).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          parsed: {
            subject: {
              common_name: [`example-${Math.random().toString(36).substring(7)}.com`]
            },
            issuer: {
              common_name: ['Let\'s Encrypt', 'DigiCert Inc', 'GlobalSign'][Math.floor(Math.random() * 3)]
            },
            validity: {
              start: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
              end: new Date(Date.now() + Math.random() * 31536000000).toISOString()
            }
          },
          validation: {
            apple: Math.random() > 0.5,
            google_ct_primary: Math.random() > 0.3,
            microsoft: Math.random() > 0.5,
            nss: Math.random() > 0.4
          }
        }));

        return {
          ...mockData,
          total_results: Math.floor(Math.random() * 1000) + 50,
          returned_results: mockCerts.length,
          certificates: mockCerts
        };
      }

      default:
        return mockData;
    }
  }

  async shutdown(): Promise<void> {
    this.apiClient = null;
  }
}
