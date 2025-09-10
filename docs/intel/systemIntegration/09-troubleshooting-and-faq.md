# Troubleshooting and FAQ

Common issues and quick fixes during Intel system migration.

## Guard failure: local IntelReport found
Symptom
- Guard output lists files declaring `interface/type IntelReport` outside canonical folders.
Fix
- Import `IntelReportUI` from `src/types/intel/IntelReportUI.ts`
- Remove local interface and align fields (dates, coords, enums)

## Type errors after swapping interfaces
- Update state/prop types to `IntelReportUI`.
- Convert date strings to `Date` objects on UI level.
- Use adapters for storage/API shapes.

## Date/coordinate mismatches
- UI: Date objects + `latitude/longitude`.
- Storage/API: ISO strings + adapters to/from UI.

## Serialization parse errors
- Ensure you serialize via `intelReportSerialization.serialize()` and parse via `.parse()`.
- Validate required fields and enums with existing validation utilities.

## Graph/Map not showing new reports
- Confirm provider is active and subscribed.
- Ensure created reports go through `intelReportService` so onChange fires.
- Verify filters (tags/date/type) don’t exclude your seed.

## Where to look
- Provider: `src/services/intel/IntelWorkspaceContext.tsx`
- Service: `src/services/intel/IntelReportService.ts`
- Adapters: `src/services/intel/adapters/reportMappers.ts`
- Serialization: `src/services/intel/serialization/intelReportSerialization.ts`
