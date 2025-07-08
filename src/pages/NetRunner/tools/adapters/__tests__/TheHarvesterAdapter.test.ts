/**
 * TheHarvesterAdapter.test.ts
 * 
 * Test suite for the TheHarvesterAdapter tool adapter.
 */

import { describe, expect, test, beforeEach, vi } from 'vitest';
import { TheHarvesterAdapter } from '../TheHarvesterAdapter';
import { ToolExecutionRequest } from '../../NetRunnerPowerTools';

describe('TheHarvesterAdapter', () => {
  let adapter: TheHarvesterAdapter;

  beforeEach(async () => {
    adapter = new TheHarvesterAdapter();
    await adapter.initialize();
  });

  test('should initialize correctly', () => {
    const toolId = adapter.getToolId();
    expect(toolId).toBeDefined();
    expect(typeof toolId).toBe('string');
    
    const schema = adapter.getToolSchema();
    expect(schema.id).toBe(toolId);
    expect(schema.name).toBe('theHarvester');
    expect(schema.description).toContain('Email, subdomain and name harvester');
  });

  test('should validate parameters correctly', () => {
    // Valid email gathering parameters
    expect(adapter.validateParameters({
      operation: 'emails',
      domain: 'example.com',
      limit: 10
    })).toBe(true);

    // Valid subdomain gathering parameters
    expect(adapter.validateParameters({
      operation: 'subdomains',
      domain: 'example.com',
      limit: 20
    })).toBe(true);

    // Valid names gathering parameters (using company instead of domain)
    expect(adapter.validateParameters({
      operation: 'names',
      company: 'Acme Corp'
    })).toBe(true);

    // Missing required parameter
    expect(adapter.validateParameters({})).toBe(false);

    // Valid with just operation (domain is not required)
    expect(adapter.validateParameters({
      operation: 'emails'
    })).toBe(true);

    // Invalid parameter types
    expect(adapter.validateParameters({
      operation: 'emails',
      domain: 123, // should be string
      limit: 10
    })).toBe(false);

    expect(adapter.validateParameters({
      operation: 'emails',
      domain: 'example.com',
      limit: 'ten' // should be number
    })).toBe(false);

    // Invalid operation
    expect(adapter.validateParameters({
      operation: 'invalid_operation',
      domain: 'example.com',
      limit: 10
    })).toBe(false);
  });

  test('should execute email gathering successfully', async () => {
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {
        operation: 'emails',
        domain: 'example.com',
        limit: 5
      },
      requestId: 'test-request-1',
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);

    expect(response.status).toBe('success');
    expect(response.data).toBeDefined();
    expect(response.executionTime).toBeGreaterThan(0);
    expect(response.requestId).toBe('test-request-1');
    
    // Check the structure of returned data
    const data = response.data as any;
    expect(data.emails).toBeDefined();
    expect(Array.isArray(data.emails)).toBe(true);
    expect(data.domain).toBe('example.com');
    expect(data.count).toBeGreaterThanOrEqual(0);
    expect(data._metadata).toBeDefined();
    expect(data._metadata.operation).toBe('emails');
  });

  test('should execute subdomain gathering successfully', async () => {
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {
        operation: 'subdomains',
        domain: 'test.com',
        limit: 8
      },
      requestId: 'test-request-2',
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);

    expect(response.status).toBe('success');
    expect(response.data).toBeDefined();
    
    const data = response.data as any;
    expect(data.subdomains).toBeDefined();
    expect(Array.isArray(data.subdomains)).toBe(true);
    expect(data.domain).toBe('test.com');
    expect(data.count).toBeGreaterThanOrEqual(0);
    expect(data._metadata.operation).toBe('subdomains');
  });

  test('should execute name gathering successfully', async () => {
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {
        operation: 'names',
        company: 'Acme Corp'
      },
      requestId: 'test-request-3',
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);

    expect(response.status).toBe('success');
    expect(response.data).toBeDefined();
    
    const data = response.data as any;
    expect(data.names).toBeDefined();
    expect(Array.isArray(data.names)).toBe(true);
    expect(data.company).toBe('Acme Corp');
    expect(data._metadata.operation).toBe('names');
  });

  test('should handle execution errors gracefully', async () => {
    // Simulate error by providing invalid parameters
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {},
      requestId: 'test-request-4',
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);

    expect(response.status).toBe('error');
    expect(response.error).toBeDefined();
    expect(response.error).toContain('Invalid parameters');
  });

  test('should return correct tool schema', () => {
    const schema = adapter.getToolSchema();
    
    expect(schema.parameters).toBeDefined();
    expect(schema.parameters.length).toBeGreaterThan(0);
    
    // Check for required operation parameter
    const operationParam = schema.parameters.find(p => p.name === 'operation');
    expect(operationParam).toBeDefined();
    expect(operationParam?.required).toBe(true);
    expect(operationParam?.type).toBe('string');
    expect(operationParam?.options).toContain('emails');
    expect(operationParam?.options).toContain('subdomains');
    expect(operationParam?.options).toContain('names');
    
    // Check for optional domain parameter
    const domainParam = schema.parameters.find(p => p.name === 'domain');
    expect(domainParam).toBeDefined();
    expect(domainParam?.required).toBe(false); // domain is optional
    expect(domainParam?.type).toBe('string');
    
    // Check for optional limit parameter
    const limitParam = schema.parameters.find(p => p.name === 'limit');
    expect(limitParam).toBeDefined();
    expect(limitParam?.required).toBe(false);
    expect(limitParam?.type).toBe('number');
  });

  test('should handle different limit values', async () => {
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {
        operation: 'emails',
        domain: 'bigcorp.com',
        limit: 50
      },
      requestId: 'test-request-5',
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);

    expect(response.status).toBe('success');
    const data = response.data as any;
    expect(data.emails).toBeDefined();
    expect(data.domain).toBe('bigcorp.com');
  });
});
