# API and Fetch Contracts

## Purpose
- Define network contracts for required datasets: endpoints, params, headers, cadences.
- Specify error handling, retries, caching, and mock fixtures for development.

## Datasets Covered
- Solar wind plasma (speed, density, temperature, dynamic pressure).
- IMF (Bz) where available.
- Kp index (operational or estimated nowcast).
- Auroral oval polygons (if provided by NOAA or partner feed).
- Optional modeled magnetopause/bow shock API if available.

## Endpoint Definitions (examples)
- Solar wind: GET https://api.noaa.gov/space-weather/solar-wind?fields=speed,density,temp,bz
- Kp: GET https://api.noaa.gov/space-weather/kp/latest
- Oval polygons: GET https://api.noaa.gov/space-weather/aurora/ovals
- Modeled boundaries: GET https://api.noaa.gov/space-weather/magnetopause
- Note: use real endpoints in implementation; these are placeholders for contract structure.

## Request Parameters
- Time range or latest flag (latest=true) to keep payload small.
- Optional station/source selector if multiple providers exist.
- Compression headers accepted (gzip/brotli) to reduce payload size.

## Response Contracts
- Solar wind: { timestamp: iso, speed: number, density: number, temperature: number, bz: number?, pressure: number? }.
- Kp: { timestamp: iso, kp: number, source: string }.
- Ovals: { timestamp: iso, north: LatLng[], south: LatLng[], source: string, resolution: string }.
- Modeled boundaries: { timestamp: iso, standoffRe: number, bowShockRe: number, model: string }.
- Include version field if provided by API; otherwise add in client metadata.

## Headers and Auth
- HTTPS required; no auth expected for NOAA public feeds; document if keys are later introduced.
- User-Agent must be set; avoid leaking internal tokens.

## Cadence and Scheduling
- Poll every 5 minutes aligned with GlobeEngine space weather interval.
- Immediate fetch on overlay activation; schedule next only after prior resolves or times out.

## Timeouts and Retries
- Timeout per request: 8-10 seconds.
- Retries: up to 3 with exponential backoff (e.g., 1s, 2s, 4s); stop on HTTP 4xx except 429.
- Rate limit handling: on 429, respect Retry-After if present; otherwise back off 30-60 seconds.

## Caching and Staleness
- Cache last-good payload per dataset; include timestamp and source.
- Mark payload stale if older than threshold (solar wind 10m, Kp 3h, ovals 20m).
- Serve cached data while attempting refresh; if cache stale, degrade overlay and emit error event.

## Error Taxonomy
- NETWORK_TIMEOUT, NETWORK_UNREACHABLE, HTTP_4XX, HTTP_5XX, PARSE_ERROR, VALIDATION_ERROR, STALE_DATA.
- Each error includes datasetId, message, attempt, and nextRetry timestamp.

## Validation Rules
- Require timestamp and at least one primary field (speed, density, kp, points[]).
- Range checks per field; drop payload on violation and fall back to last-good.
- Log validation failures for diagnostics.

## Mock Fixtures
- Provide JSON fixtures per dataset for offline dev and tests.
- Fixtures include normal, storm, and edge-case scenarios (missing fields, extreme values, malformed types).

## Contract Tests
- Ensure parser extracts fields correctly and rejects invalid payloads.
- Verify retry logic on simulated 5xx and timeouts; ensure no infinite loops.
- Confirm staleness tagging works when fixture timestamps are old.

## Security Considerations
- Enforce HTTPS; no mixed content.
- Sanitize logged errors to avoid storing raw responses unless necessary for debugging.

## Telemetry
- Record latency, status code, payload byte size, and freshness.
- Emit overlayDataLoading, overlayDataUpdated, overlayDataError events with datasetId context.

## Extensibility
- Allow multiple providers with priority order; failover to secondary endpoints if primary fails.
- Parameterize base URLs via config for environment switching.
