#!/usr/bin/env tsx
/**
 * Test script for verifying Nostr key generation and HTTP bridge integration
 */

import { generateSecretKey, getPublicKey, finalizeEvent, UnsignedEvent } from 'nostr-tools';

interface TestResult {
  test: string;
  passed: boolean;
  details?: Record<string, unknown>;
  error?: string;
}

async function testNostrKeyGeneration(): Promise<TestResult> {
  try {
    console.log('🔧 Testing Nostr key generation...');
    
    // Generate secret key
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    
    // Validate key properties
    const isSecretKeyValid = secretKey instanceof Uint8Array && secretKey.length === 32;
    const isPublicKeyValid = typeof publicKey === 'string' && publicKey.length === 64;
    
    return {
      test: 'Nostr Key Generation',
      passed: isSecretKeyValid && isPublicKeyValid,
      details: {
        secretKeyType: secretKey.constructor.name,
        secretKeyLength: secretKey.length,
        publicKeyType: typeof publicKey,
        publicKeyLength: publicKey.length,
        publicKeyPreview: publicKey.slice(0, 16) + '...'
      }
    };
  } catch (error) {
    return {
      test: 'Nostr Key Generation',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testEventSigning(): Promise<TestResult> {
  try {
    console.log('🔧 Testing Nostr event signing...');
    
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    
    const unsignedEvent: UnsignedEvent = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: publicKey,
      tags: [['t', 'test']],
      content: 'Test event for STARCOM Nostr integration'
    };
    
    const signedEvent = finalizeEvent(unsignedEvent, secretKey);
    
    // Validate signed event
    const hasRequiredFields = !!(signedEvent.id && signedEvent.sig && signedEvent.pubkey);
    const pubkeyMatches = signedEvent.pubkey === publicKey;
    
    return {
      test: 'Event Signing',
      passed: hasRequiredFields && pubkeyMatches,
      details: {
        eventId: signedEvent.id.slice(0, 16) + '...',
        signature: signedEvent.sig.slice(0, 16) + '...',
        pubkeyMatches,
        kind: signedEvent.kind,
        content: signedEvent.content
      }
    };
  } catch (error) {
    return {
      test: 'Event Signing',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testHttpBridgeFormat(): Promise<TestResult> {
  try {
    console.log('🔧 Testing HTTP bridge event format...');
    
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    
    const starcomEvent: UnsignedEvent = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: publicKey,
      tags: [
        ['t', 'starcom-channel-001'],
        ['clearance', 'UNCLASSIFIED'],
        ['agency', 'CYBER_COMMAND'],
        ['pqc', 'true']
      ],
      content: JSON.stringify({
        channelId: 'channel-001',
        teamId: 'team-alpha',
        messageType: 'text',
        content: 'Test secure communication',
        metadata: { test: true }
      })
    };
    
    const signedEvent = finalizeEvent(starcomEvent, secretKey);
    
    // Validate STARCOM-specific formatting
    const hasStarcomTags = signedEvent.tags.some(tag => tag[0] === 't' && tag[1].startsWith('starcom-'));
    const hasClearanceTag = signedEvent.tags.some(tag => tag[0] === 'clearance');
    const hasAgencyTag = signedEvent.tags.some(tag => tag[0] === 'agency');
    const hasPqcTag = signedEvent.tags.some(tag => tag[0] === 'pqc');
    
    let contentData;
    try {
      contentData = JSON.parse(signedEvent.content);
    } catch {
      contentData = null;
    }
    
    const hasValidContent = !!(contentData && contentData.channelId && contentData.teamId);
    
    return {
      test: 'HTTP Bridge Format',
      passed: hasStarcomTags && hasClearanceTag && hasAgencyTag && hasPqcTag && hasValidContent,
      details: {
        starcomTags: hasStarcomTags,
        clearanceTag: hasClearanceTag,
        agencyTag: hasAgencyTag,
        pqcTag: hasPqcTag,
        validContent: hasValidContent,
        tags: signedEvent.tags,
        contentData
      }
    };
  } catch (error) {
    return {
      test: 'HTTP Bridge Format',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runTests() {
  console.log('🚀 STARCOM Nostr Integration Test Suite\n');
  
  const tests = [
    testNostrKeyGeneration,
    testEventSigning,
    testHttpBridgeFormat
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    const result = await test();
    results.push(result);
    
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test}`);
    
    if (result.details) {
      console.log('   Details:', result.details);
    }
    
    if (result.error) {
      console.log('   Error:', result.error);
    }
    
    console.log('');
  }
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Nostr integration is ready for implementation.');
  } else {
    console.log('⚠️ Some tests failed. Review the errors above.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
runTests().catch(console.error);

export { runTests, testNostrKeyGeneration, testEventSigning, testHttpBridgeFormat };
