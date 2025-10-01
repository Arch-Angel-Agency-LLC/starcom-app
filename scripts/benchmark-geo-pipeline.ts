import { GeometryFactory, type PolygonFeature } from '../src/geopolitical/geometry/geometryFactory';
import { performance } from 'node:perf_hooks';

// Simple synthetic feature set approximating mixed sizes
const FEATURES: PolygonFeature[] = [
  { id: 'SMALL', rings: [ [ [-1,0],[0,1],[1,0],[0,-1],[-1,0] ] ] },
  { id: 'MED', rings: [ [ [-10,0],[-5,8],[0,10],[5,8],[10,0],[5,-8],[0,-10],[-5,-8],[-10,0] ] ] },
  { id: 'WIDE', rings: [ [ [-179,0],[-120,12],[-60,-12],[0,8],[60,-8],[120,12],[179,-6],[-179,0] ] ] }
];

function buildAll(label: string) {
  const t0 = performance.now();
  GeometryFactory.buildTerritoryPolygons(FEATURES, { radius: 100, thickness: 0 });
  const t1 = performance.now();
  return { label, ms: t1 - t0 };
}

async function run() {
  // Cold (empty cache)
  const cold = buildAll('cold');
  // Warm (cached)
  const warm = buildAll('warm');
  console.log('[geo-benchmark]', cold, warm, 'improvement_ms=', cold.ms - warm.ms);
}

run().catch(e => { console.error(e); process.exit(1); });
