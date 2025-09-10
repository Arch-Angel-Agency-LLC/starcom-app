# Architecture

## Current state
- IntelWeb
  - IntelGraph.tsx: data conversion, filters, isolate BFS, layout persistence, degree sizing, context provider
  - GraphEngine2D.tsx: D3 + canvas engine, batch draw, LOD
  - GraphControls.tsx: filters/physics/layout, Saved Views v2 (namespaced storage)
  - Integration service: `src/services/intelweb/IntelWebIntegrationService.ts`
- IntelAnalyzer
  - GraphView.tsx (react-force-graph-2d), Correlation overlays
  - Contexts: FilterContext, SelectionContext, CorrelationContext
  - URL deep link sync in AnalysisWorkbench

## Target state
- Single GraphView implementation in Analyzer with:
  - Saved Views
  - Layout persistence (save/reset)
  - Isolate BFS (radius)
  - Degree-based sizing and label LOD
  - Minimal physics/Freeze
- Analyzer contexts remain canonical; no global CustomEvent bridge.

## Engine decision
- Retain react-force-graph-2d for now; emulate subset of IntelWeb controls.
- Re-evaluate IntelWeb GraphEngine2D only if performance needs warrant.
