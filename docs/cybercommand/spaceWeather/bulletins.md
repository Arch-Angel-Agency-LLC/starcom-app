# Space Weather Revision Bulletins

## 2025-11-26
- **Provider selector feedback:** The current "SpaceWeather Provider" block that was wedged beneath TinyGlobe feels disconnected from the sidebar hierarchy and does not surface any real state beyond the active button. It also appears regardless of visualization mode, which violates the original layout map. This revision redefines how provider selection should ship: it belongs inside a dedicated Space Weather control stack, with health/status cues and contextual copy explaining why an operator would switch feeds.
- **Action:** Phase 1 Step 1.2 is upgraded to include layout-specific acceptance criteria (placement inside `SpaceWeatherControls`, adherence to EcoNatural guardrails, provider health badges). Additional follow-up tasks have been added for telemetry adornments and copy refreshes.
- **Next focus:** Continue with Phase 2 controls work (dataset/sampling UI already underway) while scheduling a cleanup task to remove the interim provider block once the redesigned surface is ready.

## 2025-11-27
- **Sidebar consolidation:** `SpaceWeatherControlSurface` replaced the interim `SpaceWeatherControls` stub, merging provider management, contextual HUDs, and the info popover trigger into a single surface. It only renders when the EcoNatural → Space Weather stack is active and now occupies the slot ahead of the deep settings container.
- **Action:** Update Phase 1 & 2 task notes to reference the new control surface and remove remaining mentions of the deprecated layered context panel.
- **Next focus:** Layer-specific subpanels (aurora, magnetosphere, radiation) should be added to the surface, and telemetry history needs to be pinned into the dock so regressions are visible without opening devtools.

- **Telemetry dock:** The control surface now includes a pinned telemetry history card that shows the last four snapshots (provider, sampled/rendered counts, deltas, gating state) sourced directly from the tracker.
- **Action:** Engineers can rely on the sidebar to diagnose sampling drops before opening devtools; document the new workflow inside the Phase 2 notes and progress log.
- **Next focus:** Capture evidence exports for the new dock and plan the right-sidebar status widgets (Phase 3 kickoff).

- **Rail dock clarity:** The vertical Space Weather rail now exposes per-layer capability (overlay vs HUD vs planned), disables truly unavailable layers, and shows an inline status caption so operators immediately see why certain buttons don't affect the globe yet.
- **Action:** Update Phase 2 rail tasks to call out the new capability metadata and clean up the prior pending-state code path so future tweaks only touch the registry + selector.
- **Next focus:** Hook the rail into visualization mode switching (Phase 4) once at least one additional overlay is available.

- **Sidebar orchestration:** Added `useSpaceWeatherSidebarLayout` plus corresponding refactors so the left rail keeps interactive controls while the right Status tab pulls telemetry/health data from the same bundle. This removes duplicate context reads and prepares the passive dock for additional widgets.
- **Action:** Continue migrating future right-rail widgets (intel/status cards) to the passive bundle so all telemetry/UI wiring flows through the orchestrator.
- **Next focus:** Extend the hook to expose mission alerts + screenshot links once telemetry export lands (Phase 3 scope).

- **Status widget:** The Status tab now renders `SpaceWeatherStatusCard` + metrics when Space Weather mode is active, surfacing provider health, dataset enablement, and gating signals without extra context calls.
- **Action:** Capture screenshots + operator notes for the new card and ensure future alert feeds tap into the same passive bundle.
- **Next focus:** Wire upcoming intel widgets (alerts feed, screenshot queue) into the passive layout data to keep Space Weather telemetry centralized.

- **Intel alert panel:** Expanded the layout passive bundle with NOAA + enhanced alert streams and mounted a `SpaceWeatherAlertPanel` in the Intel tab so right-rail monitoring stays in sync with the shared hook.
- **Action:** Add export/screenshot affordances once telemetry exports land; track operator feedback in the Phase 3 notes.
- **Next focus:** Reuse the passive bundle for future controls tab diagnostics (e.g., pipeline health) to avoid duplicating context reads.

- **Passive data migration:** Removed telemetry counts, timestamps, and history from the left control surface and rebuilt them in the right Mission/Intel tabs (status/metrics/history cards) using the orchestrator hook so the left rail now only hosts interactive controls.
- **Action:** Document updated sidebar screenshots and plan the same treatment for non-electric layers.
- **Next focus:** Fold remaining passive badges (e.g., geomagnetic readouts) into the right sidebar widgets during the next round.

## 2026-01-11
- **Provider selector removal:** Manual provider switching was removed from the left control surface; the selector component is no longer rendered. Provider health remains as read-only telemetry on the right Status tab via `SpaceWeatherStatusCard`.
- **Action:** Keep provider status in the passive bundle only; rely on automatic selection/failover. Update any docs that referenced manual provider toggles.
- **Next focus:** Migrate remaining non-electric passive widgets, capture new screenshots (control surface sans provider buttons), and wire telemetry export so Mission/Intel tabs stay screenshot-ready.
- **Passive migration (right rail):** Layer-specific passive cards (geomagnetic, solar wind, magnetosphere, aurora, radiation) now render on the Status tab via the passive bundle; left control panels are interactive-only.
- **Telemetry export stub:** Added an Export Telemetry control in the Status tab backed by a stub service to plug into future download/API wiring.
- **Cleanup:** Removed the obsolete `SpaceWeatherProviderSelector` component and styles.
- **Evidence:** Pending screenshot captures stored under evidence/; update links in progress-log once captured.
