# NetRunner Migration Guide

Checklist
- [ ] Replace local Intel types with `IntelReportUI` imports
- [ ] Route reads via `useIntelWorkspace()` or service
- [ ] Route writes via `intelReportService`
- [ ] Remove fixtures/mocks; seed via manager in dev
- [ ] Verify list/detail/export views render correctly

Notes
- Normalize timestamps to Date objects on UI; use adapters for storage parsing.
