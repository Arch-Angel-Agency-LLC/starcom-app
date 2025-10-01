import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Server did not start in time'));
        else setTimeout(tryOnce, 300);
      });
    };
    tryOnce();
  });
}

test.describe('visual - geopolitical baseline snapshots', () => {
  test('captures baseline snapshots via geoSnap', async ({ page }, testInfo) => {
    const outDir = path.resolve('docs/assets/geopolitical/baseline');
    await fs.mkdir(outDir, { recursive: true });

    const dev = spawn(process.execPath, [
      path.resolve('node_modules/vite/bin/vite.js'),
      '--port',
      '5173',
      '--host',
      '127.0.0.1'
    ], { stdio: 'pipe' });

    try {
  await waitForServer('http://127.0.0.1:5173');

      const downloads = [];
      page.on('download', async (dl) => {
        const suggested = dl.suggestedFilename();
        const target = path.join(outDir, suggested);
        await dl.saveAs(target);
        downloads.push(target);
      });

  await page.goto('http://127.0.0.1:5173/?geoDebugOverlay=markers&geoSnap=all', { waitUntil: 'load' });

      const deadline = Date.now() + 30000;
      while (downloads.length < 4 && Date.now() < deadline) {
        await page.waitForTimeout(500);
      }

      expect(downloads.length).toBeGreaterThanOrEqual(4);
    } finally {
  dev.kill('SIGTERM');
    }
  });
});
