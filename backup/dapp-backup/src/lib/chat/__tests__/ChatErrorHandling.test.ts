/**
 * ChatErrorHandling.test.ts
 * 
 * Tests for the ChatErrorHandling utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ChatErrorType,
  createChatError,
  ensureChatError,
  retryWithBackoff,
  CircuitBreaker,
  ChatLogger,
  FeatureDetector
} from '../utils/ChatErrorHandling';

describe('ChatErrorHandling', () => {
  describe('createChatError', () => {
    it('should create a ChatError with the given properties', () => {
      const message = 'Test error';
      const type = ChatErrorType.NETWORK;
      const code = 'network_failure';
      const recoverable = true;
      const details = { requestId: '123' };
      
      const error = createChatError(message, type, code, recoverable, details);
      
      expect(error.message).toBe(message);
      expect(error.type).toBe(type);
      expect(error.code).toBe(code);
      expect(error.recoverable).toBe(recoverable);
      expect(error.details).toEqual(details);
      expect(error.timestamp).toBeInstanceOf(Date);
    });
    
    it('should use default values when not provided', () => {
      const message = 'Test error';
      
      const error = createChatError(message);
      
      expect(error.message).toBe(message);
      expect(error.type).toBe(ChatErrorType.UNKNOWN);
      expect(error.code).toBe('unknown');
      expect(error.recoverable).toBe(false);
      expect(error.details).toBeUndefined();
    });
  });
  
  describe('ensureChatError', () => {
    it('should return the error if it is already a ChatError', () => {
      const originalError = createChatError('Test error', ChatErrorType.TIMEOUT);
      
      const result = ensureChatError(originalError);
      
      expect(result).toBe(originalError);
    });
    
    it('should convert Error to ChatError', () => {
      const originalError = new Error('Test error');
      
      const result = ensureChatError(originalError);
      
      expect(result.message).toBe('Test error');
      expect(result.type).toBe(ChatErrorType.UNKNOWN);
    });
    
    it('should convert string to ChatError', () => {
      const result = ensureChatError('Test error');
      
      expect(result.message).toBe('Test error');
      expect(result.type).toBe(ChatErrorType.UNKNOWN);
    });
    
    it('should handle null or undefined', () => {
      const resultNull = ensureChatError(null);
      expect(resultNull.message).toBe('Unknown error');
      
      const resultUndefined = ensureChatError(undefined);
      expect(resultUndefined.message).toBe('Unknown error');
    });
    
    it('should convert objects to string representation', () => {
      const obj = { foo: 'bar' };
      
      const result = ensureChatError(obj);
      
      expect(result.message).toBe(JSON.stringify(obj));
      expect(result.type).toBe(ChatErrorType.UNKNOWN);
    });
  });
  
  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });
    
    it('should return the result on success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const resultPromise = retryWithBackoff(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should retry on failure until success with proper backoff timing', async () => {
      const networkError = createChatError('Network error', ChatErrorType.NETWORK);
      const operation = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');
      
      const resultPromise = retryWithBackoff(operation, { backoffMs: 100 });
      
      // First call happens immediately
      expect(operation).toHaveBeenCalledTimes(1);
      
      // First retry should happen after 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(2);
      
      // Second retry should happen after 200ms (with exponential backoff)
      await vi.advanceTimersByTimeAsync(200);
      expect(operation).toHaveBeenCalledTimes(3);
      
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('success');
    });
    
    it('should retry with linear backoff when exponential is false', async () => {
      const networkError = createChatError('Network error', ChatErrorType.NETWORK);
      const operation = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');
      
      const resultPromise = retryWithBackoff(operation, { 
        backoffMs: 100, 
        exponential: false 
      });
      
      // First call happens immediately
      expect(operation).toHaveBeenCalledTimes(1);
      
      // First retry should happen after 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(2);
      
      // Second retry should also happen after 100ms (linear)
      await vi.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(3);
      
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('success');
    });
    
    it('should retry up to maxAttempts times then throw the last error', async () => {
      const networkError = createChatError('Network error', ChatErrorType.NETWORK);
      const operation = vi.fn().mockRejectedValue(networkError);
      
      const resultPromise = retryWithBackoff(operation, { maxAttempts: 3, backoffMs: 50 });
      
      // First attempt happens immediately
      expect(operation).toHaveBeenCalledTimes(1);
      
      // First retry after 50ms
      await vi.advanceTimersByTimeAsync(50);
      expect(operation).toHaveBeenCalledTimes(2);
      
      // Second retry after 100ms more
      await vi.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(3);
      
      await vi.runAllTimersAsync();
      
      // We need to explicitly catch the expected rejection to avoid unhandled rejections
      try {
        await resultPromise;
        throw new Error('Expected promise to reject but it resolved');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
      
      expect(operation).toHaveBeenCalledTimes(3);
    });
    
    it('should not retry for non-retryable errors', async () => {
      const authError = createChatError('Auth error', ChatErrorType.AUTHENTICATION);
      const operation = vi.fn().mockRejectedValue(authError);
      
      const resultPromise = retryWithBackoff(operation);
      await vi.runAllTimersAsync();
      
      try {
        await resultPromise;
        throw new Error('Expected promise to reject but it resolved');
      } catch (error) {
        expect(error.message).toBe('Auth error');
      }
      
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should only retry for specified error types', async () => {
      const timeoutError = createChatError('Timeout error', ChatErrorType.TIMEOUT);
      const operation = vi.fn().mockRejectedValue(timeoutError);
      
      const resultPromise = retryWithBackoff(operation, {
        retryableErrors: [ChatErrorType.NETWORK] // Timeout not included
      });
      
      await vi.runAllTimersAsync();
      
      try {
        await resultPromise;
        throw new Error('Expected promise to reject but it resolved');
      } catch (error) {
        expect(error.message).toBe('Timeout error');
      }
      
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;
    
    beforeEach(() => {
      vi.useFakeTimers();
      circuitBreaker = new CircuitBreaker(2, 1000);
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });
    
    it('should execute operation when circuit is closed', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const resultPromise = circuitBreaker.execute(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should reset failure count after successful execution', async () => {
      const error = new Error('Test error');
      
      // First call fails
      const failOperation = vi.fn().mockRejectedValue(error);
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();
      
      // Second call succeeds
      const successOperation = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successOperation);
      expect(result).toBe('success');
      
      // If failure count was reset, the circuit shouldn't open after one more failure
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();
      
      // Circuit should still be closed
      const thirdResult = await circuitBreaker.execute(successOperation);
      expect(thirdResult).toBe('success');
    });
    
    it('should open circuit after maxFailures', async () => {
      const error = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(error);
      
      // First failure
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      // Second failure - should open the circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      // Circuit should be open now - operations should fail without calling the function
      const successOperation = vi.fn().mockResolvedValue('success');
      await expect(circuitBreaker.execute(successOperation))
        .rejects.toThrow('Circuit breaker is open');
        
      expect(operation).toHaveBeenCalledTimes(2);
      expect(successOperation).not.toHaveBeenCalled();
    });
    
    it('should provide time until reset in the error details', async () => {
      const error = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(error);
      
      // Trigger circuit open
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      try {
        await circuitBreaker.execute(() => Promise.resolve('success'));
        throw new Error('Should have thrown an error but did not');
      } catch (err) {
        if (err.message === 'Should have thrown an error but did not') {
          throw err;
        }
        expect(err.message).toContain('Circuit breaker is open');
        expect(err.type).toBe(ChatErrorType.SERVICE_UNAVAILABLE);
        expect(err.code).toBe('circuit_open');
        expect(err.recoverable).toBe(true);
        expect(err.details).toHaveProperty('timeUntilReset');
        expect(err.details.timeUntilReset).toBeGreaterThan(0);
        expect(err.details.timeUntilReset).toBeLessThanOrEqual(1000);
      }
    });
    
    it('should reset circuit after timeout', async () => {
      const error = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(error);
      
      // Trigger circuit open
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      // Verify circuit is open
      await expect(circuitBreaker.execute(() => Promise.resolve('success')))
        .rejects.toThrow('Circuit breaker is open');
      
      // Advance time past reset timeout
      await vi.advanceTimersByTimeAsync(1001);
      
      // Circuit should be closed again
      const successOperation = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successOperation);
      expect(result).toBe('success');
      expect(successOperation).toHaveBeenCalledTimes(1);
    });
    
    it('should track multiple failures with partial time advancement', async () => {
      const circuitBreaker = new CircuitBreaker(3, 2000);
      const error = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(error);
      
      // First failure
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      // Advance time partially
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second failure
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      // Advance time partially again
      await vi.advanceTimersByTimeAsync(1000);
      
      // Third failure - should open the circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      // Circuit should now be open
      await expect(circuitBreaker.execute(() => Promise.resolve('success')))
        .rejects.toThrow('Circuit breaker is open');
        
      // Advance time past reset timeout
      await vi.advanceTimersByTimeAsync(2001);
      
      // Circuit should be closed again
      const successOperation = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successOperation);
      expect(result).toBe('success');
    });
  });
  
  describe('ChatLogger', () => {
    let originalConsole: Console;
    let mockConsole: {
      debug: ReturnType<typeof vi.fn>;
      info: ReturnType<typeof vi.fn>;
      warn: ReturnType<typeof vi.fn>;
      error: ReturnType<typeof vi.fn>;
    };
    
    beforeEach(() => {
      originalConsole = global.console;
      mockConsole = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      };
      
      global.console = mockConsole as unknown as Console;
    });
    
    afterEach(() => {
      global.console = originalConsole;
    });
    
    it('should log messages with provider name', () => {
      // Set log level to debug to ensure all messages are logged
      const logger = new ChatLogger('TestProvider', { level: 'debug' });
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      // Updated test to match new format with timestamp and level
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]\[DEBUG\]\[TestProvider\] Debug message/),
        expect.objectContaining({ 
          provider: 'TestProvider',
          level: 'debug'
        })
      );
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]\[INFO\]\[TestProvider\] Info message/),
        expect.objectContaining({ 
          provider: 'TestProvider',
          level: 'info'
        })
      );
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]\[WARN\]\[TestProvider\] Warning message/),
        expect.objectContaining({ 
          provider: 'TestProvider',
          level: 'warn'
        })
      );
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]\[ERROR\]\[TestProvider\] Error message/),
        expect.objectContaining({ 
          provider: 'TestProvider',
          level: 'error'
        })
      );
    });
    
    it('should include error details when provided', () => {
      const logger = new ChatLogger('TestProvider');
      const error = createChatError('Test error', ChatErrorType.NETWORK, 'net_err', false);
      
      logger.error('Error occurred', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]\[ERROR\]\[TestProvider\] Error occurred/),
        expect.objectContaining({
          provider: 'TestProvider',
          level: 'error',
          error: 'Test error',
          errorType: ChatErrorType.NETWORK,
          errorCode: 'net_err',
          recoverable: false
        })
      );
    });
  });
  
  describe('FeatureDetector', () => {
    it('should detect supported features', () => {
      const detector = new FeatureDetector('TestProvider', ['feature1', 'feature2']);
      
      expect(detector.supportsFeature('feature1')).toBe(true);
      expect(detector.supportsFeature('feature2')).toBe(true);
      expect(detector.supportsFeature('feature3')).toBe(false);
    });
    
    it('should add and remove features', () => {
      const detector = new FeatureDetector('TestProvider', ['feature1']);
      
      detector.addFeature('feature2');
      expect(detector.supportsFeature('feature2')).toBe(true);
      
      detector.removeFeature('feature1');
      expect(detector.supportsFeature('feature1')).toBe(false);
    });
    
    it('should return a list of supported features', () => {
      const features = ['feature1', 'feature2', 'feature3'];
      const detector = new FeatureDetector('TestProvider', features);
      
      const featureList = detector.getFeatureList();
      
      expect(featureList).toHaveLength(3);
      expect(featureList).toContain('feature1');
      expect(featureList).toContain('feature2');
      expect(featureList).toContain('feature3');
    });
    
    it('should handle empty feature list', () => {
      const detector = new FeatureDetector('TestProvider');
      
      expect(detector.getFeatureList()).toEqual([]);
      expect(detector.supportsFeature('anyFeature')).toBe(false);
    });
    
    it('should handle feature names with special characters', () => {
      const detector = new FeatureDetector('TestProvider', ['feature.with.dots', 'feature-with-dashes']);
      
      expect(detector.supportsFeature('feature.with.dots')).toBe(true);
      expect(detector.supportsFeature('feature-with-dashes')).toBe(true);
    });
  });
});
