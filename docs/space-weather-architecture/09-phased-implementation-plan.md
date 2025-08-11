# 09 - Phased Implementation Plan

## Phase 0 (Triage & Clarity)
- Unit corrections (mV/km) & UI label alignment.
- Split datasets visually & counts telemetry.
- Add diagnostic overlay (raw/filtered/sampled/rendered).
- Replace top-N sampling with provisional uniform grid sampling.

## Phase 1 (Foundations)
- Introduce SourceAdapter interface & NOAA adapters (intermag/us_canada).
- Normalization + enrichment pipeline (parallel path) behind feature flag.
- Spatial aggregation (H3 res configurable) + deterministic representative selection.
- RenderFeed producing RenderSet with typed arrays.
- Globe consumption toggle (legacy vs pipeline).

## Phase 2 (Quality & Alerts)
- Quality scoring engine integrated (completeness, timeliness, spatial fairness).
- Hybrid threshold alert engine (percentile + absolute).
- Cluster detection (simple radius-based) + anomaly marker visuals.
- Time-series ring buffer + playback slider (basic).

## Phase 3 (Performance & LOD)
- Multi-LOD RenderSets; camera altitude switching.
- GPU instanced arrow glyphs; color ramp shader.
- Worker offload for normalization + aggregation.
- Adaptive load shedding & performance metrics HUD.

## Phase 4 (Multi-Source Expansion Ready)
- Mock second international adapter (synthetic) for interface validation.
- Divergence / delta visualization mode (two-source difference).
- Baseline percentile model persisted across sessions (local storage cache).

## Phase 5 (Advanced Analytics)
- Streamline / flow field layer (coarse grid integration).
- Sustained elevation & temporal volatility alerts.
- Optional provenance hashing + export.

## Phase 6 (Refinement & Hardening)
- Retry/backoff strategies with circuit breakers.
- Comprehensive automated tests: performance, alert correctness, sampling fairness.
- Documentation updates and deprecate legacy path.

## Deliverables per Phase
| Phase | Key Artifacts |
|-------|---------------|
| 0 | Diagnostics panel, unit patch, dataset separation |
| 1 | Adapters, Pipeline core, RenderFeed API |
| 2 | Quality engine, alert rules doc, playback ring buffer |
| 3 | LOD system, instanced rendering, worker infra |
| 4 | Multi-source divergence mode, baseline persistence |
| 5 | Flow visualization, advanced alerts |
| 6 | Finalized docs, test suites, legacy removal |

## Exit Criteria Examples
- Phase 1 exit: Globe can toggle between legacy and pipeline outputs with identical (±5%) rendered counts & magnitude distribution alignment metrics.
- Phase 3 exit: Frame time impact within performance budget at 10k vectors.

## Risk Tracking
Maintain open list in risk doc cross-referenced with mitigation status.

