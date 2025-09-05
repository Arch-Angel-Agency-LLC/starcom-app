# IntelAnalyzer Merger and Analysis Workbench

This folder documents the merger decisions and the rehash of IntelAnalyzer into an Analyst Workbench.

What this covers:
- IntelDashboard/IntelWorkspace merger (HUMINT authoring and file operations)
- IntelAnalyzer → IntelAnalysis Workbench, with TimeMap embedded as the Timeline view

Status (2025‑09‑05):
- Enhanced IntelDashboard now mounts the unified Workspace Console (Reports + Intel Items) under provider.
- Legacy `/intel/workspace` remains with a deprecation banner.
- IntelAnalyzer will be replaced by the IntelAnalysis Workbench (Timeline/Map/Graph/Table + Inspector).

Scope split (authoring vs analysis):
- IntelDashboard/IntelWorkspace: create/edit/manage reports and items; status/version/history; import/export.
- IntelAnalysis Workbench (new IntelAnalyzer): exploration/correlation across HUMINT/OSINT/GEOINT; synchronized views; saved boards.

Quick links:
- vision.md — roles, personas, contrast, and mission
- ux-workbench-spec.md — final shape, interactions, and states
- architecture-and-state.md — data flow, contexts, adapters, routing, telemetry
- data-models.md — Events/Entities/Filters/Boards JSON shapes
- deep-links.md — URL schema and restoration rules
- roadmap.md — phased rollout with acceptance criteria
- progress.md — implementation progress tracker
- test-plan.md — unit/integration/E2E coverage
- a11y-and-perf.md — accessibility guide and performance budgets
- migration-and-deprecations.md — old surfaces and deprecation path
- decisions.md — decisions log with rationale
- glossary.md — terms used across docs
- open-questions.md — intentionally undecided items

Contributing:
- Propose edits via PRs. Keep changes atomic and reference a decision or an open question.
- When resolving an open question, update decisions.md with the rationale and impacted files.

Final shape (at a glance):
- Left: filters + board switcher
- Center: Timeline (default) | Map | Graph | Table
- Right: Inspector (details, notes, quick actions)
- Top: compact omnibar (later), deep-link copy

Key decisions to date:
- Dashboard = authoring ground truth; Analyzer = analysis workbench (no CRUD lists).
- TimeMap folds into Analyzer as the Timeline view; standalone route deprecated later.
- Reports mutate only via intelReportService; Analyzer is read-centric with optional notes/pinning.
- Boards (saved filters/layout/selection) start locally; Workspace persistence planned in a later phase.

What’s implemented already:
- Enhanced IntelDashboard mounts IntelWorkspaceProvider + IntelWorkspaceConsole.
- Report lifecycle service with transitions, history/version on save; import/export via panels.
- Console search index for reports; basic intel items listing/creation.

Next up in Analyzer workstream:
- Workbench shell + contexts (filters/selection) and Timeline+Table MVP with Inspector.
- Deep-linking of view/filters/selection; map/graph follow with cautious performance caps.

Last updated: 2025-09-05
