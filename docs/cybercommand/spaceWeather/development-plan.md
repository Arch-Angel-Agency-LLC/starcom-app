# CyberCommand Space Weather UI Refactor Plan

## Purpose
This index keeps the CyberCommand Space Weather program organized by routing each major concern to its own markdown file. Use it as the single entry point when planning changes so new details land beside the right context instead of growing a single monolithic plan.

## Document Map
- [Revision Bulletins](./bulletins.md) – dated release notes that capture cross-phase decisions, regressions, and urgent follow-ups.
- [Progress Log](./progress-log.md) – running evidence log that references screenshots, tests, and blockers per phase.
- [Phase 0 – Planning & Instrumentation](./phases/phase-0-planning-and-instrumentation.md) – environment audit, component inventory, and documentation hooks.
- [Phase 1 – Core Control Replacement](./phases/phase-1-core-control-replacement.md) – mock control removal, provider management exposure, and sidebar integration work.
- [Phase 2 – Sampling & Dataset Controls](./phases/phase-2-sampling-and-dataset-controls.md) – HUD density reductions, info popover migration, icon rail relocation, and context/state wiring.
- [Phase 3 – Telemetry & Status Surfaces](./phases/phase-3-telemetry-and-status-surfaces.md) – right-sidebar widgets plus visualization feedback surfaces.
- [Phase 4 – Secondary Mode Bridging](./phases/phase-4-secondary-mode-bridging.md) – cross-mode overlay controls, presets, and UX polish.
- [Phase 5 – QA, Documentation, and Rollout](./phases/phase-5-qa-documentation-and-rollout.md) – final testing, knowledge base updates, and release tracking.

## Phase Snapshots
- **Phase 0** focuses on knowing what already exists. Treat it as the source of truth for inventories, gating diagrams, and documentation hooks before you touch code.
- **Phase 1** houses every task tied to replacing mocks with live controls and exposing provider management in the sidebar.
- **Phase 2** contains the bulk of the UI and context work (sampling presets, dataset toggles, selector rail, and telemetry tracker). If you are adjusting the control surface, start there.
- **Phase 3** is for telemetry surfacing and right-rail additions. Keep screenshots and UX research artifacts attached to that file to avoid bloat elsewhere.
- **Phase 4** captures the plan for bridging Space Weather into other visualization modes, including force-overlay switches and preset explainers.
- **Phase 5** wraps QA + documentation. Add manual scripts, regression matrices, and rollout notes there so we can hand off confidently.

## Working Agreements
- Add or edit details inside the dedicated phase file instead of this index.
- When a change affects multiple phases, summarize it in the [bulletins](./bulletins.md) file and cross-link into each impacted phase.
- Every completed milestone should append an entry to the [progress log](./progress-log.md) so we keep measurable evidence.
- If you introduce a brand-new scope area, create a sibling markdown file (e.g., `phases/phase-6-<slug>.md`) and link it from the map above.

## Active Focus (2026-01-11)
- Provider auto-failover complete; left rail is controls-only. Layer passive cards now live on the Status tab.
- Next: hook the export stub to a real download/API path, capture fresh sidebar screenshots for docs, and continue passive coverage for upcoming layers.

## Contribution Checklist
1. Identify the relevant document (bulletin, phase, or log) from the map above.
2. Make the edit directly in that file; keep sections short and scoped to a single concern.
3. Update the progress log with before/after evidence when finishing a task.
4. If the change shifts priorities, add a dated entry to the bulletin file and reference any related GitHub issues or PRs.

Keeping the content compartmentalized this way prevents future mega-files and makes it obvious where fresh details should land.
