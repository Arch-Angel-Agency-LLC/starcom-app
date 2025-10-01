import RBush from 'rbush';

export type SegmentItem = {
  minX: number; // lon min
  minY: number; // lat min
  maxX: number; // lon max
  maxY: number; // lat max
  id: string;   // feature id
  a: [number, number]; // [lon, lat]
  b: [number, number]; // [lon, lat]
};

export type BorderIndex = RBush<SegmentItem>;

function normalizeLon(lon: number) {
  // normalize to [-180,180]
  return ((lon + 540) % 360) - 180;
}

// If a segment crosses the antimeridian, adjust longitudes to minimize bbox
function normalizeSegment(a: [number, number], b: [number, number]): [[number, number], [number, number]] {
  let lon1 = a[0];
  const lat1 = a[1];
  const lon2i = b[0];
  const lat2 = b[1];
  let lon2 = lon2i;
  lon1 = normalizeLon(lon1); lon2 = normalizeLon(lon2);
  if (Math.abs(lon1 - lon2) > 180) {
    if (lon1 < 0) lon1 += 360; else lon2 += 360;
  }
  return [[lon1, lat1], [lon2, lat2]];
}

export function buildBorderIndex(features: Array<{ id: string; coordinates: [number, number][] }>): BorderIndex {
  const tree = new RBush<SegmentItem>();
  const items: SegmentItem[] = [];
  for (const f of features) {
    for (let i = 1; i < f.coordinates.length; i++) {
      const a = f.coordinates[i - 1];
      const b = f.coordinates[i];
      const [[lon1, lat1], [lon2, lat2]] = normalizeSegment(a, b);
      const minX = Math.min(lon1, lon2);
      const maxX = Math.max(lon1, lon2);
      const minY = Math.min(lat1, lat2);
      const maxY = Math.max(lat1, lat2);
      items.push({ id: f.id, a: [lon1, lat1], b: [lon2, lat2], minX, minY, maxX, maxY });
    }
  }
  tree.load(items);
  return tree;
}

// Approximate distance on degrees space with lon scaled by cos(lat)
function approxDegDistance(lon1: number, lat1: number, lon2: number, lat2: number) {
  const rad = Math.PI / 180;
  const mlat = ((lat1 + lat2) / 2) * rad;
  const dx = (lon1 - lon2) * Math.cos(mlat);
  const dy = (lat1 - lat2);
  return Math.sqrt(dx*dx + dy*dy);
}

// Return nearest feature id around a lon/lat within a searchRadius (deg)
export function queryNearestSegmentId(index: BorderIndex, lon: number, lat: number, searchRadiusDeg = 1): string | null {
  // Consider lon wrap by querying lon, lon±360
  const candidates: SegmentItem[] = [];
  const longs = [lon, lon - 360, lon + 360];
  for (const lx of longs) {
    const results = index.search({ minX: lx - searchRadiusDeg, minY: lat - searchRadiusDeg, maxX: lx + searchRadiusDeg, maxY: lat + searchRadiusDeg });
    if (results.length) candidates.push(...results);
  }
  if (!candidates.length) return null;
  let best: { id: string; d: number } | null = null;
  for (const c of candidates) {
    // compute distance to segment endpoints (cheap proxy)
    const d = Math.min(
      approxDegDistance(lon, lat, c.a[0], c.a[1]),
      approxDegDistance(lon, lat, c.b[0], c.b[1])
    );
    if (!best || d < best.d) best = { id: c.id, d };
  }
  return best ? best.id : null;
}
