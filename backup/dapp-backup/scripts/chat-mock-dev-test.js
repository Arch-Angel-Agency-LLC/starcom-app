#!/usr/bin/env node
/**
 * chat-mock-dev-test.js
 * 
 * A test script that uses a mocked chat provider for isolated testing.
 * This avoids issues with browser APIs or external dependencies.
 */

import { EventEmitter } from 'events';
import { createChatError, ChatErrorType, ChatLogger } from '../src/lib/chat/utils/ChatErrorHandling.ts';
import { randomUUID } from 'crypto';

// Logging utilities
const LOG_COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m'
};

const log = {
  info: (message) => console.log(`${LOG_COLORS.blue}ℹ INFO:${LOG_COLORS.reset} ${message}`),
  success: (message) => console.log(`${LOG_COLORS.green}✓ SUCCESS:${LOG_COLORS.reset} ${message}`),
  warn: (message) => console.log(`${LOG_COLORS.yellow}⚠ WARNING:${LOG_COLORS.reset} ${message}`),
  error: (message, error) => console.error(
    `${LOG_COLORS.red}✗ ERROR:${LOG_COLORS.reset} ${message}${error ? `: ${error.message}` : ''}`
  ),
  header: (message) => console.log(`\n${LOG_COLORS.bgBlue}${LOG_COLORS.white} ${message} ${LOG_COLORS.reset}`)
};

// Mock Chat Provider
class MockChatProvider {
  constructor(options = {}) {
    this.userId = options.userId || 'mock-user';
    this.userName = options.userName || 'Mock User';
    this.connected = false;
    this.messages = new Map();
    this.channels = new Set(['global']);
    this.eventEmitter = new EventEmitter();
    this.logger = new ChatLogger('MockChatProvider', { level: 'debug' });
    
    // Add some mock messages
    this.messages.set('global', [
      {
        id: 'msg1',
        content: 'Hello from mock provider',
        sender: 'system',
        timestamp: Date.now() - 10000
      }
    ]);
    
    this.logger.info('Mock chat provider initialized', {
      userId: this.userId,
      userName: this.userName
    });
  }
  
  // Connect to the chat system
  async connect() {
    if (this.connected) {
      return true;
    }
    
    this.logger.info('Connecting to mock chat provider...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Random fail 10% of the time
    if (Math.random() < 0.1) {
      const error = createChatError(
        'Failed to connect to mock provider',
        ChatErrorType.CONNECTION,
        'connection_failed',
        true
      );
      this.logger.error('Connection failed', error);
      throw error;
    }
    
    this.connected = true;
    this.eventEmitter.emit('connected');
    this.logger.info('Connected to mock chat provider');
    
    return true;
  }
  
  // Disconnect from the chat system
  async disconnect() {
    if (!this.connected) {
      return true;
    }
    
    this.logger.info('Disconnecting from mock chat provider...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.connected = false;
    this.eventEmitter.emit('disconnected');
    this.logger.info('Disconnected from mock chat provider');
    
    return true;
  }
  
  // Send a message to a channel
  async sendMessage(channelId, content) {
    if (!this.connected) {
      throw createChatError(
        'Not connected to chat provider',
        ChatErrorType.CONNECTION,
        'not_connected',
        true
      );
    }
    
    if (!channelId) {
      throw createChatError(
        'Channel ID is required',
        ChatErrorType.INVALID_INPUT,
        'missing_channel_id',
        false
      );
    }
    
    if (!content) {
      throw createChatError(
        'Message content is required',
        ChatErrorType.INVALID_INPUT,
        'missing_content',
        false
      );
    }
    
    this.logger.info(`Sending message to channel ${channelId}`, {
      channelId,
      contentLength: content.length
    });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Create the channel if it doesn't exist
    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
      this.channels.add(channelId);
    }
    
    // Create message object
    const message = {
      id: `msg-${randomUUID()}`,
      content,
      sender: this.userId,
      senderName: this.userName,
      timestamp: Date.now()
    };
    
    // Add message to channel
    this.messages.get(channelId).push(message);
    
    // Emit message event
    this.eventEmitter.emit('message', channelId, message);
    
    this.logger.info(`Message sent to channel ${channelId}`, {
      messageId: message.id
    });
    
    return message;
  }
  
  // Get messages from a channel
  async getMessages(channelId, limit = 50) {
    if (!this.connected) {
      throw createChatError(
        'Not connected to chat provider',
        ChatErrorType.CONNECTION,
        'not_connected',
        true
      );
    }
    
    if (!channelId) {
      throw createChatError(
        'Channel ID is required',
        ChatErrorType.INVALID_INPUT,
        'missing_channel_id',
        false
      );
    }
    
    this.logger.info(`Getting messages from channel ${channelId}`, {
      channelId,
      limit
    });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return messages for the channel or an empty array if channel doesn't exist
    const messages = this.messages.get(channelId) || [];
    
    // Apply limit and return the most recent messages
    return messages.slice(-limit);
  }
  
  // Subscribe to events
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  
  // Unsubscribe from events
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }
  
  // Get a list of available channels
  async getChannels() {
    if (!this.connected) {
      throw createChatError(
        'Not connected to chat provider',
        ChatErrorType.CONNECTION,
        'not_connected',
        true
      );
    }
    
    this.logger.info('Getting channels');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return Array.from(this.channels).map(id => ({
      id,
      name: id === 'global' ? 'Global Chat' : `Channel ${id}`,
      description: `This is the ${id} channel`
    }));
  }
}

// Test the mock provider
async function testMockProvider() {
  log.header('TESTING MOCK CHAT PROVIDER');
  
  const provider = new MockChatProvider({
    userId: 'test-user',
    userName: 'Test User'
  });
  
  try {
    // Test connection
    log.info('Testing connection...');
    await provider.connect();
    log.success('Connected to mock provider');
    
    // Test getting channels
    log.info('Testing channel listing...');
    const channels = await provider.getChannels();
    log.success(`Found ${channels.length} channels`);
    
    // Test getting messages
    log.info('Testing message retrieval...');
    const messages = await provider.getMessages('global');
    log.success(`Retrieved ${messages.length} messages from global channel`);
    
    // Test sending a message
    log.info('Testing message sending...');
    const testContent = `Test message at ${new Date().toISOString()}`;
    const sentMessage = await provider.sendMessage('global', testContent);
    log.success(`Sent message with ID: ${sentMessage.id}`);
    
    // Test event listener
    log.info('Testing event listener...');
    let messageReceived = false;
    
    provider.on('message', (channelId, message) => {
      if (channelId === 'test-channel' && message.content === 'Event test') {
        messageReceived = true;
        log.success('Received message event');
      }
    });
    
    await provider.sendMessage('test-channel', 'Event test');
    
    // Give some time for the event to be processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!messageReceived) {
      log.warn('Event listener may not be working correctly');
    }
    
    // Test disconnection
    log.info('Testing disconnection...');
    await provider.disconnect();
    log.success('Disconnected from mock provider');
    
    return true;
  } catch (error) {
    log.error('Mock provider test failed', error);
    return false;
  }
}

// Test error handling
async function testErrorHandling() {
  log.header('TESTING ERROR HANDLING');
  
  const provider = new MockChatProvider();
  
  try {
    // Test sending message without connecting
    log.info('Testing error when not connected...');
    try {
      await provider.sendMessage('global', 'Should fail');
      log.error('Failed to detect not connected error');
      return false;
    } catch (error) {
      if (error.type === ChatErrorType.CONNECTION && error.code === 'not_connected') {
        log.success('Correctly detected not connected error');
      } else {
        log.error('Wrong error type', error);
        return false;
      }
    }
    
    // Connect for further tests
    await provider.connect();
    
    // Test invalid input
    log.info('Testing invalid input error...');
    try {
      await provider.sendMessage('', 'Should fail');
      log.error('Failed to detect missing channel ID');
      return false;
    } catch (error) {
      if (error.type === ChatErrorType.INVALID_INPUT && error.code === 'missing_channel_id') {
        log.success('Correctly detected missing channel ID');
      } else {
        log.error('Wrong error type', error);
        return false;
      }
    }
    
    // Test missing content
    log.info('Testing missing content error...');
    try {
      await provider.sendMessage('global', '');
      log.error('Failed to detect missing content');
      return false;
    } catch (error) {
      if (error.type === ChatErrorType.INVALID_INPUT && error.code === 'missing_content') {
        log.success('Correctly detected missing content');
      } else {
        log.error('Wrong error type', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    log.error('Error handling test failed', error);
    return false;
  } finally {
    // Disconnect if connected
    if (provider.connected) {
      await provider.disconnect();
    }
  }
}

// Run all tests
async function runAllTests() {
  log.header('STARCOM CHAT MOCK PROVIDER TEST');
  log.info('Starting mock provider test for development');
  
  const results = {
    mockProvider: false,
    errorHandling: false
  };
  
  // Test mock provider
  results.mockProvider = await testMockProvider();
  
  // Test error handling
  results.errorHandling = await testErrorHandling();
  
  // Print test summary
  log.header('TEST SUMMARY');
  
  if (results.mockProvider) {
    log.success('MOCK PROVIDER: PASSED');
  } else {
    log.error('MOCK PROVIDER: FAILED');
  }
  
  if (results.errorHandling) {
    log.success('ERROR HANDLING: PASSED');
  } else {
    log.error('ERROR HANDLING: FAILED');
  }
  
  // Final result
  if (Object.values(results).every(result => result)) {
    log.success('ALL TESTS PASSED');
    process.exit(0);
  } else {
    log.error('SOME TESTS FAILED');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  log.error('Test runner failed', error);
  process.exit(1);
});
