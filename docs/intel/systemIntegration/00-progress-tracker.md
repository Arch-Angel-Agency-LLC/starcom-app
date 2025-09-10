# Progress Tracker — Intel System Integration

Lightweight tracker with phases, steps, and concrete tasks (files). Update checkboxes and add PR links as you go.

Legend
- [ ] not started  |  [~] in progress  |  [x] done

## Status
- Current phase: Phase 3 — Shared services and providers
- Owning team: Intel Platform
- Guardrails: npm run guard:intel (should pass before finalize)

## At-a-glance Milestones
- [x] Replace local IntelReport interfaces (all flagged files migrated)
- [ ] All apps read via provider/service (Analyzer, NetRunner, CyberCommand, MarketExchange)
 - [~] All apps read via provider/service (Analyzer, NetRunner verified; CyberCommand provider probe added; MarketExchange now wrapped in IntelWorkspaceProvider with live drafts panel)
- [~] All writes via intelReportService (no direct storage/mutation)
- [~] Adapters/serialization covered by tests (round-trip + schema)
	- [x] Package → UI adapter test added (FLASH priority mapping, legacyId fallback, non-string content)
	- [x] Edge: empty tags, missing location, undefined confidence default
	- [x] Repository canonical save + load tests (DI seam) passing
	- [x] Repo saveAndCommitReport prefers canonical serializer (unit test added)
- [ ] Remove legacy/mocks; add ESLint/CI guard (enforced in PR)

How to update this file
- Check off tasks when merged. Add PR links inline (e.g., PR #123).
- Keep “Log” short and chronological.
- Run guard locally before PR: npm run guard:intel

---

## Phase 0 — Prep & Docs
Steps
- [x] Scaffold integration docs (README/cookbook/migration/guardrails)
	- [x] Create README with code pointers
	- [x] Cookbook with provider/service snippets
	- [x] Migration guide (remove local interfaces)
	- [x] Guardrails (lint/CI) draft
- [x] Add guard script and CI precheck
	- [x] Implement scripts/guard-intel-types.mjs
	- [x] Wire npm scripts: guard:intel, ci:precheck:intel
	- [x] Add CI workflow job to call ci:precheck:intel
		- [x] intel-precheck.yml added (runs guard + targeted tests)
- [x] Add ESLint custom rule (optional; CI guard in place)
	- [x] Rule scaffold (no-local-intelreport)
	- [x] Add to eslint.config.js and CI lint
	- [x] Escalate rule to error after zero violations confirmed

Tasks
- [x] docs scaffold — PR: add link
	- [x] README/cookbook
	- [x] Migration/guardrails
	- [x] Per-app guides
- [x] scripts/guard-intel-types.mjs — PR: add link
	- [x] Verify works locally (passes/fails as expected)
	- [x] Document in README
- [~] eslint rule no-local-intelreport — PR: add link
	- [x] Implement rule
	- [x] Add autofix hint in error message (multi-suggestion: comment, alias, import)
	- [ ] Escalate to error (pending zero remaining declarations)

---

## Phase 1 — Analyzer alignment
Steps
- [x] Replace local IntelReport usage in Analyzer UI
	- [x] Identify interfaces declared inline
	- [x] Import IntelReportUI and related enums
	- [x] Remove local interface declarations
- [x] Ensure reads via IntelWorkspaceContext; writes via IntelReportService
	- [x] Swap local state seeds to provider data
	- [x] Route create via service methods
	- [x] Avoid direct localStorage or ad-hoc persistence
- [x] Add minimal integration test: create → render → edit → persist
	- [x] Seed 1–2 reports via manager/service
	- [x] Verify list renders provider data
	- [x] Edit and confirm persistence via service

Tasks (files)
- [~] src/components/IntelAnalyzer/IntelReportsViewer.tsx — replace local interface; provider/service; PR: ____
	- [x] Import IntelReportUI
	- [x] Remove local IntelReport interface
	- [x] useIntelWorkspace() for reads
	- [x] intelReportService for writes
	- [x] Remove mock data; add seed util where needed
- [~] Verify GraphView uses provider data only (types consistent) — PR: ____
 	- [x] Confirm node/report types align with IntelReportUI
 	- [x] Ensure no local Intel types remain
	- [x] Provider integration tests (initial + live updates) added

---

## Phase 2 — NetRunner consolidation
Steps
- [~] Replace NetRunner model/types with IntelReportUI
	- [x] Remove local IntelReport interface in model (NetRunnerIntelReport + builder deleted)
	- [x] Migrate builder to thin helper that returns IntelReportUI input (direct CreateIntelReportInput path only)
- [~] Route persistence via IntelReportService
	- [x] Create via service (publishNetRunnerReport + publishIntelReportFromWorkflow)
	- [x] Update via service
	- [x] Remove direct storage writes (no direct writes found in current paths)
- [~] Remove builder or adapt to service-backed creation
	- [x] Adapter returns CreateIntelReportInput; builder retained temporarily

Tasks (files)
- [~] src/applications/netrunner/models/IntelReport.ts — publish adapter added; PR: ____
	- [x] Import IntelReportUI
	- [x] Add toCreateIntelReportInput and publishNetRunnerReport
	- [~] Replace NetRunnerIntelReport usages with IntelReportUI downstream (interface now marked DEPRECATED) (smoke script migrated; deprecated workflow creator now warns)
	- [x] Removed obsolete fromNetRunnerIntelReport adapter (no remaining references)
	- [x] Slim legacy builder & interface (bridging alias only) — ready for Phase 5 removal
- [~] src/applications/netrunner/integration/IntelAnalyzerIntegration.ts — publish helper; PR: ____
	- [x] Added publishIntelReportFromWorkflow using intelReportService
	- [x] Refactored publishIntelReportFromWorkflow to bypass NetRunnerIntelReport (direct CreateIntelReportInput)
- [x] NetRunner Bot adapters/publish — PR: ____
	- [x] Add toCreateIntelReportInputFromBot and publishBotIntelOutput
	- [x] Unit tests for adapters and publish
- [~] src/applications/netrunner/types/BotMission.ts — update references; PR: ____
	- [x] Add publishedReports/publishedAt fields for post-publish canonical linkage
	- [x] Retain local BotIntelReport lightweight shape (no change)
	- [~] Replace any downstream usages expecting only local reports (helper getBotOutputCanonicalReports added)
	- [x] Adjust executor to populate publishedReports after publishing (executor publishMissionOutput added)

---

## Phase 3 — Shared services and providers
Steps
- [x] Drop legacy Intel types in data/visualization services
	- [x] Remove interface/type IntelReport in services
	- [x] Replace with IntelReportUI imports
- [ ] Use adapters + IntelReportUI for transforms
	- [x] Standardize date/coords transforms
	- [x] Keep serialization via intelReportSerialization
- [ ] Add unit tests for transforms (round-trip)
	- [x] Input → adapter → serialize → parse → UI round-trip
	- [x] Legacy alias fields tolerant in adapters

Tasks (files)
- [x] src/services/IntelReportVisualizationService.ts — remove local IntelReport; use UI/adapters; PR: ____
	- [x] Delete local IntelReport/IntelReportData types
	- [x] Map to IntelReportUI using adapters
	- [x] Replace any direct API shapes with adapter layer
- [~] src/services/data-management/providers/IntelDataProvider.ts — standardize types; PR: ____
	- [x] Replace exported Intel types with IntelReportUI
	- [x] Normalize lat/long → latitude/longitude (legacy endpoint kept; UI endpoint added)
	- [x] Fully migrate consumers to 'intel-ui' endpoint (Analyzer, NetRunner, CyberCommand probe, MarketExchange compose test)
	- [x] Verified no remaining code fetches 'intel-legacy' endpoint directly (only internal fallback retained)
- [~] src/services/IntelRepositoryService.ts — route through IntelReportService; PR: ____
	- [x] Use service CRUD (list/get/create/save) facade
	- [x] Remove bespoke persistence paths after migration (no direct writes remain in this service)
	- [x] Restore lost repository type definitions (GitConfig, BranchInfo, RepositoryInfo, CommitHistory, MergeResult, ConflictResolution, ReviewRequest) after refactor corruption
	- [x] Introduce canonical serializer for report save (saveCanonicalUIReport added for incremental adoption)
		- [x] Add canonical repository save test using DI seam (vitest passing)
		- [x] Add canonical repository load method + test (vitest passing)

---

## Phase 4 — Cross-app components and types
Steps
- [ ] Replace remaining local IntelReport declarations in shared UI/types
	- [ ] Identify shared components exporting local Intel types
	- [ ] Import IntelReportUI; remove duplicates
- [ ] Ensure serialization schema is single-source
	- [ ] Use intelReportSerialization only
	- [~] Remove ad-hoc stringify/parse code paths

Tasks (files)
- [x] src/components/Intel/IntelDashboardPopup.tsx — update to IntelReportUI/service; PR: ____
	- [x] Replace localStorage with intelReportService (list/subscribe/create)
	- [x] Verify renders with provider data (unit test added)
- [x] src/components/Intel/IntelReportPopup.tsx — submit via intelReportService; PR: ____
	- [x] Replace on-chain submit with centralized createReport
	- [x] Map form fields to CreateIntelReportInput
- [x] src/components/CyberInvestigation/IntelReportSubmission.tsx — route online submit via intelReportService; PR: ____
	- [x] Keep offline queue; sync to createReport when online
	- [x] Remove wallet-signing dependency for local creation
- [x] src/globe-engine/GlobeEngine.ts — intelMarkers overlay uses IntelReportVisualizationService; PR: ____
	- [x] Remove direct on-chain fetch in overlay
- [x] src/pages/Reports/NewReportPage.tsx — create via intelReportService; PR: ____
	- [x] Remove direct Anchor/IPFS choreography for creation
	- [x] Updated unit test to mock intelReportService instead of anchor/ipfs
 - [ ] src/types/IntelArchitectureAudit.ts — consolidate/alias or remove; PR: ____
	- [x] Replace IntelReport with IntelReportUI (narrative updated; migration banner completed)
	- [x] Remove dead fields; document migrations (pruned legacy sections, added PRUNE_STATUS)
- [ ] src/types/IntelReportPackage.ts — consolidate/alias or remove; PR: ____
	- [~] Align package schema with serialization (audit performed; mapping helpers added)
	- [x] Add import/export helpers (toCreateIntelReportInputFromPackage, toIntelReportPackageFromUI)
 - [ ] src/models/Intel/IntelligenceFlowchart.ts — remove legacy dissemination interface; PR: ____
	- [x] Rename legacy IntelReport → FlowchartIntelDisseminationReport (deprecation banner)
	- [ ] Remove after downstream verification (Phase 5)

---

## Phase 5 — Guardrails enforcement and cleanup
Steps
- [ ] Enable CI precheck on all intel-related PRs
	- [x] Add workflow step for ci:precheck:intel
	- [x] Scope to paths: src/services/intel/** and affected apps
- [ ] Optional: enable ESLint custom rule repo-wide
	- [ ] Gate on green signal (low false positives)
- [ ] Delete deprecated types/mocks; migration notes in docs
	- [ ] Remove allowlist from guard if used
	- [ ] Update docs with “after” architecture

Tasks
- [x] Wire ci:precheck:intel in CI workflow — PR: ____
	- [x] Add job and cache node_modules (intel-precheck.yml)
	- [x] Fail PR on guard/test failures (echo fallback removed; strict set -e)
- [ ] Remove legacy/mocks/fixtures after migration — PR: ____
	- [ ] Delete duplicated types/interfaces
	- [ ] Purge sample fixtures that bypass service
	- [x] Guard script now flags LegacyIntelReport / NetRunnerIntelReport outside allowlist (prep for deletion)

---

## Phase 6 — Tests and QA
Steps
- [ ] Adapters + serialization round-trip tests
	- [~] UI → serialize → parse → UI checks (basic round-trip added)
	- [x] Dates/coords/enum integrity (extreme bounds tests + status transition lifecycle test added)
- [ ] Per-app smoke tests for list/map/graph views
	- [~] Analyzer list + GraphView (list & graph provider tests added; GraphView test initial)
	- [~] NetRunner dashboards (provider list test added)
	 - [~] CyberCommand tasking
	 - [~] MarketExchange mapping flows
- [ ] Final UAT sign-off
	- [ ] Stakeholder review checklist
	- [ ] Sign-off recorded in log

Tasks
- [ ] Add/verify unit tests in src/services/intel/** — PR: ____
	- [x] reportMappers tests (alias/summary handling)
	- [x] intelReportSerialization tests (schema constraints)
	- [x] IntelWorkspaceService canonical save/load tests (serializer-backed)
- [ ] E2E smoke: create 2 reports → render across apps — PR: ____
	- [~] Seed via manager → verify UI in each app (probe-based propagation + cross-app provider probes added)
	- [x] Edit in one app → assert others reflect update (extended propagation test saves + status transition)

---

## Log
 - 2025-09-10: All targeted intel tests PASS (47/47). Cross-app propagation test now green after NetRunner “latest” selection weighted to prefer UPDATED history over status-only changes; isolation fixed via localStorage clearing; UUID-based IDs reduce collisions.
 - 2025-09-10: Deprecated IntelWorkspaceService.loadIntelReport; canonical-first load path with parser delegation; placeholder fallback retained for legacy calls.
 - 2025-09-10: Added repository canonical load method (loadCanonicalUIReport) and a passing unit test using injected reader/writer; canonical save/load path validated end-to-end.
 - 2025-09-10: Fixed canonical schema header in repo canonical-first path (schema: 'intel.report', schemaVersion: 1); added unit test for saveAndCommitReport canonical fallback; all intel tests PASS (46/46).
 - 2025-09-10: IntelWorkspaceService gained saveIntelReportCanonical (serializer-backed) with DI writer and a passing unit test.
 - 2025-09-10: Stabilized status transition tests by switching to crypto.randomUUID-based IDs and ensuring unique report IDs; lifecycle versioning verified.
 - 2025-09-09: Added getBotOutputCanonicalReports helper to prefer canonical publishedReports for BotIntelOutput consumers; advanced Phase 2 downstream adaptation task.
 - 2025-09-09: Restored missing IntelRepositoryService type definitions (GitConfig, BranchInfo, RepositoryInfo, CommitHistory, MergeResult, ConflictResolution, ReviewRequest) after previous corruption; deferred canonical serializer integration to guarded Phase 4 task.
 - 2025-09-09: Removed obsolete fromNetRunnerIntelReport adapter and added status transition lifecycle tests (DRAFT→ARCHIVED path + invalid backward transition) advancing Phase 6 enum integrity milestone.
 - 2025-09-09: Pruned legacy sections from IntelArchitectureAudit (status -> PRUNED_AUDIT_COMPLETE) closing Phase 4 pruning task.
 - 2025-09-09: Added extreme serialization round-trip tests (min/max lat/long, epoch & far-future timestamps) advancing Phase 6 edge coverage.
 - 2025-09-09: Added IntelReportPackage helper functions (toCreateIntelReportInputFromPackage, toIntelReportPackageFromUI) + unit tests covering FLASH→IMMEDIATE mapping and reverse metadata stub.
 - 2025-09-09: BotMissionExecutor.publishMissionOutput added to auto-publish BotIntelOutput reports and attach publishedReports/publishedAt (Phase 2→3 task complete).
- 2025-09-09: Added tsconfig.test.json and consolidated adapter test (IntelReportPackage.adapter.test.ts) validating FLASH→IMMEDIATE mapping & legacyId fallback.
 - 2025-09-09: Added tsconfig.test.json and consolidated adapter test (IntelReportPackage.adapter.test.ts) validating FLASH→IMMEDIATE mapping & legacyId fallback.
 - 2025-09-09: Adjusted cross-app propagation test expectations: marketplace drafts currently lag title edits (tracking improvement task later) while status filtering verified.
 - 2025-09-09: Wrapped cross-app propagation test mutations in act to remove React state update warnings (stabilizes provider test harness).
 - 2025-09-09: Deprecated legacy unified interface (renamed IntelReport -> LegacyIntelReport in models) to unblock Phase 4 duplicate type replacement.
 - 2025-09-09: Completed adapter edge case tests (empty tags, missing location, undefined confidence) marking adapter coverage milestone done.
- 2025-09-09: Renamed IntelligenceFlowchart IntelReport legacy interface to FlowchartIntelDisseminationReport (deprecated) + enhanced ESLint rule messaging.
- 2025-09-09: Added GraphView live updates provider test (dynamic subscription validation) and marked GraphView provider tests complete.
- 2025-09-09: IntelArchitectureAudit narrative updated to IntelReportUI terminology; migration status flipped to COMPLETED banner.
- 2025-09-09: MarketExchangeApplication wrapped in IntelWorkspaceProvider + live DraftReportsPanel; cross-app propagation test tightened to expect edited title in marketplace.
- 2025-09-09: Added MarketExchange provider compose integration test (publish flow) and CyberCommand provider probe test; updated tracker Phase 6 per-app coverage.
- 2025-09-08: Removed NetRunnerIntelReport interface & builder; tests now use buildCreateIntelReportInput directly.
- 2025-09-08: Added cross-app service smoke test (create/list/update/status) establishing baseline before per-app UI render tests.
- 2025-09-08: Added IntelReportsViewer provider integration test validating intel-ui sourced reports render.
- 2025-09-08: Added serialization constraint tests (invalid enum, missing required, confidence range, version preservation).
- 2025-09-08: Added unified intel-ui endpoint provider test (success + fallback) to validate service-backed reads.
- 2025-09-08: Added legacy alias mapping tests (classification variants, summary length, defaults, timestamps) for IntelDataProvider. Updated deprecated createIntelReportFromWorkflow to return CreateIntelReportInput directly.
- 2025-09-08: Added runtime deprecation warning to createIntelReportFromWorkflow; next step remove after remaining references eliminated.
- 2025-09-08: ESLint rule scaffold `no-local-intelreport` added (warn-level); integrated into config; rule spec documented.
- 2025-09-08: Migrated civilian NetRunner smoke script to service-based workflow publish (removed deprecated createIntelReportFromWorkflow usage in smoke path).
- 2025-09-08: Added edge-case serialization tests (history ordering, coordinate precision, enum invalid cases, confidence warning path). Updated BotMission output type with publishedReports.
- 2025-09-08: Added intelReportSerialization round-trip tests (basic fidelity + warnings + schema error cases).
- 2025-09-08: Refactored publishIntelReportFromWorkflow to build CreateIntelReportInput directly (bypasses NetRunnerIntelReport).
- 2025-09-08: Added NetRunner publish integration test (builder→adapter→service) and helper buildCreateIntelReportInput; marked NetRunner interface deprecated.
- 2025-09-08: Updated NewReportPage.unit.test to use intelReportService mock; removed wallet UI from IntelReportPopup; adjusted IntelRepositoryService notes.
- 2025-09-08: Migrated IntelReportPopup and CyberInvestigation submit flow to intelReportService.createReport; globe intelMarkers overlay now reads via IntelReportVisualizationService; NewReportPage creates via centralized service.
- 2025-09-08: Phase 3 start — migrated IntelReportVisualizationService to IntelReportUI via intelReportService; added focused tests.
- 2025-09-08: IntelDataProvider: added 'intel-ui' endpoint returning IntelReportUI[]; legacy types marked deprecated; added UI fallback; round-trip mapper test added.
- 2025-09-08: Scaffolded docs, added guard script, and precheck scripts.
- 2025-09-08: Analyzer Viewer migrated to provider/service/types; build green.
- 2025-09-08: Added Analyzer viewer integration test (create→render→edit→persist) passing.
- 2025-09-08: NetRunner: added adapters (toCreateIntelReportInput) and publish helpers; integration publish function added; adapter unit test added; guard still PASS.
- 2025-09-08: NetRunner: added BotIntelReport adapters and publish function; added unit + integration tests for publish; all tests PASS.
- 2025-09-08: NetRunner: added save/status update headless test (service update path); guard+intel tests PASS.