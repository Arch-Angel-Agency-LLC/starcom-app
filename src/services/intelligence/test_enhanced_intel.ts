/**
 * Test Enhanced Intel Functionality
 * 
 * Tests the enhanced Intel.ts capabilities for collection tasking,
 * lifecycle management, real-time processing, and operational workflow.
 */

import { demonstrateEnhancedIntelligence } from './EnhancedIntelExample';

async function testEnhancedIntel(): Promise<void> {
  console.log('🧪 Testing Enhanced Intel Functionality...\n');

  try {
    await demonstrateEnhancedIntelligence();
    
    console.log('\n✅ All Enhanced Intel Tests Passed');
    
  } catch (error) {
    console.error('❌ Enhanced Intel Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
testEnhancedIntel().catch(console.error);

export { testEnhancedIntel };
