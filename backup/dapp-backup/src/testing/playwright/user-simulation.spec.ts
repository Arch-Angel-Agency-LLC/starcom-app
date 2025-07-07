import { test, expect } from '@playwright/test';
import { humanLikeClick, humanLikeType } from './helpers/human-simulation-helper';

// Stub network endpoints to remove external variability
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
});

test.describe('Human-like UI Interaction Simulation', () => {
  test('should simulate a user joining a team, sending a message, and verifying it appears', async ({ page }) => {
    await page.goto('/'); // baseURL is set in playwright.config.ts

    await test.step('Join the team', async () => {
      const joinTeamButton = 'button:has-text("Join Team")';
      await humanLikeClick(page, joinTeamButton);
      await expect(page.locator('text=Welcome to the team!')).toBeVisible({ timeout: 15000 });
    });

    let testMessage = '';
    await test.step('Type and send a message', async () => {
      const messageInput = 'textarea[placeholder="Type your message..."]';
      testMessage = `Message sent by human simulation at ${Date.now()}`;
      await humanLikeType(page, messageInput, testMessage);
      await humanLikeClick(page, 'button:has-text("Send")');
    });

    await test.step('Verify message appears', async () => {
      await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 15000 });
    });
  });

  test('E2E-002: should correctly enable/disable the send button based on input', async ({ page }) => {
    await page.goto('/');

    const messageInputSelector = 'textarea[placeholder="Type your message..."]';
    const sendButtonSelector = 'button:has-text("Send")';

    await test.step('Join the team', async () => {
      await humanLikeClick(page, 'button:has-text("Join Team")');
      await expect(page.locator('text=Welcome to the team!')).toBeVisible({ timeout: 15000 });
    });

    await test.step('Verify send button disabled initially', async () => {
      const sendBtn = page.locator('button:has-text("Send")');
      await expect(sendBtn).toBeDisabled();
    });

    await test.step('Enable and disable send button correctly', async () => {
      // Type text and verify send button enables
      await humanLikeType(page, messageInputSelector, 'Some text');
      await expect(page.locator(sendButtonSelector)).toBeEnabled({ timeout: 15000 });
      // Clear input and verify disable
      await page.fill(messageInputSelector, '');
      await expect(page.locator(sendButtonSelector)).toBeDisabled({ timeout: 15000 });
    });
  });

  test('E2E-003: should switch channels and preserve message state', async ({ page }) => {
    await page.goto('/');

    const messageInputSelectorA = 'textarea[placeholder="Type your message..."]';
    const sendButtonSelectorA = 'button:has-text("Send")';
    let messageA = '';
    await test.step('Join the team and send in Channel A', async () => {
      await humanLikeClick(page, 'button:has-text("Join Team")');
      await expect(page.locator('text=Welcome to the team!')).toBeVisible({ timeout: 15000 });
      messageA = `Channel A message ${Date.now()}`;
      await humanLikeType(page, messageInputSelectorA, messageA);
      await humanLikeClick(page, sendButtonSelectorA);
      await expect(page.locator(`text=${messageA}`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('Switch to Channel B and verify A hidden', async () => {
      await humanLikeClick(page, 'button:has-text("Channel B")');
      await expect(page.locator(`text=${messageA}`)).not.toBeVisible({ timeout: 10000 });
    });

    let messageB = '';
    await test.step('Send in Channel B', async () => {
      messageB = `Channel B message ${Date.now()}`;
      await humanLikeType(page, messageInputSelectorA, messageB);
      await humanLikeClick(page, sendButtonSelectorA);
      await expect(page.locator(`text=${messageB}`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('Return to Channel A and verify states', async () => {
      await humanLikeClick(page, 'button:has-text("General")');
      await expect(page.locator(`text=${messageA}`)).toBeVisible({ timeout: 15000 });
      await expect(page.locator(`text=${messageB}`)).not.toBeVisible({ timeout: 10000 });
    });
  });
});
