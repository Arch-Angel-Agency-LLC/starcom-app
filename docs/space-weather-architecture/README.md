# Space Weather Architecture

Central index for the next-generation Space Weather data and visualization system.

Documents:
- 01-goals-and-scope.md
- 02-current-state-assessment.md
- 03-target-architecture.md
- 04-data-model-and-schema.md
- 05-pipeline-and-adapters.md
- 06-visualization-and-rendering.md
- 07-quality-alerts-and-thresholds.md
- 08-performance-and-scaling.md
- 09-phased-implementation-plan.md
- 10-testing-and-validation.md
- 11-risk-and-mitigation.md
- 12-future-extensions.md

## Progress Tracker
Legend: [ ] not started · [~] in progress · [x] complete · [!] blocked / needs decision

### Phase 0 – Triage & Clarity
- [x] Architecture documentation folder & baseline docs
- [x] Goals / scope captured
- [x] Unit normalization patch (canonical mV/km) applied in processing layer (vectors annotated with mV/km fields)
- [x] UI label & tooltip update for electric field units (Globe label now mV/km)
- [x] Dataset separation (InterMag vs US-Canada) in visualization markers (hue differentiation applied)
- [x] Add diagnostic telemetry (raw / filtered / sampled / rendered counts exposed via context)
- [x] Replace hard top-N sampling with provisional grid/bin sampling util (behind feature flag; deterministic fairness test added)
- [x] Color scheme: temporary hue shift per dataset
- [x] Add feature flag to toggle legacy vs enhanced sampling for comparison (window.STARCOM_SPACEWEATHER_ENHANCED_SAMPLING)

### Phase 1 – Foundations (Pipeline + Adapters)
- [x] SourceAdapter interface scaffold
- [x] NOAA InterMag adapter implementation (minimal stub)
- [x] NOAA US-Canada adapter implementation (minimal stub)
- [ ] Parallel pipeline execution behind feature flag
- [ ] RenderFeed API producing typed array RenderSet
- [ ] Globe consumption toggle (legacy vs pipeline)

### Phase 2 – Quality & Alerts
- [ ] Quality scoring engine (completeness, timeliness, spatial uniformity, variance)
- [ ] Hybrid percentile + absolute alert thresholds
- [ ] Cluster detection heuristic (radius-based)
- [ ] Ring buffer (N snapshots) & basic playback control

### Phase 3 – Performance & LOD
- [ ] H3 spatial aggregation multi-LOD
- [ ] GPU instanced arrow glyph layer
- [ ] Worker offload (normalization + aggregation)
- [ ] Adaptive load shedding (frame / processing budget)

### Phase 4 – Multi-Source Expansion Ready
- [ ] Mock international adapter (synthetic) to validate extensibility
- [ ] Divergence / delta visualization mode
- [ ] Baseline percentile persistence (local storage)

### Phase 5 – Advanced Analytics
- [ ] Streamline / flow field prototype
- [ ] Sustained elevation & volatility alerts
- [ ] Provenance hashing & optional export

### Phase 6 – Refinement & Hardening
- [ ] Retry/backoff + circuit breaker policies
- [ ] Comprehensive automated fairness & performance tests
- [ ] Remove legacy path (post parity)
- [ ] Final documentation polish

### Cross-Cutting / Utilities
- [~] Synthetic dataset generator for tests (inline deterministic set in sampling test; will extract if reused)
- [x] Metrics HUD / Debug panel (SpaceWeatherTelemetryHUD integrated into Globe)
- [ ] Performance regression harness

### Open Decisions
- [ ] Confirm H3 vs geohash final (default resolution tiers)
- [ ] Determine acceptable NOAA data age threshold (timeliness scoring)
- [ ] Set initial absolute magnitude alert floors (validate against historical ranges)

### Recent Updates Log
- (2025-08-09) Integrated SpaceWeatherTelemetryHUD overlay; deterministic sampling fairness test; grid/bin sampling util stabilized
- (2025-08-09) Phase 0: Canonical unit fields added, grid sampling feature flag persisted in settings
- (2025-08-09) Added appendix-sampling-strategies.md documenting interim strategies & evolution plan
- (2025-08-09) Phase 1 scaffolding: SourceAdapter interface + NOAA InterMag & US/Canada adapter stubs
- (2025-08-09) Added full architectural documentation & progress tracker scaffold

_Update this tracker with each PR affecting Space Weather architecture._
