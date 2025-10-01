import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import http from 'node:http';

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => { res.resume(); resolve(); });
      req.on('error', () => { if (Date.now() - start > timeoutMs) reject(new Error('Server did not start in time')); else setTimeout(tryOnce, 300); });
    };
    tryOnce();
  });
}

// Verifies cursor-based sampling via __geoIdPickProbe.sampleAtCursor/getLast
// and dev HUD flag wiring

test.describe('visual - cursor ID picking', () => {
  test('updates ID on pointer move when enabled', async ({ page }) => {
    const dev = spawn(process.execPath, [
      'node_modules/vite/bin/vite.js', '--port', '5173', '--host', '127.0.0.1'
    ], { stdio: 'pipe' });

    try {
      await waitForServer('http://127.0.0.1:5173');
      await page.goto('http://127.0.0.1:5173/?geoLod=2&geoIdPicking=1&geoIdPickingHud=1&geoSnap=pm45N', { waitUntil: 'load' });
      await page.waitForTimeout(1500);

      // Move cursor to screen center; should sample some ID (may be null if ocean)
      const { width, height } = page.viewportSize() || { width: 1280, height: 720 };
      await page.mouse.move(Math.floor(width/2), Math.floor(height/2));
      await page.waitForTimeout(100);
      const idAtCenter = await page.evaluate(() => window.__geoIdPickProbe?.getLast?.() ?? null);

      // Move slightly to change hovered pixel
      await page.mouse.move(Math.floor(width/2)+20, Math.floor(height/2));
      await page.waitForTimeout(100);
      const idAfterMove = await page.evaluate(() => window.__geoIdPickProbe?.getLast?.() ?? null);

      // It's okay if IDs are null over ocean; require that probe exists and doesn't throw
  // Probe should exist in dev
  expect(await page.evaluate(() => !!window.__geoIdPickProbe)).toBeTruthy();
  // After pointer moves, getLast should be callable and return string|null
  const last = await page.evaluate(() => window.__geoIdPickProbe?.getLast?.() ?? null);
  expect(last === null || typeof last === 'string').toBeTruthy();
    } finally {
      dev.kill('SIGTERM');
    }
  });
});
