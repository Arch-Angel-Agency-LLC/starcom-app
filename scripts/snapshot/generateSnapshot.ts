#!/usr/bin/env ts-node
/*
  Snapshot generator (MVP)
  Usage: tsx scripts/snapshot/generateSnapshot.ts --config scripts/snapshot/config/feeds.json --out public/content-snapshots/latest.json [--pretty]
*/
import fs from 'fs';
import path from 'path';
import { runPipeline } from './core/pipeline';
import type { Snapshot, SnapshotConfig } from './core/schema';
import { mediumAdapter } from './adapters/mediumAdapter';
import { genericRssAdapter } from './adapters/rssAdapter';

function parseArgs(argv: string[]) {
  const out: Record<string, string|boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pretty') out.pretty = true;
    else if (a.startsWith('--')) { out[a.slice(2)] = argv[++i]; }
  }
  return out as { config: string; out: string; pretty?: boolean };
}

function loadConfig(p: string): SnapshotConfig {
  const raw = fs.readFileSync(p, 'utf8');
  const cfg = JSON.parse(raw);
  return cfg;
}

function readPrevious(outPath: string): Snapshot | undefined {
  try {
    const raw = fs.readFileSync(outPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function ensureDirExists(dir: string) { fs.mkdirSync(dir, { recursive: true }); }

function stripVolatile(s: Snapshot) {
  const clone = JSON.parse(JSON.stringify(s));
  clone.generatedAt = '';
  clone.metrics.runDurationMs = 0;
  return clone;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.config || !args.out) {
    console.error('Usage: generateSnapshot --config <path> --out <path> [--pretty]');
    process.exit(1);
  }
  const cfg = loadConfig(args.config);
  const prev = readPrevious(args.out);
  const adapters = [mediumAdapter, genericRssAdapter];
  const snap = await runPipeline(adapters, cfg, prev);

  // Quality gates (mirrors docs)
  if (snap.items.length <= 0) {
    console.error('QUALITY_GATE_FAIL: itemCount == 0');
    process.exit(3);
  }
  const coverage = snap.items.filter(i => i.title && i.publishedAt).length / snap.items.length;
  if (coverage < 0.9) {
    console.error(`QUALITY_GATE_FAIL: required field coverage ${(coverage*100).toFixed(1)}% < 90%`);
    process.exit(3);
  }
  if (snap.metrics.avgConfidence < 0.75) {
    console.error(`QUALITY_GATE_FAIL: avgConfidence ${snap.metrics.avgConfidence} < 0.75`);
    process.exit(3);
  }

  // Diff with previous
  if (prev) {
    const a = JSON.stringify(stripVolatile(prev));
    const b = JSON.stringify(stripVolatile(snap));
    if (a === b) {
      console.log('No changes; skipping write');
      process.exit(0);
    }
  }

  const outPath = path.resolve(args.out);
  ensureDirExists(path.dirname(outPath));
  const json = args.pretty ? JSON.stringify(snap, null, 2) : JSON.stringify(snap);
  const tmp = outPath + '.tmp';
  fs.writeFileSync(tmp, json, 'utf8');
  fs.renameSync(tmp, outPath);
  console.log(`Wrote snapshot -> ${outPath} (items=${snap.items.length}, avgConf=${snap.metrics.avgConfidence})`);
}

main().catch((e) => {
  console.error('UNCAUGHT_EXCEPTION', e?.message || e);
  process.exit(5);
});
