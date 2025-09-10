# Integration Cookbook

## Read reports (UI)
- Wrap app with IntelWorkspaceProvider: `src/services/intel/IntelWorkspaceContext.tsx`.
- Use `useIntelWorkspace().reports`.

## Write reports
- Create: `intelReportService.createReport(input, author)`
- Save: `intelReportService.saveReport(report)`
- Status: `intelReportService.updateStatus(id, status)`
- Subscribe: `intelReportService.onChange(cb)`

## Seed for dev/test
- Initialize via `intelWorkspaceManager.ensureInitialized()` then create reports via service.