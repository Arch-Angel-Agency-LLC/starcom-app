# Phase 1 — Analyzer Alignment Plan

Scope
- Replace local IntelReport usage in Analyzer components with IntelReportUI.
- Use IntelWorkspaceContext for reads and IntelReportService for writes.

Components
- src/components/IntelAnalyzer/IntelReportsViewer.tsx
- GraphView already provider-backed; verify no local Intel types.

Steps
1) IntelReportsViewer: remove local interface; import IntelReportUI.
2) Replace mock loader with provider data (useIntelWorkspace).
3) Create flow: call intelReportService.createReport with CreateIntelReportInput.
4) Remove type/category chip based on legacy `type`; keep classification chip.
5) Adjust classification enum to IntelClassification (UNCLASSIFIED, etc.).
6) Update UI fields: author, createdAt, confidence (0..1 to %), tags, category.
7) Minimal integration test: seed → render → create → verify.

Risks
- UI references to legacy fields (metadata.*, connections, type) cause compile errors.
- Date conversion: ensure createdAt is Date.

Acceptance Criteria
- Viewer compiles and renders with provider data.
- Create dialog creates a report via service; list updates via subscription.
- No local IntelReport interface remains in Analyzer.

Out of Scope
- NetRunner types and services (Phase 2).

