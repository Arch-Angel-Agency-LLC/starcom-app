# Ecological Disasters Visualization – Settings

## Settings Inventory
- disasterTypes: earthquakes, volcanoes (plus wildfires/floods/droughts/hurricanes toggles for future).
- severity: showMinor, showMajor, showCatastrophic.
- timeRange: days (default 7).
- showImpactRadius: boolean; radiusOpacity slider.
- showEvacuationZones: placeholder toggle (future polygons).
- dataLayers: population density, infrastructure, environmental data (placeholders).

## Defaults
- Earthquakes: OFF in current default config (flip to ON for v1 release).
- Volcanoes: OFF in current default (turn ON once live feed or acceptable mock labeling).
- Severity: major and catastrophic ON; minor OFF to reduce noise.
- Time range: 7 days.
- Impact radius: ON, opacity 40.

## Behavior Mapping
- disasterTypes → include/exclude events by type before rendering.
- severity → apply bucket filter after bucketing logic; buckets defined in data-sources doc.
- timeRange → filter timestamp >= now - timeRange days.
- showImpactRadius → draw translucent rings on major/catastrophic events.
- radiusOpacity → adjust ring alpha; clamp 0–100.
- showEvacuationZones → reserved; currently no effect until zones available.
- dataLayers toggles → no-op until layers are built; keep for forward compatibility.

## Validation
- timeRange min 1, max 30 (configurable); clamp invalid input.
- radiusOpacity min 0, max 100; default 40.
- Toggle fields enforce boolean; coerce truthy/falsey to boolean.

## Persistence
- useEcoNaturalSettings stores in localStorage via settingsStorage.
- Debounced saves (500ms) already in hook; ensure new fields included.

## UI Layout (Compact)
- Hazard toggles (with icons) at top; show quick counts when data available.
- Severity checkboxes under a single section with concise labels.
- Time-range slider with live value label ("7 days").
- Display section for radius/evacuation toggles.
- Keep width ≤ existing SpaceWeather compact controls.

## Edge Cases
- All hazards off: show empty-state message; do not fetch until a hazard is on (optional optimization).
- All severity off: treat as "show none"; show warning badge.
- Time range extremely small: still show data if timestamp matches (e.g., recent quakes).
- Stale settings in storage: migration path via hook default merge.

## Migration Notes
- Flip defaults: set earthquakes/volcanoes to true for go-live; document in rollout.
- Remove unused legacy keys if any (none presently except spaceWeather typo migration already handled).

## Accessibility & UX
- Provide tooltips for each toggle describing effect.
- Use clear labels (Magnitude, Status) rather than jargon where possible.
- Respect reduced motion setting by disabling ring pulsation.

## Telemetry Hooks
- Emit setting_change events (type toggles, severity toggles, timeRange updates).
- Correlate with marker counts to measure filter impact.

## Testing
- Unit: setting persistence round-trip; default merge; validation clamps.
- Integration: toggling hazards updates rendered markers; timeRange changes counts appropriately.

## Future Fields (optional backlog)
- Depth filter for earthquakes (drop deeper than N km).
- Volcano activity level filter (Smithsonian-specific fields).
- Region/geofence filters.

## Implementation Checklist
- Ensure useEcoNaturalSettings includes any new defaults and migrations.
- Wire settings read into data filtering hook and globe mapping.
- Reflect active filters in legend summary text.

## Known Gaps
- Evacuation zones and dataLayers are placeholders; note in UI as coming soon.

## Open Questions
- Should timeRange be hours for short windows? (could allow units switch later.)
- Should we auto-enable volcanoes once live feed is present, or keep manual?

## Detailed Setting → Behavior Matrix
- earthquakes toggle: controls inclusion of type='earthquake'; hides legend entry when off.
- volcanoes toggle: controls inclusion of type='volcano'; shows mock badge when on and feed is mock.
- showMinor: removes minor bucket markers; may switch endpoint (all_day) off if false.
- showMajor: required for most markers; if false, count may drop to 0 quickly.
- showCatastrophic: if off, impact radius typically off too.
- timeRange: filters by timestamp; also influences choice of feed (future optimization).
- showImpactRadius: toggles ring rendering for major/catastrophic.
- radiusOpacity: scales ring opacity; 0 hides even if toggle on.
- showEvacuationZones: placeholder; future polygons.
- dataLayers toggles: placeholders; no-op but persisted for forward compatibility.

## Migration/Defaults Plan
- Flip earthquakes and volcanoes defaults to true for launch; document in rollout.
- Keep severity defaults (major/catastrophic true, minor false) to control noise.
- Keep timeRange 7d; consider 3d if performance requires.

## UI Copy Suggestions
- Earthquakes: "Show earthquakes (USGS live feeds)"
- Volcanoes: "Show volcanoes (mock data until live feed)"
- Minor/Major/Catastrophic: include magnitude ranges in helper text.
- Time range: "Display events from the last X days".
- Impact radius: "Show approximate impact radius for major events".

## Validation Examples
- timeRange input 0 → clamp to 1.
- timeRange input 90 → clamp to 30.
- radiusOpacity -10 → clamp to 0.
- radiusOpacity 150 → clamp to 100.

## Persistence Notes
- Debounced save at 500ms; ensure new fields included in saved object.
- On schema changes, add migrations in settingsStorage options if needed (currently version 1).

## Settings Event Logging (suggested)
- settings.changed { key, value, previous }
- settings.reset_submode { subMode }
- settings.reset_all when user hits reset button (if added).

## Edge Scenario Handling
- User disables all hazards: show message "Turn on a hazard to see events"; optionally pause polling.
- User disables all severity: show warning and empty legend; keep data cached.
- User sets timeRange small but feed already filtered to 1d: still apply filter; may yield zero; show empty state.

## Testing Pointers
- Verify defaults after clearing localStorage: hazards ON (when flipped), severity major/catastrophic ON, minor OFF.
- Verify toggles persist after reload.
- Verify clamp behavior with invalid numeric inputs.

## Future Additions
- Depth slider for earthquakes.
- Activity-level filter for volcanoes (e.g., based on alert level if feed provides).
- Region filters (bbox) for focused monitoring.

## Operational Guidance
- For incident response, provide a quick reset button to defaults in the settings UI.
- Add tooltip explaining mock data where relevant.

## Accessibility Notes
- Provide aria-labels for all toggles and sliders.
- Ensure slider can be adjusted via keyboard.

## Dependencies to Update When Changing Settings Schema
- tests covering persistence and defaults.
- telemetry events capturing changes.
- rollout docs referencing defaults.

## Additional Edge Behaviors
- When feature flag off, settings UI for eco disasters should hide to avoid confusion.
- When user resets all settings, ensure eco disasters return to launch defaults (hazards on, major/catastrophic on).
- When storage is unavailable (private mode), fall back to in-memory settings without erroring.

## Copy/Label QA
- Check that volcano toggle explicitly notes mock data until live feed.
- Check that severity labels include magnitude ranges in helper text.
- Check that time-range label indicates units (days).
