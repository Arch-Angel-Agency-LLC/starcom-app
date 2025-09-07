# Progress Tracking - IntelAnalyzer Merger

Living status log for the merger roadmap. Checkboxes reflect actual implemented code, not just intent. Partial items explicitly note gaps.

Status summary:
- Phase A core scaffold in place (shell, adapters, table, deep-link).
- Outstanding Phase A gaps: timeline brushing → time filter, table virtualization, inspector multi-type depth.
- Deep-link view param now auto-synced.
- Phase B step 6 (selection broadcast + entity pivot) implemented early; Step 8 (Map/Graph) and Step 9 (Notes & Pins) completed with tests.
- Next focus candidates: close Phase A gaps before expanding Phase B (recommended) or proceed to remaining boards enhancements (step 7) with debt documented.

Legend:
- [x] = Implemented & working
- [ ] = Not implemented
- (PARTIAL) = Some bullets done; explicit remaining bullets listed
- MOSTLY DONE = Only minor outbound wiring or follow-on dependency pending

Progress metrics (informal):
- Phase A: 3/5 steps have initial implementations; 2/5 fully complete (1 & Review block), 3 partially complete (2–5).
- Phase B: Step 6 delivered early; Step 8 and Step 9 done; Step 7 base persistence implemented with some items pending.
- Debt items enumerated below before expansion.

## Phase A — Split roles and remove redundancy (MVP shell)

- [x] 1) Establish Analysis Workbench shell (new IntelAnalyzer)
  - [x] Create `src/applications/intelanalyzer/AnalysisWorkbench.tsx`
  - [x] Create `src/applications/intelanalyzer/layout/WorkbenchLayout.tsx`
  - [x] Add `src/applications/intelanalyzer/state/SelectionContext.tsx`
  - [x] Add `src/applications/intelanalyzer/state/FilterContext.tsx`
  - [x] Update route to render `AnalysisWorkbench` (keep route id)
  - [x] Remove dashboard-like lists from Analyzer
  - [x] Test: Renders left rail (empty), center Timeline stub, right inspector stub; no regressions in EnhancedApplicationRouter
- [ ] 2) Fold TimeMap into TimelineView (PARTIAL)
  - [x] Create `src/applications/intelanalyzer/views/TimelineView/TimelineView.tsx` (placeholder shell)
  - [x] Add `src/applications/intelanalyzer/adapters/eventsAdapter.ts` mapping Reports/Intel Items → Events
  - [x] Wire `IntelWorkspaceProvider` at workbench root
  - [x] Pass adapted events to TimelineView
  - [x] Test: Interactive brushing emits time filter via FilterContext (range slider brush functional)
  - [x] Embed `TimeMapBands` beneath histogram; selection clicks update `SelectionContext`
  - Notes: Replaced slider with embedded histogram brush (SVG, d3 binning) wired to FilterContext; full TimeMap visualization with richer interactions still pending.
- [ ] 3) Add TableView and basic left filters (PARTIAL)
  - [x] Create `src/applications/intelanalyzer/views/TableView/TableView.tsx` with columns: Type, Title, Timestamp, Category, Tags, Confidence, LocationFlag
  - [x] Basic virtualization (react-window) for body rows (height + dynamic sizing TODO)
  - [x] Implement FilterContext with fields from data-models.md (chips UI in left rail; time range controls added; geo placeholder chip add/remove; confidence slider polish)
  - [x] Test: Table reflects filtered subset for active filters
  - Notes: Dynamic height + resize observer + adaptive overscan implemented; remaining: adaptive row size & perf benchmarks.
- [ ] 4) Inspector scaffold (PARTIAL — FILE EXISTS & EVENT RENDERING WORKS)
  - [x] Create `src/applications/intelanalyzer/panels/InspectorPanel.tsx`
  - [x] Event rendering (source, time, category, tags, location, confidence, entities)
  - [x] Actions implemented: Pin (no-op), Copy deep link (uses encoder), Open in Dashboard (stub)
  - [x] Selection → inspector opens (event rows)
  - [x] Type-aware rendering for Report / Intel Item / Entity (minimal specialized panels)
  - [x] Deep link should also reflect current view automatically (view param synced outbound)
  - [x] Navigation action routes to Intel Dashboard (includes selected id as query param)
  - Notes: Basic generic renderer present; further specialization deferred.
- [ ] 5) Deep-link plumbing (PARTIAL)
  - [x] Implement `src/applications/intelanalyzer/utils/deepLink.ts` for encode/decode
  - [x] Parse on mount & update filters/selection (debounced); initial view now parsed on mount
  - [x] Outbound sync of active view param (auto-updates URL on switch)
  - [x] Include board id once boards feature lands
  - [x] Test: Selection, filters, view preserved on refresh; board id parsed and applied to active board.

## Mid-Phase A-B: Code Review & Audit

- [x] Code review of Phase A changes
- [x] Code audit for security/performance
- [x] Q&A session with user
- [x] Self-analysis of implementation
- [x] Progress critique and adjustments

## Phase B — Analyst workflows

- [x] 6) Selection sync and entity pivots (implemented early)
  - [x] SelectionContext broadcasts selection; table & inspector react; timeline placeholder highlights selection basis (expand later with real timeline)
  - [x] Entity chips clickable in inspector → inject entityRefs filter
  - [x] Test: Selecting in table updates inspector; entity chip filters rows
  - Notes: Timeline highlight styling minimal; revisit after real timeline brushing added.
- [ ] 7) Boards (local persistence)
  - [x] Create `src/applications/intelanalyzer/panels/BoardsPanel.tsx` to save/load boards (localStorage)
  - [x] Board save stores: view, filters, selection, layout
  - [x] Deep link includes board id; inbound parse selects active board
  - [x] Test: Saving and switching boards restores state across refresh (automated test added)
- [x] 8) MapView and GraphView (initial)
  - [x] MapView: MapLibre GL + Supercluster; render filtered events with clustering; polygon draw → geo filter chip
  - [x] GraphView: nodes (entities/reports/items), edges (mentions/co-occurrence); cap nodes; expand neighbors
  - [x] Test: Map reflects time filter and selection; polygon adds geo chip; Graph loads under cap; selecting node filters views
- [x] 9) Notes/Hypotheses and pinning
  - [x] Add lightweight notes/hypotheses in inspector; pin selected evidence to current board
  - [x] Test: Notes persist within board; pinned items count visible; switching boards swap notes/pins

## Mid-Phase B-C: Code Review & Audit

- [ ] Code review of Phase B changes
- [ ] Code audit for security/performance
- [ ] Q&A session with user
- [ ] Self-analysis of implementation
- [ ] Progress critique and adjustments

## Phase C — Correlation tools

- [ ] 10) Co-occurrence clusters and anomalies
  - [x] Introduce correlation utilities and provider shell; persisted UI toggle for clusters in FilterPanel
  - [PARTIAL] Add service to compute co-occurrence by time/place/tags/entities; surface as overlays (timeline bands, graph clustering)
    - [x] Timeline: anomaly-day bands overlay behind events when toggle is on
  - [x] Graph: co-occurrence links between entities with weight-based width; involved entities highlighted
  - [x] Graph: tag-based co-occurrence links (lighter styling) and tag nodes
  - [x] Place-based clustering overlay on Map (grid-binned hotspots)
  - [PARTIAL] Anomaly flags: z-score or frequency delta; badge in inspector
    - [x] Table rows show “Anomaly” chip on anomalous days when toggle is on
    - [x] Inspector badges for anomalies (event header) when toggle is on
  - [x] Test: Coverage for anomaly bands, entity co-occurrence overlay, and tag co-occurrence overlay
  - [x] Test: computePlaceClusters unit test for geo binning threshold
- [x] 11) Watchlists and alerts
  - [x] Add tag and entity watchlists saved on board; UI in FilterPanel; "Watch" chip displayed in Table rows; quick-add via Inspector (double-click tag/entity)
  - [x] Visual alerts on matches: row accent highlight and header watch-hit count; Inspector shows Watch badge
  - [x] Test: Adding to watchlist marks matching events (stabilized with global ResizeObserver polyfill)
  - [x] Test: Board retains watchlists across edits within provider (persistence harness test); header count and row flag covered

## Mid-Phase C-D: Code Review & Audit

- [ ] Code review of Phase C changes
- [ ] Code audit for security/performance
- [ ] Q&A session with user
- [ ] Self-analysis of implementation
- [ ] Progress critique and adjustments

## Phase D — Authoring bridge & exchange

- [ ] 12) Export to Draft Report (Workspace)
  - Contract
    - Inputs: current board (filters, notes, pins), optional selection, watchlists (for context), classification level
    - Output: Draft Report entity in Workspace with title, summary, classification, citations (evidence refs), related entities/tags
  - UI/UX
    - [x] Inspector action: "Export to Draft"
    - [x] BoardsPanel action: "Export Board to Draft"
    - [x] Pre-export dialog: title, classification, include watchlists? include filters? redact fields?
  - Implementation
    - [x] DraftBuilder service: map pins → evidence blocks; include optional filters/watchlists; basic redaction
  - [~] Evidence citation format: id, type, source, timestamp, tags, entities (partial: id/type/title/sourceId)
  - [x] Autosave: persist last export config per board (localStorage)
  - Deep-link & Navigation
  - [x] Include Analyzer deep-link in Draft metadata for round-trip
    - [x] Navigate to IntelDashboard with created Draft id
  - Security & Classification
    - [ ] Enforce required classification; mask/redact for lower levels
  - Telemetry
    - [x] Emit export_started/export_completed/export_failed with counts and timing (console + DOM event stub)
  - Tests
    - [x] Unit: DraftBuilder builds correct payload from sample board with pins, notes
    - [x] Integration: clicking export navigates to /intel with draft id (dialog auto-confirm harness)
  - [x] Redaction: redactSensitive option hides entity list in content

- [ ] 13) Package compose → MarketExchange
  - Contract
    - Inputs: selected reports/items/entities (from Workspace or Analyzer), metadata (title, summary, license), classification, optional signature
    - Output: Exchange Package (JSON manifest + assets) compliant with MarketExchange schema
  - UI/UX
    - [PARTIAL] Composer Wizard: select content → redact → classify → metadata → review → publish
      - [x] Added minimal Composer Wizard dialog with stepper (Source → Metadata → Review → Publish)
      - [x] Uses current Draft (or latest DRAFT fallback) via IntelReportService
      - [x] Added optional Ed25519 signing toggle (private key hex) in Redaction step; signing applied before zipping
  - [x] Redaction step UI added (strip deep-link, mask emails, mask long digit sequences)
  - [PARTIAL] Multi-source selection (pins/manual)
    - [x] Import from: current Draft (default)
    - [x] Import from: current Board pins (localStorage boards; active or most recent)
    - [x] Import from: manual pick list (basic add/remove UI; ID/Title/Content)
    - [x] MarketExchange button composes from real Workspace Draft via IntelReportService + adapter
    - [x] Fallback: if no ?draft param, use most recent DRAFT (else latest report)
    - [x] Telemetry for compose lifecycle wired; success alert shows id/url from mock publish
  - Implementation
    - [x] PackageComposer service: build manifest, bundle attachments, compute checksums (added compose + composeZip)
  - [x] Added composeZipWithManifest helper and async signing path (ed25519) when enabled
  - [x] Redaction support in PackageComposer (optional masking and deep-link stripping)
  - [x] Schema validation (runtime) with clear error messages (Zod schema + helper)
  - [x] Optional signing stub (ed25519 helper with sign/verify; not wired to UI yet)
    - [x] Publish adapter: mock/local endpoint now; real integration later
    - [x] Offline fallback: export .zip with manifest and assets (zip manifest + assets via JSZip)
  - Telemetry
    - [x] Emit compose_started/validated/published/failed with sizes and durations (console + DOM event stub)
  - Tests
    - [x] Unit: manifest generation and checksum presence/schema validity
    - [x] Unit: draft-to-compose adapter mapping test added
  - [x] Integration: Wizard publish path success (component-level) — onPublished called; telemetry events emitted
  - [x] Integration: Manual pick list path publishes successfully
  - [x] UX: Signing key validation (hex; length 64/128) disables Publish until valid
  - [x] Contract: schema validator accepts valid, rejects invalid (composer + negative fixture)
    - [PARTIAL] Integration: mock publish returns package id; UI shows confirmation (alert) and deep link (id/url shown)

### Phase D prerequisites & dependencies
- [ ] Confirm Workspace Draft data model and creation API/entry point
- [ ] Define MarketExchange package schema (v0) and mock publish endpoint
- [ ] Agree on classification/redaction rules and defaults

### Phase D milestones & acceptance
- D1 — Draft Export MVP
  - [ ] Export from Board/Inspector creates a Draft with evidence citations
  - [ ] Navigation to IntelDashboard opens the new Draft
  - [ ] Unit + integration tests pass; basic telemetry emitted
- D2 — Exchange Composer MVP
  - [ ] Wizard can assemble a valid package from a Draft or Board
  - [ ] Schema validation and offline export work; mock publish returns id
  - [ ] Tests for manifest, validation, and publish flow pass; telemetry emitted

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

## Phase A Gaps / Technical Debt

- TimelineView: Implement brush → timeRange in FilterContext.
- TableView: Add virtualization (e.g. MUI DataGrid Pro / react-virtualized / TanStack Virtual).
- Inspector: Specialized rendering for non-event types; real dashboard navigation; view param auto-sync.
- Deep Link: Persist current view; future board id integration.
- Filters: Time & geo filter UI (currently latent fields only); confidence slider polish.

### Phase A Remediation Checklist (updated)
1. Table virtualization refinements (dynamic height, resize handling, overscan tuning)
2. Inspector multi-type specialized panels (Report / Intel Item / Entity)
3. [x] Filter panel: surface time range controls + placeholder geo chip add/remove
4. Prepare for embedding full TimeMap visualization (replace slider stub)

### Ready-to-Implement Micro Tasks (bite-size)
- Add active view to deep link updater (read from local state variable) (est 10m)
- Introduce `timeRange` tuple in FilterContext and dummy setter used by TimelineView (5m)
- Stub brush handler in `TimelineView` to call `updateFilter('timeRange', [start,end])` (10m)
- Swap MUI Table body with simple windowing via `react-window` (initial naive integration) (30–40m)
- [x] Split Inspector event block into `<EventDetails />` component; leave placeholders for others (15m)

### Mini Changelog (recent doc updates)
- 2025-09-05: Marked steps 2–5 partial; added early completion note for step 6.
- 2025-09-05: Added legend, remediation ordering, and micro task list.
- 2025-09-05: Added automated test for Boards persistence (save/switch/restore across refresh).
- 2025-09-06: Embedded TimeMapBands in TimelineView and wired event click → SelectionContext.
- 2025-09-06: Implemented Step 9 (Notes & Pins) with persistence per board; added tests for notes/pins and resolved test env EMFILE issues via icon mocks.
- 2025-09-06: Deep-link robustness: revived Date types on inbound parse and board apply; added passing unit + integration tests. Added CorrelationProvider shell and a "Show clusters" toggle in FilterPanel (persisted), groundwork for Phase C.
- 2025-09-06: Correlation overlays: Timeline anomaly bands + Graph co-occurrence links added behind toggle; basic tests added. Table shows anomaly chips per row.
- 2025-09-06: Inspector anomaly badge added (header chip) and unit-tested via isolated component.
- 2025-09-06: Tag-based clustering: Graph tag nodes + tag co-occurrence links added; unit test added.
 - 2025-09-06: Place-based clustering: Added grid-binned place clusters overlay in MapView driven by CorrelationProvider; added unit test for computePlaceClusters.
  - 2025-09-06: Watchlists (Step 11) — tags + entities implemented: BoardsContext helpers, FilterPanel UI (add/remove), Inspector quick-add (double-click), Table "Watch" chip, row highlight + header count + Inspector watch badge. Added tests for marking, provider persistence, and alerts.
  - 2025-09-06: Test stabilization: introduced global ResizeObserver polyfill; added lightweight provider mocks; refactored flaky inspector anomaly test into focused unit test; all IntelAnalyzer tests green.
  - 2025-09-06: Expanded Phase D plan — detailed contracts, milestones, UI/UX, telemetry, and tests for Draft Export and Exchange Composer.
  - 2025-09-06: Exchange Composer — added Board pins source, Manual pick list source (basic UI), integration tests for publish flows, and signing key hex validation.

## Notes

- Last update: September 6, 2025
- Next recommended action: Address Phase A gaps before expanding boards (Phase B step 7) to avoid compounding debt.
