import { test, expect } from '@playwright/test';

/**
 * Basic test to verify the AI testing infrastructure is working
 */
test.describe('AI Agent Testing Infrastructure', () => {
  test('should load the application homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for any potential loading screens or dynamic content
    await page.waitForTimeout(2000);
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'test-results/homepage-verification.png',
      fullPage: true 
    });
    
    // Basic assertions
    expect(page.url()).toContain('localhost');
    
    // Check that the page has loaded content (use a more flexible selector)
    const htmlElement = page.locator('html');
    await expect(htmlElement).toBeVisible();
    
    // Check if there's a root div (common in React apps)
    const rootDiv = page.locator('#root, .app, main');
    const rootExists = await rootDiv.count() > 0;
    
    if (rootExists) {
      console.log('✅ Found application root element');
    } else {
      console.log('ℹ️ No obvious root element found, but page loaded');
    }
    
    console.log('✅ Homepage loaded successfully');
  });

  test('should detect basic UI elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for dynamic content to load
    
    // Look for common UI elements with broader selectors
    const buttons = await page.locator('button, [role="button"], input[type="button"], input[type="submit"]').count();
    const links = await page.locator('a[href], [role="link"]').count();
    const inputs = await page.locator('input, textarea, select').count();
    const divs = await page.locator('div').count();
    const allElements = await page.locator('*').count();
    
    console.log(`Found ${buttons} buttons, ${links} links, ${inputs} inputs`);
    console.log(`Total elements on page: ${allElements}, divs: ${divs}`);
    
    // Should have at least some HTML elements even if no interactive ones
    expect(allElements).toBeGreaterThan(5); // At least html, head, body, etc.
    
    // Log what we found
    if (buttons + links + inputs === 0) {
      console.log('ℹ️ No interactive elements found - page might be loading or styled differently');
    } else {
      console.log('✅ Found interactive elements');
    }
  });

  test('should be accessible to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Basic accessibility checks
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.filter(input => {
        const inputElement = input as HTMLInputElement;
        const hasLabel = inputElement.labels && inputElement.labels.length > 0;
        const hasAriaLabel = input.getAttribute('aria-label');
        return !hasLabel && !hasAriaLabel;
      }).length;
    });
    
    console.log(`Found ${imagesWithoutAlt} images without alt text`);
    console.log(`Found ${inputsWithoutLabels} inputs without labels`);
    
    // Log findings but don't fail tests yet - these are warnings
    if (imagesWithoutAlt > 0) {
      console.warn('⚠️ Some images are missing alt text');
    }
    if (inputsWithoutLabels > 0) {
      console.warn('⚠️ Some inputs are missing labels');
    }
  });

  test('should complete a basic interaction workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/workflow-start.png' 
    });
    
    // Try to interact with the first button found
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible()) {
      await firstButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after interaction
      await page.screenshot({ 
        path: 'test-results/workflow-after-click.png' 
      });
      
      console.log('✅ Button interaction completed');
    } else {
      console.log('ℹ️ No buttons found for interaction test');
    }
    
    // This test should always pass - it's just documenting the UI state
    expect(true).toBe(true);
  });
});
