# Ecological Disasters Visualization – Rendering & UX

## Visual Language
- Earthquakes: red hues; size scaled by magnitude; optional subtle altitude to avoid overlap.
- Volcanoes: purple hues; pulse for active; dormant static; extinct hidden by default.
- Future wildfires: orange; optional glow; not primary in v1.
- Impact radius (optional): translucent ring with adjustable opacity; only for major/catastrophic.

## Marker Styling
- Base size: mag-based (e.g., 0.2 + mag*0.05 capped) with floor for unknown mag.
- Altitude: slight lift to reduce z-fighting; keep low for readability.
- Border/halo: thin outline for contrast on bright textures.
- Animated pulse: active volcanoes and high-severity quakes; respect reduce-motion preference.

## Legend
- Legend entries for earthquake minor/major/catastrophic and volcano active/dormant.
- Include data freshness badge (last updated hh:mm:ss UTC).
- Clarify mock data for volcanoes until live feed.

## Interaction Model
- Hover: tooltip with location, magnitude, depth (km), time (UTC), status, source link.
- Click: focus/center camera, persist tooltip; optionally open details card in sidebar.
- Keyboard: tab through legend items and markers; enter to open tooltip.
- Mouse/touch: tap opens tooltip; second tap closes or defocuses.

## Declutter / Clustering
- Simple declutter: drop or fade lowest severity when marker count > budget (e.g., 500).
- Optional grid thinning for dense regions (reuse sampling logic from space weather if available).
- Avoid heavy clustering visuals in v1; leave hook for future heatmap.

## Animations
- Pulse period ~1.5s for active events; amplitude small to avoid distraction.
- Fade-in on data refresh; avoid full re-animate when only filters change.
- Respect prefers-reduced-motion: disable pulses and fade.

## Tooltips & Details
- Tooltip fields: Title/Location, Magnitude, Depth (if available), Time (UTC), Source.
- Volcano tooltip: status (active/dormant), last eruption date, elevation, region.
- Include mock disclaimer on volcano tooltip until live feed.

## Controls (Settings UI)
- Hazard toggles (earthquake/volcano) with icons and status indicator.
- Severity checkboxes and time-range slider; show resulting filter summary (e.g., "Showing 42 in last 24h").
- Impact radius toggle and opacity slider; evacuation zone toggle placeholder.
- Consistent compact layout following SpaceWeather settings component style.

## Accessibility
- Color contrast: ensure markers/legend meet WCAG against globe background; add outline.
- Keyboard focus: visible focus ring on legend entries and markers (when feasible).
- Tooltips accessible via keyboard; avoid hover-only affordances.
- Motion reduction: disable pulses/animations when user prefers reduced motion.

## Layout Integration
- Left sidebar: can host mini legend or quick counts under TinyGlobe.
- Right sidebar: Status tab can show counts, freshness, and alerts; Intel tab can show notable events list.
- SecondaryModeSelector icon alignment: use consistent 🌋 icon across UI.

## Error and Empty States
- No data: show "No events in selected window" in legend area; hide markers.
- Stale data: badge with time since last success; tooltip note.
- Fetch error: non-blocking toast + legend banner; retain last-known-good markers.

## Mobile/Responsive
- Reduce marker size and disable pulses on small screens.
- Collapse legend into toggleable drawer.
- Limit marker count more aggressively on mobile.

## Performance Considerations
- Reuse materials/geometry; avoid per-marker new materials on each refresh.
- Batch updates to globeData; replace array once per refresh after filtering.
- Avoid heavy text labels; rely on tooltips.

## Camera Behavior
- On click focus: smooth pan/zoom to marker; clamp altitude to avoid inside-earth view.
- Optional "Fit active events" button for quick framing.

## Snapshot/Export
- Provide hook for snapshot (image) or shareable state (filters + view) for briefing.
- Indicate mock data in exports until live volcano feed.

## QA Checklist (UX)
- Legend matches marker colors and counts for each severity bucket.
- Tooltip shows correct time zone and magnitude formatting.
- Reduce-motion tested; pulses off.
- Stale badge appears when feed fails.

## Open Questions
- Should we render depth as color gradient instead of tooltip-only? (defer v1)
- Do we need cluster labels for dense quake swarms? (maybe v1.1)

## References
- SpaceWeather UI patterns for compact controls and metrics cards.
- Three-globe marker color/altitude conventions already used in Globe.

## Extended Rendering Checklist
- Verify marker colors match legend for all severity buckets.
- Verify pulse animation only on active/high-severity events and disabled when prefers-reduced-motion.
- Verify impact radius visibility toggles correctly and respects opacity slider.
- Verify marker altitude prevents z-fighting without excessive hover distance.
- Verify tooltips show correct UTC time and magnitude formatting.
- Verify volcano mock disclaimer appears where applicable.
- Verify legend freshness badge updates after each successful fetch.
- Verify stale badge appears after fetch failure or age threshold exceedance.
- Verify keyboard focus ring on legend elements.
- Verify hover and click interactions do not conflict with orbit controls.

## Detailed Tooltip Field List
- Title/Location: human-readable place or volcano name.
- Type: earthquake/volcano.
- Magnitude (quakes) with one decimal.
- Depth (km) if available.
- Significance score (sig) if available.
- Status (e.g., reviewed/automatic; active/dormant for volcano).
- Timestamp in UTC and relative time (e.g., 2h ago).
- Source (USGS/volcano feed/mock).

## Interaction Edge Cases
- Multiple markers near cursor: ensure tooltip targets closest/highest severity first.
- Clicking the same marker twice should toggle persistence or refocus without duplicates.
- Rapid filter changes should not flash tooltips; close or refresh smoothly.
- Switching submodes should clear eco-disaster tooltips and legend.

## Legend Content Ideas
- Color chips with labels: Earthquake (minor/major/catastrophic), Volcano (active/dormant).
- Count badges per category.
- Data age indicator and last fetch timestamp.
- Mock data badge for volcanoes until live feed.

## Layout Slots (sidebars)
- Left sidebar: compact legend + quick filters (hazards/severity) under TinyGlobe.
- Right sidebar Status tab: counts, freshness, error/stale alerts, export button (future).
- Right sidebar Intel tab: list top N recent major quakes/volcanoes with timestamps (future).

## Animation Parameters (suggested)
- Pulse speed: 1.5s period; easing sine in/out.
- Pulse scale: base 1.0 to 1.15 for active volcano; 1.0 to 1.1 for catastrophic quakes.
- Fade-in duration on data refresh: 250ms.
- Respect prefers-reduced-motion: set pulse amplitude 0 and disable fade.

## Declutter Rules (visual)
- Drop or fade minor markers first when exceeding cap.
- Optionally reduce opacity of minor markers when majors present nearby.
- Avoid overlapping impact rings; limit radius rendering to top N highest severity.

## Mobile Considerations (expanded)
- Increase tooltip font size; keep single-line summary plus a tap for details.
- Disable hover behavior; rely on tap.
- Keep legend collapsible; default collapsed on small screens.

## Accessibility Additions
- ARIA labels on buttons and legend toggles.
- Ensure tooltip content is reachable via keyboard (e.g., focusable marker proxy).
- Provide text equivalents for color coding in legend.

## Visual QA Cases
- Dark vs. light globe textures: check color contrast on both.
- High-density swarm: ensure thinning/declutter kicks in; legend counts remain accurate.
- Stale state: badge visible, tooltip note present.
- Mock state: badge visible for volcano markers and legend.

## Open UX Questions
- Do we need a mini timeline scrubber for quakes? (likely later).
- Should impact radius scale with magnitude (e.g., log scale)? (consider v1.1).
- Should we allow user to toggle depth coloring? (future option).
