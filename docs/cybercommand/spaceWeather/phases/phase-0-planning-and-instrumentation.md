# Phase 0 – Planning & Instrumentation

## Step 0.1 – Baseline Validation
### Sub-step 0.1.a – Workspace & Context Audit
- **Task 0.1.a.i – Confirm existing components**
  - Sub-task: Inventory all Space Weather UI components referenced in CyberCommand sidebars.
  - Sub-task: Note mock vs live implementations (e.g., `CompactSpaceWeatherControlsMock`).
- **Task 0.1.a.ii – Capture current data flow**
  - Sub-task: Diagram how `SpaceWeatherContext` feeds Globe & HUD.
  - Sub-task: Identify gating conditions preventing visualization in CyberCommand mode.

#### Findings – Component Inventory (2025-11-25)
- `src/components/HUD/Bars/CyberCommandLeftSideBar/CyberCommandLeftSideBar.tsx`
  - Renders TinyGlobe, `VisualizationModeInterface`, placeholder `PrimaryModeSelector`, and `SpaceWeatherLayerSelector`/`SpaceWeatherSettingsContainer` but **only when EcoNatural/SpaceWeather is active**.
- `src/components/SpaceWeather/SpaceWeatherLayerSelector.tsx`
  - Live component; currently hidden in CyberCommand mode due to mode guard.
- `src/components/SpaceWeather/SpaceWeatherSettingsContainer.tsx`
  - Live component orchestrating per-layer settings.
- `src/components/HUD/Settings/SpaceWeatherSettings/SpaceWeatherSettings.tsx`
  - Still imports `CompactSpaceWeatherControlsMock`; real control (`CompactSpaceWeatherControls.tsx`) unused.
- `src/components/HUD/Settings/SpaceWeatherSettings/CompactSpaceWeatherControls*.tsx`
  - `CompactSpaceWeatherControls.tsx` (real), `CompactSpaceWeatherControlsSimple.tsx` (legacy simpler variant), `CompactSpaceWeatherControlsMock.tsx` (currently mounted, mock data).
- `src/components/HUD/Bars/CyberCommandLeftSideBar/SpaceWeatherProviderSelector.tsx`
  - Fully implemented provider switcher but **never mounted**.
- `src/components/HUD/Bars/CyberCommandLeftSideBar/SpaceWeatherControls.tsx`
  - Empty stub file.
- `src/components/HUD/Bars/CyberCommandRightSideBar/SpaceWeatherControls.tsx`
  - Empty stub file for future right sidebar integration.
- `src/components/SpaceWeather/SpaceWeatherStatus.tsx`
  - Live status card (per-dataset counts, alerts) but unused anywhere in CyberCommand layout.
- `src/components/SpaceWeather/SpaceWeatherMetricsPanel.tsx`
  - Live telemetry HUD; not currently rendered in sidebars.

#### Findings – Data Flow & Gating (2025-11-25)
1. **Context loading**
  - `SpaceWeatherContext` selects between legacy vs enterprise providers (`useSpaceWeatherData` / `useEnterpriseSpaceWeatherData`) and exposes `visualizationVectors` plus telemetry.
  - A memoized `shouldShowSpaceWeatherVisualization` requires `visualizationMode.mode === 'EcoNatural'`, `subMode === 'SpaceWeather'`, active layer = `electricFields`, and `config.spaceWeather.showElectricFields`.
2. **Globe integration**
  - `src/components/Globe/Globe.tsx` reads `visualizationVectors` and only updates `globeEngine.updateSpaceWeatherVisualization` when EcoNatural + SpaceWeather AND `visualizationVectors.length > 0`.
  - When `shouldShowSpaceWeatherVisualization` is false, the globe purges existing space-weather data.
3. **HUD wiring**
  - `SpaceWeatherLayerSelector` and `SpaceWeatherSettingsContainer` render nothing outside EcoNatural/SpaceWeather, so CyberCommand mode lacks controls entirely.
  - `SpaceWeatherSettings` (mounted elsewhere) still references the mock control, meaning user adjustments don’t call context setters or refresh functions.
4. **Resulting gaps**
  - Even if data arrives from NOAA, none of it surfaces inside CyberCommand because both the globe and sidebar controls are gated by the primary visualization mode.
  - There is no mechanism to toggle dataset visibility, sampling presets, or provider choice from the existing HUD.

### Step 0.2 – Tracking Setup
#### Sub-step 0.2.a – Documentation Hooks
- **Task 0.2.a.i – Create progress log**
  - Sub-task: Use this file to append phase summaries plus blockers after each sprint.
- **Task 0.2.a.ii – Link issues/PRs**
  - Sub-task: Reference GitHub issue IDs per phase for traceability.
