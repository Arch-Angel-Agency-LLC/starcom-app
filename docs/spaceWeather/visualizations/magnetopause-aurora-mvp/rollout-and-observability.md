# Rollout and Observability

## Purpose
- Define how the MVP overlays are gated, released, monitored, and rolled back if needed.
- Ensure visibility into data health and render performance.

## Feature Flags
- Flag per overlay: enableMagnetopauseMVP, enableBowShockMVP, enableAuroraMVP.
- Scope flags to environments (dev, staging, prod) with safe defaults off in prod until verified.
- Allow override via query param or config for testing.

## Rollout Plan
- Phase 1: internal dev testing with fixtures and live data on dev environment.
- Phase 2: staging with limited users; collect metrics and fix issues.
- Phase 3: gradual enable in production via flag ramp; start with low percentage or internal accounts.
- Phase 4: full enable once acceptance criteria met; keep kill switch available.

## Observability Signals
- Fetch metrics: success rate, latency, retry counts, status codes.
- Data freshness: age per dataset; proportion of time in stale or fallback state.
- Render metrics: frame rate with overlays on; render update duration after payload change; geometry vertex counts.
- Error events: overlayDataError counts by type (network, parse, validation, stale).

## Dashboards
- Space Weather Data Health: success rate, latency, staleness over time per feed.
- Overlay Quality: live vs fallback vs stale percentages; lastUpdated distribution.
- Render Performance: FPS trend, update time, geometry counts, memory usage if available.
- UX Signals: toggle usage, error banners shown, time in degraded state.

## Alerting
- Thresholds: fetch success below 95% over 15 minutes; staleness exceeding thresholds; render FPS below 40 for sustained period; repeated validation errors.
- Notifications to on-call channel; include context (datasetId, environment, recent changes).

## Logging
- Standardized overlay lifecycle logs: loading, updated, error with datasetId and timestamps.
- Include payload size and basic stats (min/max values) to detect anomalies.
- Avoid logging full payloads in prod unless sampling and redaction applied.

## Fallback and Kill Switch
- On sustained failures, auto-toggle to fallback mode (modeled values) and surface notice.
- Provide manual kill switch per overlay flag to disable rendering while leaving app operational.
- Document rollback steps: disable flag, clear overlay cache, confirm meshes disposed.

## Release Checklist
- Flags default state verified per environment.
- Dashboards deployed and reading metrics.
- Alert rules configured and tested with synthetic events.
- Kill switch tested in staging.

## Post-Release Monitoring
- Watch staleness and error rates in first 24-48 hours; keep heightened alerts.
- Track performance deltas compared to baseline before overlays were enabled.
- Gather user feedback on clarity and responsiveness.

## Extensibility
- Add provider-level metrics if multiple data sources introduced later.
- Incorporate A/B testing for different visual styles without changing core telemetry.
