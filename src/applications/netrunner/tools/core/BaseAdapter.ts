/**
 * NetRunner Tool Adapter Base Classes
 * 
 * Base classes and interfaces for implementing OSINT tool adapters with
 * standardized error handling and logging.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { Logger, LoggerFactory, OperationLogger } from '../../services/logging';
import { NetRunnerErrorHandler, ErrorFactory, ToolExecutionError } from '../../services/error';
import { ToolExecutionRequest, ToolExecutionResponse, OSINTDataItem } from '../../models';

/**
 * Tool configuration interface
 */
export interface ToolConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  timeout: number;
  retries: number;
  rateLimit?: {
    requestsPerSecond: number;
    burstLimit: number;
  };
  authentication?: {
    type: 'none' | 'api_key' | 'oauth' | 'basic';
    config: Record<string, unknown>;
  };
}

/**
 * Tool validation schema interface
 */
export interface ToolValidationSchema {
  parameters: {
    required: string[];
    optional: string[];
    types: Record<string, string>;
    validation: Record<string, (value: unknown) => boolean>;
  };
}

/**
 * Base Tool Adapter Class
 * 
 * Provides standardized foundation for all OSINT tool adapters with
 * built-in error handling, logging, and parameter validation.
 */
export abstract class BaseToolAdapter {
  protected readonly config: ToolConfig;
  protected readonly schema: ToolValidationSchema;
  protected readonly logger: Logger;
  protected readonly errorHandler: NetRunnerErrorHandler;

  constructor(config: ToolConfig, schema: ToolValidationSchema) {
    this.config = config;
    this.schema = schema;
    this.logger = LoggerFactory.getLogger(`NetRunner:Adapter:${config.name}`);
    this.errorHandler = new NetRunnerErrorHandler();
  }

  /**
   * Execute the tool with the given request
   */
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    const operationLogger = new OperationLogger(
      this.logger, 
      'tool_execution',
      { toolId: this.config.id, requestId: request.id }
    );

    operationLogger.start(`Executing tool: ${this.config.name}`);

    try {
      // Validate the request
      await this.validateRequest(request);

      // Execute the tool-specific logic
      const startTime = new Date().toISOString();
      const data = await this.executeInternal(request, operationLogger);
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      const response: ToolExecutionResponse = {
        requestId: request.id,
        status: 'success',
        startTime,
        endTime,
        duration,
        data,
        metadata: {
          toolVersion: this.config.version,
          resourcesUsed: await this.getResourceUsage(),
          performance: await this.getPerformanceMetrics()
        },
        correlationId: request.context.correlationId
      };

      operationLogger.success(`Tool execution completed successfully`, {
        resultCount: data?.length || 0,
        duration
      });

      return response;

    } catch (error) {
      const toolError = error instanceof ToolExecutionError 
        ? error 
        : ErrorFactory.createToolError(
            `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            'NET-TOOL-001',
            {
              component: `NetRunner:Adapter:${this.config.name}`,
              details: { toolId: this.config.id, requestId: request.id },
              cause: error instanceof Error ? error : undefined,
              correlationId: request.context.correlationId
            }
          );

      operationLogger.failure(toolError, `Tool execution failed`);

      const response: ToolExecutionResponse = {
        requestId: request.id,
        status: 'failure',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
        error: {
          code: toolError.code,
          message: toolError.message,
          details: toolError.details
        },
        metadata: {
          toolVersion: this.config.version
        },
        correlationId: request.context.correlationId
      };

      return response;
    }
  }

  /**
   * Validate tool execution request
   */
  protected async validateRequest(request: ToolExecutionRequest): Promise<void> {
    // Check required parameters
    for (const param of this.schema.parameters.required) {
      if (!(param in request.parameters)) {
        throw ErrorFactory.createToolError(
          `Missing required parameter: ${param}`,
          'NET-TOOL-003',
          {
            component: `NetRunner:Adapter:${this.config.name}`,
            details: { parameter: param, requestId: request.id },
            correlationId: request.context.correlationId
          }
        );
      }
    }

    // Validate parameter types and values
    for (const [param, value] of Object.entries(request.parameters)) {
      if (this.schema.parameters.types[param]) {
        const expectedType = this.schema.parameters.types[param];
        const actualType = typeof value;
        
        if (actualType !== expectedType) {
          throw ErrorFactory.createToolError(
            `Invalid parameter type for ${param}: expected ${expectedType}, got ${actualType}`,
            'NET-TOOL-003',
            {
              component: `NetRunner:Adapter:${this.config.name}`,
              details: { parameter: param, expectedType, actualType, requestId: request.id },
              correlationId: request.context.correlationId
            }
          );
        }
      }

      // Custom validation
      if (this.schema.parameters.validation[param]) {
        const isValid = this.schema.parameters.validation[param](value);
        if (!isValid) {
          throw ErrorFactory.createToolError(
            `Invalid parameter value for ${param}`,
            'NET-TOOL-003',
            {
              component: `NetRunner:Adapter:${this.config.name}`,
              details: { parameter: param, value, requestId: request.id },
              correlationId: request.context.correlationId
            }
          );
        }
      }
    }
  }

  /**
   * Abstract method for tool-specific execution logic
   */
  protected abstract executeInternal(
    request: ToolExecutionRequest, 
    operationLogger: OperationLogger
  ): Promise<OSINTDataItem[]>;

  /**
   * Get current resource usage (override in subclasses)
   */
  protected async getResourceUsage(): Promise<{ cpu?: number; memory?: number; network?: number }> {
    return {};
  }

  /**
   * Get performance metrics (override in subclasses)
   */
  protected async getPerformanceMetrics(): Promise<{ requestsPerSecond?: number; avgResponseTime?: number }> {
    return {};
  }

  /**
   * Get tool configuration
   */
  getConfig(): ToolConfig {
    return { ...this.config };
  }

  /**
   * Get tool validation schema
   */
  getSchema(): ToolValidationSchema {
    return { ...this.schema };
  }

  /**
   * Check if the adapter supports a specific capability
   */
  hasCapability(capability: string): boolean {
    return this.config.capabilities.includes(capability);
  }
}

/**
 * HTTP-based Tool Adapter
 * 
 * Specialized adapter for tools that communicate via HTTP APIs
 */
export abstract class HTTPToolAdapter extends BaseToolAdapter {
  protected readonly baseUrl: string;
  protected readonly headers: Record<string, string>;

  constructor(
    config: ToolConfig, 
    schema: ToolValidationSchema, 
    baseUrl: string,
    headers: Record<string, string> = {}
  ) {
    super(config, schema);
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': `NetRunner-${this.config.name}/${this.config.version}`,
      ...headers
    };
  }

  /**
   * Make HTTP request with error handling
   */
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = { ...this.headers, ...customHeaders };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw ErrorFactory.createAdapterError(
          `HTTP request failed: ${response.status} ${response.statusText}`,
          'NET-ADAPT-003',
          {
            component: `NetRunner:Adapter:${this.config.name}`,
            details: { 
              url, 
              method, 
              status: response.status, 
              statusText: response.statusText 
            },
            severity: response.status >= 500 ? 'high' : 'medium'
          }
        );
      }

      return await response.json() as T;

    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw ErrorFactory.toolTimeout(this.config.id, this.config.timeout);
      }

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw ErrorFactory.createAdapterError(
        `HTTP request failed: ${error instanceof Error ? error.message : String(error)}`,
        'NET-ADAPT-003',
        {
          component: `NetRunner:Adapter:${this.config.name}`,
          details: { url, method },
          cause: error instanceof Error ? error : undefined
        }
      );
    }
  }
}

/**
 * Tool Adapter Registry
 * 
 * Manages registration and retrieval of tool adapters
 */
export class ToolAdapterRegistry {
  private static adapters = new Map<string, BaseToolAdapter>();
  private static logger = LoggerFactory.getLogger('NetRunner:ToolRegistry');

  /**
   * Register a tool adapter
   */
  static register(adapter: BaseToolAdapter): void {
    const config = adapter.getConfig();
    this.adapters.set(config.id, adapter);
    this.logger.info(`Tool adapter registered: ${config.name}`, {
      toolId: config.id,
      version: config.version,
      capabilities: config.capabilities
    });
  }

  /**
   * Get a tool adapter by ID
   */
  static get(toolId: string): BaseToolAdapter | undefined {
    return this.adapters.get(toolId);
  }

  /**
   * Get all registered tool adapters
   */
  static getAll(): Map<string, BaseToolAdapter> {
    return new Map(this.adapters);
  }

  /**
   * Get adapters that support a specific capability
   */
  static getByCapability(capability: string): BaseToolAdapter[] {
    return Array.from(this.adapters.values()).filter(adapter => 
      adapter.hasCapability(capability)
    );
  }

  /**
   * Remove a tool adapter
   */
  static unregister(toolId: string): boolean {
    const success = this.adapters.delete(toolId);
    if (success) {
      this.logger.info(`Tool adapter unregistered: ${toolId}`);
    }
    return success;
  }

  /**
   * Check if a tool adapter is registered
   */
  static has(toolId: string): boolean {
    return this.adapters.has(toolId);
  }

  /**
   * Get registry statistics
   */
  static getStats(): {
    totalAdapters: number;
    capabilities: Record<string, number>;
    versions: Record<string, string[]>;
  } {
    const capabilities: Record<string, number> = {};
    const versions: Record<string, string[]> = {};

    for (const adapter of Array.from(this.adapters.values())) {
      const config = adapter.getConfig();
      
      // Count capabilities
      for (const capability of config.capabilities) {
        capabilities[capability] = (capabilities[capability] || 0) + 1;
      }
      
      // Track versions
      if (!versions[config.name]) {
        versions[config.name] = [];
      }
      versions[config.name].push(config.version);
    }

    return {
      totalAdapters: this.adapters.size,
      capabilities,
      versions
    };
  }
}
