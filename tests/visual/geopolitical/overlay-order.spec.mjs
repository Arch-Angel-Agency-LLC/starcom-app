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

async function sampleCanvasBlock(page, blockSize = 21) {
  const data = await page.evaluate((bs) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return null;
    const { width, height } = canvas;
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const half = Math.floor(bs / 2);
    const x = Math.max(0, cx - half);
    const y = Math.max(0, cy - half);
    const w = Math.min(bs, width - x);
    const h = Math.min(bs, height - y);
    const pixels = new Uint8Array(w * h * 4);
    // Note: WebGL's y=0 is bottom. Adjust read origin accordingly.
    gl.readPixels(x, height - y - h, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return { pixels: Array.from(pixels), w, h };
  }, blockSize);
  return data; // { pixels:number[], w:number, h:number }
}

function isApproxColor([r, g, b], targetHex, tol = 30) {
  const tr = (targetHex >> 16) & 0xff;
  const tg = (targetHex >> 8) & 0xff;
  const tb = targetHex & 0xff;
  return Math.abs(r - tr) <= tol && Math.abs(g - tg) <= tol && Math.abs(b - tb) <= tol;
}

// Classification palette from materialTheme.ts
const COLORS = {
  disputed: 0xff5555,        // red
  loc: 0xffcc00,             // amber
  maritime_eez: 0x0094ff,    // blue
  maritime_overlap: 0xff8800, // orange
};

// Notes: use the in-page __geoOverlayProbe to deterministically check which lines
// intersect a center rectangle and compare their renderOrder / classifications.

test.describe('visual - overlay order (disputed/maritime above fills)', () => {
  test('disputed (LoC) visible at Kashmir and maritime overlap visible in SCS', async ({ page }) => {
    const dev = spawn(process.execPath, [
      path.resolve('node_modules/vite/bin/vite.js'),
      '--port', '5173', '--host', '127.0.0.1'
    ], { stdio: 'pipe' });

    try {
      await waitForServer('http://127.0.0.1:5173');

      // 1) Kashmir LoC — disputed/LoC should be above fills and tint center
      await page.goto('http://127.0.0.1:5173/?geoDebugOverlay=markers&geoLod=2&geoSnap=kashmirLoC', { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      const diag1 = await page.evaluate(() => window.__geoOverlayProbe?.getCenterLineDiagnostics(120));
      expect(diag1, 'Expected diagnostics for Kashmir view').not.toBeNull();
      if (diag1) {
        const lines = diag1.lines || [];
        const hasDisputed = lines.some(l => l.classification === 'disputed' || l.classification === 'line_of_control');
        expect(hasDisputed, 'Expected to find a disputed/LoC line in center window').toBeTruthy();
        const maxTerritoryOrder = diag1.maxTerritoryOrder ?? 0;
        const topLine = lines.reduce((a,b) => (a.renderOrder > b.renderOrder ? a : b), { renderOrder: -1 });
        expect(topLine.renderOrder, 'Top line should render above territory base renderOrder').toBeGreaterThan(maxTerritoryOrder);
  const allNoDepthWrite = lines.every(l => l.depthWrite === false);
  expect(allNoDepthWrite, 'Line materials should not write depth to avoid occlusion by fills').toBeTruthy();
      }

      // 2) South China Sea maritime overlaps (enable via geoMaritime flag)
      await page.goto('http://127.0.0.1:5173/?geoDebugOverlay=markers&geoMaritime=1&geoLod=2&geoSnap=southChinaSea');
      await page.waitForTimeout(1800);
      const diag2 = await page.evaluate(() => window.__geoOverlayProbe?.getCenterLineDiagnostics(140));
      expect(diag2, 'Expected diagnostics for SCS view').not.toBeNull();
      if (diag2) {
        const lines = diag2.lines || [];
        const hasMaritime = lines.some(l => l.classification === 'maritime_overlap' || l.classification === 'maritime_eez');
        expect(hasMaritime, 'Expected to find maritime line in center window').toBeTruthy();
        const orders = lines.filter(l => l.classification === 'maritime_overlap' || l.classification === 'maritime_eez').map(l => l.renderOrder);
        if (orders.length >= 2) {
          const overlapOrders = lines.filter(l => l.classification === 'maritime_overlap').map(l => l.renderOrder);
          const eezOrders = lines.filter(l => l.classification === 'maritime_eez').map(l => l.renderOrder);
          if (overlapOrders.length && eezOrders.length) {
            const maxOverlap = Math.max(...overlapOrders);
            const maxEez = Math.max(...eezOrders);
            expect(maxOverlap, 'maritime_overlap should have greater or equal priority than maritime_eez').toBeGreaterThan(maxEez);
          }
        }
  const allNoDepthWrite = lines.every(l => l.depthWrite === false);
  expect(allNoDepthWrite, 'Line materials should not write depth to avoid occlusion by fills').toBeTruthy();
      }

      // 3) West Sahara — expect disputed/indefinite line presence
  await page.goto('http://127.0.0.1:5173/?geoDebugOverlay=markers&geoDisputed=1&geoLod=2&geoSnap=westSahara');
      await page.waitForTimeout(1500);
      const diag3 = await page.evaluate(() => window.__geoOverlayProbe?.getCenterLineDiagnostics(140));
      expect(diag3, 'Expected diagnostics for West Sahara view').not.toBeNull();
      if (diag3) {
        const lines = diag3.lines || [];
        const hasIndefOrDisp = lines.some(l => l.classification === 'indefinite' || l.classification === 'disputed');
        expect(hasIndefOrDisp, 'Expected to find disputed/indefinite line in center window').toBeTruthy();
      }
    } finally {
      dev.kill('SIGTERM');
    }
  });
});
