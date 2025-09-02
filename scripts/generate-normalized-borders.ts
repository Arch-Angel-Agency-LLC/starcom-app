#!/usr/bin/env tsx
/**
 * WS1: Generate normalized borders report (features + stats) for each LOD.
 * Reads existing world-borders(-lodX).geojson files, applies normalization, and writes:
 *   /public/geopolitical/normalized/world-borders-lodX.normalized.json
 * Also writes aggregate stats summary.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import crypto from 'crypto';
import { generateReport } from '../src/geopolitical/normalization/normalization';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PUB = resolve(ROOT, 'public', 'geopolitical');
const OUT_DIR = resolve(PUB, 'normalized');
mkdirSync(OUT_DIR, { recursive: true });

interface GeoJSON { features: any[] }

function loadGeo(path: string): GeoJSON {
  return JSON.parse(readFileSync(path, 'utf-8')) as GeoJSON;
}

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

const LODS = [0,1,2];
const statsSummary: any = { lods: {} };

for (const lod of LODS) {
  const file = resolve(PUB, `world-borders-lod${lod}.geojson`);
  const raw = loadGeo(file);
  const report = generateReport(raw.features || []);
  const outPath = resolve(OUT_DIR, `world-borders-lod${lod}.normalized.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  statsSummary.lods[`lod${lod}`] = {
    countsPerClass: report.stats.countsPerClass,
    unknownPct: report.stats.unknownPct,
    total: report.stats.total,
    hash: sha256(JSON.stringify(report.features))
  };
  console.log(`LOD${lod}: normalized ${report.stats.total} features -> ${outPath}`);
}

const summaryPath = resolve(OUT_DIR, 'summary.json');
writeFileSync(summaryPath, JSON.stringify(statsSummary, null, 2));
console.log(`Wrote normalization summary: ${summaryPath}`);
