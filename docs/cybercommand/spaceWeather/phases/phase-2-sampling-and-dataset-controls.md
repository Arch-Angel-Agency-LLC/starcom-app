# Phase 2 – Sampling & Dataset Controls

## Step 2.1 – HUD Copy & Density Refinement (NEW)
### Sub-step 2.1.a – Compact Label Pass
- **Task 2.1.a.i – Trim inline copy**
  - Sub-task: Replace multi-word headers inside `SpaceWeatherControls` and `CompactSpaceWeatherControls` with abbreviated labels (≤2 words) that fit the 128px sidebar without wrapping.
  - Sub-task: Swap description sentences for iconography or hint badges so the column stays button-centric.
  - **Status (2025-11-26):** Provider stack now uses single-word labels + icon button; dataset hints removed from compact controls.
- **Task 2.1.a.ii – Typography audit**
  - Sub-task: Reduce font sizes/padding on status cards and dataset pills to reclaim vertical space.
  - Sub-task: Ensure all helper text collapses or truncates when viewport height is constrained.
  - **Status (2025-11-26):** Status cards and badges tightened (smaller fonts, condensed padding) to better fit the narrow sidebar.

### Sub-step 2.1.b – Info Popup Pattern
- **Task 2.1.b.i – Design “Space Weather Details” popover**
  - Sub-task: Mirror the verbose explanations (provider descriptions, dataset hints, sampling blurbs) inside a modal/panel triggered from the sidebar.
  - Sub-task: Popover must be keyboard-accessible and reuse existing controls so operators can tweak settings without leaving CyberCommand.
- **Task 2.1.b.ii – Content migration**
  - Sub-task: Move current paragraph-style helper text from the sidebar into the popover to keep inline UI terse.
  - Sub-task: Add quick-reference chips (e.g., provider icons) in the sidebar that open the popover for deeper info.
  - **Status (2025-11-26):** New popover houses provider descriptions, dataset blurbs, and sampling notes triggered via sidebar info button.

## Step 2.2 – Secondary Visualization Icon Rail (NEW)
### Sub-step 2.2.a – Layout Correction
- **Task 2.2.a.i – Relocate emoji icon column**
  - Sub-task: Identify the stacked square emoji buttons used for Space Weather sub-visualizations (currently rendered inside the right edge of `CyberCommandLeftSideBar`).
  - Sub-task: Rebuild them as an external rail that attaches to the outside-right of the sidebar container so they no longer consume interior width.
  - **Status (2025-11-27):** `SpaceWeatherLayerSelector` now mounts in a dedicated rail dock that sits beside the sidebar (wrapper-level container), eliminating clipping while keeping the rail visually joined via gradient seam.
- **Task 2.2.a.ii – Interaction wiring**
  - Sub-task: Ensure each icon still switches the intended sub-visualization/mode within the EcoNatural → Space Weather hierarchy.
  - Sub-task: Update hit targets + focus outlines so the rail remains accessible when positioned outside the sidebar bounds.
  - **Status (2025-11-26):** Rail now uses semantic buttons with focus-visible states, preserving `updateSpaceWeather` wiring.
- **Task 2.2.a.iii – Visual polish**
  - Sub-task: Add connecting brackets/shadows so the rail visually “docks” to the sidebar, matching CyberCommand’s aesthetic.
  - Sub-task: Audit responsive behavior (collapsed sidebar, shorter viewports) to confirm the rail stays aligned and scrollable.
  - **Status (2025-11-27):** Rail connector + shadow now live on the dock wrapper so the buttons retain focus rings, pointer events, and short-viewport spacing even after the structural move.
  - **Status (2025-11-27):** Capability metadata now drives each button (overlay vs HUD vs planned), planned layers are disabled with inline messaging, and the pending-state hack was removed in favor of a clean status caption beneath the rail.

## Step 2.2 – Context API Extensions
### Sub-step 2.2.a – Visualization Options Store
- **Task 2.2.a.i – Add dataset toggles**
  - Sub-task: `SpaceWeatherContext` accepts `enabledDatasets: { intermag: boolean; usCanada: boolean; pipeline: boolean; }`.
  - Sub-task: Persist to `useEcoNaturalSettings` for user preference continuity.
  - **Status (2025-11-25):** Settings hook + context now persist `enabledDatasets` with defaults and feed gating.
- **Task 2.2.a.ii – Sampling parameters**
  - Sub-task: Expose `samplingMode`, `gridBinSize`, `legacyCap`, `magnitudeFloor` in context state.
  - Sub-task: Update `visualizationVectors` memo to respect per-dataset caps even when in legacy mode.
  - **Status (2025-11-25):** New sampling config drives SpaceWeatherContext (grid binning vs top-N, cap, magnitude floor) and telemetry reporting.

## Step 2.3 – UI Wiring
### Sub-step 2.3.a – Control Surface Enhancements
- **Task 2.3.a.i – Dataset toggle group**
  - Sub-task: Add tri-state buttons for InterMag/US-Canada/pipeline with live counts.
  - **Status (2025-11-26):** Compact controls now expose dataset toggles with telemetry counts tied to persisted settings.
- **Task 2.3.a.ii – Sampling panel**
  - Sub-task: Radio buttons for Legacy vs Grid.
  - Sub-task: Numeric inputs for bin size & top-N cap with validation + tooltips.
  - **Status (2025-11-26):** Compact panel now exposes Legacy/Grid toggles plus bin-size, cap, and magnitude floor inputs tied to `useEcoNaturalSettings`.

### Sub-step 2.3.b – Layer Context Panel (NEW)
- **Task 2.3.b.i – Add contextual shell inside sidebar**
  - Sub-task: Mount a dedicated control surface between provider controls and the deep settings container so the sidebar slot can react to `activeLayer` changes from the emoji rail.
  - **Status (2025-11-27):** Sidebar now renders `SpaceWeatherControlSurface`, keeping provider/status chrome visible while swapping contextual HUDs per active layer.
- **Task 2.3.b.ii – Implement per-layer panels**
  - Sub-task: Build targeted panels for Electric Fields (dataset toggles + sampling summary), Geromagnetic (Kp snapshot + geomagnetic/auroral toggles), and Solar Wind (speed/density/Bz readouts + magnetopause toggle).
  - Sub-task: Provide a fallback message for experimental layers until bespoke controls land.
  - **Status (2025-11-27):** Registry-driven panels now render inside the control surface, reacting instantly to rail selection changes while reading telemetry and writing back to `useEcoNaturalSettings`.

## Step 2.4 – Progress Tracking
### Sub-step 2.4.a – Telemetry Snapshot Harness
- **Task 2.4.a.i – Runtime tracker**
  - Sub-task: Capture every successful telemetry emission (raw/sample/render counts, sampling strategy, provider, active layer) and persist the last 20 entries for comparison.
  - **Status (2025-11-27):** `spaceWeatherTelemetryTracker` now records the last 20 telemetry snapshots whenever counts change.
- **Task 2.4.a.ii – Devtools export**
  - Sub-task: Mirror the tracker onto `window.__STARCOM_SPACE_WEATHER_TELEMETRY__` with helper methods so engineers can copy JSON into this document without digging through React DevTools.
  - **Status (2025-11-27):** Global handle exposes `history`, `last`, and `export()` so data can be pasted directly into this plan.
- **Task 2.4.a.iii – Alerting hooks**
  - Sub-task: Surface console warnings if sampled/rendered counts contract by >40% between snapshots while raw counts remain steady (early signal of regression).
  - **Status (2025-11-27):** Tracker emits a console warning when sampled counts drop by more than 40% while raw totals remain within ±10%.

- **Status (2025-11-26):** Telemetry tracker output is now pinned inside `SpaceWeatherControlSurface`, showing the last four snapshots (provider, sampled/rendered counts, dataset flags, deltas) so the dock itself serves as the first-line regression indicator.

### Sub-step 2.4.b – Evidence Capture & Reporting
- **Task 2.4.b.i – Baseline journal**
  - Sub-task: After the tracker lands, capture at least three baselines (quiet/moderate/storm presets) and record them in this section with timestamps + provider context.
- **Task 2.4.b.ii – Before/after diffs**
  - Sub-task: When additional controls land, copy the exported snapshot history into the “Progress Log” appendix so Phase 2 demonstrates measurable sampling improvements.
