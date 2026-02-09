# Observability and Tracing

## Purpose
- Add sampling tracer and correlation logs to attribute memory growth and interval behavior.
- Standardize warning formats and sampling rules across diagnostics.
- Provide data to validate refactor impact and catch regressions.

## Objectives
- Lightweight tracer that records memory samples, active pollers, cache sizes, and warnings.
- Correlate heap warnings with cache evictions, poller overlaps/skips, and asset diagnostics.
- Sampling strategy: low overhead (e.g., 10–15s) with delta filter (+100MB) to avoid noise.
- Enable/disable via env flag; safe default off in prod or sampled low.

## Tracer Design
- Event types: memorySample, pollerRun, pollerSkip, cacheStats, cacheEvict, assetDiag, warning.
- Context fields: mode, overlay, route, device classification, active pollers count, caches (GLB, snapshots, provider), heapUsed.
- API: tracer.record(eventType, payload, opts { sampleRate, deltaOnly }).
- Transport: console in dev; buffered logger in prod with sampling.

## Integration Points
- Poller registry: emit run/skip/abort/backoff events with durations.
- Cache utility: emit hits/misses/evictions and size; warn at 90% cap.
- Diagnostics: memoryMonitor/VisualizationResourceMonitor warnings tagged with context.
- GLB cache/assetLoader: emit assetDiag on load, cache hit/miss, eviction.
- Disposal helper: emit dispose events for GLTF/audio pools if large.

## Configuration
- Env flags: ENABLE_TRACER (bool), TRACER_SAMPLE_SECONDS, TRACER_DELTA_MB, TRACER_MAX_BUFFER.
- Sampling rules: record only if delta > threshold or on significant events (eviction, warning).
- Privacy: ensure payloads avoid PII; focus on technical metrics.

## Output Format
- Structured object: { t, type, mode, overlay, route, heapMB, caches: {...}, pollers: {...}, note }.
- Keep consistent field names for easier grep/analysis.
- Optional correlationId to tie sequences.

## Testing Strategy
- Unit: delta filter suppresses steady-state logs; sampling interval respected.
- Integration: poller overlap triggers skip event; cache eviction emits event; heap warning correlates with tracer entry.
- Load test: long session produces bounded tracer buffer; no console spam in prod mode.

## Acceptance Criteria
- Tracer can be enabled without noticeable perf hit; sampling obeys config.
- Heap warnings accompanied by context (caches, pollers) in tracer output.
- Cache/poller events observable for debugging overlaps and capacity.
- No PII or noisy payloads in prod logs.

## References
- memoryMonitor: src/utils/memoryMonitor.ts.
- VisualizationResourceMonitor: src/services/visualization/VisualizationResourceMonitor.ts.
- Poller registry: planned module; integrate hooks.
- Cache utility: planned shared cache module.
- Asset loader: src/utils/assetLoader.ts.
