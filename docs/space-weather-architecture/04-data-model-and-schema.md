# 04 - Data Model & Schema

## Canonical Units
- Electric field canonical: millivolts per kilometer (mV/km).
- Internal magnitude: sqrt(Ex^2 + Ey^2) in mV/km.
- Direction: atan2(Ey, Ex) degrees (−180..180).

## Types (Conceptual)
```ts
interface NormalizedVector {
  id: string;              // stable hash
  sourceId: string;        // e.g. "noaa"
  datasetId: string;       // e.g. "intermag", "us_canada"
  timestamp: string;       // ISO
  lat: number;
  lon: number;
  ex_mVkm: number;
  ey_mVkm: number;
  magnitude_mVkm: number;
  direction_deg: number;
  quality: number;         // 0-5 normalized
  stationDistance_km?: number;
  raw?: Record<string, unknown>; // preserved provider-specific
}

interface SnapshotStats {
  total: number;
  meanMagnitude: number;
  p50: number; p75: number; p90: number; p95: number; p99: number;
  maxMagnitude: number;
  coverage: { minLat: number; maxLat: number; minLon: number; maxLon: number };
}

interface QualityScores {
  overall: number; completeness: number; timeliness: number; spatialUniformity: number; varianceHealth: number;
  issues: string[]; recommendations: string[];
}

interface AlertEvent {
  id: string;
  type: string;          // e.g. electric_field_spike
  severity: 'low'|'moderate'|'high'|'extreme';
  message: string;
  timestamp: string;
  datasetIds: string[];
  regionHint?: string;
  vectors?: string[];    // vector ids involved
  metrics: Record<string, number>;
}

interface EnrichedSnapshot {
  snapshotId: string;
  sourceId: string;
  datasetId: string;
  timestamp: string;
  vectors: NormalizedVector[]; // may be truncated by policy but pre-policy counts tracked
  stats: SnapshotStats;
  quality?: QualityScores;
  alerts?: AlertEvent[];
  provenance: { adapterVersion: string; hash: string; rawCount: number; normalizedCount: number; createdAt: string; stale?: boolean };
}
```

## Spatial Aggregation
```
H3CellAggregate {
  h3Index: string;
  centroidLat: number;
  centroidLon: number;
  count: number;
  maxMagnitude: number;
  meanMagnitude: number;
  representativeVectorId: string; // chosen for rendering (e.g. highest magnitude)
  qualityMean: number;
}
```

## Render Set Structure
```ts
interface RenderSet {
  version: number;
  lod: number; // 0 = highest detail
  timestamp: string;
  sourceCompositeKey: string; // e.g. "electric_field.global"
  counts: { raw: number; normalized: number; afterAggregation: number; rendered: number };
  arrays: {
    positions: Float32Array; // [x,y,z,...]
    directions: Float32Array; // degrees or unit vectors
    magnitudes: Float32Array; // mV/km
    colors: Uint8Array;       // RGBA per point
    sizes: Float32Array;      // glyph scaling
  };
  meta: { unit: 'mV/km'; percentileBreaks: number[]; }
}
```

## ID Strategy
```
id = sha1(datasetId + '|' + rounded(lat,4) + '|' + rounded(lon,4) + '|' + floor(timestamp/60000))
```
Minute bin ensures stable IDs within same capture window while allowing temporal roll-forward.

## Validation Rules
- Latitude: −90..90, Longitude: −180..180.
- Magnitude sanity: 0 <= magnitude_mVkm < 100000 (guard against corrupted values).
- Quality default: if missing, assign mid (3) not 1.
- Reject snapshot if < 10 usable vectors after normalization (mark dataset stale).

## Provenance Fields
- hash: SHA256(JSON canonical) for reproducibility.
- adapterVersion: semantic version string.
- stale flag: set when serving cached > acceptable freshness threshold.

## Backward Compatibility
Legacy hooks can adapt by mapping their processed objects into NormalizedVector arrays; initial implementation will produce both legacy and canonical forms until switchover completes.
