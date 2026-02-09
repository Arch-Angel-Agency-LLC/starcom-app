#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173/';
const DURATION_MIN = Number(process.env.DURATION_MIN ?? 5);
const SNAP_INTERVAL_MS = Number(process.env.SNAP_INTERVAL_MS ?? 15_000);
const ARTIFACT_DIR = process.env.ARTIFACT_DIR ?? 'artifacts/memory-smoke';
const NAV_TIMEOUT_MS = Number(process.env.NAV_TIMEOUT_MS ?? 60_000);
const SCENARIO_MODULE = process.env.SCENARIO_MODULE; // optional: absolute path exporting run(page, ctx)
const HEADLESS = (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false';
const USER_AGENT = process.env.USER_AGENT ?? 'starcom-memory-smoke/1.0';

const ensureDir = async (dir) => fs.promises.mkdir(dir, { recursive: true });

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

async function attachConsoleCollector(page) {
  const messages = [];
  page.on('console', (msg) => {
    messages.push({
      type: msg.type(),
      text: msg.text(),
      ts: Date.now(),
    });
    if (messages.length > 500) messages.shift();
  });
  return messages;
}

async function measureHeap(page) {
  return page.evaluate(() => {
    const perf = performance.memory;
    if (!perf) return null;
    return {
      usedJSHeapSize: perf.usedJSHeapSize,
      totalJSHeapSize: perf.totalJSHeapSize,
      jsHeapSizeLimit: perf.jsHeapSizeLimit,
    };
  });
}

async function takeHeapSnapshot(client, outPath) {
  await client.send('HeapProfiler.enable');
  const chunks = [];
  client.on('HeapProfiler.addHeapSnapshotChunk', ({ chunk }) => chunks.push(chunk));
  await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  await fs.promises.writeFile(outPath, chunks.join(''));
}

async function defaultModeChurn(page, cycleMs = 4_000) {
  const keys = ['n', 'i', 'e', 'm', 'a', 's'];
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(cycleMs / keys.length);
  }
}

async function maybeCustomScenario(page, ctx) {
  if (!SCENARIO_MODULE) return false;
  const mod = await import(path.resolve(SCENARIO_MODULE));
  if (typeof mod.run !== 'function') throw new Error('Custom scenario must export run(page, ctx)');
  await mod.run(page, ctx);
  return true;
}

async function run() {
  await ensureDir(ARTIFACT_DIR);
  const browser = await chromium.launch({ headless: HEADLESS, args: ['--enable-precise-memory-info'] });
  const context = await browser.newContext({ userAgent: USER_AGENT });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const consoleBuffer = await attachConsoleCollector(page);

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  await page.waitForSelector('#root', { timeout: NAV_TIMEOUT_MS });

  const startedAt = Date.now();
  const deadline = startedAt + DURATION_MIN * 60_000;
  const metrics = [];
  let lastSnapAt = startedAt;

  while (Date.now() < deadline) {
    const ctx = { iteration: metrics.length, deadline };
    const usedCustom = await maybeCustomScenario(page, ctx);
    if (!usedCustom) {
      await defaultModeChurn(page);
    }

    const heap = await measureHeap(page);
    metrics.push({ t: Date.now(), heap });

    if (Date.now() - lastSnapAt >= SNAP_INTERVAL_MS) {
      const snapPath = path.join(ARTIFACT_DIR, `heap-${timestamp()}.heapsnapshot`);
      await takeHeapSnapshot(client, snapPath);
      lastSnapAt = Date.now();
    }
  }

  const report = {
    startedAt,
    durationMs: Date.now() - startedAt,
    baseUrl: BASE_URL,
    headless: HEADLESS,
    metrics,
    consoleSamples: consoleBuffer.slice(-50),
  };

  const reportPath = path.join(ARTIFACT_DIR, `report-${timestamp()}.json`);
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

  await browser.close();
  // eslint-disable-next-line no-console
  console.log(`Long-run smoke complete. Report: ${reportPath}`);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
