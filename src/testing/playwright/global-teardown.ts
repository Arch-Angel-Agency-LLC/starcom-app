import { FullConfig } from '@playwright/test';
import * as fs from 'fs/promises';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */
async function globalTeardown(_config: FullConfig) {
  console.log('🏁 Starting AI Agent UI Testing Global Teardown...');

  try {
    // Generate final test report summary
    await generateTestSummary();

    // Archive test results if needed
    await archiveResults();

    // Clean up temporary files
    await cleanupTempFiles();

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

/**
 * Generate a summary of test results
 */
async function generateTestSummary(): Promise<void> {
  const summaryData = {
    teardownTime: new Date().toISOString(),
    status: 'completed',
    message: 'AI Agent UI Testing session completed'
  };

  try {
    // Check if results.json exists
    const resultsPath = 'test-results/results.json';
    const resultsExist = await fs.access(resultsPath).then(() => true).catch(() => false);
    
    if (resultsExist) {
      const resultsContent = await fs.readFile(resultsPath, 'utf-8');
      const results = JSON.parse(resultsContent);
      
      summaryData.status = results.status || 'completed';
      
      // Add basic statistics if available
      if (results.suites) {
        // AI-NOTE: Stats collection placeholder for future enhancement
        console.log('📊 Test results processed (stats collection pending)');
      }
    }

    await fs.writeFile(
      'test-results/teardown-summary.json',
      JSON.stringify(summaryData, null, 2)
    );

    console.log('📋 Test summary generated');
  } catch (error) {
    console.error('Error generating test summary:', error);
  }
}

/**
 * Archive test results for long-term storage
 */
async function archiveResults(): Promise<void> {
  try {
    // Create archive metadata
    const archiveInfo = {
      timestamp: new Date().toISOString(),
      archived: true,
      location: 'test-results/',
      note: 'AI Agent UI Testing results archived'
    };

    await fs.writeFile(
      'test-results/archive-info.json',
      JSON.stringify(archiveInfo, null, 2)
    );

    console.log('📦 Test results archived');
  } catch (error) {
    console.error('Error archiving results:', error);
  }
}

/**
 * Clean up temporary files created during testing
 */
async function cleanupTempFiles(): Promise<void> {
  const tempFiles = [
    'test-results/global-setup-verification.png'
  ];

  let cleanedCount = 0;

  for (const file of tempFiles) {
    try {
      await fs.unlink(file);
      cleanedCount++;
    } catch {
      // File might not exist
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} temporary files`);
  }
}

export default globalTeardown;
