/**
 * Configuration Validation Utilities
 * Type-safe configuration management and validation
 */

import type { ConfigurationSchema, ValidationResult, Validator } from '../types/core/command';

/**
 * Type-safe configuration manager with validation
 */
export class ConfigValidator {
  /**
   * Validates a configuration object against a schema
   */
  static validate<T>(
    config: unknown, 
    schema: ConfigurationSchema<T>
  ): ValidationResult<T> {
    try {
      const result = {} as T;
      const errors: string[] = [];
      const configObj = config as Record<string, unknown>;

      // Check each field in the schema
      for (const [key, fieldSchemaEntry] of Object.entries(schema)) {
        const fieldSchema = fieldSchemaEntry as {
          value: unknown;
          required: boolean;
          validator?: Validator<unknown>;
          description?: string;
        };
        const value = configObj?.[key];
        
        // Check if required field is missing
        if (fieldSchema.required && (value === undefined || value === null)) {
          errors.push(`Required field '${key}' is missing`);
          continue;
        }

        // Use provided validator if available
        if (fieldSchema.validator && value !== undefined) {
          if (!fieldSchema.validator(value)) {
            errors.push(`Field '${key}' failed validation`);
            continue;
          }
        }

        // Assign value (use default if undefined and not required)
        if (value !== undefined) {
          (result as Record<string, unknown>)[key] = value;
        } else if (!fieldSchema.required) {
          (result as Record<string, unknown>)[key] = fieldSchema.value;
        }
      }

      if (errors.length > 0) {
        return { success: false, error: errors.join(', ') };
      }

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Creates a type-safe validator function
   */
  static createValidator<T>(typeName: string, checkFn: (value: unknown) => boolean): Validator<T> {
    return (value: unknown): value is T => {
      try {
        return checkFn(value);
      } catch {
        return false;
      }
    };
  }
}

// Common validators for immediate use
export const validators = {
  string: ConfigValidator.createValidator<string>(
    'string',
    (value) => typeof value === 'string'
  ),
  
  number: ConfigValidator.createValidator<number>(
    'number',
    (value) => typeof value === 'number' && !isNaN(value)
  ),
  
  boolean: ConfigValidator.createValidator<boolean>(
    'boolean',
    (value) => typeof value === 'boolean'
  ),
  
  nonEmptyString: ConfigValidator.createValidator<string>(
    'nonEmptyString',
    (value) => typeof value === 'string' && value.trim().length > 0
  ),
  
  positiveNumber: ConfigValidator.createValidator<number>(
    'positiveNumber',
    (value) => typeof value === 'number' && value > 0
  ),
  
  url: ConfigValidator.createValidator<string>(
    'url',
    (value) => {
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  ),
  
  array: <T>(itemValidator?: Validator<T>) => 
    ConfigValidator.createValidator<T[]>(
      'array',
      (value) => {
        if (!Array.isArray(value)) return false;
        if (!itemValidator) return true;
        return value.every(item => itemValidator(item));
      }
    )
};

/**
 * Environment-specific configuration helper
 */
export class EnvironmentConfig {
  /**
   * Gets environment variable with type validation
   */
  static get<T>(
    key: string, 
    validator: Validator<T>, 
    defaultValue?: T
  ): T | undefined {
    const value = process.env[key] || (import.meta.env && import.meta.env[key]);
    
    if (value !== undefined && validator(value)) {
      return value;
    }
    
    return defaultValue;
  }

  /**
   * Gets required environment variable with validation
   */
  static getRequired<T>(key: string, validator: Validator<T>): T {
    const value = this.get(key, validator);
    if (value === undefined) {
      throw new Error(`Required environment variable '${key}' is missing or invalid`);
    }
    return value;
  }
}
