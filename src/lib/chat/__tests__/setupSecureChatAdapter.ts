/**
 * Setup file for SecureChatAdapter tests
 */

import { vi } from 'vitest';

// Mock the logger to prevent console output during tests
vi.mock('../../../utils', () => {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }
  };
});

// Ensure the service module can be imported in tests
vi.mock('../../../services/SecureChatIntegrationService', () => {
  const mockService = {
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
    searchMessages: vi.fn().mockImplementation((query) => {
      return Promise.resolve([
        {
          messageId: 'msg-search-1',
          content: `Message containing ${query}`,
          timestamp: Date.now(),
          senderId: 'test-user',
          channelId: 'channel-1'
        }
      ]);
    })
  };

  return {
    SecureChatIntegrationService: {
      getInstance: vi.fn().mockReturnValue(mockService)
    }
  };
});
