import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

async function waitForServer(url: string, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
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
    // Ensure output dir
    const outDir = path.resolve(testInfo.project.outputDir, '../../artifacts/geopolitical/baseline');
    await fs.mkdir(outDir, { recursive: true });

    // Start vite preview on a fixed port
    const preview = spawn(process.execPath, [
      path.resolve('node_modules/vite/bin/vite.js'),
      'preview',
      '--port',
      '4173'
    ], { stdio: 'pipe' });

    try {
      await waitForServer('http://localhost:4173');

      // Collect downloads
      const downloads: string[] = [];
      page.on('download', async (dl) => {
        const suggested = dl.suggestedFilename();
        const target = path.join(outDir, suggested);
        await dl.saveAs(target);
        downloads.push(target);
      });

      // Navigate to app with snapshot query
      await page.goto('http://localhost:4173/?geoDebugOverlay=markers&geoSnap=all', { waitUntil: 'load' });

      // Wait for downloads (expect ~8 keys); allow up to 30s
      const deadline = Date.now() + 30000;
      while (downloads.length < 8 && Date.now() < deadline) {
        await page.waitForTimeout(500);
      }

      // Basic sanity: at least 4 images were captured
      expect(downloads.length).toBeGreaterThanOrEqual(4);
    } finally {
      preview.kill('SIGTERM');
    }
  });
});
