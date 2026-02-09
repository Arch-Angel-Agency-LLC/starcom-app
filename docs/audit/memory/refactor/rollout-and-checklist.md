# Rollout and Checklist

## Purpose
- Provide a sequenced rollout with checkpoints and verification steps.
- Track adoption across pollers, caches, diagnostics, disposal, and observability.

## Phases (align to architecture overview)
- Phase A: Poller registry + guards; diagnostics gating/budget fixes.
- Phase B: GLB cache bounding + dispose helper + audio pooling; tracer on.
- Phase C: Unified cache utility rollout to providers/snapshots/cache manager.
- Phase D: Backpressure/idle strategies; flare/audio pooling completion; purge hooks wired.

## Checklists
- Pollers
  - [ ] Registry implemented with guards/backoff/abort.
  - [ ] Globe/SpaceWeather/Discord/providers migrated.
  - [ ] SecureChat/service loops migrated.
  - [ ] realTimeEventSystem idle/backoff added.
- Caches
  - [ ] Unified cache utility added with TTL + size caps + telemetry.
  - [ ] GLB cache using utility with eviction + purge.
  - [ ] Visualization snapshots capped/TTL.
  - [ ] Provider caches migrated; CacheManager/Cache.ts replaced.
- Diagnostics/Budgets
  - [ ] Deployment diagnostics gated; cache hit checked before log.
  - [ ] Heap budgets raised; delta/debounce warnings.
  - [ ] memoryMonitor/useMemoryAware thresholds updated; shared interval.
  - [ ] VisualizationResourceMonitor debounce + cap.
- 3D/Media
  - [ ] disposeGLTF helper integrated; GLB eviction disposes.
  - [ ] SolarActivityVisualizer pooling; counters/telemetry.
  - [ ] AudioContext singleton + teardown hooks.
- Backpressure/Idle
  - [ ] Slow-call skip/backoff applied to pollers/services.
  - [ ] Idle sleep for high-frequency loops.
- Observability
  - [ ] Tracer added; events wired (poller, cache, diagnostics, disposal).
  - [ ] Log format standardized; sampling config wired.
- StrictMode/Lifecycle
  - [ ] useRegisteredPoller/useSingleton helpers adopted.
  - [ ] Teardown on mode/route change purges caches/pollers.

## Verification Steps
- Smoke: run GLB load/unload twice; ensure no repeated diagnostics in prod mode.
- Long-run: 30–60 min session; heap flat within budget; tracer shows bounded caches/pollers.
- StrictMode: enable; verify single poller instance; no double intervals.
- Backpressure: simulate slow endpoint; observe skips/backoff instead of overlaps.
- Cache: hit cap and confirm eviction + dispose events; purge hook works on mode exit.

## Rollback Plan
- Feature flags to disable registry/tracer/cache utility if regressions detected.
- Keep legacy poller paths behind flag until stable.

## Owners and Tracking
- Assign per-area owner (pollers, caches, diagnostics, 3D/media, observability).
- Record completion dates in this checklist; link PRs.
