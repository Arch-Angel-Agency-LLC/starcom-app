/**
 * GunChatAdapter.test.ts
 * 
 * Tests for the GunChatAdapter class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GunChatAdapter } from '../adapters/GunChatAdapter';
import { ChatMessage, ChatChannel, ChatUser } from '../ChatInterface';
import { ChatErrorType, createChatError } from '../utils/ChatErrorHandling';

// Mock the gun-db module
vi.mock('../../gun-db', () => {
  // Create mock data store
  const mockData = new Map();
  
  // Create a mock Gun instance that can be used for testing
  const createMockGunInstance = () => {
    const gunInstance = {
      get: vi.fn(path => {
        return gunInstance;
      }),
      put: vi.fn((data, callback) => {
        if (callback) callback({ ok: true });
        return gunInstance;
      }),
      on: vi.fn((callback, options) => {
        if (callback && typeof callback === 'function') {
          callback({ value: 'test' }, 'key');
        }
        return gunInstance;
      }),
      map: vi.fn(() => gunInstance),
      off: vi.fn(() => gunInstance)
    };
    
    return gunInstance;
  };
  
  return {
    gun: createMockGunInstance(),
    user: {
      create: vi.fn().mockResolvedValue({ success: true }),
      auth: vi.fn().mockResolvedValue({ sea: { pub: 'mock-pub-key' } }),
      get: vi.fn(() => createMockGunInstance()),
      leave: vi.fn(),
      recall: vi.fn().mockResolvedValue({ sea: { pub: 'mock-pub-key' } })
    }
  };
});

// Mock P2PConnection
class MockP2PConnection {
  onMessage: (callback: (message: string) => void) => void = vi.fn();
  sendMessage: (message: string) => Promise<void> = vi.fn();
  close: () => void = vi.fn();
}

// Mock IPFS uploads
vi.mock('../../ipfs-client', () => ({
  uploadToIPFS: vi.fn().mockResolvedValue({ cid: 'mock-cid' }),
  getIPFSGatewayUrl: vi.fn().mockReturnValue('https://ipfs.example.com/mock-cid')
}));

describe('GunChatAdapter', () => {
  let adapter: GunChatAdapter;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    adapter = new GunChatAdapter({
      userId: 'test-user',
      userName: 'Test User',
      gunInstance: gun
    });
  });
  
  describe('connect', () => {
    it('should connect successfully', async () => {
      await adapter.connect();
      
      expect(adapter.isConnected()).toBe(true);
      expect(gun.get).toHaveBeenCalledWith('starcom-presence');
    });
    
    it('should throw error if userId is not provided', async () => {
      const emptyAdapter = new GunChatAdapter();
      
      await expect(emptyAdapter.connect()).rejects.toThrow('User ID is required');
    });
  });
  
  describe('sendMessage', () => {
    beforeEach(async () => {
      await adapter.connect();
    });
    
    it('should send a message successfully', async () => {
      const message = await adapter.sendMessage('test-channel', 'Hello, world!');
      
      expect(message).toMatchObject({
        content: 'Hello, world!',
        channelId: 'test-channel',
        senderId: 'test-user',
        senderName: 'Test User'
      });
      
      expect(mockGun.get).toHaveBeenCalledWith('starcom-messages');
    });
  });
  
  describe('getMessages', () => {
    beforeEach(async () => {
      await adapter.connect();
    });
    
    it('should retrieve messages from a channel', async () => {
      // Setup mock data
      const mockMessages = [
        { id: 'msg1', content: 'Message 1', senderId: 'user1', timestamp: Date.now() - 1000 },
        { id: 'msg2', content: 'Message 2', senderId: 'user2', timestamp: Date.now() }
      ];
      
      // Mock gun.once to return our test messages
      mockGun.once.mockImplementation((callback) => {
        mockMessages.forEach(msg => {
          callback(msg, msg.id);
        });
        return mockGun;
      });
      
      const messages = await adapter.getMessages('test-channel');
      
      expect(messages.length).toBe(mockMessages.length);
      expect(mockGun.get).toHaveBeenCalledWith('starcom-messages');
    });
  });
  
  describe('createChannel', () => {
    beforeEach(async () => {
      await adapter.connect();
    });
    
    it('should create a channel successfully', async () => {
      const channel = await adapter.createChannel('Test Channel', 'team', ['user1', 'user2']);
      
      expect(channel).toMatchObject({
        name: 'Test Channel',
        type: 'team',
        participants: expect.arrayContaining(['user1', 'user2', 'test-user'])
      });
      
      expect(mockGun.get).toHaveBeenCalledWith('starcom-channels');
    });
  });
  
  describe('feature detection', () => {
    it('should detect supported features', () => {
      expect(adapter.supportsFeature('sendMessage')).toBe(true);
      expect(adapter.supportsFeature('getMessages')).toBe(true);
      expect(adapter.supportsFeature('createChannel')).toBe(true);
    });
    
    it('should handle unsupported features gracefully', async () => {
      // Remove searchMessages from supported features for this test
      (adapter as any).featureDetector.removeFeature('searchMessages');
      
      const results = await adapter.searchMessages('test');
      expect(results).toEqual([]);
    });
  });
  
  describe('error handling', () => {
    beforeEach(async () => {
      await adapter.connect();
    });
    
    it('should handle network errors with retry', async () => {
      // Make the first call fail but the second succeed
      let callCount = 0;
      mockGun.get.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw createChatError('Network error', ChatErrorType.NETWORK);
        }
        return mockGun;
      });
      
      await adapter.sendMessage('test-channel', 'Should retry');
      
      // The operation should succeed after a retry
      expect(callCount).toBe(2);
    });
    
    it('should use circuit breaker for repeated failures', async () => {
      // Make all calls fail
      mockGun.get.mockImplementation(() => {
        throw createChatError('Service unavailable', ChatErrorType.SERVICE_UNAVAILABLE);
      });
      
      // Should throw after max retries
      await expect(adapter.sendMessage('test-channel', 'Will fail'))
        .rejects.toThrow('Service unavailable');
        
      // Reset the mock for the next test
      mockGun.get.mockClear();
      mockGun.get.mockReturnValue(mockGun);
    });
  });
});
