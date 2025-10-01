# Borders Rendering

Stage 1 (Now)
- Simple line rendering using globe-aligned positions, with consistent color and small width.

Stage 2 (Prototype)
- SDF borders baked into tiled textures for crisp, antialiased borders at any zoom.
- Alternative: great-circle shader lines with screen-space width; no geometry thickness.

Edge Cases
- Antimeridian wrap, poles, small islands, disputed segments with different stroke styles.

Testing
- Visual checks at multiple zooms and at the limb; ensure no see-through.

Maritime borders
- Data source: topology at `/geopolitical/maritime/topology/eez.topology.json` with LOD keys.
- Classifications: `maritime_eez` (default), `maritime_overlap` (overlapping EEZs).
- Layer: `geopolitical-maritime` (order 96) in the layer registry, separate from land borders.
- Toggle: Settings → National Territories → “Maritime Borders”.
- Behavior: participates in LOD rebuilds and shares the Border Visibility opacity control.
