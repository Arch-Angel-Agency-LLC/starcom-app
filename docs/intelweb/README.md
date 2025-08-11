# IntelWeb Integration & Visualization Docs

This folder tracks the planned work to integrate the Intel system with IntelWeb and deliver a 2D/3D Obsidian-like graph view.

Contents
- 01-Mapping-Spec.md — Data mapping from Intel/IntelReportData → Markdown + Frontmatter + Wikilinks + Relationships
- 02-Graph-Design.md — 2D/3D Graph architecture, layouts, interaction, performance
- 03-Integration-Service.md — IntelWebIntegrationService: building VFS/DataPack + GraphData
- 04-Roadmap.md — Phases, milestones, acceptance criteria
- 05-Unified-Graph-Schema.md — Canonical nodes/edges, predicates, temporal validity, provenance
- 06-Entity-Resolution-Spec.md — Canonical IDs, alias handling, merge/split, APIs
- 07-Subgraph-and-Perspectives.md — Query-driven subgraphs, clustering defaults, saved views
- 08-2D-Engine-Workerization.md — Workerized physics, Canvas pipeline, LOD, persistence

# IntelWeb

## Status Update (2025-08-08)
- Classification removed from IntelWeb (UI + filtering). OSINT-friendly by default.
- Edge type filters trimmed to emitted types: reference, spatial, temporal.
- Per-vault layout persistence to avoid collisions.
- Time window quick filters added in Filters tab.

## Next
- Edge hover tooltip with predicate + provenance.
- Relationship details panel on edge click.
- Saved Views (filters + layout) per vault.
- Map overlay and timeline histogram.

Status
- Current date: 2025-08-08
- Repository: starcom-app (main)
- Owner: Arch-Angel-Agency-LLC
