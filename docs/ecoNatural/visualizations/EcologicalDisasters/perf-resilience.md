# Ecological Disasters Visualization – Performance & Resilience

## Goals
- Keep the mode responsive under varying feed sizes and network conditions.
- Avoid memory/geometry leaks; stay within resource budgets.

## Budgets (initial)
- Marker count target: ≤ 500; warn at 700; hard cap at 900 via thinning.
- Render update budget: < 120ms for 500 markers on desktop.
- Memory: avoid per-update allocations; reuse materials/geometries.

## Polling & Cadence
- Default polling interval: 5 minutes for geo-events.
- Allow dev override via env or hook; never < 60s in production.
- Backoff on repeated failures (e.g., 2x/4x until success).

## Caching Strategy
- BasicCacheService TTL 5m for provider results.
- In-memory session cache in hook to avoid re-parse within TTL.
- Optional ETag/Last-Modified when feeds support it (document if added).

## Thinning / Declutter
- If marker count exceeds cap, drop lowest severity first.
- Optional spatial thinning: grid/bin approach similar to space weather sampling; keep top severity per cell.
- Avoid expensive clustering in v1; keep hook points for later.

## Geometry/Material Management
- Use shared materials per hazard/severity bucket.
- Avoid creating new materials on every update; cache by key.
- Dispose of geometries/materials when clearing markers.

## Parsing Efficiency
- USGS JSON parse is small; still avoid double-parse.
- CSV parse (wildfire backlog): stream/line-split; filter confidence inline.

## UI Responsiveness
- Batch setState for globeData updates; avoid per-marker setState.
- Debounce settings-driven re-filter to ~50–100ms.
- Avoid heavy synchronous work in render paths.

## Error Handling & Resilience
- On fetch failure: keep last-good data; show stale badge; schedule backoff retry.
- On validation failure: drop payload; emit telemetry with counts.
- On repeated failures: surface warning in sidebar and console (dev only).

## Staleness Indicators
- Track last successful fetch timestamp; display in legend/status.
- Mark tooltips with "stale" when data age exceeds threshold.

## Network Considerations
- Respect feed guidance; avoid aggressive polling.
- Use gzip (default in browsers) and keep payload sizes reasonable.

## Mobile Constraints
- Lower marker cap on small screens; disable pulses by default.
- Reduce altitude and size to minimize overdraw.

## Resource Monitor Integration
- Record vector counts and heap usage under EcoNatural.EcologicalDisasters.
- Set budgets in visualizationResourceMonitor; warn on exceedance.

### Remediation Steps When Budgets Trip
- If vectors > budget: thin by severity (drop minor first), then apply bbox/limit of 500 before render.
- If pipelineVectors > budget: reduce fetch limit/timeRange to 3d, then re-run filter pipeline.
- If heap warning: clear cached overlays, force GC-friendly path by removing rings/impact radius, and reduce marker size/altitude.
- If warnings persist: disable mock layers (volcanoes) temporarily and switch eco mode to lite (no pulses, no rings).
- Always log snapshot to console and note the warning in QA doc before resuming full mode.

## Profiling
- Use browser performance panel to measure render on sample datasets.
- Track JS heap growth across refresh cycles to catch leaks.

## Fallback Paths
- If all feeds fail: show empty-state with retry button; keep cached data if present.
- If only volcano feed fails: continue rendering earthquakes; mark volcano layer stale.

## Deployment Considerations
- Feature flag gating to disable mode quickly if perf regresses.
- Pre-push hook reminder for version bump before shipping perf changes.

## Test Scenarios (Perf/Resilience)
- Large quake sample (800 markers) and verify thinning to cap.
- Simulated slow network; ensure UI stays responsive.
- Repeated mode enter/exit to confirm cleanup disposes materials.

## Open Questions
- Should we add worker-based parsing for larger feeds? Probably not needed for v1.
- Do we need LOD-based marker simplification for zoom levels? Not yet; consider later.

## Detailed Resilience Playbook
- Failure: USGS endpoint 500 → backoff (2x, 4x), show stale badge, keep last data.
- Failure: Volcano feed unreachable → continue quakes; mark volcano legend as stale/mock.
- Failure: Both feeds unavailable → optional flag to hide mode; show outage banner.
- Validation failure → log counts, drop payload, do not crash render.

## Thinning Strategy Examples
- If count > 900: cap at 900 after thinning; drop minors first.
- If count > 700: fade or reduce size for minors; keep majors/catastrophic.
- Grid thinning option: 5x5 degree bins; keep highest severity per bin (optional).

## Memory Hygiene Checklist
- Reuse materials keyed by hazard+severity.
- Dispose geometries/rings on cleanup.
- Avoid attaching large objects to React state; keep arrays of primitives/POJOs.
- Clear intervals on unmount/submode exit.

## Performance Profiling Steps
- Use Performance tab to measure render after data load; capture flame chart.
- Track heap snapshots before/after repeated refreshes.
- Log render duration and counts to console in dev for quick feedback.

## Mobile Performance Tips
- Lower cap to ~300 markers; disable pulses.
- Reduce ring rendering or disable rings on mobile.
- Avoid high-frequency polling; rely on manual refresh on mobile if needed.

## Network Contingencies
- Respect Retry-After headers if present (unlikely on USGS but note).
- Use fetch timeout (if wrapped) to avoid hanging requests.

## CPU/GPU Considerations
- Prefer simple shaders/materials; stick to MeshBasic for markers/rings.
- Limit pointAltitude to small values to reduce overdraw.
- Avoid per-frame allocations in animations; reuse vectors.

## Load Shedding
- If frame time spikes detected, reduce marker detail or temporarily hide rings.
- Provide optional "lite mode" toggle to disable animations.

## Observability Hooks
- Emit render.update with duration and marker count; track percentile.
- Emit resource monitor warnings for over-budget events.

## Stress Scenarios to Simulate
- Very large all_day feed (~1k entries) with all hazards on.
- Frequent settings changes while fetch in progress.
- Rapid mode toggling EcoNatural ↔ CyberCommand to ensure cleanup.

## Deployment Guardrails
- Keep feature flag kill-switch accessible.
- Document acceptable CPU/heap thresholds; monitor post-launch.

## Data Freshness Strategy
- Consider marking data stale if older than 2x polling interval.
- Display time since last success in status and legend.

## Optional Optimizations
- Precompute size/color buckets to avoid recompute per render.
- Memoize filtered dataset based on settings hash.
- Use requestIdleCallback (if available) for non-critical logging.

## QA/Perf Checklist
- Render time under budget with 500 markers.
- No memory leak after 10 refresh cycles.
- Thinning kicks in when count exceeds cap.
- Stale badge appears when feed fails.
- Reduced-motion disables pulses.

## Additional Perf Tips
- Keep tooltips lightweight; avoid heavy formatting.
- Avoid unnecessary console logging in production; gate behind DEBUG flag.
- Consider lazy-loading any heavy helper only when submode active.
