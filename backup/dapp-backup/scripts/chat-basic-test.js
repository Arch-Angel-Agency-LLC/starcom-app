#!/usr/bin/env node
/**
 * chat-basic-test.js
 * 
 * A very basic test script to validate Gun chat functionality.
 * This script directly uses Gun DB without the adapter layer
 * to check basic connectivity and message sending.
 */

// Simple logging utilities
const log = {
  info: (message) => console.log(`\x1b[34mINFO:\x1b[0m ${message}`),
  success: (message) => console.log(`\x1b[32mSUCCESS:\x1b[0m ${message}`),
  warn: (message) => console.log(`\x1b[33mWARNING:\x1b[0m ${message}`),
  error: (message, error) => console.error(
    `\x1b[31mERROR:\x1b[0m ${message}${error ? `: ${error.message}` : ''}`
  ),
  header: (message) => console.log(`\n\x1b[44m\x1b[37m ${message} \x1b[0m\n`)
};

// Run a basic test
async function runBasicTest() {
  try {
    log.header('STARCOM CHAT BASIC TEST');
    log.info('This script performs a very basic connectivity test');
    log.info('for chat messaging system in development');
    
    // Import Gun dynamically
    log.info('Importing Gun...');
    const { default: Gun } = await import('gun');
    log.success('Gun imported successfully');
    
    // Setup a basic Gun instance
    log.info('Setting up Gun instance...');
    const gun = Gun();
    log.success('Gun instance created');
    
    // Try to create a test message
    const testChannel = 'test-channel';
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
    
    gun.get(testChannel).get(testMessageId).on(data => {
      if (data && data.content === testContent) {
        log.success(`Message received: ${data.content}`);
        messageReceived = true;
      }
    });
    
    // Wait for the message to be received
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!messageReceived) {
          reject(new Error('Timeout waiting for message'));
        } else {
          resolve();
        }
      }, 5000);
      
      // If we get the message before timeout, resolve immediately
      const checkInterval = setInterval(() => {
        if (messageReceived) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
    
    log.success('Basic chat test passed!');
    log.info('This indicates that Gun DB is working correctly');
    log.info('and basic message sending/receiving is functional.');
    
    // Clean up
    gun.get(testChannel).get(testMessageId).off();
    
    log.header('TEST COMPLETE');
    process.exit(0);
  } catch (error) {
    log.error('Test failed', error);
    log.info('This may indicate issues with Gun DB connection');
    log.info('or basic message functionality.');
    process.exit(1);
  }
}

// Run the test
runBasicTest();
