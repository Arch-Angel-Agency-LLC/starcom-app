/**
 * Test Refactored Enhanced Intel Functionality
 * 
 * Tests the properly modularized enhanced Intel capabilities.
 */

import { demonstrateRefactoredIntelligence } from './RefactoredIntelExample';

async function testRefactoredIntel(): Promise<void> {
  console.log('🧪 Testing Refactored Enhanced Intel Functionality...\n');

  try {
    await demonstrateRefactoredIntelligence();
    
    console.log('\n✅ All Refactored Intel Tests Passed');
    
  } catch (error) {
    console.error('❌ Refactored Intel Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
testRefactoredIntel().catch(console.error);

export { testRefactoredIntel };
