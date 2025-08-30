# Intel Report Management Roadmap
Date: 2025-08-09 (Updated 2025-08-17)
Status: Revised

## Objective
Enable HUMINT workflow: create, enrich, link raw intelligence (Intel Items) to analytical Reports, store locally, validate quality, export/import reliably, and iterate with auditable history.

## Current State (Updated)
- Reports: Create/View/Edit/Delete with structured fields; status transitions enforced; history + version (numeric).
- Export/Import: Implemented for reports (single JSON) with collision strategies.
- Validation: Core engine implemented (pure) + tests; not fully surfaced in UI saves (only basic form guards) -> GAP.
- Search: Token index for reports (title/tags/content/etc.).
- Intel Items: Creation only (no edit/detail/history/export/import); no linkage UI -> GAP.
- Linking: Report.sourceIntelIds manual only (no picker, no back-links) -> GAP.
- Autosave: Missing -> GAP.
- Version Semantics: Simple increment only; no MAJOR/MINOR meaning -> GAP.
- Diff/History Visualization: Not implemented -> GAP.
- Security/Classification: Simple export confirm for SECRET/TOP_SECRET; no policy layer -> GAP.

## Critical HUMINT Gaps
1. Intel Item lifecycle parity (edit, history, validation, export/import).
2. Source linkage UX (select & manage linked items, back-links display).
3. Validation surfacing & enforcement in UI (block ERROR, show WARN/INFO).
4. Autosave + dirty state + conflict guard.
5. Semantic versioning (major on approval, etc.) + diff view.
6. Author identity (currentUser context) for history accuracy.
7. Package (multi-entity) export/import (reports + intel items).
8. Policy hooks for classification export guard.

## Reprioritized Phases (HUMINT Focus)
| Phase | Focus | Delta vs Prior | Status |
|-------|-------|---------------|--------|
| H0 | Intel Item Parity | NEW top priority | PLANNED |
| H1 | Linking UX & Backlinks | Elevate earlier | PLANNED |
| H2 | Validation UI Integration | Surface + block errors | PLANNED |
| H3 | Autosave & Dirty Handling | Prevent data loss | PLANNED |
| H4 | Semantic Version & Diff | Upgrade version logic | PLANNED |
| H5 | Author Identity & History Attribution | Add user context | PLANNED |
| H6 | Packaging (Multi-Entity) | Combine entities | PLANNED |
| H7 | Policy & Classification Hooks | Central guards | PLANNED |
| H8 | Stretch Enhancements | Quality scoring, summaries | PLANNED |

## Phase H0: Intel Item Parity
Deliverables:
- IntelItemDetailPanel & IntelItemEditPanel (mirroring reports minimal set).
- Intel item history & version fields.
- Export/import (.intel JSON or markdown+frontmatter) minimal serializer/parser.
- Validation (required title/content/type/classification, confidence 0..1, tags duplication).
Acceptance: Create→Edit→History→Export→Import round-trip for item.

## Phase H1: Linking UX
Deliverables:
- Report linking dialog: searchable list of intel items with multi-select, add/remove.
- Display linked items in ReportDetailPanel (title + quick preview snippet).
- Back-links: Each intel item lists referencing reports.
Acceptance: Add/remove reflected immediately; round-trip persists.

## Phase H2: Validation UI Integration
Deliverables:
- ReportEditPanel & IntelItemEditPanel show live validation panel.
- Save disabled on ERROR; WARN/INFO displayed non-blocking.
- Inline field markers (aria-descriptions for accessibility).
Acceptance: Introduce an ERROR (blank title) -> save disabled.

## Phase H3: Autosave & Dirty State
Deliverables:
- Debounced autosave (e.g. 2s inactivity) for drafts.
- Dirty badge & Last autosaved timestamp.
- Conflict check: if underlying version changed before manual save -> prompt merge.
Acceptance: Edits persist on navigation away without explicit save.

## Phase H4: Semantic Version + Diff
Deliverables:
- Version becomes semver (MAJOR.MINOR.PATCH) per rules.
- Diff modal (content & analytical arrays) for history entries.
- Version bump logic integrated into lifecycle helpers.
Acceptance: Status change to APPROVED triggers MAJOR bump.

## Phase H5: Author Identity
Deliverables:
- currentUser context/provider (stub with configurable username).
- History entries record user; import can map or note original.
Acceptance: New edits show correct user in history.

## Phase H6: Packaging
Deliverables:
- Export package (manifest + serialized reports + intel items) JSON.
- Import package with conflict resolution.
Acceptance: Package round-trip rehydrates all entities.

## Phase H7: Policy & Classification
Deliverables:
- Central policy module (canExportReport, canImportReport).
- Enforcement in export/import flows; UI error messaging.
Acceptance: Attempt to export TOP_SECRET if policy denies -> blocked with message.

## Phase H8: Enhancements / Quality
Deliverables:
- Quality score function (fields completeness, linked sources count, confidence present).
- Auto summary generator stub (content first N sentences) + manual override toggle.
- Duplicate detection (hash-based) warning.
Acceptance: Quality score visible and updates on edit.

## Immediate Sprint Backlog (Actionable)
1. Add IntelItem types parity (history/version) + validation module.
2. IntelItem detail & edit panels + CRUD in manager.
3. IntelItem serialize/parse + tests.
4. Linking dialog component + integration in report edit.
5. Validation panel integration for ReportEditPanel (consume existing validator).

## Updated Testing Plan
- New unit tests: intel item validator, intel item serialization, linking persistence.
- Component tests: linking dialog operations, validation panel blocking save.
- Integration: item create→link→report export→import package (later phase).

## Risks & Mitigations (Delta)
| Risk | Area | Mitigation |
|------|------|-----------|
| Scope creep before HUMINT core done | Roadmap | Lock features to H0-H3 before diff/version revamp |
| Autosave overwrite race | Autosave | Version check & abort + prompt merge |
| Linking scaling (many items) | Linking | Virtualized list & incremental search later if needed |

---
(Previous sections retained below for historical context)

<!-- Original roadmap content retained below -->

## Objective
Maximize user ability to create, edit, organize, validate, search, import/export, and lifecycle-manage Intel Reports (.intelReport JSON) alongside supporting raw Intel (.intel markdown) within the unified workspace.

## Current State (Summary)
- Reports: Basic create/list (title/content/category/tags/classification/status) via UI abstraction -> IntelWorkspaceManager (localStorage).
- Structured report fields (summary, conclusions, recommendations, methodology, targetAudience, relationships) unused.
- Editing: Not implemented (no detail view / inline editing).
- Import/Export: Missing.
- Validation: Minimal form-level; no schema or lifecycle validation.
- Status Workflow: Unenforced transitions.
- Search/Filter: Basic category/status only (reports); none for intel items.
- Metadata: Stored in metadata.status/categories/tags/geo; inconsistent coverage.

## Key User Capabilities Needed
1. Create fully structured reports (all core fields, metadata, lifecycle).
2. Edit existing reports (field-level changes with validation & draft preview).
3. Manage report lifecycle (status transitions with rules + audit trail).
4. Organize & navigate (filter, search, tag/category exploration).
5. Import existing .intelReport and .intel files (drag & drop / file picker) with conflict resolution.
6. Export single or batch reports (raw JSON, pretty JSON, packaged zip).
7. Link reports to source Intel (.intel) items (sourceIntel refs management UI).
8. Build draft packages from selected reports + intel.
9. Validate content quality (schema, required fields, classification checks).
10. View change history / diff (future).

## Prioritized Phases
### Phase A: Structured Editing Foundation
Deliverables:
- ReportDetailPanel (view mode) + Edit mode.
- Structured form sections: Metadata, Core Content, Analysis, Conclusions/Recommendations, Source Links.
- Adapter expansion: UI <-> IntelReportData full field coverage.
- Auto-generate summary from content if empty; optional manual override.
- Status display (read-only).

### Phase B: Editing & Lifecycle Controls
Deliverables:
- Status transition map + guard function (valid transitions + reason logging optional).
- UpdateStatus action buttons (Draft→Submitted→Reviewed→Approved→Archived; backward limited).
- ModifiedAt + lastEditedBy update.
- Basic edit history (append-only log inside metadata.history[]).

### Phase C: Import / Export Core
Deliverables:
- Parsers: parseIntelReport(jsonText), parseIntel(markdownText) with validation.
- Serializers: serializeIntelReport(data, pretty=true), serializeIntel(intelFile).
- UI: Import modal (file picker + preview + conflict resolution [skip/replace/duplicate]).
- UI: Export buttons (single report download, multi-select bulk export zip).
- WorkspaceManager methods: importReports(), importIntel(), exportReport(), exportIntel(), exportReportsZip().

### Phase D: Search & Organization
Deliverables:
- In-memory search index builder (tokenize title, tags, content, recommendations, conclusions).
- Search API: searchReports({ text, tags, classification, status, category }).
- UI search bar + advanced filter panel.
- Tag/category sidebar facets with counts.

### Phase E: Validation & Quality Layer
Deliverables:
- Schema validators: validateIntelReportData(), validateIntelFile().
- Report completeness scoring (fields presence, length thresholds).
- UI: Validation badges + panel listing issues/warnings.
- Pre-save validation gating (block critical errors, allow warnings).

### Phase F: Source Linking & Intel Integration
Deliverables:
- Add/Remove sourceIntel references inside report editor (chooser dialog of Intel items).
- Inline preview snippet of linked intel.
- Back-links: Each Intel item lists referencing reports.

### Phase G: Packaging (Draft Support)
Deliverables:
- CreatePackage dialog (name, description, includes selected reports & intel).
- Package detail view (list contents, export as zip structure).
- Manager: package CRUD in state.

### Phase H: Versioning & History (Future)
Deliverables:
- Per-report editHistory entries (timestamp, user, diff summary).
- Simple diff view (content/conclusions/recommendations changes).

### Phase I: Security & Classification
Deliverables:
- Warning banner for CONFIDENTIAL+ (unencrypted store) until encryption implemented.
- Classification filter in search.
- (Future) Encryption toggle stub.

### Phase J: Performance & Persistence Hardening
Deliverables:
- Incremental persistence (per entity key vs monolithic blob).
- Throttled auto-save with dirty flag.
- Backup snapshots (rotating N copies).

## Immediate Action Backlog (Actionable Tickets)
1. Create ReportDetailPanel component (view-only) + route/panel integration.
2. Expand report adapters to cover: summary, conclusions[], recommendations[], methodology[], targetAudience[], priority, confidence, sourceIntel.
3. Implement ReportEditForm (modular sections, local state, validation).
4. Add status transition map + updateStatusWithGuard() in manager.
5. Serialize/parse utilities for .intelReport + .intel; add unit tests.
6. Import modal (report only first) with conflict detection (id + title heuristics).
7. Export single report (download button) using serializeIntelReport.
8. Search prototype (title + tags + content substring) to filter list client-side.
9. Validation function returning { errors, warnings } for report; surface in editor.
10. Add history array to metadata on each save (id, timestamp, changedFields[]).

## Data Model Adjustments
- Extend report metadata to include: history[], lastEditedBy, manualSummary (boolean if user overrides auto summary), version (increment int).
- Intel item internal structure to track processedAt, processedBy, quality scores (later alignment with IntelFrontmatter quality object).

## Technical Strategy Notes
- Keep adapters pure; no side effects.
- Validation returns machine-readable codes for UI rendering.
- Use UUIDs for new report IDs (introduce lightweight UUID generator) to avoid collisions.
- Multi-select state stored outside list component for packaging & bulk operations.
- Introduce lightweight event bus or continue with context subscription—avoid prop drilling.

## Testing Plan
- Unit: adapters (round-trip), validators, status guard, import/export parsers.
- Component: ReportDetailPanel interactions (view→edit→save), Import modal flows.
- Integration: Create→Edit→Status transitions→Export, Import duplicates resolution.

## Definition of Done (Report Management MVP)
- Users can create, view, edit all structured report fields.
- Status transitions enforced & logged.
- Import/export single reports functional.
- Basic search & filter across reports.
- Validation feedback visible & blocks invalid saves.

## Stretch / Nice-To-Have (Post-MVP)
- Markdown diff view for content changes.
- AI-assisted summary/recommendation generation (plug-in point).
- Real encryption of CONFIDENTIAL+.
- Git integration for version history.

