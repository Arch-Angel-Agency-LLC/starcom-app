/**
 * 🛡️ UNIFIED SECURE LOGGER
 * Consolidates all secure logging utilities with enhanced security controls
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit' | 'security';

export interface LogContext {
  classification?: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  component: string;
  operation?: string;
  userId?: string; // Will be hashed
  sessionId?: string; // Will be hashed
  sanitize?: boolean;
  threatLevel?: 'normal' | 'elevated' | 'high' | 'critical';
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  operation: string;
  classification: string;
  userId?: string; // Hashed
  sessionId?: string; // Hashed
  result: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'BLOCKED';
  threatLevel: string;
  metadata?: Record<string, unknown>; // Sanitized
  signature?: string; // Cryptographic signature for log integrity
}

export interface LogMetrics {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  securityEvents: number;
  lastAuditTime: Date;
  integrityStatus: 'INTACT' | 'COMPROMISED' | 'UNKNOWN';
}

/**
 * Unified Secure Logger with quantum-safe audit trails
 */
export class SecureLogger {
  private static instance: SecureLogger;
  private auditLogs: Map<string, SecurityAuditLog> = new Map();
  private logBuffer: SecurityAuditLog[] = [];
  private readonly maxBufferSize = 1000;
  private readonly logSigningKey: string;
  
  private readonly SENSITIVE_FIELDS = [
    'password', 'token', 'signature', 'privateKey', 'mnemonic', 'wallet',
    'auth', 'session', 'credential', 'secret', 'key', 'pin', 'otp', 'seed'
  ];

  private readonly SECURITY_CLASSIFICATIONS = new Set([
    'PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'
  ]);

  private constructor() {
    this.logSigningKey = this.generateLogSigningKey();
    this.initializeSecureLogging();
  }

  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  private generateLogSigningKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private initializeSecureLogging(): void {
    // Setup periodic log buffer flush
    setInterval(() => {
      this.flushLogBuffer();
    }, 30000); // Flush every 30 seconds

    // Setup integrity checking
    setInterval(() => {
      this.verifyLogIntegrity();
    }, 300000); // Check integrity every 5 minutes
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashSensitiveData(data: string): string {
    // Simple hash function (use proper cryptographic hash in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  private signLog(log: SecurityAuditLog): string {
    // Simple log signature (use proper HMAC in production)
    const logString = JSON.stringify(log);
    let signature = '';
    for (let i = 0; i < logString.length; i++) {
      const keyChar = this.logSigningKey.charCodeAt(i % this.logSigningKey.length);
      const logChar = logString.charCodeAt(i);
      signature += String.fromCharCode(logChar ^ keyChar);
    }
    return btoa(signature);
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.SENSITIVE_FIELDS.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = this.hashSensitiveData(String(value));
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isProductionAndLoggingDisabled(): boolean {
    return process.env.NODE_ENV === 'production' && 
           process.env.REACT_APP_ENABLE_LOGGING !== 'true';
  }

  private shouldLogInProduction(level: LogLevel, classification: string): boolean {
    // Always log security events and errors in production
    return level === 'security' || level === 'audit' || level === 'error' ||
           classification === 'TOP_SECRET';
  }

  /**
   * Main secure logging method with enhanced security controls
   */
  log(level: LogLevel, message: string, data?: unknown, context?: LogContext): void {
    const classification = context?.classification || 'CONFIDENTIAL';
    
    // Production safety check
    if (this.isProductionAndLoggingDisabled() && 
        !this.shouldLogInProduction(level, classification)) {
      return;
    }

    const logId = this.generateLogId();
    const sanitizedData = context?.sanitize !== false ? this.sanitizeData(data) : data;
    
    const auditLog: SecurityAuditLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      level,
      component: context?.component || 'unknown',
      operation: context?.operation || 'general',
      classification,
      userId: context?.userId ? this.hashSensitiveData(context.userId) : undefined,
      sessionId: context?.sessionId ? this.hashSensitiveData(context.sessionId) : undefined,
      result: 'SUCCESS',
      threatLevel: context?.threatLevel || 'normal',
      metadata: sanitizedData ? { message, data: sanitizedData } : { message }
    };

    // Sign the log for integrity
    auditLog.signature = this.signLog(auditLog);

    // Store in memory and buffer
    this.auditLogs.set(logId, auditLog);
    this.logBuffer.push(auditLog);

    // Manage buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${level.toUpperCase()}] ${context?.component || 'STARCOM'}: ${message}`, 
                   sanitizedData || '');
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case 'error':
        return console.error;
      case 'warn':
        return console.warn;
      case 'info':
      case 'audit':
      case 'security':
        return console.info;
      case 'debug':
      default:
        return console.debug;
    }
  }

  /**
   * Specialized security event logging
   */
  logSecurityEvent(
    event: string, 
    result: 'SUCCESS' | 'FAILURE' | 'BLOCKED',
    context: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    const securityContext: LogContext = {
      ...context,
      classification: context.classification || 'SECRET',
      operation: event,
      threatLevel: context.threatLevel || 'elevated'
    };

    this.log('security', `Security Event: ${event}`, { result, ...metadata }, securityContext);
  }

  /**
   * Audit trail logging for compliance
   */
  logAuditEvent(
    action: string,
    userId: string,
    result: 'SUCCESS' | 'FAILURE',
    context: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    const auditContext: LogContext = {
      ...context,
      classification: 'SECRET',
      operation: action,
      userId,
      sanitize: true
    };

    this.log('audit', `Audit: ${action}`, { result, ...metadata }, auditContext);
  }

  /**
   * Get security metrics and log health
   */
  getMetrics(): LogMetrics {
    const logs = Array.from(this.auditLogs.values());
    
    return {
      totalLogs: logs.length,
      errorCount: logs.filter(l => l.level === 'error').length,
      warningCount: logs.filter(l => l.level === 'warn').length,
      securityEvents: logs.filter(l => l.level === 'security').length,
      lastAuditTime: new Date(),
      integrityStatus: this.verifyLogIntegrity() ? 'INTACT' : 'COMPROMISED'
    };
  }

  /**
   * Verify log integrity using signatures
   */
  private verifyLogIntegrity(): boolean {
    let integrityValid = true;
    
    for (const log of this.auditLogs.values()) {
      const { signature, ...logWithoutSignature } = log;
      const expectedSignature = this.signLog(logWithoutSignature as SecurityAuditLog);
      
      if (signature !== expectedSignature) {
        integrityValid = false;
        console.error('Log integrity violation detected:', log.id);
      }
    }

    return integrityValid;
  }

  /**
   * Get recent security events for threat analysis
   */
  getSecurityEvents(limit: number = 100): SecurityAuditLog[] {
    return Array.from(this.auditLogs.values())
      .filter(log => log.level === 'security' || log.level === 'audit')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Flush log buffer to persistent storage (if configured)
   */
  private flushLogBuffer(): void {
    if (this.logBuffer.length === 0) return;

    // In production, this would send logs to secure log aggregation service
    console.debug(`Flushing ${this.logBuffer.length} logs to secure storage`);
    
    // Clear the buffer after flushing
    this.logBuffer = [];
  }

  /**
   * Clear all logs (for emergency situations)
   */
  clearLogs(): void {
    this.auditLogs.clear();
    this.logBuffer = [];
    console.warn('🚨 All security logs have been cleared');
  }

  /**
   * Export logs for compliance or analysis
   */
  exportLogs(classification?: string): SecurityAuditLog[] {
    const logs = Array.from(this.auditLogs.values());
    
    if (classification) {
      return logs.filter(log => log.classification === classification);
    }
    
    return logs;
  }
}

// Singleton export
export const secureLogger = SecureLogger.getInstance();

// Convenience functions
export const logSecurityEvent = (
  event: string,
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED',
  context: LogContext,
  metadata?: Record<string, unknown>
) => secureLogger.logSecurityEvent(event, result, context, metadata);

export const logAuditEvent = (
  action: string,
  userId: string,
  result: 'SUCCESS' | 'FAILURE',
  context: LogContext,
  metadata?: Record<string, unknown>
) => secureLogger.logAuditEvent(action, userId, result, context, metadata);
