/**
 * Simple Error Logging Utility
 * Client-side error logging for decentralized accountability
 */

export interface ErrorLogEntry {
  timestamp: string;
  error: string;
  stack?: string;
  context?: Record<string, unknown>;
  userAgent: string;
  url: string;
  userId?: string;
}

export interface ErrorLogger {
  logError(error: Error, context?: Record<string, unknown>): void;
  logWarning(message: string, context?: Record<string, unknown>): void;
  logInfo(message: string, context?: Record<string, unknown>): void;
  getStoredLogs(): ErrorLogEntry[];
  clearLogs(): void;
}

/**
 * Simple client-side error logger using localStorage
 * Safe, non-conflicting implementation for immediate use
 */
export class SimpleErrorLogger implements ErrorLogger {
  private readonly maxLogs = 100;
  private readonly storageKey = 'starcom_error_logs';

  logError(error: Error, context?: Record<string, unknown>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.storeLogEntry('ERROR', entry);
    console.error('Starcom Error:', error, context);
  }

  logWarning(message: string, context?: Record<string, unknown>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.storeLogEntry('WARNING', entry);
    console.warn('Starcom Warning:', message, context);
  }

  logInfo(message: string, context?: Record<string, unknown>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.storeLogEntry('INFO', entry);
    console.info('Starcom Info:', message, context);
  }

  getStoredLogs(): ErrorLogEntry[] {
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  clearLogs(): void {
    localStorage.removeItem(this.storageKey);
  }

  private storeLogEntry(level: string, entry: ErrorLogEntry): void {
    try {
      const logs = this.getStoredLogs();
      logs.unshift({ ...entry, error: `[${level}] ${entry.error}` });
      
      // Keep only the most recent logs
      if (logs.length > this.maxLogs) {
        logs.splice(this.maxLogs);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      // Silent fail if localStorage is unavailable
      console.debug('Could not store error log:', error);
    }
  }
}

// Export singleton instance for immediate use
export const errorLogger = new SimpleErrorLogger();

// Helper function for quick error logging
export const logError = (error: Error, context?: Record<string, unknown>) => {
  errorLogger.logError(error, context);
};

export const logWarning = (message: string, context?: Record<string, unknown>) => {
  errorLogger.logWarning(message, context);
};

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  errorLogger.logInfo(message, context);
};
