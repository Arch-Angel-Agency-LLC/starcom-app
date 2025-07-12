/**
 * NetRunner Logging Framework
 * 
 * Provides comprehensive logging capabilities for the NetRunner sub-application
 * with support for multiple log levels, destinations, and correlation tracking.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Numeric values for log level comparison
 */
export const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.CRITICAL]: 4
};

/**
 * Available log destinations
 */
export type LogDestination = 'console' | 'file' | 'remote';

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  correlationId?: string;
  data?: Record<string, unknown>;
  error?: Error;
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  level: LogLevel;
  component: string;
  includeTimestamp: boolean;
  destinations: LogDestination[];
  correlationId?: string;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  critical(message: string, error?: Error, data?: Record<string, unknown>): void;
  setCorrelationId(correlationId?: string): void;
  getConfig(): LoggerConfig;
}

/**
 * NetRunner Logger Implementation
 * 
 * Provides structured logging with correlation IDs, multiple destinations,
 * and component-aware logging for better observability.
 */
export class NetRunnerLogger implements Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = { ...config };
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, undefined, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, undefined, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, undefined, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, error, data);
  }

  /**
   * Log critical message
   */
  critical(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.CRITICAL, message, error, data);
  }

  /**
   * Set correlation ID for tracking related operations
   */
  setCorrelationId(correlationId?: string): void {
    this.config.correlationId = correlationId;
  }

  /**
   * Get current logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, error?: Error, data?: Record<string, unknown>): void {
    // Check if this log level should be processed
    if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[this.config.level]) {
      return;
    }
    
    // Create log entry
    const entry: LogEntry = {
      timestamp: this.config.includeTimestamp ? new Date().toISOString() : '',
      level,
      component: this.config.component,
      message,
      correlationId: this.config.correlationId,
      data,
      error
    };
    
    // Process log entry based on destinations
    for (const destination of this.config.destinations) {
      this.writeToDestination(destination, entry);
    }
  }

  /**
   * Write log entry to a specific destination
   */
  private writeToDestination(destination: LogDestination, entry: LogEntry): void {
    switch (destination) {
      case 'console':
        this.writeToConsole(entry);
        break;
      case 'file':
        this.writeToFile(entry);
        break;
      case 'remote':
        this.writeToRemote(entry);
        break;
    }
  }

  /**
   * Write log entry to console
   */
  private writeToConsole(entry: LogEntry): void {
    // Format the log message
    const timestamp = entry.timestamp ? `[${entry.timestamp}]` : '';
    const level = `[${entry.level.toUpperCase()}]`;
    const component = `[${entry.component}]`;
    const correlation = entry.correlationId ? `[cor-id:${entry.correlationId}]` : '';
    const message = `${timestamp}${level}${component}${correlation} ${entry.message}`;
    
    // Choose console method based on log level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.error, entry.data);
        break;
    }
  }

  /**
   * Write log entry to file (placeholder implementation)
   */
  private writeToFile(entry: LogEntry): void {
    // TODO: Implement file logging when required
    console.warn(`File logging not implemented yet for: ${entry.message}`);
  }

  /**
   * Write log entry to remote service (placeholder implementation)
   */
  private writeToRemote(entry: LogEntry): void {
    // TODO: Implement remote logging when required
    console.warn(`Remote logging not implemented yet for: ${entry.message}`);
  }
}

/**
 * Logger Factory
 * 
 * Provides convenient methods for creating loggers with consistent configuration.
 */
export class LoggerFactory {
  private static defaultConfig: LoggerConfig = {
    level: LogLevel.INFO,
    component: 'NetRunner',
    includeTimestamp: true,
    destinations: ['console']
  };

  /**
   * Create a new logger with default configuration
   */
  static getLogger(component: string): Logger {
    return new NetRunnerLogger({
      ...this.defaultConfig,
      component
    });
  }

  /**
   * Create a new logger with custom configuration
   */
  static createLogger(config: Partial<LoggerConfig>): Logger {
    return new NetRunnerLogger({
      ...this.defaultConfig,
      ...config
    });
  }

  /**
   * Set default log level for all new loggers
   */
  static setDefaultLogLevel(level: LogLevel): void {
    this.defaultConfig.level = level;
  }

  /**
   * Add default destination for all new loggers
   */
  static addDefaultDestination(destination: LogDestination): void {
    if (!this.defaultConfig.destinations.includes(destination)) {
      this.defaultConfig.destinations.push(destination);
    }
  }

  /**
   * Remove default destination
   */
  static removeDefaultDestination(destination: LogDestination): void {
    this.defaultConfig.destinations = this.defaultConfig.destinations.filter(d => d !== destination);
  }
}

/**
 * Operation context for correlation tracking
 */
export interface OperationContext {
  correlationId: string;
  operationType: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

/**
 * Operation Logger
 * 
 * Specialized logger for tracking operations with correlation IDs and timing.
 */
export class OperationLogger {
  private logger: Logger;
  private context: OperationContext;

  constructor(logger: Logger, operationType: string, metadata?: Record<string, unknown>) {
    this.logger = logger;
    this.context = {
      correlationId: this.generateCorrelationId(),
      operationType,
      startTime: Date.now(),
      metadata
    };
    
    // Set correlation ID on the logger
    this.logger.setCorrelationId(this.context.correlationId);
  }

  /**
   * Log operation start
   */
  start(message?: string): void {
    this.logger.info(
      message || `Starting operation: ${this.context.operationType}`,
      {
        correlationId: this.context.correlationId,
        operationType: this.context.operationType,
        startTime: this.context.startTime,
        ...this.context.metadata
      }
    );
  }

  /**
   * Log operation success
   */
  success(message?: string, data?: Record<string, unknown>): void {
    const duration = Date.now() - this.context.startTime;
    this.logger.info(
      message || `Operation completed: ${this.context.operationType}`,
      {
        correlationId: this.context.correlationId,
        operationType: this.context.operationType,
        duration,
        status: 'success',
        ...data
      }
    );
  }

  /**
   * Log operation failure
   */
  failure(error: Error, message?: string, data?: Record<string, unknown>): void {
    const duration = Date.now() - this.context.startTime;
    this.logger.error(
      message || `Operation failed: ${this.context.operationType}`,
      error,
      {
        correlationId: this.context.correlationId,
        operationType: this.context.operationType,
        duration,
        status: 'failure',
        ...data
      }
    );
  }

  /**
   * Log operation step
   */
  step(stepName: string, message?: string, data?: Record<string, unknown>): void {
    this.logger.debug(
      message || `Operation step: ${stepName}`,
      {
        correlationId: this.context.correlationId,
        operationType: this.context.operationType,
        step: stepName,
        ...data
      }
    );
  }

  /**
   * Get correlation ID
   */
  getCorrelationId(): string {
    return this.context.correlationId;
  }

  /**
   * Generate a correlation ID
   */
  private generateCorrelationId(): string {
    return `netrunner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
