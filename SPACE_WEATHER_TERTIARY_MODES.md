# Space Weather Tertiary Visualization Modes (Development Tracker)

Status legend: ✅ done | 🚧 in progress | ⏱ planned | ❌ not started

## Modes Inventory
- Electric Fields (primary reference) ✅
- Geomagnetic Index (Kp/derived) 🚧 (stub hook + placeholder layer mounted)
- Auroral Oval 🚧 (stub hook + placeholder layer mounted)
- Solar Wind (plasma params) 🚧 (stub hook + placeholder layer mounted)
- Magnetopause (stand-off estimation) 🚧 (stub hook + placeholder layer mounted)
- Magnetic Field Lines (simplified) 🚧 (stub hook + placeholder layer mounted)
- Alerts / Statistics Overlay (panel) 🚧

## Settings Mapping
| Mode | Settings Flags | Data Source Hook | Context Flag | Telemetry Fields |
|------|----------------|------------------|--------------|------------------|
| Electric Fields | showElectricFields, normalization.*, enhancedSampling, pipelineEnabled | useSpaceWeatherData / useEnterpriseSpaceWeatherData | shouldShowOverlay | rawInterMag, rawUSCanada, sampled, degraded, pipeline* |
| Geomagnetic Index | showGeomagneticIndex | useGeomagneticData (stub) | geomagneticActive | geomagnetic.kp, lastUpdate |
| Auroral Oval | showAuroralOval | useAuroralOvalData (stub) | auroralOvalActive | auroralOval.resolution, lastUpdate |
| Solar Wind | showSolarWind | useSolarWindData (stub) | solarWindActive | solarWind.speed, density, bz, lastUpdate |
| Magnetopause | showMagnetopause | useMagnetopauseData (stub) | magnetopauseActive | magnetopause.standoffRe, lastUpdate |
| Magnetic Field | showMagneticField | useMagneticFieldData (stub) | magneticFieldActive | magneticField.sampleCount, lastUpdate |
| Alerts/Stats | showAlerts, showStatistics | existing alert generation + quality service | alertsActive | alerts.count, quality.overall |

## Planned Context Additions
Extend SpaceWeatherContext telemetry with a `modes` object:
```
telemetry: {
  ...existing,
  modes: {
    geomagnetic?: { kp: number | null; lastUpdate: number | null; active: boolean };
    auroralOval?: { resolution: string; lastUpdate: number | null; active: boolean };
    solarWind?: { speed?: number; density?: number; bz?: number; lastUpdate: number | null; active: boolean };
    magnetopause?: { standoffRe?: number; lastUpdate: number | null; active: boolean };
    magneticField?: { sampleCount: number; lastUpdate: number | null; active: boolean };
  }
}
```

## Development Phases
1. Baseline Telemetry Stub (no new data hooks) – create placeholder mode telemetry objects keyed off settings. (ETA: short)
2. Data Hook Scaffolds – create hooks returning mock data & timestamps for each mode.
3. Visualization Components – minimal placeholder renderers (e.g., layer div / canvas markers) gated by context.
4. Real Data Integration – wire actual APIs or models (deferred until stubs validated).
5. Performance & Fallback – memoization, gatingReason per mode, degrade logic reuse.

## Current Progress
- Pipeline integration: ✅ (electric fields)
- Telemetry extension (pipeline): ✅
- Tertiary modes stubs: ✅ (hooks + telemetry + placeholder components mounted)
- Settings toggles for modes: ✅ (basic exposure in settings container)
- Tracking doc & plan: ✅ (this file)

## Immediate Next Actions
1. Integrate real data sources / APIs (Phase 4) for priority modes (Geomagnetic, Solar Wind).
2. Add per-mode gatingReason & performance metrics.
3. Implement UI hints when a mode is active but still stubbed (tooltips / badges).
4. Expand tests to include rapid toggle stress & memory profiling (later phase).

## Acceptance Criteria (Phase 1 Tertiary Framework) – COMPLETED
- SpaceWeatherContext exports telemetry.modes with correct active flags matching settings. ✅
- Disabling each flag removes its placeholder component. ✅
- No runtime errors when toggling modes rapidly (manual dev test). ✅
- Documented in README and this tracker. ✅

---
Generated automatically (Aug 2025) – keep updates concise.
