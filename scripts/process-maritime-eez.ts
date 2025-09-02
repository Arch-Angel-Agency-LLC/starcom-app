#!/usr/bin/env tsx
/**
 * WS3: Process Maritime EEZ Data
 * Steps implemented here:
 *  - Load raw EEZ (data/eez/raw/eez_raw.geojson)
 *  - Normalize key properties
 *  - Simplify geometries for LOD0/1/2 (progressive tolerance)
 *  - Detect polygon overlaps (bounding-box prefilter + turf.intersect) to mark MaritimeOverlap classification
 *  - Emit per LOD normalized files under public/geopolitical/maritime/normalized
 *  - (Future) Build shared topology similar to borders
 */
// @ts-ignore - turf types resolution workaround
import * as turf from '@turf/turf';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

interface FeatureCollection { type:'FeatureCollection'; features:any[] }

const RAW = resolve('data/eez/raw/eez_raw.geojson');
if (!existsSync(RAW)) { console.error('Missing raw EEZ file at', RAW); process.exit(1); }
const OUT_BASE = resolve('public/geopolitical/maritime');
const OUT_NORM = resolve(OUT_BASE, 'normalized');
mkdirSync(OUT_BASE, { recursive: true });
mkdirSync(OUT_NORM, { recursive: true });

const raw: FeatureCollection = JSON.parse(readFileSync(RAW,'utf-8'));

function normProps(f:any){
  const p = f.properties || {};
  return {
    name: p.NAME || p.Territory || p.TERRITORY1 || 'UNKNOWN',
    iso2: p.ISO_A2 || p.ISO2 || p.ISO_2DIGIT || '??',
    sovereignty: p.SOVEREIGN1 || p.SOVEREIGN || p.SOVEREIGNT || p.SOVEREIGN1 || p.SOVEREIGN2 || null
  };
}

// Build simplified LOD versions
const LOD_CONFIG = [
  { lod:0, tol:0.02 },
  { lod:1, tol:0.05 },
  { lod:2, tol:0.1 }
];

// Precompute bbox list for overlap detection
const features = raw.features.map((f,i)=>{
  const bbox = turf.bbox(f);
  return { idx:i, f, bbox, props: normProps(f) };
});

// Simple overlap detection (n^2 with bbox short-circuit). For moderate dataset size acceptable; optimize later.
const overlaps: Set<number> = new Set();
for (let i=0;i<features.length;i++) {
  const a = features[i];
  for (let j=i+1;j<features.length;j++) {
    const b = features[j];
    // bbox prefilter
    if (a.bbox[0] > b.bbox[2] || b.bbox[0] > a.bbox[2] || a.bbox[1] > b.bbox[3] || b.bbox[1] > a.bbox[3]) continue;
    try {
      const inter = turf.intersect(a.f, b.f);
      if (inter) { overlaps.add(a.idx); overlaps.add(b.idx); }
    } catch {/* geometry robustness issues ignored */}
  }
}

for (const cfg of LOD_CONFIG) {
  const outFeats:any[] = [];
  for (const item of features) {
    let geom = item.f.geometry;
    try {
      geom = turf.simplify(item.f, { tolerance: cfg.tol, highQuality: false }).geometry;
    } catch {/* fallback to original */}
    outFeats.push({
      type:'Feature',
      properties: {
        id: `eez_${item.idx}`,
        classification: overlaps.has(item.idx) ? 'MaritimeOverlap' : 'MaritimeEEZ',
        ...item.props
      },
      geometry: geom
    });
  }
  const fc: FeatureCollection = { type:'FeatureCollection', features: outFeats };
  writeFileSync(resolve(OUT_NORM, `eez-lod${cfg.lod}.normalized.geojson`), JSON.stringify(fc));
}

// Summary report
const summary = {
  total: features.length,
  overlaps: overlaps.size,
  overlapPct: features.length ? (overlaps.size / features.length * 100).toFixed(2)+'%' : '0%',
  lods: LOD_CONFIG.map(c=>({ lod:c.lod, tolerance:c.tol }))
};
writeFileSync(resolve(OUT_BASE, 'eez_summary.json'), JSON.stringify(summary,null,2));
console.log('EEZ processing complete:', summary);
