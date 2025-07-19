/**
 * Simple test script for the IntelligenceWorkflowEngine
 * This tests the core functionality to ensure it's working correctly
 */

import { IntelligenceWorkflowEngine } from './IntelligenceWorkflowEngine';
import { Intel } from '../../models/Intel/Intel';

// Create a test intel item
const testIntel: Intel = {
  id: 'test_intel_001',
  source: 'OSINT',
  classification: 'SECRET',
  reliability: 'B',
  timestamp: Date.now(),
  collectedBy: 'test-collector',
  data: {
    content: 'Test intelligence data about potential threat indicators',
    source_url: 'https://example.com/threat-report',
    keywords: ['threat', 'attack', 'critical']
  },
  tags: ['threat', 'test'],
  verified: true
};

// Test function
async function testWorkflowEngine() {
  console.log('Testing Intelligence Workflow Engine...');
  
  try {
    // Create engine instance
    const engine = new IntelligenceWorkflowEngine();
    
    // Test trigger evaluation - this should trigger the immediate threat assessment workflow
    await engine.checkTriggers(testIntel);
    
    // Test manual workflow execution
    const execution = await engine.executeWorkflow(
      'immediate-threat-assessment',
      { intel: [testIntel] },
      {
        operationalEnvironment: 'test-environment',
        timeframe: { start: Date.now() - 3600000, end: Date.now() },
        priority: 'HIGH',
        analyst: 'test-analyst',
        purpose: 'system-test',
        constraints: []
      }
    );
    
    console.log('Workflow execution started:', execution.id);
    console.log('Status:', execution.status);
    console.log('Inputs processed:', execution.inputs.intel.length);
    
    // Wait a moment for async processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export for potential testing
export { testWorkflowEngine };

// Run test if this file is executed directly
if (require.main === module) {
  testWorkflowEngine();
}
