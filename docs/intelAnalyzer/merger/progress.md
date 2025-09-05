# Progress Tra- [ ] 2) Fold TimeMap into TimelineView
  - [x] Create `src/applications/intelanalyzer/views/TimelineView/TimelineView.tsx` wrapping existing TimeMap
  - [x] Add `src/applications/intelanalyzer/adapters/eventsAdapter.ts` mapping Reports/Intel Items → Events
  - [x] Wire `IntelWorkspaceProvider` at workbench root (already done)
  - [x] Pass adapted events to TimelineView
  - [ ] Test: Timeline renders events; brushing emits time filter via FilterContextThis document tracks progress on the roadmap implementation. Update status as tasks are completed.

## Phase A — Split roles and remove redundancy (MVP shell)

- [x] 1) Establish Analysis Workbench shell (new IntelAnalyzer)
  - [x] Create `src/applications/intelanalyzer/AnalysisWorkbench.tsx`
  - [x] Create `src/applications/intelanalyzer/layout/WorkbenchLayout.tsx`
  - [x] Add `src/applications/intelanalyzer/state/SelectionContext.tsx`
  - [x] Add `src/applications/intelanalyzer/state/FilterContext.tsx`
  - [x] Update route to render `AnalysisWorkbench` (keep route id)
  - [x] Remove dashboard-like lists from Analyzer
  - [x] Test: Renders left rail (empty), center Timeline stub, right inspector stub; no regressions in EnhancedApplicationRouter
- [ ] 2) Fold TimeMap into TimelineView
  - [ ] Create `src/applications/intelanalyzer/views/TimelineView/TimelineView.tsx` wrapping existing TimeMap
  - [ ] Add `src/applications/intelanalyzer/adapters/eventsAdapter.ts` mapping Reports/Intel Items → Events
  - [ ] Wire `IntelWorkspaceProvider` at workbench root
  - [ ] Pass adapted events to TimelineView
  - [ ] Test: Timeline renders events; brushing emits time filter via FilterContext
- [ ] 3) Add TableView and basic left filters
  - [ ] Create `src/applications/intelanalyzer/views/TableView/TableView.tsx` (virtualized) with columns: Type, Title, Timestamp, Category, Tags, Confidence, LocationFlag
  - [ ] Implement FilterContext with fields from data-models.md (chips UI in left rail)
  - [ ] Test: Table reflects filtered subset as Timeline; time filter reduces rows consistently
- [ ] 4) Inspector scaffold
  - [ ] Create `src/applications/intelanalyzer/panels/InspectorPanel.tsx` with type-aware rendering for Report/Intel Item/Event/Entity
  - [ ] Add actions: Pin to board (no-op), Copy deep link, “Open in Dashboard”
  - [ ] Test: Clicking row/event selects and opens inspector; deep link copies URL
- [ ] 5) Deep-link plumbing
  - [ ] Implement `src/applications/intelanalyzer/utils/deepLink.ts` for encode/decode
  - [ ] Sync URL ↔ contexts (parse on mount, update on change; debounce)
  - [ ] Test: Refresh preserves view and selection; manual URL edit toggles views

## Mid-Phase A-B: Code Review & Audit

- [ ] Code review of Phase A changes
- [ ] Code audit for security/performance
- [ ] Q&A session with user
- [ ] Self-analysis of implementation
- [ ] Progress critique and adjustments

## Phase B — Analyst workflows

- [ ] 6) Selection sync and entity pivots
  - [ ] SelectionContext broadcasts selection; all views highlight current selection
  - [ ] Add entity pill in inspector; clicking filters other views by entity
  - [ ] Test: Select in Timeline highlights in Table; inspector opens; entity pill narrows views
- [ ] 7) Boards (local persistence)
  - [ ] Create `src/applications/intelanalyzer/panels/BoardsPanel.tsx` to save/load boards (localStorage)
  - [ ] Board save stores: view, filters, selection, layout
  - [ ] Test: Saving and switching boards restores state; deep link includes board id
- [ ] 8) MapView and GraphView (initial)
  - [ ] MapView: MapLibre GL + Supercluster; render filtered events with clustering; polygon draw → geo filter chip
  - [ ] GraphView: nodes (entities/reports/items), edges (mentions/co-occurrence); cap nodes; expand neighbors
  - [ ] Test: Map reflects time filter and selection; polygon adds geo chip; Graph loads under cap; selecting node filters views
- [ ] 9) Notes/Hypotheses and pinning
  - [ ] Add lightweight notes/hypotheses in inspector; pin selected evidence to current board
  - [ ] Test: Notes persist within board; pinned items count visible; switching boards swaps notes/pins

## Mid-Phase B-C: Code Review & Audit

- [ ] Code review of Phase B changes
- [ ] Code audit for security/performance
- [ ] Q&A session with user
- [ ] Self-analysis of implementation
- [ ] Progress critique and adjustments

## Phase C — Correlation tools

- [ ] 10) Co-occurrence clusters and anomalies
  - [ ] Add service to compute co-occurrence by time/place/tags/entities; surface as overlays (timeline bands, graph clustering)
  - [ ] Anomaly flags: z-score or frequency delta; badge in inspector
  - [ ] Test: Toggling “show clusters” highlights grouped events; anomalies flagged on table rows
- [ ] 11) Watchlists and alerts
  - [ ] Add watchlists (entities/tags) saved on board; optional visual alerts on matches
  - [ ] Test: Adding to watchlist marks matching events; board retains watchlists

## Mid-Phase C-D: Code Review & Audit

- [ ] Code review of Phase C changes
- [ ] Code audit for security/performance
- [ ] Q&A session with user
- [ ] Self-analysis of implementation
- [ ] Progress critique and adjustments

## Phase D — Authoring bridge & exchange

- [ ] 12) Export to Draft Report (Workspace)
  - [ ] From inspector or board: bundle pinned evidence into seed draft and open IntelDashboard
  - [ ] Test: Draft opens with evidence references; saving creates report in Workspace
- [ ] 13) Package compose → MarketExchange
  - [ ] Create minimal composer to package reports/items and hand off to MarketExchange
  - [ ] Test: Selected items become package stub in MarketExchange

## Mid-Phase D-Ongoing: Code Review & Audit

- [ ] Code review of Phase D changes
- [ ] Code audit for security/performance
- [ ] Q&A session with user
- [ ] Self-analysis of implementation
- [ ] Progress critique and adjustments

## Ongoing (non-functional)

- [ ] 14) Performance
  - [ ] Virtualize Table; LOD for Timeline/Map/Graph; Web Workers for graph layout; throttle brush
  - [ ] Test: Table scrolls smoothly with 50k rows; panning timeline/map remains responsive
- [ ] 15) Accessibility
  - [ ] Keyboard navigation, ARIA roles, focus management; inspector focus trap
  - [ ] Test: Keyboard-only user can switch views, select rows/events, open/close inspector
- [ ] 16) Telemetry
  - [ ] Emit events for view switches, selection/filters, board saves, deep-link copies, map polygons, graph expansions
  - [ ] Test: Events appear in analytics pipeline

## Testing hooks

- [ ] Unit/integration/E2E tests per test-plan.md
- [ ] Mock data set for development

## Migration & deprecations

- [ ] Legacy route banners and telemetry
- [ ] Removal when adoption threshold met

## Notes

- Current status: Phase A, step 1 completed. Ready to start Phase A, step 2.
- Last update: September 5, 2025
