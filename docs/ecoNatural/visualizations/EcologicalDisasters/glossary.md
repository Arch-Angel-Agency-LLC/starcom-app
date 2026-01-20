# Ecological Disasters Visualization – Glossary

## Hazard Types
- earthquake: Seismic event from USGS feeds; includes magnitude, significance, depth.
- volcano: Volcanic site/activity; status may be active/dormant/extinct.
- wildfire: Heat detection from FIRMS (backlog for v1).
- flood/drought/hurricane: Planned future hazards; currently placeholders.

## Key Fields
- id: Stable identifier from feed (USGS id, volcano name/id).
- lat/lng: Latitude/Longitude in decimal degrees.
- magnitude (mag): Earthquake magnitude (USGS provided).
- significance (sig): USGS significance score; used for severity.
- status: Feed-specific status (e.g., USGS status, volcano active/dormant).
- timestamp: Event time in ISO string (UTC).
- description/title: Human-readable summary from feed.
- intensity: Generic field for severity (e.g., wildfire brightness) when mag not present.

## Severity Buckets (for visualization)
- minor: mag < 4.5 or sig < 400; dormant volcano.
- major: 4.5 ≤ mag < 6.5 or 400 ≤ sig < 900; active volcano baseline.
- catastrophic: mag ≥ 6.5 or sig ≥ 900; highly active volcano.

## Settings Terms
- disasterTypes: Toggles per hazard type.
- severity toggles: showMinor/showMajor/showCatastrophic.
- timeRange: Days of history to display.
- showImpactRadius: Toggle to render radius around major/catastrophic events.
- radiusOpacity: Opacity of impact radius.

## UI Elements
- VisualizationModeInterface: Primary/secondary mode selector (🌋 for EcologicalDisasters).
- Legend: Explains marker colors/sizes and freshness badge.
- Tooltip: Hover/click detail card with event info.
- Status tab: Right sidebar section for counts and freshness.

## Data Components
- GeoEventsDataProvider: Provider for geo hazard feeds (quakes, volcanoes, wildfires).
- DataManagerHelpers.getNaturalEventsData: Convenience fetch wrapper.
- NaturalEvent: Unified event shape used in rendering pipeline.

## Rendering Terms
- marker: Point rendered on globe with color/size per hazard.
- altitude: Small lift above globe surface to avoid z-fighting.
- pulse: Animation for active/high-severity events; disabled when reduce-motion.
- declutter/thinning: Dropping or filtering markers when count exceeds budget.

## Telemetry Terms
- fetch_success/failure: Outcome of data fetch.
- transform_success/failure: Outcome of mapping raw feed to NaturalEvent.
- render.update: Marker render update event with counts.
- stale: Data rendered from last-good fetch after failure.

## Status/Badges
- stale badge: Indicates data age beyond threshold or last fetch failure.
- mock badge: Indicates volcano data is placeholder.

## Known Icons
- 🌋 EcologicalDisasters (preferred consistent icon).
- Icon aligned: Ecological Disasters now uses 🌋 across selector and sidebars.

## References
- USGS GeoJSON feed documentation.
- NASA FIRMS docs.
- Smithsonian GVP (candidate volcano source).

## Notes
- All times displayed in UTC unless specified.
- Depth unit (when displayed) is kilometers.
- Severity buckets are visualization-only; source data remains unchanged.

## Additional Terms
- BasicCacheService: simple TTL cache used by providerRegistry for geo-events.
- providerRegistry: central registration of data providers (including GeoEventsDataProvider).
- DataManagerHelpers: helper class exposing getNaturalEventsData.
- globeData: array of point objects consumed by Globe component for rendering.
- SpaceWeatherSidebarLayout: pattern used for active/passive data separation; referenced for eco disasters layout ideas.

## Icons and Labels
- 🌋 EcologicalDisasters (preferred icon across UI).
- 🌋 Icon now consistent across selector, sidebar, and settings.
- 📡 Status tab icon in right sidebar.
- 🎯 Intel tab icon.
- 🎛️ Controls tab icon.
- 💬 Chat tab icon.
- 🚀 Apps tab icon.
- 🔧 Developer tab icon (dev-only).

## Event Types in Code
- overlayDataUpdated: GlobeEngine event emitted when overlay data changes.
- overlayDataLoading: GlobeEngine event emitted when overlay fetch starts.
- overlayRemoved: GlobeEngine event emitted when overlay removed from scene.

## Data Quality Terms
- stale: data older than freshness threshold or last fetch failed.
- mock: data synthesized or sample, not live feed (volcanoes currently).
- validation_failed: payload rejected due to schema mismatch.

## Rendering Terms (extended)
- pointColor: function in Globe assigning colors based on marker type.
- pointAltitude: height above globe surface for point markers.
- impact radius: visual ring around major/catastrophic events.
- pulse: animation effect for active/high-severity markers.

## Severity References
- significance (sig): USGS score combining magnitude, felt reports, etc.; used for severity bucket.
- depth: quake depth in kilometers; may appear in tooltip but not driving bucket in v1.

## Settings Field References
- showImpactRadius: toggle for drawing rings.
- radiusOpacity: opacity percentage for rings.
- showEvacuationZones: placeholder toggle for future polygons.
- dataLayers.showPopulationDensity: placeholder boolean for future overlays.

## Telemetry Keywords
- fetch_success / fetch_failure
- transform_success / transform_failure
- render.update
- render.thin_applied
- settings.changed

## Glossary Usage Guidance
- Keep definitions succinct and consistent across docs.
- Update when new hazards or fields are added.

## Abbreviations
- USGS: United States Geological Survey.
- GVP: Global Volcanism Program.
- FIRMS: Fire Information for Resource Management System.
- FMP: Feature Mapping Pipeline (if referenced in code comments).
- TTL: Time to live (cache expiry).
- KPI: Key Performance Indicator.

## Region Terms (optional future filters)
- bbox: bounding box region filter expressed as lat/lng min/max.
- ROI: region of interest selected by user (future interaction idea).

## Status Codes (feed-specific examples)
- USGS status: automatic, reviewed.
- Volcano status: active, dormant, extinct (mock schema).

## Data Age Terms
- freshness: time since last successful fetch.
- stale threshold: age at which data considered stale (2x polling interval recommended).

## Visualization Modes (context)
- EcoNatural: primary mode for natural/environmental data.
- EcologicalDisasters: secondary submode for hazards (current focus).
- SpaceWeather: sibling submode for solar/geomagnetic data.
- EarthWeather: sibling submode for atmospheric data.

## UI Layout Terms
- navBtn: button style used in right sidebar navigation.
- collapsed: state of right sidebar when width reduced.
- compact: small-footprint mode for controls (as in VisualizationModeInterface).

## Misc
- tooltip: hover/click info bubble with event details.
- legend: UI element explaining colors/symbols used on globe.
