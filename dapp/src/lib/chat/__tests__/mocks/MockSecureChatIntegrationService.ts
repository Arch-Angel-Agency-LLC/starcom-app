/**
 * MockSecureChatIntegrationService.ts
 * 
 * Mock implementation of SecureChatIntegrationService for testing
 */

import { vi } from 'vitest';

// Create a mock implementation of the service
export class SecureChatIntegrationService {
  private static instance: SecureChatIntegrationService;
  private connected = false;
  private encryptionEnabled = false;
  private pqcEnabled = false;
  private messages = new Map<string, any[]>();
  private channels = new Map<string, any>();
  private users = new Map<string, any>();
  
  static getInstance(): SecureChatIntegrationService {
    if (!SecureChatIntegrationService.instance) {
      SecureChatIntegrationService.instance = new SecureChatIntegrationService();
    }
    return SecureChatIntegrationService.instance;
  }
  
  initialize = vi.fn().mockResolvedValue(undefined);
  connect = vi.fn().mockImplementation(() => {
    this.connected = true;
    return Promise.resolve();
  });
  disconnect = vi.fn().mockImplementation(() => {
    this.connected = false;
    return Promise.resolve();
  });
  isConnected = vi.fn().mockImplementation(() => this.connected);
  
  createChannel = vi.fn().mockImplementation((name, type, participants) => {
    const channelId = `${type}-${Date.now()}`;
    this.channels.set(channelId, { 
      channelId,
      name,
      type,
      participants,
      createdAt: Date.now()
    });
    this.messages.set(channelId, []);
    return Promise.resolve({ channelId });
  });
  
  getChannels = vi.fn().mockImplementation(() => {
    return Promise.resolve(Array.from(this.channels.values()));
  });
  
  joinChannel = vi.fn().mockResolvedValue(undefined);
  leaveChannel = vi.fn().mockResolvedValue(undefined);
  
  sendMessage = vi.fn().mockImplementation((channelId, content, attachments) => {
    const messageId = `msg-${Date.now()}`;
    const message = {
      messageId,
      content,
      timestamp: Date.now(),
      senderId: 'test-user',
      channelId,
      attachments: attachments || []
    };
    
    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }
    
    this.messages.get(channelId)?.push(message);
    return Promise.resolve(message);
  });
  
  getMessages = vi.fn().mockImplementation((channelId) => {
    return Promise.resolve(this.messages.get(channelId) || []);
  });
  
  subscribeToMessages = vi.fn().mockReturnValue(() => {});
  subscribeToThreadMessages = vi.fn().mockReturnValue(() => {});
  subscribeToPresence = vi.fn().mockReturnValue(() => {});
  
  getActiveUsers = vi.fn().mockImplementation(() => {
    return Promise.resolve(Array.from(this.users.values()));
  });
  
  editMessage = vi.fn().mockImplementation((messageId, channelId, newContent) => {
    const messages = this.messages.get(channelId) || [];
    const messageIndex = messages.findIndex(m => m.messageId === messageId);
    
    if (messageIndex >= 0) {
      const updatedMessage = {
        ...messages[messageIndex],
        content: newContent,
        edited: true,
        editedAt: Date.now()
      };
      
      messages[messageIndex] = updatedMessage;
      return Promise.resolve(updatedMessage);
    }
    
    return Promise.reject(new Error('Message not found'));
  });
  
  deleteMessage = vi.fn().mockImplementation((messageId, channelId) => {
    const messages = this.messages.get(channelId) || [];
    const messageIndex = messages.findIndex(m => m.messageId === messageId);
    
    if (messageIndex >= 0) {
      messages.splice(messageIndex, 1);
      return Promise.resolve();
    }
    
    return Promise.reject(new Error('Message not found'));
  });
  
  createThread = vi.fn().mockImplementation((messageId, channelId, content) => {
    const threadId = `thread-${Date.now()}`;
    const threadMessage = {
      messageId: `msg-${Date.now()}`,
      content,
      timestamp: Date.now(),
      senderId: 'test-user',
      channelId,
      threadId,
      parentMessageId: messageId
    };
    
    this.messages.set(threadId, [threadMessage]);
    return Promise.resolve(threadMessage);
  });
  
  getThreadMessages = vi.fn().mockImplementation((threadId) => {
    return Promise.resolve(this.messages.get(threadId) || []);
  });
  
  addReaction = vi.fn().mockResolvedValue(undefined);
  removeReaction = vi.fn().mockResolvedValue(undefined);
  
  enableEncryption = vi.fn().mockImplementation((enabled) => {
    this.encryptionEnabled = enabled;
  });
  
  isEncryptionEnabled = vi.fn().mockImplementation(() => {
    return this.encryptionEnabled;
  });
  
  setPQCEnabled = vi.fn().mockImplementation((enabled) => {
    this.pqcEnabled = enabled;
  });
  
  isPQCEnabled = vi.fn().mockImplementation(() => {
    return this.pqcEnabled;
  });
  
  searchMessages = vi.fn().mockImplementation((query, channelId) => {
    let allMessages: any[] = [];
    
    if (channelId) {
      allMessages = this.messages.get(channelId) || [];
    } else {
      // Search across all channels
      for (const messages of this.messages.values()) {
        allMessages.push(...messages);
      }
    }
    
    // Simple search implementation
    return Promise.resolve(
      allMessages.filter(message => 
        message.content.toLowerCase().includes(query.toLowerCase())
      )
    );
  });
}

// Export the mock implementation
export default {
  SecureChatIntegrationService
};
