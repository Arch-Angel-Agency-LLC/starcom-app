# 10 - Testing & Validation

## Test Categories
| Category | Description |
|----------|-------------|
| Adapter Contract | Ensures fetch/parse/normalize comply with schema. |
| Unit Normalization | Verifies magnitude calculations & direction correctness. |
| Sampling Fairness | Distribution retention across lat/lon bins. |
| Alert Logic | Boundary tests for percentile & absolute thresholds. |
| Quality Scoring | Synthetic datasets hitting each failure mode. |
| Performance | Timing budget CI tests (normalization, aggregation, render build). |
| LOD Selection | Camera altitude to LOD mapping correctness. |
| Resilience | Simulated fetch failures, partial corruption, stale fallback. |
| Playback Integrity | Snapshot ring buffer chronological consistency. |

## Representative Tests
1. Adapter Parse: Provide mock NOAA directory HTML with multiple file patterns including noise entries -> expect latest file identified.
2. Unit Conversion: Raw Ex/Ey pair (300, 400 mV/km) -> magnitude 500 mV/km; direction ~53.13°.
3. Sampling Fairness: Uniform synthetic grid -> aggregated output retains ≥90% cells at LOD0.
4. Alert Spike: Magnitude at 3200 mV/km vs baseline P99=2500 -> extreme severity.
5. Quality Timeliness: Snapshot age > 2*cadence -> quality timeliness < threshold creating degradation alert.
6. LOD Switch: Camera altitude crosses boundary; verify instance count change without flicker.
7. Worker Timeout: Simulated long normalization triggers downgrade (LOD increase) and logs.

## Tooling
- Vitest for unit & integration.
- Synthetic dataset generator utility (added under `tests/utils/` future).
- Performance harness (Node + jsdom / headless WebGL). 

## Metrics Validation
Test ensures counts.flow: raw >= normalized >= aggregated >= rendered and ratios within configured tolerance.

## Golden Baselines
Store serialized enriched snapshots for deterministic regression comparison (hash diff allowed if metadata fields vary like timestamps).

## CI Gates
- All unit + contract tests pass.
- Performance budgets not exceeded.
- Alert accuracy suite (fixtures) passes.

## Manual QA Checklist
- Toggle legacy vs pipeline visually identical distribution.
- Zoom transitions maintain acceptable frame rate.
- Alert HUD matches anomaly vectors visually.

