# Decisions Log

2025-09-05
- Split roles: Dashboard/Workspace = authoring; Analyzer = analysis. Rationale: avoid duplication and entangle CRUD with exploration.
- Merge surface: Enhanced IntelDashboard renders unified Workspace Console; legacy workspace route is deprecated with banner.
- Analyzer shape: Timeline (TimeMap), Map, Graph, Table + Inspector; filters left, deep-link top.
- Boards: MVP stored locally; plan Workspace-backed boards in V2.
- Graph expansion: default explicit (no auto-expand); consider heuristic for small degree.
- Inline edit: allow only safe fields (tags/category/notes/status with confirm); open Dashboard for content changes.
