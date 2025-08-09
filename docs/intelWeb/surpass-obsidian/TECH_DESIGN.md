# Technical Design: IntelWeb Graph Enhancements

## Architecture
- Pluggable Graph Engines
  - SVG (current): small/medium graphs, rich interactivity
  - Canvas/WebGL: large graphs; share props and data types
  - Workerized d3-force: offload physics; main thread handles rendering/UI

- Data Pipeline
  - VirtualFileSystemManager: robust Markdown parsing (gray-matter + link/alias/transclusion), backlinks, relationshipGraph
  - IntelWebIntegrationService: predicate enrichment, spatial/temporal normalization

## Modules
- GraphAlgorithms.ts
  - BFS/DFS/Dijkstra, k-shortest paths
  - Degree/centralities (degree betweenness approx)
  - Community detection hooks (graphology integration)

- GraphQuery.ts
  - Parse query DSL → predicate tree
  - Evaluate against nodes/edges; integrate with GraphFilters

- GraphMapOverlay.tsx
  - Leaflet/MapLibre component; render nodes with coordinates; link interactions

## Key Flows
1. Build Graph
   - Convert VFS → nodes/edges (typed, confidence, timestamp, tags)
   - Compute degree; annotate nodes
   - Optionally compute communities (async) and cache

2. Filter & Isolate
   - Apply GraphFilters (types, confidence, time, search)
   - If isolate mode and selected node → BFS up to depth N to create subgraph

3. Render
   - Engine decides LOD (labels/edges) based on zoom and counts
   - Hover highlighting and selection maintained; tooltips for edges

4. Panels
   - Node panel: overview, mentions/backlinks, files, timeline, neighbors
   - Edge panel: predicate, provenance, source report links, timeline if applicable

## Data Contracts
- IntelNode
  - id, type, confidence, title, description, timestamp, tags, metadata, file
  - degree?: number, communityId?: string, location?: [lat, lng]

- IntelEdge
  - id, source, target, type (reference|temporal|spatial), weight, confidence
  - metadata: { predicate?: string, provenance?: string|object, sourceReport?: string }

## Performance Notes
- Use Map/Set heavily; avoid array scans in hot paths
- Batch DOM updates in D3; minimize rebinds
- Use transforms for zoom; cull labels/edges at high zoom-out
- Debounce expensive recomputations (filters, queries)

## Testing
- Unit tests for GraphAlgorithms and GraphQuery
- Integration tests for filter/isolate and saved view persistence
- Manual performance budget checks with synthetic data
