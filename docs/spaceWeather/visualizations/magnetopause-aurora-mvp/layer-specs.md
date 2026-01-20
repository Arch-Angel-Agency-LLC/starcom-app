# Layer Specs

## Purpose
- Define per-layer payload schemas, visual defaults, toggles, and behavioral rules for the MVP overlays.
- Provide constraints and budgets so implementations remain performant and consistent.

## Layer: Magnetopause Shell
- Overlay ID: spaceWeatherMagnetopause.
- Payload schema: { standoffRe: number, lastUpdated: iso, quality: 'live'|'fallback'|'stale', clamped?: boolean, meta?: object }.
- Visual defaults: cool hue (e.g., teal), opacity 0.3-0.45, subtle rim lighting, thickness proportional to standoff (min thickness clamp).
- Geometry: scaled sphere/ellipsoid at standoff radius; minor dayside-nightside asymmetry optional later.
- Interaction: toggle on/off; hover optional for later; display lastUpdated and standoff value in HUD.
- Performance budget: <5k vertices; rebuild only on payload change.

## Layer: Bow Shock Shell
- Overlay ID: spaceWeatherBowShock.
- Payload schema: { radiusRe: number, lastUpdated: iso, quality: 'live'|'fallback'|'stale', clamped?: boolean, meta?: object }.
- Visual defaults: warm hue (amber), opacity 0.25-0.35, outer glow possible; must remain visually distinct from magnetopause.
- Geometry: scaled sphere/ellipsoid larger than magnetopause by enforced delta.
- Interaction: toggle; HUD shows radius and status; no dense tooltips in MVP.
- Performance budget: <5k vertices; reuse material where possible.

## Layer: Auroral Oval + Blackout Mask
- Overlay ID: spaceWeatherAurora.
- Payload schema: { oval: { north: LatLng[], south: LatLng[] }, kp: number, blackout: { gradient: params, threshold: number }, lastUpdated: iso, quality: 'live'|'fallback'|'stale', meta?: object }.
- Visual defaults: additive green with soft falloff; blackout mask as dark overlay tinted subtly; opacity tied to Kp.
- Geometry: ribbon/mesh following provided lat/long path; altitude offset for atmospheric layer.
- Interaction: toggle; HUD shows Kp, resolution or source (live polygon vs modeled), lastUpdated.
- Performance budget: <8k vertices total for both ovals; simplify if point count exceeds budget.

## Shared Metadata
- Every payload carries lastUpdated ISO string, quality flag, optional clamped flag, and source identifier (live vs modeled vs cached).
- OverlayDataUpdated must fire even on fallback to keep UI consistent.

## Toggles and Defaults
- Tied to useEcoNaturalSettings: showMagnetopause, showSolarWind (for bow shock input), showAuroralOval.
- Default state: all three off; presets may enable them in higher modes but MVP uses manual toggles.

## Visual Styling Rules
- Colors and opacities configurable via constants; documented defaults per layer.
- Depth ordering: aurora under magnetopause, bow shock outermost; set renderOrder accordingly.
- Blending: aurora uses additive, shells use standard alpha blend with depth write on and depth test on; apply depth bias to reduce artifacts.

## Error and Loading States
- When stale or fallback: desaturate color slightly and add subtle dashed rim if available; optional HUD badge.
- When loading: fade-in placeholder shell/oval with pulsing opacity capped at low intensity.
- When error: hide geometry or render dimmed placeholder; emit overlayDataError with reason.

## HUD Alignment
- Fields shown: standoff radius (Re), bow shock radius (Re), Kp, lastUpdated per layer; status badge for quality.
- Consistent formatting: one decimal for radii, integer for Kp, time in local timezone.

## Constraints and Budgets
- Geometry vertex caps as above; payload size under 50 KB per overlay update.
- Update frequency capped to 5-minute cadence; no per-second updates in MVP.

## Extensibility
- Hooks for future additions: IMF field lines, current systems, dynamic asymmetry models.
- Allow alternate color themes via config without code changes.
