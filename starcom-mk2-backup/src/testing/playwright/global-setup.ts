import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting AI Agent UI Testing Global Setup...');
  
  // Ensure test result directories exist
  const directories = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'test-results/visual/baseline',
    'test-results/visual/current',
    'test-results/visual/diff',
    'test-results/accessibility',
    'test-results/performance'
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } catch {
      console.log(`ℹ️ Directory already exists: ${dir}`);
    }
  }

  // Clean up old test results (older than 7 days)
  await cleanupOldResults();

  // Create a browser instance for global setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Check if the application is running
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173';
    console.log(`🔍 Checking application availability at ${baseURL}...`);
    
    await page.goto(baseURL, { timeout: 30000 });
    console.log('✅ Application is accessible');

    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'test-results/global-setup-verification.png',
      fullPage: true
    });
    console.log('📸 Global setup verification screenshot saved');

    // Store authentication state if needed
    // This is where you would log in and save cookies/localStorage
    // await page.context().storageState({ path: 'test-results/auth.json' });

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  // Create test metadata
  const metadata = {
    setupTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: process.env.NODE_ENV || 'development',
    baseURL: config.projects[0]?.use?.baseURL,
    testConfig: {
      workers: config.workers
    }
  };

  await fs.writeFile(
    'test-results/test-metadata.json',
    JSON.stringify(metadata, null, 2)
  );

  console.log('✅ Global setup completed successfully');
}

/**
 * Clean up old test results
 */
async function cleanupOldResults(): Promise<void> {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const cutoffTime = Date.now() - maxAge;

  const cleanupDirectories = [
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces'
  ];

  for (const dir of cleanupDirectories) {
    try {
      const files = await fs.readdir(dir);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old files from ${dir}`);
      }
    } catch (error) {
      // Directory might not exist or be empty
      console.debug(`Cleanup skipped for ${dir}:`, error);
    }
  }
}

export default globalSetup;
