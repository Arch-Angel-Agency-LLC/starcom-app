/**
 * ShodanAdapter.ts
 * 
 * Adapter for the Shodan OSINT tool.
 * Provides an interface for making requests to the Shodan API.
 */

import axios from 'axios';
import { 
  ToolExecutionRequest, 
  ToolExecutionResponse, 
  ToolSchema,
  IntelType,
  netRunnerPowerTools
} from '../NetRunnerPowerTools';
import { BaseAdapter } from './BaseAdapter';

// Real Shodan API client implementation
class ShodanApiClient {
  private apiKey: string;
  private baseUrl = 'https://api.shodan.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, limit: number = 10): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/shodan/host/search`, {
        params: {
          key: this.apiKey,
          query,
          limit,
          facets: 'country:10,port:10,org:5'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Shodan API key');
        }
        if (error.response?.status === 402) {
          throw new Error('Shodan API quota exceeded');
        }
        throw new Error(`Shodan API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }
  
  async host(ip: string): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/shodan/host/${ip}`, {
        params: {
          key: this.apiKey,
          history: false,
          minify: false
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Shodan API key');
        }
        if (error.response?.status === 404) {
          throw new Error(`Host ${ip} not found in Shodan database`);
        }
        throw new Error(`Shodan API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async getApiInfo(): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/api-info`, {
        params: {
          key: this.apiKey
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Shodan API key');
        }
        throw new Error(`Shodan API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }
}

// Mock client for fallback when no API key is available
const mockShodanApiClient = {
  search: async (query: string, _limit: number = 10): Promise<Record<string, unknown>> => {
    console.warn('Using mock Shodan client - configure SHODAN_API_KEY for real data');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      matches: [
        {
          ip_str: '203.0.113.1',
          port: 80,
          org: 'Example Corp',
          isp: 'Example ISP',
          location: {
            country_name: 'United States',
            city: 'San Francisco',
            longitude: -122.4194,
            latitude: 37.7749
          },
          hostnames: ['example-server.com'],
          timestamp: new Date().toISOString(),
          data: 'HTTP/1.1 200 OK\r\nServer: Apache/2.4.29'
        }
      ],
      total: 1,
      _isMockData: true
    };
  },
  
  host: async (ip: string): Promise<Record<string, unknown>> => {
    console.warn('Using mock Shodan client - configure SHODAN_API_KEY for real data');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      ip_str: ip,
      ports: [80, 443, 22],
      hostnames: ['example-server.com'],
      country_name: 'United States',
      city: 'San Francisco',
      org: 'Example Corp',
      isp: 'Example ISP',
      vulns: ['CVE-2021-34527'],
      last_update: new Date().toISOString(),
      data: [
        {
          port: 80,
          service: 'http',
          banner: 'HTTP/1.1 200 OK\r\nServer: Apache/2.4.29'
        }
      ],
      _isMockData: true
    };
  },

  getApiInfo: async (): Promise<Record<string, unknown>> => {
    console.warn('Using mock Shodan client - configure SHODAN_API_KEY for real data');
    return {
      query_credits: 0,
      scan_credits: 0,
      telnet: false,
      plan: 'mock',
      https: true,
      unlocked: false,
      _isMockData: true
    };
  }
};

import { apiConfigManager } from '../../../../shared/config/ApiConfigManager';

export class ShodanAdapter extends BaseAdapter {
  private apiKey: string | null = null;
  private shodanClient: ShodanApiClient | null = null;
  private useMockClient: boolean = true;
  
  constructor() {
    // Find the Shodan tool from the collection
    const shodanTool = netRunnerPowerTools.find(tool => tool.name === 'Shodan');
    
    if (!shodanTool) {
      throw new Error('Shodan tool not found in the NetRunnerPowerTools collection');
    }
    
    // Define the tool schema for Shodan
    const schema: ToolSchema = {
      id: shodanTool.id,
      name: shodanTool.name,
      description: shodanTool.description,
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Search query (e.g., "apache", "country:US", "port:22")',
          required: true,
          validation: {
            pattern: '^.{3,}$' // At least 3 characters
          }
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results to return',
          required: false,
          default: 10,
          validation: {
            min: 1,
            max: 100
          }
        },
        {
          name: 'operation',
          type: 'string',
          description: 'Operation to perform: "search" or "host"',
          required: true,
          default: 'search',
          options: ['search', 'host']
        },
        {
          name: 'ip',
          type: 'string',
          description: 'IP address (only for "host" operation)',
          required: false,
          validation: {
            pattern: '^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$'
          }
        }
      ],
      outputFormat: {
        type: 'json',
        schema: {
          total: 'number',
          matches: 'array',
          ip_str: 'string'
        }
      }
    };
    
    super(shodanTool.id, schema);
    
    // Initialize with unified API config
    this.initializeApiClient();
  }
  
  private initializeApiClient(): void {
    try {
      const shodanConfig = apiConfigManager.getProviderConfig('shodan');
      
      if (shodanConfig && shodanConfig.enabled && shodanConfig.apiKey) {
        this.apiKey = shodanConfig.apiKey;
        this.shodanClient = new ShodanApiClient(this.apiKey);
        this.useMockClient = false;
        console.log('Shodan adapter initialized with real API client from unified config');
      } else {
        // Fallback to environment variables
        this.apiKey = process.env.SHODAN_API_KEY || 
                     process.env.REACT_APP_SHODAN_API_KEY ||
                     localStorage.getItem('SHODAN_API_KEY') ||
                     null;
        
        if (this.apiKey && this.apiKey !== 'MOCK_API_KEY_FOR_SHODAN') {
          this.shodanClient = new ShodanApiClient(this.apiKey);
          this.useMockClient = false;
          console.log('Shodan adapter initialized with real API client from environment');
        } else {
          this.useMockClient = true;
          console.log('Shodan adapter using mock client - configure API key to enable real functionality');
        }
      }
    } catch (error) {
      console.error('Failed to initialize Shodan API client:', error);
      this.useMockClient = true;
    }
  }
  
  async initialize(): Promise<boolean> {
    try {
      // Try to get API key from environment variables or configuration
      this.apiKey = process.env.SHODAN_API_KEY || 
                   process.env.REACT_APP_SHODAN_API_KEY ||
                   localStorage.getItem('SHODAN_API_KEY') ||
                   null;
      
      if (this.apiKey && this.apiKey !== 'MOCK_API_KEY_FOR_SHODAN') {
        // We have a real API key, try to initialize the real client
        try {
          this.shodanClient = new ShodanApiClient(this.apiKey);
          // Test the API key with a simple info call
          await this.shodanClient.getApiInfo();
          this.useMockClient = false;
          console.log('Shodan adapter initialized with real API client');
        } catch (error) {
          console.warn('Failed to initialize real Shodan client, falling back to mock:', error);
          this.useMockClient = true;
          this.shodanClient = null;
        }
      } else {
        // No API key available, use mock client
        this.useMockClient = true;
        console.log('Shodan adapter initialized with mock client (no API key provided)');
      }
      
      return await super.initialize();
    } catch (error) {
      console.error('Failed to initialize Shodan adapter', error);
      return false;
    }
  }
  
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    const startTime = Date.now();
    
    // Check if adapter is initialized
    if (!this.initialized) {
      return this.createErrorResponse(
        request, 
        'Shodan adapter not initialized'
      );
    }
    
    // Check if we have either a real client or can use mock
    if (!this.useMockClient && !this.shodanClient) {
      return this.createErrorResponse(
        request, 
        'Shodan adapter missing API key and unable to use mock client'
      );
    }
    
    // Validate parameters
    if (!this.validateParameters(request.parameters)) {
      return this.createErrorResponse(
        request, 
        'Invalid parameters for Shodan operation'
      );
    }
    
    try {
      // Determine the operation to perform
      const operation = (request.parameters.operation || 'search') as string;
      let results: Record<string, unknown>;
      
      // Choose the appropriate client (real or mock)
      const client = this.useMockClient ? mockShodanApiClient : this.shodanClient!;
      
      if (operation === 'host') {
        // Check if IP is provided for host operation
        const ip = request.parameters.ip as string;
        if (!ip) {
          return this.createErrorResponse(
            request, 
            'IP address is required for host operation'
          );
        }
        
        results = await client.host(ip);
      } else {
        // Extract parameters for search operation
        const query = request.parameters.query as string;
        const limit = (request.parameters.limit || 10) as number;
        
        results = await client.search(query, limit);
      }
      
      // Determine intel types generated
      const intelTypes: IntelType[] = ['network', 'infrastructure'];
      
      // Add vulnerability intel if present
      if ('vulns' in results || 
          (results.matches as Array<Record<string, unknown>>)?.some(m => 'vulns' in m)) {
        intelTypes.push('vulnerability');
      }
      
      // Add metadata about the execution
      const enhancedResults = {
        ...results,
        _metadata: {
          toolId: this.toolId,
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          intelTypes,
          operation
        }
      };
      
      const executionTime = Date.now() - startTime;
      return this.createSuccessResponse(request, enhancedResults, executionTime);
    } catch (error) {
      return this.createErrorResponse(
        request, 
        `Error executing Shodan operation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
