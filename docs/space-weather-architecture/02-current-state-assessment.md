# 02 - Current State Assessment

## Data Flow (Legacy)
NOAA HTML directory scrape -> latest JSON fetch -> raw GeoJSON -> hook processing (magnitude, direction) -> context normalization/sampling -> globe markers.

## Strengths
- Working end-to-end pipeline exists.
- Basic alert generation logic present.
- Normalization & percentile coloring groundwork started.
- Caching service with TTL intelligence.

## Weaknesses
| Area | Issue |
|------|-------|
| Units | Mixed messaging (mV/km vs V/m labels). |
| Sampling | Hard cap (500) + magnitude bias; spatial coverage gaps. |
| Extensibility | Coupled logic across multiple hooks; no adapter abstraction. |
| Color Logic | Percentiles decoupled from physical storm thresholds. |
| Alert Logic | Arbitrary thresholds; not percentile-aware. |
| Resilience | Regex-only directory parse brittle; no retry/backoff layering. |
| Separation | InterMag + US-Canada merged; can’t debug per-source drift. |
| Rendering | Scalar point markers only; directionality lost visually. |
| Telemetry | No visibility into data losses (filtered vs rendered). |
| Temporal | Only latest snapshot retained; no time-series analytics. |

## Root Causes of Regression
1. Accumulated heuristic filters eliminating moderate-magnitude vectors.
2. Lossy top-N sampling favoring clustered high-quality stations.
3. Lack of per-source identity & diagnostics hides partial failures.
4. Unit ambiguity undermines threshold correctness.

## Immediate Risk Items
- Silent adapter failure leads to empty dataset being cached as valid.
- Alert inconsistency erodes operator trust.

## Inventory of Relevant Components
- Fetch/Parse: `noaaSpaceWeather.ts`
- Processing: `useSpaceWeatherData`, `useEnterpriseSpaceWeatherData`, `SpaceWeatherContext`
- Visualization: `Globe.tsx` (space weather effect section)
- Quality/Cache: `SpaceWeatherCacheService`, `DataQualityService`

## Quick Wins Identified
- Add explicit unit metadata & UI label fix.
- Add vector count diagnostics.
- Implement basic grid decimation to replace top-N sampling.
- Split datasets visually (color hue separation).
