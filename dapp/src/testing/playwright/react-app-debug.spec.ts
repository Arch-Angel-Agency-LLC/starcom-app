import { test, expect } from '@playwright/test';

test.describe('React App Debug Analysis', () => {
  test('analyze why React app root is empty', async ({ page }) => {
    // Navigate to the base URL defined in playwright.config.ts
    await page.goto('/');
    
    // Wait longer for React to potentially load
    await page.waitForTimeout(5000);
    
    // Capture detailed information about the page state
    console.log('=== PAGE ANALYSIS ===');
    
    // Check page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Title: ${title}`);
    console.log(`URL: ${url}`);
    
    // Check if React root exists and its content
    const rootElement = await page.locator('#root');
    const rootExists = await rootElement.count();
    console.log(`Root element exists: ${rootExists > 0}`);
    
    if (rootExists > 0) {
      const rootHTML = await rootElement.innerHTML();
      const rootText = await rootElement.textContent();
      console.log(`Root HTML length: ${rootHTML.length}`);
      console.log(`Root text content: "${rootText?.slice(0, 100)}..."`);
      console.log(`Root HTML preview: ${rootHTML.slice(0, 200)}...`);
    }
    
    // Check for JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Check for React in global scope
    const hasReact = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window as unknown as { React?: unknown }).React !== undefined;
    });
    console.log(`React available globally: ${hasReact}`);
    
    // Check for common React dev tools
    const hasReactDevTools = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown }).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined;
    });
    console.log(`React DevTools detected: ${hasReactDevTools}`);
    
    // Check all script tags
    const scripts = await page.locator('script').count();
    console.log(`Script tags found: ${scripts}`);
    
    for (let i = 0; i < Math.min(scripts, 5); i++) {
      const script = page.locator('script').nth(i);
      const src = await script.getAttribute('src');
      const type = await script.getAttribute('type');
      console.log(`Script ${i}: src="${src}", type="${type}"`);
    }
    
    // Check for CSS links
    const cssLinks = await page.locator('link[rel="stylesheet"]').count();
    console.log(`CSS links found: ${cssLinks}`);
    
    // Check network activity
    const responses: string[] = [];
    page.on('response', response => {
      responses.push(`${response.status()} ${response.url()}`);
    });
    
    // Reload to capture network activity
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('=== NETWORK RESPONSES ===');
    responses.slice(0, 10).forEach(response => {
      console.log(response);
    });
    
    console.log('=== JAVASCRIPT ERRORS ===');
    errors.forEach(error => {
      console.log(`ERROR: ${error}`);
    });
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: './test-results/screenshots/react-debug-analysis.png',
      fullPage: true 
    });
    
    // Try to wait specifically for React content
    try {
      await page.waitForFunction(() => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      }, { timeout: 10000 });
      console.log('React content loaded successfully after wait');
    } catch {
      console.log('React content did not load within 10 seconds');
    }
    
    // Final state check
    const finalRootHTML = await page.locator('#root').innerHTML();
    console.log(`Final root HTML length: ${finalRootHTML.length}`);
    
    // This test is for analysis, so we'll pass regardless
    expect(true).toBe(true);
  });
});
