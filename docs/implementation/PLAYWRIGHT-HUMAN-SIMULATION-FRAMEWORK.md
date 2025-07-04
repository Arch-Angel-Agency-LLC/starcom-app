# Playwright Human-Simulation Framework

**Version:** 1.0
**Date:** 2025-07-02

## 1. Introduction

This document provides the technical specification for the human-simulation testing framework using Playwright. The goal is to create a reusable, maintainable, and realistic set of tools for building end-to-end (E2E) tests.

## 2. Configuration (`playwright.config.ts`)

The Playwright configuration will be the single source of truth for test execution settings.

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/testing/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Key Settings:**
- `testDir`: Points to our Playwright test directory.
- `baseURL`: Sets the target URL for all tests, avoiding repetition.
- `trace`: Generates a detailed trace file for debugging failed test runs.
- `webServer`: Automatically starts the development server before running tests, creating a self-contained testing environment.

## 3. Human Simulation Helper (`/src/testing/playwright/helpers/human-simulation-helper.ts`)

To avoid code duplication and promote realism, all human-like interactions will be abstracted into a dedicated helper file.

### Core Functions:

**`humanLikeMouseMove(page: Page, selector: string)`**
- **Purpose:** To move the mouse cursor to a target element in a non-linear, human-like path.
- **Implementation:** It will calculate a series of intermediate points between the current mouse position and the target element's center, moving the mouse in small steps with slight delays.

**`humanLikeClick(page: Page, selector: string)`**
- **Purpose:** To simulate a realistic click.
- **Implementation:** This function will first call `humanLikeMouseMove` to move to the element, then introduce a small, random delay (e.g., 50-150ms) before executing the `page.mouse.down()` and `page.mouse.up()` actions. This mimics human reaction time.

**`humanLikeType(page: Page, selector: string, text: string)`**
- **Purpose:** To simulate realistic typing.
- **Implementation:** This will iterate through the input `text` character by character, introducing a small, variable delay between each keystroke (e.g., 30-120ms). This is far more realistic than Playwright's default instantaneous `fill()` method.

## 4. Best Practices

- **Use Locators, Not Selectors:** Prefer Playwright locators (`page.getByRole(...)`) over CSS selectors where possible, as they are more resilient to code changes.
- **Wait for Actionability:** Rely on Playwright's auto-waiting mechanism. The `humanLike` helpers should operate on elements that are already visible and enabled.
- **Descriptive Test Names:** Test names should clearly describe the user journey being tested (e.g., `test('should allow a user to join a team and send a message')`).
