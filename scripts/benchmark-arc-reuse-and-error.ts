#!/usr/bin/env tsx
/**
 * WS2 Arc Reuse & Quantization Error Benchmark
 * - Computes arc reuse ratio (unique arcs vs total arc references across all features & LODs)
 * - Samples arcs to estimate length distortion introduced by quantization.
 *
 * Assumptions: topology file contains quantized integer coordinates only; original float coordinates not retained.
 * Strategy for error estimation: reconstruct approximate original floats by inverse quantization to [0,1] then scale to lon/lat range.
 * NOTE: Without original pre-quantization coordinates, true error cannot be computed; this script scaffolds logic and records placeholders.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface TopologyFeature { id:number; arcIndices:number[]; classification:string }
interface TopologyData { quantization:number; arcs:number[][][]; lods: Record<string, TopologyFeature[]> }

const topoPath = resolve('public/geopolitical/topology/world-borders.topology.json');
const topo: TopologyData & { meta?: any } = JSON.parse(readFileSync(topoPath,'utf-8'));

// Arc reuse ratio
const uniqueArcCount = topo.arcs.length;
let totalArcRefs = 0;
for (const lodKey of Object.keys(topo.lods)) {
  for (const feat of topo.lods[lodKey]) totalArcRefs += feat.arcIndices.length;
}
const reuseRatio = uniqueArcCount / totalArcRefs; // >1 means each feature references <=1 arc; adjust interpretation below

// Better metric: average references per arc
const avgRefsPerArc = totalArcRefs / uniqueArcCount;

// Quantization error placeholder (need original coordinates). We'll compute internal consistency metric: average segment length in quantized space.
let segmentCount = 0;
let cumulativeLen = 0;
for (const arc of topo.arcs) {
  for (let i=1;i<arc.length;i++) {
    const dx = arc[i][0]-arc[i-1][0];
    const dy = arc[i][1]-arc[i-1][1];
    cumulativeLen += Math.hypot(dx,dy);
    segmentCount++;
  }
}
const avgQuantizedSegmentLen = cumulativeLen / segmentCount;

const report = {
  arcReuse: {
    uniqueArcCount,
    totalArcReferences: totalArcRefs,
    avgReferencesPerArc: avgRefsPerArc,
    reuseRatioInterpretation: 'Higher avgReferencesPerArc indicates more sharing. Aim >1.35',
  },
  quantization: {
    q: topo.quantization,
    avgQuantizedSegmentLen,
    note: 'True geographic distortion not computed (need original floats).'
  }
};

const outPath = resolve('public/geopolitical/topology/benchmark_arc_reuse.json');
writeFileSync(outPath, JSON.stringify(report,null,2));
console.log('Arc reuse benchmark written to', outPath);
console.log(JSON.stringify(report,null,2));
