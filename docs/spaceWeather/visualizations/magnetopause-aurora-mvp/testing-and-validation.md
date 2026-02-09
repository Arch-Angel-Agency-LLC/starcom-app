# Testing and Validation

## Purpose
- Define the testing matrix to ensure correctness, stability, and performance for the new overlays.
- Provide concrete test cases and acceptance checks per layer and per pipeline stage.

## Test Categories
- Unit tests: mapping formulas, validators, clamping logic.
- Contract tests: API response parsing, error taxonomy handling, staleness tagging.
- Integration tests: overlay activation flow, event emissions, scene updates.
- Visual checks: manual or automated screenshot comparisons for key states.
- Performance tests: render FPS and update latency under typical and storm loads.

## Unit Test Coverage
- Magnetopause: given solar wind inputs, expect standoff radius within tolerance; verify clamping flags.
- Bow shock: ensure radius > magnetopause by delta; clamp behavior tested.
- Auroral ovals: Kp inputs produce expected latitude extents; blackout mask fields present.
- Validation: reject negative densities, missing timestamps, NaN values.

## Contract Tests
- Parse sample solar wind payloads with missing fields; expect validation errors and fallback usage.
- Timeouts and retries: simulate HTTP 500 and timeouts; ensure backoff and eventual fallback.
- Staleness: feed old timestamps; expect stale flag set and overlay marked degraded.

## Integration Scenarios
- Toggle on magnetopause: expect overlayDataLoading then overlayDataUpdated; scene gains shell.
- Toggle off magnetopause: mesh disposed and polling stopped if dedicated.
- Combined overlays: magnetopause + bow shock + aurora active without z-fighting; render order correct.
- Fallback path: fetch fails, cached payload used, HUD shows degraded but geometry remains.

## Visual Acceptance Checklist
- Colors match spec per layer; opacities in expected ranges.
- Auroral ovals align with globe (no seam gaps at dateline).
- Shell separation visually distinct; bow shock clearly outer layer.
- Blackout mask, if enabled, does not obscure shells excessively.

## Performance Testing
- Measure frame rate with all three overlays active; target >50 FPS on mid hardware.
- Measure update time from fetch completion to render update; target <500 ms.
- Stress with high-resolution ovals to ensure simplification triggers under caps.

## Tooling
- Use existing test runner; add fixtures for normal and storm cases.
- Optionally add lightweight visual snapshot tests using headless rendering if feasible.

## Logging and Telemetry Validation
- Verify overlayDataLoading/Updated/Error emitted with correct payload metadata.
- Ensure latency and staleness metrics recorded.

## Manual QA Checklist
- Enable each overlay individually and jointly; observe HUD values update.
- Simulate network offline; confirm fallback geometry persists and HUD shows degraded state.
- Simulate stale data by adjusting fixture timestamps; confirm stale indicator.

## Acceptance Gates
- All unit and contract tests passing.
- Visual checklist approved on baseline hardware.
- Performance targets met in integration runs.
- Error handling verified with forced failures.

## Regression Risks to Watch
- Memory leaks from undisposed geometries/materials.
- Render order regressions causing occlusion or z-fighting.
- Toggle debounce bugs leading to stale meshes.

## Extensibility Tests (Later)
- Additional feeds or providers can be swapped without breaking contracts.
- Parameter changes (colors, opacities) do not alter geometry correctness.
