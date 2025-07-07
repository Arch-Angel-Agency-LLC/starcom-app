import { test, expect } from '@playwright/test';

test.describe('Report Creation Flow', () => {
  test('user can create a new intel report for a team', async ({ page }) => {
    // Navigate to new report page for team1
    await page.goto('http://localhost:3000/team/team1/new-report');

    // Fill out form
    await page.fill('input[placeholder="Title"]', 'Test Report');
    await page.fill('textarea[placeholder="Content"]', 'Detailed intelligence content');
    await page.fill('input[placeholder="Tags (comma-separated)"]', 'SIGINT, HUMINT');

    // Submit
    await Promise.all([
      page.waitForNavigation({ url: '**/team/team1' }),
      page.click('button:has-text("Submit")')
    ]);

    // After redirect, verify report appears in list
    await expect(page.locator('text=Test Report')).toBeVisible();
  });
});
