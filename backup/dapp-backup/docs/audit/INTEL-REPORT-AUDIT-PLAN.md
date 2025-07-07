# Deep Audit Plan: Intel Reports

**Date**: July 2, 2025
**Author**: GitHub Copilot AI Agent

## 1. Background & Objectives

This document anchors a comprehensive, end-to-end audit of all intelligence-report assets, code, contracts, and documentation. Goals:
- Validate storage consistency, metadata schema, versioning, access controls, and distribution pipelines.
- Identify gaps, risks, and remediation steps.
- Embed automated checks into CI/CD for ongoing compliance.

## 2. Scope & Inventory

### Asset Types
1. Markdown summaries and archived reports
2. 3D model files (`.glb`)
3. On-chain contract schema (Rust)
4. TypeScript interfaces and validation logic
5. Off-chain JSON artifacts (`cache/`)

### Key Locations
- `docs/archived/*.md`
- `src/assets/models/*.glb`, `public/models/*.glb`
- `contracts/intel-market/intel_report.rs`
- `src/interfaces/IntelReport*.ts`
- `src/services/AnchorService.ts`, `IPFSContentOrchestrator.ts`
- `cache/code-*.json`

## 3. Audit Phases

1. **Inventory & Catalog**: List every report-related file and record metadata.
2. **Schema Validation**: Define canonical JSON schema; validate each source.
3. **Versioning & History**: Review Git logs; ensure immutable tags or timestamps.
4. **Access Control Analysis**: Static & dynamic checks for ACLs in code.
5. **Data-Flow Mapping**: Trace create → store → fetch pipelines end-to-end.
6. **Format & Storage Consistency**: Enforce a uniform directory structure and file format.
7. **Automated Tests & Coverage**: Add or improve Vitest and integration tests.
8. **Security & Compliance**: Dependency scans, Rust static analysis, encryption checks.

## 4. Deliverables

- `docs/audit/INTEL-REPORT-AUDIT-PLAN.md` (this file)
- `docs/audit/INTEL-REPORT-INVENTORY.md`
- `docs/audit/INTEL-REPORT-SCHEMA.md`
- Automated validation scripts under `scripts/`
- CI hooks: `npm run audit:reports`

## 5. Next Steps

1. **Phase 1**: Generate `INTEL-REPORT-INVENTORY.md` with full file listing and basic metadata.
2. **Phase 2**: Draft canonical JSON schema in `INTEL-REPORT-SCHEMA.md`.
3. Embed schema validation into CI pipeline.

---
*End of Audit Plan*
