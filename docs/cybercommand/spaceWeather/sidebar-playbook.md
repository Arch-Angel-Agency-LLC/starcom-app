# Space Weather Sidebar Playbook

This is the practical guide for Space Weather sidebar work. Keep it short, current, and tied to the layout hook contract.

## Hook Contract
- Source: `useSpaceWeatherSidebarLayout`
- Outputs
  - `interactive`: layerId, layer metadata, capability/statusHint, dataset flags, settings component id, provider status, currentProvider.
  - `passive`: telemetry, telemetryHistory, lastLayerTimestamp, lastContextUpdate, gatingReason, alerts, enhancedAlerts, settingsSummary (samplingMode, legacyCap, gridBinSize, magnitudeFloor).
- Usage
  - Left sidebar renders **interactive** (controls only).
  - Right sidebar renders **passive** (status/metrics/history/alerts) inside Mission/Intel tabs.

## Placement Rules
- Left (controls): dataset toggles, provider selector (pending removal decision), layer settings, any switches that mutate context.
- Right (passive): telemetry metrics, history, counts, timestamps, alerts, health/status badges.
- Rail: capability/status messaging comes from the layer registry; keep it declarative.

## Adding a Layer
1. Add layer metadata in `SpaceWeatherLayerRegistry` (capability, statusHint, emoji/label, settings component optional).
2. Implement left controls in the control surface (only interactions).
3. Add a passive card (metrics/history/alerts) in the right sidebar using `layout.passive`.
4. Keep all passive reads derived from the hook; avoid direct context reads in widgets.

## Provider Toggles Removed
- Selector stripped from the control surface; rely on automatic provider selection/failover in context.
- Provider status stays in passive widgets only (Status tab) for visibility; no manual switching.
- Details popover copy reflects the auto-managed model.

## Evidence & Docs
- Store screenshots/GIFs under `docs/cyberCommand/spaceWeather/evidence/` and link them in `progress-log.md`.
- Record UX/architecture decisions in `decisions/*.md`.
- Update bulletins for any user-facing change; log completions in `progress-log.md`.
