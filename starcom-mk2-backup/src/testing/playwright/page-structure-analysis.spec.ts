import { test } from '@playwright/test';

test('Page Structure Analysis', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Wait for any dynamic content to load
  await page.waitForTimeout(3000);
  
  // Get the full HTML content
  const htmlContent = await page.content();
  console.log('=== FULL HTML CONTENT ===');
  console.log(htmlContent);
  
  // Get all elements with their tag names
  const allElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    return Array.from(elements).map(el => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      textContent: el.textContent?.substring(0, 100),
      attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
    }));
  });
  
  console.log('=== ALL ELEMENTS ===');
  console.log(JSON.stringify(allElements, null, 2));
  
  // Look specifically for React app elements
  const reactElements = await page.evaluate(() => {
    return {
      rootElement: document.getElementById('root')?.innerHTML.substring(0, 500),
      hasReactRoot: !!document.getElementById('root'),
      bodyChildren: Array.from(document.body.children).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
      })),
    };
  });
  
  console.log('=== REACT STRUCTURE ===');
  console.log(JSON.stringify(reactElements, null, 2));
  
  // Check for any interactive elements with more modern selectors
  const modernElements = await page.evaluate(() => {
    const selectors = [
      'button', '[role="button"]', '[data-testid*="button"]',
      'a', '[role="link"]',
      'input', 'textarea', '[contenteditable]',
      '[class*="button"]', '[class*="btn"]',
      '[class*="link"]', '[class*="nav"]',
      '[aria-label]', '[data-*]'
    ];
    
    const found: Array<{
      selector: string;
      count: number;
      examples: Array<{
        tagName: string;
        className: string;
        textContent: string | undefined;
      }>;
    }> = [];
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          found.push({
            selector,
            count: elements.length,
            examples: Array.from(elements).slice(0, 3).map(el => ({
              tagName: el.tagName,
              className: el.className,
              textContent: el.textContent?.substring(0, 50),
            }))
          });
        }
      } catch {
        // Skip invalid selectors
      }
    }
    return found;
  });
  
  console.log('=== MODERN ELEMENTS FOUND ===');
  console.log(JSON.stringify(modernElements, null, 2));
});
