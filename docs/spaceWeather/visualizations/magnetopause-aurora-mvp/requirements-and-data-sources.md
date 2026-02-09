# Requirements and Data Sources

## Purpose
- Define MVP goals for magnetopause shell, bow shock shell, and auroral oval visualizations on the globe.
- Enumerate authoritative upstream data sources and the rules for freshness, quality, and fallback.
- Capture acceptance criteria for accuracy, latency, stability, and user-facing behavior.

## Scope of MVP
- Render a translucent magnetopause shell sized by real-time solar wind conditions.
- Render a bow shock shell distinct from the magnetopause with proper offset and color.
- Render dynamic auroral ovals (north and south) sized by Kp and supporting blackout overlays.
- Operate within the existing GlobeEngine overlay model without breaking other overlays.
- Include HUD alignment (passive cards) and settings toggles but keep interactivity minimal.

## Success Criteria
- Data freshness: space weather overlays refresh at least every 5 minutes; detect and mark stale data older than 15 minutes.
- Accuracy: magnetopause standoff radius within expected physical ranges for given pressure; oval footprint scales correctly per Kp bin.
- Robustness: graceful degradation when any feed is missing; show fallback modeled values and surface an error state.
- Performance: target render >50 FPS on mid hardware with all three layers enabled; fetch-to-render pipeline under 2 seconds when network is healthy.
- UX: toggles respond within 200 ms; loading and error states are visible and non-blocking.

## Datasets (Authoritative Sources)
- Solar wind plasma: NOAA SWPC or equivalent providing speed, density, temperature, dynamic pressure; cadence 1-5 minutes.
- Solar wind magnetic (IMF): Bz and related fields for oval morphology tuning.
- Kp index: near-real-time Kp or estimated Kp for oval scaling; cadence 3 hours or estimated pseudo-nowcast if available.
- Auroral oval products: if available, NOAA aurora oval polygon feeds (north and south) to supplement Kp-derived model.
- Magnetopause and bow shock models: analytical relations using dynamic pressure; optional API providing modeled boundaries.

## Data Freshness and Staleness
- Define max age per feed: solar wind (10 minutes), IMF (10 minutes), Kp (3 hours), oval polygons (20 minutes), modeled boundaries (30 minutes).
- If stale threshold exceeded, mark layer as degraded, fall back to modeled values, and emit overlayDataError event.
- Log staleness events for observability; include timestamps in overlay payload for HUD display.

## Units and Conventions
- Solar wind: speed km/s, density cm^-3, temperature K, dynamic pressure nPa.
- IMF: Bz in nT, GSM coordinates assumed.
- Distances: Earth radii (Re) for magnetopause and bow shock radii; kilometers for derived metrics only if needed.
- Coordinates: lat/long degrees for globe plotting; if mag coordinates supplied, convert to geographic before render.

## Reliability and Fallback Rules
- Primary fetch from authoritative NOAA endpoints; secondary fallback to cached last-good sample within staleness window.
- If both unavailable, compute modeled magnetopause/bow shock from last-known solar wind pressure or static nominal values.
- Auroral ovals: prefer live polygons; else derive from Kp model with smoothing; if no Kp, render minimal placeholder oval and mark degraded.
- Ensure overlayDataUpdated event fires even for fallback to keep UI consistent.

## Data Quality Checks
- Range validation: reject non-physical values (e.g., negative density, absurd Bz magnitude) and mark as error.
- Clamping: cap extreme values to avoid pathological geometry (e.g., standoff radius < 5 Re or > 25 Re flagged and clamped).
- Smoothing: optional rolling average over last N samples for visual stability; document window per feed.

## Latency and Performance Targets
- Fetch timeout: 8-10 seconds; retry with backoff up to 3 times before fallback.
- Processing budget: mapping calculations <50 ms per update; payload sizes <50 KB.
- Rendering budget: combined overlay draw should not drop frame rate below 50 FPS on mid hardware.

## Security and Privacy
- All endpoints over HTTPS; no PII involved.
- Cache data in memory only; no persistence beyond session except allowed local settings for toggles.

## Acceptance Test References
- Contract tests: ensure required fields present per feed; correct unit parsing.
- Mapper tests: given sample solar wind inputs, compute expected standoff and bow shock radii.
- Visual checks: auroral oval footprint matches Kp bins within tolerance; colors and opacity per spec.

## Out-of-Scope
- Full particle simulations; only shells and heatmap/ribbon representations.
- Advanced user interactions (drag handles, detailed tooltips) beyond MVP toggles and passive HUD alignment.
- Forecast visualization; MVP is nowcast.

## Deliverables from this Doc
- Definitive list of feeds and fallbacks with freshness budgets.
- Enumerated acceptance criteria to gate rollout.
- Shared vocabulary for units, coordinates, and error states.
