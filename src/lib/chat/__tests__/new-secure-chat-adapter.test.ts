/**
 * New SecureChatAdapter.test.ts - fixed version
 *
 * This implements a complete test suite for SecureChatAdapter 
 * using a mock service that's directly injected into the adapter.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SecureChatAdapter } from '../adapters/SecureChatAdapter';
import { EnhancedChatProviderOptions } from '../types/ChatAdapterTypes';

// Create a mock service factory for consistent test setup
function createMockService() {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    createChannel: vi.fn().mockImplementation((name, type, participants) => {
      return Promise.resolve({ channelId: `${type}-${Date.now()}` });
    }),
    getChannels: vi.fn().mockResolvedValue([
      { channelId: 'channel-1', name: 'Test Channel', type: 'group' }
    ]),
    joinChannel: vi.fn().mockResolvedValue(undefined),
    leaveChannel: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockImplementation((channelId, content, attachments) => {
      return Promise.resolve({
        messageId: `msg-${Date.now()}`,
        content,
        timestamp: Date.now(),
        senderId: 'test-user',
        channelId,
        attachments: attachments || []
      });
    }),
    getMessages: vi.fn().mockResolvedValue([
      {
        messageId: 'msg-1',
        content: 'Test message',
        timestamp: Date.now(),
        senderId: 'test-user',
        channelId: 'channel-1'
      }
    ]),
    subscribeToMessages: vi.fn().mockReturnValue(() => {}),
    subscribeToPresence: vi.fn().mockReturnValue(() => {}),
    getActiveUsers: vi.fn().mockResolvedValue([
      { userId: 'user-1', userName: 'Test User', status: 'online' }
    ]),
    editMessage: vi.fn().mockImplementation((messageId, channelId, newContent) => {
      return Promise.resolve({
        messageId,
        content: newContent,
        timestamp: Date.now(),
        editedAt: Date.now(),
        senderId: 'test-user',
        channelId
      });
    }),
    deleteMessage: vi.fn().mockResolvedValue(undefined),
    createThread: vi.fn().mockImplementation((messageId, channelId, content) => {
      return Promise.resolve({
        messageId: `thread-msg-${Date.now()}`,
        content,
        timestamp: Date.now(),
        senderId: 'test-user',
        channelId,
        threadId: `thread-${Date.now()}`,
        parentMessageId: messageId
      });
    }),
    getThreadMessages: vi.fn().mockResolvedValue([
      {
        messageId: 'thread-msg-1',
        content: 'Thread reply',
        timestamp: Date.now(),
        senderId: 'test-user',
        channelId: 'channel-1',
        threadId: 'thread-1'
      }
    ]),
    subscribeToThreadMessages: vi.fn().mockReturnValue(() => {}),
    addReaction: vi.fn().mockResolvedValue(undefined),
    removeReaction: vi.fn().mockResolvedValue(undefined),
    enableEncryption: vi.fn(),
    isEncryptionEnabled: vi.fn().mockReturnValue(true),
    setPQCEnabled: vi.fn(),
    isPQCEnabled: vi.fn().mockReturnValue(true),
    searchMessages: vi.fn().mockImplementation((query, channelId) => {
      const messages = [
        {
          messageId: 'msg-search-1',
          content: `Message containing ${query}`,
          timestamp: Date.now(),
          senderId: 'test-user',
          channelId: channelId || 'channel-1'
        }
      ];
      
      return Promise.resolve({
        messages,
        totalResults: messages.length,
        hasMore: false,
        executionTimeMs: 50
      });
    })
  };
}

describe('SecureChatAdapter', () => {
  let adapter: SecureChatAdapter;
  let mockService: ReturnType<typeof createMockService>;
  
  beforeEach(() => {
    // Create a fresh mock service for each test
    mockService = createMockService();
    
    // Create adapter with options and mock service
    const options: EnhancedChatProviderOptions = {
      userId: 'test-user',
      userName: 'Test User'
    };
    
    // Create the adapter with mock service injected
    adapter = new SecureChatAdapter(options, mockService);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should create an instance successfully', () => {
    expect(adapter).toBeDefined();
    const protocolInfo = adapter.getProtocolInfo();
    expect(protocolInfo.id).toBe('securechat');
  });
  
  it('should connect successfully', async () => {
    await adapter.connect();
    expect(mockService.connect).toHaveBeenCalled();
  });
  
  it('should disconnect successfully', async () => {
    await adapter.disconnect();
    expect(mockService.disconnect).toHaveBeenCalled();
  });
  
  it('should check connection status', () => {
    mockService.isConnected.mockReturnValue(true);
    expect(adapter.isConnected()).toBe(true);
    
    mockService.isConnected.mockReturnValue(false);
    expect(adapter.isConnected()).toBe(false);
  });
  
  it('should get channels', async () => {
    const channels = await adapter.getChannels();
    expect(mockService.getChannels).toHaveBeenCalled();
    expect(channels.length).toBeGreaterThan(0);
  });
  
  it('should create a channel', async () => {
    const channel = await adapter.createChannel('Test Channel', 'group', []);
    expect(mockService.createChannel).toHaveBeenCalledWith('Test Channel', 'group', []);
    expect(channel).toBeDefined();
    expect(channel.id).toBeDefined();
  });
  
  it('should join a channel', async () => {
    await adapter.joinChannel('channel-1');
    expect(mockService.joinChannel).toHaveBeenCalledWith('channel-1');
  });
  
  it('should leave a channel', async () => {
    await adapter.leaveChannel('channel-1');
    expect(mockService.leaveChannel).toHaveBeenCalledWith('channel-1');
  });
  
  it('should send a message', async () => {
    const message = await adapter.sendMessage('channel-1', 'Test message');
    expect(mockService.sendMessage).toHaveBeenCalledWith('channel-1', 'Test message', []);
    expect(message).toBeDefined();
    expect(message.content).toBe('Test message');
  });
  
  it('should get messages', async () => {
    const messages = await adapter.getMessages('channel-1');
    expect(mockService.getMessages).toHaveBeenCalledWith('channel-1');
    expect(messages.length).toBeGreaterThan(0);
  });
  
  it('should subscribe to messages', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.subscribeToMessages('channel-1', callback);
    expect(mockService.subscribeToMessages).toHaveBeenCalledWith('channel-1', expect.any(Function));
    expect(typeof unsubscribe).toBe('function');
  });
  
  it('should get users', async () => {
    const users = await adapter.getUsers('channel-1');
    expect(mockService.getActiveUsers).toHaveBeenCalled();
    expect(users.length).toBeGreaterThan(0);
  });
  
  it('should subscribe to user presence', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.subscribeToUserPresence('channel-1', callback);
    expect(mockService.subscribeToPresence).toHaveBeenCalledWith('channel-1', expect.any(Function));
    expect(typeof unsubscribe).toBe('function');
  });
  
  it('should edit a message', async () => {
    const newContent = 'Edited message';
    const message = await adapter.editMessage('msg-1', 'channel-1', newContent);
    expect(mockService.editMessage).toHaveBeenCalledWith('msg-1', 'channel-1', newContent);
    expect(message.content).toBe(newContent);
  });
  
  it('should delete a message', async () => {
    await adapter.deleteMessage('msg-1', 'channel-1');
    expect(mockService.deleteMessage).toHaveBeenCalledWith('msg-1', 'channel-1');
  });
  
  it('should create a thread', async () => {
    const content = 'Thread message';
    const message = await adapter.createThread('msg-1', 'channel-1', content);
    expect(mockService.createThread).toHaveBeenCalledWith('msg-1', 'channel-1', content);
    expect(message.content).toBe(content);
  });
  
  it('should get thread messages', async () => {
    const messages = await adapter.getThreadMessages('thread-1');
    expect(mockService.getThreadMessages).toHaveBeenCalledWith('thread-1');
    expect(messages.length).toBeGreaterThan(0);
  });
  
  it('should add a reaction', async () => {
    await adapter.addReaction('msg-1', 'channel-1', '👍');
    expect(mockService.addReaction).toHaveBeenCalledWith('msg-1', 'channel-1', '👍');
  });
  
  it('should remove a reaction', async () => {
    await adapter.removeReaction('msg-1', 'channel-1', '👍');
    expect(mockService.removeReaction).toHaveBeenCalledWith('msg-1', 'channel-1', '👍');
  });
  
  it('should set encryption enabled', () => {
    adapter.setEncryptionEnabled(true);
    expect(mockService.enableEncryption).toHaveBeenCalledWith(true);
  });
  
  it('should set PQC enabled', () => {
    adapter.setPQCEnabled(true);
    expect(mockService.setPQCEnabled).toHaveBeenCalledWith(true);
  });
  
  it('should search messages', async () => {
    const query = 'test';
    const results = await adapter.searchMessages(query);
    expect(mockService.searchMessages).toHaveBeenCalledWith(query, undefined);
    expect(results.totalResults).toBeGreaterThan(0);
  });
  
  it('should have all required features for a secure chat adapter', () => {
    expect(adapter.hasFeature('e2e_encryption')).toBe(true);
    expect(adapter.hasFeature('forward_secrecy')).toBe(true);
    expect(adapter.hasFeature('post_quantum_cryptography')).toBe(true);
  });
  
  it('should have all required capabilities for a secure chat adapter', () => {
    expect(adapter.hasCapability('encryption')).toBe(true);
    expect(adapter.hasCapability('messaging')).toBe(true);
    expect(adapter.hasCapability('channels')).toBe(true);
    expect(adapter.hasCapability('presence')).toBe(true);
  });
});
