# Progress Tracker — IntelWeb → Analyzer GraphView Consolidation

Use this document to track status, milestones, and day-to-day notes.

## Status Summary
- Phase: Planning complete, ready for Phase A implementation
- Feature Flag: ANALYZER_GRAPH_VIEWS_V2 (planned)

## Milestones
- [x] Docs scaffold (01–15)
- [x] Add README and tracker
- [x] Phase A: Saved Views + Controls (initial slice)
- [x] Phase A: Isolate BFS (helper + wiring)
- [x] Phase A: Layout Freeze plumbing (pause/resume)
- [x] Phase A: Degree sizing (nodeVal)
- [x] Phase A: Tests (unit) — storage, isolate
- [x] Phase B: Layout positions storage + wiring (auto-apply, save/reset)
- [x] Phase B: Tests (unit) — positions storage
- [ ] Phase B polish
- [ ] IntelWeb sunset

## Work Items (rolling)
- ViewStorage module — DONE (viewStorage.ts)
- GraphControls component — PARTIAL (inline controls in GraphView)
- IsolateBFS helper — DONE (isolate.ts)
- Degree sizing adapter — DONE (nodeVal)
- Layout freeze wiring — DONE (pause/resume)
- SavedViewsManager dialog — TODO
 - SavedViewsManager dialog — PARTIAL (create/apply/delete)

## Decisions Log
- 2025-09-08: Keys scoped by `workspaceHash`; no auto-migration from IntelWeb
- 2025-09-08: Saved Views v2 excludes camera state (consider v3)
- 2025-09-08: Minimal inline controls in GraphView for Phase A to reduce surface area; dedicated manager planned later

## Notes
- Keep deep-link independent from saved views to avoid URL bloat
- Add telemetry for key actions (save/apply view, isolate on/off)

## Log
- 2025-09-08: Implemented view storage (v2), inline controls (freeze, sizing, clusters), isolate BFS helper, degree sizing, and basic saved views apply/save. Build passes.
- 2025-09-08: Added unit tests for viewStorage and isolate helpers (Vitest); tests pass.
- 2025-09-08: Added Saved Views Manager dialog (create/apply/delete) and keyboard shortcuts (f/g/c/esc).
- 2025-09-08: Implemented layout positions storage (v1) with Save/Reset buttons and auto-apply on graph changes; added unit tests for positions storage. GraphView applies saved positions when available.
