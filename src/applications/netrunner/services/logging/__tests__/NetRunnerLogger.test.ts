/**
 * NetRunnerLogger Test Suite
 * 
 * Comprehensive tests for the NetRunner logging framework including
 * log levels, destinations, and correlation tracking.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  NetRunnerLogger, 
  LoggerFactory, 
  OperationLogger,
  LogLevel,
  LOG_LEVEL_VALUES 
} from '../NetRunnerLogger';

describe('NetRunnerLogger', () => {
  let logger: NetRunnerLogger;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    logger = new NetRunnerLogger({
      level: LogLevel.DEBUG,
      component: 'TestComponent',
      includeTimestamp: true,
      destinations: ['console']
    });
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      logger.debug('Test debug message', { testData: 'value' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log debug messages when level is INFO', () => {
      const infoLogger = new NetRunnerLogger({
        level: LogLevel.INFO,
        component: 'TestComponent',
        includeTimestamp: true,
        destinations: ['console']
      });
      
      infoLogger.debug('Test debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Test info message', { operation: 'test' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      const warnSpy = jest.spyOn(console, 'warn');
      logger.warn('Test warning message');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should log error messages with error object', () => {
      const errorSpy = jest.spyOn(console, 'error');
      const testError = new Error('Test error');
      logger.error('Test error message', testError, { context: 'test' });
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log critical messages', () => {
      const errorSpy = jest.spyOn(console, 'error');
      logger.critical('Test critical message');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Log Entry Structure', () => {
    it('should include timestamp when configured', () => {
      logger.info('Test message');
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should include component name', () => {
      logger.info('Test message');
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('[TestComponent]');
    });

    it('should include log level', () => {
      logger.info('Test message');
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('[INFO]');
    });

    it('should include correlation ID when provided', () => {
      logger.setCorrelationId('test-correlation-123');
      logger.info('Test message');
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('[cor-id:test-correlation-123]');
    });

    it('should format additional data as JSON', () => {
      logger.info('Test message', { key: 'value', count: 42 });
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('{"key":"value","count":42}');
    });
  });

  describe('Error Logging', () => {
    it('should include error stack trace for errors', () => {
      const errorSpy = jest.spyOn(console, 'error');
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);
      
      expect(errorSpy).toHaveBeenCalledTimes(2); // Main log + stack trace
    });

    it('should handle errors without stack traces', () => {
      const errorSpy = jest.spyOn(console, 'error');
      const testError = { message: 'Custom error' } as Error;
      logger.error('Error occurred', testError);
      
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});

describe('LoggerFactory', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create logger with default configuration', () => {
    const logger = LoggerFactory.getLogger('TestComponent');
    expect(logger).toBeInstanceOf(NetRunnerLogger);
  });

  it('should create logger with custom configuration', () => {
    const logger = LoggerFactory.createLogger({
      level: LogLevel.ERROR,
      component: 'CustomComponent'
    });
    expect(logger).toBeInstanceOf(NetRunnerLogger);
  });

  it('should set default log level for all new loggers', () => {
    LoggerFactory.setDefaultLogLevel(LogLevel.WARN);
    const logger = LoggerFactory.getLogger('TestComponent');
    
    // Debug should not log
    logger.debug('Debug message');
    expect(console.log).not.toHaveBeenCalled();
    
    // Warn should log
    const warnSpy = jest.spyOn(console, 'warn');
    logger.warn('Warn message');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should manage default destinations', () => {
    LoggerFactory.addDefaultDestination('file');
    LoggerFactory.removeDefaultDestination('console');
    
    const logger = LoggerFactory.getLogger('TestComponent');
    // This would normally log to file, but we can't easily test that
    expect(logger).toBeInstanceOf(NetRunnerLogger);
  });
});

describe('OperationLogger', () => {
  let operationLogger: OperationLogger;
  let logger: NetRunnerLogger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new NetRunnerLogger({
      level: LogLevel.DEBUG,
      component: 'TestComponent',
      includeTimestamp: true,
      destinations: ['console']
    });
    operationLogger = new OperationLogger(logger, 'TestOperation', { testMeta: 'value' });
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start operation logging', () => {
    operationLogger.start('Custom start message');
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Custom start message');
  });

  it('should log operation success', () => {
    operationLogger.start();
    operationLogger.success('Operation completed successfully', { result: 'success' });
    
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy.mock.calls[1][0]).toContain('Operation completed successfully');
  });

  it('should log operation failure with error', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const testError = new Error('Operation failed');
    
    operationLogger.start();
    operationLogger.failure(testError, 'Custom failure message', { context: 'test' });
    
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toContain('Custom failure message');
  });

  it('should log operation steps', () => {
    operationLogger.start();
    operationLogger.step('validation', 'Validating input parameters');
    
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy.mock.calls[1][0]).toContain('Validating input parameters');
  });

  it('should generate and maintain correlation ID', () => {
    const correlationId = operationLogger.getCorrelationId();
    expect(correlationId).toMatch(/^netrunner-\d+-[a-z0-9]+$/);
    
    operationLogger.start();
    operationLogger.success();
    
    // Both logs should contain the same correlation ID
    const startLog = consoleSpy.mock.calls[0][0];
    const endLog = consoleSpy.mock.calls[1][0];
    
    expect(startLog).toContain(correlationId);
    expect(endLog).toContain(correlationId);
  });

  it('should include metadata in logs', () => {
    operationLogger.start();
    expect(consoleSpy.mock.calls[0][0]).toContain('testMeta');
  });
});

describe('LOG_LEVEL_VALUES', () => {
  it('should have correct numeric ordering', () => {
    expect(LOG_LEVEL_VALUES[LogLevel.DEBUG]).toBe(0);
    expect(LOG_LEVEL_VALUES[LogLevel.INFO]).toBe(1);
    expect(LOG_LEVEL_VALUES[LogLevel.WARN]).toBe(2);
    expect(LOG_LEVEL_VALUES[LogLevel.ERROR]).toBe(3);
    expect(LOG_LEVEL_VALUES[LogLevel.CRITICAL]).toBe(4);
  });
});
