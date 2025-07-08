/**
 * IntelAnalyzerAdapter.ts
 * 
 * Adapter for integrating with the IntelAnalyzer system.
 * This adapter enables NetRunner to process raw intelligence data into
 * structured intelligence packages.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAdapter } from './BaseAdapter';
import { 
  ToolExecutionRequest, 
  ToolExecutionResponse,
  IntelType
} from '../NetRunnerPowerTools';
import { 
  IntelEntity, 
  IntelRelationship, 
  Evidence, 
  ClassificationLevel 
} from '../../models/IntelReport';

// Intel package types for the analyzer
export type IntelPackageType = 
  | 'entity_extraction'
  | 'relationship_mapping'
  | 'threat_assessment'
  | 'vulnerability_report'
  | 'identity_profile'
  | 'network_mapping'
  | 'infrastructure_analysis'
  | 'financial_intelligence'
  | 'temporal_analysis'
  | 'geospatial_mapping';

// Configuration for the intel analyzer
export interface IntelAnalyzerConfig {
  analysisDepth: 'basic' | 'standard' | 'deep';
  entityTypes: string[];
  confidenceThreshold: number;
  includeRawData: boolean;
  outputFormat: 'report' | 'entities' | 'relationships' | 'combined';
  classificationLevel: ClassificationLevel;
}

// Intel analysis result
export interface IntelAnalysisResult {
  packageId: string;
  packageType: IntelPackageType;
  timestamp: string;
  summary: string;
  entities: IntelEntity[];
  relationships: IntelRelationship[];
  evidence: Evidence[];
  rawData?: unknown;
  confidence: number;
  metadata: Record<string, unknown>;
}

/**
 * IntelAnalyzerAdapter provides integration with the IntelAnalyzer system
 * for processing raw intelligence data into structured intelligence packages.
 */
export class IntelAnalyzerAdapter extends BaseAdapter {

  constructor() {
    super('intel-analyzer', {
      id: 'intel-analyzer',
      name: 'Intel Analyzer',
      description: 'Process raw data into structured intelligence packages',
      parameters: [
        {
          name: 'data',
          type: 'object',
          description: 'Raw data to analyze',
          required: true
        },
        {
          name: 'packageType',
          type: 'string',
          description: 'Type of intelligence package to create',
          required: true,
          options: [
            'entity_extraction',
            'relationship_mapping',
            'threat_assessment',
            'vulnerability_report',
            'identity_profile',
            'network_mapping',
            'infrastructure_analysis',
            'financial_intelligence',
            'temporal_analysis',
            'geospatial_mapping'
          ]
        },
        {
          name: 'analysisDepth',
          type: 'string',
          description: 'Depth of analysis to perform',
          required: false,
          default: 'standard',
          options: ['basic', 'standard', 'deep']
        },
        {
          name: 'confidenceThreshold',
          type: 'number',
          description: 'Minimum confidence level for results (0.0-1.0)',
          required: false,
          default: 0.65,
          validation: {
            min: 0,
            max: 1
          }
        },
        {
          name: 'includeRawData',
          type: 'boolean',
          description: 'Include raw data in the result',
          required: false,
          default: false
        },
        {
          name: 'classificationLevel',
          type: 'string',
          description: 'Classification level for the intelligence',
          required: false,
          default: 'UNCLASSIFIED',
          options: ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET', 'COSMIC']
        }
      ],
      outputFormat: {
        type: 'json',
        schema: {
          packageId: 'string',
          packageType: 'string',
          timestamp: 'string',
          summary: 'string',
          entities: 'array',
          relationships: 'array',
          evidence: 'array',
          confidence: 'number',
          metadata: 'object'
        }
      }
    });
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<boolean> {
    console.log('Initializing Intel Analyzer Adapter');
    // In a real implementation, this would connect to the IntelAnalyzer system
    return true;
  }

  /**
   * Validate the parameters for a tool execution request
   */
  validateParameters(params: Record<string, unknown>): boolean {
    // Check required parameters
    if (!params.data) {
      console.error('Missing required parameter: data');
      return false;
    }

    if (!params.packageType) {
      console.error('Missing required parameter: packageType');
      return false;
    }

    // Validate packageType
    const validPackageTypes = this.getToolSchema().parameters.find(p => p.name === 'packageType')?.options as string[];
    if (validPackageTypes && !validPackageTypes.includes(params.packageType as string)) {
      console.error(`Invalid packageType: ${params.packageType}. Must be one of: ${validPackageTypes.join(', ')}`);
      return false;
    }

    // Validate analysisDepth if provided
    if (params.analysisDepth) {
      const validDepths = this.getToolSchema().parameters.find(p => p.name === 'analysisDepth')?.options as string[];
      if (validDepths && !validDepths.includes(params.analysisDepth as string)) {
        console.error(`Invalid analysisDepth: ${params.analysisDepth}. Must be one of: ${validDepths.join(', ')}`);
        return false;
      }
    }

    // Validate confidenceThreshold if provided
    if (params.confidenceThreshold !== undefined) {
      const threshold = params.confidenceThreshold as number;
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        console.error(`Invalid confidenceThreshold: ${params.confidenceThreshold}. Must be a number between 0 and 1.`);
        return false;
      }
    }

    // Validate classificationLevel if provided
    if (params.classificationLevel) {
      const validLevels = this.getToolSchema().parameters.find(p => p.name === 'classificationLevel')?.options as string[];
      if (validLevels && !validLevels.includes(params.classificationLevel as string)) {
        console.error(`Invalid classificationLevel: ${params.classificationLevel}. Must be one of: ${validLevels.join(', ')}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Execute the Intel Analyzer
   */
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    console.log('Executing Intel Analyzer request:', request);

    // Validate parameters
    if (!this.validateParameters(request.parameters)) {
      return {
        requestId: request.requestId,
        toolId: this.getToolId(),
        status: 'error',
        data: null,
        error: 'Invalid parameters',
        timestamp: Date.now()
      };
    }

    try {
      // Extract parameters
      const data = request.parameters.data;
      const packageType = request.parameters.packageType as IntelPackageType;
      const analysisDepth = (request.parameters.analysisDepth || 'standard') as 'basic' | 'standard' | 'deep';
      const confidenceThreshold = (request.parameters.confidenceThreshold || 0.65) as number;
      const includeRawData = (request.parameters.includeRawData || false) as boolean;
      const classificationLevel = (request.parameters.classificationLevel || 'UNCLASSIFIED') as ClassificationLevel;

      // In a real implementation, this would call the actual IntelAnalyzer service
      // For now, we'll simulate the analysis with mock data

      // Mock delay to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock analysis result
      const result = this.generateMockAnalysisResult(
        packageType,
        data,
        analysisDepth,
        confidenceThreshold,
        includeRawData,
        classificationLevel
      );

      return {
        requestId: request.requestId,
        toolId: this.getToolId(),
        status: 'success',
        data: result,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error executing Intel Analyzer:', error);
      return {
        requestId: request.requestId,
        toolId: this.getToolId(),
        status: 'error',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Generate a mock analysis result
   * This is a placeholder for the actual analysis logic
   */
  private generateMockAnalysisResult(
    packageType: IntelPackageType,
    data: unknown,
    analysisDepth: 'basic' | 'standard' | 'deep',
    confidenceThreshold: number,
    includeRawData: boolean,
    classificationLevel: ClassificationLevel
  ): IntelAnalysisResult {
    // Map of package types to intel types
    const packageTypeToIntelTypes: Record<IntelPackageType, IntelType[]> = {
      'entity_extraction': ['identity'],
      'relationship_mapping': ['identity', 'network'],
      'threat_assessment': ['threat', 'vulnerability'],
      'vulnerability_report': ['vulnerability', 'infrastructure'],
      'identity_profile': ['identity', 'social'],
      'network_mapping': ['network', 'infrastructure'],
      'infrastructure_analysis': ['infrastructure', 'vulnerability'],
      'financial_intelligence': ['financial', 'identity'],
      'temporal_analysis': ['temporal', 'threat'],
      'geospatial_mapping': ['geospatial', 'infrastructure']
    };

    // Generate mock entities based on package type
    const entities: IntelEntity[] = [];
    const relationships: IntelRelationship[] = [];
    const evidence: Evidence[] = [];

    // Complexity factor based on analysis depth
    const complexityFactor = analysisDepth === 'basic' ? 1 : 
                             analysisDepth === 'standard' ? 2 : 3;

    // Number of entities to generate
    const entityCount = 2 * complexityFactor;
    
    // Generate mock entities
    for (let i = 0; i < entityCount; i++) {
      const confidence = 0.5 + Math.random() * 0.5; // Between 0.5 and 1.0
      
      // Only include entities above the confidence threshold
      if (confidence >= confidenceThreshold) {
        entities.push(this.generateMockEntity(packageType, confidence));
      }
    }

    // Generate relationships between entities
    if (entities.length >= 2) {
      const relationshipCount = Math.min(
        Math.floor((entities.length * (entities.length - 1)) / 4),
        entities.length * complexityFactor
      );
      
      for (let i = 0; i < relationshipCount; i++) {
        const sourceIndex = Math.floor(Math.random() * entities.length);
        let targetIndex;
        
        // Ensure target is different from source
        do {
          targetIndex = Math.floor(Math.random() * entities.length);
        } while (targetIndex === sourceIndex);
        
        const confidence = 0.4 + Math.random() * 0.6; // Between 0.4 and 1.0
        
        // Only include relationships above the confidence threshold
        if (confidence >= confidenceThreshold) {
          relationships.push({
            id: uuidv4(),
            source: entities[sourceIndex].id,
            target: entities[targetIndex].id,
            type: this.getRandomRelationshipType(packageType),
            confidence,
            sources: ['intel-analyzer'],
            properties: {
              analysisDepth,
              packageType
            }
          });
        }
      }
    }

    // Generate evidence
    const evidenceCount = Math.max(1, Math.floor(entities.length / 2));
    for (let i = 0; i < evidenceCount; i++) {
      evidence.push({
        id: uuidv4(),
        type: 'document',
        title: `Evidence for ${packageType} analysis`,
        description: `Supporting evidence generated by Intel Analyzer for ${packageType}`,
        timestamp: new Date().toISOString(),
        metadata: {
          analysisDepth,
          generatedBy: 'IntelAnalyzerAdapter',
          confidence: 0.7 + Math.random() * 0.3 // Between 0.7 and 1.0
        }
      });
    }

    // Create the analysis result
    const result: IntelAnalysisResult = {
      packageId: uuidv4(),
      packageType,
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(packageType, entities.length, relationships.length),
      entities,
      relationships,
      evidence,
      confidence: entities.length > 0 
        ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length 
        : 0,
      metadata: {
        analysisDepth,
        confidenceThreshold,
        classificationLevel,
        entityCount: entities.length,
        relationshipCount: relationships.length,
        intelTypes: packageTypeToIntelTypes[packageType],
        processingTime: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 100)}s`
      }
    };

    // Include raw data if requested
    if (includeRawData) {
      result.rawData = data;
    }

    return result;
  }

  /**
   * Generate a mock entity
   */
  private generateMockEntity(packageType: IntelPackageType, confidence: number): IntelEntity {
    const entityTypes: Record<IntelPackageType, string[]> = {
      'entity_extraction': ['person', 'organization', 'email', 'username'],
      'relationship_mapping': ['person', 'organization', 'group', 'network'],
      'threat_assessment': ['threat_actor', 'vulnerability', 'malware', 'attack_vector'],
      'vulnerability_report': ['cve', 'weakness', 'affected_system', 'patch'],
      'identity_profile': ['person', 'alias', 'account', 'contact'],
      'network_mapping': ['device', 'server', 'domain', 'ip_address'],
      'infrastructure_analysis': ['server', 'service', 'application', 'database'],
      'financial_intelligence': ['account', 'transaction', 'currency', 'institution'],
      'temporal_analysis': ['event', 'timeline', 'pattern', 'trend'],
      'geospatial_mapping': ['location', 'region', 'coordinate', 'facility']
    };

    const entityType = entityTypes[packageType][Math.floor(Math.random() * entityTypes[packageType].length)];
    
    return {
      id: uuidv4(),
      name: `${this.capitalizeFirstLetter(entityType)}-${Math.floor(Math.random() * 1000)}`,
      type: entityType,
      confidence,
      properties: this.generateMockProperties(entityType),
      sources: ['intel-analyzer'],
      identifiers: this.generateMockIdentifiers(entityType)
    };
  }

  /**
   * Generate mock properties for an entity
   */
  private generateMockProperties(entityType: string): Record<string, unknown> {
    const commonProperties = {
      detectedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Type-specific properties
    switch (entityType) {
      case 'person':
        return {
          ...commonProperties,
          estimatedAge: Math.floor(Math.random() * 50) + 18,
          locations: Math.random() > 0.5 ? ['New York', 'Boston'] : ['San Francisco'],
          occupation: Math.random() > 0.5 ? 'Developer' : 'Analyst'
        };
      case 'organization':
        return {
          ...commonProperties,
          size: Math.random() > 0.5 ? 'Large' : 'Small',
          industry: Math.random() > 0.5 ? 'Technology' : 'Finance',
          founded: 2000 + Math.floor(Math.random() * 23)
        };
      case 'ip_address':
        return {
          ...commonProperties,
          address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          geoLocation: 'United States',
          isp: Math.random() > 0.5 ? 'Comcast' : 'AT&T',
          status: Math.random() > 0.7 ? 'suspicious' : 'normal'
        };
      case 'domain':
        return {
          ...commonProperties,
          registrar: Math.random() > 0.5 ? 'GoDaddy' : 'Namecheap',
          created: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
          expires: new Date(Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString()
        };
      default:
        return commonProperties;
    }
  }

  /**
   * Generate mock identifiers for an entity
   */
  private generateMockIdentifiers(entityType: string): Record<string, string> | undefined {
    switch (entityType) {
      case 'person':
        return {
          email: `user${Math.floor(Math.random() * 1000)}@example.com`,
          username: `user_${Math.floor(Math.random() * 1000)}`
        };
      case 'organization':
        return {
          website: `https://org${Math.floor(Math.random() * 100)}.example.com`,
          tax_id: `ORG-${Math.floor(Math.random() * 10000)}`
        };
      case 'ip_address':
        return {
          address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
        };
      case 'domain':
        return {
          name: `domain${Math.floor(Math.random() * 100)}.example.com`
        };
      default:
        return undefined;
    }
  }

  /**
   * Get a random relationship type for the given package type
   */
  private getRandomRelationshipType(packageType: IntelPackageType): string {
    const relationshipTypes: Record<IntelPackageType, string[]> = {
      'entity_extraction': ['knows', 'member_of', 'affiliated_with'],
      'relationship_mapping': ['connected_to', 'communicates_with', 'reports_to'],
      'threat_assessment': ['targets', 'exploits', 'associated_with'],
      'vulnerability_report': ['affects', 'mitigated_by', 'discovered_by'],
      'identity_profile': ['owns', 'uses', 'controls'],
      'network_mapping': ['connects_to', 'hosts', 'routes_through'],
      'infrastructure_analysis': ['deployed_on', 'depends_on', 'accesses'],
      'financial_intelligence': ['transacts_with', 'funds', 'owns'],
      'temporal_analysis': ['precedes', 'triggers', 'coincides_with'],
      'geospatial_mapping': ['located_at', 'travels_to', 'operates_in']
    };

    const types = relationshipTypes[packageType];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Generate a summary for the analysis result
   */
  private generateSummary(packageType: IntelPackageType, entityCount: number, relationshipCount: number): string {
    const typeDescriptions: Record<IntelPackageType, string> = {
      'entity_extraction': 'entity extraction',
      'relationship_mapping': 'relationship mapping',
      'threat_assessment': 'threat assessment',
      'vulnerability_report': 'vulnerability analysis',
      'identity_profile': 'identity profiling',
      'network_mapping': 'network topology mapping',
      'infrastructure_analysis': 'infrastructure assessment',
      'financial_intelligence': 'financial activity analysis',
      'temporal_analysis': 'temporal pattern analysis',
      'geospatial_mapping': 'geospatial intelligence gathering'
    };

    return `This ${typeDescriptions[packageType]} package contains ${entityCount} entities and ${relationshipCount} relationships. The analysis was performed using advanced pattern recognition and machine learning algorithms to identify key intelligence elements.`;
  }

  /**
   * Utility to capitalize the first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Shutdown the adapter
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Intel Analyzer Adapter');
    // In a real implementation, this would disconnect from the IntelAnalyzer system
  }
}
