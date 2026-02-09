# Ecological Disasters Visualization – Telemetry & Logging

## Objectives
- Observe data health, rendering performance, and user interaction for the EcologicalDisasters mode.
- Enable alerting on feed failures or excessive marker loads.

## Event Taxonomy
- data.fetch_start { endpoint }
- data.fetch_success { endpoint, duration_ms, count }
- data.fetch_failure { endpoint, duration_ms, status, error }
- data.transform_success { endpoint, count_in, count_out, dropped }
- data.transform_failure { endpoint, reason, dropped }
- data.cache_hit / data.cache_miss { endpoint }
- render.update { marker_count, hazards: { earthquakes, volcanoes }, duration_ms }
- render.thin_applied { before, after, reason }
- settings.changed { key, value }
- ui.mode_enter { mode: EcoNatural, subMode: EcologicalDisasters }
- ui.mode_exit { mode: EcoNatural, subMode: EcologicalDisasters }

## Metrics
- Fetch success rate per endpoint.
- Average fetch duration.
- Marker count distribution per hazard/severity.
- Render update duration percentile (p50/p95).
- Error rate (fetch/transform/validation).
- Staleness duration since last success.

## Logging Guidelines
- Info: fetch start/stop, counts, cache hits.
- Warn: validation failures, thinning triggered, stale data used.
- Error: fetch failures, transform failures.
- Avoid noisy per-marker logs; aggregate counts instead.

## Privacy & Compliance
- Data is public hazard data; no PII.
- Do not log user location or camera coordinates unless explicitly allowed; if logged, sample heavily.

## Dashboards & Alerts
- Dashboard panels: fetch success rate, marker counts, render duration, error counts.
- Alerts: sustained fetch_failure rate > threshold; render duration p95 > budget; marker_count > cap without thinning.

## Staleness Tracking
- Track last_success_ts per endpoint; include in UI badge and telemetry.
- Emit stale_used event when rendering stale data.

## Sampling
- Default 100% for fetch outcomes.
- Consider sampling render.update to 10–20% if noisy; keep error paths unsampled.

## Correlation IDs
- Use endpoint + timestamp as implicit key; optional requestId if infrastructure provides it.

## Implementation Notes
- Telemetry hooks can be simple console wrappers in dev; wire to real pipeline in prod.
- Ensure telemetry is non-blocking; never block render on logging.

## Testing Telemetry
- Mock logger in tests; assert events fired on fetch success/failure and render updates.
- Verify render.thin_applied fires when caps exceeded.

## Integration with Resource Monitor
- visualizationResourceMonitor already exists; set budgets for EcoNatural.EcologicalDisasters and emit warnings.

## Operational Runbook Hooks
- On repeated failures: alert and fall back to cached data; UI shows stale.
- On excessive markers: thinning applied; alert if persisting.

## Open Questions
- Do we need user-level interaction metrics (hover/click) for this mode? Optional; ensure no PII.

## Example Payloads
- data.fetch_success: { endpoint:'earthquakes-recent', duration_ms:420, count:42 }
- data.fetch_failure: { endpoint:'volcanoes', status:503, error:'Service unavailable', duration_ms:1800 }
- data.transform_success: { endpoint:'earthquakes-recent', count_in:42, count_out:42, dropped:0 }
- render.update: { marker_count:180, hazards:{ earthquakes:170, volcanoes:10 }, duration_ms:60 }
- render.thin_applied: { before:950, after:700, reason:'over_cap' }
- settings.changed: { key:'timeRange', value:3, previous:7 }

## Logging Format Guidance
- Use structured JSON logs where possible.
- Include timestamp, mode, subMode, and endpoint on data events.
- Avoid verbose per-marker logging; aggregate counts instead.

## Alerting Examples
- Alert if fetch_failure rate > 5% over 10 minutes for any endpoint.
- Alert if render.update p95 duration > 200ms over 15 minutes.
- Alert if marker_count exceeds cap without thinning event.

## Dashboard Panels (suggested)
- Fetch success % per endpoint (quakes, volcanoes).
- Fetch duration trend.
- Marker count by hazard and severity over time.
- Render duration percentile chart.
- Stale state occurrences per day.

## Data Retention
- Keep high-cardinality fields minimal; avoid raw descriptions in telemetry.
- Retain aggregated metrics per standard retention policies.

## Correlation & Tracing
- If tracing available, tag spans with mode/subMode and endpoint.
- Correlate fetch and render events via timestamp or optional requestId.

## Dev vs Prod Behavior
- In dev, allow console logging and reduced sampling; in prod, route to telemetry pipeline with sampling as needed.

## Telemetry Ownership
- Assign owner for dashboards/alerts; define on-call for feed outages.

## Testing Telemetry (expanded)
- Unit: ensure logger called with expected payload on success/failure.
- Integration: simulate fetch failure and verify stale badge plus telemetry emission.
- Performance: ensure render.update emitted after marker set; sampling respected.

## Data Minimization
- Do not log full descriptions or titles; keep payload small.
- Avoid logging coordinates with high precision; round if needed when used.

## Sampling Guidance
- Default 100% on errors; allow sampling on render.update if volume high.
- Document sampling rates in dashboard description.

## Storage/Retention Guidance
- Follow org defaults; avoid long retention for debug-only fields.
- Ensure PII-free so standard retention is acceptable.

## Alert Routing
- Define primary and secondary contacts for alerts related to this mode.
- Include runbook link in alert description.

## Dashboard Annotation Ideas
- Annotate enable/disable events of feature flag for context.
- Annotate incidents related to feed outages.

## Example Alert Definitions
- Alert: fetch_failure_rate_gt_5pct for endpoint earthquakes-recent over 10m.
- Alert: render_p95_gt_200ms for mode EcoNatural.EcologicalDisasters over 15m.
- Alert: marker_count_over_cap_without_thinning event absent for >5m while count>cap.
- Alert: stale_state_duration_gt_15m for any endpoint.

## Data Fields to Avoid
- Avoid logging full tooltips or descriptions.
- Avoid high-precision coordinates beyond what is needed for analytics.

## Observability Rollout Checklist
- Create dashboards before enabling flag in staging.
- Validate telemetry in staging with sample interactions.
- Ensure alert routes have on-call assignments.
- Add links to runbooks for each alert in description.

## Future Enhancements
- Add user interaction metrics (hover/click) if privacy review permits.
- Add render frame time sampling for more granular perf tracking.
- Add cache_hit ratio metric.

## Dev Tips
- Provide a DEV_TELEMETRY_CONSOLE flag to mirror events to console for debugging.
- Include mode/subMode tags on all events to simplify filtering.

## Runbook Pointers
- On feed outage alert: check upstream status pages, confirm via manual fetch, consider flagging off volcanoes.
- On render latency alert: check marker counts, thinning status, and recent code changes.
