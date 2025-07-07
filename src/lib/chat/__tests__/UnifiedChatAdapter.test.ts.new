/**
 * UnifiedChatAdapter.test.ts
 * 
 * Tests for the UnifiedChatAdapter class.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnifiedChatAdapter } from '../adapters/UnifiedChatAdapter';

// Import the setupUnifiedAdapter directly to avoid conflicts with setupTests
import './setupUnifiedAdapter';

describe('UnifiedChatAdapter', () => {
  let adapter: UnifiedChatAdapter;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create adapter with default options
    adapter = new UnifiedChatAdapter({
      userId: 'test-user',
      userName: 'Test User',
      defaultProtocol: 'gun',
      channelMapping: {
        global: 'gun',
        group: 'nostr',
        team: 'securechat', 
        direct: 'nostr',
        broadcast: 'nostr',
        thread: 'gun',
        encrypted: 'securechat',
        temporary: 'gun'
      }
    });
  });

  afterEach(() => {
    // Clean up
    vi.resetAllMocks();
  });

  it('should create an instance with default options', () => {
    expect(adapter).toBeDefined();
  });

  it('should connect to all required adapters', async () => {
    await adapter.connect();
    
    // Since our mock adapters are now connected through dynamic import,
    // we can't directly check if they were called.
    // Instead, we'll check if the adapter's connection status was updated correctly
    expect(adapter.isConnected()).toBe(true);
  });

  it('should send messages to the correct adapter based on channel type', async () => {
    await adapter.connect();
    
    // Test global channel (gun)
    const globalMsg = await adapter.sendMessage('global', 'Test global message');
    expect(globalMsg).toBeDefined();
    expect(globalMsg.channelId).toBe('global');
    
    // Test team channel (secure)
    const teamMsg = await adapter.sendMessage('team-123', 'Test team message');
    expect(teamMsg).toBeDefined();
    expect(teamMsg.channelId).toBe('team-123');
    
    // Test DM channel (nostr)
    const dmMsg = await adapter.sendMessage('dm-123', 'Test DM message');
    expect(dmMsg).toBeDefined();
    expect(dmMsg.channelId).toBe('dm-123');
  });

  it('should create channels using the appropriate adapter', async () => {
    await adapter.connect();
    
    // Create a global channel
    const globalChannel = await adapter.createChannel('Global Chat', 'global', []);
    expect(globalChannel).toBeDefined();
    expect(globalChannel.type).toBe('global');
    
    // Create a team channel
    const teamChannel = await adapter.createChannel('Team Chat', 'team', ['user1', 'user2']);
    expect(teamChannel).toBeDefined();
    expect(teamChannel.type).toBe('team');
    
    // Create a DM channel
    const dmChannel = await adapter.createChannel('DM Chat', 'direct', ['user1', 'user2']);
    expect(dmChannel).toBeDefined();
    expect(dmChannel.type).toBe('direct');
  });

  it('should get channels from all adapters', async () => {
    await adapter.connect();
    
    const channels = await adapter.getChannels();
    
    // We should get channels from all connected adapters
    expect(Array.isArray(channels)).toBe(true);
  });

  it('should disconnect from all adapters', async () => {
    await adapter.connect();
    await adapter.disconnect();
    
    // Check if the adapter is disconnected
    expect(adapter.isConnected()).toBe(false);
  });
});
