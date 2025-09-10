# Deprecation and Removal Guide (IntelWeb)

## Timeline
1) Parity features land behind flag
2) Default to Analyzer GraphView; hide IntelWeb entry points
3) One release: soft-deprecate; add docs
4) Next release: remove IntelWeb code and routes

## Steps
- Feature flag guard (`ANALYZER_GRAPH_VIEWS_V2`)
- Update navigation and docs
- Telemetry: measure usage drop to <5%
- Remove IntelWeb: code, tests, docs
- Migrate any data or export a one-off importer

## Communication
- Changelog entries and internal announcement
- Migration notes for team
