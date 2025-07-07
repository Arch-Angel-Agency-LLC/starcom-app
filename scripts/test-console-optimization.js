#!/usr/bin/env node

/**
 * Console Optimization Test Script
 * Tests that our console filtering is working correctly
 */

// Import our console optimization
require('../src/utils/consoleOptimization');

console.log('🧪 Testing Console Optimization...\n');

// Test 1: Normal errors should pass through
console.log('Test 1: Normal error should appear below:');
console.error('This is a normal error that should appear');

// Test 2: MetaMask warnings should be suppressed
console.log('\nTest 2: MetaMask warnings should be suppressed (nothing should appear below):');
console.error('Warning: Encountered two children with the same key, `MetaMask`. Keys should be unique...');
console.warn('Warning: MetaMask wallet adapter issue');

// Test 3: Wallet-related warnings should be suppressed
console.log('\nTest 3: Wallet-related warnings should be suppressed (nothing should appear below):');
console.error('StreamMiddleware - Unknown response id "solflare-detect-metamask"');
console.warn('wallet-adapter warning message');

// Test 4: Normal warnings should pass through
console.log('\nTest 4: Normal warning should appear below:');
console.warn('This is a normal warning that should appear');

console.log('\n✅ Console optimization test complete!');
console.log('If you only see the "should appear" messages above, the filtering is working correctly.');
