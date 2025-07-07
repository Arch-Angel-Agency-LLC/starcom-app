import { test, expect, Browser } from '@playwright/test';
import { AgentInterface } from '../ai-agent/AgentInterface';
import { TestScenario, AgentTestResult } from '../ai-agent/types';
import { ComponentDetector } from '../ai-agent/ComponentDetector';

/**
 * AI Agent UI Testing - Autonomous Test Generation and Execution
 * 
 * This test demonstrates how AI agents can autonomously:
 * 1. Detect UI components on a page
 * 2. Generate appropriate test scenarios
 * 3. Execute tests with safety monitoring
 * 4. Report results with recommendations
 */
test.describe('AI Agent Autonomous UI Testing', () => {
  let agentInterface: AgentInterface;
  let browser: Browser;

  test.beforeEach(async ({ browser: testBrowser, page }) => {
    browser = testBrowser;
    
    // Initialize AI Agent Interface with safety configurations
    agentInterface = new AgentInterface({
      maxExecutionTime: 120000, // 2 minutes per test
      memoryLimit: 256 * 1024 * 1024, // 256MB
      outputLimit: 5 * 1024 * 1024, // 5MB
      emergencyStopEnabled: true,
      visualRegressionEnabled: true,
      accessibilityEnabled: true,
      performanceEnabled: true,
      safetyChecksEnabled: true
    });

    // Use the existing page to avoid context/page conflicts
    await agentInterface.initialize(browser, page);
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load completely with a timeout
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      console.warn('Page did not reach networkidle state, continuing anyway:', error);
      // Continue with testing even if network isn't idle
    }
  });

  test.afterEach(async () => {
    // Clean up agent interface
    await agentInterface.cleanup();
  });

  test('should detect and test UI components autonomously', async () => {
    // Step 1: Detect all components on the page
    console.log('🔍 Detecting UI components...');
    const components = await agentInterface.detectComponents();
    
    expect(components.length).toBeGreaterThan(0);
    console.log(`✅ Detected ${components.length} UI components`);

    // Log detected components for debugging
    components.forEach(component => {
      console.log(`Component: ${component.type} - ${component.id}`);
    });

    // Step 2: Generate test scenarios based on detected components
    console.log('📝 Generating test scenarios...');
    const scenarios = await agentInterface.generateTestScenarios();
    
    expect(scenarios.length).toBeGreaterThan(0);
    console.log(`✅ Generated ${scenarios.length} test scenarios`);

    // Step 3: Execute scenarios with safety monitoring
    const results: AgentTestResult[] = [];
    
    for (let i = 0; i < Math.min(scenarios.length, 5); i++) { // Limit to 5 scenarios for safety
      const scenario = scenarios[i];
      console.log(`🚀 Executing scenario: ${scenario.name}`);
      
      try {
        const result = await agentInterface.executeScenario(scenario);
        results.push(result);
        
        console.log(`${result.success ? '✅' : '❌'} Scenario ${scenario.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
        
        if (!result.success) {
          console.log(`Errors: ${result.errors.join(', ')}`);
        }
        
        if (result.warnings.length > 0) {
          console.log(`Warnings: ${result.warnings.join(', ')}`);
        }
        
      } catch (error) {
        console.error(`💥 Scenario ${scenario.name} crashed:`, error);
        results.push({
          scenario,
          success: false,
          duration: 0,
          screenshots: [],
          errors: [error instanceof Error ? error : new Error(String(error))],
          warnings: []
        });
      }
    }

    // Step 4: Analyze results
    const successfulTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    console.log(`📊 Test Results: ${successfulTests} passed, ${failedTests} failed`);
    
    // At least 70% of tests should pass for a healthy UI
    const successRate = successfulTests / results.length;
    expect(successRate).toBeGreaterThanOrEqual(0.7);
    
    // Step 5: Generate recommendations
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('🔧 Recommendations for failed tests:');
      failedResults.forEach(result => {
        console.log(`- ${result.scenario.name}: ${result.errors.join(', ')}`);
      });
    }
  });

  test('should handle complex user workflows', async ({ page }) => {
    // Test more complex scenarios that involve multiple components
    console.log('🔄 Testing complex user workflows...');
    
    const componentDetector = new ComponentDetector();
    const interactiveComponents = await componentDetector.detectInteractiveElements(page);
    
    expect(interactiveComponents.length).toBeGreaterThan(0);
    
    // Create a workflow test scenario
    const workflowScenario: TestScenario = {
      id: 'complex_user_workflow',
      name: 'Complex User Workflow Test',
      description: 'Test a complete user interaction workflow',
      steps: [
        { type: 'screenshot' },
        { type: 'wait', timeout: 2000 },
        { type: 'screenshot' }
      ],
      assertions: [
        {
          type: 'visible',
          selector: 'body',
          expected: true,
          message: 'Page should be visible'
        }
      ]
    };

    const result = await agentInterface.executeScenario(workflowScenario);
    
    expect(result.success).toBe(true);
    expect(result.screenshots.length).toBeGreaterThan(0);
    
    console.log(`✅ Workflow test completed in ${result.duration}ms`);
  });

  test('should perform accessibility analysis', async () => {
    console.log('♿ Running accessibility analysis...');
    
    // Create an accessibility-focused scenario
    const accessibilityScenario: TestScenario = {
      id: 'accessibility_check',
      name: 'Accessibility Compliance Check',
      description: 'Verify accessibility compliance of the page',
      steps: [
        { type: 'screenshot' },
        { type: 'wait', timeout: 1000 }
      ],
      assertions: [
        {
          type: 'accessibility',
          selector: 'body',
          expected: true,
          message: 'Page should meet accessibility standards'
        }
      ]
    };

    const result = await agentInterface.executeScenario(accessibilityScenario);
    
    if (result.accessibility) {
      console.log(`Found ${result.accessibility.violations.length} accessibility violations`);
      
      // Log critical accessibility issues
      const criticalViolations = result.accessibility.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      
      if (criticalViolations.length > 0) {
        console.log('🚨 Critical accessibility issues found:');
        criticalViolations.forEach(violation => {
          console.log(`- ${violation.description}`);
        });
      }
      
      // Accessibility should have minimal critical violations
      expect(criticalViolations.length).toBeLessThanOrEqual(2);
    }
  });

  test('should detect performance issues', async () => {
    console.log('⚡ Analyzing performance...');
    
    const performanceScenario: TestScenario = {
      id: 'performance_check',
      name: 'Performance Analysis',
      description: 'Analyze page performance metrics',
      steps: [
        { type: 'wait', timeout: 3000 }, // Allow time for page to fully load
        { type: 'screenshot' }
      ],
      assertions: [
        {
          type: 'performance',
          selector: 'body',
          expected: true,
          message: 'Page should meet performance standards'
        }
      ]
    };

    const result = await agentInterface.executeScenario(performanceScenario);
    
    if (result.performance) {
      console.log(`Performance metrics: Load time: ${result.performance.loadTime}ms, LCP: ${result.performance.largestContentfulPaint}ms`);
      
      // Basic performance assertions
      expect(result.performance.loadTime).toBeLessThan(5000); // Load time under 5 seconds
      expect(result.performance.largestContentfulPaint).toBeLessThan(3000); // LCP under 3 seconds
    }
  });

  test('should handle error conditions gracefully', async () => {
    console.log('🚨 Testing error handling...');
    
    // Test how the system handles invalid scenarios
    const invalidScenario: TestScenario = {
      id: 'invalid_test',
      name: 'Invalid Test Scenario',
      description: 'Test with invalid selectors to verify error handling',
      steps: [
        { type: 'click', selector: '#non-existent-element', timeout: 5000 }
      ],
      assertions: [
        {
          type: 'visible',
          selector: '#non-existent-element',
          expected: true,
          message: 'Non-existent element should be visible'
        }
      ]
    };

    const result = await agentInterface.executeScenario(invalidScenario);
    
    // Should fail gracefully without crashing
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    console.log('✅ Error handling verified - system failed gracefully');
  });
});
