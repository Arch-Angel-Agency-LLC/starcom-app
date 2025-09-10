# Intel System Integration — Consolidated Overview

Unifies creation, storage, transformation, and cross‑app consumption of intelligence reports across Analyzer, NetRunner, CyberCommand, MarketExchange, dashboards, and visualization layers.

## Canonical Stack
| Concern | Source |
|---------|--------|
| UI Model | `src/types/intel/IntelReportUI.ts` |
| Create Input Helpers | `src/services/intel/adapters/reportMappers.ts` |
| Service (CRUD + pub/sub) | `src/services/intel/IntelReportService.ts` |
| Workspace Provider (React) | `src/services/intel/IntelWorkspaceContext.tsx` |
| Persistence Manager | `src/services/intel/IntelWorkspaceManager.ts` |
| Serialization / Schema | `src/services/intel/serialization/intelReportSerialization.ts` |
| Visualization Mapping | `src/services/IntelReportVisualizationService.ts` |
| Data Provider Endpoint (intel-ui) | `src/services/data-management/providers/IntelDataProvider.ts` |

## Core Contract (IntelReportUI)
Identity: `id` (primary) with `legacyId` fallback during migration.
Temporal: `createdAt`, `updatedAt`, ordered `history[]` entries.
Location: `location { latitude, longitude }` (legacy `lat/long` auto‑normalized).
Enums & Mapping: Legacy FLASH priority mapped to `IMMEDIATE` via adapters.
Defaults & Safety: Empty tags → `[]`; undefined confidence handled; summary length safeguarded.

## Lifecycle Recipes
Create:
```ts
import { toCreateIntelReportInput } from 'src/services/intel/adapters/reportMappers';
import { intelReportService } from 'src/services/intel/IntelReportService';

const input = toCreateIntelReportInput(formState); // Build CreateIntelReportInput
const report = await intelReportService.createReport(input);
```
Read (React Provider):
```ts
const { reports, subscribe } = useIntelWorkspace();
useEffect(() => subscribe(), [subscribe]);
```
Update:
```ts
await intelReportService.saveReport(report.id, { status: 'VERIFIED' });
```

## Migration Phases (Snapshot)
- Phase 0 Docs & Guardrails: Complete (rule scaffold in warn mode)
- Phase 1 Analyzer Adoption: Viewer + Graph on provider
- Phase 2 NetRunner Consolidation: Legacy builder removed; direct create input path
- Phase 3 Shared Services: Visualization + intel-ui endpoint unified (in progress)
- Phase 4 Cross-App Types: UI components migrating (ongoing pruning)
- Phase 5 Enforcement: CI precheck active; rule escalation pending
- Phase 6 QA: Round‑trip + adapter edge tests active; cross‑app propagation expanding

Progress details: see `00-progress-tracker.md`.

## Guardrails & Commands
Local preflight:
```bash
npm run guard:intel
```
CI precheck (auto on relevant PRs): runs guard + targeted adapter/provider tests.

ESLint rule `intel/no-local-intelreport` (warn) flags stray local interfaces (`IntelReport`, `NetRunnerIntelReport`, `LegacyIntelReport`). Future escalation to error after tracker milestone completion.

## Testing Coverage (Current)
Adapters: enum remap, legacy alias fields, empty tags, missing location, confidence default.
Serialization: schema validity, version fidelity, coordinate precision, invalid enums.
Provider: create/edit propagation (partial marketplace lag tracked).
Visualization: live subscription update tests.

Gaps (Planned): full per‑app smoke for CyberCommand + MarketExchange edits, coordinate boundary edge cases, final deprecation removal tests.

## Common Pitfalls & Fixes
- Legacy `lat/long`: always route through adapter normalization.
- Direct persistence (localStorage / bespoke): replace with `intelReportService` calls.
- Deprecated builder usage: prefer `buildCreateIntelReportInput` helpers.
- Title/summary truncation: handled in adapters—avoid manual slicing.

## Deprecation Signals
`LegacyIntelReport`, `NetRunnerIntelReport`, flowchart dissemination placeholder: do not extend; replace with IntelReportUI.

## Definition of Done (End State)
Single IntelReportUI model globally, all persistence via IntelReportService, no duplicate local interfaces, ESLint rule escalated to error with zero violations, cross‑app propagation + visualization fidelity verified.

## Quick Start
1. Read `01-integration-cookbook.md` for copy‑paste patterns.
2. Remove any local interface → import `IntelReportUI`.
3. Use service for create/update; rely on provider for reads.
4. Run guard + targeted tests before PR.

## Reference Docs
See also:
- `02-migration-guide.md`
- `06-guardrails-lint-and-ci.md`
- `07-dev-seeding-and-fixtures.md`
- `08-pr-checklist-and-ci-playbook.md`
- `09-troubleshooting-and-faq.md`

---
For open tasks / current blockers consult the progress tracker log.