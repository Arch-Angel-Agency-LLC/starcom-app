/**
 * Intel Report Validation Service
 * 
 * Comprehensive validation system with detailed error reporting,
 * real-time validation, and quality scoring for Intel Reports.
 */

import { IntelReportData } from '../models/IntelReportData';
import {
  IntelReportError,
  IntelReportErrorContext,
  IntelReportValidationResult,
  IntelReportErrorType,
  IntelReportErrorSeverity,
  INTEL_REPORT_ERROR_CODES,
  IntelReportErrorCode,
} from '../types/IntelReportErrorTypes';

// =============================================================================
// VALIDATION CONFIGURATION
// =============================================================================

interface ValidationConfig {
  maxTitleLength: number;
  maxContentLength: number;
  maxTagCount: number;
  maxTagLength: number;
  requiredFields: (keyof IntelReportData)[];
  coordinateRange: {
    latitude: { min: number; max: number };
    longitude: { min: number; max: number };
  };
  qualityScoring: {
    baseScore: number;
    titleBonus: number;
    contentBonus: number;
    tagsBonus: number;
    coordinateBonus: number;
  };
}

const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxTitleLength: 200,
  maxContentLength: 5000,
  maxTagCount: 20,
  maxTagLength: 50,
  requiredFields: ['title', 'content', 'tags', 'latitude', 'longitude', 'author'],
  coordinateRange: {
    latitude: { min: -90, max: 90 },
    longitude: { min: -180, max: 180 },
  },
  qualityScoring: {
    baseScore: 0,
    titleBonus: 20,
    contentBonus: 30,
    tagsBonus: 15,
    coordinateBonus: 10,
  },
};

// =============================================================================
// VALIDATION SERVICE
// =============================================================================

export class IntelReportValidationService {
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  /**
   * Validate Intel Report data for creation
   */
  public validateCreate(data: Partial<IntelReportData>): IntelReportValidationResult {
    const context: IntelReportErrorContext = {
      operation: 'validate_create',
      timestamp: new Date(),
      metadata: { validationType: 'create' },
    };

    const errors: IntelReportError[] = [];
    const warnings: IntelReportError[] = [];
    const fieldErrors: Record<string, IntelReportError[]> = {};

    // Title validation
    this.validateTitle(data.title, errors, warnings, fieldErrors, context);

    // Content validation
    this.validateContent(data.content, errors, warnings, fieldErrors, context);

    // Tags validation
    this.validateTags(data.tags, errors, warnings, fieldErrors, context);

    // Coordinate validation
    this.validateCoordinates(data.latitude, data.longitude, errors, warnings, fieldErrors, context);

    // Author validation
    this.validateAuthor(data.author, errors, warnings, fieldErrors, context);

    // Timestamp validation
    this.validateTimestamp(data.timestamp, errors, warnings, fieldErrors, context);

    // Additional validations can be added here for optional fields

    // Calculate quality score
    const score = this.calculateQualityScore(data, errors, warnings);

    // Generate suggestions
    const suggestions = this.generateSuggestions(data, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      fieldErrors,
      suggestions,
    };
  }

  /**
   * Validate Intel Report data for update
   */
  public validateUpdate(data: Partial<IntelReportData>): IntelReportValidationResult {
    const context: IntelReportErrorContext = {
      operation: 'validate_update',
      timestamp: new Date(),
      metadata: { validationType: 'update' },
    };

    const errors: IntelReportError[] = [];
    const warnings: IntelReportError[] = [];
    const fieldErrors: Record<string, IntelReportError[]> = {};

    // Only validate provided fields for updates
    if (data.title !== undefined) {
      this.validateTitle(data.title, errors, warnings, fieldErrors, context);
    }

    if (data.content !== undefined) {
      this.validateContent(data.content, errors, warnings, fieldErrors, context);
    }

    if (data.tags !== undefined) {
      this.validateTags(data.tags, errors, warnings, fieldErrors, context);
    }

    if (data.latitude !== undefined || data.longitude !== undefined) {
      this.validateCoordinates(data.latitude, data.longitude, errors, warnings, fieldErrors, context);
    }

    if (data.author !== undefined) {
      this.validateAuthor(data.author, errors, warnings, fieldErrors, context);
    }

    if (data.timestamp !== undefined) {
      this.validateTimestamp(data.timestamp, errors, warnings, fieldErrors, context);
    }

    // Additional update validations can be added here

    const score = this.calculateQualityScore(data, errors, warnings);
    const suggestions = this.generateSuggestions(data, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      fieldErrors,
      suggestions,
    };
  }

  /**
   * Real-time field validation for forms
   */
  public validateField(fieldName: keyof IntelReportData, value: unknown): IntelReportValidationResult {
    const context: IntelReportErrorContext = {
      operation: 'validate_field',
      timestamp: new Date(),
      metadata: { field: fieldName, validationType: 'field' },
    };

    const errors: IntelReportError[] = [];
    const warnings: IntelReportError[] = [];
    const fieldErrors: Record<string, IntelReportError[]> = {};

    switch (fieldName) {
      case 'title':
        this.validateTitle(value as string, errors, warnings, fieldErrors, context);
        break;
      case 'content':
        this.validateContent(value as string, errors, warnings, fieldErrors, context);
        break;
      case 'tags':
        this.validateTags(value as string[], errors, warnings, fieldErrors, context);
        break;
      case 'latitude':
        this.validateCoordinates(value as number, undefined, errors, warnings, fieldErrors, context);
        break;
      case 'longitude':
        this.validateCoordinates(undefined, value as number, errors, warnings, fieldErrors, context);
        break;
      case 'author':
        this.validateAuthor(value as string, errors, warnings, fieldErrors, context);
        break;
      case 'timestamp':
        this.validateTimestamp(value as number, errors, warnings, fieldErrors, context);
        break;
      default:
        // Handle additional fields if needed
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: errors.length === 0 ? 100 : 0,
      fieldErrors,
      suggestions: [],
    };
  }

  // =============================================================================
  // INDIVIDUAL FIELD VALIDATION METHODS
  // =============================================================================

  private validateTitle(
    title: string | undefined,
    errors: IntelReportError[],
    warnings: IntelReportError[],
    fieldErrors: Record<string, IntelReportError[]>,
    context: IntelReportErrorContext
  ): void {
    if (!title || typeof title !== 'string' || !title.trim()) {
      const error = this.createValidationError(
        INTEL_REPORT_ERROR_CODES.VALIDATION_TITLE_REQUIRED,
        'Title is required',
        'Please provide a descriptive title for your intel report',
        { ...context, metadata: { ...context.metadata, field: 'title', value: title } }
      );
      errors.push(error);
      this.addFieldError(fieldErrors, 'title', error);
      return;
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle.length > this.config.maxTitleLength) {
      const error = this.createValidationError(
        INTEL_REPORT_ERROR_CODES.VALIDATION_TITLE_TOO_LONG,
        `Title is too long (${trimmedTitle.length}/${this.config.maxTitleLength} characters)`,
        `Please shorten the title to ${this.config.maxTitleLength} characters or fewer`,
        { ...context, metadata: { ...context.metadata, field: 'title', length: trimmedTitle.length, maxLength: this.config.maxTitleLength } }
      );
      errors.push(error);
      this.addFieldError(fieldErrors, 'title', error);
    } else if (trimmedTitle.length > this.config.maxTitleLength * 0.8) {
      const warning = this.createValidationWarning(
        'VALIDATION_TITLE_APPROACHING_LIMIT',
        'Title is approaching character limit',
        'Consider shortening the title for better readability',
        { ...context, metadata: { ...context.metadata, field: 'title', length: trimmedTitle.length } }
      );
      warnings.push(warning);
      this.addFieldError(fieldErrors, 'title', warning);
    }

    // Check for common issues
    if (trimmedTitle.length < 5) {
      const warning = this.createValidationWarning(
        'VALIDATION_TITLE_TOO_SHORT',
        'Title is very short',
        'Consider providing a more descriptive title',
        { ...context, metadata: { ...context.metadata, field: 'title', length: trimmedTitle.length } }
      );
      warnings.push(warning);
      this.addFieldError(fieldErrors, 'title', warning);
    }
  }

  private validateContent(
    content: string | undefined,
    errors: IntelReportError[],
    warnings: IntelReportError[],
    fieldErrors: Record<string, IntelReportError[]>,
    context: IntelReportErrorContext
  ): void {
    if (!content || typeof content !== 'string' || !content.trim()) {
      const error = this.createValidationError(
        INTEL_REPORT_ERROR_CODES.VALIDATION_CONTENT_REQUIRED,
        'Content is required',
        'Please provide details about the intelligence report',
        { ...context, metadata: { ...context.metadata, field: 'content', value: content } }
      );
      errors.push(error);
      this.addFieldError(fieldErrors, 'content', error);
      return;
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length > this.config.maxContentLength) {
      const error = this.createValidationError(
        INTEL_REPORT_ERROR_CODES.VALIDATION_CONTENT_TOO_LONG,
        `Content is too long (${trimmedContent.length}/${this.config.maxContentLength} characters)`,
        `Please shorten the content to ${this.config.maxContentLength} characters or fewer`,
        { ...context, metadata: { ...context.metadata, field: 'content', length: trimmedContent.length, maxLength: this.config.maxContentLength } }
      );
      errors.push(error);
      this.addFieldError(fieldErrors, 'content', error);
    } else if (trimmedContent.length > this.config.maxContentLength * 0.9) {
      const warning = this.createValidationWarning(
        'VALIDATION_CONTENT_APPROACHING_LIMIT',
        'Content is approaching character limit',
        'Consider condensing the content or breaking it into multiple reports',
        { ...context, metadata: { ...context.metadata, field: 'content', length: trimmedContent.length } }
      );
      warnings.push(warning);
      this.addFieldError(fieldErrors, 'content', warning);
    }

    // Check for minimum content length
    if (trimmedContent.length < 10) {
      const warning = this.createValidationWarning(
        'VALIDATION_CONTENT_TOO_SHORT',
        'Content is very brief',
        'Consider providing more detailed information',
        { ...context, metadata: { ...context.metadata, field: 'content', length: trimmedContent.length } }
      );
      warnings.push(warning);
      this.addFieldError(fieldErrors, 'content', warning);
    }
  }

  private validateTags(
    tags: string[] | undefined,
    errors: IntelReportError[],
    warnings: IntelReportError[],
    fieldErrors: Record<string, IntelReportError[]>,
    context: IntelReportErrorContext
  ): void {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      const error = this.createValidationError(
        INTEL_REPORT_ERROR_CODES.VALIDATION_TAGS_REQUIRED,
        'At least one tag is required',
        'Please add tags to categorize your intel report',
        { ...context, metadata: { ...context.metadata, field: 'tags', value: tags } }
      );
      errors.push(error);
      this.addFieldError(fieldErrors, 'tags', error);
      return;
    }

    if (tags.length > this.config.maxTagCount) {
      const error = this.createValidationError(
        INTEL_REPORT_ERROR_CODES.VALIDATION_TAGS_INVALID_FORMAT,
        `Too many tags (${tags.length}/${this.config.maxTagCount})`,
        `Please limit tags to ${this.config.maxTagCount} or fewer`,
        { ...context, metadata: { ...context.metadata, field: 'tags', count: tags.length, maxCount: this.config.maxTagCount } }
      );
      errors.push(error);
      this.addFieldError(fieldErrors, 'tags', error);
    }

    // Validate individual tags
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      if (!tag || typeof tag !== 'string' || !tag.trim()) {
        const error = this.createValidationError(
          INTEL_REPORT_ERROR_CODES.VALIDATION_TAGS_INVALID_FORMAT,
          `Tag ${i + 1} is empty or invalid`,
          'Please remove empty tags or provide valid tag names',
          { ...context, metadata: { ...context.metadata, field: 'tags', index: i, value: tag } }
        );
        errors.push(error);
        this.addFieldError(fieldErrors, 'tags', error);
      } else if (tag.trim().length > this.config.maxTagLength) {
        const error = this.createValidationError(
          INTEL_REPORT_ERROR_CODES.VALIDATION_TAGS_INVALID_FORMAT,
          `Tag "${tag}" is too long (${tag.length}/${this.config.maxTagLength} characters)`,
          `Please shorten tag to ${this.config.maxTagLength} characters or fewer`,
          { ...context, metadata: { ...context.metadata, field: 'tags', index: i, length: tag.length } }
        );
        errors.push(error);
        this.addFieldError(fieldErrors, 'tags', error);
      }
    }

    // Check for duplicate tags
    const uniqueTags = new Set(tags.map(tag => tag.trim().toLowerCase()));
    if (uniqueTags.size < tags.length) {
      const warning = this.createValidationWarning(
        'VALIDATION_TAGS_DUPLICATES',
        'Duplicate tags detected',
        'Consider removing duplicate tags for better organization',
        { ...context, metadata: { ...context.metadata, field: 'tags', uniqueCount: uniqueTags.size, totalCount: tags.length } }
      );
      warnings.push(warning);
      this.addFieldError(fieldErrors, 'tags', warning);
    }
  }

  private validateCoordinates(
    latitude: number | undefined,
    longitude: number | undefined,
    errors: IntelReportError[],
    warnings: IntelReportError[],
    fieldErrors: Record<string, IntelReportError[]>,
    context: IntelReportErrorContext
  ): void {
    // Validate latitude
    if (latitude !== undefined) {
      if (typeof latitude !== 'number' || isNaN(latitude)) {
        const error = this.createValidationError(
          INTEL_REPORT_ERROR_CODES.VALIDATION_COORDINATES_INVALID,
          'Invalid latitude coordinate',
          'Please select a valid location on the map or enter a valid latitude',
          { ...context, metadata: { ...context.metadata, field: 'latitude', value: latitude } }
        );
        errors.push(error);
        this.addFieldError(fieldErrors, 'latitude', error);
      } else if (latitude < this.config.coordinateRange.latitude.min || latitude > this.config.coordinateRange.latitude.max) {
        const error = this.createValidationError(
          INTEL_REPORT_ERROR_CODES.VALIDATION_COORDINATES_OUT_OF_RANGE,
          `Latitude out of range (${latitude})`,
          `Latitude must be between ${this.config.coordinateRange.latitude.min} and ${this.config.coordinateRange.latitude.max} degrees`,
          { ...context, metadata: { ...context.metadata, field: 'latitude', value: latitude, range: this.config.coordinateRange.latitude } }
        );
        errors.push(error);
        this.addFieldError(fieldErrors, 'latitude', error);
      }
    }

    // Validate longitude
    if (longitude !== undefined) {
      if (typeof longitude !== 'number' || isNaN(longitude)) {
        const error = this.createValidationError(
          INTEL_REPORT_ERROR_CODES.VALIDATION_COORDINATES_INVALID,
          'Invalid longitude coordinate',
          'Please select a valid location on the map or enter a valid longitude',
          { ...context, metadata: { ...context.metadata, field: 'longitude', value: longitude } }
        );
        errors.push(error);
        this.addFieldError(fieldErrors, 'longitude', error);
      } else if (longitude < this.config.coordinateRange.longitude.min || longitude > this.config.coordinateRange.longitude.max) {
        const error = this.createValidationError(
          INTEL_REPORT_ERROR_CODES.VALIDATION_COORDINATES_OUT_OF_RANGE,
          `Longitude out of range (${longitude})`,
          `Longitude must be between ${this.config.coordinateRange.longitude.min} and ${this.config.coordinateRange.longitude.max} degrees`,
          { ...context, metadata: { ...context.metadata, field: 'longitude', value: longitude, range: this.config.coordinateRange.longitude } }
        );
        errors.push(error);
        this.addFieldError(fieldErrors, 'longitude', error);
      }
    }
  }

  private validateAuthor(
    author: string | undefined,
    errors: IntelReportError[],
    warnings: IntelReportError[],
    fieldErrors: Record<string, IntelReportError[]>,
    context: IntelReportErrorContext
  ): void {
    if (!author || typeof author !== 'string' || !author.trim()) {
      const error = this.createValidationError(
        INTEL_REPORT_ERROR_CODES.VALIDATION_AUTHOR_REQUIRED,
        'Author is required',
        'Please provide an author identifier for this report',
        { ...context, metadata: { ...context.metadata, field: 'author', value: author } }
      );
      errors.push(error);
      this.addFieldError(fieldErrors, 'author', error);
    }
  }

  private validateTimestamp(
    timestamp: number | undefined,
    errors: IntelReportError[],
    warnings: IntelReportError[],
    fieldErrors: Record<string, IntelReportError[]>,
    context: IntelReportErrorContext
  ): void {
    if (timestamp !== undefined) {
      if (typeof timestamp !== 'number' || isNaN(timestamp) || timestamp <= 0) {
        const error = this.createValidationError(
          INTEL_REPORT_ERROR_CODES.VALIDATION_TIMESTAMP_INVALID,
          'Invalid timestamp',
          'Please provide a valid timestamp for the report',
          { ...context, metadata: { ...context.metadata, field: 'timestamp', value: timestamp } }
        );
        errors.push(error);
        this.addFieldError(fieldErrors, 'timestamp', error);
      } else {
        const now = Date.now();
        const futureThreshold = now + (24 * 60 * 60 * 1000); // 24 hours in future
        const pastThreshold = now - (365 * 24 * 60 * 60 * 1000); // 1 year in past

        if (timestamp > futureThreshold) {
          const warning = this.createValidationWarning(
            'VALIDATION_TIMESTAMP_FUTURE',
            'Timestamp is in the future',
            'Please verify the timestamp is correct',
            { ...context, metadata: { ...context.metadata, field: 'timestamp', value: timestamp, now } }
          );
          warnings.push(warning);
          this.addFieldError(fieldErrors, 'timestamp', warning);
        } else if (timestamp < pastThreshold) {
          const warning = this.createValidationWarning(
            'VALIDATION_TIMESTAMP_OLD',
            'Timestamp is very old',
            'Please verify this is a historical report',
            { ...context, metadata: { ...context.metadata, field: 'timestamp', value: timestamp, now } }
          );
          warnings.push(warning);
          this.addFieldError(fieldErrors, 'timestamp', warning);
        }
      }
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private createValidationError(
    code: IntelReportErrorCode,
    message: string,
    userMessage: string,
    context: IntelReportErrorContext
  ): IntelReportError {
    return {
      id: this.generateErrorId(),
      code,
      type: 'VALIDATION_ERROR' as IntelReportErrorType,
      severity: 'medium' as IntelReportErrorSeverity,
      message,
      userMessage,
      timestamp: new Date(),
      context,
      recoverable: false,
      retryable: false,
      suggestedActions: ['Correct the invalid data', 'Review field requirements'],
      resolved: false,
    };
  }

  private createValidationWarning(
    code: string,
    message: string,
    userMessage: string,
    context: IntelReportErrorContext
  ): IntelReportError {
    return {
      id: this.generateErrorId(),
      code: code as IntelReportErrorCode,
      type: 'VALIDATION_ERROR' as IntelReportErrorType,
      severity: 'low' as IntelReportErrorSeverity,
      message,
      userMessage,
      timestamp: new Date(),
      context,
      recoverable: false,
      retryable: false,
      suggestedActions: ['Consider improving the data quality'],
      resolved: false,
    };
  }

  private addFieldError(fieldErrors: Record<string, IntelReportError[]>, field: string, error: IntelReportError): void {
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(error);
  }

  private calculateQualityScore(
    data: Partial<IntelReportData>,
    errors: IntelReportError[],
    warnings: IntelReportError[]
  ): number {
    let score = this.config.qualityScoring.baseScore;

    // Add bonuses for good data
    if (data.title && data.title.trim().length > 5) {
      score += this.config.qualityScoring.titleBonus;
    }

    if (data.content && data.content.trim().length > 50) {
      score += this.config.qualityScoring.contentBonus;
    }

    if (data.tags && data.tags.length > 0) {
      score += this.config.qualityScoring.tagsBonus;
    }

    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      score += this.config.qualityScoring.coordinateBonus;
    }

    // Subtract penalties for errors and warnings
    const errorPenalty = errors.length * 15;
    const warningPenalty = warnings.length * 5;

    score = Math.max(0, Math.min(100, score - errorPenalty - warningPenalty));

    return score;
  }

  private generateSuggestions(
    data: Partial<IntelReportData>,
    errors: IntelReportError[],
    warnings: IntelReportError[]
  ): string[] {
    const suggestions: string[] = [];

    if (errors.length > 0) {
      suggestions.push('Fix validation errors to proceed');
    }

    if (warnings.length > 0) {
      suggestions.push('Address warnings to improve report quality');
    }

    if (data.title && data.title.length < 10) {
      suggestions.push('Consider adding more descriptive title');
    }

    if (data.content && data.content.length < 100) {
      suggestions.push('Add more detailed content for better context');
    }

    if (data.tags && data.tags.length < 3) {
      suggestions.push('Add more tags for better categorization');
    }

    return suggestions;
  }

  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update validation configuration
   */
  public updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current validation configuration
   */
  public getConfig(): ValidationConfig {
    return { ...this.config };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const intelReportValidationService = new IntelReportValidationService();
