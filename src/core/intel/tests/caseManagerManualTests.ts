/**
 * Manual tests for CaseManagerAdapter
 * 
 * This file contains functions to manually test the CaseManagerAdapter functionality.
 * These tests can be executed directly without a test runner.
 */

import { caseManagerAdapter } from '../adapters/caseManagerAdapter';
import { generateSampleCaseData, generateRelatedCaseSeries } from '../utils/caseDataGenerator';
import { CaseStatus, CasePriority } from '../types/intelDataModels';

/**
 * Test case management data generation and retrieval
 */
export async function testCaseManagerIntegration() {
  console.log('--- Testing Case Manager Integration ---');

  // Step 1: Generate sample case data
  console.log('Generating sample case data...');
  const caseIds = await generateSampleCaseData(10);
  console.log(`Created ${caseIds.length} sample case records`);

  // Step 2: Retrieve and display case data
  console.log('Retrieving case data...');
  const cases = await caseManagerAdapter.getCases();
  console.log(`Retrieved ${cases.length} case records`);
  
  // Display some data examples
  if (cases.length > 0) {
    console.log('First case:');
    console.log(JSON.stringify(cases[0], null, 2));
  }
  
  // Step 3: Get case statistics
  console.log('Getting case statistics...');
  const stats = await caseManagerAdapter.getCaseStats();
  console.log('Case statistics:');
  console.log(JSON.stringify(stats, null, 2));
  
  // Step 4: Test filtering
  console.log('Testing case filters...');
  // Filter for high priority cases only
  const highPriorityCases = await caseManagerAdapter.getCases([
    { property: 'priority', operator: 'equals', value: CasePriority.HIGH }
  ]);
  console.log(`Found ${highPriorityCases.length} high priority cases`);
  
  // Filter for open cases
  const openCases = await caseManagerAdapter.getCases([
    { property: 'status', operator: 'equals', value: CaseStatus.OPEN }
  ]);
  console.log(`Found ${openCases.length} open cases`);
  
  // Step 5: Generate a related case series
  console.log('Generating related case series...');
  const seriesIds = await generateRelatedCaseSeries(3, 'Security Breach');
  console.log(`Created related case series with ${seriesIds.length} cases`);
  
  // Step 6: Test getting a case by ID
  if (caseIds.length > 0) {
    console.log(`Getting case by ID: ${caseIds[0]}`);
    const caseItem = await caseManagerAdapter.getCaseById(caseIds[0]);
    console.log('Case details:');
    console.log(JSON.stringify(caseItem, null, 2));
  }
  
  // Step 7: Test updating a case
  if (caseIds.length > 0) {
    console.log(`Updating case: ${caseIds[0]}`);
    const updateResult = await caseManagerAdapter.updateCase(caseIds[0], {
      status: CaseStatus.IN_PROGRESS,
      priority: CasePriority.HIGH,
      tags: ['updated', 'test']
    });
    console.log(`Update result: ${updateResult}`);
    
    // Verify the update
    const updatedCase = await caseManagerAdapter.getCaseById(caseIds[0]);
    console.log('Updated case details:');
    console.log(JSON.stringify(updatedCase, null, 2));
  }
  
  console.log('--- Case Manager Integration Tests Complete ---');
  return {
    caseIds,
    seriesIds,
    cases,
    stats
  };
}

/**
 * Run all tests
 */
export async function runAllTests() {
  try {
    await testCaseManagerIntegration();
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Uncomment to run tests directly
// runAllTests();

export default {
  testCaseManagerIntegration,
  runAllTests
};
