# Ecological Disasters Visualization – Integration Guide

## Goal
- Wire the EcoNatural → EcologicalDisasters submode end-to-end: settings → data fetch → transform → globe render → UI status.

## Trigger Points
- SecondaryModeSelector button (🌋) sets visualizationMode.subMode to EcologicalDisasters.
- useVisualizationMode context drives Globe and sidebars; Ecological Disasters icon now standardized to 🌋 across controls.

## Data Fetch Path
- Prefer DataManagerHelpers.getNaturalEventsData to fetch earthquakes/volcanoes via providerRegistry.
- GeoEventsDataProvider handles endpoints and transforms; subscribe with 5m polling.
- On submode entry: start fetch; optionally warm cache on app load.

## Transformation & Filtering
- Transform USGS FeatureCollection to NaturalEvent via provider method.
- Apply settings: hazard type toggles, severity buckets, timeRange window.
- Attach UI fields: color, size, altitude, label, severityBucket, isMock (for volcano).

## Injecting into Globe
- Option A: Update GlobeEngine naturalEvents overlay to use provider output, then listen in Globe component and push into globeData.
- Option B: Bypass overlay; fetch in component hook and set globeData directly when submode active.
- Ensure globeData filtered to entries with lat/lng; remove previous hazard markers on exit.

## Sidebars Integration
- Left sidebar (CyberCommandLeftSideBar): already shows TinyGlobe + VisualizationModeInterface; add small legend/count component below settings panel when submode is EcologicalDisasters.
- Right sidebar (CyberCommandRightSideBar): use tabs
  - Status tab: show counts, last updated, error/stale badges, export snapshot hook.
  - Intel tab: list top N recent major quakes/active volcanoes (future).
  - Controls tab: could mirror settings panel or show quick filters.
- Use SpaceWeather layout patterns (useSpaceWeatherSidebarLayout) as reference for active/passive data separation; replicate a minimal layout hook for eco disasters if needed.

## Legends and Status
- Legend data derived from current filtered markers; show severity colors and mock badge.
- Include last fetch time and stale indicator.

## Resource Monitor
- Register budgets under key EcoNatural.EcologicalDisasters (vector count ≈ marker count).
- Emit recordVectors/recordHeap as needed when marker set updates.

## Telemetry Hooks
- On fetch success/fail; include endpoint id and duration.
- On filter application; include counts before/after.
- On render update; log marker count and frame time sample if available.

## Error Handling
- Fetch failure: keep last-good data; show toast/banner + stale badge.
- Validation failure: drop payload; log counts.
- No data after filters: show empty-state and avoid rendering markers.

## Cleanup
- On submode exit: clear hazard markers from globeData; unsubscribe polling.
- Dispose of any generated geometry/material if custom meshes used for impact radius.

## Testing Touchpoints
- Integration tests: ensure submode switch triggers fetch once; markers rendered with expected types/colors.
- Snapshot tests for legend/states; mock provider responses.

## Dev/QA Notes
- Ensure right sidebar icon for EcologicalDisasters matches left selector to avoid user confusion.
- Keep controls responsive; avoid blocking render during CSV parse (wildfire backlog).

## Steps to Implement
1) Create useGeoEvents hook that wraps provider helper and settings filters.
2) In Globe component, when mode=EcoNatural && subMode=EcologicalDisasters, call hook and set globeData.
3) Add legend/status components in sidebars reusing existing layout styles.
4) Update GlobeEngine overlay or bypass per chosen path; ensure cleanup on exit.
5) Wire telemetry/resource monitor; set budgets.

## Rollout Considerations
- Guard with feature flag; default off until QA complete.
- Ensure defaults for earthquakes/volcanoes toggles are ON for launch.

## Known Gaps
- Volcano feed is mock; document clearly in tooltip and legend until replaced.
- Wildfire integration deferred; keep code paths modular for later add.

## References
- GeoEventsDataProvider implementation.
- CyberCommand sidebars for docking behavior and tab model.
- SpaceWeather controls for compact UI patterns.

## Detailed Wiring Steps (expanded)
- Add feature flag check around EcologicalDisasters submode rendering.
- Build useGeoEvents hook:
  - Accept settings (hazards, severity, timeRange).
  - Fetch via DataManagerHelpers or provider subscribe.
  - Expose { data, filtered, loading, error, lastUpdated, stale }.
- In Globe component:
  - When mode/submode matches and flag enabled, invoke hook.
  - On data change, map to globeData entries; set state once per batch.
  - On exit, remove hazard markers.
- In Legend component (new or reused):
  - Read filtered counts, hazard toggles, lastUpdated, stale.
  - Render color chips and badges.
- In Right Sidebar Status tab:
  - Show counts, freshness, error state, mock badge for volcano.
  - Provide manual refresh button (optional) calling hook refetch.
- In Settings panel (existing compact controls):
  - Ensure hazard toggles wired; flip defaults as per rollout.
- Update VisualizationModeControls icon to 🌋 to match selector.

## Data Flow Variants
- Variant 1 (preferred): direct fetch in React hook, bypass GlobeEngine overlay.
- Variant 2: fetch via GlobeEngine overlay naturalEvents; Globe listens to overlayDataUpdated; more reuse but requires overlay update.
- Document chosen variant and adjust tests accordingly.

## Cleanup and Lifecycle
- Store unsubscribe/interval handle from provider subscribe; call on unmount or submode change.
- Clear globeData subset by filtering out type in setState.
- Dispose of custom meshes (if rings built with geometry) to avoid leaks.

## Error/Retry Logic (expanded)
- On error, set error state and stale flag; schedule retry with backoff.
- Provide UI retry button in status tab; call refetch; reset backoff on success.

## Telemetry Injection Points
- fetch_start/fetch_success/fetch_failure inside hook.
- transform_success/failure inside mapper.
- render.update after globeData set.
- thinning_applied if marker count > cap.

## Performance Notes
- Use memoization for filtered data; only recompute when inputs change.
- Avoid setState per marker; set once with new array.

## Testing Hooks (expanded)
- Expose `__test_only` props in hook (e.g., inject fetcher, clock) for deterministic tests.
- Provide sample fixtures in tests/fixtures for integration tests.

## UI Cohesion with Sidebars
- Left sidebar: keep TinyGlobe + VisualizationModeInterface; add a small status chip row showing hazard counts.
- Right sidebar: follow existing tab spacing; use navBtn styles; keep collapse behavior intact.
- Ensure no overflow in collapsed state; hide heavy content when collapsed.

## Migration Notes for Existing Components
- VisualizationModeControls uses the 🌋 icon for EcologicalDisasters; ensure any new surfaces match.
- Map markers for EcologicalDisasters are color-coded spheres (no emoji icons); no further icon swaps required for overlays.
- Globe.tsx resets globeData to empty on init; ensure eco-disaster data repopulates after init.
- GlobeEngine naturalEvents overlay currently unused; decide whether to repoint or deprecate.

## Manual Verification Steps (integration)
- Switch modes rapidly (CyberCommand ↔ EcoNatural) and confirm no leaks or lingering markers.
- Toggle hazards and severity; ensure no duplicate fetches beyond expected.
- Simulate fetch failure; verify stale badge and no crashes.
- Verify counts match markers on screen after filters.

## Additional Notes on Sidebars
- Left sidebar styling (CyberCommandLeftSideBar.module.css) already accommodates TinyGlobe and settings; any added eco widgets should reuse spacing tokens to avoid drift.
- Right sidebar (CyberCommandRightSideBar) uses navBtn and collapsed state; ensure eco components hide or compress when collapsed.
- Status tab currently hosts space-weather cards; eco content should either reuse card style or introduce lightweight list/legend without heavy metrics.

## Deployment Hooks
- Ensure feature flag is read early to hide mode from selector if disabled.
- Provide env var override for dev to force enable even if flag disabled in config (with caution).

## Interop with TinyGlobe (optional)
- If TinyGlobe mirrors hazards, ensure data feed is lightweight (maybe only top N severity) to avoid perf hit.
- Use simplified marker sizes/colors consistent with legend.

## UX Copy Reminders
- Clarify mock data status in tooltips/legend to reduce confusion.
- Keep status text concise in sidebars to avoid overflow.

## Data Freshness Handling in UI
- Show last updated timestamp in status tab and legend; update on each success.
- When stale, show relative age (e.g., "Stale (17m)").
