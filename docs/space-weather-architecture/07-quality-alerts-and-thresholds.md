# 07 - Quality, Alerts & Thresholds

## Quality Dimensions
| Dimension | Definition | Method |
|-----------|------------|--------|
| Completeness | % expected vectors present vs historical baseline | Compare current total vs rolling mean ± tolerance |
| Timeliness | Age of newest timestamp | now - time_tag |
| Spatial Uniformity | Variance of counts per H3 cell normalized | Gini / coefficient of variation |
| Variance Health | Magnitude variance vs baseline (under/over dispersion) | Levene / ratio |
| Coverage | Geographic span area vs maximum observed | bbox area ratio |

Overall quality = weighted mean (weights configurable). Issues recorded if below thresholds.

## Alert Categories
| Type | Trigger | Severity Heuristic |
|------|---------|--------------------|
| electric_field_spike | Vector magnitude > dynamic P99 baseline | magnitude & z-score |
| regional_cluster | Cluster of >N spikes within region radius | count & mean magnitude |
| sustained_elevation | Rolling window mean > P90 for >T minutes | duration & excess |
| divergence_between_sources (future) | Δ magnitude between datasets > threshold | delta ratio |
| data_quality_degradation | Quality overall < 0.5 or timeliness > staleness limit | deficit depth |

## Threshold Strategy
Hybrid approach: absolute + percentile.
- Compute rolling baseline percentiles (P50, P75, P90, P95, P99) per dataset daily.
- Spike absolute floors (example initial): 500, 1000, 1500, 3000 mV/km.
- Severity scale example:
```
if magnitude >= 3000 or percentile >= 99 => extreme
else if magnitude >= 1500 or percentile >= 95 => high
else if magnitude >= 1000 or percentile >= 90 => moderate
else if magnitude >= 500  or percentile >= 75 => low
```

## Cluster Detection
- Use HDBSCAN or density-based simple heuristic (start simple): if ≥3 high severity vectors within 250 km.
- Region label: centroid plus bounding radius.

## Alert Object Example
```json
{
  "id": "alert-2025-08-09T12:00:00Z-xyz",
  "type": "electric_field_spike",
  "severity": "high",
  "timestamp": "2025-08-09T12:00:05Z",
  "datasetIds": ["intermag"],
  "metrics": { "magnitude_mVkm": 1875, "percentile": 96, "zscore": 3.2 },
  "regionHint": "59.2N, -102.4E",
  "vectors": ["intermag|59.2|-102.4|..."],
  "message": "High electric field spike detected exceeding P95 baseline."
}
```

## Degradation Alerts
- If timeliness > 2 * cadenceSec => severity moderate.
- If coverage ratio < 0.6 baseline => low; <0.4 => high.

## False Positive Mitigation
- Require persistence for sustained_elevation (two consecutive snapshots).
- Debounce identical spike alerts within X minutes unless magnitude escalates tier.

## Logging & Audit
- Alert emission log retains: triggering vectors, baseline stats snapshot, computation time.

## User Controls
- Toggle absolute vs adaptive threshold view.
- Adjust percentile mapping (advanced settings).

## Testing Requirements
- Fixture datasets around threshold boundaries.
- Random noise injection test to verify stability (no alert flood). 
