# PR Checklist and CI Playbook

Make migrations predictable and green.

## PR checklist
- [ ] Replace local IntelReport declarations with IntelReportUI imports
- [ ] Route reads via IntelWorkspaceContext or IntelReportService
- [ ] Route writes via IntelReportService (no direct storage)
- [ ] Update or add unit tests (adapters/serialization)
- [ ] Update progress tracker with file/task checkbox and PR link
- [ ] Run local guard: `npm run guard:intel`

## CI playbook
- Precheck job (suggested):
  - `npm ci`
  - `npm run ci:precheck:intel` (runs guard + intel unit tests)
  - Optional: targeted app smoke (Analyzer/NetRunner)
- Fail-fast: guard or tests failing should block merge.

## Commit hygiene
- Keep PRs small and focused (one phase/file group).
- Include “Before/After” notes for types and data flow.

## Rollback plan
- Revert PR if guard breaks unrelated apps.
- Keep migration behind small, independent PRs to ease rollback.
