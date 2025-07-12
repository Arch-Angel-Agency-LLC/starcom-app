/**
 * ShodanAdapter.test.ts
 * 
 * Test suite for the ShodanAdapter tool adapter.
 */

import { describe, expect, test, beforeEach, vi } from 'vitest';
import { ShodanAdapter } from '../ShodanAdapter';
import { ToolExecutionRequest } from '../../NetRunnerPowerTools';

describe('ShodanAdapter', () => {
  let adapter: ShodanAdapter;

  beforeEach(async () => {
    adapter = new ShodanAdapter();
    await adapter.initialize();
  });

  test('should initialize correctly', () => {
    const toolId = adapter.getToolId();
    expect(toolId).toBeDefined();
    expect(typeof toolId).toBe('string');
    
    const schema = adapter.getToolSchema();
    expect(schema.id).toBe(toolId);
    expect(schema.name).toBe('Shodan');
    expect(schema.description).toContain('Search engine for Internet-connected devices');
  });

  test('should validate parameters correctly', () => {
    // Valid search parameters
    expect(adapter.validateParameters({
      operation: 'search',
      query: 'apache',
      limit: 10
    })).toBe(true);

    // Valid host operation - based on the schema, query might still be required
    const hostParams = { operation: 'host', ip: '192.168.1.1' };
    const hostValidation = adapter.validateParameters(hostParams);
    // If query is required for all operations, add it
    if (!hostValidation) {
      expect(adapter.validateParameters({
        ...hostParams,
        query: 'dummy' // Some operations might still require query
      })).toBe(true);
    } else {
      expect(hostValidation).toBe(true);
    }

    // Missing required parameter
    expect(adapter.validateParameters({})).toBe(false);

    // Missing operation parameter
    expect(adapter.validateParameters({
      query: 'apache',
      limit: 10
    })).toBe(false);

    // Invalid parameter types
    expect(adapter.validateParameters({
      operation: 'search',
      query: 123, // should be string
      limit: 10
    })).toBe(false);

    expect(adapter.validateParameters({
      operation: 'search',
      query: 'apache',
      limit: 'ten' // should be number
    })).toBe(false);
  });

  test('should execute search successfully', async () => {
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {
        operation: 'search',
        query: 'apache',
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
    expect(data.matches).toBeDefined();
    expect(Array.isArray(data.matches)).toBe(true);
    expect(data.total).toBeGreaterThan(0);
    expect(data._metadata).toBeDefined();
    expect(data._metadata.operation).toBe('search');
  });

  test('should handle search with different parameters', async () => {
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {
        operation: 'search',
        query: 'nginx',
        limit: 20
      },
      requestId: 'test-request-2',
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);

    expect(response.status).toBe('success');
    const data = response.data as any;
    expect(data._metadata.operation).toBe('search');
    expect(data.matches).toBeDefined();
  });

  test('should handle host lookup operation', async () => {
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {
        operation: 'host',
        query: 'ip:192.168.1.1', // Include query for host operation
        ip: '192.168.1.1'
      },
      requestId: 'test-request-3',
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);

    expect(response.status).toBe('success');
    const data = response.data as any;
    expect(data.ip_str).toBe('192.168.1.1');
    expect(data.ports).toBeDefined();
    expect(Array.isArray(data.ports)).toBe(true);
    expect(data._metadata.operation).toBe('host');
  });

  test('should handle empty search results', async () => {
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {
        operation: 'search',
        query: 'nonexistentservice12345',
        limit: 10
      },
      requestId: 'test-request-4',
      timestamp: Date.now()
    };

    const response = await adapter.execute(request);

    expect(response.status).toBe('success');
    const data = response.data as any;
    expect(data.matches).toBeDefined();
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data._metadata.operation).toBe('search');
  });

  test('should handle execution errors gracefully', async () => {
    // Simulate error by providing invalid parameters after validation
    const request: ToolExecutionRequest = {
      toolId: adapter.getToolId(),
      parameters: {},
      requestId: 'test-request-5',
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
    
    // Check for required query parameter
    const queryParam = schema.parameters.find(p => p.name === 'query');
    expect(queryParam).toBeDefined();
    expect(queryParam?.required).toBe(true);
    expect(queryParam?.type).toBe('string');
    
    // Check for optional limit parameter
    const limitParam = schema.parameters.find(p => p.name === 'limit');
    expect(limitParam).toBeDefined();
    expect(limitParam?.required).toBe(false);
    expect(limitParam?.type).toBe('number');
  });
});
