# Space Weather UI Structure

## Sidebar Integration
The left sidebar hosts both the layer selector (absolute-positioned vertical emoji buttons) and the settings container. This keeps the cognitive context localized and replaces the legacy floating HUD.

## Components
- `SpaceWeatherLayerSelector` – Emoji buttons; highlights active layer.
- `SpaceWeatherSettingsContainer` – Renders per-layer settings component, preceded by a label of the active layer.
- `SpaceWeatherSettings*` – Individual settings components grouped into Basic / Medium / Advanced logical sections.

## Button Design
- 32x32 square
- Emoji icon communicates domain (⚡ electric, 🧭 geomagnetic, 💨 solar wind, etc.)
- Tooltip communicates full label plus experimental tag.
- Active state: gradient background & elevation shadow.

## Grouping Philosophy
- Basic: Essential toggles & visibility controls.
- Medium: Performance-impacting choices (sampling, pipeline, time windows).
- Advanced: Normalization, analytics, or domain-specific fine tuning.

## Accessibility
- Each button has `role="button"`, `title` tooltip, and `aria-pressed` state.
- Future improvement: keyboard navigation (arrow keys) & aria-label attributes; deferred until more layers are active.

## Future Enhancements
- Collapsible Advanced section.
- Contextual inline help popovers for complex parameters.
- Multi-layer selection (design reserved but not enabled).
