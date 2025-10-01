# Projection Conventions

Goal: One canonical mapping across all subsystems to avoid offsets.

Canonical Rules
- Latitude/Longitude handedness: lon = degrees East (positive), West (negative); lat positive North.
- 3D mapping: use phi = (90 - lat)° and theta = (lon + 180)° for overlays; or Vector3 via cos/sin with invertX=false, and flip Z once for consistency.
- Texture alignment: U shift = -90° (offset.x = 0.75) to align texture seam with overlays; wrapS=Repeat, wrapT=Clamp.
- Prime meridian test: dev-only marker at (0°,0°) must sit on the Greenwich seam.

Implementation Notes
- Geopolitical geometry uses invertX=false and flips Z to match overlay convention.
- Keep a unit test asserting (0,0) projection and seam alignment to catch regressions.
