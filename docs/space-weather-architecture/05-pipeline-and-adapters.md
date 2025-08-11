# 05 - Pipeline & Adapters

## Interfaces
```ts
interface SourceAdapter {
  id: string;                 // 'noaa-intermag'
  provider: string;           // 'noaa'
  dataset: string;            // 'intermag'
  cadenceSec: number;         // expected update cadence
  capabilities: { realtime: boolean; electricField: boolean };
  fetchLatest(): Promise<RawPayload>;      // raw bytes / json
  parse(raw: RawPayload): Promise<ParsedRecord[]>; // provider schema
  normalize(records: ParsedRecord[]): NormalizedVector[]; // or delegate to shared util
  healthCheck?(): Promise<AdapterHealth>;
  version: string;            // for provenance
}
```

## Pipeline Stages
1. Discovery / Scheduling
2. Fetch (retry + backoff + stale tolerance)
3. Parse (strict validation; log & skip malformed entries)
4. Normalize (units, direction, id)
5. Quality Pass (preliminary completeness + outlier guard)
6. Temporal Buffer Insert
7. Spatial Aggregation (multi-LOD H3 resolutions)
8. Enrichment (anomalies, alerts, correlation)
9. Render Set Generation (binary arrays)
10. Publication (context/provider or event emitter)

## Scheduling Strategy
- Per adapter nextRun = lastSuccess + cadenceSec (bounded by min poll floor).
- On failure: exponential backoff up to maxBackoff; serve stale snapshot with stale flag.

## Error Handling Policy
| Stage | Failure Action |
|-------|----------------|
| Fetch | Retry (3) then mark stale; do not clear previous snapshot. |
| Parse | Skip bad records; if >30% fail, mark snapshot degraded. |
| Normalize | Abort snapshot if fundamental schema violation detected. |
| Aggregation | Fallback to direct vectors (no LOD). |
| Enrichment | Skip enrichment; still publish base snapshot. |

## NOAA Electric Field Adapter Split
- `noaa-intermag-adapter.ts`
- `noaa-uscanada-adapter.ts`
Shared utilities for directory listing and file extraction; abstract pattern to allow future providers with direct manifest endpoints.

## Spatial Aggregation (Provisional)
| LOD | H3 Resolution | Target Points |
|-----|---------------|---------------|
| 0   | 4             | ~3k           |
| 1   | 5             | ~12k          |
| 2   | 6             | ~45k          |
Client selects LOD based on camera altitude & performance budget.

## Deterministic Sampling
Within each H3 cell choose representative vector: highest magnitude; if tie choose highest quality; break tie by smallest id lexicographically.

## Alert Generation Hook
Adapter can optionally provide pre-alert hints (e.g., provider-coded flags). Enrichment layer merges hints with statistical deviations.

## Health & Telemetry
AdapterHealth: { status: 'ok'|'degraded'|'error', latencyMs, lastSuccess, failureCount, message? }
Collected centrally; exposed to UI.

## Extending with New Adapter
1. Implement SourceAdapter.
2. Register in `sourceRegistry.ts`.
3. Add capability mapping (electricField, etc.).
4. Pipeline auto-includes based on capability filter.

## Migration Strategy
Phase 1: Pipeline runs parallel; old context still produces vectors.
Phase 2: Globe consumes RenderFeed; legacy path deactivated behind feature flag.
Phase 3: Remove deprecated hooks after parity verified.
