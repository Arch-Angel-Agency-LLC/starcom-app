# Space Weather Roadmap

## Phase 0 (Complete)
- Unit clarity for electric fields
- Fair spatial sampling (grid binning)
- Telemetry & adaptive degradation
- HUD migration to sidebars

## Phase 1 (In Progress)
- Adapter orchestrator scaffold
- Tertiary layer selection (this commit)
- Registry-driven settings components
- Documentation foundation

## Phase 2 (Planned)
- Implement Geomagnetic Index data adapters (Kp, Dst)
- Solar wind adapter integration (plasma speed, density, IMF Bz)
- Visualization primitives per layer (icons, field lines, overlays)
- Extended telemetry: per-layer processing timings

## Phase 3
- Quality & correlation analytics across layers
- Unified multi-layer rendering strategy (depth, ordering, blending)
- Performance budgeting per layer (frame cost accounting)

## Phase 4
- Multi-select layers (activeLayers[] with toggles)
- Dynamic lazy loading of rarely used layers
- Advanced user presets & profiles

## Phase 5
- AI-driven anomaly detection overlays
- Predictive forecasting blend (solar wind propagation, geomagnetic forecast)

## Nice-To-Have / Stretch
- Timeline scrubber for historical replays
- Server-side pre-aggregation for heavy statistical normalization
- WebGL instancing optimization & GPU-based sampling

## Defer / Out of Scope (Current)
- Real-time particle flux 3D volumetrics
- Full magnetospheric MHD field line tracing
