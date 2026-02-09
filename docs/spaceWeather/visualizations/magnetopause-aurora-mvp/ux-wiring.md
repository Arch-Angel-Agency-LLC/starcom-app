# UX Wiring

## Purpose
- Describe how user controls, settings, and HUD elements connect to the new space weather overlays.
- Ensure consistent behavior between globe render state and sidebar/passive cards.

## Settings and Toggles
- useEcoNaturalSettings fields: showMagnetopause, showAuroralOval, showSolarWind (for bow shock input path).
- Default state: off; advanced presets may turn on in future, but MVP relies on manual toggles.
- Toggling a layer enables fetch, mapping, and render; disabling tears down meshes and stops polling where safe.

## Overlay Activation Flow
1. User toggles layer on.
2. Emit overlayDataLoading; perform immediate fetch and mapping.
3. On success, overlayDataUpdated with payload; GlobeEngine renders geometry; HUD updates timestamps.
4. On failure, overlayDataError and fallback payload emitted; HUD shows degraded state.

## HUD and Passive Cards
- Fields to show: standoff radius (Re), bow shock radius (Re), Kp, lastUpdated, quality badge (live/fallback/stale).
- Formatting: one decimal for radii, integer Kp, local time for timestamps.
- Loading: show placeholder values or spinner in passive cards.
- Errors: display small badge (e.g., "degraded") without blocking other content.

## Consistency Rules
- HUD reads the same overlay payload metadata that drives the globe; no duplicated state.
- When overlay disabled, HUD section hides or shows "Off" state without stale values.
- Stale or fallback states are visually distinct but not alarming; color desaturation only.

## Interaction Scope (MVP)
- No per-vertex hover or click; interactivity limited to toggles and reading HUD values.
- Legends: minimal legend explaining colors for shells and aurora; placed near space weather UI.
- Motion reduction: optional setting to reduce aurora pulse if animations added.

## Loading/Error States
- Loading: subtle shimmer on cards; globe may show faint placeholder shells/oval at low opacity.
- Error/fallback: badge plus muted color; still render fallback geometry to avoid holes in scene.

## Accessibility
- Color contrast: ensure HUD text contrast meets basic readability; offer alternative color theme later.
- Motion: keep animations subtle; honor reduce-motion preference when available.
- Text: concise labels and units; avoid jargon without tooltips.

## Telemetry in UI
- Surface freshness age (e.g., "Updated 3m ago").
- Indicate data source if multiple providers are added later (e.g., "NOAA live" vs "modeled").

## Edge Cases
- Rapid toggle spam: debounce to avoid redundant fetch/render; ensure disable stops pending rebuilds.
- Mixed states: allow magnetopause on while aurora off; no coupling in UI beyond shared cadence.
- Network loss: show degraded state but keep previous geometry until a timeout expires.

## Extensibility
- Future hover tooltips: allow per-layer metadata to populate simple value readouts.
- Presets: tie presets to grouped toggles (e.g., storm mode enabling all three layers) with clear labels.
