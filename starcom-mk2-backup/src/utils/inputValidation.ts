/**
 * Input Validation and Sanitization Utilities
 * Comprehensive security controls for user input processing
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: unknown;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: (string | number)[];
  customValidator?: (value: unknown) => boolean;
  sanitizer?: (value: unknown) => unknown;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

class InputValidator {
  private static instance: InputValidator;
  
  // Security patterns
  private readonly PATTERNS = {
    // Blockchain addresses
    ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
    bitcoinAddress: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    
    // Identifiers
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    nostrPublicKey: /^[0-9a-f]{64}$/i,
    
    // Content validation
    safeFilename: /^[a-zA-Z0-9._-]+$/,
    safeUrl: /^https?:\/\/[^\s<>"']+$/,
    
    // Basic security
    alphanumeric: /^[a-zA-Z0-9]+$/,
    alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
    noScriptTags: /^(?!.*<script|.*javascript:|.*on\w+\s*=).+$/i,
    sqlInjection: /(union|select|insert|update|delete|drop|create|alter|exec|execute|--|\/\*|\*\/)/i,
    xssPatterns: /(<script|javascript:|on\w+\s*=|<iframe|<object|<embed)/i,
  } as const;

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Validate a single value against a rule
   */
  validateValue(value: unknown, rule: ValidationRule): ValidationResult {
    const errors: string[] = [];
    let sanitized = value;

    // Type checking
    if (value === null || value === undefined) {
      if (rule.required) {
        errors.push('Value is required');
      }
      return { isValid: errors.length === 0, errors, sanitized: null };
    }

    // Convert to string for most validations
    const stringValue = String(value);

    // Length validation
    if (rule.minLength !== undefined && stringValue.length < rule.minLength) {
      errors.push(`Value must be at least ${rule.minLength} characters long`);
    }

    if (rule.maxLength !== undefined && stringValue.length > rule.maxLength) {
      errors.push(`Value must be at most ${rule.maxLength} characters long`);
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      errors.push('Value does not match required format');
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value as string | number)) {
      errors.push('Value is not in the list of allowed values');
    }

    // Custom validation
    if (rule.customValidator && !rule.customValidator(value)) {
      errors.push('Value failed custom validation');
    }

    // Security checks
    if (this.containsSqlInjection(stringValue)) {
      errors.push('Value contains potentially dangerous SQL patterns');
    }

    if (this.containsXss(stringValue)) {
      errors.push('Value contains potentially dangerous script content');
    }

    // Apply sanitization
    if (rule.sanitizer) {
      sanitized = rule.sanitizer(value);
    } else {
      sanitized = this.basicSanitize(stringValue);
    }

    return { 
      isValid: errors.length === 0, 
      errors, 
      sanitized: errors.length === 0 ? sanitized : value 
    };
  }

  /**
   * Validate an object against a schema
   */
  validateObject(data: Record<string, unknown>, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const sanitized: Record<string, unknown> = {};

    // Validate each field in the schema
    for (const [field, rule] of Object.entries(schema)) {
      const fieldResult = this.validateValue(data[field], rule);
      
      if (!fieldResult.isValid) {
        errors.push(...fieldResult.errors.map(error => `${field}: ${error}`));
      } else {
        sanitized[field] = fieldResult.sanitized;
      }
    }

    // Check for unexpected fields (potential injection attempt)
    const allowedFields = Object.keys(schema);
    const providedFields = Object.keys(data);
    const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (unexpectedFields.length > 0) {
      errors.push(`Unexpected fields detected: ${unexpectedFields.join(', ')}`);
    }

    return { 
      isValid: errors.length === 0, 
      errors, 
      sanitized: errors.length === 0 ? sanitized : data 
    };
  }

  /**
   * Security-focused sanitization methods
   */
  basicSanitize(input: string): string {
    if (typeof input !== 'string') {
      return String(input);
    }

    return input
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, 10000); // Limit length
  }

  htmlEscape(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  sqlEscape(input: string): string {
    return input.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  removeControlCharacters(input: string): string {
    // Remove control characters using character codes
    return input.split('').filter(char => {
      const code = char.charCodeAt(0);
      return !(code < 32 || code === 127 || (code >= 128 && code <= 159));
    }).join('');
  }

  /**
   * Security detection methods
   */
  containsSqlInjection(input: string): boolean {
    return this.PATTERNS.sqlInjection.test(input);
  }

  containsXss(input: string): boolean {
    return this.PATTERNS.xssPatterns.test(input);
  }

  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  isValidEthereumAddress(address: string): boolean {
    return this.PATTERNS.ethereumAddress.test(address);
  }

  isValidUuid(uuid: string): boolean {
    return this.PATTERNS.uuid.test(uuid);
  }

  isValidNostrKey(key: string): boolean {
    return this.PATTERNS.nostrPublicKey.test(key);
  }

  /**
   * Common validation schemas
   */
  getInvestigationSchema(): ValidationSchema {
    return {
      title: {
        required: true,
        minLength: 1,
        maxLength: 200,
        pattern: this.PATTERNS.noScriptTags
      },
      description: {
        required: false,
        maxLength: 5000,
        pattern: this.PATTERNS.noScriptTags
      },
      priority: {
        required: true,
        allowedValues: ['low', 'medium', 'high', 'critical']
      },
      status: {
        required: true,
        allowedValues: ['draft', 'active', 'on_hold', 'completed', 'archived']
      },
      created_by: {
        required: true,
        minLength: 1,
        maxLength: 100,
        pattern: this.PATTERNS.alphanumericWithSpaces
      }
    };
  }

  getTaskSchema(): ValidationSchema {
    return {
      title: {
        required: true,
        minLength: 1,
        maxLength: 200,
        pattern: this.PATTERNS.noScriptTags
      },
      description: {
        required: false,
        maxLength: 2000,
        pattern: this.PATTERNS.noScriptTags
      },
      priority: {
        required: true,
        allowedValues: ['low', 'medium', 'high', 'critical']
      },
      status: {
        required: true,
        allowedValues: ['todo', 'in_progress', 'blocked', 'completed']
      },
      assigned_to: {
        required: false,
        maxLength: 100,
        pattern: this.PATTERNS.alphanumericWithSpaces
      }
    };
  }

  getEvidenceSchema(): ValidationSchema {
    return {
      title: {
        required: true,
        minLength: 1,
        maxLength: 200,
        pattern: this.PATTERNS.noScriptTags
      },
      description: {
        required: false,
        maxLength: 2000,
        pattern: this.PATTERNS.noScriptTags
      },
      evidence_type: {
        required: true,
        allowedValues: ['document', 'image', 'video', 'audio', 'log', 'network', 'other']
      },
      source_url: {
        required: false,
        customValidator: (value) => !value || this.isValidUrl(String(value))
      },
      collected_by: {
        required: true,
        minLength: 1,
        maxLength: 100,
        pattern: this.PATTERNS.alphanumericWithSpaces
      }
    };
  }

  /**
   * Rate limiting helpers
   */
  createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return {
      isAllowed: (identifier: string): boolean => {
        const now = Date.now();
        const existing = requests.get(identifier);

        if (!existing || now > existing.resetTime) {
          requests.set(identifier, { count: 1, resetTime: now + windowMs });
          return true;
        }

        if (existing.count >= maxRequests) {
          return false;
        }

        existing.count++;
        return true;
      },
      
      getRemainingRequests: (identifier: string): number => {
        const existing = requests.get(identifier);
        if (!existing || Date.now() > existing.resetTime) {
          return maxRequests;
        }
        return Math.max(0, maxRequests - existing.count);
      }
    };
  }
}

// Export singleton instance
export const inputValidator = InputValidator.getInstance();
export default inputValidator;
