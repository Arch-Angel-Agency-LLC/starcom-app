import { test, expect } from '@playwright/test';
import AgentInterface from '../ai-agent/AgentInterfaceSimple';

test.describe('AI Agent Interface - Universal Component Detection', () => {
  test('should detect components using universal detector', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create agent interface
    const agent = new AgentInterface();
    await agent.initialize(context, page);
    
    // Navigate to a simple test page
    await agent.navigate('http://localhost:5173');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot for debugging
    const screenshotPath = await agent.takeScreenshot('universal-detection-test');
    console.log('Screenshot saved to:', screenshotPath);
    
    // Get page info
    const title = await agent.getPageTitle();
    const url = await agent.getPageUrl();
    console.log('Page title:', title);
    console.log('Page URL:', url);
    
    // Detect components
    const components = await agent.detectComponents();
    console.log('Detected components:', components.length);
    
    components.forEach((component, index) => {
      console.log(`Component ${index + 1}:`, {
        id: component.id,
        type: component.type,
        selector: component.selector,
        properties: Object.keys(component.properties).length
      });
    });
    
    // Should find at least some components
    expect(components.length).toBeGreaterThan(0);
    
    // Each component should have required properties
    components.forEach(component => {
      expect(component).toHaveProperty('id');
      expect(component).toHaveProperty('type');
      expect(component).toHaveProperty('selector');
      expect(component).toHaveProperty('properties');
      expect(typeof component.id).toBe('string');
      expect(typeof component.type).toBe('string');
      expect(typeof component.selector).toBe('string');
      expect(typeof component.properties).toBe('object');
    });
    
    // Cleanup
    await agent.cleanup();
    await context.close();
  });
  
  test('should handle pages with no detectable components gracefully', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create agent interface
    const agent = new AgentInterface();
    await agent.initialize(context, page);
    
    // Navigate to a blank page
    await agent.navigate('data:text/html,<html><body><p>Simple text</p></body></html>');
    
    // Try to detect components
    const components = await agent.detectComponents();
    console.log('Components on blank page:', components.length);
    
    // Should handle gracefully (may return empty array or basic HTML elements)
    expect(Array.isArray(components)).toBe(true);
    
    // Cleanup
    await agent.cleanup();
    await context.close();
  });
});
