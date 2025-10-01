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

test.describe('visual - geopolitical QA views', () => {
  test('captures antimeridian and 45° markers via geoSnap', async ({ page }) => {
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

  await page.goto('http://127.0.0.1:5173/?geoDebugOverlay=markers&geoSnap=anti180,pm45N,pm45S,lat45E,lat45W,northPole,southPole,maldives,aegean,caribbean,pacificMicro', { waitUntil: 'load' });

  const needed = [
    'globe-anti180', 'globe-pm45N', 'globe-pm45S', 'globe-lat45E', 'globe-lat45W',
    'globe-northPole', 'globe-southPole', 'globe-maldives', 'globe-aegean', 'globe-caribbean', 'globe-pacificMicro'
  ];
  const deadline = Date.now() + 50000;
  const hasAllNeeded = () => needed.every(key => downloads.some(f => f.includes(key)));
  while (!hasAllNeeded() && Date.now() < deadline) {
    await page.waitForTimeout(500);
  }
  const missing = needed.filter(key => !downloads.some(f => f.includes(key)));
  expect(missing, `Missing expected views: ${missing.join(', ')}`).toHaveLength(0);
    } finally {
      dev.kill('SIGTERM');
    }
  });
});
