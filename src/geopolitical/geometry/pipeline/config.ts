// Central configuration for geopolitical geometry pipeline
// Adjust version when a change invalidates geometry cache outputs.
export const GEO_PIPELINE_VERSION = 'v1';

// Minimum approximate perimeter (in degrees) for a hole ring to receive side wall extrusion.
// Very tiny holes create disproportionate triangle counts and visual noise when extruded.
export const MIN_HOLE_WALL_PERIM_DEG = 0.2; // default ~0.2° perimeter

// Read override threshold from URL (if present) at runtime.
export function getHoleWallPerimeterThreshold(): number {
  if (typeof window !== 'undefined') {
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('geoPolyHoleWallMinPerim');
      if (v) {
        const n = parseFloat(v);
        if (!isNaN(n) && n >= 0) return n;
      }
    } catch(_err) { /* ignore */ }
  }
  return MIN_HOLE_WALL_PERIM_DEG;
}
