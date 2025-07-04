# Team Collaboration: Private Case Room Design

**Date**: July 2, 2025
**Author**: GitHub Copilot AI Agent

## Overview

Define a secure, structured workflow for a private OSINT team (3–9 members) to share, annotate, and manage intel reports on Starcom.

### Goals
- Enforce team-level access controls on intel reports
- Support real-time notifications and collaborative annotations
- Ensure TDD-driven development with clear testing tasks

## 1. On-Chain Team Schema

**Contract**: `CyberTeam`
```rust
#[account]
pub struct CyberTeam {
  pub id: String,           // UUID
  pub name: String,         // Case name (e.g. "HTC-Operation")
  pub members: Vec<Pubkey>, // Wallet addresses
}
```
**Instructions**:
- `createCyberTeam(name)` → new team, creator added
- `addMember(teamId, memberPubkey)` → only creator
- `removeMember(teamId, memberPubkey)` → only creator

## 2. JSON Schema & Front-Matter

Extend `INTEL-REPORT-SCHEMA.json` with optional `teamId`:
```jsonc
"teamId": {"type": "string", "description": "UUID of CyberTeam"}
```
All Markdown reports must include `teamId` in YAML front-matter.

## 3. API & Services

### AnchorService Extensions
- `getUserTeams(): Promise<CyberTeam[]>`
- `createCyberTeam(name): Promise<string>`
- `addTeamMember(teamId, wallet): Promise<void>`

### IPFSContentOrchestrator
- Tag uploads with `type: 'intel-package'` and `teamId`
- Only pin packages when user is a member

## 4. Front-End Components

### Providers & Hooks
- `TeamProvider` (React Context)
- `useTeams()`: returns array of `CyberTeam`
- `useCurrentTeam(teamId)`: checks membership

### Pages
- `MyTeamsPage`: List & create teams
- `TeamDashboardPage`: Overview, recent intel, activity feed
- `TeamIntelPage`: List, view, create intel reports scoped to team

## 5. TDD Tasks

1. **Team Context Tests** (`TeamContext.test.tsx`)
   - New hook returns correct teams for mock user
   - Error state when RPC fails

2. **CyberTeam Contract Tests** (`intel_report_contract.test.ts`)  
   - Creating team, adding/removing members enforces permissions

3. **API Service Unit Tests**  
   - `getUserTeams` mocks Anchor client
   - `createCyberTeam` handles errors

4. **Component Integration Tests** (Vitest + React Testing Library)
   - `MyTeamsPage` shows form, list of teams
   - Non-member sees access denied on `TeamIntelPage`

5. **E2E Scenarios** (Playwright)
   - User A creates team → User B cannot see
   - User A adds User B → User B sees intel list
   - Team member posts report → all members get notification

## 6. CI & Automation

- Add tests above into `package.json` under `test:team`
- Update `audit:reports` to also validate `teamId` field
- Ensure GitHub Action triggers all TDD tasks on PR

---
*End of Case Room Design Guide*
