# Ecological Disasters Visualization – Overview

## Purpose
- Provide a unified globe-centric view of natural disasters with emphasis on earthquakes and volcanoes for v1.
- Enable rapid situational awareness, triage, and briefing-ready visuals.
- Expose filters and overlays that respect analyst workflows without overwhelming the UI.

## Personas and Journeys
- Analyst: needs quick magnitude filtering, location drill, and sharing snapshots.
- Operations lead: needs alerting posture, impact radius cues, and readiness to trigger playbooks.
- Executive/briefing: needs clean summary with low cognitive load and confidence cues.
- Developer/SRE: needs observability and predictable behavior under load and failures.

## Scope (v1)
- Hazards: earthquakes, volcanoes. Wire hooks for wildfires; stub for floods/droughts/hurricanes.
- Globe rendering: point markers with hazard-specific styling and optional impact radius.
- Data: USGS feeds for quakes; mock or Smithsonian-style volcano feed; optional NASA FIRMS in backlog.
- Interactions: hover tooltip, click focus, legend, settings-driven filters.

## Out of Scope (v1)
- Full wildfire smoke plumes, flood polygons, hurricane tracks.
- Predictive modeling beyond feed data.
- Heavy clustering UI; keep minimal declutter rules only.

## Success Criteria
- Time to first marker: < 3s on broadband, < 8s on 4G, with cached texture.
- Marker correctness: 100% lat/lng positioning; magnitude/significance mapped within defined buckets.
- Stability: no unbounded growth of materials/geometries; memory within budget.
- UX: hover/click latency < 150ms; legend present and accurate; settings persist.

## KPIs
- Fetch success rate per feed; error rate < 1% over 24h.
- Rendered marker count vs. filtered count; declutter effectiveness.
- Average render time for N markers (target N=500) < 120ms on desktop.
- User interactions: % sessions using severity filter; % using time-range slider.

## Risks and Assumptions
- USGS feed availability and rate limits; assume public unauthenticated access.
- Volcano source may be mock; need clear labeling to avoid misleading analysts.
- Mobile performance may require aggressive limits; assume desktop primary.
- Preexisting Globe texture load time dominates initial latency.

## Storyboard (demo narrative)
- User selects EcoNatural → EcologicalDisasters (🌋), sees quake markers appear.
- User toggles volcanoes on; purple markers appear with last eruption info.
- User narrows time range to 24h; older quakes fade out.
- User hovers marker to see magnitude, depth, timestamp; clicks to focus view.
- User exports current view or shares snapshot for briefing.

## High-Level Flow
1) Submode switch triggers data fetch (quakes, volcanoes) through providerRegistry.
2) Data transformed to `NaturalEvent` and filtered by settings (hazard type, severity, time range).
3) Globe data populated with hazard-specific styling and optional radius visuals.
4) UI components show legends, counts, and status; telemetry/logs emitted.

## Integration Anchor Points
- VisualizationModeInterface: submode button (🌋) activates flow.
- useEcoNaturalSettings: persistent toggles drive filtering.
- Globe: consumes transformed points, colors by type.
- SpaceWeather sidebars: pattern reference for docking controls; reuse layout ideas.

## Acceptance Gates
- All success criteria validated in staging with recorded feeds.
- Accessibility pass (contrast, keyboard focus) on core interactions.
- Telemetry wired for fetch success/fail and marker counts.
- Rollout flag exists and defaults off until QA sign-off.

## Future Extensions
- Live volcano feed integration (Smithsonian GVP or other) with activity levels.
- Wildfire and hurricane layers with polygons and tracks.
- Clustering and heatmap toggle for dense quake regions.
- Per-event details drawer with linked external sources.

## Open Questions
- Do we cap maximum quake age when time range is large to prevent overload?
- Should we animate active volcanoes differently (pulse vs. halo)?
- What is acceptable polling cadence given USGS feed guidance?
- Do we need offline cache for disconnected environments?

## Dependencies
- Provider registry for geo-events wired to UI.
- GlobeEngine texture readiness and material reuse.
- Settings storage functioning for EcoNatural config.
- Telemetry pipeline available for logging.

## Non-Functional Constraints
- ASCII-only copy where possible; avoid heavy assets in docs.
- Keep marker colors consistent with existing legend palette.
- No blocking main thread during data parsing; stream where feasible.
- Respect pre-push hook requiring version bump before release.

## Deliverables (doc set)
- Data sources mapping and transformer spec.
- Architecture and integration guide.
- Rendering/UX spec with accessibility.
- Settings mapping and validation.
- Testing plan, perf/resilience, telemetry, rollout, glossary.

## Summary
- This mode complements SpaceWeather by covering ground hazards.
- Must be clear, performant, and truthful about data provenance.
- The doc set below drives implementation, testing, and rollout.

## Detailed Scenarios (expanded)
- Scenario 1: User opens app, switches to EcoNatural → EcologicalDisasters, waits for data; verify first render under target time.
- Scenario 2: User toggles earthquakes ON (default) and volcanoes ON; legend updates and counts match markers.
- Scenario 3: User disables volcanoes; only quake markers remain; legend removes volcano entry.
- Scenario 4: User shortens time range from 7d to 1d; markers drop accordingly; last-updated badge stays unchanged.
- Scenario 5: User disables minor severity; minor quakes vanish; major/catastrophic remain.
- Scenario 6: User re-enables minor; counts return; no duplicate markers.
- Scenario 7: User clicks a marker; camera focuses; tooltip persists; ESC or background click closes.
- Scenario 8: User hovers multiple markers quickly; tooltips stay responsive; no memory leak.
- Scenario 9: User with prefers-reduced-motion sees no pulses but sees static halos.
- Scenario 10: User triggers feature flag OFF; mode disappears from selector.
- Scenario 11: Network offline; stale badge appears; last-known markers stay.
- Scenario 12: USGS feed returns malformed JSON; error logged; UI shows warning; no crash.
- Scenario 13: Volcano feed unreachable; quakes still render; volcano legend entry shows stale/mock note.
- Scenario 14: User exports snapshot (future); mock badge included in export metadata.
- Scenario 15: Mobile viewport; legend collapses; marker size scaled down.
- Scenario 16: User opens right sidebar status tab; sees counts and timestamps matching legend.
- Scenario 17: User opens intel tab; sees alert list (future placeholder) without breaking layout.
- Scenario 18: User opens controls tab; sees compact settings or placeholder.
- Scenario 19: User toggles impact radius OFF; rings vanish immediately.
- Scenario 20: User sets time range to max (30d); thinning engages when count exceeds cap.

## Detailed KPIs (expanded)
- First meaningful paint for hazard markers ≤ 3s broadband, ≤ 8s 4G.
- Hover-to-tooltip latency ≤ 150ms average.
- Error rate < 1% for fetch; validation failures logged with counts.
- Telemetry coverage: 100% of fetches and render updates captured.
- Resource budget adherence: marker cap respected; warnings emitted on overage.
- Accessibility: contrast ratios met; keyboard navigation supported on legend and settings.

## Edge Conditions to Consider
- Duplicate event IDs across feeds (unlikely but defend): de-duplicate by id+timestamp.
- Quake without magnitude but with significance: render with default size; include sig in tooltip.
- Volcano without last_eruption: show "unknown".
- Time skew: device clock off; rely on feed timestamps in UTC.
- Low confidence wildfire (if enabled later): filtered out by threshold.

## Dependencies and Ownership (expanded)
- Data providers: GeoEventsDataProvider owner; ensure SLA for uptime.
- UI: EcoNatural visualization owner; sidebars owner (shared with SpaceWeather team).
- Telemetry: platform observability owner.
- QA: assigned tester for EcoNatural modes.

## Roadmap Notes
- v1.0: quakes + volcanoes; minimal declutter.
- v1.1: clustering/heatmap option; depth-based styling; volcano live feed.
- v1.2: wildfires integration with confidence filtering and optional polygons.
- v1.3: flood/hurricane overlays with tracks and polygons.

## Validation Matrix (high-level)
- Platforms: Chrome/Edge latest, Firefox latest, Safari latest; desktop primary, smoke on mobile.
- Inputs: mouse, touch, keyboard.
- Network: offline, slow 3G, normal broadband.
- Data volumes: small (<=20 markers), medium (~200), large (~800+ with thinning).
- Modes: EcoNatural/EcologicalDisasters only; ensure other modes unaffected when switching away.

## Rollback Cues
- Spike in fetch_failure telemetry.
- Render update durations exceeding budget persistently.
- User reports of missing markers despite feed availability.
- Memory growth across mode switches.

## Stakeholder Questions to Answer
- What is the acceptable freshness threshold before marking data stale? (e.g., 15 minutes)
- Do we need email/SMS alerts tied to catastrophic events? (out of scope v1)
- Should TinyGlobe also show eco-disaster markers? (optional)
- Do we need per-region opt-outs? (not for v1)

## Documentation Cross-Links
- See data-sources for feed mapping and severity rules.
- See rendering-ux for marker palette and interactions.
- See integration for wiring steps.
- See testing for validation coverage.
- See rollout for flagging and QA gates.
