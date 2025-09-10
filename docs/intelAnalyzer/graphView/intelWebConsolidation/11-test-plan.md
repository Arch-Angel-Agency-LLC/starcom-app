# Test Plan

## Unit
- ViewStorage: read/write, validation, unique names, error cases
- IsolateBFS: depth boundaries, disconnected graphs, consistent edge inclusion
- DegreeSizing: deterministic mapping for sample degree sets

## Integration
- Applying saved view updates Analyzer contexts and GraphView rendering
- Freeze/unfreeze toggles do not change positions
- Clusters toggle updates visibility without altering filters

## E2E/Manual
- Create two views and switch between them; confirm persistence and visual state
- Isolate depth changes from 0→2→clear; verify counts
- Large graph sanity: isolate disabled over threshold; controls responsive

## Regression
- URL deep-link still restores filters and selection independent of saved views

## Tooling
- Use existing test runner config; add targeted fixtures and mocks
