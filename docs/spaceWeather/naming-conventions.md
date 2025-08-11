# Space Weather Naming Conventions

## Prefixing
All new files, components, and types begin with `SpaceWeather` to:
- Avoid collisions
- Improve search discoverability
- Signal architectural grouping

## Files
- Registry: `SpaceWeatherLayerRegistry.ts`
- Selector: `SpaceWeatherLayerSelector.tsx`
- Container: `SpaceWeatherSettingsContainer.tsx`
- Settings Components: `settings/SpaceWeatherSettings<Domain>.tsx`

## Identifiers
- Layer IDs are lowercase camelCase (e.g., `electricFields`, `geomagneticIndex`).
- Public exported constants are SCREAMING_SNAKE only if they represent environment constants; otherwise camelCase.

## Types & Interfaces
- Use `SpaceWeather` prefix for domain-specific interfaces (`SpaceWeatherLayerDefinition`).

## Commits & Docs
Reference layers by id and label: `electricFields (Electric Fields)`.

## Reserved Future IDs
- `ionosphere`, `magnetosphere`, `radiation`, `aurora`, `solarActivity`, `cosmicRays` already present as placeholders to keep ordering stable.
