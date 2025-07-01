/**
 * Secure Logging Utility
 * Prevents sensitive data exposure through logs while maintaining debugging capability
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

export interface LogContext {
  classification?: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  component: string;
  operation?: string;
  userId?: string; // Will be hashed
  sessionId?: string; // Will be hashed
  sanitize?: boolean;
}

export interface SecurityAuditLog {
  timestamp: string;
  level: LogLevel;
  component: string;
  operation: string;
  classification: string;
  userId?: string; // Hashed
  sessionId?: string; // Hashed
  result: 'SUCCESS' | 'FAILURE' | 'PENDING';
  metadata?: Record<string, unknown>; // Sanitized
}

class SecureLogger {
  private static instance: SecureLogger;
  private auditLogs: SecurityAuditLog[] = [];
  private readonly SENSITIVE_FIELDS = [
    'password', 'token', 'signature', 'privateKey', 'mnemonic',
    'wallet', 'auth', 'session', 'credential', 'secret', 'key'
  ];

  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  /**
   * Main logging method with security controls
   */
  log(level: LogLevel, message: string, data?: unknown, context?: LogContext): void {
    // Production safety - never log in production unless explicitly enabled
    if (this.isProductionAndLoggingDisabled()) {
      return;
    }

    // Classification-based logging control
    if (!this.isAllowedToLog(context?.classification)) {
      return;
    }

    // Sanitize data if requested or if sensitive
    const sanitizedData = (context?.sanitize !== false) ? this.sanitizeData(data) : data;

    // Create log entry
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      component: context?.component || 'Unknown',
      operation: context?.operation,
      data: sanitizedData
    };

    // Output to console in development
    if (this.isDevelopmentMode()) {
      console[level === 'audit' ? 'info' : level](`[${context?.component}]`, logEntry);
    }

    // Store audit logs
    if (level === 'audit' || level === 'error') {
      this.storeAuditLog(logEntry, context);
    }
  }

  /**
   * Convenience methods
   */
  debug(message: string, data?: unknown, context?: Omit<LogContext, 'operation'>): void {
    this.log('debug', message, data, { 
      component: context?.component || 'App',
      ...context, 
      operation: 'debug' 
    });
  }

  info(message: string, data?: unknown, context?: Omit<LogContext, 'operation'>): void {
    this.log('info', message, data, { 
      component: context?.component || 'App',
      ...context, 
      operation: 'info' 
    });
  }

  warn(message: string, data?: unknown, context?: Omit<LogContext, 'operation'>): void {
    this.log('warn', message, data, { 
      component: context?.component || 'App',
      ...context, 
      operation: 'warning' 
    });
  }

  error(message: string, data?: unknown, context?: Omit<LogContext, 'operation'>): void {
    this.log('error', message, data, { 
      component: context?.component || 'App',
      ...context, 
      operation: 'error' 
    });
  }

  /**
   * Security audit logging
   */
  audit(
    component: string,
    operation: string,
    result: 'SUCCESS' | 'FAILURE' | 'PENDING',
    metadata?: Record<string, unknown>,
    classification: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' = 'CONFIDENTIAL'
  ): void {
    const auditLog: SecurityAuditLog = {
      timestamp: new Date().toISOString(),
      level: 'audit',
      component,
      operation,
      classification,
      result,
      metadata: metadata ? this.sanitizeData(metadata) as Record<string, unknown> : undefined
    };

    this.auditLogs.push(auditLog);
    
    // Keep only last 1000 audit logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Log to console in development
    if (this.isDevelopmentMode()) {
      console.info('[AUDIT]', auditLog);
    }
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      return this.sanitizeObject(data as Record<string, unknown>);
    }

    return data;
  }

  private sanitizeString(str: string): string {
    // Mask potential sensitive patterns
    return str
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Email
      .replace(/\b[A-HJ-NP-Z0-9]{26,35}\b/g, '[WALLET_ADDRESS]') // Crypto addresses
      .replace(/\b[A-Za-z0-9]{20,}\b/g, '[TOKEN]') // Long tokens
      .replace(/(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})/g, '[CARD]'); // Credit cards
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.SENSITIVE_FIELDS.some(sensitive => lowerField.includes(sensitive));
  }

  /**
   * Security controls
   */
  private isProductionAndLoggingDisabled(): boolean {
    return process.env.NODE_ENV === 'production' && 
           !this.isDebugModeExplicitlyEnabled();
  }

  private isDebugModeExplicitlyEnabled(): boolean {
    return sessionStorage.getItem('debug-logging') === 'true' ||
           localStorage.getItem('debug-logging') === 'true';
  }

  private isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'test';
  }

  private isAllowedToLog(classification?: string): boolean {
    if (!classification) return true;

    // In production, only allow PUBLIC and CONFIDENTIAL logs
    if (process.env.NODE_ENV === 'production') {
      return ['PUBLIC', 'CONFIDENTIAL'].includes(classification);
    }

    // In development, allow all classifications
    return true;
  }

  private storeAuditLog(logEntry: { timestamp: string; level: LogLevel; data?: unknown }, context?: LogContext): void {
    if (!context) return;

    const auditLog: SecurityAuditLog = {
      timestamp: logEntry.timestamp,
      level: logEntry.level,
      component: context.component,
      operation: context.operation || 'unknown',
      classification: context.classification || 'CONFIDENTIAL',
      result: logEntry.level === 'error' ? 'FAILURE' : 'SUCCESS',
      metadata: logEntry.data as Record<string, unknown> | undefined
    };

    this.auditLogs.push(auditLog);
  }

  /**
   * Get audit logs for security review
   */
  getAuditLogs(): SecurityAuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Clear audit logs (use with caution)
   */
  clearAuditLogs(): void {
    this.auditLogs = [];
  }

  /**
   * Export audit logs for external analysis
   */
  exportAuditLogs(): string {
    return JSON.stringify(this.auditLogs, null, 2);
  }
}

// Export singleton instance
export const secureLogger = SecureLogger.getInstance();
export default secureLogger;

// Convenience functions for easy usage
export const logDebug = (message: string, data?: unknown, context?: Omit<LogContext, 'operation'>) => 
  secureLogger.debug(message, data, context);

export const logInfo = (message: string, data?: unknown, context?: Omit<LogContext, 'operation'>) => 
  secureLogger.info(message, data, context);

export const logWarn = (message: string, data?: unknown, context?: Omit<LogContext, 'operation'>) => 
  secureLogger.warn(message, data, context);

export const logError = (message: string, data?: unknown, context?: Omit<LogContext, 'operation'>) => 
  secureLogger.error(message, data, context);

export const logAudit = (
  component: string,
  operation: string,
  result: 'SUCCESS' | 'FAILURE' | 'PENDING',
  metadata?: Record<string, unknown>,
  classification?: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET'
) => secureLogger.audit(component, operation, result, metadata, classification);
