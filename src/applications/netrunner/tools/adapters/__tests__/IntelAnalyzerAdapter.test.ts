/**
 * IntelAnalyzerAdapter.test.ts
 * 
 * Test suite for IntelAnalyzerAdapter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntelAnalyzerAdapter, IntelAnalysisResult } from '../IntelAnalyzerAdapter';
import { ToolExecutionRequest } from '../../NetRunnerPowerTools';

describe('IntelAnalyzerAdapter', () => {
  let adapter: IntelAnalyzerAdapter;

  beforeEach(async () => {
    adapter = new IntelAnalyzerAdapter();
    await adapter.initialize();
  });

  it('should initialize correctly', async () => {
    expect(adapter.getToolId()).toBe('intel-analyzer');
    expect(adapter['initialized']).toBe(true);
  });

  it('should validate parameters correctly', () => {
    // Valid parameters
    expect(adapter.validateParameters({
      data: { text: 'test data with email@example.com' },
      packageType: 'entity_extraction'
    })).toBe(true);

    // Missing required parameters
    expect(adapter.validateParameters({})).toBe(false);
    expect(adapter.validateParameters({ data: 'test' })).toBe(false);
    expect(adapter.validateParameters({ packageType: 'entity_extraction' })).toBe(false);

    // Invalid packageType
    expect(adapter.validateParameters({
      data: 'test',
      packageType: 'invalid_type'
    })).toBe(false);

    // Invalid analysisDepth
    expect(adapter.validateParameters({
      data: 'test',
      packageType: 'entity_extraction',
      analysisDepth: 'invalid_depth'
    })).toBe(false);

    // Invalid confidenceThreshold
    expect(adapter.validateParameters({
      data: 'test',
      packageType: 'entity_extraction',
      confidenceThreshold: 2.0
    })).toBe(false);

    expect(adapter.validateParameters({
      data: 'test',
      packageType: 'entity_extraction',
      confidenceThreshold: -0.5
    })).toBe(false);
  });

  it('should execute entity extraction successfully', async () => {
    const request: ToolExecutionRequest = {
      requestId: 'test-1',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Contact us at admin@example.com or visit https://example.com. Server IP: 192.168.1.1',
        packageType: 'entity_extraction',
        analysisDepth: 'standard',
        confidenceThreshold: 0.7
      },
      timestamp: Date.now()
    };

  const response = await adapter.execute(request);
    
  expect(response.status).toBe('success');
  expect(response.data).toBeDefined();
    
  const result = response.data as IntelAnalysisResult;
    expect(result.packageType).toBe('entity_extraction');
    expect(result.entities).toBeDefined();
    expect(Array.isArray(result.entities)).toBe(true);
    expect(result.relationships).toBeDefined();
    expect(Array.isArray(result.relationships)).toBe(true);
    expect(result.evidence).toBeDefined();
    expect(Array.isArray(result.evidence)).toBe(true);
    expect(typeof result.confidence).toBe('number');
    expect(result.metadata.analysisEngine).toBe('RealIntelAnalysisEngine');
  });

  it('should extract email entities correctly', async () => {
    const request: ToolExecutionRequest = {
      requestId: 'test-email',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Contact admin@company.com or support@domain.org for assistance',
        packageType: 'entity_extraction',
        confidenceThreshold: 0.5
      },
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);
    
    expect(response.status).toBe('success');
  const result = response.data as IntelAnalysisResult;
  const entities = result.entities;
    
  // Should find contact (email) entities
  const emailEntities = entities.filter((e: any) => e.type === 'contact');
    expect(emailEntities.length).toBeGreaterThan(0);
    
    // Check email entity properties
    const emailEntity = emailEntities[0];
    expect(emailEntity.name).toMatch(/@/);
    expect(emailEntity.confidence).toBeGreaterThanOrEqual(0.5);
  expect(emailEntity.properties).toBeDefined();
  expect((emailEntity.properties as any).localPart).toBeDefined();
  expect((emailEntity.properties as any).domain).toBeDefined();
  });

  it('should extract IP address entities correctly', async () => {
    const request: ToolExecutionRequest = {
      requestId: 'test-ip',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Server located at 192.168.1.100 and backup at 10.0.0.5',
        packageType: 'network_mapping',
        confidenceThreshold: 0.6
      },
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);
    
    expect(response.status).toBe('success');
  const entities = (response.data as IntelAnalysisResult).entities;
    
    // Should find IP address entities
  const ipEntities = entities.filter((e: any) => e.type === 'asset');
    expect(ipEntities.length).toBeGreaterThan(0);
    
    // Check IP entity properties
    const ipEntity = ipEntities[0];
    expect(ipEntity.name).toMatch(/\d+\.\d+\.\d+\.\d+/);
    expect(ipEntity.confidence).toBeGreaterThanOrEqual(0.6);
    expect(ipEntity.properties.isPrivate).toBeDefined();
  });

  it('should handle financial intelligence analysis', async () => {
    const request: ToolExecutionRequest = {
      requestId: 'test-financial',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Bitcoin address: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa transaction detected',
        packageType: 'financial_intelligence',
        confidenceThreshold: 0.7
      },
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);
    
    expect(response.status).toBe('success');
  const entities = (response.data as IntelAnalysisResult).entities;
    
    // Should find cryptocurrency entities
  const cryptoEntities = entities.filter((e: any) => e.type === 'asset');
    expect(cryptoEntities.length).toBeGreaterThan(0);
    
    const cryptoEntity = cryptoEntities[0];
  expect((cryptoEntity.metadata as any).currency || (cryptoEntity.properties as any).currency).toBe('bitcoin');
    expect(cryptoEntity.confidence).toBe(0.85);
  });

  it('should analyze relationships between entities', async () => {
    const request: ToolExecutionRequest = {
      requestId: 'test-relationships',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Email contact@example.com is hosted on domain example.com at IP 192.168.1.1',
        packageType: 'relationship_mapping',
        confidenceThreshold: 0.5
      },
      timestamp: Date.now()
    };

  const response = await adapter.execute(request);
    
  expect(response.status).toBe('success');
  const relationships = (response.data as IntelAnalysisResult).relationships;
    
    // Should find relationships between entities
    expect(Array.isArray(relationships)).toBe(true);
    
    if (relationships.length > 0) {
      const relationship = relationships[0];
  expect(relationship.id).toBeDefined();
  expect(relationship.sourceId).toBeDefined();
  expect(relationship.targetId).toBeDefined();
      expect(relationship.type).toBeDefined();
      expect(typeof relationship.confidence).toBe('number');
      expect(relationship.confidence).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('should handle threat assessment analysis', async () => {
    const request: ToolExecutionRequest = {
      requestId: 'test-threat',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Detected ransomware activity and trojan infection in the network',
        packageType: 'threat_assessment',
        confidenceThreshold: 0.6
      },
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);
    
    expect(response.status).toBe('success');
  const entities = (response.data as IntelAnalysisResult).entities;
    
    // Should find malware entities
  const malwareEntities = entities.filter((e: any) => e.type === 'technology');
    expect(malwareEntities.length).toBeGreaterThan(0);
    
    const malwareEntity = malwareEntities[0];
  expect((malwareEntity.metadata as any).category).toBe('malware_family');
    expect(malwareEntity.confidence).toBe(0.8);
  });

  it('should handle different analysis depths', async () => {
    const basicRequest: ToolExecutionRequest = {
      requestId: 'test-basic',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Test data with admin@test.com and 192.168.1.1',
        packageType: 'entity_extraction',
        analysisDepth: 'basic',
        confidenceThreshold: 0.5
      },
      timestamp: Date.now()
    };

    const deepRequest: ToolExecutionRequest = {
      requestId: 'test-deep',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Test data with admin@test.com and 192.168.1.1',
        packageType: 'entity_extraction',
        analysisDepth: 'deep',
        confidenceThreshold: 0.5
      },
      timestamp: Date.now()
    };

    const basicResponse = await adapter.execute(basicRequest);
    const deepResponse = await adapter.execute(deepRequest);
    
  expect(basicResponse.status).toBe('success');
  expect(deepResponse.status).toBe('success');
    
  // Both should work but may have different metadata
  expect((basicResponse.data as IntelAnalysisResult).metadata.analysisDepth).toBe('basic');
  expect((deepResponse.data as IntelAnalysisResult).metadata.analysisDepth).toBe('deep');
  });

  it('should include raw data when requested', async () => {
    const request: ToolExecutionRequest = {
      requestId: 'test-raw-data',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Test data with admin@example.com',
        packageType: 'entity_extraction',
        includeRawData: true
      },
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);
    
  expect(response.status).toBe('success');
  expect((response.data as IntelAnalysisResult).rawData).toBeDefined();
  expect((response.data as IntelAnalysisResult).rawData).toBe('Test data with admin@example.com');
  });

  it('should handle execution errors gracefully', async () => {
    const request: ToolExecutionRequest = {
      requestId: 'test-error',
      toolId: 'intel-analyzer',
      parameters: {
        // Missing required parameters
      },
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);
    
    expect(response.status).toBe('error');
    expect(response.error).toBeDefined();
    expect(response.data).toBeNull();
  });

  it('should return correct tool schema', () => {
    const schema = adapter.getToolSchema();
    
    expect(schema.id).toBe('intel-analyzer');
    expect(schema.name).toBe('Intel Analyzer');
    expect(schema.parameters).toBeDefined();
    expect(Array.isArray(schema.parameters)).toBe(true);
    
    // Check required parameters
    const requiredParams = schema.parameters.filter(p => p.required);
    expect(requiredParams.length).toBeGreaterThan(0);
    
    const dataParam = schema.parameters.find(p => p.name === 'data');
    expect(dataParam).toBeDefined();
    expect(dataParam?.required).toBe(true);
    
    const packageTypeParam = schema.parameters.find(p => p.name === 'packageType');
    expect(packageTypeParam).toBeDefined();
    expect(packageTypeParam?.required).toBe(true);
    expect(packageTypeParam?.options).toBeDefined();
    expect(packageTypeParam?.options?.length).toBeGreaterThan(0);
  });

  it('should filter entities by confidence threshold', async () => {
    const lowThresholdRequest: ToolExecutionRequest = {
      requestId: 'test-low-threshold',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Contact admin@example.com for support',
        packageType: 'entity_extraction',
        confidenceThreshold: 0.3
      },
      timestamp: Date.now()
    };

    const highThresholdRequest: ToolExecutionRequest = {
      requestId: 'test-high-threshold',
      toolId: 'intel-analyzer',
      parameters: {
        data: 'Contact admin@example.com for support',
        packageType: 'entity_extraction',
        confidenceThreshold: 0.9
      },
      timestamp: Date.now()
    };

    const lowResponse = await adapter.execute(lowThresholdRequest);
    const highResponse = await adapter.execute(highThresholdRequest);
    
  expect(lowResponse.status).toBe('success');
  expect(highResponse.status).toBe('success');
    
  // Low threshold should generally return more entities
  const lowEntities = (lowResponse.data as IntelAnalysisResult).entities;
  const highEntities = (highResponse.data as IntelAnalysisResult).entities;
    
    // All entities should meet their respective thresholds
    lowEntities.forEach((entity: any) => {
      expect(entity.confidence).toBeGreaterThanOrEqual(0.3);
    });
    
    highEntities.forEach((entity: any) => {
      expect(entity.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });
});
