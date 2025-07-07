#!/usr/bin/env node
/**
 * chat-test-runner.js
 * 
 * A simplified test script to verify basic chat functionality during development.
 * This script focuses on testing the Gun chat provider for quick verification.
 */

import { GunChatAdapter } from '../src/lib/chat/adapters/GunChatAdapter.ts';
import { ChatErrorType } from '../src/lib/chat/utils/ChatErrorHandling.ts';
import { randomUUID } from 'crypto';

// Configuration
const CONFIG = {
  // Test settings
  timeout: {
    connect: 10000,
    message: 5000,
    operation: 3000
  },
  
  // Test user information
  users: {
    a: { id: 'test-user-a', name: 'Test User A' },
    b: { id: 'test-user-b', name: 'Test User B' }
  },
  
  // Channels to test
  channels: {
    global: 'global',
    testGroup: `test-group-${randomUUID().substring(0, 8)}`
  }
};

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

// Helper for timing out promises
async function withTimeout(promise, timeoutMs, operation) {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation "${operation}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper for delaying
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run tests for Gun provider
async function testGunProvider() {
  log.header(`TESTING GUN CHAT PROVIDER`);
  
  let providerA = null;
  let providerB = null;
  
  try {
    // Create providers
    log.info(`Creating Gun providers...`);
    providerA = new GunChatAdapter({
      userId: CONFIG.users.a.id,
      userName: CONFIG.users.a.name
    });
    
    providerB = new GunChatAdapter({
      userId: CONFIG.users.b.id,
      userName: CONFIG.users.b.name
    });
    
    log.success(`Created Gun providers`);
    
    // Connect providers
    log.info('Connecting providers...');
    await Promise.all([
      withTimeout(providerA.connect(), CONFIG.timeout.connect, 'Connect provider A'),
      withTimeout(providerB.connect(), CONFIG.timeout.connect, 'Connect provider B')
    ]);
    log.success('Connected both providers');
    
    // Test global chat
    await testGlobalChat(providerA, providerB);
    
    // Disconnect
    log.info('Disconnecting providers...');
    await Promise.all([
      providerA.disconnect(),
      providerB.disconnect()
    ]);
    log.success('Disconnected both providers');
    
    log.success(`GUN PROVIDER TESTS PASSED`);
    return true;
  } catch (error) {
    log.error(`GUN PROVIDER TESTS FAILED`, error);
    
    // Clean up if needed
    try {
      if (providerA && providerA.isConnected()) {
        await providerA.disconnect();
      }
      
      if (providerB && providerB.isConnected()) {
        await providerB.disconnect();
      }
    } catch (cleanupError) {
      log.warn(`Error during cleanup: ${cleanupError.message}`);
    }
    
    return false;
  }
}

// Test global chat functionality
async function testGlobalChat(providerA, providerB) {
  log.header('TESTING GLOBAL CHAT');
  
  const channelId = CONFIG.channels.global;
  const testMessage = `Test message ${Date.now()}`;
  let messageReceived = false;
  
  // Subscribe to messages on provider B
  const unsubscribe = providerB.subscribeToMessages(channelId, (message) => {
    if (message.senderId === CONFIG.users.a.id && message.content === testMessage) {
      messageReceived = true;
      log.success(`Message received by user B: ${message.content}`);
    }
  });
  
  // Send message from provider A
  log.info(`User A sending message: ${testMessage}`);
  await providerA.sendMessage(channelId, testMessage);
  log.success('Message sent by user A');
  
  // Wait for message to be received
  log.info('Waiting for message to be received...');
  const startTime = Date.now();
  const messageTimeout = CONFIG.timeout.message;
  let receivedWithinTimeout = false;
  
  while (Date.now() - startTime < messageTimeout) {
    if (messageReceived) {
      receivedWithinTimeout = true;
      break;
    }
    await delay(500);
  }
  
  // Clean up subscription
  unsubscribe();
  
  // Check if message was received
  if (!receivedWithinTimeout) {
    throw new Error(`Message not received within ${messageTimeout}ms timeout`);
  }
  
  // Verify message persistence by getting messages
  log.info('Retrieving messages to verify persistence...');
  const messages = await providerA.getMessages(channelId);
  
  const foundMessage = messages.some(m => 
    m.senderId === CONFIG.users.a.id && 
    m.content === testMessage
  );
  
  if (foundMessage) {
    log.success('Message was successfully persisted and retrieved');
  } else {
    log.warn('Message was not found in channel history');
  }
  
  log.success('Global chat test passed');
}

// Run the test
async function runTest() {
  console.log('\n' + LOG_COLORS.bgBlue + LOG_COLORS.white + ' STARCOM CHAT DEV TEST ' + LOG_COLORS.reset);
  log.info('Starting simplified Gun chat test for development validation');
  
  const success = await testGunProvider();
  
  // Print summary
  log.header('TEST SUMMARY');
  
  if (success) {
    log.success(`GUN CHAT: PASSED`);
    process.exit(0);
  } else {
    log.error(`GUN CHAT: FAILED`);
    process.exit(1);
  }
}

// Run test
runTest().catch(error => {
  log.error('Test runner failed', error);
  process.exit(1);
});
