# Roadmap: IntelWeb Graph UX to Surpass Obsidian

## A. Parity (Week 1)
- Isolate Mode + Depth Slider (0–3)
- Degree-based sizing; label LOD by zoom/selection
- Coloring modes: type / folder / tag; clickable legend toggles
- Keyboard shortcuts: `/` focus search, `Esc` clear selection, `Ctrl+S` save layout

KPIs: Time-to-insight < 10s on 2–3k nodes; no jank during pan/zoom

## B. Analysis (Week 2)
- Path finder (shortest/k-shortest) with edge predicate/provenance chain panel
- Community detection (Louvain) + optional cluster hulls; collapse/expand

KPIs: Find path < 200ms on 5k nodes; cluster layout stable; hulls readable

## C. Query & Views (Week 3)
- Query DSL parser and controls; integrate with Saved Views
- Export/import views; permalink support

KPIs: Saved view restores to identical state; queries cached; errors surfaced well

## D. Time & Map (Week 4)
- Map overlay for geotagged nodes (Leaflet/MapLibre); sync with timeline
- Temporal edge arrows; fade by age within time window

KPIs: Map/graph link bi-directional; timeline brush filters both smoothly

## E. Scale & Performance (Weeks 5–6)
- Canvas/WebGL engine + Workerized force sim; edge bundling toggle
- Progressive LOD (edges/labels), clustering on demand

KPIs: 10k nodes interactive; 30–60 FPS pan/zoom; memory stable

## Dependencies
- Graphology (optional) for metrics/communities
- Leaflet/MapLibre for map overlay
- force-graph or Pixi for Canvas/WebGL engine

## Risks & Mitigations
- Performance regressions → feature flags, pluggable engines, worker offload
- Data inconsistencies → canonical relationshipGraph, validation passes
- UX complexity → progressive disclosure, Defaults that work out-of-box
