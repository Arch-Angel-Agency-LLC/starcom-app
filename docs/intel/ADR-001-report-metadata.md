# ADR-001: Intel Report Metadata Conventions

Status: Draft
Date: 2025-08-09

## Context
The existing `IntelDashboard` stored reports in `localStorage` with a simplified shape. The Phase 1 Intel system introduces rich file-based types (`IntelReportData`). We need a consistent mapping so the UI can evolve without breaking stored data and can later swap to a real `IntelWorkspaceManager` or `UnifiedIntelStorage`.

## Decision
Adopt a metadata embedding strategy inside `IntelReportData.metadata` to represent UI-specific or lifecycle fields not first-class in the core schema.

### Mapping Table
| UI Field | IntelReportData Field | Notes |
|----------|-----------------------|-------|
| id | id | unchanged |
| title | title | unchanged |
| content | content | summary auto-derived (first paragraph / 240 chars) |
| summary (future explicit) | summary | overrides auto-derivation when present |
| classification | classification | same enum set (string) |
| status | metadata.status | lifecycle state: DRAFT → SUBMITTED → REVIEWED → APPROVED → ARCHIVED |
| category | metadata.categories[0] | single primary category for now |
| tags[] | metadata.tags | direct array |
| latitude/longitude | metadata.geo.{lat,lon} | optional |
| createdAt | createdAt | ISO string serialization |
| updatedAt | modifiedAt | renamed for internal schema |
| author | author | unchanged |

### Reserved / Future Fields
| Concept | Location | Notes |
| recommendations[] | recommendations | UI not collecting yet |
| conclusions[] | conclusions | UI not collecting yet |
| methodology[] | methodology | default [] until advanced form added |
| confidence | confidence | default 0.5 placeholder |
| priority | priority | default ROUTINE |
| relationships | relatedReports, supersedes, supersededBy | future |

## Migration
Legacy key `intel-reports` is transformed once into `intelWorkspace.reports` structure. A migration flag `intelWorkspace.migrated` prevents repeat work. Original legacy data retained for manual rollback until removal decision.

## Rationale
- Keeps UI refactor low-risk; no backend implementation required yet.
- Future workspace manager can read existing `IntelReportData` without additional transforms.
- Avoids polluting core schema with transient UI lifecycle semantics (status) while still being queryable.

## Consequences
- Must maintain adapter functions to ensure bidirectional correctness.
- Searching/filtering by status/category requires reading metadata fields.
- Future schema evolution must preserve metadata backward compatibility.

## Alternatives Considered
1. Extend `IntelReportData` type directly with status/category: Increases divergence risk with spec documents.
2. Separate parallel UI store then batch convert later: Adds complexity and duplicate persistence.

## Follow-Up Tasks
- Implement status transition rules (guard logic) when edit capability is added.
- Add explicit summary input in UI to override auto derivation.
- Introduce validation util for metadata fields before persistence.

## Decision Owners
Intel Systems Working Track.
