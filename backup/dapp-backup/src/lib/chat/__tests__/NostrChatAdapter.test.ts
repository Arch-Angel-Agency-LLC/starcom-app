/**
 * NostrChatAdapter.test.ts
 * 
 * Tests for the NostrChatAdapter class.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NostrChatAdapter } from '../adapters/NostrChatAdapter';
import { ChatMessage, ChatChannel, ChatUser } from '../ChatInterface';
import { ChatErrorType, createChatError } from '../utils/ChatErrorHandling';

// Mock nostrService
vi.mock('../../../services/nostrService', () => {
  const mockNostrService = {
    initialize: vi.fn().mockResolvedValue(undefined),
    addRelay: vi.fn().mockResolvedValue(true),
    createTeamChannel: vi.fn().mockResolvedValue({ 
      id: 'new-channel-id',
      name: 'Test Channel',
      description: 'Test description',
      createdAt: Date.now(),
      participants: []
    }),
    joinTeamChannel: vi.fn().mockResolvedValue(true),
    sendMessage: vi.fn().mockResolvedValue('mock-message-id')
  };
  
  return { default: mockNostrService };
});

describe('NostrChatAdapter', () => {
  let adapter: NostrChatAdapter;
  const mockNostrService = (vi.mocked(require('../../../services/nostrService'))).default;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create adapter instance
    adapter = new NostrChatAdapter({
      userId: 'test-user',
      userName: 'Test User'
    });
  });
  
  afterEach(async () => {
    if (adapter.isConnected()) {
      await adapter.disconnect();
    }
  });
  
  it('should create an instance', () => {
    expect(adapter).toBeInstanceOf(NostrChatAdapter);
  });
  
  it('should connect successfully', async () => {
    await adapter.connect();
    expect(adapter.isConnected()).toBe(true);
    expect(mockNostrService.initialize).toHaveBeenCalled();
  });
  
  it('should create a channel', async () => {
    await adapter.connect();
    
    const channel = await adapter.createChannel('Test Channel', 'team', []);
    expect(channel).toBeDefined();
    expect(channel.id).toBe('new-channel-id');
    expect(mockNostrService.createTeamChannel).toHaveBeenCalled();
  });
  
  it('should join a channel', async () => {
    await adapter.connect();
    
    await adapter.joinChannel('test-channel');
    expect(mockNostrService.joinTeamChannel).toHaveBeenCalledWith('test-channel', 'test-user', 'UNCLASSIFIED');
  });
  
  it('should send a message', async () => {
    await adapter.connect();
    
    const message = await adapter.sendMessage('test-channel', 'Hello World');
    expect(message).toBeDefined();
    expect(message.content).toBe('Hello World');
    expect(mockNostrService.sendMessage).toHaveBeenCalledWith('test-channel', 'Hello World', 'text');
  });
  
  it('should get messages', async () => {
    await adapter.connect();
    
    const messages = await adapter.getMessages('test-channel');
    expect(messages).toBeDefined();
    expect(messages.length).toBeGreaterThan(0);
  });
  
  it('should get channels', async () => {
    await adapter.connect();
    
    const channels = await adapter.getChannels();
    expect(channels).toBeDefined();
    expect(channels.length).toBeGreaterThan(0);
  });
});
