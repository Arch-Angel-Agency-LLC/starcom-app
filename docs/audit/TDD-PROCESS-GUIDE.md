# Test-Driven Development (TDD) Process Guide

**Date**: July 2, 2025  
**Author**: GitHub Copilot AI Agent

## Purpose
This guide anchors a TDD workflow for the Starcom platform’s Intel Reports and team collaboration features. It ensures your OSINT cyber-investigation team can reliably write, validate, and maintain code while sharing a private case room.

## 1. Environment Setup

1. Use Node.js 18+ and `npm ci` to install exact dependencies.  
2. Always run tests via safe commands:  
   - Unit/E2E: `npm run test:safe`  
   - Specialized: `npm run test:noaa-safe`  
3. Ensure CI (`audit-reports.yml`) runs TDD checks on main & develop.

## 2. Branch & PR Strategy

- Create feature branches off `develop`: `feature/<team>/<description>`  
- Write tests first in `src/**/**/*.test.ts`  
- Open PR targeting `develop`; include test results screenshot or summary.  
- Peer-review must pass tests before merge.

## 3. Writing Tests First

1. **Identify a new behavior** (e.g., `useTeams()` hook filters by membership).  
2. **Write a failing test** in Vitest or Playwright:  
   ```ts
   test('non-member cannot see team reports', async () => {
     // arrange: mock user without team
     // act: render <TeamDashboard>
     // assert: sees access denied message
   });
   ```  
3. **Implement minimal code** to satisfy test.  
4. **Run tests**: `npm run test:safe` until green.  
5. **Refactor** with confidence—tests guard regressions.

## 4. Test Coverage & Quality

- Aim for **>90% coverage** on critical paths: Authentication, Team access, Intel CRUD.  
- Use Vitest for unit/integration; Playwright for UI/E2E.  
- Validate schema and ACLs in tests: incorporate `validate-intel-schema.ts` as part of test suite when relevant.

## 5. Collaborative Protocols

- **Shared Test Fixtures**: Keep `tests/fixtures/intel-reports/` for reusable mocks (e.g., sample Markdown front-matter).  
- **Naming Conventions**: `*.unit.test.ts`, `*.e2e.test.ts`, `*.integration.test.ts`.  
- **Test Data Ownership**: Each team member updates fixtures but never mutates production artifacts.

## 6. CI Integration

- On each PR, GitHub Actions will:  
  1. `npm ci`  
  2. `npm run test:safe`  
  3. `npm run audit:reports`  
- Fail-fast on any test or schema violation.

## 7. Maintenance & Review

- **Weekly Test Audits**: Run `npm run test:safe -- --coverage` and review coverage report.  
- **Dependency Updates**: Quarterly audit of devDeps (`npm audit`).  
- **Retrospective**: After every milestone, capture TDD learnings in `docs/audit/tdd-retrospective.md`.

## 8. TDD for Team Collaboration

Focus on private case-room scenarios for OSINT investigators:

1. **Team Context & Hook** (`TeamContext.test.ts`)
   - Test that `useTeams()` returns only teams the user belongs to
   - Simulate RPC error and verify loading/error states

2. **CyberTeam Contract** (`cyber_team_contract.test.ts`)
   - Failing tests: non-creator cannot add members
   - Creator can create, add, and remove members
   - State persists and reflects correct member lists

3. **Team Dashboard Component** (`TeamDashboard.unit.test.tsx`)
   - Render empty team list → shows "No teams" message
   - With teams → shows team cards with names and member counts

4. **Team Intel Page** (`TeamIntelPage.integration.test.tsx`)
   - As member: list of reports filtered by `teamId`
   - As non-member: shows access denied UI

5. **Report Creation Flow** (`CreateReport.e2e.test.ts`)
   - Navigate to `/team/:teamId/new-report`
   - Fill form fields and submit → verify on-chain and IPFS submission calls
   - New report appears in team intel list

6. **Notification & Chat Integration** (`ChatNotification.e2e.test.ts`)
   - After report creation, ensure Nostr event of type `intelligence` is emitted
   - UI displays toast notification for new report in active team channel

7. **Schema Validation in Tests**
   - Import `validate-intel-schema.ts` and run within unit tests to assert schema compliance
   - Ensure all fixture data includes `teamId`

Embed these tests in CI: add `npm run test:team` to `package.json` and include in GitHub Actions.

---
*End of TDD Process Guide*

## 9. Next Steps

- Implement on-chain `CyberTeam` schema and rebuild Anchor IDL.
- Correct `AnchorService` initialization, wire real wallet adapters, and clear lint errors.
- Complete `NewReportPage` form: gather latitude/longitude/timestamp, integrate `IPFSContentOrchestrator` instance methods.
- Add navigation/menu entries and routes for all team pages in `routes.tsx`.
- Run and fix all tests: unit (`npm run test:safe`), team tests (`npm run test:team`), and E2E (`npm run test:e2e`).
- Validate CI pipeline passes on main/develop branches.
- Capture first TDD retrospective in `docs/audit/tdd-retrospective.md`.

## 10. Retrospective Template

Use this template to capture learnings, blockers, and improvements after each TDD milestone:

- **Date**: YYYY-MM-DD
- **Milestone**: e.g., "Team Collaboration Flow"
- **What Went Well**: List successes and effective practices.
- **What Blocked Us**: Identify challenges, bugs, or process gaps.
- **Action Items**: Concrete steps to address blockers and improve workflow.
- **Owner**: Team member responsible for each action item.

Save completed retrospectives in `docs/audit/tdd-retrospective.md`.

## 11. Additional Resources

- `docs/audit/TDD-PROCESS-GUIDE.md`: This guide.
- `docs/audit/TEAM-COLLABORATION-CASE-ROOM.md`: Protocols for private case-room.
- `docs/audit/INTEL-REPORT-SCHEMA.md`: Report schema reference.
- `scripts/validate-intel-schema.ts`: Schema validation script.

---
*End of TDD Process Guide*
