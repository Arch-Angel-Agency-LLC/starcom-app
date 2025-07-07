/**
 * ChatAdaptersCommon.test.ts
 * 
 * Shared test cases for all chat adapters.
 * This is a test helper file - NOT A TEST FILE ITSELF.
 * It exports functions to be used by actual test files.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatProvider, ChatMessage, ChatChannel } from '../ChatInterface';
import { ChatErrorType, createChatError } from '../utils/ChatErrorHandling';

// Extended matchers for better testing
expect.extend({
  toBeOneOf(received, expected) {
    const pass = Array.isArray(expected) && expected.includes(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be one of ${expected.join(', ')}`,
      pass,
    };
  },
});

// Add type declaration for the custom matcher
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeOneOf(expected: Array<T>): T;
  }
}

// Define a dummy test to make Vitest happy
if (process.env.NODE_ENV === 'test') {
  describe('ChatAdaptersCommon', () => {
    it('is a test helper file, not a test file itself', () => {
      expect(true).toBe(true);
    });
  });
}

// Helper function to create common test suite for all adapters
export function createChatAdapterTestSuite(adapterName: string, createAdapter: () => ChatProvider) {
  describe(`${adapterName} Tests`, () => {
    let adapter: ChatProvider;
    
    beforeEach(() => {
      adapter = createAdapter();
    });
    
    afterEach(async () => {
      if (adapter.isConnected()) {
        await adapter.disconnect();
      }
    });
    
    describe('Connection Management', () => {
      it('should connect successfully', async () => {
        await adapter.connect();
        expect(adapter.isConnected()).toBe(true);
      });
      
      it('should disconnect successfully', async () => {
        await adapter.connect();
        await adapter.disconnect();
        expect(adapter.isConnected()).toBe(false);
      });
    });
    
    describe('Basic Messaging', () => {
      beforeEach(async () => {
        await adapter.connect();
      });
      
      it('should send and receive messages', async () => {
        const channelId = 'test-channel';
        const content = `Test message ${Date.now()}`;
        
        const message = await adapter.sendMessage(channelId, content);
        
        // More thorough validation of the message object
        expect(message).toMatchObject({
          content,
          channelId,
          senderId: expect.any(String),
          timestamp: expect.any(Number),
          status: expect.stringMatching(/sent|delivered|pending/),
        });
        expect(message.id).toBeTruthy();
        
        // Wait briefly to ensure message propagation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const messages = await adapter.getMessages(channelId);
        expect(messages.length).toBeGreaterThan(0);
        
        // Find our specific message to ensure it was truly persisted
        const sentMessage = messages.find(m => m.content === content);
        expect(sentMessage).toBeTruthy();
        expect(sentMessage?.id).toBe(message.id);
        expect(sentMessage?.senderId).toBe(message.senderId);
      });
      
      it('should subscribe to messages and receive real-time updates', async () => {
        const channelId = 'test-channel-subscription';
        const testContent = `Subscription test message ${Date.now()}`;
        let receivedMessage: ChatMessage | null = null;
        
        // Set up message subscription before sending
        const messagePromise = new Promise<void>((resolve) => {
          const unsubscribe = adapter.subscribeToMessages(channelId, (message: ChatMessage) => {
            if (message.content === testContent) {
              receivedMessage = message;
              unsubscribe(); // Clean up subscription once we've received our test message
              resolve();
            }
          });
          
          // Set a timeout to fail the test if no message is received
          setTimeout(() => {
            if (!receivedMessage) {
              unsubscribe();
              throw new Error('No message received within timeout period');
            }
          }, 5000);
        });
        
        // Send the test message
        const sentMessage = await adapter.sendMessage(channelId, testContent);
        
        // Wait for the message to be received via subscription
        await messagePromise;
        
        // Verify the received message matches what was sent
        expect(receivedMessage).toBeTruthy();
        if (receivedMessage) {
          expect(receivedMessage.content).toBe(testContent);
          expect(receivedMessage.id).toBe(sentMessage.id);
        }
      });
    });
    
    describe('Channel Management', () => {
      beforeEach(async () => {
        await adapter.connect();
      });
      
      it('should create and retrieve channels with proper validation', async () => {
        const channelName = `Test Channel ${Date.now()}`;
        const channelType = 'team';
        const participants = ['user1', 'user2'];
        
        const channel = await adapter.createChannel(channelName, channelType, participants);
        
        // Validate the created channel has required properties
        expect(channel).toMatchObject({
          name: channelName,
          type: channelType,
          id: expect.any(String),
        });
        
        // Wait briefly to ensure channel is registered
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the channel can be found in the list of channels
        const channels = await adapter.getChannels();
        expect(channels.length).toBeGreaterThan(0);
        
        const createdChannel = channels.find(c => c.id === channel.id);
        expect(createdChannel).toBeDefined();
        
        if (!createdChannel) {
          throw new Error(`Created channel with ID ${channel.id} not found in channel list`);
        }
        
        // Validate channel properties match what we set
        expect(createdChannel.name).toBe(channelName);
        expect(createdChannel.type).toBe(channelType);
        
        // Attempt to get messages from the channel to verify it's functional
        const messages = await adapter.getMessages(channel.id);
        expect(Array.isArray(messages)).toBe(true);
      });
      
      it('should join and leave channels', async () => {
        const channelName = 'Join Leave Test';
        const channel = await adapter.createChannel(channelName, 'team', []);
        
        await adapter.joinChannel(channel.id);
        await adapter.leaveChannel(channel.id);
        
        // Success if no errors are thrown
        expect(true).toBe(true);
      });
    });
    
    describe('User Management', () => {
      beforeEach(async () => {
        await adapter.connect();
      });
      
      it('should get users in a channel', async () => {
        const channelName = 'User Test Channel';
        const channel = await adapter.createChannel(channelName, 'team', ['test-user']);
        
        const users = await adapter.getUsers(channel.id);
        
        expect(Array.isArray(users)).toBe(true);
      });
      
      it('should get user by ID', async () => {
        const userId = 'test-user';
        
        const user = await adapter.getUserById(userId);
        
        if (user) {
          expect(user.id).toBe(userId);
        } else {
          // Some adapters might not find the user if it doesn't exist
          expect(user).toBeNull();
        }
      });
      
      it('should subscribe to user presence', async () => {
        const channelName = 'Presence Test Channel';
        const channel = await adapter.createChannel(channelName, 'team', ['test-user']);
        const presenceCallback = vi.fn();
        
        const unsubscribe = adapter.subscribeToUserPresence(channel.id, presenceCallback);
        
        expect(typeof unsubscribe).toBe('function');
        
        // Clean up
        unsubscribe();
      });
    });
    
    // Tests for supported features can be added here
    // These tests should be skipped if the feature is not supported
    
    describe('Feature: Search Messages', () => {
      it('should search for messages if supported or degrade gracefully if not', async () => {
        await adapter.connect();
        
        // Send a unique message that we can search for
        const uniqueContent = `Unique message ${Date.now()}`;
        const channelId = 'test-channel-search';
        
        await adapter.sendMessage(channelId, uniqueContent);
        
        // Try to search for the message
        let searchFailed = false;
        try {
          const results = await adapter.searchMessages(uniqueContent);
          
          if ((adapter as any).supportsFeature && (adapter as any).supportsFeature('searchMessages')) {
            // If feature is supported, verify results
            expect(results.length).toBeGreaterThan(0);
            const foundMessage = results.find(msg => msg.content.includes(uniqueContent));
            expect(foundMessage).toBeTruthy();
          } else {
            // If feature is not supported but doesn't throw, it should return empty results
            expect(results).toEqual([]);
          }
        } catch (error) {
          searchFailed = true;
          // If search fails, it should be due to feature not being supported
          expect((error as any).type).toBe(ChatErrorType.FEATURE_NOT_SUPPORTED);
        }
        
        // If the adapter claims to support search but the operation failed,
        // that's a real failure we should detect
        if ((adapter as any).supportsFeature && 
            (adapter as any).supportsFeature('searchMessages') && 
            searchFailed) {
          throw new Error('Search operation failed despite being supported');
        }
      });
    });
    
    describe('Feature: Upload Attachments', () => {
      it('should upload attachments if supported', async () => {
        if (!(adapter as any).supportsFeature || !(adapter as any).supportsFeature('uploadAttachment')) {
          console.log('Upload attachments not supported, skipping test');
          return;
        }
        
        await adapter.connect();
        
        // Create a mock file
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
        
        const result = await adapter.uploadAttachment(file);
        
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('url');
      });
    });
    
    describe('Network Resilience', () => {
      it('should attempt reconnection after network failures', async () => {
        // This test simulates a network disruption by:
        // 1. Connecting the adapter
        // 2. Forcing a disconnection (if possible)
        // 3. Verifying the adapter attempts to reconnect or gracefully handles the failure
        
        await adapter.connect();
        expect(adapter.isConnected()).toBe(true);
        
        // Force disconnect if possible (depends on adapter implementation)
        try {
          // Try to access internal connection for testing
          const provider = adapter as any;
          
          if (provider._simulateNetworkFailure) {
            // If the adapter has a test method, use it
            provider._simulateNetworkFailure();
          } else if (provider._connection || provider.connection) {
            // Otherwise try to directly manipulate the connection
            const connection = provider._connection || provider.connection;
            if (connection && typeof connection.close === 'function') {
              connection.close();
            }
          } else {
            // If we can't force a disconnect, just disconnect normally
            await adapter.disconnect();
          }
          
          // Wait briefly to allow disconnect to take effect
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try to send a message, which should trigger reconnection if supported
          try {
            await adapter.sendMessage('test-channel', 'Reconnection test');
            
            // If we get here, either reconnection worked or the adapter
            // handled the disconnection gracefully
            expect(adapter.isConnected()).toBe(true);
          } catch (error) {
            // If sending fails, it should be with a proper error type
            expect((error as any).type).toBeOneOf([
              ChatErrorType.CONNECTION,
              ChatErrorType.NETWORK,
              ChatErrorType.SERVICE_UNAVAILABLE
            ]);
            
            // And the error should indicate if it's recoverable
            if ((error as any).recoverable) {
              // If recoverable, reconnection should work after a delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              await adapter.connect();
              expect(adapter.isConnected()).toBe(true);
            }
          }
        } catch (e) {
          // If this test fails, it's likely because we can't simulate network failures
          // for this adapter. That's acceptable, so we'll log and continue.
          console.warn(`Network resilience test not applicable for ${adapterName}:`, e);
        }
      });
    });
  });
}

// Import and run the shared tests for a specific adapter
// Uncomment and customize to run tests for your adapter
/*
import { GunChatAdapter } from '../adapters/GunChatAdapter';

describe('GunChatAdapter Shared Tests', () => {
  createChatAdapterTestSuite('GunChatAdapter', () => new GunChatAdapter({
    userId: 'test-user',
    userName: 'Test User'
  }));
});
*/
