# Appendix: Space Weather Sampling Strategies (Phase 0)

Purpose: Provide concise rationale and reference for provisional sampling approaches used prior to full multi-level spatial aggregation (Phase 3).

## Goals
- Reduce extreme geographic clustering from dense stations (e.g., polar cluster dominance).
- Maintain representative coverage of mid/low latitude regions for visual pattern recognition.
- Keep implementation lightweight (no heavy spatial index yet) and easily swappable.

## Strategies

### 1. legacy-topN (baseline / biased)
Selection: Filter quality >=3, score = magnitude * quality, sort desc, take first N (cap=500).
Pros: Simple, preserves strongest signals.
Cons: Spatial bias toward dense, high-magnitude clusters; poor coverage.

### 2. grid-binning (provisional fairness)
Selection: 5° (Phase 0) or 10° (tests) lat/lon bins. For each bin keep highest score (magnitude * quality). Quality pre-filter >=3.
Pros: Dramatically improves latitudinal coverage, limits cluster dominance, cost O(n).
Cons: Coarse; bin edges arbitrary; no multi-resolution detail; discards sub-bin variability.

## Telemetry Mapping
- rawInterMag / rawUSCanada: pre-sample counts.
- sampled: post-sampling, pre-visual normalization count.
- rendered: current 1:1 with sampled (may diverge when layering/LOD added).
- samplingStrategy: 'legacy-topN' or 'grid-binning' depending on feature flag.

## Feature Flag Logic
Enabled when either:
1. settings.spaceWeather.enhancedSampling === true (persisted user preference), or
2. window.STARCOM_SPACEWEATHER_ENHANCED_SAMPLING === true (runtime toggle / experiment).

## Deterministic Fairness Test
Test dataset = uniform mid-latitude grid + two dense high-magnitude clusters.
Assertions:
- legacy-topN exhibits higher polarRatio.
- grid-binning retains >= latitude bin coverage and lower polar dominance.

## Planned Evolution
Phase 3: Replace with H3 (or geohash) multi-LOD aggregation + percentile preservation + GPU instancing.
Phase 2 (optional precursor): Add simple coverage metric to quality scoring engine using grid occupancy ratio.

## Decision Log
- Adopted grid-binning as interim improvement; delay default flip until performance validated at scale.
- Deterministic test eliminates RNG flakiness (previous random jitter removed 2025-08-09).

---
Last updated: 2025-08-09
