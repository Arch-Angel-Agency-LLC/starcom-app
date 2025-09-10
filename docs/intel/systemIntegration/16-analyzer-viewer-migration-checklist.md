# Analyzer Viewer Migration — Checklist

Scope: Migrate `src/components/IntelAnalyzer/IntelReportsViewer.tsx` to centralized Intel system (provider/service/types) per Phase 1.

Status legend: [ ] not started | [~] in progress | [x] done

Core steps
- [x] Import and use `useIntelWorkspace()` for reads
- [x] Import and use `intelReportService` for create
- [x] Replace local `IntelReport` interface with `IntelReportUI`
- [x] Remove mock data and local useEffect loader
- [x] Update UI bindings to IntelReportUI fields (author, classification, createdAt, category, confidence 0..1)
- [x] Replace legacy connections with `sourceIntelIds`
- [x] Update classification enum values (UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET)
- [ ] Add edit/save flow via `intelReportService.saveReport()` (optional v1)
- [ ] Minimal integration test (create → render → edit → persist)

UX checks
- [x] Category filter works against `report.category`
- [x] Avg confidence reflects 0..1 scale → percent
- [x] Details panel shows author, classification, created date from UI

Notes
- Seeding handled via workspace manager; on create, viewer selects the new report.
- Further enhancements (status transitions, edit form) tracked in Phase 1 acceptance criteria.

