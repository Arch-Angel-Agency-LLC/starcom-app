#!/usr/bin/env tsx
// Type shims for Node when @types/node not picked up
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Buffer: any;
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const dataDir = join(root, 'public', 'geopolitical');
const manifestPath = join(dataDir, 'manifest.json');

interface ManifestDataset { id: string; file: string; sha256: string; [k:string]: any }
interface Manifest { datasets: ManifestDataset[] }

function sha256(buf: any) { return createHash('sha256').update(buf).digest('hex'); }

const manifest: Manifest = JSON.parse(readFileSync(manifestPath,'utf-8'));
let changed = false;
for (const d of manifest.datasets) {
  try {
    const fileBuf = readFileSync(join(dataDir, d.file));
    const hash = sha256(fileBuf);
    if (d.sha256 !== hash) { d.sha256 = hash; changed = true; }
  } catch (e) {
    console.warn(`Skipping hash for missing file: ${d.file}`);
  }
}
if (changed) {
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Manifest updated with hashes.');
} else {
  console.log('Manifest hashes already current.');
}
