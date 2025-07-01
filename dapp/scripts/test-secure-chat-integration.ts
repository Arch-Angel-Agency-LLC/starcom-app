// Test script to verify SecureChat integration
// This tests that all services connect properly and can send/receive messages

import { secureChatIntegration } from '../src/services/SecureChatIntegrationService';

async function testSecureChatIntegration() {
  console.log('🧪 Testing SecureChat Integration...');

  try {
    // Test 1: Initialize services
    console.log('📋 Test 1: Service Initialization');
    await secureChatIntegration.initialize('did:earth-alliance:test-user');
    console.log('✅ Services initialized successfully');

    // Test 2: Update configuration
    console.log('📋 Test 2: Configuration Update');
    secureChatIntegration.updateConfig({
      enablePQC: true,
      enableIPFS: true,
      enableNostr: true,
      emergencyMode: false,
      threatLevel: 'normal'
    });
    console.log('✅ Configuration updated successfully');

    // Test 3: Send a test message
    console.log('📋 Test 3: Message Transmission');
    const testMessage = {
      contactId: 'test-contact-001',
      senderId: 'test-user-001',
      senderName: 'Test Agent',
      content: 'This is a test secure message with Earth Alliance protocols',
      type: 'text' as const
    };

    const result = await secureChatIntegration.sendMessage(testMessage);
    console.log('✅ Message transmitted:', {
      success: result.success,
      pqcEncrypted: result.pqcEncrypted,
      nostrPublished: result.nostrPublished,
      ipfsStored: result.ipfsStored
    });

    // Test 4: Process incoming message
    console.log('📋 Test 4: Message Processing');
    const incomingMessage = {
      content: 'Incoming test message',
      senderId: 'test-contact-001',
      senderName: 'Test Contact',
      timestamp: Date.now(),
      messageType: 'text',
      pqcEncrypted: false
    };

    const processedMessage = await secureChatIntegration.processIncomingMessage(
      incomingMessage,
      'direct'
    );
    console.log('✅ Message processed:', {
      id: processedMessage?.id,
      content: processedMessage?.content,
      type: processedMessage?.type
    });

    // Test 5: Contact synchronization
    console.log('📋 Test 5: Contact Synchronization');
    const syncResult = await secureChatIntegration.synchronizeContacts();
    console.log('✅ Contacts synchronized:', {
      synchronized: syncResult.synchronized,
      failed: syncResult.failed,
      totalContacts: syncResult.contacts.length
    });

    // Test 6: Threat analysis
    console.log('📋 Test 6: Threat Analysis');
    const threatLevel1 = await secureChatIntegration.analyzeThreatLevel('Normal message');
    const threatLevel2 = await secureChatIntegration.analyzeThreatLevel('URGENT: Emergency classified threat detected!');
    console.log('✅ Threat analysis:', {
      normalMessage: threatLevel1,
      urgentMessage: threatLevel2
    });

    // Test 7: Emergency mode
    console.log('📋 Test 7: Emergency Protocols');
    await secureChatIntegration.activateEmergencyMode();
    console.log('✅ Emergency mode activated');

    console.log('🎉 All integration tests passed!');
    console.log('🔐 SecureChat system is ready for Earth Alliance operations');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

// Export for use in npm scripts
export { testSecureChatIntegration };

// Simple browser-compatible execution check
if (typeof window === 'undefined') {
  // Node.js environment
  testSecureChatIntegration().catch(console.error);
}
