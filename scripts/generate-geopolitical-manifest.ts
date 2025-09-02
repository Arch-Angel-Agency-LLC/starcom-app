#!/usr/bin/env tsx
/**
 * WS4: Generate integrity manifest for geopolitical artifacts.
 * Collects hashes, sizes, and provenance notes for:
 *  - Normalized LOD files
 *  - Topology file
 *  - (Future) EEZ artifacts if present
 * Writes: public/geopolitical/manifest/geopolitical-manifest.json
 */
import { statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import crypto from 'crypto';

interface ArtifactEntry { path:string; bytes:number; sha256:string; sha1:string; class?:string; note?:string }

function hash(path:string){
  const buf = readFileSync(path);
  return {
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    sha1: crypto.createHash('sha1').update(buf).digest('hex'),
    bytes: statSync(path).size
  };
}

const ROOT = resolve('.');
const PUB = resolve(ROOT, 'public','geopolitical');
const NORMALIZED_DIR = resolve(PUB,'normalized');
const TOPO_DIR = resolve(PUB,'topology');
const MANIFEST_DIR = resolve(PUB,'manifest');
mkdirSync(MANIFEST_DIR, { recursive: true });

const artifacts: ArtifactEntry[] = [];
function addIf(path:string, cls:string, note?:string){
  if (existsSync(path)) {
    const h = hash(path);
    artifacts.push({ path: path.replace(ROOT+'/',''), bytes: h.bytes, sha256: h.sha256, sha1: h.sha1, class: cls, note });
  }
}

// Normalized LODs
for (const lod of [0,1,2]) {
  addIf(resolve(NORMALIZED_DIR, `world-borders-lod${lod}.normalized.json`), 'normalized', `LOD${lod}`);
}
// Topology
addIf(resolve(TOPO_DIR,'world-borders.topology.json'), 'topology', 'land borders shared arcs');
// EEZ placeholder (if we ever produced it)
addIf(resolve(PUB,'maritime','eez.topology.json'), 'topology-maritime', 'maritime EEZ topology (optional)');
addIf(resolve('data/eez/raw/eez_raw.geojson'), 'raw-eez', 'raw EEZ source (deferred if absent)');

const manifest = {
  generated: new Date().toISOString(),
  algorithm: ['sha256','sha1'],
  artifacts,
  summary: {
    count: artifacts.length,
    totalBytes: artifacts.reduce((a,b)=>a+b.bytes,0)
  },
  notes: {
    maritimeStatus: existsSync('data/eez/raw/eez_raw.geojson') ? 'present' : 'deferred-fetch-blocked'
  }
};

const outPath = resolve(MANIFEST_DIR,'geopolitical-manifest.json');
writeFileSync(outPath, JSON.stringify(manifest,null,2));
console.log('Manifest written:', outPath, 'artifacts=', artifacts.length);
