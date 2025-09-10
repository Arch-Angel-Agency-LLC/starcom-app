# Intel System Integration Overhaul — Documentation Suite

This suite documents the end-to-end integration of a single Intel/IntelReport system across all Starcom apps (CyberCommand, NetRunner, IntelDashboard, IntelAnalyzer, MarketExchange), grounded in code.

## Quick Start
- Read 01-goals-and-scope.md to understand the outcomes.
- Use 00-progress-tracker.md to track delivery.
- Follow 07-migration-plan.md for step-by-step rollout.

## Contents
- 00-progress-tracker.md — Live status and daily notes
- 01-goals-and-scope.md — Objectives, non-goals, success criteria
- 02-current-vs-target-architecture.md — Code-first architecture map
- 03-data-models-and-contracts.md — Canonical models and mappings
- 04-service-and-provider-apis.md — `intelReportService` and `IntelWorkspaceProvider`
- 05-adapters-and-serialization.md — Workspace mappers, serialization formats
- 06a–06e app integration guides — Per-app wiring and checks
- 07-migration-plan.md — Phased change plan
- 08-acceptance-criteria.md — What “done” means
- 09-test-plan.md — Unit/integration/E2E
- 10-qa-checklist.md — Manual validation
- 11-telemetry-and-observability.md — Minimal hooks
- 12-performance-and-caching.md — Caching and perf budgets
- 13-security-and-privacy.md — Local storage, PII, redaction
- 14-risk-register.md — Risks and mitigations
- 15-changelog.md — Notable changes
