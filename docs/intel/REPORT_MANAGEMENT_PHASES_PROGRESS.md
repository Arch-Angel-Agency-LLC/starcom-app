# Report Management Extended Phases Progress Tracker

Purpose: Single living document to track design intent, implementation status, acceptance criteria, risks, metrics, and decisions for the next expansion phases (Import/Export, Validation, Search, Version Semver, Diff, Packaging, Security hooks).

Updated: 2025-08-17
Owner: (assign)

Legend:
- Status Codes: PLANNED | IN_PROGRESS | BLOCKED | COMPLETE | DEFERRED
- Priority: H (High), M (Medium), L (Low)

## Phase Overview Snapshot
| Phase | Title | Core Goal | Status | Priority |
|-------|-------|-----------|--------|----------|
| 0 | Lifecycle Refactor | Extract lifecycle helpers | COMPLETE | H |
| 1 | Canonical Serialization | Round‑trip stable schema v1 | COMPLETE | H |
| 2 | Central Validation | Unified validateReport API | COMPLETE | H |
| 3 | Export UI | One-click JSON export with guard | COMPLETE | H |
| 4 | Import UI | Safe single/batch import + conflict resolution | COMPLETE | H |
| 5 | Search / Index | Lightweight in-memory index + filter UI | COMPLETE | H |
| 6 | Semver Versioning | Semantic version bumps + migration | PLANNED | M |
| 7 | History Diff | Field diff modal for versions | PLANNED | M |
| 8 | Packaging | Bundle reports + intel items | PLANNED | L |
| 9 | Security & Policy Hooks | Export classification guard + hooks | PLANNED | M |

## HUMINT Reprioritized (Additive) Phases
| Phase | Objective | Status | Priority |
|-------|-----------|--------|----------|
| H0 | Intel Item Parity (edit/history/export/import) | PLANNED | H |
| H1 | Linking UX (reports ↔ intel items) | PLANNED | H |
| H2 | Validation UI Integration | PLANNED | H |
| H3 | Autosave & Dirty State | PLANNED | H |
| H4 | Semantic Version + Diff | PLANNED | M |
| H5 | Author Identity Attribution | PLANNED | M |
| H6 | Multi-Entity Packaging | PLANNED | M |
| H7 | Policy & Classification Guards | PLANNED | M |
| H8 | Quality Scoring & Enhancements | PLANNED | L |

---
## Delta Summary (Since 2025-08-10)
Completed original Phases 0-5 (core foundation). Introduced HUMINT-focused phases to close gaps: intel item lifecycle, linking, validation surfacing, autosave, semantic versioning + diff, user attribution, packaging, policy.

## Immediate Focus (Sprint)
1. Implement H0 (intel item panels, validator, serializer, history/version).
2. Implement H1 (linking dialog & back-links).
3. Integrate validation UI (H2) for reports.

---
## Phase 0: Lifecycle Refactor
Goal: Isolate version & history logic from `IntelReportService` for testability and clarity.
Scope:
- Create `reportLifecycle.ts` (computeChangedFields, nextVersion, makeHistoryEntry)
- Adjust service to import helpers.
Acceptance:
- No behavior change (diff in compiled output limited to import paths).
- Unit tests for helper functions (if they didn’t exist earlier).
Risks: Hidden coupling to service internals.
Mitigations: Keep helpers pure (no storage access).
Metrics: Lines of code removed from service (>15 LOC) & 100% statement coverage in new file.
Status: COMPLETE
Notes: Helpers refactored; deterministic timestamp injection added; tests (6) passing.

## Phase 1: Canonical Serialization (Schema v1)
Goal: Deterministic JSON format enabling export/import & tests.
Schema Header:
```
{ schema: "intel.report", schemaVersion: 1 }
```
Invariants:
- Dates serialized ISO UTC.
- Optional arrays omitted if empty.
Deliverables:
- `intelReportSerialization.ts`: `serializeReport`, `parseReport`, `isSerializedIntelReportV1`.
- Tests: round-trip, tampered schemaVersion, missing required field, invalid enum.
Acceptance:
- Round-trip equality for sample set (ignoring Date object identity). 
- Parse collects warnings for non-fatal issues.
Risks: Schema drift later.
Mitigation: Freeze v1; add ADR note if v2 needed.
Status: COMPLETE
Notes: Tests cover round-trip, schemaVersion tamper, missing required, invalid classification, confidence warning, omission of empty arrays.

## Phase 2: Central Validation
Goal: Single validator returning structured issues.
Rules (Initial):
- title/content required
- classification & status enums
- confidence in [0,1]
- geo pair & ranges (lat -90..90, lon -180..180)
- array length caps (config) for conclusions/recommendations/methodology
- duplicate tags detection
Outputs: `{ field, code, severity, message }`.
Deliverables: `reportValidation.ts` + tests (each rule, aggregate severity).
Acceptance: All rules covered; severity escalation works.
Status: COMPLETE

## Phase 3: Export UI
Goal: User can export a report as `.intelReport.json`.
Deliverables:
- Button in `ReportDetailPanel`.
- Classification guard confirmation if SECRET/TOP_SECRET.
- Filename: `report-{id}-v{version || 1}.intelReport.json`.
Acceptance: Downloaded file parses w/o ERROR issues.
Status: COMPLETE

## Phase 4: Import UI
Goal: Safe ingest of single/multiple exported reports.
Features:
- Modal: paste JSON or select files.
- Display parse + validation results (OK / WARN / ERROR).
- Collision strategies: newId (default), overwrite, skip.
- History entry action: IMPORTED.
Acceptance: Import at least one sample yields new report; collision path tested.
Risks: Overwrite accidental.
Mitigation: Secondary confirmation for overwrite.
Status: COMPLETE

## Phase 5: Search / Indexing
Goal: Fast client-side filtering.
Index Fields: title, tags, summary, content, conclusions, recommendations, methodology.
Ranking Weights: title=3, tags=2, others=1.
Deliverables: `reportSearchIndex.ts` (buildIndex, search), UI search bar.
Acceptance: Query tokens AND; ranked order reflective of weights; tests cover multi-token queries.
Status: COMPLETE

## Phase 6: Semantic Versioning
Goal: Transition numeric version to semver `MAJOR.MINOR.PATCH`.
Rules:
- MAJOR: status transition to APPROVED.
- MINOR: substantive analytical/content field change.
- PATCH: metadata-only (tags, geo, priority, targetAudience) changes.
Migration: Existing numeric N -> `${N}.0.0`.
Acceptance: Legacy reports migrate; new saves follow rule set; tests for each change category.
Status: PLANNED

## Phase 7: History Diff Modal
Goal: Visual change inspection between history points.
Diff Scope: multi-line text fields (content, methodology, conclusions[], recommendations[] aggregated).
Approach: Simple line-based diff (LCS minimal) – future upgrade path for word granularity.
Deliverables: `diffUtils.ts`, `HistoryDiffModal`.
Acceptance: Selecting two versions surfaces added/removed lines with color coding.
Status: PLANNED

## Phase 8: Packaging
Goal: Bundle multiple reports + intel items for distribution.
Format: `{ schema: "intel.package", schemaVersion: 1, reports: [...serialized], intelItems: [...], manifest: { createdAt, count } }`.
Acceptance: Export + import package rehydrates all entities.
Status: PLANNED

## Phase 9: Security & Policy Hooks
Goal: Introduce policy layer without implementing full security.
Hooks:
- canExport(report)
- canImport(serialized)
- classification guard enforced centrally.
Future: encryption interface placeholder.
Acceptance: Guards invoked; denial surfaces descriptive message.
Status: PLANNED

---
## Cross-Cutting Concerns
Testing Strategy:
- Pure modules (serialization, validation, search, versioning, diff) get unit tests first.
- Snapshot test for serialized schema (locked example JSON).
Performance:
- Monitor localStorage size; consider compression if >200KB aggregate.
Observability:
- Console logs guarded by debug flag for import/export events.
Documentation:
- Add SCHEMA_INTEL_REPORT_V1.md after Phase 1 complete.

## Risk Register
| Risk | Phase | Impact | Likelihood | Mitigation |
|------|-------|--------|------------|------------|
| Schema churn after export released | 1-4 | Data incompatibility | M | Version, additive changes only |
| Overwrite collisions | 4 | Data loss | M | Default newId + confirmation |
| Search relevance dissatisfaction | 5 | UX friction | M | Adjustable weights constant |
| Version misclassification | 6 | Confusing history | L | Comprehensive diff-based classification tests |
| Diff scalability w/ large content | 7 | UI lag | L | Lazy render, simple algo first |

## Decision Log (Append as needed)
| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-08-10 | Adopt schemaVersion=1 flat structure | Simplicity for early tooling | Easier parsing |
| 2025-08-10 | Semver deferred to Phase 6 | Avoid premature complexity | Faster early delivery |

## Metrics (To Populate)
- Avg parse time (ms) for 10 reports
- Search query time (ms) for 100 reports
- Validation issues per imported report (avg)
- Coverage % for pure modules

## Next Immediate Actions
1. Implement Phase 0 refactor.
2. Complete Phase 1 serialization + tests.
3. Draft SCHEMA_INTEL_REPORT_V1.md (pending Phase 1 acceptance).

---
(End of document – update statuses as work progresses)
