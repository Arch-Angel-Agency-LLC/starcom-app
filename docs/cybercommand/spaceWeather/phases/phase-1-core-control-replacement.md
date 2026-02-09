# Phase 1 – Core Control Replacement

## Step 1.1 – Replace Mock Controls
### Sub-step 1.1.a – Component Swap
- **Task 1.1.a.i – Mount real compact controls**
  - Sub-task: Replace imports so `SpaceWeatherSettings.tsx` uses `CompactSpaceWeatherControls` instead of the mock.
  - Sub-task: Ensure control props include `refresh`, `toggleDataset`, `updateSampling` callbacks.
  - **Status (2025-11-25):** Import swap completed in `src/components/HUD/Settings/SpaceWeatherSettings/SpaceWeatherSettings.tsx`; validating prop wiring next.

## Step 1.2 – Provider Management Exposure
### Sub-step 1.2.a – Sidebar Integration
- **Task 1.2.a.i – Relocate `SpaceWeatherProviderSelector` into a dedicated control stack**
  - Sub-task: Replace the ad-hoc TinyGlobe placement with a `SpaceWeatherControls` wrapper that sits inside the existing settings cluster. Respect the original sidebar order (TinyGlobe → Viz controls → Primary modes → Space Weather controls when relevant).
  - Sub-task: Guard rendering so the selector only appears when Space Weather context is mounted or when "Prime Space Weather" mode is active.
- **Status (2025-11-27):** `SpaceWeatherControlSurface` now lives inside the settings panel, so provider management stays aligned with layer/settings controls and only renders when EcoNatural → Space Weather is active.
- **Task 1.2.a.ii – Surface provider health & context**
  - Sub-task: Leverage `providerStatus` from `SpaceWeatherContext` to show availability, last verification time, and recent errors for each provider.
  - Sub-task: Add inline copy describing what each provider unlocks (endpoint counts, quality metrics) so the buttons have a purpose beyond color changes.
- **Status (2025-11-27):** The control surface shows per-provider summaries, availability status, and sampling badges directly under the active layer badge.
- **Task 1.2.a.iii – Integrate telemetry cues**
  - Sub-task: Display current vector counts per provider when available (e.g., pipeline vectors vs legacy feeds) to reinforce the impact of switching.
  - Sub-task: Ensure buttons reflect disabled state when a provider is unhealthy, offering tooltip guidance on next actions.
- **Status (2025-11-27):** Dataset pills + selector buttons mirror telemetry counts (InterMag/US-Canada/Pipeline) and auto-disable when `providerStatus` reports outages.
- **Cleanup:** Remove the interim block added on 2025-11-25 once the redesigned surface is live to avoid duplicate provider affordances.

## Step 1.3 – Progress Tracking
- Update this document with completion date and testing evidence (screenshots/links).
