# Alignment Test Plan

Goals
- Verify texture seam vs overlay projection
- Verify globe orientation across poles and antimeridian

Tests
- Dev-only prime meridian marker at (0°,0°); seam alignment screenshot
- Markers at (0°,90°E/W) and (±45°,0/90/180) to verify mapping
- Antimeridian polygons: ensure wrap correctness and no tearing

Automation
- Scripted camera shots and snapshots for comparison
