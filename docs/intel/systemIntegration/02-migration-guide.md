# Migration Guide (Remove Local Interfaces)

Targets:
- NetRunner model: drop local IntelReport; return IntelReportUI; persist via service.
- Visualization service: drop local IntelReport; adapt raw → UI; persist via service.
- Analyzer component-local types: import IntelReportUI; read via provider.
- Legacy class: remove/alias; update imports.

Steps:
1) Replace in-file interfaces with imports from `src/types/intel/IntelReportUI.ts`.
2) Route reads: `useIntelWorkspace()` or `intelReportService.listReports()`.
3) Route writes: use service methods only.
4) Delete mocks/fixtures; use seeding.