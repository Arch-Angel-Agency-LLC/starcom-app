# Vision: Analyst Workbench vs Authoring Console

Objective: Separate concerns and elevate IntelAnalyzer into a true analysis environment while IntelDashboard/IntelWorkspace remains the HUMINT authoring ground truth.

- IntelDashboard/IntelWorkspace
  - Purpose: Create/edit/manage intel reports and items.
  - Capabilities: CRUD, import/export, status transitions, version/history, validations.
  - Users: Report authors, reviewers, publishers.

- IntelAnalysis Workbench (new IntelAnalyzer)
  - Purpose: Explore, correlate, and reason across HUMINT/OSINT/GEOINT.
  - Views: Timeline (TimeMap), Map, Graph, Table; Right Inspector.
  - Workflows: Pivots by entity/time/place, correlation, saved boards (filters/layout), evidence curation.
  - Outputs: Findings, notes/hypotheses, deep links, seed draft to Dashboard (later), optional packages.

Key contrasts
- Authoring vs Analysis: Dashboard is CRUD and lifecycle; Workbench is exploratory and read-centric.
- Files vs Events: Dashboard manipulates files; Workbench visualizes derived Events and Entities.
- Single view vs Multi-view: Dashboard focuses on forms; Workbench synchronizes timeline/map/graph/table.
