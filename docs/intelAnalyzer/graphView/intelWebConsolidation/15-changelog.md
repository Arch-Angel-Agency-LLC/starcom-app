# Changelog — IntelWeb → Analyzer GraphView Consolidation

## 2025-09-08
- Added specs: persistence, saved views, isolate mode, controls/UX
- Implementation plan, acceptance criteria, test plan, QA checklist, deprecation guide, risk register

### Phase A — Initial slice
- Implemented Analyzer GraphView inline controls (freeze, clusters, sizing, save/apply view)
- Added view storage (v2) scoped by workspace hash
- Added isolate BFS helper and wiring (Alt-click to isolate, inline depth controls)
- Degree sizing via nodeVal (bounded)
- Unit tests added for storage and isolate helpers (Vitest)

### Phase B — Layout persistence
- Implemented layout positions storage (v1) scoped by workspace hash
- GraphView Save Layout / Reset Layout controls
- Auto-apply saved positions when loading and when node set changes
- Unit tests added for positions storage (Vitest)

## 2025-09-0X
- TBD: Phase A implementation PRs
