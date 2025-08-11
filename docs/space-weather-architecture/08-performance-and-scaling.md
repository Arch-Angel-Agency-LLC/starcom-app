# 08 - Performance & Scaling

## Performance Objectives
| Aspect | Target |
|--------|--------|
| Snapshot Normalization | <150 ms for 50k vectors (worker) |
| Aggregation (H3 res 5) | <100 ms |
| Render Buffer Build | <50 ms for 5k instances |
| Frame Budget Impact | <4 ms typical, <8 ms peak |

## Bottlenecks & Mitigations
| Bottleneck | Mitigation |
|------------|-----------|
| CPU normalization | Web Worker + typed arrays |
| Large payload size | Delta encoding, gzip, potential binary transport |
| Overdraw (dense glyphs) | LOD + heatmap switch at scale |
| Garbage generation | Reuse buffers; pool arrays |

## Worker Architecture
- Main thread dispatches raw adapter results to worker.
- Worker returns EnrichedSnapshot + RenderSet(s).
- Transferable buffers minimize copying.

## Memory Management
- Ring buffer retains N snapshots (config: default 24).
- Each RenderSet can be disposed when not in playback window.
- Use structural sharing for static arrays (positions) if unchanged across LOD recalculation.

## Incremental Updates (Future)
- NOAA file names include timestamps; detect unchanged region subsets to patch buffers.

## Metrics Collection
```
PerfMetrics {
  normalizeMs,
  aggregateMs,
  alertEvalMs,
  renderBuildMs,
  vectorCounts: { raw, normalized, aggregated, rendered },
  memoryMB,
  fpsSample,
  lastUpdateAgeMs
}
```
Exposed via debug panel.

## Load Shedding
- If normalizeMs > threshold, temporarily lower LOD target.
- If frame budget exceeded consecutively, reduce opacity or sampling density.

## Stress Testing Plan
1. Synthetic generator creates 100k pseudo-vectors with realistic distributions.
2. Run CI headless normalization + aggregation timing test.
3. Regression budget thresholds enforce performance gates.

## Progressive Enhancement
- Feature detect instancing; fallback to point sprites.

