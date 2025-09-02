#!/usr/bin/env tsx
/**
 * WS3 Maritime EEZ Ingestion Scaffold
 * Goal: Prepare maritime Exclusive Economic Zones dataset for integration.
 *
 * Expected future steps:
 * 1. Fetch/source raw EEZ polygons (e.g., from marineregions.org) -> store under data/eez/raw/
 * 2. Normalize properties: ISO_A2 / territory name / sovereignty notes.
 * 3. Detect overlaps (intersections between EEZ polygons) to tag MaritimeOverlap.
 * 4. Simplify geometry per LOD (use mapshaper or turf simplify) producing eez-lod0/1/2.
 * 5. Convert to shared topology (reuse existing build pattern) -> public/geopolitical/maritime/eez.topology.json
 * 6. Update classification enum usage (MaritimeEEZ / MaritimeOverlap) and runtime toggle.
 *
 * Current scaffold: loads placeholder raw file if present and prints basic stats.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const RAW_DIR = resolve('data/eez/raw');
const OUT_DIR = resolve('public/geopolitical/maritime');
mkdirSync(OUT_DIR, { recursive: true });

const rawFile = resolve(RAW_DIR, 'eez_raw.geojson');
if (!existsSync(rawFile)) {
  console.log('EEZ raw file missing at', rawFile);
  console.log('Add source GeoJSON then re-run: npm run geo:eez');
  process.exit(0);
}

interface GeoJSONFeature { type:string; properties:any; geometry:any }
interface FeatureCollection { type:string; features: GeoJSONFeature[] }

const fc: FeatureCollection = JSON.parse(readFileSync(rawFile,'utf-8'));
const total = fc.features.length;

// Basic property normalization preview
const sample = fc.features.slice(0,5).map(f=>({ name: f.properties?.NAME || f.properties?.Territory || 'UNKNOWN', iso: f.properties?.ISO_A2 || f.properties?.ISO2 || '??' }));

const report = { total, sample };
writeFileSync(resolve(OUT_DIR,'eez_ingest_report.json'), JSON.stringify(report,null,2));
console.log('EEZ ingest scaffold report written with', total, 'features');
