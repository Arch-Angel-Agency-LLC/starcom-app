# Globe Shaders Module

This module centralizes all custom shaders and material creators for Globe and TinyGlobe. Use these utilities to ensure visual consistency and maintainability.

## Shader/Material Creators
- `createHologramMaterial(earthDarkTexture)`
- `createDayNightMaterial(dayTexture, nightTexture)`
- `createBlueMarbleMaterial(blueMarbleTexture)`

## Shader Selector Utility
- `getGlobeMaterial(mode, submode, textures)`
  - Returns a custom material for special modes, or `undefined` for default.

## Mode/Shader Mapping
| Mode/Submode   | Material Function           | Notes                |
|---------------|----------------------------|----------------------|
| hologram      | createHologramMaterial     | Custom, animated     |
| dayNight      | createDayNightMaterial     | Custom, day/night    |
| blueMarble    | createBlueMarbleMaterial   | Custom, static       |
| (default)     | (none)                     | Use react-globe.gl   |

## Adding New Modes/Materials
1. Implement a new material creator in `globeShaders.ts`.
2. Update `getGlobeMaterial` to handle the new mode/submode.
3. Add the new mode/material to the mapping table above.
4. Update this README with usage notes and gotchas for the new mode.
5. Add before/after screenshots and test results for the new mode (see below).
6. Link to relevant commits and code lines for traceability.

## Maintainer Checklist for New Modes
- [ ] Material creator implemented and exported
- [ ] Selector utility updated
- [ ] Mapping table updated
- [ ] README usage/gotchas updated
- [ ] Screenshots and test results added
- [ ] Artifact/progress log updated
- [ ] Stakeholder/designer feedback gathered

## Gotchas
- Only override the default material for special visualization modes.
- Test custom shaders on all platforms for color/gamma consistency.
- If adding new modes, update this mapping and the selector utility.
- Document any edge cases or legacy quirks in the progress artifact.

## Example Usage
```ts
import { getGlobeMaterial } from './globeShaders';
const material = getGlobeMaterial(mode, submode, textures);
if (material) { /* assign to mesh */ }
```

## Artifact Linkage
- See `globe-shader-unification-plan.artifact` for the full migration/test plan.
- See `globe-shader-unification-progress.artifact` for progress, issues, and test results.
- Add screenshot/test result links here for new modes as they are added.
