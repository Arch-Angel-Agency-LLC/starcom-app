# Architecture and Rendering Pipeline

## Objectives
- Describe the end-to-end flow from data fetch to rendered overlays for magnetopause, bow shock, and auroral ovals.
- Define ownership boundaries between fetchers, mappers, overlay cache, render layers, and UI.
- Capture scheduling, eventing, layering order, and fallback behavior to keep the globe stable.

## High-Level Diagram (textual)
1. Fetchers pull raw feeds (solar wind, IMF, Kp, oval polygons) on a cadence.
2. Mappers convert raw data to overlay payloads: standoff radii, bow shock radii, oval meshes/masks.
3. Overlay cache stores latest payloads and emits overlayDataUpdated events.
4. GlobeEngine consumes payloads to build renderables (meshes/materials) and updates scene graph.
5. UI/HUD receives derived statuses (freshness, errors) for cards and toggles.

## Components and Responsibilities
- Fetch Layer: HTTP clients with retries, timeouts, and staleness tagging; isolated per dataset to avoid cascade failures.
- Mapping Layer: deterministic converters with validation and clamping; no network calls.
- Overlay Cache: keyed by overlay IDs; holds payloads and metadata; debounces updates to avoid thrash.
- Renderer Integration: GlobeEngine overlay handlers that turn payloads into geometries and materials; disposes old meshes safely.
- Settings Bridge: reads user toggles and controls activation of fetchers and renderers.
- Event Bus: GlobeEngine emit/on for overlay lifecycle (loading, updated, error) consumed by UI and logs.

## Overlay IDs and Ownership
- spaceWeatherMagnetopause: owned by space weather fetcher + mapper; rendered as translucent shell.
- spaceWeatherBowShock: owned by space weather fetcher + mapper; rendered as outer warm shell.
- spaceWeatherAurora: owned by space weather fetcher + mapper; rendered as dual ovals plus blackout mask.
- Each overlay handler lives inside GlobeEngine with a dedicated init, update, and dispose path.

## Scheduling and Cadence
- Global tick: 5-minute interval aligned with NOAA cadence; immediate fetch on activation.
- Per-overlay throttling: avoid redundant rebuilds if payload unchanged; checksum payloads to skip renders.
- Timeouts: 8-10 seconds per request; backoff 2x per retry up to 3 attempts; fail fast to fallback.

## Data Flow Details
- Raw -> Validated: range checks, unit normalization.
- Validated -> Modeled: compute standoff and bow shock radii from dynamic pressure; derive ovals from Kp.
- Modeled -> Renderable: create geometry descriptors (radii, vertex lists) and material hints (opacity, color).
- Renderable -> Scene: GlobeEngine builds THREE meshes, applies materials, updates scene graph.

## Layering and Z-Order
- Base globe texture first.
- Auroral ovals next (additive or heatmap), anchored to atmosphere height.
- Magnetopause shell above ovals (translucent cool color).
- Bow shock shell outermost (warm color, slightly larger radius).
- Markers or labels if any, above shells.

## Resource Management
- Dispose old meshes when new payloads arrive; reuse materials when possible to reduce GC.
- Keep geometry buffer sizes capped; prefer shared buffers for ovals.
- Avoid depth-write for additive aurora layers to reduce artifacts; enable for shells with tuned depth bias.

## Fallback Behavior
- If fetch fails, reuse cached payload if fresh; else use modeled defaults (nominal standoff, bow shock, oval size).
- Emit overlayDataError with context; still emit overlayDataUpdated for fallback payload to keep UI consistent.

## Error Handling and Telemetry
- Standard error object: { overlay, code, message, staleSince }.
- Log fetch latency, success/failure, retries, and render rebuild durations.
- Surface stale/fallback state to HUD via overlay metadata.

## Performance Considerations
- Limit geometry resolution based on camera distance and hardware capability flags.
- Debounce rapid successive updates to once per tick; prefer incremental updates for ovals.
- Avoid blocking main thread: use lightweight math and keep JSON payloads small.

## Security and Resilience
- HTTPS-only endpoints; no credentials stored client-side.
- Guard against malformed JSON; defensive parsing with defaults.
- Circuit-breaker per feed after repeated failures; auto-recover after cool-down.

## Integration Points
- GlobeEngine addOverlay handlers for the three overlays.
- Settings hooks to enable/disable fetchers and renderers dynamically.
- HUD components to read freshness, error state, and last-updated timestamps from overlay payload metadata.

## Deliverables from this Doc
- Clear flow and ownership model for the MVP overlays.
- Scheduling and layering rules to implement in GlobeEngine.
- Error/fallback patterns to mirror in code and tests.
