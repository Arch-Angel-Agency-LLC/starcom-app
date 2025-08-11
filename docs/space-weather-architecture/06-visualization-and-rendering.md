# 06 - Visualization & Rendering

## Goals
- Represent magnitude, direction, source, and anomaly state without clutter.
- Scale from hundreds to tens of thousands of vectors gracefully.

## Layers
1. Vector Glyph Layer (instanced arrows or tapered lines)
2. Magnitude Heat Layer (optional raster or splatted kernels)
3. Alert Overlay (icons / halos on anomaly clusters)
4. Divergence / Difference Layer (future: multi-source comparison)
5. Temporal Playback (snapshot scrub / animate interpolation)

## Rendering Strategy
- Use Three.js InstancedMesh for vector glyphs.
- Attributes per instance: position(vec3), dir(vec2 packed), magnitude(float), color(uint32 or vec4), size(float), flags(uint8 bitfield).
- GPU Color Ramp Option: pass magnitude normalized + percentile; shader picks gradient.

## Adaptive Level of Detail
| Camera Altitude | LOD | Max Instances | Representation |
|-----------------|-----|---------------|----------------|
| Low Orbit       | 0   | 3k            | full arrows    |
| Mid Orbit       | 1   | 8k            | simplified arrows (no taper) |
| High Orbit      | 2   | 12k           | heat splats / points |
| Far (globe view)| 2   | 4k            | aggregated cells only |

## Direction Encoding
- Arrow orientation from direction_deg.
- Option: encode direction as hue modulation (secondary cue) when density high.

## Color Ramps
- Base ramp tied to percentile groups (P50, P75, P90, P95, P99+).
- Alternate: Physical threshold overlay (highlight >1500, >3000 mV/km).
- Source differentiation: subtle hue shift (InterMag: cyan range, US-Canada: amber range) before final magnitude ramp blending.

## Anomaly Indicators
- Pulse shader (sin(time)) scaling for flagged anomaly vectors.
- Cluster hull outline (2D projected polygon) for major alert regions.

## Performance Budgets
- Attribute buffer rebuild only on new snapshot or camera LOD change.
- Partial updates: if new vectors share stable IDs, update subset (future optimization).

## Debug Panel (Developer Mode)
- Display: LOD, raw→normalized→aggregated→render counts, data age, avgQuality, coverage.
- Toggle raw vs normalized magnitudes.

## Streamlines (Future)
- Generate coarse vector field grid -> integrate pathlines via RK2/4 -> animate variable thickness trails.

## Fallback Mode
- If WebGL instancing unsupported, degrade to existing point markers with reduced dataset size.

## Interaction
- Hover: show magnitude (mV/km), direction (deg), quality score, dataset, percentile rank.
- Click: open detailed station/aggregate cell drilldown (list of underlying representative vectors).

## Shader Outline (Pseudo-GLSL)
```glsl
attribute vec3 instancePosition;
attribute float magnitude;
attribute float percentileNorm; // 0..1
attribute vec2 direction;       // sin/cos packed
attribute vec4 color;           // precomputed or gradient index
attribute float size;

void main() {
  // build arrow geometry in shader (billboard or oriented) ...
}
```

## Data Binding Lifecycle
1. RenderFeed emits new RenderSet.
2. Globe layer selects LOD -> builds / updates InstancedMesh.
3. Visibility toggles adjust material uniforms (no geometry rebuild).

