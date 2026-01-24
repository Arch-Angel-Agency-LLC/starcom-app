# Diagnostics and Budgets

## Purpose
- Reduce diagnostic noise and misconfigured budgets that mask real memory issues.
- Gate prod-only diagnostics; raise realistic thresholds; debounce warnings.
- Align memory/heap/overlay diagnostics with actual usage patterns.

## Current Issues
- Deployment diagnostics always on in prod (assetLoader / DeploymentDebugger) causing extra allocations/log noise.
- Eco heap budget set to 320MB triggers constant warnings under normal GLB load.
- memoryMonitor thresholds at 100/200MB auto-start in prod; frequent memoryPressure events and GC attempts.
- VisualizationResourceMonitor logs warnings per update; no debounce; snapshots unbounded.
- useMemoryAware spawns 10s intervals per hook and stale gating value.

## Objectives
- Gate diagnostics in production; enable verbose only in dev or first-load.
- Set realistic budgets (heap ~1GB for eco) with delta-based warning emission.
- Debounce and dedupe warnings across monitors; avoid per-sample spam.
- Standardize memory/heap/logging across tools (memoryMonitor, visualizationResourceMonitor, tracer).

## Asset Diagnostics (DeploymentDebugger)
- Behavior change: in prod, log only first success per model URL; silence retries; no path/MIME spam when cached.
- Add flag to disable diagnostic retries entirely in prod; keep minimal success stamp.
- Ensure diagnostics calls happen after cache hit check to avoid extra allocations on cached models.

## Heap/Resource Budgets
- Eco heap budget: raise to ~1GB; configurable via env.
- Emission rule: warn only on threshold crossing or delta >150MB since last warn.
- Add debounce window (e.g., 10–20s) to avoid repeated logs on steady high heap.

## memoryMonitor / useMemoryAware
- Adjust thresholds to realistic values (e.g., warn 1.0–1.2GB depending on device budget).
- Debounce memoryPressure events; do not auto-start in prod without gating.
- useMemoryAware: share a singleton interval; compute shouldProceedWithOperation reactively; avoid per-instance timers.
- Provide an opt-in flag for heavy components; default to passive mode.

## VisualizationResourceMonitor
- Add debounce for warning emission; warn on change, not every record.
- Add TTL/size cap for snapshots; evict old snapshots and recalc warnings.
- Raise maxHeapBytes budget to match heap budget policy; align vectors/pipeline thresholds with realistic data volumes.
- Reduce dev-only logging or gate behind verbose flag.

## Logging and Correlation
- Standardize log format for warnings: include mode, overlay, active pollers, cache sizes.
- Integrate with sampling tracer to tag warnings with context.
- Add correlation markers when asset diagnostics fire or when heap warnings fire.

## Configuration and Flags
- Provide env flags: ENABLE_ASSET_DIAGNOSTICS (dev only), HEAP_BUDGET_MB, DIAGNOSTIC_DEBOUNCE_MS.
- Allow runtime toggles for QA to switch verbose diagnostics on/off.

## Testing Strategy
- Unit: debounce logic emits once per threshold; memoryMonitor thresholds respected; useMemoryAware produces no duplicate intervals.
- Integration: load GLB twice in prod mode → only first diagnostic log; heap warnings only on crossings.
- Regression: long-run session with stable load does not spam warnings; tracer receives correlated events.

## Rollout Steps
- Gate DeploymentDebugger in prod; move cache check before diagnostics.
- Raise heap budgets and add delta-based warning logic; wire debounce.
- Update memoryMonitor thresholds and startup gating; refactor useMemoryAware to shared interval.
- Tune VisualizationResourceMonitor budgets and debounce; add snapshot TTL/cap.
- Add correlation logging hook.

## Acceptance Criteria
- Prod console free of repeated asset diagnostic spam after first load.
- Heap warnings occur only on meaningful changes; no per-update spam.
- No multiple memoryMonitor intervals from useMemoryAware; thresholds realistic.
- Visualization warnings respect debounce and new budgets; snapshot map bounded.

## References
- Asset diagnostics: src/utils/assetLoader.ts.
- Heap/resource monitor: src/services/visualization/VisualizationResourceMonitor.ts.
- Memory monitor: src/utils/memoryMonitor.ts.
- useMemoryAware hook: src/hooks/useMemoryAware.tsx.
- Deployment diagnostics flags: DeploymentDebugger usage sites.
