#!/usr/bin/env tsx
/**
 * WS2: Build TopoJSON-like shared topology for world borders across LODs.
 * - Loads normalized artifacts (if present) else raw per LOD.
 * - Extracts unique arcs (coordinate sequences) with quantization.
 * - Writes: public/geopolitical/topology/world-borders.topology.json
 *   Structure:
 *   {
 *     quantization: number,
 *     arcs: number[][][]  // array of arcs -> array of points [x,y] in quantized space
 *     lods: { lod0: { features:[{id, arcIndices:number[], classification}] }, ... }
 *     meta: { arcCount, featureCounts:{lod0: n,...}, generated, hashes:{lodX: sha256} }
 *   }
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PUB = resolve(ROOT, 'public', 'geopolitical');
const NORMALIZED_DIR = resolve(PUB, 'normalized');
const OUT_DIR = resolve(PUB, 'topology');
mkdirSync(OUT_DIR, { recursive: true });

interface NormalizedFeature { id:string; classification?:string; coordinates:[number,number][] }
interface NormalizedFile { features: NormalizedFeature[] }

const LODS = [0,1,2];
const quantization = 1e5; // 1e5 ~ precision of 1e-5 degrees (~1m at equator) adjustable later

function sha256(data:string){ return crypto.createHash('sha256').update(data).digest('hex'); }

function loadNormalized(lod:number): NormalizedFeature[] {
  const p = resolve(NORMALIZED_DIR, `world-borders-lod${lod}.normalized.json`);
  const json:NormalizedFile = JSON.parse(readFileSync(p,'utf-8'));
  return json.features;
}

// Deduplicate arcs by hashing coordinate string; store quantized delta encoding
interface ArcMapEntry { index:number; points:[number,number][] }
const arcMap = new Map<string, ArcMapEntry>();
const arcs: [number,number][][] = [];
const originalArcs: [number,number][][] = []; // preserve originals for quantization error analysis (not emitted)
const arcHashes: string[] = [];
const arcIds: string[] = [];

function quantizeCoord([lon,lat]:[number,number]):[number,number]{
  return [Math.round((lon+180)*quantization/360), Math.round((lat+90)*quantization/180)];
}

function sha1(data:string){ return crypto.createHash('sha1').update(data).digest('hex'); }

function addArc(points:[number,number][]):number {
  // Serialize exact points; for reversal check also reversed key (to reuse arc in opposite direction)
  const keyF = points.map(p=>p.join(',')).join(';');
  const keyR = points.slice().reverse().map(p=>p.join(',')).join(';');
  if (arcMap.has(keyF)) return arcMap.get(keyF)!.index;
  if (arcMap.has(keyR)) return arcMap.get(keyR)!.index; // reuse reversed
  const idx = arcs.length;
  arcMap.set(keyF, { index: idx, points });
  const quantized = points.map(quantizeCoord);
  arcs.push(quantized);
  originalArcs.push(points); // store original
  const hashSource = quantized.map(p=>p.join(',')).join(';');
  const h = sha1(hashSource);
  arcHashes.push(h);
  arcIds.push('a_'+h.substring(0,8));
  return idx;
}

interface TopologyFeature { id:string; arcIndices:number[]; classification?:string }
const lodFeatures: Record<string, TopologyFeature[]> = {};
const hashes: Record<string,string> = {};

for (const lod of LODS) {
  const features = loadNormalized(lod);
  const topoFeats:TopologyFeature[] = [];
  features.forEach(f => {
    if (!Array.isArray(f.coordinates) || f.coordinates.length < 2) return;
    const arcIdx = addArc(f.coordinates as [number,number][]);
    topoFeats.push({ id: f.id, arcIndices:[arcIdx], classification: f.classification });
  });
  lodFeatures[`lod${lod}`] = topoFeats;
  hashes[`lod${lod}`] = sha256(JSON.stringify(topoFeats));
}

// After building arcs and lodFeatures, compute quantization error metrics
function haversine(lon1:number, lat1:number, lon2:number, lat2:number){
  const R = 6371000; // meters
  const toRad = (d:number)=> d * Math.PI/180;
  const φ1 = toRad(lat1); const φ2 = toRad(lat2); const Δφ = toRad(lat2-lat1); const Δλ = toRad(lon2-lon1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
function dequantize([qx,qy]:[number,number]):[number,number]{
  const lon = qx * 360/quantization - 180;
  const lat = qy * 180/quantization - 90;
  return [lon,lat];
}
let segCount = 0;
let totalOrigLen = 0;
let totalQuantLen = 0;
let totalAbsErr = 0;
let maxRelErr = 0;
for (let i=0;i<arcs.length;i++) {
  const orig = originalArcs[i];
  const quant = arcs[i].map(dequantize);
  for (let j=1;j<orig.length;j++) {
    const [lon1,lat1] = orig[j-1];
    const [lon2,lat2] = orig[j];
    const oLen = haversine(lon1,lat1,lon2,lat2);
    const [qlon1,qlat1] = quant[j-1];
    const [qlon2,qlat2] = quant[j];
    const qLen = haversine(qlon1,qlat1,qlon2,qlat2);
    const absErr = Math.abs(oLen - qLen);
    const relErr = oLen === 0 ? 0 : absErr / oLen;
    segCount++;
    totalOrigLen += oLen;
    totalQuantLen += qLen;
    totalAbsErr += absErr;
    if (relErr > maxRelErr) maxRelErr = relErr;
  }
}
const meanRelErr = totalOrigLen === 0 ? 0 : totalAbsErr / totalOrigLen;

const topology = {
  quantization,
  arcs,
  arcHashes,
  arcIds,
  lods: lodFeatures,
  meta: {
    arcCount: arcs.length,
    featureCounts: Object.fromEntries(LODS.map(l=>[`lod${l}`, lodFeatures[`lod${l}`].length])),
    generated: new Date().toISOString(),
    hashes,
    hashAlgorithm: 'sha1',
    quantizationError: {
      segments: segCount,
      meanAbsoluteErrorMeters: Number(totalAbsErr.toFixed(3)),
      meanRelativeErrorPct: Number((meanRelErr*100).toFixed(4)),
      maxRelativeErrorPct: Number((maxRelErr*100).toFixed(4))
    }
  }
};

const outPath = resolve(OUT_DIR, 'world-borders.topology.json');
writeFileSync(outPath, JSON.stringify(topology, null, 2));
console.log(`Topology built: ${outPath} arcs=${arcs.length}`);
