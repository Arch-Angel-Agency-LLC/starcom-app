# Data Processing Models

## Goals
- Specify deterministic conversions from raw space weather inputs to renderable geometry parameters.
- Define validation, clamping, and smoothing strategies per dataset.
- Provide testable formulas and reference values for magnetopause, bow shock, and auroral ovals.

## Inputs and Symbols
- Solar wind speed (V, km/s), density (N, cm^-3), temperature (T, K).
- Dynamic pressure (Pdyn, nPa) derived from V and N.
- IMF Bz (nT).
- Kp index (0-9 scale, may be estimated nowcast).
- Optional upstream oval polygons (north/south) if provided by API.

## Magnetopause Standoff Model
- Compute Pdyn from N and V using standard relation (document units to avoid mistakes).
- Standoff radius Rmp in Earth radii: use canonical fit Rmp = a * Pdyn^(-1/6); choose coefficient a based on literature (e.g., 10.22 Re nominal) and document source.
- Clamp Rmp to [5, 25] Re to prevent pathological renders; flag if clamped.
- Apply Bz adjustment term if required: Rmp_adj = Rmp + k * Bz for modest tail influence (keep optional, default off for MVP unless validated).
- Provide sample table: Pdyn values vs expected Rmp outputs for tests.

## Bow Shock Model
- Use empirical relation: Rbs = b * Pdyn^(-1/6) + offset; select b and offset to maintain separation from magnetopause (e.g., 1.3-1.5 Re larger).
- Clamp Rbs to [7, 35] Re and ensure Rbs > Rmp by at least delta_min (e.g., 1 Re); if violated, enforce delta.
- Color and thickness derived from Pdyn intensity bins; no effect on radius calculation.
- Provide reference cases for unit tests: given Pdyn, expect Rmp and Rbs pair.

## Oval Scaling Model (Kp-driven)
- Derive oval latitude boundaries from Kp using standard mapping table (e.g., equatorward boundary latitude for north: 80 - c*Kp where c is slope); specify numeric slopes for day/night sides.
- Model day-night asymmetry: apply small shift for noon-midnight difference; document factors.
- Create north and south ovals as sequences of lat/long points; ensure closure and winding consistency.
- Apply smoothing (e.g., Gaussian or moving average over angles) to avoid jagged ribbons.
- Provide per-Kp reference outputs: latitudinal extents for Kp 1, 3, 6, 8.

## Blackout Mask Model
- Define blackout zones for high Kp thresholds: when Kp >= 7, expand mask; tie opacity to Kp.
- Compute a raster or coarse grid opacity map; default to annular band between equatorward and poleward boundaries with gradient falloff.
- Keep payload compact: store control points plus gradient rules, not full textures.

## Coordinate Handling
- Convert magnetic or AACGM coordinates to geographic lat/long if upstream provides magnetic coordinates; document the assumed transform or note stub if not yet implemented.
- Normalize longitudes to [-180, 180] and ensure seams at the dateline are handled by duplicating endpoints.
- Altitude: place auroral ovals at nominal altitude (e.g., 110 km) relative to Earth radius; store as height factor for renderer.

## Validation and Clamping Rules
- Reject non-physical inputs (negative density, NaN, infinite values).
- Clamp Bz to a reasonable range for calculations to avoid extreme shifts.
- For every computation, produce metadata flags: { clamped: boolean, reason: string }.

## Smoothing and Temporal Handling
- Optional rolling window (e.g., last 3 samples) for Pdyn before computing Rmp/Rbs to reduce jitter; configurable.
- For Kp, if only 3-hour cadence is available, allow interpolation or use nowcast estimation if provided; else hold last value.

## Output Payload Schemas
- Magnetopause payload: { standoffRe: number, lastUpdated: iso, quality: string, clamped: boolean }.
- Bow shock payload: { radiusRe: number, lastUpdated: iso, quality: string, clamped: boolean }.
- Aurora payload: { oval: { north: LatLng[], south: LatLng[] }, kp: number, blackout: MaskDescriptor, lastUpdated: iso, quality: string }.

## Test Vectors
- Include canonical inputs and expected outputs for unit tests (Pdyn, Kp cases, Bz variants if applied).
- Document tolerances for floating point comparisons.

## Performance Budget
- Mapping computations must run in under 10 ms per update on mid hardware; avoid allocations in hot paths.

## Extensibility Notes
- Leave hooks for future IMF-dependent oval distortion or season/UT dependence.
- Allow swapping model coefficients via config without code changes.
