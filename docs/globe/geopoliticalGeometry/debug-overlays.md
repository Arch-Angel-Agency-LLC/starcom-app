# Debug Overlays

- Prime meridian/equator markers (dev only)
- Border proximity visualizer (future)
- Nation ID overlay (future ID-map path)

Usage
- Toggle via URL param or dev panel.

Baseline screenshots (dev only)
- Use the `geoSnap` URL param to programmatically capture baseline shots after globe init.
- Examples:
	- `?geoDebugOverlay=markers&geoSnap=all`
	- `?geoSnap=seam0,eq90E,eq90W,anti180,pm45N,pm45S,lat45E,lat45W`
- Files will be downloaded automatically once per session in development mode.

Outputs
- Latest captured examples are committed under `docs/assets/geopolitical/baseline/` for review.

Markers overlay (dev only)
- Always shows (0°, 0°) in dev builds.
- Full alignment set toggled via:
	- ?geoDebugOverlay=markers
- Marker set includes:
	- (0°, 0°) — yellow
	- (0°, ±90°) — cyan
	- (±45°, 0°/90°/180°) — magenta
	- Slight radial line drawn to emphasize position
	- Radius ~102 (globe ≈ 100) to avoid z-fighting
