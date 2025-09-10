# Implementation Plan

## Assumptions
- No engine swap; continue using react-force-graph-2d
- Analyzer contexts are the single source of truth

## Phase A (Feature Port)
- Storage service for views/layout keys (v2)
- Controls: freeze, degree sizing, clusters, isolate
- Saved Views wiring (create/apply/delete/rename)
- URL/Deep link remains unchanged
- Telemetry hooks

## Phase B (Polish)
- Persist layout positions; freeze-by-default for saved views with layoutFrozen
- Isolate fade vs hide option; tune performance thresholds
- Keyboard shortcuts + tooltips

## Phase C (Sunset IntelWeb)
- Feature flag to hide IntelWeb entry points by default
- Announce deprecation; update docs and navigation
- Remove IntelWeb after 2 releases once parity is verified

## Work Items
- [ ] ViewStorage module (read/write, validate, migrate)
- [ ] GraphControls component
- [ ] IsolateBFS helper using filtered adjacency
- [ ] Degree sizing adapter
- [ ] Layout freeze plumbing in GraphView
- [ ] SavedViewsManager dialog
- [ ] Unit/integration tests

## PR Strategy
- Small, vertical slices with tests
- Guard behind feature flag until stable
