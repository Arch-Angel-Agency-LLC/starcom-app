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

test.describe('visual - dev ID picking probe', () => {
  test('exposes probe and returns string|null at center in a known view', async ({ page }) => {
    const dev = spawn(process.execPath, [
      'node_modules/vite/bin/vite.js', '--port', '5173', '--host', '127.0.0.1'
    ], { stdio: 'pipe' });

    try {
      await waitForServer('http://127.0.0.1:5173');
  await page.goto('http://127.0.0.1:5173/?geoDebugOverlay=markers&geoLod=2&geoIdPicking=1&geoSnap=kashmirLoC', { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  const probeExists = await page.evaluate(() => !!window.__geoIdPickProbe);
  expect(probeExists).toBeTruthy();
  // sampleCenter should be callable and return string|null
  const id = await page.evaluate(() => window.__geoIdPickProbe?.sampleCenter());
  expect(id === null || typeof id === 'string').toBeTruthy();
    } finally {
      dev.kill('SIGTERM');
    }
  });
});
