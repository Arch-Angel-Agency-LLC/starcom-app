# Backpressure and Idle Strategy

## Purpose
- Prevent tight loops and pollers from piling up work when endpoints are slow or when the app is idle.
- Introduce backoff, skip, and idle-sleep patterns for high-frequency tasks.

## Current Pain Points
- realTimeEventSystem runs every 100ms regardless of queue size; can stay hot when idle.
- Pollers (providers, Discord, globe) may overlap on slow responses without backoff.
- Services (IPFS/Team/AI/Monitoring) run on fixed cadence without considering app inactivity.

## Objectives
- Add backpressure to pollers: skip next run if previous is in-flight or slow; apply backoff on errors.
- Idle-aware scheduling: slow high-frequency loops when app/tab is idle or queue empty.
- Cap concurrency for work queues; bound retries with cool-off.

## Patterns
- Min-interval + in-flight guard (registry). Skip if still running; log skip count.
- Slow-call skip: if duration > threshold, delay next run (e.g., +1x interval).
- Error backoff: exponential/capped (1x → 4x) with reset on success.
- Idle sleep: for realTimeEventSystem, increase interval when queue empty; resume on new work.
- Visibility-aware: when tab hidden, expand intervals (respect user-facing UX needs).

## Target Integrations
- realTimeEventSystem: add idle backoff; process batch per tick; pause when queue empty; cap per-tick items.
- Provider pollers (GeoEvents/SpaceAssets/Intel/Weather/Alerts) via registry with slow-call skip/backoff.
- Discord stats, SecureChat checks: adopt min-interval and backoff.
- IPFSContentOrchestrator/NetworkManager, RealTimeTeamService, AIEngineSimulator, MonitoringService: apply backoff and pause on repeated failures; expose pause/resume.

## Telemetry
- Record skips, backoffs, idle sleeps per key; emit via tracer.
- Expose metrics: avg duration, max duration, consecutive failures.

## Testing Strategy
- Unit: backoff progression; skip when in-flight; idle sleep kicks in when queue empty.
- Integration: simulate slow endpoint → no overlapping calls; observe delayed next run.
- Regression: tab hidden expands intervals; foreground restores baseline.

## Acceptance Criteria
- No overlapping poller calls under slow responses.
- High-frequency loop reduces work when idle; resumes promptly on new work.
- Error storms trigger backoff instead of hammering endpoints.

## References
- realTimeEventSystem: src/services/realTimeEventSystem.ts.
- Pollers: src/globe-engine/GlobeEngine.ts; src/components/Globe/Globe.tsx; src/context/SpaceWeatherContext.tsx; src/hooks/useDiscordStats.ts; providers under src/services/data-management/providers.
- Services: IPFSContentOrchestrator, IPFSNetworkManager, RealTimeTeamService, AIEngineSimulator, MonitoringService, IPFSNostrIntegrationManager, PerformanceOptimizationService.
