# 03 - Target Architecture

```
+-----------------------------+
|   Source Registry           |
|  (declares adapters)        |
+-------------+---------------+
              |
      +-------v--------+              +------------------+
      | SourceAdapter  |  ... (N) --> | Health Monitor    |
      +-------+--------+              +------------------+
              | raw payloads
      +-------v-------------------+
      | Normalization Pipeline    | (unit coercion, schema)
      +-------+-------------------+
              | domain vectors
      +-------v-------------------+
      | Enrichment Layer          | (quality, correlation, anomalies)
      +-------+-------------------+
              | enriched snapshots
      +-------v-------------------+
      | Temporal Buffer           | (ring, diff, stats)
      +-------+-------------------+
              | LOD queries
      +-------v-------------------+         +-------------------+
      | Spatial Index / Binner    |<------->| LOD Strategy       |
      +-------+-------------------+         +-------------------+
              | render sets (binary)
      +-------v-------------------+
      | Render Feed API (hooks)   |
      +-------+-------------------+
              |
      +-------v-------------------+
      | Globe Visualization Layer |
      +---------------------------+
```

## Layer Responsibilities
- Source Registry: Declarative list; hot-swappable adapters.
- Adapter: Fetch + parse + minimal validation; no cross-source logic.
- Normalization: Units, coordinate sanity, magnitude/direction derivation, stable IDs.
- Enrichment: Quality scoring, anomaly detection, baseline stats, alert generation.
- Temporal Buffer: Stores recent snapshots for playback & derivative metrics.
- Spatial Index: H3 or geohash; cell-level aggregation & multi-resolution LOD.
- LOD Strategy: Camera-aware selection, density caps, fairness policy.
- Render Feed: Exposes efficient structure (typed arrays) + metadata.
- Visualization: Converts feed to instanced glyphs / heat layers / directional arrows.

## Data Flow Contracts
1. Adapter Output (RawRecord[]): provider-specific; not exposed externally.
2. NormalizedVector: canonical; required keys (id, lat, lon, ex_mVkm, ey_mVkm, magnitude_mVkm, direction_deg, quality, timestamp, sourceId, datasetId).
3. EnrichedSnapshot: { snapshotId, sourceId, datasetId, timestamp, vectors[], stats, quality, alerts[], provenance }.
4. RenderSet: { lod, arrays: { positions(Float32), directions(Float32), magnitudes(Float32), colors(Uint8|Float32), meta? }, counts, coverage, baselineStatsRef }.

## Extensibility Hooks
- Adapter Capability Flags (realtime, cadence, granularity).
- Enrichment Plugins (register rule sets for new metrics).
- Render Modifiers (custom color ramps, thematic overlays).

## Technology Choices
| Concern | Choice |
|---------|--------|
| Spatial Index | H3 (configurable resolution) |
| ID Generation | Stable hash (datasetId + lat+lon rounded + timestamp) |
| Buffer Format | Float32Array / Uint8Array interleaved or SoA; GPU friendly |
| Worker Offload | Web Worker for normalization + binning |
| Alert Rules | Declarative YAML/JSON loaded into rule engine |

## Failure Handling
- Adapter failure: mark dataset stale; keep last snapshot served with stale flag.
- Partial failures: degrade gracefully (UI badges per source).
- Pipeline exception: circuit-break enriched layer; fallback to normalized vectors only.

## Observability
- Metrics object exposed: { rawCount, normalizedCount, binnedCount, renderedCount, avgQuality, dataAgeMs }.
- Console + optional HUD inspector.

## Security / Integrity
- Optional SHA256 snapshot hash + provenance record for future anchoring.

