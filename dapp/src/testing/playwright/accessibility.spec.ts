import { test, expect } from '@playwright/test';

/**
 * Accessibility & Focus Order Tests (Tier 2)
 * Verifies basic keyboard navigation and ARIA semantics.
 */

test.describe('Accessibility & Keyboard Navigation', () => {
  test('should tab through key UI elements in logical order', async ({ page }) => {
    await page.goto('/');
    // Wait for main application to load
    await page.waitForLoadState('domcontentloaded');
    
    // Define tabbable selectors in expected order
    const expectedOrder = ['button:has-text("Join Team")', 'textarea[placeholder="Type your message..."]', 'button:has-text("Send")'];
    
    // Press Tab and check focus sequence
    for (const selector of expectedOrder) {
      await page.keyboard.press('Tab');
      const active = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName);
      const locator = page.locator(selector);
      const isFocused = await locator.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBe(true);
    }
  });

  test('should have no missing alt text or labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Using accessibility snapshot from Playwright
    const snapshot = await page.accessibility.snapshot();
    // Assert all images have alt text
    const images = snapshot.children?.filter(node => node.role === 'img');
    const missingAlt = images?.filter(node => !node.name).length || 0;
    expect(missingAlt, 'All images should have alt text').toBe(0);
    // Assert no unlabeled inputs
    const inputs = snapshot.children?.filter(node => node.role === 'textbox');
    const missingLabel = inputs?.filter(node => !node.name).length || 0;
    expect(missingLabel, 'All inputs should have accessible names').toBe(0);
  });
});
