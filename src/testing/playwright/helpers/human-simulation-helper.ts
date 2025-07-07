import { Page } from '@playwright/test';

// Function to introduce a random delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates moving the mouse to a target element in a more human-like, non-linear path.
 * @param page The Playwright Page object.
 * @param selector The selector for the target element.
 */
export async function humanLikeMouseMove(page: Page, selector: string) {
  const element = await page.waitForSelector(selector);
  if (!element) {
    throw new Error(`Element with selector "${selector}" not found.`);
  }

  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Could not get bounding box for element with selector "${selector}".`);
  }

  const startX = (await page.mouse.getPosition())?.x || 0;
  const startY = (await page.mouse.getPosition())?.y || 0;
  const endX = box.x + box.width / 2;
  const endY = box.y + box.height / 2;

  const steps = Math.floor(Math.random() * 5) + 10; // 10 to 14 steps
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const intermediateX = startX + (endX - startX) * t + (Math.random() - 0.5) * 10; // Add some randomness
    const intermediateY = startY + (endY - startY) * t + (Math.random() - 0.5) * 10;
    await page.mouse.move(intermediateX, intermediateY);
    await sleep(Math.random() * 20 + 10); // 10-30ms delay between moves
  }
}

/**
 * Simulates a human-like click on an element, including mouse movement and slight delays.
 * @param page The Playwright Page object.
 * @param selector The selector for the target element.
 */
export async function humanLikeClick(page: Page, selector: string) {
  await humanLikeMouseMove(page, selector);
  await sleep(Math.random() * 100 + 50); // 50-150ms delay before click
  await page.mouse.down();
  await sleep(Math.random() * 50 + 20); // 20-70ms delay for click duration
  await page.mouse.up();
}

/**
 * Simulates human-like typing into an input field with variable delays between keystrokes.
 * @param page The Playwright Page object.
 * @param selector The selector for the input element.
 * @param text The text to type.
 */
export async function humanLikeType(page: Page, selector: string, text: string) {
  for (const char of text) {
    await page.type(selector, char, { delay: Math.random() * 90 + 30 }); // 30-120ms delay
  }
}
