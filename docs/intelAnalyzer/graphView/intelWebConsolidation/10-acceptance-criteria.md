# Acceptance Criteria

- Users can create, rename, delete, duplicate saved views; data persists across reloads (scoped per workspace)
- Applying a view sets filters, cluster visibility, sizing mode, isolate, and layout freeze state
- Isolate mode focuses N-hop neighborhood; clearing returns to prior filtered graph
- Freeze prevents node repositioning; unfreeze re-enables layout forces
- Degree sizing scales node sizes by degree deterministically
- URL deep links continue to work and are not polluted by view-specific state
- Performance remains within budget (no >20% regression on large graphs)
- Accessibility: controls keyboard navigable; labels provided
- Telemetry emitted for key actions (save, apply view; isolate on/off)
