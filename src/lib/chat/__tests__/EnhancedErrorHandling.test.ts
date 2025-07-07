/**
 * EnhancedErrorHandling.test.ts
 * 
 * Tests for the enhanced error handling utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateChatMessage, 
  captureErrorContext, 
  createTimeoutError,
  createNetworkError,
  withTimeoutAndContext
} from '../utils/EnhancedErrorHandling';
import { ChatErrorType, ChatError } from '../utils/ChatErrorHandling';

describe('EnhancedErrorHandling', () => {
  describe('validateChatMessage', () => {
    it('validates a valid chat message', () => {
      const validMessage = {
        id: '123',
        content: 'Hello world',
        sender: 'user1',
        timestamp: new Date().toISOString()
      };
      
      expect(() => validateChatMessage(validMessage)).not.toThrow();
      expect(validateChatMessage(validMessage)).toBe(true);
    });
    
    it('validates a deleted message', () => {
      const deletedMessage = {
        id: '123',
        deletedAt: new Date().toISOString(),
        sender: 'user1'
      };
      
      expect(() => validateChatMessage(deletedMessage)).not.toThrow();
    });
    
    it('throws for null message', () => {
      expect(() => validateChatMessage(null)).toThrow();
      try {
        validateChatMessage(null);
      } catch (error) {
        expect((error as ChatError).type).toBe(ChatErrorType.INVALID_INPUT);
        expect((error as ChatError).code).toBe('invalid_message_null');
      }
    });
    
    it('throws for non-object message', () => {
      expect(() => validateChatMessage('string message')).toThrow();
      try {
        validateChatMessage('string message');
      } catch (error) {
        expect((error as ChatError).type).toBe(ChatErrorType.INVALID_INPUT);
        expect((error as ChatError).code).toBe('invalid_message_type');
      }
    });
    
    it('throws for message without ID', () => {
      expect(() => validateChatMessage({ content: 'No ID' })).toThrow();
      try {
        validateChatMessage({ content: 'No ID' });
      } catch (error) {
        expect((error as ChatError).type).toBe(ChatErrorType.INVALID_INPUT);
        expect((error as ChatError).code).toBe('invalid_message_missing_id');
      }
    });
    
    it('throws for message without content or deletedAt', () => {
      expect(() => validateChatMessage({ id: '123' })).toThrow();
      try {
        validateChatMessage({ id: '123' });
      } catch (error) {
        expect((error as ChatError).type).toBe(ChatErrorType.INVALID_INPUT);
        expect((error as ChatError).code).toBe('invalid_message_no_content');
      }
    });
  });
  
  describe('captureErrorContext', () => {
    it('enhances a regular Error with context', () => {
      const originalError = new Error('Something went wrong');
      const context = { userId: '123', action: 'send_message' };
      
      const enhancedError = captureErrorContext('sendMessage', originalError, context);
      
      expect(enhancedError.message).toBe('Something went wrong');
      expect(enhancedError.type).toBe(ChatErrorType.UNKNOWN);
      expect(enhancedError.context).toEqual(expect.objectContaining({
        operation: 'sendMessage',
        userId: '123',
        action: 'send_message',
        timestamp: expect.any(String)
      }));
    });
    
    it('preserves ChatError properties and adds context', () => {
      const originalError: ChatError = {
        message: 'Network failure',
        name: 'Error',
        type: ChatErrorType.NETWORK,
        code: 'connection_lost',
        recoverable: true,
        timestamp: new Date(),
        context: { attempt: 2 }
      };
      
      const enhancedError = captureErrorContext(
        'reconnect', 
        originalError,
        { userId: '123' }
      );
      
      expect(enhancedError.type).toBe(ChatErrorType.NETWORK);
      expect(enhancedError.code).toBe('connection_lost');
      expect(enhancedError.context).toEqual(expect.objectContaining({
        operation: 'reconnect',
        userId: '123',
        attempt: 2,
        timestamp: expect.any(String)
      }));
    });
  });
  
  describe('createTimeoutError', () => {
    it('creates a properly formatted timeout error', () => {
      const error = createTimeoutError('fetchMessages', 5000, { channelId: 'general' });
      
      expect(error.message).toContain('timed out after 5000ms');
      expect(error.type).toBe(ChatErrorType.TIMEOUT);
      expect(error.code).toBe('operation_timeout');
      expect(error.recoverable).toBe(true);
      expect(error.details).toEqual(expect.objectContaining({
        timeoutMs: 5000,
        operation: 'fetchMessages'
      }));
      expect(error.context).toEqual(expect.objectContaining({
        channelId: 'general'
      }));
    });
  });
  
  describe('createNetworkError', () => {
    it('creates a properly formatted network error', () => {
      const originalError = new Error('Failed to fetch');
      const error = createNetworkError(
        'Network connection lost while sending message',
        originalError,
        { messageId: '123' }
      );
      
      expect(error.message).toBe('Network connection lost while sending message');
      expect(error.type).toBe(ChatErrorType.NETWORK);
      expect(error.code).toBe('network_error');
      expect(error.recoverable).toBe(true);
      expect(error.details).toEqual(expect.objectContaining({
        originalMessage: 'Failed to fetch'
      }));
      expect(error.context).toEqual(expect.objectContaining({
        messageId: '123'
      }));
    });
  });
  
  describe('withTimeoutAndContext', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });
    
    it('returns the result of a successful operation', async () => {
      const operation = async () => 'success';
      const result = await withTimeoutAndContext(
        operation,
        'test',
        1000,
        { test: true }
      );
      
      expect(result).toBe('success');
    });
    
    it('throws a timeout error when operation exceeds timeout', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return 'too late';
      };
      
      const promise = withTimeoutAndContext(
        operation,
        'slowOperation',
        1000,
        { important: true }
      );
      
      // Fast-forward time
      vi.advanceTimersByTime(1100);
      
      await expect(promise).rejects.toThrow('timed out');
      await expect(promise).rejects.toHaveProperty('type', ChatErrorType.TIMEOUT);
      await expect(promise).rejects.toHaveProperty('context.operation', 'slowOperation');
      await expect(promise).rejects.toHaveProperty('context.important', true);
    });
    
    it('enhances errors thrown by the operation with context', async () => {
      const operation = async () => {
        throw new Error('Operation failed');
      };
      
      try {
        await withTimeoutAndContext(
          operation,
          'failingOperation',
          1000,
          { userId: '123' }
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as ChatError).message).toBe('Operation failed');
        expect((error as ChatError).context).toEqual(expect.objectContaining({
          operation: 'failingOperation',
          userId: '123'
        }));
      }
    });
  });
});
