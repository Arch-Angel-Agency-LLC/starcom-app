# IntelWeb: Surpass Obsidian Graph View

This plan outlines how to match and exceed Obsidian’s Graph View capabilities using the current IntelWeb architecture (VFS → relationshipGraph → IntelGraph) and recent improvements (typed edges, provenance, time filters, Saved Views, layout persistence).

## Goals
- Parity with Obsidian’s Graph View for familiarity and baseline usability.
- Surpass with evidence-centric analysis (provenance, predicates), temporal/spatial analysis, community detection, path finding, and performance at scale.

## Current Capabilities (Baseline)
- D3 2D force graph with zoom/drag, collision/link/charge forces.
- Nodes typed: report/entity/location/event/source. Edges: reference/spatial/temporal.
- Filters: node/edge types, search, confidence range, time window (quick + histogram brush).
- Saved Views (localStorage), per-vault layout persistence, freeze/save/reset.
- Edge tooltips; edge details panel with predicate/provenance.

## Parity Tasks (Match Obsidian)
1. Local vs Global View
   - Neighborhood depth slider (0–3) around selected node; “Isolate neighborhood” toggle.
   - Subgraph built via BFS on current filtered graph.
2. Coloring Modes
   - By node type (default), by top-level folder, by first tag. Toggle in controls.
3. Node Size Modes
   - Size by degree (in filtered graph) blended with confidence.
4. Label Level-of-Detail (LOD)
   - Always show for selected/hovered; reveal more on zoom-in; hide at far zoom.
5. Smooth UX
   - Keyboard shortcuts: `/` focus search, `Esc` clears selection/hover.
   - Clickable legend to toggle types; persist controls open/tab.

## Surpass Tasks (Go Beyond)
1. Path Finding & Evidence Graph
   - Shortest path between nodes; multi-paths (k-shortest) with predicate/provenance summaries.
   - Panel showing the chain of evidence with source reports.
2. Community Detection & Cluster UX
   - Run Louvain (or similar) to detect communities.
   - Optional convex hulls around clusters; collapse/expand clusters.
3. Query DSL
   - `type:entity tag:#acme edge:temporal since:7d text:"foo bar" degree>5 path:reports/`
   - Parser → filter pipeline; integrates with Saved Views.
4. Time & Map Synchronization
   - Map overlay (Leaflet/MapLibre) for geotagged nodes; timeline brush filters both.
   - Temporal edge rendering (arrows, fading) in time window.
5. Performance & Scale
   - Pluggable engines: SVG (current), Canvas/WebGL (for 5k–50k nodes), Worker-based simulation.
   - Edge bundling for dense references; progressive LOD for edges/labels.
6. Saved Views 2.0
   - Export/import JSON, sharable permalinks, default view per vault.
7. Analytics Panel
   - Top entities by degree/betweenness, most active sources, community summaries, “new this week.”

## Implementation Plan (Phased)

### Phase A: Parity Enhancements
- Add isolate mode + depth slider.
- Degree-based sizing and label LOD.
- Coloring modes (type/folder/tag) and clickable legend.
- Keyboard shortcuts and minor UX polish.

Deliverables:
- `IntelGraph.tsx`: subgraph builder, degree compute, color resolver.
- `GraphEngine2D.tsx`: label LOD logic.
- `GraphControls.tsx`: isolate/depth, color mode, legend toggles.

### Phase B: Analysis Superpowers
- Add `GraphAlgorithms.ts` (BFS/Dijkstra, k-shortest paths).
- Edge/Path panel: predicates + provenance chain.
- Community detection (graphology or custom) with optional hulls.

Deliverables:
- `src/applications/intelweb/components/Graph/GraphAlgorithms.ts`.
- Panels in `IntelGraph.tsx`; cluster hulls in `GraphEngine2D.tsx`.

### Phase C: Query & Views
- `GraphQuery.ts`: parser + evaluator → filters.
- Saved Views export/import, permalinks.

Deliverables:
- Controls to edit DSL; views manager update.

### Phase D: Time & Map
- `GraphMapOverlay.tsx` (Leaflet/MapLibre). Sync with `filters.timeRange`.
- Temporal edge arrows; fade by age within time window.

Deliverables:
- Map toggle in controls; overlay component.

### Phase E: Performance & Scale
- Canvas/WebGL engine (e.g., `force-graph` or Pixi + worker d3-force).
- Workerized simulation for large graphs; edge bundling toggle.

Deliverables:
- `GraphEngineCanvas2D.tsx` and Worker setup.

## Data Pipeline Supports
- `VirtualFileSystemManager.ts` improvements: aliases, transclusions, block refs, header anchors, folder path, YAML aliases/tags.
- `IntelWebIntegrationService.ts`: predicate normalization; temporal/spatial metadata standardization.

## UX Guidelines
- Evidence-first: edge panels highlight provenance; node panels list mentions/backlinks.
- Defaults: sensible OSINT presets; no classification.
- Persist user intent: controls/tab open, Saved Views, layout per vault.
- Accessibility: keyboard and aria-friendly controls.

## Milestones & Success Criteria
- Parity: All Obsidian-equivalent toggles and behaviors present; smooth at 2–5k nodes.
- Surpass: Paths, communities, query DSL, synchronized timeline+map; smooth at 10k nodes with Canvas.
- Developer: Pluggable engines; clear APIs; tests for algorithms and query parsing.
