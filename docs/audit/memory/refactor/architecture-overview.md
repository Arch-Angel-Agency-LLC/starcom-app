# Memory Refit Architecture Overview

## Purpose
- Define the goals, boundaries, and success criteria for the memory refit.
- Anchor work to concrete hotspots in the codebase so fixes stay targeted.
- Provide a north-star for sequence and integration across pollers, caches, diagnostics, 3D assets, and long-lived services.

## Goals
- Eliminate overlapping pollers and leaked intervals; ensure teardown on mode/route/unmount.
- Bound caches (GLB, visualization snapshots, provider caches) with TTL and size limits; add telemetry.
- Reduce diagnostic noise; raise realistic budgets; debounce warnings.
- Enforce disposal/pooling for GLTF/particles/audio; ensure heavy-mode exit purges.
- Add observability (sampling tracer, correlation logging) to attribute memory growth.
- Make changes StrictMode-safe and resilient to hot reload.

## Scope
- Pollers/intervals across Globe, data providers, Discord, SecureChat, IPFS/Team/AI/Monitoring services.
- Caches: GLB loader, visualization snapshots, provider caches (BasicCacheService/CacheManager/Cache.ts).
- Diagnostics/telemetry: asset diagnostics, visualizationResourceMonitor, memoryMonitor/useMemoryAware.
- 3D and media: GLTF lifecycle, SolarActivityVisualizer flares, AudioContext usage.
- High-frequency loops: realTimeEventSystem 100ms loop; AI/Team/IPFS sync loops.

## Non-Goals (for now)
- Rewriting rendering engines or replacing three.js.
- Server-side data reshaping; focus is client memory/runtime hygiene.
- Performance micro-optimizations unrelated to memory/interval/caching issues.

## Success Criteria
- No overlapping requests on slow endpoints for top pollers (space weather, satellites, threats/attacks, intel markers, Discord, data providers).
- Caches have enforced caps/TTLs; GLB cache purges on heavy-mode exit; snapshot map bounded.
- Heap warnings fire only on meaningful deltas; asset diagnostics silent in prod after first success.
- GLTF/particle/audio resources are disposed or pooled; no growing counts in long sessions.
- Sampling tracer shows flat/stable usage at idle and bounded growth under load; correlation logs point to sources when growth occurs.

## Hotspots to Anchor Fixes
- Pollers: GlobeEngine (space assets/weather), Globe (intel/threats/attacks), useDiscordStats, GeoEvents/SpaceAssets/Intel/Weather/Alerts providers, SecureChat intervals, IPFSContentOrchestrator, IPFSNetworkManager, RealTimeTeamService, AIEngineSimulator, MonitoringService, IPFSNostrIntegrationManager, PerformanceOptimizationService, realTimeEventSystem.
- Caches: assetLoader GLB cache, VisualizationResourceMonitor snapshots, BasicCacheService in providerRegistry, CacheManager, Cache.ts.
- Diagnostics: DeploymentDebugger always-on, visualizationResourceMonitor budgets (320MB), memoryMonitor thresholds (100/200MB), useMemoryAware per-hook intervals.
- 3D/media: GLTF disposal gaps, SolarActivityVisualizer flare clones, per-notification AudioContexts.
- Loops: realTimeEventSystem 100ms queue processor; sync loops at 30–60s without guards.

## Architectural Principles
- **Idempotent start/stop:** All recurring work must be startable once and stoppable cleanly.
- **Backpressure-aware:** Never overlap the same poller; skip next tick when previous is in-flight or slow.
- **Bounded state:** Every cache/map gets TTL + size cap; provide purge hooks.
- **Debounced signals:** Warnings/logs fire on delta/threshold, not every sample.
- **Explicit disposal:** GLTF/particles/audio must be disposed or pooled with helpers.
- **Observability-first:** Add tracing/metrics before and after refactors to verify impact.

## Sequencing Strategy (high level)
- Phase A: Poller registry + in-flight/abort guards on top offenders; gate prod diagnostics; raise/debounce budgets.
- Phase B: GLB cache LRU/TTL + purge; GLTF dispose helper; AudioContext singleton; tracer and correlation logs.
- Phase C: Migrate caches to unified capped policy; add TTL/size caps to snapshots and provider caches.
- Phase D: Backpressure/idle strategies for high-frequency loops; pooling/disposal for flares and audio; purge hooks for registries.

## Risks and Mitigations
- **Regression from disposal:** Mitigate with helper APIs and targeted tests (GLTF load/dispose cycles).
- **Over-throttling pollers:** Use min-interval plus backoff but keep floor values aligned to UX (15–60s) and log skips.
- **Logging noise from tracer:** Apply delta filters (+100MB) and sampling interval (10–15s); disable in prod if needed.
- **StrictMode duplication:** Registry deduplication by key; defensive checks before starting intervals.

## Stakeholders / Consumers
- Globe feature teams (space weather, intel/threats/attacks, satellites).
- Data services (GeoEvents, Weather, Alerts, Intel, IPFS/Team/AI/Monitoring).
- UX/Audio (notification sounds).
- Observability/QA (tracer, regression tests).

## Deliverables
- Refactor docs in this folder guiding implementation.
- Updated code implementing registry, cache policy, diagnostics gating, disposal helpers, tracer.
- Regression tests for poller overlap, cache caps, disposal, and tracer emissions.
- Validation notes with before/after metrics.

## Acceptance Gates per Phase
- A: Pollers deduped, no overlaps in logs; prod diagnostics gated; heap warnings debounced.
- B: GLB cache bounded and purgeable; GLTF disposal helper integrated; AudioContext pooled; tracer live.
- C: Unified cache policy in place; snapshot map capped; provider caches capped; telemetry visible.
- D: High-frequency loops back off when idle/slow; flares/audio pooled; registries purge on heavy-mode exit.

## References to Code
- Globe intervals: src/globe-engine/GlobeEngine.ts; src/components/Globe/Globe.tsx.
- Discord: src/hooks/useDiscordStats.ts.
- Providers: src/services/data-management/providers/*
- Caches: src/utils/assetLoader.ts; src/services/visualization/VisualizationResourceMonitor.ts; src/services/data-management/providerRegistry.ts; src/core/intel/storage/cacheManager.ts; src/cache/Cache.ts.
- Diagnostics: src/utils/memoryMonitor.ts; src/hooks/useMemoryAware.tsx; src/services/visualization/VisualizationResourceMonitor.ts.
- 3D/media: src/solar-system/effects/SolarActivityVisualizer.ts; src/services/realTimeEventSystem.ts.
- Loops: src/services/RealTimeTeamService.ts; src/services/IPFSContentOrchestrator.ts; src/services/IPFSNetworkManager.ts; src/services/aiService.ts; src/applications/netrunner/services/monitoring/MonitoringService.ts; src/services/IPFSNostrIntegrationManager.ts; src/services/PerformanceOptimizationService.ts.

## Tracking
- Use the rollout-and-checklist.md to mark completion.
- Tie commits/PRs to the phases and acceptance gates above.

## Testing Strategy (overview)
- Add headless smoke that exercises mode churn and ensures no monotonic heap climb over N minutes.
- Add tests for poller registry idempotence and overlap prevention.
- Add cache cap/eviction tests for GLB and provider caches.
- Add GLTF dispose cycle test (load/dispose twice) to ensure no retained geometries/materials.
- Validate tracer output under controlled load for correlation fidelity.

## Exit Criteria
- Sustained sessions (30–60 minutes) show stable heap within budgets.
- No repeated overlapping calls for guarded pollers in logs.
- Diagnostics quiet in prod except on real threshold crossings.
- Disposal helpers in use for GLTF/particles/audio; no unbounded cache growth.
