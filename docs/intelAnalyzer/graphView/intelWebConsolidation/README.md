# IntelWeb → Analyzer GraphView Consolidation

This folder contains the plan and specs to retire IntelWeb and consolidate its graph features into Analyzer's GraphView.

## Quick Start
- Read the Overview: `01-overview.md`
- Track work in: `00-progress-tracker.md`
- Implement Phase A first: `09-implementation-plan.md`

## Contents
- 00-progress-tracker.md — Live status, milestones, work items, and log
- 01-overview.md — Goals, scope, success criteria
- 02-architecture.md — Current vs target architecture
- 03-data-contracts.md — Nodes/links, filters, isolate contracts
- 04-feature-parity-matrix.md — IntelWeb → Analyzer mapping
- 05-persistence-spec.md — Keys and schemas
- 06-saved-views-spec.md — Model and operations
- 07-isolate-mode-spec.md — BFS isolate behavior
- 08-controls-and-ux-spec.md — Controls, UX, a11y
- 09-implementation-plan.md — Phased delivery plan
- 10-acceptance-criteria.md — Done definition
- 11-test-plan.md — Unit, integration, E2E
- 12-qa-checklist.md — Validation checklist
- 13-deprecation-and-removal-guide.md — Sunset steps
- 14-risk-register.md — Risks and mitigations
- 15-changelog.md — Notable changes

## Contributing
- Keep PRs small and vertical (tests included)
- Update `00-progress-tracker.md` and `15-changelog.md` with each meaningful change
- Use the existing numbering scheme for new docs if needed (prepend with two digits)
