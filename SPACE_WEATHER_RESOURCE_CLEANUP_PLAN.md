# Visualization Resource Cleanup Plan

Instrumentation for space-weather vectors is live, but we still need explicit teardown coverage so the monitor can confirm whether leaks disappear when users leave a mode. This checklist captures the remaining pressure points and the actions required before we add automated guardrails.

## 1. Space Weather Pipeline (src/context/SpaceWeatherContext.tsx)
- **Intervals & orchestrator**: `pipelineIntervalRef` and `orchestratorRef` survive across provider switches. Add an explicit teardown path that clears the interval, calls the orchestrator's `dispose/abort` (add one if missing), and wipes `vectorCacheRef` when `shouldShowSpaceWeatherVisualization` flips to false.
- **Resource monitor reset**: After teardown call `visualizationResourceMonitor.clearMode('EcoNatural.SpaceWeather')` so old bytes do not linger in the dashboard.
- **Heap sampling guard**: When the feature is disabled, stop the `performance.memory` sampling to avoid background cost.

## 2. Globe Runtime Core (src/components/Globe/Globe.tsx)
- **ThreatIntel streaming**: `ThreatIntelligenceService` and `RealTimeAttackService` remain in `useRef` and never stop streaming once created. Export a `dispose()` (or at least `stopStreaming()`) on both services and invoke it when switching away from `CyberThreats`/`CyberAttacks` (look at effects starting around lines 360650).
- **Satellite mode**: When leaving `CyberCommand.Satellites`, the Three.js instanced meshes are removed, but `satelliteVisualizationService` continues to hold a 21K+ cache. Add a service-level `destroy()` that clears caches and cancels pending refreshes; call it before removing the scene group.
- **Animation loop**: The cyber animation loop at the bottom of `Globe.tsx` only checks the current mode. Ensure the `useEffect` cleanup always cancels the RAF even if the mode toggles while the loop is running, and reset any `userData.animate` callbacks.
- **Material & resize timers**: Initialization uses a `setInterval` to poll for materials; verify the cleanup returned from the surrounding `setTimeout` fires when the component unmounts mid-init. Document this in code comments so future refactors do not regress.

## 3. Enhanced 3D Intel Interactions (src/components/Globe/Enhanced3DGlobeInteractivity.tsx)
- **RAF throttles**: The screen-position tracker (lines 880960) spins a RAF every 500ms while Intel Reports mode is active. Confirm the guard correctly stops the loop when `isIntelReportsMode` becomes false, or add an explicit effect watching the mode to cancel any pending frame ids.
- **Popup + tooltip state**: When leaving Intel mode, call `teardownIntelPopupState()` to force the popup portal to unmount and free any retained report data.
- **Resource telemetry**: Once geometry disposal is wired, record `visualizationResourceMonitor.recordGeometry('CyberCommand.IntelReports', ...)` so the guardrails can detect misses.

## 4. Satellite Visualization Stack
- **Service dispose**: `SatelliteVisualizationService` keeps `selectedSatellites`, cached data, and scheduled refreshes. Implement `dispose()` to drop references, clear selection arrays, and release any `SatelliteDataManager` timers.
- **Data manager cache**: `SatelliteDataManager` holds a Map of every satellite ever loaded. Provide a `clear()` that resets the Map and `lastUpdate`, and call it from `dispose()` so switching modes does not keep 21K objects in memory.
- **GPU geometry tracking**: When building instanced meshes inside `Globe.tsx`, report `visualizationResourceMonitor.recordGeometry('CyberCommand.Satellites', { meshes, materials, approxGpuBytes })` and call `dispose()` along with `clearMode` when the mesh is removed.

## 5. Diagnostics & Guardrails
- **Budget definitions**: Use real numbers from the monitor to call `visualizationResourceMonitor.setBudgets(...)` for `EcoNatural.SpaceWeather`, `CyberCommand.Satellites`, and `CyberCommand.IntelReports`. This lets devs see warnings before we formalize tests.
- **Playwright watchdog**: Once the above cleanup hooks exist, script a Playwright scenario that cycles through Space Weather  Cyber Threats  Satellites. Fail the run if the monitor reports `heap>`, `vectors>`, or `gpu>` warnings.

## Execution Order
1. Add missing `dispose`/`clearMode` wiring for Space Weather pipeline (safe, self-contained).
2. Implement `dispose()` on Threat/Attack/Satellite services and invoke from `Globe.tsx` effects.
3. Wire geometry metrics + monitor resets for Intel/Satellite overlays.
4. Capture budgets + add guardrail automation.

Document each teardown with a short comment describing what resource is being released (Three.js materials, streaming intervals, caches) so future reviewers can verify coverage quickly.
