#!/usr/bin/env tsx
/**
 * Fetch official EEZ dataset (Marineregions) and convert to GeoJSON.
 * Requirements: mapshaper in devDependencies.
 * Output: data/eez/raw/eez_raw.geojson
 * License: CC-BY. Include attribution in manifest later.
 */
import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

// Upstream sometimes changes path or version; try several candidates.
const VERSION_CANDIDATES = ['v11', 'v12']; // extend as needed
const FILE_PREFIX = 'World_EEZ_';
// Path / pattern candidates. Some distributions use downloads.php?file=...
function buildCandidateUrls(): string[] {
  const hosts = [
    'https://www.marineregions.org',
    'https://marineregions.org'
  ];
  const patterns = [
    (file: string) => `/downloads/eez/${file}`,
    (file: string) => `/downloads.php?file=${file}`
  ];
  const urls: string[] = [];
  for (const ver of VERSION_CANDIDATES) {
    const file = `${FILE_PREFIX}${ver}.zip`;
    for (const host of hosts) {
      for (const pat of patterns) {
        urls.push(host + pat(file));
      }
    }
  }
  return urls;
}
const CANDIDATE_URLS = buildCandidateUrls();

const DATA_DIR = resolve('data/eez');
const TMP_DIR = resolve(DATA_DIR, 'tmp');
const RAW_DIR = resolve(DATA_DIR, 'raw');
mkdirSync(TMP_DIR, { recursive: true });
mkdirSync(RAW_DIR, { recursive: true });

// We'll discover the actual file name once one URL succeeds.
let discoveredFileName: string | null = null;
const zipPath = resolve(TMP_DIR, 'eez_download.zip');

async function main() {
  if (!existsSync(zipPath)) {
    let success = false;
    for (const url of CANDIDATE_URLS) {
      console.log('Attempting download:', url);
      try {
        execSync(`curl -L --fail --silent --show-error -o ${zipPath} "${url}"`, { stdio: 'inherit' });
        const size = statSync(zipPath).size;
        if (size < 2048) {
          throw new Error('Downloaded file suspiciously small, likely error page');
        }
        // Basic HTML detection
        const headBuf = readFileSync(zipPath, { encoding: 'utf8' });
        if (/<!DOCTYPE html>/i.test(headBuf) || /<html/i.test(headBuf.substring(0, 500))) {
          throw new Error('Downloaded content is HTML, not a ZIP');
        }
        discoveredFileName = url.split('/').pop()!.split('?file=').pop()!;
        console.log('Download succeeded with', discoveredFileName);
        success = true;
        break;
      } catch (e) {
        console.warn('Download failed for', url, '-', (e as Error).message);
        if (existsSync(zipPath)) {
          try { unlinkSync(zipPath); } catch {}
        }
      }
    }
    if (!success) {
      console.warn('All ZIP download attempts failed. Trying WFS (direct GeoJSON) fallback...');
      // Field names are lowercase in WFS schema; restrict to essentials to reduce size.
      const wfsBase = 'https://geo.vliz.be/geoserver/MarineRegions/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=MarineRegions:eez&outputFormat=application/json';
      const wfsFields = 'propertyName=mrgid,territory1,sovereign1,iso_sov1,geoname,iso_ter1';
      const wfsUrl = process.env.MARITIME_EEZ_WFS_URL || `${wfsBase}&${wfsFields}`;
      try {
        const outGeo = resolve(RAW_DIR, 'eez_raw.geojson');
        console.log('Fetching WFS GeoJSON from', wfsUrl);
        execSync(`curl -L --fail --silent --show-error -o ${outGeo} "${wfsUrl}"`, { stdio: 'inherit' });
        let size = statSync(outGeo).size;
        let textSample = readFileSync(outGeo, 'utf8').slice(0, 400);
        if (textSample.startsWith('<?xml')) {
          console.warn('WFS responded with XML error for restricted fields; retrying full field set...');
          const fullUrl = process.env.MARITIME_EEZ_WFS_URL || wfsBase; // no propertyName filter
          execSync(`curl -L --fail --silent --show-error -o ${outGeo} "${fullUrl}"`, { stdio: 'inherit' });
          size = statSync(outGeo).size;
          textSample = readFileSync(outGeo, 'utf8').slice(0, 400);
        }
        if (size < 100000 || /<!DOCTYPE html>|<html/i.test(textSample)) {
          console.warn('Simple WFS fetch insufficient (size or HTML). Attempting paginated WFS 2.0 retrieval...');
          await fetchViaPagedWFS();
          return;
        }
        if (size > 0 && textSample.trim().startsWith('{')) {
          console.log('WFS EEZ GeoJSON written to', outGeo);
          discoveredFileName = 'WFS:MarineRegions:eez';
          const attribution = {
            source: 'Flanders Marine Institute (VLIZ)',
            dataset: discoveredFileName,
            attemptedUrls: CANDIDATE_URLS,
            wfsUrl,
            license: 'CC-BY',
            retrieved: new Date().toISOString(),
            method: 'WFS fallback simple'
          };
          writeFileSync(resolve(RAW_DIR, 'attribution.json'), JSON.stringify(attribution, null, 2));
          console.log('Attribution recorded');
          return;
        }
        console.log('Unexpected WFS content, attempting paginated retrieval.');
        await fetchViaPagedWFS();
        return; // exit after paged fetch
      } catch (wfsErr) {
        console.error('WFS fallback failed:', (wfsErr as Error).message);
        console.error('Please verify connectivity or update fetch script with current distribution links.');
        process.exit(1);
      }
    }
  } else {
    console.log('Zip already present, skipping download (delete to re-fetch)');
  }
  console.log('Unzipping...');
  execSync(`unzip -o ${zipPath} -d ${TMP_DIR}`, { stdio: 'inherit' });
  // Find shapefile (name can vary). We'll look for *.shp starting with 'World_EEZ'
  const shp = execSync(`ls ${TMP_DIR}/*.shp | head -n 1`).toString().trim();
  if (!shp) {
    console.error('No shapefile found in zip extraction');
    process.exit(1);
  }
  const outGeo = resolve(RAW_DIR, 'eez_raw.geojson');
  console.log('Converting shapefile to GeoJSON via mapshaper:', shp);
  // Keep essential fields and avoid simplification here (processing script will do multi-LOD)
  execSync(`npx mapshaper -i ${shp} encoding=utf8 -filter-fields MRGID,TERRITORY1,SOVEREIGN1,ISO_SOV1,GEONAME,ISO_TER1 -o format=geojson ${outGeo}`, { stdio: 'inherit' });
  console.log('EEZ GeoJSON written to', outGeo);
  // Basic attribution stub
  const attribution = {
    source: 'Flanders Marine Institute (VLIZ)',
    dataset: discoveredFileName,
    attemptedUrls: CANDIDATE_URLS,
    license: 'CC-BY',
    retrieved: new Date().toISOString()
  };
  writeFileSync(resolve(RAW_DIR, 'attribution.json'), JSON.stringify(attribution, null, 2));
  console.log('Attribution recorded');
}

// Attempt paginated WFS 2.0.0 retrieval using startIndex & count.
async function fetchViaPagedWFS() {
  const layer = 'MarineRegions:eez';
  const base = 'https://geo.vliz.be/geoserver/MarineRegions/wfs';
  const pageSize = 2000;
  let startIndex = 0;
  let total = 0;
  const allFeatures: any[] = [];
  console.log('Starting paged WFS retrieval (2.0.0)...');
  while (true) {
    const url = `${base}?service=WFS&version=2.0.0&request=GetFeature&typeNames=${encodeURIComponent(layer)}&outputFormat=application/json&count=${pageSize}&startIndex=${startIndex}`;
    console.log('Request page at startIndex', startIndex);
    const tmpPath = resolve(TMP_DIR, `wfs_page_${startIndex}.json`);
    execSync(`curl -L --fail --silent --show-error -o ${tmpPath} "${url}"`, { stdio: 'inherit' });
    const raw = readFileSync(tmpPath, 'utf8');
    if (raw.startsWith('<?xml')) {
      throw new Error('Received XML during paged retrieval (server may not support JSON for this request).');
    }
    let json: any;
    try { json = JSON.parse(raw); } catch (e) { throw new Error('Invalid JSON in paged response'); }
    if (!json.features || !Array.isArray(json.features)) {
      throw new Error('No features array in paged response');
    }
    const count = json.features.length;
    if (count === 0) {
      console.log('No more features; ending pagination.');
      break;
    }
    allFeatures.push(...json.features);
    total += count;
    console.log(`Received ${count} features (cumulative ${total}).`);
    if (count < pageSize) {
      console.log('Last partial page received; pagination complete.');
      break;
    }
    startIndex += pageSize;
    if (startIndex > 50000) { // safety cap
      console.warn('Pagination exceeded safety cap (50k). Stopping.');
      break;
    }
  }
  if (allFeatures.length === 0) {
    throw new Error('Paged WFS retrieval returned zero features.');
  }
  // Field filtering
  const keep = new Set(['mrgid','territory1','sovereign1','iso_sov1','geoname','iso_ter1']);
  for (const f of allFeatures) {
    if (f.properties) {
      for (const k of Object.keys(f.properties)) {
        if (!keep.has(k)) delete f.properties[k];
      }
    }
  }
  const collection = { type: 'FeatureCollection', features: allFeatures };
  const outGeo = resolve(RAW_DIR, 'eez_raw.geojson');
  writeFileSync(outGeo, JSON.stringify(collection));
  console.log('Paged WFS EEZ GeoJSON written to', outGeo, 'features:', allFeatures.length);
  const attribution = {
    source: 'Flanders Marine Institute (VLIZ)',
    dataset: 'WFS:MarineRegions:eez',
    attemptedUrls: CANDIDATE_URLS,
    method: 'WFS paged 2.0.0',
    pageSize,
    totalFeatures: allFeatures.length,
    license: 'CC-BY',
    retrieved: new Date().toISOString()
  };
  writeFileSync(resolve(RAW_DIR, 'attribution.json'), JSON.stringify(attribution, null, 2));
  console.log('Attribution recorded (paged)');
}

main().catch(e=>{ console.error(e); process.exit(1); });
