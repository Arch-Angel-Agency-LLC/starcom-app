import { test, expect } from '@playwright/test';
import { AgentInterface } from '../ai-agent/AgentInterfaceSimple';
import { AdvancedComponentDetector } from '../ai-agent/AdvancedComponentDetector';

interface AccessibilityIssue {
  selector: string;
  issue: string;
  severity: string;
}

test.describe('AI Agent Phase 2 Advanced UI Testing', () => {
  let agentInterface: AgentInterface;
  let advancedDetector: AdvancedComponentDetector;

  test.beforeEach(async ({ browser }) => {
    agentInterface = new AgentInterface();
    advancedDetector = new AdvancedComponentDetector();
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await agentInterface.initialize(context, page);
    await agentInterface.navigate('http://localhost:5174');
    
    // Wait for React app to mount
    await page.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    await agentInterface.cleanup();
  });

  test('should perform advanced component detection with multiple strategies', async () => {
    console.log('🤖 Phase 2: Advanced Component Detection Test Started');
    
    // Get page for direct interaction
    const page = agentInterface.getPage();
    if (!page) throw new Error('Page not initialized');
    
    // Test basic advanced detection
    const components = await advancedDetector.detectComponents(page);
    
    console.log(`✅ Advanced detector found ${components.length} components`);
    
    // Validate components have required properties
    expect(components.length).toBeGreaterThan(0);
    
    for (const component of components) {
      expect(component).toHaveProperty('type');
      expect(component).toHaveProperty('selector');
      expect(typeof component.type).toBe('string');
      expect(typeof component.selector).toBe('string');
    }

    // Screenshot for debugging
    await agentInterface.takeScreenshot('phase2-advanced-detection');
    
    console.log('🎯 Phase 2 Advanced Detection Test Completed Successfully');
  });

  test('should perform intelligent interaction testing', async () => {
    console.log('🤖 Phase 2: Intelligent Interaction Testing Started');
    
    const page = (agentInterface as any).page;
    const components = await advancedDetector.detectComponents(page);

    let interactionCount = 0;
    const maxInteractions = 3;

    for (const component of components.slice(0, maxInteractions)) {
      console.log(`🎯 Testing interaction with ${component.type}: ${component.selector}`);
      
      try {
        // Check if element is still visible and interactable
        const element = page.locator(component.selector);
        await expect(element.first()).toBeVisible({ timeout: 5000 });
        
        // Perform appropriate interaction based on component type
        switch (component.type) {
          case 'button': {
            await element.first().click();
            console.log(`✅ Clicked button: ${component.selector}`);
            break;
          }
          case 'input': {
            await element.first().fill('AI Test Input');
            console.log(`✅ Filled input: ${component.selector}`);
            break;
          }
          case 'select': {
            // Try to select first option if available
            const options = element.locator('option');
            const optionCount = await options.count();
            if (optionCount > 1) {
              await element.first().selectOption({ index: 1 });
              console.log(`✅ Selected option in: ${component.selector}`);
            }
            break;
          }
          case 'link': {
            // Just focus the link without navigating
            await element.first().focus();
            console.log(`✅ Focused link: ${component.selector}`);
            break;
          }
          default:
            await element.first().hover();
            console.log(`✅ Hovered over: ${component.selector}`);
        }
        
        interactionCount++;
        
        // Wait a bit between interactions to avoid overwhelming the UI
        await page.waitForTimeout(500);
        
      } catch (error) {
        console.log(`⚠️ Interaction failed for ${component.selector}: ${(error as Error).message}`);
        // Continue with other components
      }
    }

    expect(interactionCount).toBeGreaterThan(0);
    console.log(`🎯 Successfully interacted with ${interactionCount} components`);
    
    // Screenshot after interactions
    await agentInterface.takeScreenshot('phase2-after-interactions');
    
    console.log('🎯 Phase 2 Intelligent Interaction Test Completed');
  });

  test('should perform UI pattern recognition and classification', async () => {
    console.log('🤖 Phase 2: UI Pattern Recognition Started');
    
    const page = (agentInterface as any).page;
    const components = await advancedDetector.detectComponents(page);

    // Classify components by common UI patterns
    const patterns: Record<string, typeof components> = {
      navigation: [],
      forms: [],
      controls: [],
      content: [],
      feedback: []
    };

    for (const component of components) {
      // Classify based on selectors and types
      const selector = component.selector.toLowerCase();
      const type = component.type.toLowerCase();
      
      if (selector.includes('nav') || selector.includes('menu') || type === 'nav') {
        patterns.navigation.push(component);
      } else if (type === 'form' || type === 'input' || type === 'select' || type === 'textarea') {
        patterns.forms.push(component);
      } else if (type === 'button' || selector.includes('toggle') || selector.includes('control')) {
        patterns.controls.push(component);
      } else if (selector.includes('alert') || selector.includes('notification') || selector.includes('toast')) {
        patterns.feedback.push(component);
      } else {
        patterns.content.push(component);
      }
    }

    // Log pattern analysis
    console.log('📊 UI Pattern Analysis:');
    Object.entries(patterns).forEach(([pattern, items]) => {
      console.log(`  ${pattern}: ${items.length} components`);
    });

    // Validate we found meaningful patterns
    const totalPatterns = Object.values(patterns).reduce((sum, items) => sum + items.length, 0);
    expect(totalPatterns).toBeGreaterThan(0);
    
    console.log('🎯 Phase 2 UI Pattern Recognition Completed');
  });

  test('should perform automated accessibility analysis', async () => {
    console.log('🤖 Phase 2: Automated Accessibility Analysis Started');
    
    const page = (agentInterface as any).page;
    const components = await advancedDetector.detectComponents(page);

    const accessibilityIssues: AccessibilityIssue[] = [];
    
    for (const component of components) {
      try {
        const element = page.locator(component.selector);
        
        // Check for basic accessibility attributes
        const hasAriaLabel = await element.first().getAttribute('aria-label');
        const hasRole = await element.first().getAttribute('role');
        const hasTitle = await element.first().getAttribute('title');
        const hasAlt = await element.first().getAttribute('alt');
        
        // Check for interactive elements without proper labels
        if (component.type === 'button' && !hasAriaLabel && !hasTitle) {
          const textContent = await element.first().textContent();
          if (!textContent || textContent.trim().length === 0) {
            accessibilityIssues.push({
              selector: component.selector,
              issue: 'Button without accessible label',
              severity: 'high'
            });
          }
        }
        
        // Check for images without alt text
        if (component.type === 'img' && !hasAlt) {
          accessibilityIssues.push({
            selector: component.selector,
            issue: 'Image without alt text',
            severity: 'medium'
          });
        }
        
        // Check for form inputs without labels
        if (component.type === 'input') {
          const hasLabel = await element.first().getAttribute('aria-labelledby') || 
                          await element.first().getAttribute('aria-label') ||
                          await page.locator(`label[for="${await element.first().getAttribute('id')}"]`).count() > 0;
          
          if (!hasLabel) {
            accessibilityIssues.push({
              selector: component.selector,
              issue: 'Input without associated label',
              severity: 'high'
            });
          }
        }
        
      } catch (error) {
        console.log(`⚠️ Accessibility check failed for ${component.selector}: ${(error as Error).message}`);
      }
    }

    console.log(`📊 Accessibility Analysis Complete:`);
    console.log(`  Components analyzed: ${components.length}`);
    console.log(`  Issues found: ${accessibilityIssues.length}`);
    
    if (accessibilityIssues.length > 0) {
      console.log('🚨 Accessibility Issues:');
      accessibilityIssues.forEach(issue => {
        console.log(`  ${issue.severity.toUpperCase()}: ${issue.issue} (${issue.selector})`);
      });
    }

    // Don't fail the test for accessibility issues, just report them
    expect(components.length).toBeGreaterThan(0);
    
    console.log('🎯 Phase 2 Accessibility Analysis Completed');
  });

  test('should perform performance-aware component testing', async () => {
    console.log('🤖 Phase 2: Performance-Aware Testing Started');
    
    const page = (agentInterface as any).page;
    
    // Start performance monitoring
    await page.addInitScript(() => {
      (window as any).performanceMarks = [];
      window.performance.mark('test-start');
    });

    const startTime = Date.now();
    
    const components = await advancedDetector.detectComponents(page);
    
    const detectionTime = Date.now() - startTime;
    console.log(`⏱️ Component detection took: ${detectionTime}ms`);
    
    // Test interaction performance
    const interactionTimes: number[] = [];
    
    for (const component of components.slice(0, 3)) {
      if (component.type === 'button') {
        try {
          const element = page.locator(component.selector);
          await expect(element.first()).toBeVisible();
          
          const interactionStart = Date.now();
          await element.first().click();
          
          // Wait for any potential rerender
          await page.waitForTimeout(100);
          
          const interactionEnd = Date.now();
          const interactionTime = interactionEnd - interactionStart;
          interactionTimes.push(interactionTime);
          
          console.log(`⚡ Interaction with ${component.selector}: ${interactionTime}ms`);
          
        } catch (error) {
          console.log(`⚠️ Performance test failed for ${component.selector}: ${(error as Error).message}`);
        }
      }
    }

    // Analyze performance metrics
    const averageInteractionTime = interactionTimes.length > 0 
      ? interactionTimes.reduce((sum, time) => sum + time, 0) / interactionTimes.length 
      : 0;

    console.log(`📊 Performance Analysis:`);
    console.log(`  Detection time: ${detectionTime}ms`);
    console.log(`  Average interaction time: ${averageInteractionTime.toFixed(2)}ms`);
    console.log(`  Interactions tested: ${interactionTimes.length}`);

    // Performance thresholds
    expect(detectionTime).toBeLessThan(5000); // Detection should be under 5 seconds
    if (averageInteractionTime > 0) {
      expect(averageInteractionTime).toBeLessThan(1000); // Interactions should be under 1 second
    }
    
    console.log('🎯 Phase 2 Performance Testing Completed');
  });
});
