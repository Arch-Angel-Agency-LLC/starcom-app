#!/usr/bin/env tsx
/**
 * WS2 Size Benchmark
 * Compares cumulative size (raw + gzip) of per-LOD border GeoJSON vs single topology artifact.
 */
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { gzipSync } from 'zlib';

const ROOT = resolve(process.cwd());
const PUB = resolve(ROOT, 'public', 'geopolitical');

const LODS = [0,1,2];

interface SizeRow { label:string; bytes:number; gzip:number }

function fileSizes(path:string): SizeRow {
  const buf = readFileSync(path);
  const gzip = gzipSync(buf, { level: 9 });
  return { label: path, bytes: buf.length, gzip: gzip.length };
}

function fmt(n:number){
  if (n < 1024) return `${n} B`;
  if (n < 1024*1024) return `${(n/1024).toFixed(2)} KB`;
  return `${(n/1024/1024).toFixed(2)} MB`;
}

const rawRows: SizeRow[] = [];
const normRows: SizeRow[] = [];

for (const lod of LODS) {
  rawRows.push(fileSizes(resolve(PUB, `world-borders-lod${lod}.geojson`)));
  const normPath = resolve(PUB, 'normalized', `world-borders-lod${lod}.normalized.json`);
  try {
    normRows.push(fileSizes(normPath));
  } catch { /* ignore missing */ }
}

const topologyPath = resolve(PUB, 'topology', 'world-borders.topology.json');
let topology: SizeRow | null = null;
try { topology = fileSizes(topologyPath); } catch {}

function aggregate(rows: SizeRow[]) {
  return rows.reduce((a,r)=>{ a.bytes+=r.bytes; a.gzip+=r.gzip; return a; }, { bytes:0, gzip:0 });
}

const aggRaw = aggregate(rawRows);
const aggNorm = aggregate(normRows);

const report = {
  raw: { files: rawRows.map(r=>({ path: r.label.split('/public/')[1], bytes: r.bytes, gzip: r.gzip })), aggregate: aggRaw },
  normalized: { files: normRows.map(r=>({ path: r.label.split('/public/')[1], bytes: r.bytes, gzip: r.gzip })), aggregate: aggNorm },
  topology: topology ? { path: topology.label.split('/public/')[1], bytes: topology.bytes, gzip: topology.gzip } : null,
  reductionVsRaw: topology ? {
    bytes: ((1 - topology.bytes / aggRaw.bytes) * 100).toFixed(2) + '%',
    gzip: ((1 - topology.gzip / aggRaw.gzip) * 100).toFixed(2) + '%'
  } : null,
  reductionVsNormalized: topology ? {
    bytes: ((1 - topology.bytes / aggNorm.bytes) * 100).toFixed(2) + '%',
    gzip: ((1 - topology.gzip / aggNorm.gzip) * 100).toFixed(2) + '%'
  } : null
};

console.log('WS2 Size Benchmark Report');
console.log(JSON.stringify(report, null, 2));

// Human readable summary
if (topology) {
  console.log('\nSummary:');
  console.log(`Raw total: ${fmt(aggRaw.bytes)} (gzip ${fmt(aggRaw.gzip)})`);
  console.log(`Topology: ${fmt(topology.bytes)} (gzip ${fmt(topology.gzip)})`);
  console.log(`Reduction vs raw: bytes ${report.reductionVsRaw?.bytes}, gzip ${report.reductionVsRaw?.gzip}`);
}
