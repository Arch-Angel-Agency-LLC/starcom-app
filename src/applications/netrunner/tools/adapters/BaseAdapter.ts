/**
 * BaseAdapter.ts
 * 
 * Base class implementation for NetRunner tool adapters.
 * Provides common functionality and helper methods for all tool adapters.
 */

import { 
  ToolAdapter, 
  ToolSchema, 
  ToolExecutionRequest, 
  ToolExecutionResponse
} from '../NetRunnerPowerTools';

export abstract class BaseAdapter implements ToolAdapter {
  protected toolId: string;
  protected toolSchema: ToolSchema;
  protected initialized: boolean = false;
  
  constructor(toolId: string, toolSchema: ToolSchema) {
    this.toolId = toolId;
    this.toolSchema = toolSchema;
  }

  getToolId(): string {
    return this.toolId;
  }

  getToolSchema(): ToolSchema {
    return this.toolSchema;
  }

  validateParameters(params: Record<string, unknown>): boolean {
    // Check that all required parameters are provided
    for (const param of this.toolSchema.parameters) {
      if (param.required && !(param.name in params)) {
        console.error(`Missing required parameter: ${param.name}`);
        return false;
      }

      // Skip validation for parameters not provided
      if (!(param.name in params)) continue;

      const value = params[param.name];
      
      // Type validation
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      if (param.type === 'object' && valueType !== 'object') {
        console.error(`Parameter ${param.name} should be an object`);
        return false;
      } else if (param.type === 'array' && !Array.isArray(value)) {
        console.error(`Parameter ${param.name} should be an array`);
        return false;
      } else if (
        (param.type === 'string' || param.type === 'number' || param.type === 'boolean') && 
        typeof value !== param.type
      ) {
        console.error(`Parameter ${param.name} should be a ${param.type}`);
        return false;
      }

      // Validation rules for numbers
      if (param.type === 'number' && typeof value === 'number' && param.validation) {
        if (param.validation.min !== undefined && value < param.validation.min) {
          console.error(`Parameter ${param.name} should be >= ${param.validation.min}`);
          return false;
        }
        if (param.validation.max !== undefined && value > param.validation.max) {
          console.error(`Parameter ${param.name} should be <= ${param.validation.max}`);
          return false;
        }
      }

      // Validation rules for strings
      if (param.type === 'string' && typeof value === 'string' && param.validation?.pattern) {
        const regex = new RegExp(param.validation.pattern);
        if (!regex.test(value)) {
          console.error(`Parameter ${param.name} does not match pattern ${param.validation.pattern}`);
          return false;
        }
      }

      // Validation for options
      if (param.options) {
        const valueStr = String(value);
        const optionsAsStrings = param.options.map(opt => String(opt));
        if (!optionsAsStrings.includes(valueStr)) {
          console.error(`Parameter ${param.name} should be one of ${param.options.join(', ')}`);
          return false;
        }
      }
    }

    return true;
  }

  abstract execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse>;

  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
  }

  protected createErrorResponse(
    request: ToolExecutionRequest, 
    errorMessage: string
  ): ToolExecutionResponse {
    return {
      requestId: request.requestId,
      toolId: request.toolId,
      status: 'error',
      data: null,
      error: errorMessage,
      timestamp: Date.now()
    };
  }

  protected createSuccessResponse(
    request: ToolExecutionRequest, 
    data: unknown,
    executionTime?: number
  ): ToolExecutionResponse {
    return {
      requestId: request.requestId,
      toolId: request.toolId,
      status: 'success',
      data,
      executionTime,
      timestamp: Date.now()
    };
  }

  protected createInProgressResponse(
    request: ToolExecutionRequest
  ): ToolExecutionResponse {
    return {
      requestId: request.requestId,
      toolId: request.toolId,
      status: 'in_progress',
      data: null,
      timestamp: Date.now()
    };
  }
}
