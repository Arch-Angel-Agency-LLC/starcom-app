# Roadmap (Implementation Guide for AI Agent)

This plan references the design docs under `docs/intelAnalyzer/merger/` and provides concrete tasks, file paths, and acceptance criteria.

Key specs: `ux-workbench-spec.md`, `architecture-and-state.md`, `data-models.md`, `deep-links.md`, `test-plan.md`, `a11y-and-perf.md`, `migration-and-deprecations.md`.

## Phase A — Split roles and remove redundancy (MVP shell)

1) Establish Analysis Workbench shell (new IntelAnalyzer)
	 - Create `src/applications/intelanalyzer/AnalysisWorkbench.tsx` and `layout/WorkbenchLayout.tsx`.
	 - Add `state/SelectionContext.tsx` and `state/FilterContext.tsx` per `architecture-and-state.md`.
	 - Replace previous Analyzer entry to render `AnalysisWorkbench` (keep route id). Remove dashboard-like lists.
	 - Acceptance:
		 - Renders left rail (empty), center Timeline stub, right inspector stub.
		 - No regressions in EnhancedApplicationRouter; app launches.

2) Fold TimeMap into TimelineView
	 - Create `views/TimelineView/TimelineView.tsx` that wraps the existing TimeMap component with the Events adapter from `data-models.md`.
	 - Add adapter `adapters/eventsAdapter.ts` mapping Reports/Intel Items → Events.
	 - Wire `IntelWorkspaceProvider` at the workbench root; pass adapted events to TimelineView.
	 - Acceptance:
		 - Timeline renders events using createdAt/updatedAt fallback.
		 - Brushing emits a time filter via FilterContext.

3) Add TableView and basic left filters
	 - Create `views/TableView/TableView.tsx` (virtualized) with columns: Type, Title, Timestamp, Category, Tags, Confidence, LocationFlag.
	 - Implement FilterContext with fields from `data-models.md` (excluding classification) and chips UI in left rail.
	 - Acceptance:
		 - Table reflects the same filtered subset as Timeline.
		 - Applying time filter reduces Table rows consistently.

4) Inspector scaffold
	 - Create `panels/InspectorPanel.tsx` with type-aware rendering for Report/Intel Item/Event/Entity; show key metadata (no classification).
	 - Add actions: Pin to board (no-op data store), Copy deep link (using `deep-links.md`). “Open in Dashboard” routes to IntelDashboard for the source.
	 - Acceptance:
		 - Clicking a row/event selects it (SelectionContext) and opens inspector.
		 - Deep link copies a URL with `view` and `selected` params.

5) Deep-link plumbing
	 - Implement `utils/deepLink.ts` for encode/decode per `deep-links.md`.
	 - Sync URL ↔ contexts (parse on mount, update on change; debounce).
	 - Acceptance:
		 - Refresh preserves view and selection.
		 - Manually editing `view=table|timeline` toggles views.

## Phase B — Analyst workflows

6) Selection sync and entity pivots
	 - SelectionContext broadcasts selection; all views highlight current selection.
	 - Add entity pill in inspector; clicking filters other views by that entity (update FilterContext `tags` or `entityRefs`).
	 - Acceptance:
		 - Select in Timeline highlights in Table; inspector opens.
		 - Clicking entity pill narrows other views.

7) Boards (local persistence)
	 - Create `panels/BoardsPanel.tsx` to save/load boards per `data-models.md` (localStorage only in MVP).
	 - Board save stores: view, filters, selection, layout.
	 - Acceptance:
		 - Saving and switching boards restores state; deep link includes `board` id.

8) MapView and GraphView (initial)
	 - MapView: MapLibre GL + Supercluster; render filtered events with clustering; polygon draw → geo filter chip.
	 - GraphView: nodes (entities/reports/items), edges (mentions/co-occurrence); cap nodes; explicit expand neighbors.
	 - Acceptance:
		 - Map reflects time filter and selection; polygon adds/removes geo chip.
		 - Graph loads under node cap; selecting a node filters other views.

9) Notes/Hypotheses and pinning
	 - Add lightweight notes/hypotheses in inspector; pin selected evidence to current board.
	 - Acceptance:
		 - Notes persist within board; pinned items count visible; switching boards swaps notes/pins.

## Phase C — Correlation tools

10) Co-occurrence clusters and anomalies
	 - Add a small service to compute co-occurrence by time/place/tags/entities; surface as overlays (timeline bands, graph clustering).
	 - Anomaly flags: z-score or frequency delta; badge in inspector.
	 - Acceptance:
		 - Toggling “show clusters” highlights grouped events; anomalies flagged on table rows.

11) Watchlists and alerts
	 - Add watchlists (entities/tags) saved on board; optional visual alerts on matches.
	 - Acceptance:
		 - Adding to watchlist marks matching events; board retains watchlists.

## Phase D — Authoring bridge & exchange

12) Export to Draft Report (Workspace)
	 - From inspector or board: bundle pinned evidence into a seed draft and open IntelDashboard with prefilled content.
	 - Acceptance:
		 - Draft opens with list of evidence references; saving creates a report in Workspace.

13) Package compose → MarketExchange
	 - Create a minimal composer to package reports/items and hand off to the MarketExchange flow.
	 - Acceptance:
		 - Selected items become a package stub visible in MarketExchange.

## Ongoing (non-functional)

14) Performance
	 - Virtualize Table; LOD for Timeline/Map/Graph; use Web Workers for graph layout; throttle brush.
	 - Acceptance:
		 - Table scrolls smoothly with 50k rows; panning timeline/map remains responsive.

15) Accessibility
	 - Per `a11y-and-perf.md`: keyboard navigation, ARIA roles, focus management; inspector focus trap.
	 - Acceptance:
		 - Keyboard-only user can switch views, select rows/events, open/close inspector.

16) Telemetry
	 - Emit events for view switches, selection/filters, board saves, deep-link copies, map polygons, graph expansions.
	 - Acceptance:
		 - Events appear in the analytics pipeline (stub or real).

## Testing hooks

- Follow `test-plan.md` for unit/integration/E2E. Add fast unit tests for adapters and deep links; integration tests for selection/filter sync.
- Include a minimal mock data set for local development and E2E.

## Migration & deprecations

- As per `migration-and-deprecations.md`: retain legacy routes one release; add banners and telemetry; remove when adoption threshold is met.
