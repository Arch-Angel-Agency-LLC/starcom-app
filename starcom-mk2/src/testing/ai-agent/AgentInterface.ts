import { Page, BrowserContext, Browser } from '@playwright/test';
import { EnhancedComponentDetector } from './EnhancedComponentDetector';
import { UniversalComponentDetector, UniversalComponent } from './UniversalComponentDetector';
import { SafetyMonitor } from './SafetyMonitor';
import { 
  AgentConfig, 
  DetectedComponent,
  TestScenario,
  AgentTestResult,
  TestStep,
  TestAssertion,
  PerformanceResult
} from './types';

// Re-export types for other modules
export type {
  AgentConfig,
  DetectedComponent,
  TestScenario,
  AgentTestResult,
  TestStep,
  TestAssertion,
  PerformanceResult
} from './types';

/**
 * Main interface for AI agents to interact with the UI testing system
 */
export class AgentInterface {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private enhancedComponentDetector: EnhancedComponentDetector;
  private universalComponentDetector: UniversalComponentDetector;
  private safetyMonitor: SafetyMonitor;
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      maxExecutionTime: 300000, // 5 minutes
      memoryLimit: 512 * 1024 * 1024, // 512MB
      outputLimit: 10 * 1024 * 1024, // 10MB
      emergencyStopEnabled: true,
      visualRegressionEnabled: true,
      accessibilityEnabled: true,
      performanceEnabled: true,
      safetyChecksEnabled: true,
      ...config
    };

    this.enhancedComponentDetector = new EnhancedComponentDetector();
    this.universalComponentDetector = new UniversalComponentDetector();
    this.safetyMonitor = new SafetyMonitor(this.config);
  }

  /**
   * Initialize the browser context for testing
   * Can optionally accept an existing page to use instead of creating a new one
   */
  async initialize(browser: Browser, existingPage?: Page): Promise<void> {
    try {
      if (existingPage && !existingPage.isClosed()) {
        // Use the existing page if provided
        this.page = existingPage;
        this.context = existingPage.context();
        console.log('Using existing page context for AgentInterface');
      } else {
        // Create new context and page
        this.context = await browser.newContext({
          viewport: { width: 1920, height: 1080 },
          userAgent: 'AI-Agent-Testing/1.0 (Starcom UI Test Suite)',
          recordVideo: { dir: 'test-results/videos' },
          recordHar: { path: 'test-results/network.har' }
        });

        this.page = await this.context.newPage();
        console.log('Created new page context for AgentInterface');
      }
      
      // Setup console and error logging
      this.page.on('console', msg => {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
      });

      this.page.on('pageerror', error => {
        console.error(`[Page Error] ${error.message}`);
      });

      await this.safetyMonitor.initialize(this.page);
      
      console.log('AgentInterface initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize AgentInterface: ${error}`);
    }
  }

  /**
   * Execute a test scenario with full safety monitoring
   */
  async executeScenario(scenario: TestScenario): Promise<AgentTestResult> {
    if (!this.page) {
      throw new Error('AgentInterface not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    const result: AgentTestResult = {
      scenario,
      success: false,
      duration: 0,
      screenshots: [],
      errors: [],
      warnings: []
    };

    try {
      // Start safety monitoring
      await this.safetyMonitor.startMonitoring();

      // Execute test steps
      for (const step of scenario.steps) {
        await this.executeStep(step, result);
        
        // Check safety conditions after each step
        if (this.config.safetyChecksEnabled) {
          const safetyStatus = await this.safetyMonitor.checkSafety();
          if (!safetyStatus.safe) {
            throw new Error(`Safety violation: ${safetyStatus.reason}`);
          }
        }
      }

      // Run assertions
      for (const assertion of scenario.assertions) {
        await this.runAssertion(assertion, result);
      }

      // Capture performance metrics
      if (this.config.performanceEnabled) {
        result.performance = await this.capturePerformanceMetrics();
      }

      // Run accessibility tests
      if (this.config.accessibilityEnabled) {
        // TODO: Implement accessibility tester
        // result.accessibility = await this.accessibilityTester.runTests(this.page);
      }

      // Run visual regression tests
      if (this.config.visualRegressionEnabled) {
        // TODO: Implement visual regression testing
        // result.visualRegression = await this.visualRegression.compareScreenshot(
        //   this.page,
        //   scenario.id
        // );
      }

      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push(error instanceof Error ? error : new Error(String(error)));
      result.success = false;
    } finally {
      result.duration = Date.now() - startTime;
      
      // Stop safety monitoring
      await this.safetyMonitor.stopMonitoring();

      // Cleanup
      if (scenario.cleanup) {
        try {
          await scenario.cleanup();
        } catch (cleanupError) {
          result.warnings.push(`Cleanup failed: ${cleanupError}`);
        }
      }
    }

    return result;
  }

  /**
   * Execute a single test step
   */
  private async executeStep(step: TestStep, result: AgentTestResult): Promise<void> {
    if (!this.page) return;

    switch (step.type) {
      case 'navigate':
        if (step.url) {
          await this.page.goto(step.url, { timeout: step.timeout || 30000 });
        }
        break;

      case 'click':
        if (step.selector) {
          await this.page.click(step.selector, { timeout: step.timeout || 10000 });
        }
        break;

      case 'type':
        if (step.selector && step.text) {
          await this.page.fill(step.selector, step.text);
        }
        break;

      case 'wait':
        if (step.selector) {
          await this.page.waitForSelector(step.selector, { timeout: step.timeout || 10000 });
        } else {
          await this.page.waitForTimeout(step.timeout || 1000);
        }
        break;

      case 'screenshot': {
        const screenshot = await this.page.screenshot({
          path: `test-results/screenshots/${Date.now()}.png`,
          fullPage: true
        });
        result.screenshots.push(screenshot.toString('base64'));
        break;
      }

      case 'custom':
        if (step.customAction) {
          await step.customAction(this.page);
        }
        break;
    }
  }

  /**
   * Run a test assertion
   */
  private async runAssertion(assertion: TestAssertion, result: AgentTestResult): Promise<void> {
    if (!this.page) return;

    try {
      switch (assertion.type) {
        case 'visible':
          if (assertion.selector) {
            const isVisible = await this.page.isVisible(assertion.selector);
            if (isVisible !== assertion.expected) {
              throw new Error(assertion.message || `Element ${assertion.selector} visibility mismatch`);
            }
          }
          break;

        case 'text':
          if (assertion.selector) {
            const text = await this.page.textContent(assertion.selector);
            if (text !== assertion.expected) {
              throw new Error(assertion.message || `Text content mismatch: expected "${assertion.expected}", got "${text}"`);
            }
          }
          break;

        case 'attribute':
          if (assertion.selector && typeof assertion.expected === 'object' && assertion.expected !== null) {
            const expected = assertion.expected as { name: string; value: string };
            const value = await this.page.getAttribute(assertion.selector, expected.name);
            if (value !== expected.value) {
              throw new Error(assertion.message || `Attribute mismatch: expected "${expected.value}", got "${value}"`);
            }
          }
          break;

        case 'count':
          if (assertion.selector) {
            const count = await this.page.locator(assertion.selector).count();
            if (count !== assertion.expected) {
              throw new Error(assertion.message || `Element count mismatch: expected ${assertion.expected}, got ${count}`);
            }
          }
          break;
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Capture performance metrics from the page
   */
  private async capturePerformanceMetrics(): Promise<PerformanceResult> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: 0, // Would need LCP observer
        cumulativeLayoutShift: 0, // Would need CLS observer
        firstInputDelay: 0, // Would need FID observer
        memoryUsage: (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0
      };
    });

    return {
      ...metrics,
      passed: metrics.loadTime < 3000 && metrics.firstContentfulPaint < 2000 // Simple performance thresholds
    };
  }

  /**
   * Detect UI components on the current page
   */
  async detectComponents(): Promise<DetectedComponent[]> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      // Check if page is still active
      if (this.page.isClosed()) {
        console.warn('Page is closed, cannot detect components');
        return [];
      }

      // First try enhanced component detector for modern React applications
      console.log('Attempting enhanced component detection...');
      const modernComponents = await this.enhancedComponentDetector.detectModernComponents(this.page);
      
      if (modernComponents.length > 0) {
        console.log(`Enhanced detector found ${modernComponents.length} components`);
        // Convert to legacy format for compatibility
        return modernComponents.map(component => ({
          id: component.id,
          type: component.type,
          selector: component.selector,
          properties: component.properties
        }));
      }
      
      console.log('Enhanced detector found no components, falling back to universal detector...');
      
      // Fall back to universal component detector for framework-agnostic detection
      const universalComponents = await this.universalComponentDetector.detectAllComponents(this.page);
      
      if (universalComponents.length > 0) {
        console.log(`Universal detector found ${universalComponents.length} components`);
        // Convert to legacy format for compatibility
        return universalComponents.map((component: UniversalComponent) => ({
          id: component.id,
          type: component.type,
          selector: component.selector,
          properties: component.properties
        }));
      }
      
      console.warn('No components detected by either detector');
      return [];
      
    } catch (error) {
      console.error('Error in component detection:', error);
      
      try {
        // Final fallback to universal component detector with minimal timeout
        console.log('Attempting final fallback detection...');
        const basicComponents = await this.universalComponentDetector.detectAllComponents(this.page, 1000);
        return basicComponents.map((component: UniversalComponent) => ({
          id: component.id,
          type: component.type,
          selector: component.selector,
          properties: component.properties
        }));
      } catch (fallbackError) {
        console.error('All component detection methods failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Generate test scenarios based on the current page
   */
  async generateTestScenarios(): Promise<TestScenario[]> {
    const components = await this.detectComponents();
    
    // If we have detected components, generate basic scenarios
    if (components.length > 0) {
      const scenarios: TestScenario[] = [];
      
      // Create a basic interaction scenario
      scenarios.push({
        id: 'basic-interaction-test',
        name: 'Basic UI Interaction Test',
        description: 'Test basic interactions with detected UI components',
        steps: [
          {
            type: 'navigate',
            url: '/'
          },
          {
            type: 'wait',
            timeout: 2000
          },
          {
            type: 'screenshot'
          }
        ],
        assertions: [
          {
            type: 'visible',
            selector: 'body',
            expected: true,
            message: 'Page should be visible'
          }
        ]
      });

      // Add component-specific scenarios if we have potentially interactive components
      const interactiveComponents = components.filter(c => 
        c.type.includes('button') || c.type.includes('input') || c.type.includes('link') || 
        c.selector.includes('button') || c.selector.includes('input') || c.selector.includes('a')
      );

      if (interactiveComponents.length > 0) {
        scenarios.push({
          id: 'component-interaction-test',
          name: 'Component Interaction Test',
          description: 'Test interactions with detected components',
          steps: [
            {
              type: 'navigate',
              url: '/'
            },
            {
              type: 'wait',
              timeout: 2000
            },
            {
              type: 'screenshot'
            }
          ],
          assertions: [
            {
              type: 'count',
              selector: '*',
              expected: { min: 1 },
              message: 'Should have at least one element'
            }
          ]
        });
      }

      return scenarios;
    }
    
    // Return a minimal scenario even if no components detected
    return [{
      id: 'basic-page-test',
      name: 'Basic Page Test',
      description: 'Verify page loads and basic functionality',
      steps: [
        {
          type: 'navigate',
          url: '/'
        },
        {
          type: 'wait',
          timeout: 2000
        },
        {
          type: 'screenshot'
        }
      ],
      assertions: [
        {
          type: 'visible',
          selector: 'body',
          expected: true,
          message: 'Body should be visible'
        }
      ]
    }];
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      // Only close page and context if we created them ourselves
      if (this.page && !this.page.isClosed()) {
        // Check if this is our own context by seeing if we have a context reference
        const isOwnContext = this.context !== null;
        
        if (isOwnContext) {
          try {
            await this.page.close();
          } catch (error) {
            console.warn('Error closing page:', error);
          }
          this.page = null;
        } else {
          // Just detach from shared page
          this.page = null;
        }
      }
      
      if (this.context) {
        try {
          await this.context.close();
        } catch (error) {
          console.warn('Error closing context:', error);
        }
        this.context = null;
      }
      
      console.log('AgentInterface cleaned up successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get current page instance (for advanced usage)
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
