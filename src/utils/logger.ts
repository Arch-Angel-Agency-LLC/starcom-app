/**
 * Logger utility for standardized logging throughout the application
 * Centralizes log formatting, level control, and potentially remote logging
 */

// Log levels in order of verbosity
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  enableConsole?: boolean;
  // Could add remote logging options here in the future
}

class Logger {
  private level: LogLevel;
  private prefix: string;
  private enableConsole: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG);
    this.prefix = options.prefix ?? '';
    this.enableConsole = options.enableConsole ?? true;
  }

  /**
   * Set the current log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Format a log message with timestamp and prefix
   */
  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return `${timestamp} ${level} ${prefix} ${message}`;
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.ERROR && this.enableConsole) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.WARN && this.enableConsole) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.INFO && this.enableConsole) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.DEBUG && this.enableConsole) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  createChildLogger(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      enableConsole: this.enableConsole,
    });
  }
}

// Create a default logger instance
export const logger = new Logger();

// Allow creating specialized loggers for different components
export const createLogger = (options: LoggerOptions): Logger => {
  return new Logger(options);
};

export default logger;
