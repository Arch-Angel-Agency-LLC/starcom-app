# Isolate Mode Spec

## Goal
Temporarily focus the graph on nodes within N hops of a root node using BFS without mutating the underlying dataset.

## Inputs
- rootId: string (node id)
- depth: number (N hops, integer >= 0)

## Behavior
- Isolation is applied after global filters; BFS runs on the filtered graph.
- Include all nodes reachable from root with shortest-path distance <= depth.
- Include edges where both endpoints are included.
- Depth=0 includes only the root; Depth=1 includes root's neighbors, etc.
- Clearing isolate returns to the prior filtered graph.

## UI/UX
- Enter via context menu on node: "Isolate…" → Depth picker (0..5)
- Show a non-destructive banner/pill with root label and depth; provide "Clear" and "Increase/Decrease depth" controls.
- Optional visual: fade non-isolated items to 5–10% alpha rather than full removal to preserve spatial context when layout is frozen.

## Interop
- With layoutFrozen=true, do not re-run layout; only show/hide/fade.
- With sizingMode='degree', sizing uses degree in the isolated subgraph.
- With clusters hidden, respect current cluster visibility.

## Persistence
- Stored inside Saved View entries as `{ isolate: { rootId, depth } }` when saving a view.
- Not persisted separately when ad-hoc.

## Performance
- Pre-compute adjacency lists once per load; BFS is O(V+E) on filtered graph.
- Guard rails: max node count threshold for isolate UI enablement (e.g., <= 25k nodes).

## Telemetry
- Log isolate enter/exit, depth changes, node count of subgraph.
