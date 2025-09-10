# IntelAnalyzer GraphView — IntelWeb Consolidation Overview

Goal
- Make IntelAnalyzer’s GraphView the canonical graph UI and remove IntelWeb.

Scope
- Port essentials from IntelWeb to GraphView: Saved Views, Layout Persistence, Isolate (BFS), Degree-based Sizing/Label LOD, minimal Physics/Freeze controls.
- Keep Analyzer contexts (Filter, Selection, Correlation) and URL deep-linking.

Non-goals (now)
- Porting IntelWeb’s 3D engine.
- Reintroducing window CustomEvent bus (Analyzer uses contexts).
- Obsidian-like vault UI.

Success criteria (high level)
- GraphView supports Saved Views, layout save/reset, isolate/clear, degree sizing/label LOD, and a compact controls UI without regressing existing features (entity click → filter; overlays).
- Build, tests, and smoke checks pass; IntelWeb can be removed safely.

Related code
- IntelWeb: `src/applications/intelweb/components/Graph/IntelGraph.tsx`, `GraphControls.tsx`, `GraphEngine2D.tsx`.
- Analyzer: `src/applications/intelanalyzer/views/GraphView/GraphView.tsx`, `state/FilterContext.tsx`, `state/CorrelationContext.tsx`, `AnalysisWorkbench.tsx`.

---

This folder documents the consolidation plan, specs, and acceptance criteria for the refit.
