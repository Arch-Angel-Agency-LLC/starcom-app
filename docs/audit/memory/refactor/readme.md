# Memory Refactor Docs Index

## Files
- architecture-overview.md — goals, scope, sequencing, hotspots, acceptance gates.
- poller-registry-and-guards.md — registry design, guard patterns, migration targets.
- cache-policy-and-implementations.md — unified cache policy, retrofit plan, telemetry, purge hooks.
- diagnostics-and-budgets.md — gating, realistic thresholds, debounce, testing plan.
- 3d-and-media-disposal.md — GLTF/particle/audio disposal and pooling.
- backpressure-and-idle-strategy.md — backoff/skip/idle patterns for loops and services.
- observability-and-tracing.md — sampling tracer, correlation logging, configuration.
- strictmode-and-lifecycle-hygiene.md — double-mount safety, teardown guarantees.
- rollout-and-checklist.md — phased rollout tracker and verification steps.

## Usage
- Start with architecture-overview for goals and sequencing.
- Use rollout-and-checklist to track adoption and verification.
- Anchor code changes to the relevant plan doc before implementation.
