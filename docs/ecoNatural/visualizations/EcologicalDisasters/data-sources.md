# Ecological Disasters Visualization – Data Sources

## Feed Catalog
- USGS Earthquake GeoJSON feeds (significant, 4.5+, all) – public, unauthenticated.
- Volcano feed (placeholder/mock; target Smithsonian GVP or equivalent) – may require API; currently mock data in provider.
- NASA FIRMS VIIRS 24h CSV (wildfires) – backlog option; not primary for v1.
- Legacy natural-events endpoint (api.starcom.app) – fallback only.

## Endpoint Details
- earthquakes-recent: significant_day.geojson – small volume, high signal.
- earthquakes-major: 4.5_day.geojson – medium volume.
- earthquakes-all: all_day.geojson – high volume; use filters.
- volcanoes: mock entries (Kilauea, Etna) – replace with live feed later.
- wildfires-viirs: CSV format; requires confidence filtering.

## Authentication & Rate Limits
- USGS: none; respect courteous polling (5 min default).
- FIRMS: public download; avoid high-frequency pulls; consider ETag/If-Modified-Since.
- Volcano: define once real source chosen; document auth if needed.

## Data Shapes
- USGS FeatureCollection → features with geometry.coordinates [lng, lat, depth] and properties (mag, sig, time, title, status...).
- NaturalEvent union: { id, lat, lng, type, magnitude?, intensity?, status?, timestamp?, description?, source? }.
- VolcanicEvent (mock): { id, name, lat, lng, elevation, type, status, last_eruption?, country, region }.

## Field Mapping (USGS → NaturalEvent)
- id → id
- geometry.coordinates[1] → lat
- geometry.coordinates[0] → lng
- properties.mag → magnitude
- properties.sig → intensity (significance)
- properties.status → status
- properties.time → timestamp (ISO)
- properties.title → description
- source → "USGS"

## Severity Bucketing
- Earthquakes: use magnitude and/or significance
  - Minor: mag < 4.5 or sig < 400
  - Major: 4.5 ≤ mag < 6.5 or 400 ≤ sig < 900
  - Catastrophic: mag ≥ 6.5 or sig ≥ 900
- Volcanoes: status-based
  - Active = major/catastrophic visual emphasis
  - Dormant = minor visual style
  - Extinct = hidden by default unless toggled

## Time Window Filtering
- Default timeRange (days) from settings; filter by timestamp >= now - timeRange.
- USGS feeds already scoped to day; still filter locally for consistency and for future multi-day feeds.

## Data Quality & Edge Cases
- Missing magnitude: still render with neutral size; mark as unknown.
- Duplicates: de-duplicate by id + timestamp.
- Invalid coords: drop entries; log count.
- Stale feed: use cached last-good data; flag as stale in UI/telemetry.

## Fallbacks and Mocks
- If fetch fails, retain cached data; show warning banner/legend cue.
- Volcano data uses mock list until real feed; label mock clearly in tooltip.
- Legacy natural-events endpoint as final fallback for quakes only.

## Polling Cadence
- Default 5 minutes for geo-events provider subscribe.
- Allow override in development; avoid < 60s in production to respect public APIs.

## Transformations
- USGS FeatureCollection → NaturalEvent[] via provider transform helper.
- Volcano mock list already aligned to NaturalEvent shape (type=volcano, status, last_eruption).
- Wildfire CSV → NaturalEvent[] with type=wildfire, intensity=brightness, filter confidence > 30.

## Filtering Rules (Applied Post-Transform)
- Hazard type toggle: drop disabled types (earthquakes/volcanoes) per settings.
- Severity toggle: apply buckets described above.
- Time range: enforce sliding window.
- Optional geofence: not in v1; leave hook in transformer for future.

## Caching
- BasicCacheService in providerRegistry for geo-events with TTL 5m.
- Consider ETag/Last-Modified for USGS when available; document if added.
- In-memory per-session cache to avoid reparse while staying within TTL.

## Error Handling
- On fetch error: log via observer; surface toast/banner; keep last data.
- On validation failure: drop payload, emit telemetry event validation_failed.
- On partial parse: render valid entries, count dropped entries for logs.

## Telemetry (for data layer)
- fetch_success, fetch_failure (duration, status, endpoint)
- transform_success, transform_failure (counts, dropped)
- cache_hit/cache_miss
- poll_interval_ms

## Security/Privacy
- Public hazard data; no PII.
- Respect CORS and avoid embedding API keys in client if added later.

## Sample Payloads (store in tests/fixtures)
- USGS sample FeatureCollection (small, with mag variety).
- Volcano mock list with active/dormant/extinct examples.
- Wildfire CSV snippet with low/high confidence rows.

## Environment Config
- VITE_GEO_EVENTS_API_URL for legacy fallback; default to https://api.starcom.app/natural-events.
- Future: VOLCANO_FEED_URL if a real feed is chosen.

## Dependency Notes
- GeoEventsDataProvider implements fetch/transform/validate.
- Provider registry registers geo-events with BasicCacheService.
- DataManagerHelpers exposes getNaturalEventsData helper.

## Quality Gates
- Transform unit tests passing with fixtures.
- Validation rejects malformed payloads without crashing UI.
- Fetch respects cadence and handles offline gracefully.

## Change Management
- Any new feed: add mapping table, update severity rules if needed, update tests.
- Document rate-limit guidance when switching feeds.

## Open Questions
- Should we include depth in tooltip and scaling? (likely yes, size tied to mag; depth text only.)
- Are we allowed to store feed responses in localStorage for offline? Probably no; keep in-memory only.
- Do we need per-region throttling to avoid marker floods? For v1, rely on declutter limits.

## References
- USGS GeoJSON feed docs: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
- NASA FIRMS: https://firms.modaps.eosdis.nasa.gov
- Smithsonian GVP (candidate): https://volcano.si.edu/

## Extended Mapping Tables (illustrative)
- USGS properties to NaturalEvent:
  - mag → magnitude (number)
  - sig → intensity (number)
  - status → status (string)
  - time → timestamp (ms) → ISO
  - title → description (string)
  - url → sourceLink (store in description or extra field if needed)
  - types includes "geoserve"/"nearby-cities"; ignore for now
- Volcano mock to NaturalEvent:
  - name → description/title
  - status → status
  - last_eruption → lastEruption (string)
  - elevation/type/region/country → tooltip metadata (optional)

## Data Volume Expectations
- USGS significant_day: typically < 20 events.
- USGS 4.5_day: tens to low hundreds.
- USGS all_day: hundreds; may require thinning.
- Volcano mock: handful; real feed may have hundreds but most dormant.

## Severity and Filtering Examples
- Example minor quake: mag 3.8, sig 220 → bucket minor; may be filtered if showMinor=false.
- Example major quake: mag 5.2, sig 480 → bucket major.
- Example catastrophic quake: mag 7.1, sig 1200 → bucket catastrophic; impact radius on.
- Example active volcano: status active → treat as major/catastrophic visual; show pulse.
- Example dormant volcano: status dormant → bucket minor; may be hidden if minors off.

## Sample Transformation Walkthrough
- Input: USGS feature with coordinates [-117.5, 34.2, 10.0], mag 5.4, sig 450, time 1705100000000, title "M 5.4 - Southern CA".
- Output NaturalEvent: { id, lat:34.2, lng:-117.5, type:'earthquake', magnitude:5.4, intensity:450, status:'reviewed', timestamp:'2024-01-12T...', description:'M 5.4 - Southern CA', source:'USGS' }.
- Bucket: major (mag 5.4, sig 450) -> render red medium size.

## CSV Parsing (Wildfire Backlog)
- Headers: latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, confidence, version, bright_t31, frp, daynight.
- Use confidence > 30; parse lat/lng/brightness; set type='wildfire'; intensity=brightness.
- Timestamp from acq_date+acq_time (UTC) if needed.

## Validation Rules (expanded)
- Require numeric lat/lng; drop NaN.
- For USGS, ensure features array exists; if not, error.
- For volcano mock, ensure required keys present; drop otherwise.
- For CSV, ensure header matches expected length.

## Error Case Handling Examples
- HTTP 500 from USGS: throw; observer onError; UI marks stale.
- Invalid JSON: catch; log validation_failed; no render update.
- Empty features array: treat as valid but no markers; show "No events" state.

## Data Freshness Handling
- Store last_success_ts per endpoint; mark stale if now - ts > (2x polling interval).
- Surfaced in legend/status; include in telemetry.

## Multi-Endpoint Strategy
- Earthquakes: choose endpoint based on severity preference (e.g., use 4.5_day by default, allow all_day when minor enabled).
- Volcanoes: single endpoint; replace with live feed when available.
- Wildfires: optional; keep behind feature flag.

## Mock Data Governance
- Label all mock-derived markers as mock in tooltip/legend.
- Keep mock fixtures under tests/fixtures; avoid shipping misleading data in prod without label.

## Data Storage
- In-memory only; no persistence beyond session cache.
- Avoid localStorage for feed data to prevent stale/large entries.

## Internationalization Notes
- All timestamps in UTC; avoid locale-specific formatting in tooltips unless i18n layer is present.

## Security Notes
- Do not proxy feeds through app server unless necessary; if added, document auth and CORS implications.

## Ops Playbook Snippets
- If USGS feed down: switch to legacy natural-events endpoint temporarily; set banner.
- If volcano feed down: keep quakes; show volcano stale badge.
- If both down: disable mode via flag; show outage notice.

## Additional References
- Example USGS response sizes: ~200KB for all_day; acceptable for client parse.
- Consider gzip already enabled by CDN; no client change needed.
