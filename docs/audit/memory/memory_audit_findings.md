# Starcom Memory Audit Findings (Phase 1–2)

_This document captures initial findings from the memory audit and maps next actions. Scope follows the agreed plan: 3D/Globe, polling/fetching, React lifecycle hygiene, caches, diagnostics, third-party/service modules._

## Executive Signals
- Heap warnings in prod are real `performance.memory` readings; eco budget (320MB) is too low vs observed 600–1000MB under asset load.
- GLB diagnostics spam re-requests and re-parses models in prod, inflating heap and noise.
- Multiple pollers (space weather, geo events, Discord stats, investigation API) can overlap; some lack hard min intervals or shared in-flight protection.
- Caches exist but lack uniform size/TTL enforcement and visibility; some cleanup runs but not centralized.

## Observations by Area

_Phase 2 additions: deeper inventory of pollers, caches, and diagnostics._

_Status: Findings are from code/console review only; runtime traces and heap snapshots are not yet captured. Phase 1 instrumentation (sampling tracer + event markers) is pending implementation to produce empirical trend lines._

### 3D / Globe / Assets
- `src/utils/assetLoader.ts`
  - Diagnostics (`DeploymentDebugger`) always on, even in prod; runs path/MIME/attempt logs per load.
  - GLTFLoader caching by URL exists, but diagnostics still run before cache hit; repeated “attempt” logs observed in console with the same GLB.
  - No explicit dispose path for loaded models when overlays are removed (rely on caller to drop refs).
  - Cache is an unbounded Map of promises; retries/exponential backoff log every attempt (`ignoreProductionSetting: true`), and cache never purges per-session.
- `src/solar-system/effects/SolarActivityVisualizer.ts`
  - Periodic update interval (config-driven) pulls NOAA data; no in-flight guard/abort; flare particle systems clone shared geometry and add materials per flare, but removal only disposes particles/material—not textures/uniforms—and the BufferGeometry is cloned per flare.
- `src/components/Globe/Globe.tsx`
  - Records heap on each eco render; budget for eco set to 320MB (too low). No throttling of heap logging; warnings fire frequently under normal GLB usage.
  - Eco markers filter/replace but do not explicitly dispose 3D assets (markers are data, not geometry—OK). Boundary overlays removed via scene cleanup, but disposals rely on GlobeEngine internals (not audited here).
  - Mode switches clear eco markers even when re-entering quickly, causing unnecessary pipeline churn.
  - Resource budgets set once per mount; not mode-aware beyond eco.

### Polling / Fetching
- `src/hooks/useGeoEvents.ts`
  - Interval `refreshMinutes` default 1 minute; backoff implemented; in-flight dedupe + 45s cache in service layer. StrictMode dependency loop fixed.
- `src/context/SpaceWeatherContext.tsx`
  - Pipeline fetch interval floored at 15s; no shared in-flight guard; uses setInterval + fetchPipeline; abort/dispose handled via `tearDownPipeline` on unmount.
  - Heap recorded every data change (could be throttled).
- `src/services/data-management/StarcomDataManager.ts`
  - Each `subscribe` creates its own interval (default 60s) with immediate fetch; no in-flight guard or abort, so slow sources can overlap and stack pending requests.
  - `startBackgroundTasks` spins two global intervals (cache optimize every 5m, metrics cleanup hourly) without storing handles or teardown; if the manager is re-instantiated (e.g., hot reload/StrictMode), intervals leak and duplicate.
- `src/globe-engine/GlobeEngine.ts`
  - Space assets/weather pollers use `setInterval` (60s, 5m) without in-flight guard or abort; slow endpoints can stack; overlayDataCache keeps latest but no TTL.
- `src/components/Globe/Globe.tsx`
  - Intel markers poll every 60s with immediate fetch; uses in-effect `currentLoadRequest` guard but no abort on unmount; relies on service subscribe + interval (dual sources) without central dedupe.
  - CyberThreats (30s) and CyberAttacks (15s) set intervals with immediate fetch; no in-flight guard, so slow API calls can overlap; services disposed on unmount but pending promises are not aborted.
- `src/core/intel/storage/performanceOptimizationManager.ts` (deprecated but still active if constructed)
  - Spins multiple intervals (metrics analysis every 60s; metrics trim every 5m; snapshots every 60s; auto-optimization every 5m) without teardown handles; re-instantiation would leak timers.
- `src/context/SecureChatContext.tsx`
  - Three intervals (threat monitoring 60–120s, network health 30–60s, threat level 60s or 5m when critical); no in-flight guard/abort, so slow assessors can overlap. Memory-aware throttling present but not cancel-on-pressure.
- `src/services/IPFSContentOrchestrator.ts`
  - Verification loop every 5m via `setInterval`; no in-flight guard/abort; content registry loaded from localStorage and kept in-memory; event listener triggers verification per update without throttling.
- `src/services/realTimeEventSystem.ts`
  - Event processor runs every 100ms forever; no teardown or backoff when queue is empty; sorts queue each tick (CPU churn) and holds eventQueue array unbounded.
  - `playNotificationSound` creates a new `AudioContext` per call and never closes it; frequent alerts can leak audio contexts and buffers.
- `src/services/IPFSNetworkManager.ts`
  - Singleton spins two intervals (peer discovery 30s, health check 60s); no in-flight guard or abort, so slow RelayNode calls can overlap; no teardown/reset if manager is hot-reloaded.
- `src/services/RealTimeTeamService.ts`
  - Sync loop every 30s with heavy work (Nostr publish, IPFS writes, member sync); no in-flight guard/abort; no teardown on dispose/hot reload; large state persisted to localStorage then kept in memory.
- `src/services/aiService.ts` (AIEngineSimulator)
  - Singleton interval every 30s generating insights; no teardown if started and not stopped; unbounded callbacks list and insights allocations per tick.
- `src/applications/netrunner/services/monitoring/MonitoringService.ts`
  - Starts health/metrics intervals (30s/60s) when `start()` called; stops on `stop()` but no auto-dispose if unused; metrics arrays grow until retention cleanup runs; potential multiple starts create multiple intervals.
- `src/services/IPFSNostrIntegrationManager.ts`
  - Sync and health intervals driven by config; no in-flight guard/abort; no teardown beyond manual clear; repeated instantiation would leak timers.
- `src/services/PerformanceOptimizationService.ts`
  - Background cache cleanup interval every 60s started on init; no stop/dispose; cache Map grows until TTL clean; multiple instances duplicate timers.
- Data providers under `src/services/data-management/providers`
  - `GeoEventsDataProvider` default 5m poll; no in-flight guard/backoff; `fetchData` invoked immediately plus interval; relies on consumer to clear interval.
  - `SpaceAssetsDataProvider` default 60s poll; no in-flight guard/backoff; can overlap if upstream slow; immediate fetch + interval.
  - `IntelDataProvider` default 5m poll; immediate fetch + interval; no in-flight guard/backoff.
  - `WeatherDataProvider` default 10m poll; immediate fetch + interval; no in-flight guard/backoff.
  - `AlertsDataProvider` default 2m poll; immediate fetch + interval; no in-flight guard/backoff.
- `src/hooks/useDiscordStats.ts`
  - Default auto-refresh true with 30s `setInterval`; no in-flight guard or abort, so slow Discord widget responses can overlap and stack pending requests.
  - Fetch runs immediately on mount plus interval; console logging on every cycle; notifications scan member list each fetch (extra allocations) and may fire on every increase without rate limit.
  - Uses `DiscordService.getServerStats` (simple fetch to Discord widget JSON; no caching or backoff); errors surface as string state but interval keeps running.
- Investigation API (`src/services/InvestigationApiService.ts`): 30s setInterval for memory check + cache cleanup; WebSocket auth loop present; response cache TTL 2m, size guard with eviction.
- Missing global registry of intervals/timeouts; no central teardown on route/mode changes.
- Intel/satellites polling not yet inventoried; needs interval floors, abort handling, and in-flight sharing check.

### React Lifecycle Hygiene
- StrictMode double-invoke previously caused geo-events thrash; mitigated.
- Need systematic review: long-lived effects (pollers, listeners, WS) to ensure cleanup on unmount/mode change; not yet fully audited.

### Caches
- GLB cache (assetLoader): Map keyed by URL; no size/TTL; relies on session lifetime. Repeated diagnostics still allocate before cache short-circuit.
- DataManager caches: BasicCacheService with 5m TTL; StarcomDataManager per-provider registration; no size cap.
- GeoEventsService: 45s result cache + in-flight dedupe.
- InvestigationApiService: responseCache TTL 2m; size cap + eviction; cleanup every 30s.
- Visualization caches: overlay cache bytes recorded, but eviction policies not uniform across overlays.
- No LRU or byte-cap on GLB cache; no purge on heavy-mode exit.
- No centralized cache inventory/metrics; evictions are silent (except investigation API).
- `src/core/intel/storage/cacheManager.ts`
  - Separate CacheManager runs a 60s cleanup interval per instance; caches size in bytes and evicts when over max, but no teardown or shared singleton—multiple instances could multiply timers and memory use; persists to localStorage optionally (adds serialization overhead).
- `src/cache/Cache.ts`
  - Simple TTL map with per-instance cleanup interval; no stop unless `stopCleanup` called; logs on every hit/miss/expiry; unbounded entry count and no size accounting.
- `src/services/data-management/providerRegistry.ts` (BasicCacheService)
  - Per-provider cache with TTL but no size cap and no scheduled cleanup; expiry only enforced on get/cleanup calls. Multiple instances per provider; no telemetry; can grow unbounded across session.

### Diagnostics / Telemetry
- `visualizationResourceMonitor` warns when budgets exceeded; eco heap budget is 320MB causing false-alarm spam. Warnings fire on every record (no delta-based throttling).
- Deployment diagnostics for assets are un-gated in prod, adding CPU/heap and console noise.
- Resource monitor warning emission is per-update; lacks debounce/delta filter; spams on steady high heap.
- `src/utils/memoryMonitor.ts`
  - Auto-starts in prod with 30s interval; warning/critical thresholds are 100MB/200MB (far below real usage), so will emit frequent memoryPressure events and console warns; uses `window.gc()` when exposed.
- `src/services/visualization/VisualizationResourceMonitor.ts`
  - Tracks snapshots per mode key; no TTL or size cap on snapshot Map; warns only when new warning types added but still logs in dev; budget maxHeapBytes too low (320MB) causing warnings to stick.
- `src/hooks/useMemoryAware.tsx`
  - Each hook instance starts its own 10s interval plus `memoryPressure` listener; `shouldProceedWithOperation` is evaluated once per render and can go stale; many consumers could multiply timers and stale gating decisions.
- No sampling-based memory tracer yet (Phase 1 pending).
- No correlation logging between warnings and active overlays/pollers; hard to attribute spikes.

## Cross-cutting patterns and suspected drivers
- **Interval sprawl without guards/teardown:** Many pollers run immediate+interval with no in-flight dedupe, abort, or central teardown (Globe assets/weather, intel/threats/attacks, Discord stats, data providers, SecureChat, IPFS/Team/AI/Monitoring/Integration services). Slow endpoints can stack requests; StrictMode/hot reload can duplicate timers.
- **Unbounded caches and retained state:** GLB cache never purged; visualization snapshots map has no TTL; multiple cache classes each spawn their own cleanup interval; localStorage-backed registries (teams/content) remain in memory; no centralized cache caps/telemetry.
- **Noisy/misconfigured diagnostics:** Asset diagnostics forced on in prod; heap budget set to 320MB; memoryMonitor thresholds 100/200MB auto-start in prod; warnings fire per update with no debounce, obscuring real regressions.
- **3D/visualization disposal gaps:** GLTF assets lack enforced dispose contracts; flare particle systems clone geometry/material per flare; AudioContexts created per notification and never closed; disposal/pooling policies are not centralized.
- **High-frequency background loops:** realTimeEventSystem ticks every 100ms sorting an unbounded queue; AI/Team/IPFS sync loops run regardless of backpressure; no idle backoff.
- **Unknowns requiring measurement:** No runtime heap traces/snapshots yet; StrictMode double-mount in prod not confirmed; disposal behavior inside GlobeEngine/GLTF pipeline still unverified.

## Risk Assessment
- **High**: GLB diagnostics in prod repeatedly touching assets, driving heap and log noise; lack of disposal guarantees for GLTF content when modes change.
- **High**: Heap budget misconfigured (320MB) ⇒ constant “critical” warnings mask real issues.
- **Medium**: Pollers without shared in-flight/dedupe or strict min intervals can overlap (space weather, Discord stats unknown source).
- **Medium**: Cache policies inconsistent (some TTL/size caps, others unlimited) risk unbounded growth in long sessions.
- **Medium**: Resource monitor logs every crossing without debounce; can spam and mask trends.

## Immediate Recommendations (to be implemented next)
1) **Gate asset diagnostics in prod** and run once per model URL (after first success). Skip path/MIME probes and retry spam when cached.
2) **Raise eco heap budget** to a realistic threshold (e.g., 1GB) and **throttle heap logging** to only emit on significant deltas (e.g., +150MB) or threshold crossings.
3) **Add shared in-flight guard + min interval** to space-weather pipeline fetch; debounce or rate-limit Discord stats poller once located.
4) **Inventory and set caps/TTLs** for all caches (GLB, visualization overlay caches, DataManager, investigation API) and add lightweight telemetry on evictions/hits.
5) **Document and enforce overlay/asset disposal contracts**: when a mode or overlay is removed, dispose geometries/materials/textures; provide a helper to do so.
6) **Centralize interval/timeout management** for major pollers to ensure teardown on mode/route change.
7) **Add sampling-based memory tracer** (10–15s, +100MB delta) with tags for mode/overlay/fetch loop to get empirical trend lines.

## What to Measure Next (Phase 3 setup)
- Add lightweight memory trace (10–15s sampling, +100MB delta logging with tags: mode, overlay, asset load event).
- Mark events: mode switch, overlay attach/detach, GLB load/dispose, cache put/evict, poller start/stop.
- Capture three heap snapshots: idle, after space-weather+eco+intel 3D load, after 30 minutes of scripted mode churn.
- Capture network/CPU alongside heap during scenarios to correlate asset diagnostics vs heap spikes (particularly GLB path probes).

## Open Questions
- Source of Discord stats triple-poll; need code location and interval controls.
- GlobeEngine disposal guarantees: do boundary overlays and any cached geometries/materials get disposed on removal? (Requires engine review.)
- Any service workers/workers that persist beyond mode switches?
- Are there duplicate intervals when React StrictMode is enabled in prod builds? Need to confirm whether production bundle still double-renders root.

## Next Actions (implementation checklist)
- [ ] Gate DeploymentDebugger/asset diagnostics in prod; one-time per model URL.
- [ ] Bump eco heap budget and add delta-based heap warning throttle.
- [ ] Add in-flight + min-interval guard to space-weather pipeline fetch; ensure teardown on mode change.
- [ ] Locate and debounce Discord stats poller; set floor interval and cancel on unmount.
- [ ] Add size/TTL caps to GLB cache; consider LRU; expose manual purge on heavy-mode exit.
- [ ] Standardize cache policy doc and enforce across overlay caches/DataManager caches.
- [ ] Add memory trace logger (delta-based) and event markers.
- [ ] Validate disposal paths for GLTF assets and overlay objects; add disposer helper.
- [ ] Write regression tests for cache eviction and a headless memory smoke (reduced scale) to detect monotonic climbs.
- [ ] Create a centralized poller/interval registry with teardown hooks on mode/submode/route change.
