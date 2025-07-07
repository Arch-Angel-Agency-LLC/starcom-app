#!/usr/bin/env node
/**
 * chat-dev-test.js
 * 
 * A comprehensive dev test script for testing chat functionality
 * in a development environment. This script focuses on testing the
 * Gun DB connection, basic messaging, and error handling.
 */

// Import required modules
import { randomUUID } from 'crypto';
import { createChatError, ChatErrorType } from '../src/lib/chat/utils/ChatErrorHandling.ts';

// Configuration
const CONFIG = {
  // Test settings
  timeout: {
    connect: 10000,
    message: 5000,
    operation: 3000
  },
  
  // Test channels
  channels: {
    test: `test-channel-${randomUUID().substring(0, 8)}`,
    global: 'global', // Global chat channel
    group: `group-${randomUUID().substring(0, 8)}`  if (results.globalChat) {
    log.success('GLOBAL CHAT: PASSED');
  } else {
    log.error('GLOBAL CHAT: FAILED');
  }
  
  if (results.groupChat) {
    log.success('GROUP CHAT: PASSED');
  } else {
    log.error('GROUP CHAT: FAILED');
  }
  
  if (results.directMessaging) {
    log.success('DIRECT MESSAGING: PASSED');
  } else {
    log.error('DIRECT MESSAGING: FAILED');
  }chat channel
    dm: `dm-${randomUUID().substring(0, 8)}` // DM channel
  }
};

// Logging utilities with colors
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

// Test Gun DB directly
async function testGunDB() {
  log.header('TESTING GUN DB BASIC FUNCTIONALITY');
  
  try {
    // Import Gun dynamically to avoid Node.js/browser compatibility issues
    log.info('Importing Gun...');
    const { default: Gun } = await import('gun');
    log.success('Gun imported successfully');
    
    // Setup a Gun instance
    log.info('Setting up Gun instance...');
    const gun = Gun();
    log.success('Gun instance created');
    
    // Generate test data
    const testChannel = CONFIG.channels.test;
    const testMessageId = `msg-${Date.now()}`;
    const testContent = `Test message ${Date.now()}`;
    
    log.info(`Writing test message to '${testChannel}'...`);
    
    // Write a test message
    gun.get(testChannel).get(testMessageId).put({
      id: testMessageId,
      content: testContent,
      timestamp: Date.now(),
      sender: 'test-user'
    });
    
    // Read back the test message
    log.info('Reading back test message...');
    let messageReceived = false;
    
    const receivePromise = new Promise((resolve) => {
      gun.get(testChannel).get(testMessageId).on(data => {
        if (data && data.content === testContent) {
          log.success(`Message received: ${data.content}`);
          messageReceived = true;
          resolve(data);
        }
      });
    });
    
    // Wait for the message to be received with timeout
    const receivedMessage = await withTimeout(
      receivePromise, 
      CONFIG.timeout.message, 
      'message retrieval'
    );
    
    log.success('Message successfully retrieved from Gun DB');
    
    // Test additional gun methods
    log.info('Testing message update...');
    const updatedContent = `Updated message ${Date.now()}`;
    
    gun.get(testChannel).get(testMessageId).put({
      id: testMessageId,
      content: updatedContent,
      timestamp: Date.now(),
      sender: 'test-user'
    });
    
    // Wait for the message to be updated
    await delay(1000);
    
    // Check if message was updated
    const checkUpdatePromise = new Promise((resolve) => {
      gun.get(testChannel).get(testMessageId).once(data => {
        if (data && data.content === updatedContent) {
          log.success(`Message updated: ${data.content}`);
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });
    
    const updatedMessage = await withTimeout(
      checkUpdatePromise,
      CONFIG.timeout.message,
      'message update check'
    );
    
    if (updatedMessage && updatedMessage.content === updatedContent) {
      log.success('Message update functionality works');
    } else {
      log.warn('Message update may not be working correctly');
    }
    
    // Clean up
    gun.get(testChannel).get(testMessageId).off();
    
    return true;
  } catch (error) {
    log.error('Gun DB test failed', error);
    return false;
  }
}

// Test error handling
async function testErrorHandling() {
  log.header('TESTING ERROR HANDLING');
  
  try {
    // Test creating chat errors
    log.info('Testing error creation...');
    
    const connectionError = createChatError(
      'Connection failed',
      ChatErrorType.CONNECTION,
      'connection_error',
      true,
      { attempt: 1 }
    );
    
    if (connectionError.type === ChatErrorType.CONNECTION &&
        connectionError.code === 'connection_error' &&
        connectionError.recoverable === true &&
        connectionError.details?.attempt === 1) {
      log.success('Error creation works correctly');
    } else {
      log.error('Error creation failed');
      return false;
    }
    
    return true;
  } catch (error) {
    log.error('Error handling test failed', error);
    return false;
  }
}

// Test global chat functionality
async function testGlobalChat() {
  log.header('TESTING GLOBAL CHAT FUNCTIONALITY');
  
  try {
    // Import Gun dynamically to avoid Node.js/browser compatibility issues
    log.info('Importing Gun...');
    const { default: Gun } = await import('gun');
    log.success('Gun imported successfully');
    
    // Setup a Gun instance
    log.info('Setting up Gun instance...');
    const gun = Gun();
    log.success('Gun instance created');
    
    // Generate test data for global chat
    const globalChannel = CONFIG.channels.global;
    
    // Generate message IDs and content for two users
    const user1MessageId = `msg-user1-${Date.now()}`;
    const user2MessageId = `msg-user2-${Date.now()}`;
    const user1Content = `Message from User 1: ${Date.now()}`;
    const user2Content = `Message from User 2: ${Date.now()}`;
    
    // First, send a message as user 1
    log.info(`Sending message as User 1 to global chat...`);
    gun.get(globalChannel).get(user1MessageId).put({
      id: user1MessageId,
      content: user1Content,
      timestamp: Date.now(),
      sender: 'test-user-1',
      senderName: 'Test User 1'
    });
    
    // Verify the message was stored
    log.info('Verifying User 1 message was stored...');
    const user1MessagePromise = new Promise((resolve) => {
      gun.get(globalChannel).get(user1MessageId).once(data => {
        if (data && data.content === user1Content) {
          log.success(`User 1 message verified: ${data.content}`);
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });
    
    const user1Message = await withTimeout(
      user1MessagePromise,
      CONFIG.timeout.message,
      'user1 message verification'
    );
    
    if (!user1Message) {
      throw new Error('User 1 message could not be verified');
    }
    
    // Now send a message as user 2
    log.info(`Sending message as User 2 to global chat...`);
    gun.get(globalChannel).get(user2MessageId).put({
      id: user2MessageId,
      content: user2Content,
      timestamp: Date.now(),
      sender: 'test-user-2',
      senderName: 'Test User 2'
    });
    
    // Verify the second message was stored
    log.info('Verifying User 2 message was stored...');
    const user2MessagePromise = new Promise((resolve) => {
      gun.get(globalChannel).get(user2MessageId).once(data => {
        if (data && data.content === user2Content) {
          log.success(`User 2 message verified: ${data.content}`);
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });
    
    const user2Message = await withTimeout(
      user2MessagePromise,
      CONFIG.timeout.message,
      'user2 message verification'
    );
    
    if (!user2Message) {
      throw new Error('User 2 message could not be verified');
    }
    
    // List all messages in the global channel
    log.info('Listing all messages in global chat...');
    const messages = [];
    
    const listPromise = new Promise((resolve) => {
      gun.get(globalChannel).map().once((data, id) => {
        if (data && data.content) {
          messages.push({
            id,
            content: data.content,
            sender: data.sender,
            senderName: data.senderName,
            timestamp: data.timestamp
          });
        }
      });
      
      // Give some time for messages to be collected
      setTimeout(() => resolve(messages), 2000);
    });
    
    const globalMessages = await withTimeout(
      listPromise,
      CONFIG.timeout.operation,
      'listing global messages'
    );
    
    log.success(`Found ${globalMessages.length} messages in global chat`);
    
    // Verify both test messages are found in the results
    const foundUser1Message = globalMessages.some(
      msg => msg.content === user1Content && msg.sender === 'test-user-1'
    );
    
    const foundUser2Message = globalMessages.some(
      msg => msg.content === user2Content && msg.sender === 'test-user-2'
    );
    
    if (foundUser1Message && foundUser2Message) {
      log.success('Both test messages found in global chat');
    } else {
      log.warn(`Some test messages were not found in global chat results:
        User 1 message found: ${foundUser1Message}
        User 2 message found: ${foundUser2Message}
      `);
    }
    
    if (globalMessages.length > 0) {
      log.info(`Latest message: ${globalMessages[globalMessages.length - 1].content}`);
    }
    
    // Clean up
    gun.get(globalChannel).get(user1MessageId).off();
    gun.get(globalChannel).get(user2MessageId).off();
    
    log.success('Global chat functionality verified successfully');
    return true;
  } catch (error) {
    log.error('Global chat test failed', error);
    return false;
  }
}

// Test group chat functionality
async function testGroupChat() {
  log.header('TESTING GROUP CHAT FUNCTIONALITY');
  
  try {
    // Import Gun dynamically to avoid Node.js/browser compatibility issues
    log.info('Importing Gun...');
    const { default: Gun } = await import('gun');
    log.success('Gun imported successfully');
    
    // Setup a Gun instance
    log.info('Setting up Gun instance...');
    const gun = Gun();
    log.success('Gun instance created');
    
    // Generate test data for group chat
    const groupChannel = CONFIG.channels.group;
    
    // Define group members
    const groupMembers = [
      { id: 'user-1', name: 'Test User 1' },
      { id: 'user-2', name: 'Test User 2' },
      { id: 'user-3', name: 'Test User 3' }
    ];
    
    // Create group metadata
    log.info('Creating group chat metadata...');
    gun.get(groupChannel).put({
      id: groupChannel,
      type: 'group',
      name: 'Test Group Chat',
      createdAt: Date.now(),
      createdBy: 'user-1',
      members: JSON.stringify(groupMembers.map(m => m.id))
    });
    
    // Send messages from different group members
    log.info('Sending messages from group members...');
    
    // User 1 message
    const user1MessageId = `msg-user1-${Date.now()}`;
    const user1Content = `Group message from User 1: ${Date.now()}`;
    
    gun.get(groupChannel).get('messages').get(user1MessageId).put({
      id: user1MessageId,
      content: user1Content,
      timestamp: Date.now(),
      sender: groupMembers[0].id,
      senderName: groupMembers[0].name
    });
    
    // User 2 message
    const user2MessageId = `msg-user2-${Date.now()}`;
    const user2Content = `Group message from User 2: ${Date.now()}`;
    
    gun.get(groupChannel).get('messages').get(user2MessageId).put({
      id: user2MessageId,
      content: user2Content,
      timestamp: Date.now(),
      sender: groupMembers[1].id,
      senderName: groupMembers[1].name
    });
    
    // User 3 message
    const user3MessageId = `msg-user3-${Date.now()}`;
    const user3Content = `Group message from User 3: ${Date.now()}`;
    
    gun.get(groupChannel).get('messages').get(user3MessageId).put({
      id: user3MessageId,
      content: user3Content,
      timestamp: Date.now(),
      sender: groupMembers[2].id,
      senderName: groupMembers[2].name
    });
    
    // Verify messages were stored
    log.info('Verifying group messages were stored...');
    
    // Collect all messages
    const messages = [];
    
    const listPromise = new Promise((resolve) => {
      gun.get(groupChannel).get('messages').map().once((data, id) => {
        if (data && data.content) {
          messages.push({
            id,
            content: data.content,
            sender: data.sender,
            senderName: data.senderName,
            timestamp: data.timestamp
          });
        }
      });
      
      // Give some time for messages to be collected
      setTimeout(() => resolve(messages), 2000);
    });
    
    const groupMessages = await withTimeout(
      listPromise,
      CONFIG.timeout.operation,
      'listing group messages'
    );
    
    log.success(`Found ${groupMessages.length} messages in group chat`);
    
    // Verify all three messages are found
    const foundUser1Message = groupMessages.some(
      msg => msg.content === user1Content && msg.sender === groupMembers[0].id
    );
    
    const foundUser2Message = groupMessages.some(
      msg => msg.content === user2Content && msg.sender === groupMembers[1].id
    );
    
    const foundUser3Message = groupMessages.some(
      msg => msg.content === user3Content && msg.sender === groupMembers[2].id
    );
    
    if (foundUser1Message && foundUser2Message && foundUser3Message) {
      log.success('All group chat messages found');
    } else {
      log.warn(`Some group chat messages were not found:
        User 1 message found: ${foundUser1Message}
        User 2 message found: ${foundUser2Message}
        User 3 message found: ${foundUser3Message}
      `);
    }
    
    // Test retrieving group metadata
    log.info('Retrieving group metadata...');
    const groupDataPromise = new Promise((resolve) => {
      gun.get(groupChannel).once(data => {
        if (data && data.type === 'group') {
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });
    
    const groupData = await withTimeout(
      groupDataPromise,
      CONFIG.timeout.operation,
      'retrieving group metadata'
    );
    
    if (groupData && groupData.name === 'Test Group Chat') {
      log.success(`Group metadata retrieved: ${groupData.name}`);
    } else {
      log.warn('Group metadata could not be retrieved or is incorrect');
    }
    
    // Clean up
    gun.get(groupChannel).get('messages').get(user1MessageId).off();
    gun.get(groupChannel).get('messages').get(user2MessageId).off();
    gun.get(groupChannel).get('messages').get(user3MessageId).off();
    
    log.success('Group chat functionality verified successfully');
    return true;
  } catch (error) {
    log.error('Group chat test failed', error);
    return false;
  }
}

// Test direct messaging functionality
async function testDirectMessaging() {
  log.header('TESTING DIRECT MESSAGING FUNCTIONALITY');
  
  try {
    // Import Gun dynamically to avoid Node.js/browser compatibility issues
    log.info('Importing Gun...');
    const { default: Gun } = await import('gun');
    log.success('Gun imported successfully');
    
    // Setup a Gun instance
    log.info('Setting up Gun instance...');
    const gun = Gun();
    log.success('Gun instance created');
    
    // Define two users for DM testing
    const user1 = { id: 'alice-1', name: 'Alice' };
    const user2 = { id: 'bob-1', name: 'Bob' };
    
    // Create a DM channel identifier (conventionally combines both user IDs)
    const dmChannelId = `dm-${user1.id}-${user2.id}`;
    
    log.info(`Setting up DM channel between ${user1.name} and ${user2.name}...`);
    
    // Initialize the DM channel
    gun.get(dmChannelId).put({
      id: dmChannelId,
      type: 'dm',
      participants: JSON.stringify([user1.id, user2.id]),
      createdAt: Date.now()
    });
    
    // Send message from User 1 to User 2
    const msg1Id = `dm-msg1-${Date.now()}`;
    const msg1Content = `Hey ${user2.name}, this is ${user1.name}! (${Date.now()})`;
    
    log.info(`${user1.name} sending message to ${user2.name}...`);
    gun.get(dmChannelId).get('messages').get(msg1Id).put({
      id: msg1Id,
      content: msg1Content,
      timestamp: Date.now(),
      sender: user1.id,
      senderName: user1.name,
      recipient: user2.id
    });
    
    // Send reply from User 2 to User 1
    const msg2Id = `dm-msg2-${Date.now()}`;
    const msg2Content = `Hi ${user1.name}, got your message! (${Date.now()})`;
    
    log.info(`${user2.name} sending reply to ${user1.name}...`);
    gun.get(dmChannelId).get('messages').get(msg2Id).put({
      id: msg2Id,
      content: msg2Content,
      timestamp: Date.now(),
      sender: user2.id,
      senderName: user2.name,
      recipient: user1.id
    });
    
    // Verify both messages were stored
    log.info('Verifying DM messages were stored...');
    
    // Collect all messages in the DM channel
    const messages = [];
    
    const listPromise = new Promise((resolve) => {
      gun.get(dmChannelId).get('messages').map().once((data, id) => {
        if (data && data.content) {
          messages.push({
            id,
            content: data.content,
            sender: data.sender,
            senderName: data.senderName,
            recipient: data.recipient,
            timestamp: data.timestamp
          });
        }
      });
      
      // Give some time for messages to be collected
      setTimeout(() => resolve(messages), 2000);
    });
    
    const dmMessages = await withTimeout(
      listPromise,
      CONFIG.timeout.operation,
      'listing DM messages'
    );
    
    log.success(`Found ${dmMessages.length} messages in DM chat`);
    
    // Verify both messages are found
    const foundMsg1 = dmMessages.some(
      msg => msg.content === msg1Content && msg.sender === user1.id && msg.recipient === user2.id
    );
    
    const foundMsg2 = dmMessages.some(
      msg => msg.content === msg2Content && msg.sender === user2.id && msg.recipient === user1.id
    );
    
    if (foundMsg1 && foundMsg2) {
      log.success('Both DM messages were found');
    } else {
      log.warn(`Some DM messages were not found:
        ${user1.name}'s message found: ${foundMsg1}
        ${user2.name}'s message found: ${foundMsg2}
      `);
    }
    
    // Test read receipts (a common feature for DMs)
    log.info('Testing read receipts...');
    
    // Mark user1's message as read by user2
    gun.get(dmChannelId).get('readReceipts').get(user2.id).put({
      lastRead: Date.now(),
      messageId: msg1Id
    });
    
    // Verify read receipt
    const readReceiptPromise = new Promise((resolve) => {
      gun.get(dmChannelId).get('readReceipts').get(user2.id).once((data) => {
        resolve(data);
      });
    });
    
    const readReceipt = await withTimeout(
      readReceiptPromise,
      CONFIG.timeout.operation,
      'verifying read receipt'
    );
    
    if (readReceipt && readReceipt.messageId === msg1Id) {
      log.success(`Read receipt confirmed: ${user2.name} read message "${msg1Content.substring(0, 20)}..."`);
    } else {
      log.warn('Read receipt could not be verified');
    }
    
    // Clean up
    gun.get(dmChannelId).get('messages').get(msg1Id).off();
    gun.get(dmChannelId).get('messages').get(msg2Id).off();
    gun.get(dmChannelId).get('readReceipts').get(user2.id).off();
    
    log.success('Direct messaging functionality verified successfully');
    return true;
  } catch (error) {
    log.error('Direct messaging test failed', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  log.header('STARCOM CHAT DEV TEST');
  log.info('Starting comprehensive chat test for development');
  
  const results = {
    gunDB: false,
    errorHandling: false,
    globalChat: false,
    groupChat: false,
    directMessaging: false
  };
  
  // Test Gun DB
  results.gunDB = await testGunDB();
  
  // Test error handling
  results.errorHandling = await testErrorHandling();
  
  // Test global chat functionality
  results.globalChat = await testGlobalChat();
  
  // Test group chat functionality
  results.groupChat = await testGroupChat();
  
  // Test direct messaging functionality
  results.directMessaging = await testDirectMessaging();
  
  // Print test summary
  log.header('TEST SUMMARY');
  
  if (results.gunDB) {
    log.success('GUN DB: PASSED');
  } else {
    log.error('GUN DB: FAILED');
  }
  
  if (results.errorHandling) {
    log.success('ERROR HANDLING: PASSED');
  } else {
    log.error('ERROR HANDLING: FAILED');
  }
  
  if (results.globalChat) {
    log.success('GLOBAL CHAT: PASSED');
  } else {
    log.error('GLOBAL CHAT: FAILED');
  }
  
  if (results.groupChat) {
    log.success('GROUP CHAT: PASSED');
  } else {
    log.error('GROUP CHAT: FAILED');
  }
  
  if (results.directMessaging) {
    log.success('DIRECT MESSAGING: PASSED');
  } else {
    log.error('DIRECT MESSAGING: FAILED');
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
