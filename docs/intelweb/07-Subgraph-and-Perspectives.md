# Subgraphs and Saved Perspectives (Draft)

Subgraphs
- Query-driven: scope by package/case, time window, geo bounds, types, predicates, tags.
- Ego-centric: N-hop neighborhoods; degree/centrality thresholds.
- Task presets: comms network, financial flows, infrastructure, co-appearance, evidence-centric.
- Cluster-first: compute communities; expand on demand; prevent hairball by default.

Saved perspectives
- Capture: filters, layout, node positions, selections, annotations.
- Shareable across apps when scope allows (case/package bounded).
- Versioned; include creator, timestamp, and classification.

APIs
- buildSubgraph(query): GraphData
- savePerspective(name, graphState): id
- loadPerspective(id): graphState
