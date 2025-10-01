// Playwright config for visual tests only
// Limits discovery to tests under tests/visual to avoid loading unrelated Jest/Vitest suites.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/visual',
  testMatch: '**/*.spec.mjs',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    viewport: { width: 1280, height: 800 },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
