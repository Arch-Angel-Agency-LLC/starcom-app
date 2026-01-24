# Cache Policy and Implementations

## Purpose
- Define a unified cache policy (TTL, size caps, eviction, telemetry).
- Retrofit existing caches (GLB, visualization snapshots, provider caches, CacheManager, Cache.ts, BasicCacheService) to the policy.
- Provide purge hooks for heavy-mode exit and long sessions.

## Policy Fundamentals
- TTL required for all entries; default 5–10 minutes unless overridden per domain.
- Size cap required: bytes or entry count; eviction uses LRU.
- Telemetry: hits, misses, evictions, current size (entries/bytes), high-water marks.
- Cleanup: centralized scheduler; no per-instance intervals unless registered.
- Purge hooks: manual purge on heavy-mode exit or route switch; session reset hook.

## Target Caches
- GLB cache (assetLoader): unbounded Map of promises, diagnostics per load.
- Visualization snapshots (VisualizationResourceMonitor): Map with no TTL/size cap.
- BasicCacheService in providerRegistry: TTL only, no size cap, no scheduled cleanup.
- CacheManager (core/intel/storage): per-instance 60s cleanup; size in bytes; no teardown.
- Cache.ts: TTL map with per-instance cleanup interval; no size accounting.
- InvestigationApiService cache: already has TTL + size cap; use as reference.

## Unified Cache Utility (proposed)
- API: get/set/delete/clear/has; optional key metadata; events for eviction.
- Config: { ttlMs, maxEntries, maxBytes, eviction: 'lru', onEvict }.
- Telemetry: expose stats and hook for logging.
- Optional persistence: disabled by default; if used, respect size caps.
- Shared cleanup scheduler: one interval per app scope, not per cache instance.

## Retrofit Plan by Target
- GLB cache (src/utils/assetLoader.ts)
  - Add LRU+TTL; cap bytes (e.g., 150–250MB) and/or entries.
  - Evict oldest when over cap; log evictions via telemetry hook.
  - Add purge method for heavy-mode exit.
  - Gate diagnostics: only first success logs; disable retry spam in prod.

- Visualization snapshots (src/services/visualization/VisualizationResourceMonitor.ts)
  - Add TTL per snapshot and size cap (e.g., 100 entries total or per mode).
  - Evict oldest snapshots on cap; record evictions; ensure warnings recalc after eviction.

- Provider caches (src/services/data-management/providerRegistry.ts BasicCacheService)
  - Replace with unified cache utility; set TTL (5–10m) and entry cap (e.g., 200–500 per provider) or byte cap if known.
  - Register with centralized cleanup scheduler; no per-instance setInterval.

- CacheManager (src/core/intel/storage/cacheManager.ts)
  - Convert to shared cache utility or wrap with unified policy; add dispose/stopCleanup.
  - Enforce size cap and TTL; remove per-instance interval; use scheduler.

- Cache.ts
  - Replace with unified cache utility; remove logging spam; add size cap; stopCleanup hook.

## Telemetry and Alerts
- Emit stats periodically or on change: { hits, misses, evictions, sizeEntries, sizeBytes, capBytes }.
- Warning thresholds: log when >90% of cap.
- Integrate with observability plan to correlate with heap warnings.

## Purge Hooks
- Heavy-mode exit: purge GLB cache, visualization snapshots, provider caches.
- Session reset: clear registries (teams/content) and cache utility instances.

## Testing Strategy
- Unit: LRU eviction order; TTL expiry; cap enforcement; telemetry increments.
- Integration: GLB cache eviction does not reload evicted models unless requested; provider cache respects caps under rapid access.
- Regression: ensure no per-instance intervals remain; cleanup scheduler stops on dispose.

## Migration Steps
- Introduce unified cache utility in a shared module.
- Swap GLB cache implementation to use utility with LRU/TTL and telemetry.
- Replace BasicCacheService and Cache.ts usage with utility; wire cleanup scheduler.
- Update VisualizationResourceMonitor to cap/TTL snapshots.
- Add purge hooks to heavy-mode exit and service teardown paths.

## Acceptance Criteria
- All identified caches have TTL and size caps enforced.
- No unbounded Maps remain for GLB or snapshots; eviction events observable.
- Cleanup driven by a shared scheduler; no stray intervals per instance.
- Manual purge hook works and is documented.

## References
- GLB cache: src/utils/assetLoader.ts.
- Snapshots: src/services/visualization/VisualizationResourceMonitor.ts.
- Provider caches: src/services/data-management/providerRegistry.ts.
- CacheManager: src/core/intel/storage/cacheManager.ts.
- Cache.ts: src/cache/Cache.ts.
- Reference cap example: InvestigationApiService cache (TTL 2m, size cap + eviction).

## Notes on Defaults
- Start with conservative caps (entries 200–500 per provider; GLB bytes 150–250MB) and adjust after telemetry.
- TTL defaults 5–10m; shorter if data is volatile.
- Consider byte estimates for GLB models; use eviction on bytes when available.

## Operational Guidance
- Expose a debug endpoint/log command to dump cache stats.
- During rollout, monitor evictions to ensure caps aren’t too low for UX.
- Align purge hooks with mode transitions (eco/cyber) and heavy feature toggles.
