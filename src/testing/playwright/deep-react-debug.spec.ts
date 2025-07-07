import { test } from '@playwright/test';

test.describe('Deep React Debug Analysis', () => {
  test('diagnose React mounting issues in detail', async ({ page }) => {
    // Capture all console output
    const messages: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      messages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}\nSTACK: ${error.stack}`);
    });

    // Navigate to the page
    await page.goto('http://localhost:5174');
    
    console.log('=== INITIAL STATE ===');
    
    // Wait for initial content and script loads
    await page.waitForLoadState('networkidle');
    
    // Check if root element exists
    const rootExists = await page.locator('#root').count() > 0;
    console.log(`Root element exists: ${rootExists}`);
    
    // Check preloader
    const preloaderExists = await page.locator('#initial-preloader').count() > 0;
    console.log(`Preloader exists: ${preloaderExists}`);
    
    // Check script loading
    const scriptCount = await page.locator('script').count();
    console.log(`Script tags found: ${scriptCount}`);
    
    // Wait for React to potentially mount
    await page.waitForTimeout(3000);
    
    console.log('=== AFTER WAITING ===');
    
    // Check if preloader is still there
    const preloaderStillExists = await page.locator('#initial-preloader').count() > 0;
    console.log(`Preloader still exists: ${preloaderStillExists}`);
    
    // Check root content
    const rootContent = await page.locator('#root').innerHTML();
    console.log(`Root HTML length: ${rootContent.length}`);
    console.log(`Root HTML preview: ${rootContent.substring(0, 200)}...`);
    
    // Check if React mounted
    const reactMounted = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    });
    console.log(`React mounted (has children): ${reactMounted}`);
    
    // Check window.React
    const reactGlobal = await page.evaluate(() => typeof window.React !== 'undefined');
    console.log(`React available globally: ${reactGlobal}`);
    
    // Check for specific Solana wallet errors
    const walletErrors = await page.evaluate(() => {
      return window.console ? 
        'Console available' : 
        'No console available';
    });
    console.log(`Wallet/Console status: ${walletErrors}`);
    
    // Try to manually check if main.tsx executed
    const mainTsxLoaded = await page.evaluate(() => {
      // Check if ReactDOM.createRoot was called
      const scripts = Array.from(document.scripts);
      const mainScript = scripts.find(s => s.src.includes('main.tsx'));
      return mainScript ? 'main.tsx script found' : 'main.tsx script not found';
    });
    console.log(`Main script status: ${mainTsxLoaded}`);
    
    console.log('=== CONSOLE MESSAGES ===');
    messages.forEach(msg => console.log(msg));
    
    console.log('=== ERRORS ===');
    errors.forEach(error => console.log(error));
    
    console.log('=== FINAL CHECK ===');
    
    // Force remove preloader if it exists and wait
    await page.evaluate(() => {
      const preloader = document.getElementById('initial-preloader');
      if (preloader) {
        preloader.remove();
      }
    });
    
    await page.waitForTimeout(2000);
    
    const finalRootContent = await page.locator('#root').innerHTML();
    console.log(`Final root HTML length: ${finalRootContent.length}`);
    
    if (finalRootContent.length === 0) {
      console.log('❌ React app did not mount - investigating further...');
      
      // Check if there are any unhandled promise rejections
      const unhandledRejections = await page.evaluate(() => {
        return (window as unknown as { __unhandledRejections?: string[] }).__unhandledRejections || [];
      });
      console.log(`Unhandled promise rejections: ${JSON.stringify(unhandledRejections)}`);
      
      // Check network failures
      const failedRequests = await page.evaluate(() => {
        return (window as unknown as { __networkFailures?: string[] }).__networkFailures || [];
      });
      console.log(`Network failures: ${JSON.stringify(failedRequests)}`);
    } else {
      console.log('✅ React app mounted successfully');
    }
  });
});
