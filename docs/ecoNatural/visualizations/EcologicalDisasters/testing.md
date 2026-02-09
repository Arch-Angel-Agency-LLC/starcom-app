# Ecological Disasters Visualization – Testing Plan

## Objectives
- Validate data correctness, filtering, rendering, and UX states for the EcologicalDisasters mode.
- Prevent regressions in data pipelines and UI integration.

## Test Types
- Unit tests (transformers, settings validation).
- Contract tests with recorded feed samples.
- Integration tests (data → globe markers → UI legend).
- Visual/snapshot tests for markers/legend/tooltips.
- Manual QA for network failures and performance.

## Unit Tests
- quakeTransform: maps USGS FeatureCollection to NaturalEvent[]; verifies mag, sig, timestamp ISO, ids stable.
- volcanoTransform: mock list to NaturalEvent[]; status mapping to severity bucket; mock flag.
- wildfireTransform (if used): CSV parse; confidence filter; correct lat/lng parsing.
- Bucketing: magnitude/significance → severityBucket; volcano status → severity.
- TimeRange filter: drops events older than window; boundary conditions (exact cutoff).
- Settings validation: timeRange clamp; radiusOpacity clamp; toggles default merge.

## Contract Tests
- Recorded USGS sample: assert schema compatibility; no thrown validation errors.
- Recorded volcano mock: ensure status preserved; last_eruption parsed if present.
- Failure payloads: malformed geometry; ensure transform rejects and counts dropped.

## Integration Tests
- Submode switch to EcologicalDisasters triggers one fetch; globeData populated with types earthquake/volcano.
- Hazard toggles: disabling earthquakes removes red markers; enabling restores after re-filter.
- Severity toggles: turning off catastrophic removes largest markers.
- Time-range slider: reducing window decreases marker count; counts match expected filter.
- Legend: entries reflect current hazards and severity buckets; data freshness badge present.
- Right sidebar status tab: shows counts and last-updated time when layout is active.

## Snapshot / Visual Tests
- Render with sample data: markers colored correctly; legend matches palette.
- Tooltip content snapshot (mocked hover) for quake and volcano.
- Stale/error state rendering (banner/badge) snapshot.

## Performance Tests
- Large feed sample (e.g., 800 markers): render time < budget; no crash.
- Memory check: marker update does not leak materials/geometries (requires profiling harness).
- Debounce: settings changes do not trigger excessive renders.

## Manual QA Checklist
- Offline/failed fetch: UI shows error, retains last data.
- Mock volcano disclaimer visible in tooltip/legend.
- Reduced motion: pulses disabled; tooltips still usable.
- Mobile viewport: legend collapses; marker sizes acceptable.
- Icon consistency: 🌋 matches across selectors/sidebars.

## Fixtures
- tests/fixtures/usgs-quakes-small.json (diverse magnitudes).
- tests/fixtures/volcanoes-mock.json (active/dormant/extinct).
- tests/fixtures/wildfires-viirs-snippet.csv (if needed).
- tests/fixtures/usgs-malformed.json for negative case.

## Tooling
- Vitest for unit/integration.
- Testing Library for React components (legend, sidebars, settings panel).
- Playwright (optional) for end-to-end hover/click interactions.

## Mocks/Stubs
- Mock fetch for USGS endpoints; return fixtures.
- Mock GeoEventsDataProvider subscribe to avoid timers; return promise + immediate data.
- Mock Globe component interactions via test harness; assert pointColor usage.

## CI Considerations
- Keep large fixtures small enough for repo; prefer trimmed samples.
- Avoid hitting real feeds in CI; rely on fixtures/mocks.

## Regression Guardrails
- Add test to ensure earthquakes/volcanoes defaults are ON for launch.
- Add test for icon consistency in selectors.

## Observability Validation
- Ensure telemetry events emitted on fetch success/failure in integration tests (mock logger/spies).
- Ensure resource monitor records vector count when markers set.

## Acceptance Criteria for Ship
- All unit/contract/integration tests passing in CI.
- Visual snapshots approved.
- Manual QA checklist signed off in staging.

## Post-Ship Monitoring
- Track fetch failure rate, marker count distribution, render time metrics.
- Set alert thresholds for sustained failures.

## Detailed Test Case Ideas
- Case 1: Submode switch triggers single fetch; verify no duplicate requests on re-render.
- Case 2: Fetch success populates globeData with correct types (earthquake/volcano) and counts.
- Case 3: Fetch error sets error state, stale flag, keeps previous data.
- Case 4: TimeRange filter reduces count; verify boundary at exactly cutoff timestamp.
- Case 5: Severity toggle off removes bucket; legend updates; telemetry emits settings.changed.
- Case 6: Hazard toggle off stops rendering and prevents new fetch (optional optimization).
- Case 7: Impact radius toggle removes rings (if implemented); no leftover meshes.
- Case 8: prefers-reduced-motion disables pulses; verify CSS/animation classes absent.
- Case 9: Icon consistency: SecondaryModeSelector (🌋) vs Right sidebar (after fix) both match; test snapshot.
- Case 10: Legend freshness badge updates after successful fetch; shows stale after failure.
- Case 11: Thinning applied when count > cap; render.thin_applied telemetry emitted.
- Case 12: Duplicate IDs are de-duplicated; count reflects unique IDs.
- Case 13: Volcano mock disclaimer visible in tooltip and legend when volcanoes enabled.
- Case 14: Mobile viewport snapshot: legend collapsed, markers resized.
- Case 15: Rapid mode switching does not leak timers (no console warnings about state updates on unmounted components).
- Case 16: Wildfire backlog path remains off; no markers rendered if feature flag disabled.
- Case 17: Tooltip content shows UTC time and relative time; matches input timestamp.
- Case 18: Settings persistence: reload retains toggles; defaults apply when storage cleared.
- Case 19: Resource monitor budget warning triggers when marker count exceeds limit.
- Case 20: Export/snapshot button (if present) works without throwing; stubs in tests.

## Negative/Edge Cases
- Malformed USGS payload (missing features) does not crash; logs validation failure.
- Volcano list empty: renders quakes only; legend hides volcano entry.
- All severity toggles off: zero markers; UI shows warning.
- timeRange set to 0: clamped to 1; data still appears.
- radiusOpacity invalid: clamped; no crash.

## Performance Test Details
- Use fixture with 800+ quakes to trigger thinning; assert final count within cap.
- Measure render time (mock performance.now) and assert under budget.
- Ensure GC-friendly: after clearing data, memory footprint decreases (manual profiling note).

## Visual Snapshot Targets
- Default state with quakes+volcanoes on.
- Minor severity off state.
- Stale/error banner state.
- Mobile collapsed legend state.
- Tooltip for quake and volcano.

## Manual QA Expansion
- Check keyboard navigation through settings toggles.
- Check screen reader label on hazard toggles.
- Verify collapse/expand of right sidebar does not hide status badges unintentionally.
- Verify TinyGlobe (if showing hazards) matches main globe markers.

## CI/Automation Notes
- Keep fixtures small but representative; compress if needed.
- Avoid real network in CI; mock fetch globally.
- Add retry/timeout safeguards in tests to avoid flakiness.

## Additional Manual QA Items
- Verify legend matches marker colors for all severity buckets.
- Verify right sidebar collapse/expand retains eco status info.
- Verify keyboard accessibility on hazard toggles and time slider.
- Verify mobile tap behavior opens tooltip; hover not required.
- Verify reduced-motion disables pulse animations.
- Verify stale badge appears after simulated failure and clears after success.
- Verify mock volcano disclaimer visibility.

## Documentation Cross-Checks
- Ensure testing steps align with integration and rollout docs (flags, defaults).
- Ensure fixtures referenced in data-sources doc exist and are used in tests.
