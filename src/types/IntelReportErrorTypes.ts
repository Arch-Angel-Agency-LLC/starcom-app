/**
 * Intel Report Error Types and Interfaces
 * 
 * Standardized error handling system for all Intel Report operations.
 * Provides consistent error classification, codes, and user messaging.
 */

// =============================================================================
// ERROR TYPES AND SEVERITY
// =============================================================================

/**
 * Standardized Intel Report error types
 */
export type IntelReportErrorType = 
  | 'VALIDATION_ERROR'     // Data validation failures
  | 'NETWORK_ERROR'        // Network/API failures  
  | 'AUTHENTICATION_ERROR' // Auth/permission issues
  | 'STORAGE_ERROR'        // Local/remote storage issues
  | 'BLOCKCHAIN_ERROR'     // Web3/Solana transaction issues
  | 'SYNC_ERROR'          // Offline/online sync issues
  | 'RENDERING_ERROR'      // UI/3D rendering issues
  | 'PERFORMANCE_ERROR'    // Performance/timeout issues
  | 'UNKNOWN_ERROR';       // Uncategorized errors

/**
 * Error severity levels
 */
export type IntelReportErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// ERROR CODES
// =============================================================================

/**
 * Standardized error codes for Intel Reports
 * Format: REP-[Category]-[Number]
 * Categories: V=Validation, N=Network, A=Auth, S=Storage, B=Blockchain, Y=Sync, R=Rendering, P=Performance
 */
export const INTEL_REPORT_ERROR_CODES = {
  // Validation Errors (REP-V-001 to REP-V-099)
  VALIDATION_TITLE_REQUIRED: 'REP-V-001',
  VALIDATION_TITLE_TOO_LONG: 'REP-V-002',
  VALIDATION_CONTENT_REQUIRED: 'REP-V-003',
  VALIDATION_CONTENT_TOO_LONG: 'REP-V-004',
  VALIDATION_COORDINATES_INVALID: 'REP-V-005',
  VALIDATION_COORDINATES_OUT_OF_RANGE: 'REP-V-006',
  VALIDATION_TAGS_REQUIRED: 'REP-V-007',
  VALIDATION_TAGS_INVALID_FORMAT: 'REP-V-008',
  VALIDATION_AUTHOR_REQUIRED: 'REP-V-009',
  VALIDATION_TIMESTAMP_INVALID: 'REP-V-010',
  VALIDATION_CLASSIFICATION_INVALID: 'REP-V-011',
  VALIDATION_THREAT_LEVEL_INVALID: 'REP-V-012',
  
  // Network Errors (REP-N-001 to REP-N-099)
  NETWORK_CONNECTION_FAILED: 'REP-N-001',
  NETWORK_TIMEOUT: 'REP-N-002',
  NETWORK_RATE_LIMITED: 'REP-N-003',
  NETWORK_SERVICE_UNAVAILABLE: 'REP-N-004',
  NETWORK_INVALID_RESPONSE: 'REP-N-005',
  NETWORK_CORS_ERROR: 'REP-N-006',
  
  // Authentication Errors (REP-A-001 to REP-A-099)
  AUTH_WALLET_NOT_CONNECTED: 'REP-A-001',
  AUTH_INSUFFICIENT_PERMISSIONS: 'REP-A-002',
  AUTH_SESSION_EXPIRED: 'REP-A-003',
  AUTH_SIGNATURE_FAILED: 'REP-A-004',
  AUTH_INVALID_CREDENTIALS: 'REP-A-005',
  AUTH_ACCOUNT_LOCKED: 'REP-A-006',
  
  // Storage Errors (REP-S-001 to REP-S-099)
  STORAGE_QUOTA_EXCEEDED: 'REP-S-001',
  STORAGE_ACCESS_DENIED: 'REP-S-002',
  STORAGE_CORRUPTION: 'REP-S-003',
  STORAGE_UNAVAILABLE: 'REP-S-004',
  STORAGE_WRITE_FAILED: 'REP-S-005',
  STORAGE_READ_FAILED: 'REP-S-006',
  
  // Blockchain Errors (REP-B-001 to REP-B-099)
  BLOCKCHAIN_TRANSACTION_FAILED: 'REP-B-001',
  BLOCKCHAIN_INSUFFICIENT_FUNDS: 'REP-B-002',
  BLOCKCHAIN_NETWORK_CONGESTION: 'REP-B-003',
  BLOCKCHAIN_INVALID_PROGRAM: 'REP-B-004',
  BLOCKCHAIN_ACCOUNT_NOT_FOUND: 'REP-B-005',
  BLOCKCHAIN_SIGNATURE_VERIFICATION_FAILED: 'REP-B-006',
  BLOCKCHAIN_RPC_ERROR: 'REP-B-007',
  
  // Sync Errors (REP-Y-001 to REP-Y-099)
  SYNC_CONFLICT_DETECTED: 'REP-Y-001',
  SYNC_VERSION_MISMATCH: 'REP-Y-002',
  SYNC_OFFLINE_MODE_REQUIRED: 'REP-Y-003',
  SYNC_MERGE_FAILED: 'REP-Y-004',
  SYNC_DATA_INCONSISTENT: 'REP-Y-005',
  
  // Rendering Errors (REP-R-001 to REP-R-099)
  RENDERING_WEBGL_NOT_SUPPORTED: 'REP-R-001',
  RENDERING_TEXTURE_LOAD_FAILED: 'REP-R-002',
  RENDERING_GEOMETRY_INVALID: 'REP-R-003',
  RENDERING_SHADER_COMPILATION_FAILED: 'REP-R-004',
  RENDERING_MEMORY_EXHAUSTED: 'REP-R-005',
  
  // Performance Errors (REP-P-001 to REP-P-099)
  PERFORMANCE_OPERATION_TIMEOUT: 'REP-P-001',
  PERFORMANCE_MEMORY_LIMIT_EXCEEDED: 'REP-P-002',
  PERFORMANCE_TOO_MANY_REQUESTS: 'REP-P-003',
  PERFORMANCE_PROCESSING_OVERLOAD: 'REP-P-004',
} as const;

// Type for error codes
export type IntelReportErrorCode = typeof INTEL_REPORT_ERROR_CODES[keyof typeof INTEL_REPORT_ERROR_CODES];

// =============================================================================
// ERROR INTERFACES
// =============================================================================

/**
 * Context information for Intel Report errors
 */
export interface IntelReportErrorContext {
  operation: string;                          // What operation failed
  reportId?: string;                          // Related report ID
  userId?: string;                            // User ID if available
  sessionId?: string;                         // Session identifier
  coordinates?: { lat: number; lng: number }; // Geographic context
  timestamp: Date;                            // When the error occurred
  userAgent?: string;                         // Browser/client info
  url?: string;                              // Current URL
  metadata?: Record<string, unknown>;         // Additional context data
  previousErrors?: string[];                  // Related error IDs
  operationParams?: Record<string, unknown>;  // Parameters that caused error
}

/**
 * Main Intel Report error interface
 */
export interface IntelReportError {
  id: string;                               // Unique error identifier
  code: IntelReportErrorCode;               // Standardized error code
  type: IntelReportErrorType;               // Error category
  severity: IntelReportErrorSeverity;       // Error severity level
  message: string;                          // Technical error message
  userMessage: string;                      // User-friendly message
  timestamp: Date;                          // When error occurred
  context: IntelReportErrorContext;         // Error context information
  recoverable: boolean;                     // Can be recovered automatically
  retryable: boolean;                       // User can retry the operation
  suggestedActions: string[];               // Suggested user actions
  stack?: string;                           // Error stack trace (development)
  resolved: boolean;                        // Whether error has been resolved
  resolvedAt?: Date;                        // When error was resolved
  resolution?: string;                      // How error was resolved
}

/**
 * User-friendly error message configuration
 */
export interface UserErrorMessage {
  title: string;                            // Error title for display
  message: string;                          // User-friendly explanation
  suggestions: string[];                    // Actionable suggestions
  action?: string;                          // Primary action button text
  secondaryAction?: string;                 // Secondary action button text
  learnMoreUrl?: string;                    // URL for additional help
  severity: IntelReportErrorSeverity;       // Display severity
}

/**
 * Validation result interface
 */
export interface IntelReportValidationResult {
  isValid: boolean;                         // Overall validation status
  errors: IntelReportError[];               // Validation errors
  warnings: IntelReportError[];             // Validation warnings
  score: number;                            // Validation quality score (0-100)
  fieldErrors: Record<string, IntelReportError[]>; // Errors by field
  suggestions: string[];                    // Improvement suggestions
}

/**
 * Error recovery strategy interface
 */
export interface IntelReportRecoveryStrategy {
  id: string;                               // Strategy identifier
  name: string;                             // Human-readable name
  description: string;                      // Strategy description
  errorTypes: IntelReportErrorType[];       // Applicable error types
  errorCodes: IntelReportErrorCode[];       // Applicable error codes
  automatic: boolean;                       // Auto-execute or require user action
  priority: number;                         // Strategy priority (higher = more preferred)
  maxRetries: number;                       // Maximum retry attempts
  retryDelayMs: number;                     // Delay between retries
  conditions?: (error: IntelReportError) => boolean; // Additional conditions
  execute: (error: IntelReportError) => Promise<IntelReportRecoveryResult>;
}

/**
 * Recovery operation result
 */
export interface IntelReportRecoveryResult {
  success: boolean;                         // Recovery success status
  newError?: IntelReportError;              // New error if recovery failed
  message?: string;                         // Recovery result message
  retryAfter?: number;                      // Suggested retry delay (ms)
  actionRequired?: IntelReportUserAction;   // Required user action
  data?: unknown;                           // Recovery result data
}

/**
 * Required user actions after error/recovery
 */
export type IntelReportUserAction = 
  | 'none'                // No action required
  | 'retry'               // User should retry operation
  | 'reconnect_wallet'    // User should reconnect wallet
  | 'check_connection'    // User should check internet connection
  | 'reload_page'         // User should reload the page
  | 'contact_support'     // User should contact support
  | 'update_data'         // User should update/correct data
  | 'wait_and_retry'      // User should wait then retry
  | 'switch_mode';        // User should switch to offline/online mode

/**
 * Error analytics and metrics
 */
export interface IntelReportErrorMetrics {
  totalErrors: number;                      // Total error count
  errorsByType: Record<IntelReportErrorType, number>; // Errors by type
  errorsBySeverity: Record<IntelReportErrorSeverity, number>; // Errors by severity
  errorsByCode: Record<string, number>;     // Errors by code
  recoverySuccessRate: number;              // Recovery success percentage
  averageResolutionTime: number;            // Average time to resolve (ms)
  topErrors: Array<{                        // Most frequent errors
    code: string;
    count: number;
    percentage: number;
  }>;
  timeRangeMs: number;                      // Metrics time range
  lastUpdated: Date;                        // When metrics were last updated
}

/**
 * Error event for logging and analytics
 */
export interface IntelReportErrorEvent {
  id: string;                               // Event identifier
  errorId: string;                          // Related error ID
  type: 'error_occurred' | 'recovery_attempted' | 'recovery_succeeded' | 'recovery_failed' | 'error_resolved';
  timestamp: Date;                          // Event timestamp
  userId?: string;                          // User identifier
  sessionId?: string;                       // Session identifier
  data?: Record<string, unknown>;           // Event-specific data
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Error handler function type
 */
export type IntelReportErrorHandler = (error: IntelReportError) => void | Promise<void>;

/**
 * Error transformation function type
 */
export type IntelReportErrorTransformer = (error: unknown, context: Partial<IntelReportErrorContext>) => IntelReportError;

/**
 * Error filter function type
 */
export type IntelReportErrorFilter = (error: IntelReportError) => boolean;

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default error configuration
 */
export const DEFAULT_ERROR_CONFIG = {
  maxErrorHistory: 100,                     // Maximum errors to keep in history
  maxRetryAttempts: 3,                      // Default max retry attempts
  retryDelayMs: 1000,                       // Default retry delay
  enableAutoRecovery: true,                 // Enable automatic recovery
  enableUserNotifications: true,            // Show error notifications to user
  logLevel: 'standard' as const,            // Error logging level
  enableAnalytics: true,                    // Enable error analytics
} as const;

/**
 * Error severity weights for scoring
 */
export const ERROR_SEVERITY_WEIGHTS: Record<IntelReportErrorSeverity, number> = {
  low: 1,
  medium: 3,
  high: 7,
  critical: 15,
} as const;
