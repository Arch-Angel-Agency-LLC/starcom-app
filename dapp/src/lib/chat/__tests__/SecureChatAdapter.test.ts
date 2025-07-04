/**
 * SecureChatAdapter.test.ts
 * 
 * Tests for the SecureChatAdapter class.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SecureChatAdapter } from '../adapters/SecureChatAdapter';
import { SearchOptions } from '../interfaces/ChatProviderInterface';

describe('SecureChatAdapter', () => {
  let adapter: SecureChatAdapter;
  let mockService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a mock service for dependency injection
    mockService = {
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

    // Create a direct instance of the adapter with the mock service
    // This bypasses any dynamic import that might be happening
    adapter = new SecureChatAdapter({
      userId: 'test-user',
      userName: 'Test User',
    }, mockService);
    
    // Explicitly ensure the service is set
    (adapter as any).service = mockService;

    // Console log proof that adapter has the methods
    console.log('Adapter initialized for testing, has connect:', typeof adapter.connect === 'function');
  });

  afterEach(() => {
    // Clean up
    vi.resetAllMocks();
  });

  it('should create an instance', () => {
    expect(adapter).toBeDefined();
    
    // Debug the adapter instance
    console.log('Adapter instance keys:', Object.keys(adapter));
    console.log('Adapter prototype chain:', Object.getPrototypeOf(adapter));
    console.log('Adapter prototype keys:', Object.keys(Object.getPrototypeOf(adapter)));
    
    // Debug specific methods
    console.log('connect is function?', typeof adapter.connect === 'function');
    console.log('getChannels is function?', typeof adapter.getChannels === 'function');
    
    // Try to call getProtocolInfo directly
    const protocolInfo = adapter.getProtocolInfo();
    console.log('Protocol info:', protocolInfo);
    
    expect(protocolInfo.id).toBe('securechat');
  });

  it('should connect successfully', async () => {
    console.log('Before connect - connect is function?', typeof adapter.connect === 'function');
    try {
      await adapter.connect();
      console.log('After connect');
      expect(mockService.connect).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(true);
    } catch (error) {
      console.error('Error in connect test:', error);
      throw error;
    }
  });

  it('should disconnect successfully', async () => {
    await adapter.connect();
    await adapter.disconnect();
    expect(mockService.disconnect).toHaveBeenCalled();
  });

  it('should get channels', async () => {
    const channels = await adapter.getChannels();
    expect(mockService.getChannels).toHaveBeenCalled();
    expect(channels.length).toBeGreaterThan(0);
    expect(channels[0].name).toBe('Test Channel');
  });

  it('should create a channel', async () => {
    const channelName = 'New Test Channel';
    const channelType = 'group';
    const participants: string[] = [];
    const channel = await adapter.createChannel(channelName, channelType, participants);
    expect(mockService.createChannel).toHaveBeenCalledWith(channelName, channelType, participants);
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
    const content = 'Test message';
    const message = await adapter.sendMessage('channel-1', content);
    expect(mockService.sendMessage).toHaveBeenCalledWith('channel-1', content, []);
    expect(message.content).toBe(content);
    expect(message.senderId).toBe('test-user');
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
    expect(message.threadId).toBeDefined();
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
    expect(results.messages[0].content).toContain(query);
  });

  it('should search messages in a specific channel', async () => {
    const query = 'test';
    const channelId = 'channel-1';
    const results = await adapter.searchMessages(query, channelId);
    expect(mockService.searchMessages).toHaveBeenCalledWith(query, channelId);
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
