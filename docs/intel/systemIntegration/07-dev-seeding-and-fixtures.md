# Dev Seeding and Fixtures

Make development and tests use the same Intel system. Avoid ad-hoc mocks.

## Goals
- Seed Intel reports/items through the canonical service/manager.
- Keep shapes consistent (IntelReportUI, Date objects, latitude/longitude).
- Reuse seeds across apps without duplicating types.

## Do’s and Don’ts
- Do: use IntelWorkspaceManager + IntelReportService.
- Do: import IntelReportUI for shapes.
- Don’t: declare local IntelReport interfaces per app.
- Don’t: write directly to localStorage or bespoke stores.

## Minimal seeding recipe (app boot)
1) Ensure provider wraps your app: `IntelWorkspaceContext`.
2) On dev boot (or a dev-only hook):
   - `intelWorkspaceManager.ensureInitialized()`
   - Create a few reports via `intelReportService.createReport(input, author)`
   - Optionally update via `intelReportService.saveReport(report)`
3) Subscribe to updates with `intelReportService.onChange(cb)` to refresh views.

## Clearing and resetting
- Dev reset: use `intelWorkspaceManager.clear()` or remove the scoped storage keys for the current workspace hash.
- Tests: reset between tests to avoid state bleed.

## Test seeding
- beforeEach:
  - Initialize manager
  - Create two IntelReportUI inputs with valid dates and coords
  - Persist via service
- Assertions should read via provider/service; avoid peeking into storage.

## Data shape tips
- Dates: use `Date` in UI; adapters handle ISO strings for storage.
- Coordinates: `latitude`/`longitude` (adapters may accept legacy `lat`/`long`).
- Enums/status: use IntelReportUI enums to avoid drift.
