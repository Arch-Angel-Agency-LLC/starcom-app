import { test, expect } from '@playwright/test';

/**
 * Performance Budget Test
 * Ensures that the app meets basic load-time performance expectations.
 */
test.describe('Performance Budget', () => {
  test('should load the homepage within acceptable threshold', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    console.log(`Homepage load time: ${loadTime}ms`);
    // Acceptable budget: 2000ms
    expect(loadTime, 'Homepage should load within 2s').toBeLessThan(2000);
  });

  test('should render initial components under 500ms after load state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const renderStart = Date.now();
    // Wait for root to have children
    await page.locator('[data-testid="app-root"] > *').first().waitFor({ timeout: 1000 });
    const renderTime = Date.now() - renderStart;
    console.log(`Initial component render time: ${renderTime}ms`);
    // Acceptable component render budget: 500ms
    expect(renderTime, 'Initial components should render within 500ms').toBeLessThan(500);
  });
});
