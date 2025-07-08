/**
 * TheHarvesterAdapter.ts
 * 
 * Adapter for theHarvester OSINT tool.
 * Provides an interface for making requests to theHarvester for email, subdomain, and name harvesting.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ToolExecutionRequest, 
  ToolExecutionResponse, 
  ToolSchema,
  IntelType,
  netRunnerPowerTools,
  findToolById
} from '../NetRunnerPowerTools';
import { BaseAdapter } from './BaseAdapter';

// Mock API client for theHarvester
// In a real implementation, this would connect to an actual theHarvester instance
const mockHarvesterClient = {
  gatherEmails: async (domain: string, limit: number = 10): Promise<Record<string, unknown>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    // Generate random emails based on domain
    const emailPrefixes = ['info', 'admin', 'contact', 'sales', 'support', 'help', 'dev', 'marketing', 'hr', 'john.doe', 'jane.smith', 'webmaster'];
    const emails = emailPrefixes.slice(0, Math.min(limit, emailPrefixes.length)).map(prefix => `${prefix}@${domain}`);
    
    return {
      domain,
      emails,
      count: emails.length,
      source: 'theHarvester'
    };
  },
  
  gatherSubdomains: async (domain: string, limit: number = 10): Promise<Record<string, unknown>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate random subdomains based on domain
    const subdomainPrefixes = ['www', 'mail', 'dev', 'api', 'test', 'staging', 'blog', 'shop', 'admin', 'app', 'mobile', 'cdn', 'media'];
    const subdomains = subdomainPrefixes.slice(0, Math.min(limit, subdomainPrefixes.length)).map(prefix => `${prefix}.${domain}`);
    
    return {
      domain,
      subdomains,
      count: subdomains.length,
      source: 'theHarvester'
    };
  },
  
  gatherNames: async (company: string, limit: number = 10): Promise<Record<string, unknown>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate random names
    const firstNames = ['John', 'Jane', 'Michael', 'Emma', 'James', 'Sarah', 'David', 'Emily', 'Robert', 'Olivia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
    
    const names = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      names.push({
        name: `${firstName} ${lastName}`,
        title: ['CEO', 'CTO', 'CFO', 'CIO', 'Developer', 'Designer', 'Manager', 'Director', 'VP', 'Analyst'][i],
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        confidence: Math.floor(Math.random() * 40) + 60
      });
    }
    
    return {
      company,
      names,
      count: names.length,
      source: 'theHarvester'
    };
  }
};

export class TheHarvesterAdapter extends BaseAdapter {
  constructor() {
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
        case 'emails':
          // Check if domain is provided for email operation
          const emailDomain = request.parameters.domain as string;
          if (!emailDomain) {
            return this.createErrorResponse(
              request, 
              'Domain is required for email harvesting operation'
            );
          }
          results = await mockHarvesterClient.gatherEmails(emailDomain, limit);
          break;
          
        case 'subdomains':
          // Check if domain is provided for subdomain operation
          const subdomainTarget = request.parameters.domain as string;
          if (!subdomainTarget) {
            return this.createErrorResponse(
              request, 
              'Domain is required for subdomain harvesting operation'
            );
          }
          results = await mockHarvesterClient.gatherSubdomains(subdomainTarget, limit);
          break;
          
        case 'names':
          // Check if company is provided for name operation
          const company = request.parameters.company as string;
          if (!company) {
            return this.createErrorResponse(
              request, 
              'Company name is required for employee name harvesting operation'
            );
          }
          results = await mockHarvesterClient.gatherNames(company, limit);
          break;
          
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
