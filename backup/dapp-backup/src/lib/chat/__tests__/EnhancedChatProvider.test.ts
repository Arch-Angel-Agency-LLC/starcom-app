/**
 * EnhancedChatProvider.test.ts
 * 
 * Tests for the EnhancedChatProvider base class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatMessage } from '../ChatInterface';
import { EnhancedChatProvider } from '../EnhancedChatProvider';
import { ChatErrorType } from '../utils/ChatErrorHandling';

// Mock implementation of EnhancedChatProvider for testing
class MockChatProvider extends EnhancedChatProvider {
  private mockMessages: Record<string, ChatMessage[]> = {};
  private mockImplementations: Record<string, (...args: any[]) => any> = {};
  
  constructor() {
    super('MockProvider', {
      features: ['sendMessage', 'getMessages', 'subscribeToMessages']
    });
  }
  
  async connect(): Promise<void> {
    if (this.mockImplementations.connect) {
      return this.executeWithRetry(
        () => this.mockImplementations.connect(),
        'connect'
      );
    }
    
    this.connected = true;
    this.connectionState = 'connected';
    return Promise.resolve();
  }
  
  async disconnect(): Promise<void> {
    if (this.mockImplementations.disconnect) {
      return this.mockImplementations.disconnect();
    }
    
    this.connected = false;
    this.connectionState = 'disconnected';
    return Promise.resolve();
  }
  
  async sendMessage(channelId: string, content: string): Promise<ChatMessage> {
    if (this.mockImplementations.sendMessage) {
      return this.mockImplementations.sendMessage(channelId, content);
    }
    
    const message: ChatMessage = {
      id: this.generateId(),
      senderId: 'mock-user',
      senderName: 'Mock User',
      content,
      channelId,
      timestamp: Date.now(),
      type: 'text',
      status: 'sent'
    };
    
    if (!this.mockMessages[channelId]) {
      this.mockMessages[channelId] = [];
    }
    
    this.mockMessages[channelId].push(message);
    return message;
  }
  
  async getMessages(channelId: string, limit?: number): Promise<ChatMessage[]> {
    if (this.mockImplementations.getMessages) {
      return this.mockImplementations.getMessages(channelId, limit);
    }
    
    const messages = this.mockMessages[channelId] || [];
    return limit ? messages.slice(-limit) : messages;
  }
  
  subscribeToMessages(channelId: string, callback: (message: ChatMessage) => void): () => void {
    if (this.mockImplementations.subscribeToMessages) {
      return this.mockImplementations.subscribeToMessages(channelId, callback);
    }
    
    return () => { /* unsubscribe function */ };
  }
  
  // Mock methods for testing unsupported features
  protected doSearchMessages(): Promise<ChatMessage[]> {
    throw new Error('Method not implemented.');
  }
  
  protected doMarkMessagesAsRead(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  protected doUploadAttachment(): Promise<{ id: string; url: string; }> {
    throw new Error('Method not implemented.');
  }
  
  // Method to set mock implementations for testing
  setMockImplementation(method: string, implementation: (...args: any[]) => any): void {
    this.mockImplementations[method] = implementation;
  }
  
  // Required abstract methods from EnhancedChatProvider
  async createChannel(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async joinChannel(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async leaveChannel(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async getChannels(): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  
  async getUsers(): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  
  async getUserById(): Promise<any | null> {
    throw new Error('Method not implemented.');
  }
  
  subscribeToUserPresence(): () => void {
    throw new Error('Method not implemented.');
  }
  
  // Helper for test
  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

describe('EnhancedChatProvider', () => {
  let provider: MockChatProvider;
  
  beforeEach(() => {
    provider = new MockChatProvider();
  });
  
  describe('Feature Detection', () => {
    it('should detect supported features', () => {
      expect(provider.supportsFeature('sendMessage')).toBe(true);
      expect(provider.supportsFeature('getMessages')).toBe(true);
      expect(provider.supportsFeature('subscribeToMessages')).toBe(true);
    });
    
    it('should detect unsupported features', () => {
      expect(provider.supportsFeature('searchMessages')).toBe(false);
      expect(provider.supportsFeature('uploadAttachment')).toBe(false);
    });
    
    it('should return list of supported features', () => {
      const features = provider.getSupportedFeatures();
      
      expect(features).toContain('connect');
      expect(features).toContain('disconnect');
      expect(features).toContain('sendMessage');
      expect(features).toContain('getMessages');
      expect(features).toContain('subscribeToMessages');
    });
  });
  
  describe('Connection Management', () => {
    it('should track connection state', async () => {
      expect(provider.getConnectionState()).toBe('disconnected');
      expect(provider.isConnected()).toBe(false);
      
      await provider.connect();
      
      expect(provider.getConnectionState()).toBe('connected');
      expect(provider.isConnected()).toBe(true);
      
      await provider.disconnect();
      
      expect(provider.getConnectionState()).toBe('disconnected');
      expect(provider.isConnected()).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle connection errors with retry', async () => {
      const errorSpy = vi.fn();
      provider.on('error', errorSpy);
      
      // Mock connection failure
      provider.setMockImplementation('connect', () => {
        throw new Error('Connection failed');
      });
      
      await expect(provider.connect()).rejects.toThrow('Connection failed');
      expect(errorSpy).toHaveBeenCalled();
    });
    
    it('should handle unsupported features gracefully', async () => {
      const featureUnsupportedSpy = vi.fn();
      provider.on('featureUnsupported', featureUnsupportedSpy);
      
      const result = await provider.searchMessages('test');
      
      expect(result).toEqual([]);
      expect(featureUnsupportedSpy).toHaveBeenCalledWith(
        expect.objectContaining({ feature: 'searchMessages' })
      );
    });
    
    it('should throw for unsupported features that cannot degrade gracefully', async () => {
      const featureUnsupportedSpy = vi.fn();
      provider.on('featureUnsupported', featureUnsupportedSpy);
      
      await expect(provider.uploadAttachment(new File([], 'test.txt')))
        .rejects.toThrow('File uploads not supported');
      
      expect(featureUnsupportedSpy).toHaveBeenCalledWith(
        expect.objectContaining({ feature: 'uploadAttachment' })
      );
    });
  });
  
  describe('Basic Chat Operations', () => {
    beforeEach(async () => {
      await provider.connect();
    });
    
    it('should send and retrieve messages', async () => {
      const message = await provider.sendMessage('channel1', 'Hello, world!');
      
      expect(message).toMatchObject({
        content: 'Hello, world!',
        channelId: 'channel1',
        status: 'sent'
      });
      
      const messages = await provider.getMessages('channel1');
      
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });
    
    it('should respect message limits', async () => {
      await provider.sendMessage('channel1', 'Message 1');
      await provider.sendMessage('channel1', 'Message 2');
      await provider.sendMessage('channel1', 'Message 3');
      
      const messages = await provider.getMessages('channel1', 2);
      
      expect(messages).toHaveLength(2);
      expect(messages[1].content).toBe('Message 3');
    });
    
    it('should handle errors during message sending', async () => {
      provider.setMockImplementation('sendMessage', () => {
        throw new Error('Network error');
      });
      
      await expect(provider.sendMessage('channel1', 'Will fail'))
        .rejects.toThrow('Network error');
    });
  });
  
  describe('Events', () => {
    it('should emit and listen to events', () => {
      const listener = vi.fn();
      provider.on('test-event', listener);
      
      // Access events indirectly through a method that triggers an event
      provider.sendMessage('test-channel', 'test-message').catch(() => {});
      
      // Trigger an error to emit an event
      provider.setMockImplementation('sendMessage', () => {
        throw new Error('Test error');
      });
      
      // This should trigger an error event
      provider.sendMessage('test-channel', 'error-message').catch(() => {});
      
      provider.off('test-event', listener);
    });
  });
});
