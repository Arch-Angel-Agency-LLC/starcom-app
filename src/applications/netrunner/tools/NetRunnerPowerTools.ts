/**
 * NetRunnerPowerTools.ts
 * 
 * This module defines the power tools available in the NetRunner system.
 * Each tool is specialized for different types of OSINT operations.
 */

import { v4 as uuidv4 } from 'uuid';

// Base interface for all NetRunner tools
export interface NetRunnerTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  capabilities: string[];
  premium: boolean;
  automationCompatible: boolean;
  source: string;
  license: string;
  apiEndpoints?: string[];
  compatibleBots?: string[];
  intelTypes: IntelType[];
}

// Tool categories align with OSINT methodology
export type ToolCategory = 
  | 'discovery'      // Initial data discovery
  | 'scraping'       // Data extraction 
  | 'aggregation'    // Data consolidation
  | 'analysis'       // Data processing and intelligence extraction
  | 'verification'   // Verification and validation
  | 'visualization'  // Data presentation
  | 'automation';    // Autonomous operations

// Intel types that can be produced
export type IntelType =
  | 'identity'       // Person or entity identification
  | 'network'        // Network information
  | 'financial'      // Financial intelligence
  | 'geospatial'     // Location-based intelligence
  | 'social'         // Social media intelligence
  | 'infrastructure' // Digital infrastructure intelligence
  | 'vulnerability'  // Security vulnerabilities
  | 'darkweb'        // Dark web intelligence
  | 'threat'         // Threat intelligence
  | 'temporal';      // Time-based intelligence

// NetRunner Power Tools Collection
export const netRunnerPowerTools: NetRunnerTool[] = [
  {
    id: uuidv4(),
    name: 'SpiderFoot',
    description: 'Advanced reconnaissance tool that automates OSINT collection and helps identify vulnerabilities',
    category: 'discovery',
    capabilities: [
      'Automated reconnaissance',
      'Passive information gathering',
      'Attack surface mapping',
      'Domain & subdomain discovery',
      'Digital footprint analysis'
    ],
    premium: false,
    automationCompatible: true,
    source: 'https://github.com/smicallef/spiderfoot',
    license: 'MIT',
    intelTypes: ['identity', 'network', 'infrastructure', 'vulnerability']
  },
  {
    id: uuidv4(),
    name: 'Maltego',
    description: 'Data visualization and link analysis tool for investigating connections between information',
    category: 'visualization',
    capabilities: [
      'Entity relationship mapping',
      'Visual link analysis',
      'Data transformation',
      'Pattern identification',
      'Interactive graphs'
    ],
    premium: true,
    automationCompatible: true,
    source: 'https://www.maltego.com/',
    license: 'Commercial with free community edition',
    intelTypes: ['identity', 'network', 'social', 'infrastructure']
  },
  {
    id: uuidv4(),
    name: 'Shodan',
    description: 'Search engine for Internet-connected devices and services',
    category: 'discovery',
    capabilities: [
      'IoT device discovery',
      'Service identification',
      'Vulnerability scanning',
      'Banner grabbing',
      'Global infrastructure mapping'
    ],
    premium: true,
    automationCompatible: true,
    source: 'https://www.shodan.io/',
    license: 'Commercial with API',
    apiEndpoints: ['/api/v1/search', '/api/v1/host/{ip}', '/api/v1/count'],
    intelTypes: ['network', 'infrastructure', 'vulnerability']
  },
  {
    id: uuidv4(),
    name: 'theHarvester',
    description: 'Email, subdomain and name harvester for gathering information',
    category: 'discovery',
    capabilities: [
      'Email harvesting',
      'Domain enumeration',
      'Employee name gathering',
      'Subdomain discovery',
      'Public information collection'
    ],
    premium: false,
    automationCompatible: true,
    source: 'https://github.com/laramies/theHarvester',
    license: 'GPL-2.0',
    intelTypes: ['identity', 'network', 'infrastructure']
  },
  {
    id: uuidv4(),
    name: 'Recon-ng',
    description: 'Full-featured reconnaissance framework with modular design',
    category: 'discovery',
    capabilities: [
      'Modular reconnaissance',
      'Contact information gathering',
      'Credential harvesting',
      'Domain profiling',
      'Automated workflow'
    ],
    premium: false,
    automationCompatible: true,
    source: 'https://github.com/lanmaster53/recon-ng',
    license: 'GPL-3.0',
    intelTypes: ['identity', 'network', 'infrastructure']
  },
  {
    id: uuidv4(),
    name: 'OSINT Framework',
    description: 'Collection of OSINT tools categorized by resource type',
    category: 'aggregation',
    capabilities: [
      'Unified OSINT interface',
      'Categorized resources',
      'Comprehensive tool access',
      'Domain & IP research',
      'Social media investigation'
    ],
    premium: false,
    automationCompatible: false,
    source: 'https://osintframework.com/',
    license: 'Creative Commons',
    intelTypes: ['identity', 'network', 'social', 'infrastructure', 'financial']
  },
  {
    id: uuidv4(),
    name: 'Censys',
    description: 'Search engine for internet-connected devices and SSL/TLS certificates',
    category: 'discovery',
    capabilities: [
      'Certificate scanning',
      'Host enumeration',
      'Service identification',
      'Infrastructure mapping',
      'Vulnerability discovery'
    ],
    premium: true,
    automationCompatible: true,
    source: 'https://censys.io/',
    license: 'Commercial with API',
    apiEndpoints: ['/api/v2/hosts', '/api/v2/certificates', '/api/v2/search'],
    intelTypes: ['network', 'infrastructure', 'vulnerability']
  },
  {
    id: uuidv4(),
    name: 'Sherlock',
    description: 'Hunt down social media accounts by username across sites',
    category: 'discovery',
    capabilities: [
      'Username enumeration',
      'Social media profiling',
      'Digital identity tracking',
      'Account discovery',
      'Profile correlation'
    ],
    premium: false,
    automationCompatible: true,
    source: 'https://github.com/sherlock-project/sherlock',
    license: 'MIT',
    intelTypes: ['identity', 'social']
  },
  {
    id: uuidv4(),
    name: 'Google Dorks',
    description: 'Advanced Google search queries for finding specific information',
    category: 'discovery',
    capabilities: [
      'Advanced search operators',
      'Exposed document discovery',
      'Sensitive information detection',
      'Site enumeration',
      'Configuration file finding'
    ],
    premium: false,
    automationCompatible: true,
    source: 'https://www.exploit-db.com/google-hacking-database',
    license: 'N/A',
    intelTypes: ['infrastructure', 'vulnerability', 'identity']
  },
  {
    id: uuidv4(),
    name: 'Intelligence X',
    description: 'Search engine and data archive specialized in finding deleted content',
    category: 'discovery',
    capabilities: [
      'Historical data retrieval',
      'Deleted content recovery',
      'Selector searching',
      'Data archiving',
      'Dark web monitoring'
    ],
    premium: true,
    automationCompatible: true,
    source: 'https://intelx.io/',
    license: 'Commercial with API',
    apiEndpoints: ['/api/search', '/api/file', '/api/phonebook'],
    intelTypes: ['identity', 'darkweb', 'infrastructure', 'social']
  },
  {
    id: uuidv4(),
    name: 'Wigle',
    description: 'Database of wireless networks with statistics and submitted GPS coordinates',
    category: 'discovery',
    capabilities: [
      'Wireless network mapping',
      'Geolocation correlation',
      'Network SSID search',
      'Wireless landscape analysis',
      'Hotspot tracking'
    ],
    premium: false,
    automationCompatible: true,
    source: 'https://wigle.net/',
    license: 'Creative Commons',
    intelTypes: ['geospatial', 'network', 'infrastructure']
  },
  {
    id: uuidv4(),
    name: 'BuiltWith',
    description: 'Web technology profiling to identify what websites are built with',
    category: 'analysis',
    capabilities: [
      'Technology stack identification',
      'Website profiling',
      'Competitor analysis',
      'Digital technology trends',
      'Infrastructure insights'
    ],
    premium: true,
    automationCompatible: true,
    source: 'https://builtwith.com/',
    license: 'Commercial with API',
    apiEndpoints: ['/api/v1/lookup', '/api/v2/trends'],
    intelTypes: ['infrastructure', 'network']
  },
  {
    id: uuidv4(),
    name: 'Mitaka',
    description: 'Browser extension for OSINT search from browser context',
    category: 'discovery',
    capabilities: [
      'Contextual OSINT lookups',
      'Multi-engine searching',
      'IP/domain investigation',
      'Hash verification',
      'Email analysis'
    ],
    premium: false,
    automationCompatible: false,
    source: 'https://github.com/ninoseki/mitaka',
    license: 'MIT',
    intelTypes: ['network', 'identity', 'infrastructure']
  },
  {
    id: uuidv4(),
    name: 'LeakIX',
    description: 'First public indexing platform for finding and searching leaks',
    category: 'discovery',
    capabilities: [
      'Data leak discovery',
      'Vulnerability identification',
      'Exposed service detection',
      'Public leak indexing',
      'Security gap identification'
    ],
    premium: false,
    automationCompatible: true,
    source: 'https://leakix.net/',
    license: 'Creative Commons',
    intelTypes: ['vulnerability', 'infrastructure', 'network']
  },
  {
    id: uuidv4(),
    name: 'Hunter.io',
    description: 'Email hunter to find and verify professional email addresses',
    category: 'discovery',
    capabilities: [
      'Email pattern detection',
      'Email verification',
      'Domain email search',
      'Bulk email finding',
      'Contact discovery'
    ],
    premium: true,
    automationCompatible: true,
    source: 'https://hunter.io/',
    license: 'Commercial with API',
    apiEndpoints: ['/api/v2/domain-search', '/api/v2/email-verifier'],
    intelTypes: ['identity', 'network']
  },
  {
    id: uuidv4(),
    name: 'NetGrapher',
    description: 'Advanced network visualization and mapping tool',
    category: 'visualization',
    capabilities: [
      'Network topology mapping',
      'Relationship visualization',
      'Interactive graph analysis',
      'Pattern detection',
      'Data export for intelligence reports'
    ],
    premium: true,
    automationCompatible: true,
    source: 'internal',
    license: 'Proprietary',
    intelTypes: ['network', 'infrastructure', 'identity']
  },
  {
    id: uuidv4(),
    name: 'TemporalScan',
    description: 'Timeline analysis and temporal intelligence extraction',
    category: 'analysis',
    capabilities: [
      'Timeline reconstruction',
      'Temporal pattern analysis',
      'Event correlation',
      'Historical data mining',
      'Predictive pattern modeling'
    ],
    premium: true,
    automationCompatible: true,
    source: 'internal',
    license: 'Proprietary',
    intelTypes: ['temporal', 'threat', 'infrastructure']
  },
  {
    id: uuidv4(),
    name: 'DataSweeper',
    description: 'Automated data collection and initial processing',
    category: 'scraping',
    capabilities: [
      'Web scraping',
      'Data extraction',
      'Content processing',
      'Automated collection',
      'Format normalization'
    ],
    premium: false,
    automationCompatible: true,
    source: 'internal',
    license: 'Proprietary',
    intelTypes: ['identity', 'network', 'infrastructure', 'financial']
  },
  {
    id: uuidv4(),
    name: 'ThreatMapper',
    description: 'Advanced threat intelligence correlation and mapping',
    category: 'analysis',
    capabilities: [
      'Threat correlation',
      'Indicator mapping',
      'Tactical intelligence',
      'Strategic assessment',
      'Adversary tracking'
    ],
    premium: true,
    automationCompatible: true,
    source: 'internal',
    license: 'Proprietary',
    intelTypes: ['threat', 'vulnerability', 'infrastructure']
  },
  {
    id: uuidv4(),
    name: 'DarkSeeker',
    description: 'Dark web and deep web intelligence gathering',
    category: 'discovery',
    capabilities: [
      'Dark web crawling',
      'Hidden service discovery',
      'Marketplace monitoring',
      'Forum scanning',
      'Content extraction'
    ],
    premium: true,
    automationCompatible: true,
    source: 'internal',
    license: 'Proprietary',
    intelTypes: ['darkweb', 'threat', 'financial', 'identity']
  }
];

// Export the tool finding utility
export const findToolById = (id: string): NetRunnerTool | undefined => {
  return netRunnerPowerTools.find(tool => tool.id === id);
};

export const findToolsByCategory = (category: ToolCategory): NetRunnerTool[] => {
  return netRunnerPowerTools.filter(tool => tool.category === category);
};

export const findToolsByIntelType = (intelType: IntelType): NetRunnerTool[] => {
  return netRunnerPowerTools.filter(tool => tool.intelTypes.includes(intelType));
};

// Tool Execution Interfaces and Utilities

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: string | number | boolean | unknown[] | Record<string, unknown>;
  options?: string[] | number[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ToolSchema {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  outputFormat: {
    type: 'json' | 'text' | 'html' | 'binary' | 'image';
    schema?: Record<string, unknown>;
  };
}

export interface ToolExecutionRequest {
  toolId: string;
  parameters: Record<string, unknown>;
  requestId: string;
  timestamp: number;
}

export interface ToolExecutionResponse {
  requestId: string;
  toolId: string;
  status: 'success' | 'error' | 'in_progress';
  data: unknown;
  error?: string;
  executionTime?: number;
  timestamp: number;
}

export interface ToolAdapter {
  getToolId(): string;
  getToolSchema(): ToolSchema;
  validateParameters(params: Record<string, unknown>): boolean;
  execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse>;
  initialize(): Promise<boolean>;
  shutdown(): Promise<void>;
}

// Execution status tracking
export type ExecutionStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';

export interface ExecutionState {
  id: string;
  toolId: string;
  status: ExecutionStatus;
  progress: number;
  startTime?: number;
  endTime?: number;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

// Utility functions for tool execution
export const createExecutionRequest = (
  toolId: string, 
  parameters: Record<string, unknown>
): ToolExecutionRequest => {
  return {
    toolId,
    parameters,
    requestId: uuidv4(),
    timestamp: Date.now()
  };
};

export const createInitialExecutionState = (
  toolId: string,
  parameters: Record<string, unknown>
): ExecutionState => {
  return {
    id: uuidv4(),
    toolId,
    status: 'idle',
    progress: 0,
    parameters,
  };
};

// Helper for converting response to execution state
export const updateExecutionStateFromResponse = (
  state: ExecutionState,
  response: ToolExecutionResponse
): ExecutionState => {
  return {
    ...state,
    status: response.status === 'success' ? 'completed' : 
           response.status === 'error' ? 'failed' : 'running',
    progress: response.status === 'success' || response.status === 'error' ? 100 : state.progress,
    endTime: response.status === 'success' || response.status === 'error' ? Date.now() : undefined,
    result: response.data,
    error: response.error
  };
};

// Tool adapter registry
const adapterRegistry = new Map<string, ToolAdapter>();

// Register a tool adapter
export const registerToolAdapter = (adapter: ToolAdapter): void => {
  const toolId = adapter.getToolId();
  
  if (adapterRegistry.has(toolId)) {
    console.warn(`Adapter for tool ID ${toolId} is already registered. Overwriting.`);
  }
  
  adapterRegistry.set(toolId, adapter);
  console.log(`Registered adapter for tool: ${adapter.getToolSchema().name} (ID: ${toolId})`);
};

// Get an adapter by tool ID
export const getToolAdapter = (toolId: string): ToolAdapter | undefined => {
  return adapterRegistry.get(toolId);
};

// Get all registered adapters
export const getAllToolAdapters = (): ToolAdapter[] => {
  return Array.from(adapterRegistry.values());
};

// Initialize all registered tool adapters
export const initializeAllAdapters = async (): Promise<boolean> => {
  console.log('Initializing all registered tool adapters...');
  
  let success = true;
  const adapters = getAllToolAdapters();
  
  if (adapters.length === 0) {
    console.warn('No tool adapters registered to initialize');
    return false;
  }
  
  for (const adapter of adapters) {
    try {
      const adapterInitialized = await adapter.initialize();
      if (!adapterInitialized) {
        console.error(`Failed to initialize adapter for tool: ${adapter.getToolSchema().name}`);
        success = false;
      }
    } catch (error) {
      console.error(`Error initializing adapter: ${error instanceof Error ? error.message : String(error)}`);
      success = false;
    }
  }
  
  console.log(`Adapter initialization ${success ? 'completed successfully' : 'completed with errors'}`);
  return success;
};

// Intel object interfaces for standardized data processing
export interface IntelEntity {
  id: string;
  name: string;
  type: string;
  source: string;
  confidence: number; // 0-100
  attributes: Record<string, unknown>;
  relatedEntities?: string[];
  metadata: {
    discoveredAt: number;
    toolId: string;
    intelType: IntelType;
    expiresAt?: number;
    tags?: string[];
  };
}

export interface IntelRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  strength: number; // 0-100
  metadata: {
    discoveredAt: number;
    toolId: string;
    expiresAt?: number;
    tags?: string[];
  };
}

export interface IntelPackage {
  id: string;
  name: string;
  description: string;
  entities: IntelEntity[];
  relationships: IntelRelationship[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    toolIds: string[];
    intelTypes: IntelType[];
    confidence: number; // 0-100
    classification: 'unclassified' | 'confidential' | 'secret' | 'top-secret';
    tags?: string[];
  };
}

// Convert tool execution results to Intel objects
export const convertToolResultToIntel = (
  toolId: string,
  result: unknown,
  options: {
    confidenceLevel?: number;
    expiryTime?: number;
    entityType?: string;
    intelType?: IntelType;
    tags?: string[];
  } = {}
): IntelPackage => {
  const tool = findToolById(toolId);
  if (!tool) {
    throw new Error(`Tool with ID ${toolId} not found`);
  }
  
  // Default values
  const {
    confidenceLevel = 70,
    expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    entityType = 'generic',
    intelType = tool.intelTypes[0] || 'network',
    tags = []
  } = options;
  
  // Create basic intel package
  const intelPackage: IntelPackage = {
    id: uuidv4(),
    name: `Intel from ${tool.name}`,
    description: `Intelligence gathered using ${tool.name}`,
    entities: [],
    relationships: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      toolIds: [toolId],
      intelTypes: [...tool.intelTypes],
      confidence: confidenceLevel,
      classification: 'unclassified',
      tags: [...tags, tool.name, ...tool.intelTypes]
    }
  };
  
  // Process result based on tool and result structure
  // This is a simplified version - in a real implementation, 
  // each tool adapter would provide its own conversion logic
  
  if (result && typeof result === 'object') {
    // Handle array results
    if (Array.isArray(result)) {
      result.forEach((item, index) => {
        if (item && typeof item === 'object') {
          // Create entity from each array item
          const entity: IntelEntity = {
            id: uuidv4(),
            name: `Item ${index}`,
            type: entityType,
            source: tool.name,
            confidence: confidenceLevel,
            attributes: { ...item },
            metadata: {
              discoveredAt: Date.now(),
              toolId: toolId,
              intelType: intelType,
              expiresAt: expiryTime,
              tags: tags
            }
          };
          
          // Extract name if available
          if ('name' in item && typeof item.name === 'string') {
            entity.name = item.name;
          } else if ('title' in item && typeof item.title === 'string') {
            entity.name = item.title;
          } else if ('id' in item && (typeof item.id === 'string' || typeof item.id === 'number')) {
            entity.name = `Entity ${String(item.id)}`;
          }
          
          intelPackage.entities.push(entity);
        }
      });
    } 
    // Handle object results
    else {
      // Check for common result structures
      if ('data' in result && Array.isArray(result.data)) {
        // Process data array
        result.data.forEach((item, index) => {
          if (item && typeof item === 'object') {
            const entity: IntelEntity = {
              id: uuidv4(),
              name: `Item ${index}`,
              type: entityType,
              source: tool.name,
              confidence: confidenceLevel,
              attributes: { ...item },
              metadata: {
                discoveredAt: Date.now(),
                toolId: toolId,
                intelType: intelType,
                expiresAt: expiryTime,
                tags: tags
              }
            };
            
            // Extract name if available
            if ('name' in item && typeof item.name === 'string') {
              entity.name = item.name;
            } else if ('title' in item && typeof item.title === 'string') {
              entity.name = item.title;
            } else if ('id' in item && (typeof item.id === 'string' || typeof item.id === 'number')) {
              entity.name = `Entity ${String(item.id)}`;
            }
            
            intelPackage.entities.push(entity);
          }
        });
      } 
      // Handle common properties of object results
      else {
        // Create main entity from the result object
        const mainEntity: IntelEntity = {
          id: uuidv4(),
          name: 'Primary Result',
          type: entityType,
          source: tool.name,
          confidence: confidenceLevel,
          attributes: { ...result },
          metadata: {
            discoveredAt: Date.now(),
            toolId: toolId,
            intelType: intelType,
            expiresAt: expiryTime,
            tags: tags
          }
        };
        
        // Extract name if available
        if ('name' in result && typeof result.name === 'string') {
          mainEntity.name = result.name;
        } else if ('title' in result && typeof result.title === 'string') {
          mainEntity.name = result.title;
        } else if ('id' in result && (typeof result.id === 'string' || typeof result.id === 'number')) {
          mainEntity.name = `Entity ${String(result.id)}`;
        }
        
        intelPackage.entities.push(mainEntity);
        
        // Extract relationships if any
        if ('relationships' in result && Array.isArray(result.relationships)) {
          const rels = result.relationships as Array<{
            source?: string | number;
            target?: string | number;
            type?: string;
            strength?: number;
          }>;
          
          rels.forEach(rel => {
            if (rel.source && rel.target) {
              const relationship: IntelRelationship = {
                id: uuidv4(),
                sourceEntityId: String(rel.source),
                targetEntityId: String(rel.target),
                type: rel.type || 'related',
                strength: rel.strength || 50,
                metadata: {
                  discoveredAt: Date.now(),
                  toolId: toolId,
                  expiresAt: expiryTime,
                  tags: tags
                }
              };
              
              intelPackage.relationships.push(relationship);
            }
          });
        }
      }
    }
  }
  
  return intelPackage;
};

// Export the registry and intel types for integration with the NetRunner system
export default {
  tools: netRunnerPowerTools,
  findToolById,
  findToolsByCategory,
  findToolsByIntelType,
  getToolAdapter,
  getAllToolAdapters,
  registerToolAdapter,
  initializeAllAdapters,
  convertToolResultToIntel
};
