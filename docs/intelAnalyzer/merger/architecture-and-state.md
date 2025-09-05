# Architecture & State

Data sources
- IntelWorkspaceProvider: reports (IntelReportUI[]) and intel items (IntelItemUI[]).
- Adapters: Reports/Items → Events (id, title, timestamp, tags/categories, lat/lon?, confidence, sourceType/sourceId, entityRefs).
	- Fallback timestamp strategy when missing (createdAt → updatedAt); mark approximate.

Contexts
- FilterContext: normalized filters (time, facets, geo); serialize/deserialize for URL and boards.
- SelectionContext: selected ids (single/multi); publish/subscribe.
	- Selection shapes: { type: 'report'|'intel'|'event'|'entity', id: string }[]

Routing
- Query params: view, selected, filters (encoded), board.
- Priority: URL > board defaults > in-memory defaults.
 - Deep links are copyable from top bar and inspector.

Views
- TimelineView: wraps TimeMap; props: events, filters, selection; emits brush-selection.
- MapView: clustered pins; region draw → geo filter; subscribes to time filter.
- GraphView: nodes (entities/reports/items), edges (mentions/co-occurrence); capped size.
- TableView: virtualized; column filters; emits selection; can highlight current selection.

Inspector
- Type-specific rendering for Report/Item/Event/Entity; notes/pin; actions to open in Dashboard.

Persistence
- MVP: boards in localStorage; V2: persist board files in Workspace.

Telemetry
- view_switched, selection_changed, filter_applied, board_saved, open_in_dashboard, pivot_entity, timeline_brush.
 - import_committed, report_created, status_changed (from Dashboard), export_clicked (cross-app alignment).
