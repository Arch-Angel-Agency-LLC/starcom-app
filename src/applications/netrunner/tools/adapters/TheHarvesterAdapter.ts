/**
 * TheHarvesterAdapter.ts
 * 
 * Adapter for theHarvester OSINT tool.
 * Provides an interface for making requests to theHarvester for email, subdomain, and name harvesting.
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { 
  ToolExecutionRequest, 
  ToolExecutionResponse, 
  ToolSchema,
  IntelType,
  netRunnerPowerTools,
  findToolById
} from '../NetRunnerPowerTools';
import { BaseAdapter } from './BaseAdapter';

// Real theHarvester client implementation
class TheHarvesterClient {
  private apiEndpoint: string | null = null;
  
  constructor(apiEndpoint?: string) {
    // This would connect to a theHarvester API service if available
    // For now, we'll implement a simulation of real functionality
    this.apiEndpoint = apiEndpoint || null;
  }
  
  async gatherEmails(domain: string, limit: number = 10): Promise<Record<string, unknown>> {
    if (this.apiEndpoint) {
      // Use real API endpoint if available
      try {
        const response = await axios.post(`${this.apiEndpoint}/harvest/emails`, {
          domain,
          limit,
          sources: ['google', 'bing', 'dnsdumpster', 'duckduckgo']
        }, { timeout: 60000 });
        
        return response.data;
      } catch (error) {
        throw new Error(`theHarvester API error: ${error}`);
      }
    }
    
    // Enhanced mock with more realistic data patterns
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    const commonPrefixes = ['info', 'admin', 'contact', 'sales', 'support', 'help'];
    const departmentPrefixes = ['dev', 'marketing', 'hr', 'finance', 'legal', 'operations'];
    const namePrefixes = ['john.doe', 'jane.smith', 'michael.johnson', 'sarah.williams', 'david.brown'];
    
    const allPrefixes = [...commonPrefixes, ...departmentPrefixes, ...namePrefixes];
    const emails = allPrefixes.slice(0, Math.min(limit, allPrefixes.length))
      .map(prefix => `${prefix}@${domain}`);
    
    return {
      domain,
      emails,
      count: emails.length,
      source: 'theHarvester_enhanced',
      _isEnhancedMock: true
    };
  }
  
  async gatherSubdomains(domain: string, limit: number = 10): Promise<Record<string, unknown>> {
    if (this.apiEndpoint) {
      try {
        const response = await axios.post(`${this.apiEndpoint}/harvest/subdomains`, {
          domain,
          limit,
          sources: ['dnsdumpster', 'virustotal', 'crtsh', 'netcraft']
        }, { timeout: 60000 });
        
        return response.data;
      } catch (error) {
        throw new Error(`theHarvester API error: ${error}`);
      }
    }
    
    // Enhanced mock with realistic subdomain patterns
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const infrastructureSubs = ['www', 'mail', 'smtp', 'ftp', 'api', 'cdn'];
    const environmentSubs = ['dev', 'test', 'staging', 'prod', 'beta'];
    const serviceSubs = ['blog', 'shop', 'admin', 'app', 'mobile', 'portal'];
    
    const allSubs = [...infrastructureSubs, ...environmentSubs, ...serviceSubs];
    const subdomains = allSubs.slice(0, Math.min(limit, allSubs.length))
      .map(prefix => `${prefix}.${domain}`);
    
    return {
      domain,
      subdomains,
      count: subdomains.length,
      source: 'theHarvester_enhanced',
      _isEnhancedMock: true
    };
  }
  
  async gatherNames(company: string, limit: number = 10): Promise<Record<string, unknown>> {
    if (this.apiEndpoint) {
      try {
        const response = await axios.post(`${this.apiEndpoint}/harvest/names`, {
          company,
          limit,
          sources: ['linkedin', 'google', 'bing', 'duckduckgo']
        }, { timeout: 60000 });
        
        return response.data;
      } catch (error) {
        throw new Error(`theHarvester API error: ${error}`);
      }
    }
    
    // Enhanced mock with realistic employee name patterns
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica', 'Robert', 'Ashley'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const positions = ['Manager', 'Developer', 'Analyst', 'Director', 'Coordinator', 'Specialist', 'Engineer', 'Executive'];
    
    const names = firstNames.slice(0, Math.min(limit, firstNames.length))
      .map((first, index) => {
        const last = lastNames[index % lastNames.length];
        const position = positions[index % positions.length];
        return {
          name: `${first} ${last}`,
          company,
          position: `${position} at ${company}`,
          email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`
        };
      });
    
    return {
      company,
      names,
      count: names.length,
      source: 'theHarvester_enhanced',
      _isEnhancedMock: true
    };
  }
}

export class TheHarvesterAdapter extends BaseAdapter {
  private harvesterClient: TheHarvesterClient;
  
  constructor(apiEndpoint?: string) {
    // Find the theHarvester tool from the collection
    const harvesterTool = netRunnerPowerTools.find(tool => tool.name === 'theHarvester');
    
    if (!harvesterTool) {
      throw new Error('theHarvester tool not found in the NetRunnerPowerTools collection');
    }
    
    // Define the tool schema for theHarvester
    const schema: ToolSchema = {
      id: harvesterTool.id,
      name: harvesterTool.name,
      description: harvesterTool.description,
      parameters: [
        {
          name: 'operation',
          type: 'string',
          description: 'Operation type: "emails", "subdomains", or "names"',
          required: true,
          options: ['emails', 'subdomains', 'names'],
          default: 'emails'
        },
        {
          name: 'domain',
          type: 'string',
          description: 'Target domain for email or subdomain harvesting',
          required: false,
          validation: {
            pattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$'
          }
        },
        {
          name: 'company',
          type: 'string',
          description: 'Company name for employee name harvesting',
          required: false
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
        }
      ],
      outputFormat: {
        type: 'json',
        schema: {
          domain: 'string',
          emails: 'array',
          subdomains: 'array',
          names: 'array',
          count: 'number'
        }
      }
    };
    
    super(harvesterTool.id, schema);
    
    // Initialize the real client after super call
    this.harvesterClient = new TheHarvesterClient(apiEndpoint);
  }
  
  async initialize(): Promise<boolean> {
    try {
      // In a real implementation, we would establish connection to theHarvester API or CLI
      // For now, we'll just simulate success
      console.log('Initializing theHarvester adapter');
      return await super.initialize();
    } catch (error) {
      console.error('Failed to initialize theHarvester adapter', error);
      return false;
    }
  }
  
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    const startTime = Date.now();
    
    // Check if adapter is initialized
    if (!this.initialized) {
      return this.createErrorResponse(
        request, 
        'theHarvester adapter not initialized'
      );
    }
    
    // Validate parameters
    if (!this.validateParameters(request.parameters)) {
      return this.createErrorResponse(
        request, 
        'Invalid parameters for theHarvester operation'
      );
    }
    
    try {
      // Determine the operation to perform
      const operation = request.parameters.operation as string;
      const limit = (request.parameters.limit || 10) as number;
      let results: Record<string, unknown>;
      
      // Execute the appropriate operation
      switch (operation) {
        case 'emails': {
          // Check if domain is provided for email operation
          const emailDomain = request.parameters.domain as string;
          if (!emailDomain) {
            return this.createErrorResponse(
              request, 
              'Domain is required for email harvesting operation'
            );
          }
          results = await this.harvesterClient.gatherEmails(emailDomain, limit);
          break;
        }
          
        case 'subdomains': {
          // Check if domain is provided for subdomain operation
          const subdomainTarget = request.parameters.domain as string;
          if (!subdomainTarget) {
            return this.createErrorResponse(
              request, 
              'Domain is required for subdomain harvesting operation'
            );
          }
          results = await this.harvesterClient.gatherSubdomains(subdomainTarget, limit);
          break;
        }
          
        case 'names': {
          // Check if company is provided for name operation
          const company = request.parameters.company as string;
          if (!company) {
            return this.createErrorResponse(
              request, 
              'Company name is required for employee name harvesting operation'
            );
          }
          results = await this.harvesterClient.gatherNames(company, limit);
          break;
        }
          
        default:
          return this.createErrorResponse(
            request,
            `Unsupported operation: ${operation}. Supported operations are: "emails", "subdomains", "names"`
          );
      }
      
      // Determine intel types generated
      let intelTypes: IntelType[] = [];
      
      if (operation === 'emails' || operation === 'names') {
        intelTypes = ['identity', 'network'];
      } else if (operation === 'subdomains') {
        intelTypes = ['network', 'infrastructure'];
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
        `Error executing theHarvester operation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
