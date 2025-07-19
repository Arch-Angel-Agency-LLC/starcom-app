// src/utils/debugLogger.ts
/**
 * Centralized Debug Logger
 * 
 * This utility provides feature-flag controlled logging to reduce console noise
 * in production while maintaining debugging capabilities when needed.
 */

import { featureFlagManager } from './featureFlags';

/**
 * Debug logging categories
 */
export enum DebugCategory {
  AUTH = 'auth',
  WALLET = 'wallet',
  SIWS = 'siws',
  AUTH_TIMELINE = 'authTimeline',
  COMPONENT_LOAD = 'componentLoad',
  ASSET_3D = 'asset3d',
  INTEL_REPORT = 'intelReport',
  DEPLOYMENT = 'deployment',
  ASSET = 'asset',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  NETWORK = 'network',
  SERVICE_INIT = 'serviceInit',
  CONSOLE_ERROR = 'consoleError',
  VERBOSE = 'verbose',
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Debug logger class
 */
class DebugLogger {
  private isFeatureFlagEnabled(category: DebugCategory): boolean {
    switch (category) {
      case DebugCategory.AUTH:
        return featureFlagManager.getFlag('authDebugLoggingEnabled');
      case DebugCategory.WALLET:
        return featureFlagManager.getFlag('walletStateLoggingEnabled');
      case DebugCategory.SIWS:
        return featureFlagManager.getFlag('siwsDebugLoggingEnabled');
      case DebugCategory.AUTH_TIMELINE:
        return featureFlagManager.getFlag('authTimelineLoggingEnabled');
      case DebugCategory.COMPONENT_LOAD:
        return featureFlagManager.getFlag('componentLoadLoggingEnabled');
      case DebugCategory.ASSET_3D:
        return featureFlagManager.getFlag('threeDAssetLoggingEnabled');
      case DebugCategory.INTEL_REPORT:
        return featureFlagManager.getFlag('intelReportLoggingEnabled');
      case DebugCategory.DEPLOYMENT:
        return featureFlagManager.getFlag('deploymentDebugLoggingEnabled');
      case DebugCategory.ASSET:
        return featureFlagManager.getFlag('assetDebugLoggingEnabled');
      case DebugCategory.PERFORMANCE:
        return featureFlagManager.getFlag('performanceLoggingEnabled');
      case DebugCategory.SECURITY:
        return featureFlagManager.getFlag('securityVerboseLoggingEnabled');
      case DebugCategory.NETWORK:
        return featureFlagManager.getFlag('networkDebugLoggingEnabled');
      case DebugCategory.SERVICE_INIT:
        return featureFlagManager.getFlag('serviceInitLoggingEnabled');
      case DebugCategory.CONSOLE_ERROR:
        return featureFlagManager.getFlag('consoleErrorMonitoringEnabled');
      case DebugCategory.VERBOSE:
        return featureFlagManager.getFlag('verboseLoggingEnabled');
      default:
        return false;
    }
  }

  private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
    switch (level) {
      case LogLevel.DEBUG:
        return 'log';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
        return 'error';
      default:
        return 'log';
    }
  }

  private formatMessage(category: DebugCategory, message: string): string {
    const timestamp = new Date().toISOString();
    const categoryIcon = this.getCategoryIcon(category);
    return `${categoryIcon} [${timestamp}] [${category.toUpperCase()}] ${message}`;
  }

  private getCategoryIcon(category: DebugCategory): string {
    switch (category) {
      case DebugCategory.AUTH:
        return '🔐';
      case DebugCategory.WALLET:
        return '💼';
      case DebugCategory.SIWS:
        return '🔗';
      case DebugCategory.AUTH_TIMELINE:
        return '📈';
      case DebugCategory.COMPONENT_LOAD:
        return '🔍';
      case DebugCategory.ASSET_3D:
        return '📦';
      case DebugCategory.INTEL_REPORT:
        return '📊';
      case DebugCategory.DEPLOYMENT:
        return '🚀';
      case DebugCategory.ASSET:
        return '🖼️';
      case DebugCategory.PERFORMANCE:
        return '⚡';
      case DebugCategory.SECURITY:
        return '🔒';
      case DebugCategory.NETWORK:
        return '🌐';
      case DebugCategory.SERVICE_INIT:
        return '⚙️';
      case DebugCategory.CONSOLE_ERROR:
        return '❌';
      case DebugCategory.VERBOSE:
        return '📝';
      default:
        return '🔍';
    }
  }

  /**
   * Log a debug message
   */
  log(
    category: DebugCategory,
    message: string,
    data?: unknown,
    level: LogLevel = LogLevel.INFO,
    forceLog: boolean = false
  ): void {
    // Check if logging is enabled for this category
    if (!forceLog && !this.isFeatureFlagEnabled(category)) {
      return;
    }

    const formattedMessage = this.formatMessage(category, message);
    const consoleMethod = this.getConsoleMethod(level);

    console[consoleMethod](formattedMessage);
    
    if (data !== undefined) {
      console[consoleMethod](data);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(category: DebugCategory, message: string, data?: unknown, forceLog?: boolean): void {
    this.log(category, message, data, LogLevel.DEBUG, forceLog);
  }

  info(category: DebugCategory, message: string, data?: unknown, forceLog?: boolean): void {
    this.log(category, message, data, LogLevel.INFO, forceLog);
  }

  warn(category: DebugCategory, message: string, data?: unknown, forceLog?: boolean): void {
    this.log(category, message, data, LogLevel.WARN, forceLog);
  }

  error(category: DebugCategory, message: string, data?: unknown, forceLog?: boolean): void {
    this.log(category, message, data, LogLevel.ERROR, forceLog);
  }

  /**
   * Create a conditional console.log replacement
   */
  createConditionalLogger(category: DebugCategory, level: LogLevel = LogLevel.INFO) {
    return (message: string, data?: unknown) => {
      this.log(category, message, data, level);
    };
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Convenience function for backward compatibility
export function conditionalLog(
  category: DebugCategory,
  message: string,
  data?: unknown,
  level: LogLevel = LogLevel.INFO
): void {
  debugLogger.log(category, message, data, level);
}
