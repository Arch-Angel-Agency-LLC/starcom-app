# Space Weather Layer Architecture

## Overview
The tertiary visualization system introduces a single active space weather layer selected via emoji buttons in the left sidebar. Each layer corresponds to a data domain (electric fields, geomagnetic indices, solar wind, etc.) and may expose bespoke settings. The design is forward-compatible with future multi-select if needed.

## Core Elements
- Registry: `SpaceWeatherLayerRegistry.ts` enumerates all layer definitions (id, label, emoji, tooltip, settings component).
- State: `useEcoNaturalSettings` persists `spaceWeather.activeLayer` in localStorage.
- Selector UI: `SpaceWeatherLayerSelector.tsx` renders square emoji buttons, one per registered layer.
- Settings Container: `SpaceWeatherSettingsContainer.tsx` resolves the active layer and mounts its settings component (if implemented) inside the existing sidebar settings panel context.
- Settings Components: Each layer has a dedicated settings file in `components/SpaceWeather/settings/` prefixed with `SpaceWeatherSettings*`.

## Data Flow (Current)
Electric fields layer uses legacy & enterprise adapters via `SpaceWeatherContext`. Other layers are placeholders until their adapters & visualization logic are integrated.

```
EcoNaturalSettings (activeLayer)
        ↓
Layer Selector UI ──▶ Settings Container ──▶ Layer Settings Component
        │                                     │
        └────────────── influences ───────────┘
```

## Layer Lifecycle
1. Add definition to registry (ensure stable ordering).
2. Implement adapter(s) & data transforms (if needed).
3. Create visualization renderer (3D/overlay).
4. Add settings component (basic/medium/advanced groups).
5. Expand telemetry (optional) and docs.

## Extensibility
- Dynamic import strategy can replace static mapping when bundle size becomes a concern.
- Multi-select could evolve by changing `activeLayer: string` → `activeLayers: string[]` and adjusting selector semantics (e.g. modifier-click toggles).

## Current Implemented Settings Components
- Electric Fields: full basic/medium/advanced grouping derived from existing normalization controls.
- Geomagnetic (placeholder): minimal toggles.
- Solar Wind (placeholder): minimal toggle.

## Telemetry & Performance
Telemetry currently only covers electric field vector processing. Future layers should register their own processing timers and optionally aggregate into a unified telemetry object.

## Naming Conventions
All files and types begin with `SpaceWeather` prefix to keep global namespace clarity and simplify search/refactoring.
