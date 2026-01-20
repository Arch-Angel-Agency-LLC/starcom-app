# Ecological Disasters Visualization – Architecture

## Component Map
- VisualizationModeInterface: user selects EcoNatural → EcologicalDisasters (🌋) secondary mode.
- useEcoNaturalSettings: stores disasterTypes, severity, timeRange, impact radius toggles.
- Data layer: providerRegistry registers GeoEventsDataProvider with BasicCacheService.
- GeoEventsDataProvider: fetches USGS quakes, volcano mock, wildfires; transforms to NaturalEvent.
- DataManagerHelpers.getNaturalEventsData: convenience fetch for UI.
- GlobeEngine (current): has naturalEvents overlay using legacy GeoEventsService; to be updated to provider.
- Globe component: renders points; recognizes types earthquake/volcano in pointColor but currently not fed.
- Sidebars: CyberCommandLeft/Right for layout patterns; SpaceWeather controls as precedent for compact UI.

## Data Flow (Target)
1) Submode change to EcologicalDisasters triggers data fetch (quakes + volcanoes).
2) Provider fetch → validate → transform to NaturalEvent[].
3) Apply filters from useEcoNaturalSettings: hazard toggles, severity buckets, time window.
4) Map to globeData entries with visual attributes (color, size, altitude, labels).
5) Globe renders; legends update; telemetry and resource monitor record counts.

## State Ownership
- Settings state: useEcoNaturalSettings (localStorage-backed) for EcoNatural.
- Data state: component-level (Globe or dedicated hook) caching filtered NaturalEvent[]; reuse provider cache.
- UI state: VisualizationModeContext for current mode/submode; sidebars manage active sections.

## Overlay Strategy
- Option A: Use GlobeEngine overlay "naturalEvents" updated to pull via providerRegistry.
- Option B: Feed globeData directly in Globe component for simplicity; keep overlay for future reuse.
- Choose A if reusing overlays across TinyGlobe; choose B for faster integration.

## Error/Loading
- Fetch start: show loading shimmer/placeholder in sidebar legend area.
- Fetch error: keep previous data, show toast/banner and legend badge (stale).
- Stale data: mark in tooltip with "stale" tag and timestamp of last fetch.

## Lifecycle Hooks
- On enter mode: start fetch and optionally polling (5m default) for geo-events.
- On exit mode: unsubscribe polling, clear hazard markers from globeData.
- On settings change: re-filter cached data; avoid refetch unless timeRange extends beyond cached window.

## Filtering
- Hazard toggle: remove disabled types.
- Severity: bucket by mag/sig or volcano status; drop non-selected buckets.
- Time window: drop events older than threshold.

## Transformation Layer
- quakeTransform(usgsData) → NaturalEvent[] with magnitude, intensity (sig), status, description, timestamp.
- volcanoTransform(list) → NaturalEvent[] with status mapped to severity.
- wildfireTransform(csv) → NaturalEvent[] (optional backlog).
- normalizeEvent(event) to ensure lat/lng, type, id present.

## Rendering Prep
- Enrich NaturalEvent with ui fields: color, size, altitude, label, severity bucket.
- Provide legend entries keyed to hazard/severity.
- Optionally compute impact radius (km) for major/catastrophic events.

## Telemetry/Resource Monitor Integration
- Record fetch_success/fail with duration per endpoint.
- Record marker counts per hazard; warning if > budget.
- Hook visualizationResourceMonitor under key EcoNatural.EcologicalDisasters.

## Performance Budget
- Target ≤ 500 markers without clustering; above that, thin by severity/time.
- Geometry/material reuse; avoid per-frame allocations.
- Debounce settings-driven re-render to 50–100ms.

## Integration with Existing UI
- Left sidebar: TinyGlobe + VisualizationModeInterface already present; add eco-disaster legend or mini-summary.
- Right sidebar: tabs (status, intel, controls) can host status/alerts; follow SpaceWeather panel patterns.
- SecondaryModeSelector (🌋) is already wired; right sidebar now matches the volcano icon.

## Dependency Injection
- Pass data fetch function via props/hook to Globe; avoid hard dependency on provider in Globe itself.
- Allow mock injection for tests.

## Logging and Diagnostics
- Console debug gated by env flag; structured telemetry events.
- Validation errors include counts and sample ids.

## Security and Privacy
- Public data; no auth tokens; ensure no secrets baked into client.

## Migration Notes
- Replace legacy GeoEventsService use in GlobeEngine with provider-based helper.
- Align TinyGlobe data path if needed; for v1, main Globe only is acceptable.

## Open Questions
- Do we preload data on app load or lazy on submode entry? Recommendation: lazy on first entry, then cache.
- Should we unify naturalEvents overlay naming with hazard-specific overlays? Probably keep single overlay with type field.

## Work Breakdown (Architecture)
- Implement data hook (useGeoEvents) using provider helper and settings filter.
- Integrate hook into Globe for EcologicalDisasters submode.
- Wire legends and status badges into sidebars.
- Update GlobeEngine overlay to use provider or bypass overlay for now.

## Reference Patterns
- SpaceWeather sidebar layout: useSpaceWeatherSidebarLayout for active/passive data separation.
- CyberCommand sidebars: tabbed layout and collapse behavior to reuse for eco-disaster panels.

## Detailed Sequence (proposed wiring)
- Step 1: Detect submode change → set flag `isEcoDisasterActive`.
- Step 2: Start fetch via hook; set loading=true; emit telemetry fetch_start.
- Step 3: On success, transform to NaturalEvent[]; emit transform_success.
- Step 4: Apply settings filters; compute severity buckets; emit render.update with counts.
- Step 5: Update globeData; update legend state; set loading=false.
- Step 6: On error, set stale flag; keep previous data; emit fetch_failure.
- Step 7: On exit, clear globeData for hazard types; stop polling.

## Sidebar Architecture Notes
- Left: TinyGlobe + VisualizationModeInterface; add compact legend/status block under settings panel for eco disasters.
- Right: Tabbed layout (status/intel/controls/chat/apps/dev) driven by context; integrate eco-disaster widgets into status (counts, freshness) and intel (notables list) without disturbing other tabs.
- Collapse behavior via useCyberCommandRightSideBar; ensure added content respects collapsed state and uses existing CSS classes.

## Data Ownership in Components
- Hook (useGeoEvents) owns fetch/poll state and filtered dataset; exposes lastUpdated, stale, error.
- Globe component consumes filtered dataset and renders markers.
- Legend/sidebars consume derived counts and freshness.

## Error Surfaces
- Toast/inline banner on fetch failure.
- Legend badge for stale data.
- Optional right sidebar status warning chip.

## Configurability
- Endpoint selection could depend on severity toggles (e.g., use 4.5_day by default, all_day if minor enabled).
- Poll interval configurable via env (with sane floor); documented in perf/resilience.

## Threading & Async Considerations
- Avoid blocking main thread with heavy transforms; though small, keep transforms isolated and memoized.
- Consider requestAbort on mode switch to reduce wasted work.

## Dev Flags
- Feature flag to hide mode entirely.
- Mock data mode for volcanoes/wildfires; tie to UI badge.

## TinyGlobe Consideration
- If TinyGlobe should mirror main markers, reuse same filtered dataset and simplified styles; optional for v1.

## Safety Nets
- Guard rendering path with checks for lat/lng, type, and color to prevent runtime errors.
- Validate settings object before use; fallback to defaults.

## Potential Refactors
- Extract hazard-specific renderer (EarthquakeLayer) to isolate size/color logic.
- Abstract legend into reusable component shared with other modes.

## Operational Hooks
- Add debug console summary when entering mode (counts, lastUpdated).
- Add ability to trigger manual refresh from sidebar (status tab button).

## Testing Hooks
- Dependency inject fetcher into useGeoEvents for deterministic tests.
- Expose lastRequestInfo for assertions in integration tests.

## Migration Path for GlobeEngine
- Short term: bypass overlay; feed globeData directly.
- Medium term: update GlobeEngine naturalEvents overlay to rely on providerRegistry; emit overlayDataUpdated events for consumers.

## Known Constraints
- Right sidebar icons are aligned to 🌋; keep new components consistent.
- Existing space weather components expect spaceWeather layout; keep eco-disaster logic separate to avoid coupling.

## Non-Goals
- 3D volumetric effects or terrain deformation; keep to point markers and rings.
- Heavy clustering/tiling; only light thinning allowed in v1.

## Checklist Before Coding
- Confirm chosen data path (overlay vs direct) and update Globe accordingly.
- Confirm settings defaults flip to enable hazards.
- Plan legend placement in sidebars.
- Decide telemetry fields and wire to logger.
- Identify test fixtures needed and place under tests/fixtures.

## Code Touchpoints to Review
- Globe.tsx: globeData lifecycle, pointColor switch, initialization reset to empty array.
- GlobeEngine.ts: naturalEvents overlay uses legacy service; needs provider integration.
- useEcoNaturalSettings.ts: defaults currently disable quakes/volcanoes; update.
- VisualizationModeControls.tsx: icon mismatch for eco disasters; adjust to 🌋.
- SecondaryModeSelector.tsx: already uses 🌋; ensure consistent tooltip.
- CyberCommand sidebars: placeholders for eco content; add legend/status components.
