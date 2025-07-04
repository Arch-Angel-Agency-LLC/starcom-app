import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for AI Agent UI Testing
 * Optimized for autonomous testing with safety controls
 */
export default defineConfig({
  // Test directory
  testDir: './src/testing/playwright',
  
  // Global test timeout
  timeout: 60000, // 1 minute per test
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry tests once to mitigate flakes
  retries: 1,
  // Report tests slower than threshold (ms) and limit count
  reportSlowTests: { max: 5, threshold: 30000 },

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],
  
  // Global setup and teardown
  globalSetup: './src/testing/playwright/global-setup.ts',
  globalTeardown: './src/testing/playwright/global-teardown.ts',
  
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev -- --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5174', // Vite dev server default

    /* Collect trace on failure. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1920, height: 1080 },
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Trace collection
    trace: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Ignore HTTPS errors for development
    ignoreHTTPSErrors: true,
    
    // User agent for AI testing
    userAgent: 'AI-Agent-Testing/1.0 (Starcom UI Test Suite)',
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Color scheme
    colorScheme: 'light'
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable additional Chrome features for testing
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain'
          ]
        }
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific configuration
        launchOptions: {
          firefoxUserPrefs: {
            'network.cookie.cookieBehavior': 0,
            'privacy.trackingprotection.enabled': false,
            'dom.webnotifications.enabled': false
          }
        }
      },
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari']
      },
    },

    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5']
      },
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12']
      },
    },

    // Accessibility-focused project
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Enable accessibility features
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--force-color-profile=srgb',
            '--enable-experimental-accessibility-features'
          ]
        }
      },
      testMatch: '**/accessibility.spec.ts'
    },

    // Visual regression project
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent visual testing
        launchOptions: {
          args: [
            '--force-color-profile=srgb',
            '--disable-background-timer-throttling'
          ]
        }
      },
      testMatch: '**/visual.spec.ts'
    },

    // AI Agent testing project
    {
      name: 'ai-agent',
      use: {
        ...devices['Desktop Chrome'],
        // Optimized for AI agent testing
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--enable-automation',
            '--force-color-profile=srgb'
          ]
        }
      }
    }
  ],

  // Run all tests now that debugging is complete
  // testMatch: '**/deep-react-debug.spec.ts',

  // Output directory for test results
  outputDir: 'test-results/playwright-output',
  
  // Metadata for reports
  metadata: {
    testType: 'AI Agent UI Testing',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  }
});
