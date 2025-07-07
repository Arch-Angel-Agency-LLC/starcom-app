/**
 * Manual tests for TimelineAdapter
 * 
 * This file contains functions to manually test the TimelineAdapter functionality.
 * These tests can be executed directly without a test runner.
 */

import { timelineAdapter } from '../adapters/timelineAdapter';
import { generateSampleTimelineData, generateAttackScenario } from '../utils/timelineDataGenerator';

/**
 * Test timeline data generation and retrieval
 */
export async function testTimelineIntegration() {
  console.log('--- Testing Timeline Integration ---');

  // Step 1: Generate sample timeline data
  console.log('Generating sample timeline data...');
  const eventIds = await generateSampleTimelineData(10);
  console.log(`Created ${eventIds.length} sample timeline events`);

  // Step 2: Retrieve and display timeline data
  console.log('Retrieving timeline data...');
  const timelineData = await timelineAdapter.getTimelineData();
  console.log(`Retrieved ${timelineData.items.length} timeline items`);
  console.log(`Retrieved ${timelineData.groups.length} timeline groups`);
  
  // Display some data examples
  if (timelineData.items.length > 0) {
    console.log('First timeline item:');
    console.log(JSON.stringify(timelineData.items[0], null, 2));
  }
  
  if (timelineData.groups.length > 0) {
    console.log('Timeline groups:');
    console.log(JSON.stringify(timelineData.groups, null, 2));
  }
  
  // Step 3: Get timeline statistics
  console.log('Getting timeline statistics...');
  const stats = await timelineAdapter.getTimelineStats();
  console.log('Timeline statistics:');
  console.log(JSON.stringify(stats, null, 2));
  
  // Step 4: Test filtering
  console.log('Testing timeline filters...');
  // Filter for high importance events only
  const highImportanceData = await timelineAdapter.getTimelineData([
    { property: 'importance', operator: 'after', value: 70 }
  ]);
  console.log(`Found ${highImportanceData.items.length} high importance events`);
  
  // Step 5: Generate an attack scenario
  console.log('Generating attack scenario...');
  const scenarioIds = await generateAttackScenario('ACME Corp', 'APT Group X');
  console.log(`Created attack scenario with ${scenarioIds.length} events`);
  
  console.log('--- Timeline Integration Tests Complete ---');
  return {
    eventIds,
    scenarioIds,
    timelineData,
    stats
  };
}

/**
 * Run all tests
 */
export async function runAllTests() {
  try {
    await testTimelineIntegration();
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Uncomment to run tests directly
// runAllTests();

export default {
  testTimelineIntegration,
  runAllTests
};
