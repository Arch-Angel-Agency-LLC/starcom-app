/**
 * Enhanced Input Validation Utilities
 * Comprehensive validation for user inputs and data integrity
 */

// ===== TYPE DEFINITIONS =====

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedValue?: unknown;
}

export interface ValidationRule<T = unknown> {
  name: string;
  validate: (value: T) => boolean;
  errorMessage: string;
  sanitize?: (value: T) => T;
}

// ===== COORDINATE VALIDATION =====

export const validateCoordinates = (lat: number, lng: number): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Latitude validation
  if (typeof lat !== 'number' || isNaN(lat)) {
    errors.push('Latitude must be a valid number');
  } else if (lat < -90 || lat > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }

  // Longitude validation
  if (typeof lng !== 'number' || isNaN(lng)) {
    errors.push('Longitude must be a valid number');
  } else if (lng < -180 || lng > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }

  // Precision warnings
  if (Math.abs(lat) > 0 && Math.abs(lat) < 0.001) {
    warnings.push('Very high precision latitude - ensure this is intentional');
  }
  if (Math.abs(lng) > 0 && Math.abs(lng) < 0.001) {
    warnings.push('Very high precision longitude - ensure this is intentional');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) } : undefined
  };
};

// ===== CONTEXT ID VALIDATION =====

export const validateContextId = (contextId: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!contextId || typeof contextId !== 'string') {
    errors.push('Context ID is required and must be a string');
  } else {
    // Check format: should be alphanumeric with hyphens/underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(contextId)) {
      errors.push('Context ID can only contain letters, numbers, hyphens, and underscores');
    }

    // Length validation
    if (contextId.length < 3) {
      errors.push('Context ID must be at least 3 characters long');
    } else if (contextId.length > 50) {
      errors.push('Context ID must be no more than 50 characters long');
    }

    // Reserved words check
    const reservedWords = ['admin', 'root', 'system', 'api', 'undefined', 'null'];
    if (reservedWords.includes(contextId.toLowerCase())) {
      errors.push(`"${contextId}" is a reserved context ID`);
    }

    // Convention warnings
    if (contextId.includes('__')) {
      warnings.push('Double underscores in context ID may cause confusion');
    }
    if (contextId.startsWith('-') || contextId.endsWith('-')) {
      warnings.push('Context ID should not start or end with hyphens');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? contextId.trim() : undefined
  };
};

// ===== DATE/TIME VALIDATION =====

export const validateTimeRange = (start: Date | string, end: Date | string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  let startDate: Date;
  let endDate: Date;

  // Parse start date
  try {
    startDate = start instanceof Date ? start : new Date(start);
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format');
    }
  } catch {
    errors.push('Could not parse start date');
    startDate = new Date(); // fallback
  }

  // Parse end date
  try {
    endDate = end instanceof Date ? end : new Date(end);
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format');
    }
  } catch {
    errors.push('Could not parse end date');
    endDate = new Date(); // fallback
  }

  if (errors.length === 0) {
    // Logical validation
    if (startDate >= endDate) {
      errors.push('Start date must be before end date');
    }

    // Range warnings
    const duration = endDate.getTime() - startDate.getTime();
    const hours = duration / (1000 * 60 * 60);
    
    if (hours > 8760) { // 1 year
      warnings.push('Time range spans more than 1 year - this may impact performance');
    } else if (hours < 0.016) { // 1 minute
      warnings.push('Time range is very short (less than 1 minute)');
    }

    // Future date warnings
    const now = new Date();
    if (endDate > now) {
      warnings.push('End date is in the future');
    }
    if (startDate > now) {
      warnings.push('Start date is in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? { start: startDate, end: endDate } : undefined
  };
};

// ===== THREAT SEVERITY VALIDATION =====

export const validateThreatSeverity = (severity: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  if (!severity || typeof severity !== 'string') {
    errors.push('Threat severity is required and must be a string');
  } else {
    const normalizedSeverity = severity.toUpperCase().trim();
    
    if (!validSeverities.includes(normalizedSeverity)) {
      errors.push(`Invalid threat severity. Must be one of: ${validSeverities.join(', ')}`);
    } else if (severity !== normalizedSeverity) {
      warnings.push('Threat severity was normalized to uppercase');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? severity.toUpperCase().trim() : undefined
  };
};

// ===== GENERIC VALIDATION COMPOSER =====

export const validateWithRules = <T>(value: T, rules: ValidationRule<T>[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitizedValue = value;

  for (const rule of rules) {
    try {
      const isValid = rule.validate(value);
      if (!isValid) {
        errors.push(rule.errorMessage);
      } else if (rule.sanitize) {
        sanitizedValue = rule.sanitize(sanitizedValue);
      }
    } catch (error) {
      errors.push(`Validation rule "${rule.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? sanitizedValue : undefined
  };
};

// ===== COMMON VALIDATION RULES =====

export const commonRules = {
  required: <T>(fieldName: string): ValidationRule<T> => ({
    name: 'required',
    validate: (value) => value !== null && value !== undefined && value !== '',
    errorMessage: `${fieldName} is required`
  }),

  minLength: (min: number, fieldName: string): ValidationRule<string> => ({
    name: 'minLength',
    validate: (value) => typeof value === 'string' && value.length >= min,
    errorMessage: `${fieldName} must be at least ${min} characters long`
  }),

  maxLength: (max: number, fieldName: string): ValidationRule<string> => ({
    name: 'maxLength',
    validate: (value) => typeof value === 'string' && value.length <= max,
    errorMessage: `${fieldName} must be no more than ${max} characters long`
  }),

  numberRange: (min: number, max: number, fieldName: string): ValidationRule<number> => ({
    name: 'numberRange',
    validate: (value) => typeof value === 'number' && value >= min && value <= max,
    errorMessage: `${fieldName} must be between ${min} and ${max}`
  }),

  sanitizeString: (): ValidationRule<string> => ({
    name: 'sanitizeString',
    validate: () => true,
    errorMessage: '',
    sanitize: (value) => typeof value === 'string' ? value.trim() : value
  })
};

// ===== BATCH VALIDATION =====

export const validateBatch = (validations: Array<{ name: string; validation: ValidationResult }>): {
  isValid: boolean;
  results: Record<string, ValidationResult>;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    failedFields: string[];
  };
} => {
  const results: Record<string, ValidationResult> = {};
  let totalErrors = 0;
  let totalWarnings = 0;
  const failedFields: string[] = [];

  for (const { name, validation } of validations) {
    results[name] = validation;
    totalErrors += validation.errors.length;
    totalWarnings += validation.warnings.length;
    
    if (!validation.isValid) {
      failedFields.push(name);
    }
  }

  return {
    isValid: totalErrors === 0,
    results,
    summary: {
      totalErrors,
      totalWarnings,
      failedFields
    }
  };
};
