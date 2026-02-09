# Poller Registry and Guards

## Purpose
- Define a centralized interval/poller registry with in-flight, abort, and min-interval guards.
- Prevent overlapping fetches, StrictMode duplication, and hot-reload leaks.
- Provide migration steps for high-risk pollers in the codebase.

## Design Principles
- **Idempotent registration:** Same key cannot start twice; starts return a handle with stop() and isActive().
- **In-flight dedupe:** If a job is running, skip/queue the next tick; never overlap the same key.
- **Abortable:** Every run gets an AbortController; stop() cancels pending fetch.
- **Min-interval floor:** Enforce a lower bound regardless of caller input; add jitter to desynchronize bursts.
- **Lifecycle-aware:** Auto-teardown on route/mode/unmount; registry ties into React effects and global teardown.
- **Backoff-aware:** On repeated errors, back off or pause; optional max-retries before a cool-off.

## Registry API Sketch
- register(key, fn, { intervalMs, minIntervalMs, jitterMs, immediate, backoff, onError, onSuccess }): returns handle { stop, runNow, isActive }.
- stopAll(scope?): stop all or by tag/scope (e.g., visualization mode).
- setTeardownHook(scope, cb): hook for route/mode change to stop scoped pollers.
- metadata per key: lastRun, lastDuration, lastError, runs, skips, overlaps prevented.

## Guard Wrapper Pattern
- wrapFetch(key, fetcher, { minIntervalMs, timeoutMs }): ensures single in-flight, abort on stop, skip if still running.
- Slow-call skip: if duration > slowThreshold, skip the next tick and log.
- Backoff strategy: exponential backoff on consecutive failures with max cap.

## Migration Targets (priority)
1) Globe-related
   - Space assets/weather: src/globe-engine/GlobeEngine.ts (60s/5m intervals).
   - Intel markers, CyberThreats (30s), CyberAttacks (15s): src/components/Globe/Globe.tsx.
2) Core services
   - SpaceWeatherContext pipeline: src/context/SpaceWeatherContext.tsx (15s floor).
   - Discord stats: src/hooks/useDiscordStats.ts (30s; add min-interval + abort).
   - Data providers: GeoEvents, SpaceAssets, Intel, Weather, Alerts (immediate + interval) under src/services/data-management/providers.
   - SecureChat: threat/network checks in src/context/SecureChatContext.tsx.
3) Backend/service loops
   - IPFSContentOrchestrator (5m), IPFSNetworkManager (30s/60s), RealTimeTeamService (30s heavy sync), AIEngineSimulator (30s), MonitoringService (30s/60s), IPFSNostrIntegrationManager (config-driven), PerformanceOptimizationService (60s cleanup).
4) High-frequency loop
   - realTimeEventSystem 100ms processor: add idle backoff via registry run scheduling.

## Enforcement Rules
- All new/legacy intervals must register via registry; direct setInterval is disallowed in reviewed areas.
- Each poller has a key, scope (mode, feature), and lifecycle owner (component/service).
- Immediate run happens only if no in-flight; otherwise schedule next tick.
- AbortController passed into fetchers; fetchers must respect signal.
- Backoff config per poller with defaults (e.g., start 1x interval, cap 4x).

## State and Telemetry
- Keep per-key stats: runs, skips (in-flight), aborts, errors, avg duration, last error.
- Optional event emitter for observability (logged by tracer).
- Expose debug dump for QA to verify active pollers and next run times.

## StrictMode/Hot-Reload Safety
- Registry stores active keys; on duplicate register, return existing handle or no-op.
- Hook helper for React: useRegisteredPoller(key, fn, deps, opts) that registers on mount and stops on unmount.

## Integration Steps per Target
- Replace setInterval in each target with registry registration and guard wrapper.
- Add AbortController usage inside fetchers (space-weather pipeline, Discord service, providers).
- Remove ad-hoc intervals when registry starts (ensures single source of truth).

## Error Handling and Backoff
- On error: increment failure count; if > N, back off or pause and surface warning.
- On success: reset backoff; record duration; allow next run after minInterval.
- Allow circuit-breaker mode for persistent failures (optional).

## Testing Plan
- Unit: registry prevents duplicate start; skip when in-flight; backoff increments; abort cancels fetch.
- Integration: wrap a mock slow endpoint and assert no overlaps; assert teardown on unmount/mode change.
- Regression: simulate StrictMode double-mount; ensure one active poller.

## Acceptance Criteria
- No overlapping network calls per key under slow responses.
- Pollers stop on unmount/mode change; no leaked intervals in logs.
- Backoff engages on repeated failures; registry stats show skips instead of overlaps.
- High-frequency loop backs off when idle.

## Rollout Notes
- Migrate highest-risk pollers first (Globe, Discord, providers), then services.
- Keep a feature flag to fall back to legacy intervals if needed during rollout.
- Document keys/scopes in rollout-and-checklist.md.

## References
- GlobeEngine intervals: src/globe-engine/GlobeEngine.ts.
- Globe component intervals: src/components/Globe/Globe.tsx.
- SpaceWeatherContext: src/context/SpaceWeatherContext.tsx.
- Discord: src/hooks/useDiscordStats.ts.
- Providers: src/services/data-management/providers/*
- SecureChat: src/context/SecureChatContext.tsx.
- Service loops: IPFSContentOrchestrator, IPFSNetworkManager, RealTimeTeamService, aiService, MonitoringService, IPFSNostrIntegrationManager, PerformanceOptimizationService.
- High-frequency loop: src/services/realTimeEventSystem.ts.
