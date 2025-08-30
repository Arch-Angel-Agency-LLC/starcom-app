# Phase 3 Implementation Notes - IntelWorkspace Console
Date: 2025-08-09
Status: In Progress

## Goals
Unify IntelDashboard and IntelWorkspace into a single console providing multi-entity visibility:
- Reports (.intelReport)
- Raw Intel Items (.intel)
- (Future) Packages (.intelReportPackage)

## Completed This Phase
- Added IntelItemUI type (`src/types/intel/IntelItemUI.ts`)
- Extended `IntelWorkspaceManager` with Intel item CRUD (create + update placeholder)
- Introduced React context `IntelWorkspaceProvider` for unified state injection
- Added initial `IntelWorkspaceConsole` component (side-by-side navigation for Reports vs Intel Items)

## Pending / Next Steps
1. Integrate console route (e.g., `/intel/workspace`) alongside existing `/intel` dashboard until full replacement.
2. Add creation UI:
   - Report creation (reuse existing modal logic refactored into a drawer/panel component)
   - Intel item creation form (frontmatter subset + markdown body)
3. Detail / Editing Panel:
   - Click list item → opens right-side detail with edit toggle
4. Status Transition Actions for Reports (buttons in detail view)
5. Unified Search Bar (filter across reports + intel by tag/category/text)
6. Package Drafting Stub (select multiple + "Create Package" → placeholder)
7. Refactor old `IntelDashboard.tsx` to optionally mount inside console or mark deprecated.
8. Add unit tests for workspace manager Intel item conversion.

## Architectural Notes
- WorkspaceManager remains purely client-side localStorage; backend or filesystem/Git integration deferred.
- Adapters pattern maintained for report mapping; need similar for Intel items if workspace file formats expand.
- Avoid premature optimization; dataset size small.

## Risks / Watchlist
- Divergence between IntelItemInternal and planned IntelFrontmatter may require migration fields.
- UI growth may reintroduce monolithic patterns; mitigate via small focused components.

## Definition of Done (for Phase 3)
- New console route accessible.
- User can view both lists and create at least one Intel item and one Report from console.
- Existing data migrates seamlessly.
- Report status visible and modifiable (basic transitions) from console.

