# IntelWeb 2D/3D Graph Design

Goal
Deliver an Obsidian-like Graph View for intel reports/entities with scalable 2D Canvas and 3D WebGL implementations.

2D Engine (GraphEngine2D)
- Renderer: canvas for >1–2k nodes; keep current SVG path for small graphs
- Drawing pipeline:
  - Precompute styles (color, size, stroke) per node
  - Batch draw: edges → nodes → labels
  - Use offscreen canvas to prerender label glyphs
- Physics: d3-force in Web Worker; main thread draw only
  - Worker posts node positions (Float32Array) each tick (throttled)
  - Main thread applies transform and redraws
- LOD strategy:
  - N < 1000: show labels for selected + hovered + high-degree
  - 1000 ≤ N < 3000: labels only on hover/selection
  - N ≥ 3000: labels disabled; show cluster hulls
- Clustering: community detection (louvain) via graphology; expand/collapse
- Edge rendering:
  - Alpha blending; thickness by weight; fade by confidence
  - Optional force-edge-bundling at large scales
- Persistence: store positions per dataset/package (localStorage or VFS manifest)
- Accessibility: keyboard navigation between neighbors

3D Engine (GraphEngine3D)
- Option A: three-forcegraph (fast path)
  - Pros: built-in force-3d, instancing, picking; Cons: less control
- Option B: three.js + d3-force-3d
  - InstancedMesh for nodes; LineSegments or cylinder impostors for edges
  - GPU picking with color buffer; postprocessing for glow
- Performance:
  - Frustum culling; dynamic step simulation; decay on idle
  - LOD: point sprites → spheres beyond threshold; labels via SDF text

Layouts
- Force-directed (default): d3-force(d3.forceLink, forceManyBody, forceCenter)
- Radial: radius by type buckets; angle by index
- Concentric: rings by degree/centrality percentiles
- Geographic: pin location nodes to projected lat/lng; others attracted to nearest location
- Timeline: x = time normalization; y,z by force; slider to filter window

Interactions
- Click: select node; show details; highlight neighbors; freeze camera focus
- Hover: tooltip + soft highlight
- Box select / lasso (2D): multi-select for operations
- Controls: filters (classification/type/confidence/time), search, mode toggle 2D/3D, layout presets, reset view

Security Visuals
- Stroke color by classification; dashed border for special compartments; opacity by confidence

Data integration
- Prefer VirtualFileSystem.relationshipGraph; fallback to wikilink parsing
- Support direct GraphData injection from integration service

Performance Targets
- 2D: 5k nodes / 10k edges at ≥30 FPS on mid-tier hardware
- 3D: 20k nodes / 50k edges with instancing at ≥30 FPS

Testing
- Dataset generators for small/medium/large graphs; FPS/latency benchmarks; regression on selection and filter operations

