# UX Spec: IntelAnalysis Workbench (IntelAnalyzer rehash)

Final shape (at a glance):
- Left: filters + board switcher
- Center: Timeline (default) | Map | Graph | Table
- Right: Inspector (details, notes, quick actions)
- Top: compact omnibar (later), deep-link copy

Left rail
- Filters: time range, status (reports), type (intel items), tags, categories, confidence, geo-region.
- Chips: clearable; generated from view interactions (timeline brush, map polygon).
- Boards: save current filters/layout/selection; switch boards; local persistence in MVP.

Defaults and behavior
- Default facets visible: Time, Status, Type, Tags.
- More filters: Categories, Confidence, Geo presets, Author/Priority/Audience.
- Remember last-used layout per user; boards can override facet visibility.

Center views
- Timeline (TimeMap embedded): pan/zoom; brush to filter; stacked lanes by category/status.
- Map: clustered pins/heatmap; draw region filter; sync with time filter.
- Graph: entities ⇄ reports ⇄ intel items; path highlighting; expand neighbors.
- Table: virtualized rows; sorting; column filters; bulk select.

Selection & multi-select
- Single click selects one item and opens inspector.
- Modifier adds/removes from selection; inspector shows aggregate summary.
- “Pin to board” available for single/multi selections.

Right inspector
- Adapts to type (Report/Intel Item/Event/Entity): key metadata (sans classification), links, mini-history.
- Actions: pin to board, add note, open in Dashboard, copy deep link.
- Multi-select: aggregated summary with applicable actions.

Top bar
- Omnibar: quick search for reports/entities (later phase).
- Deep-link: copy stateful URL (view, filters, selection, board).

Interactions & sync
- Selection bus: selecting in any view highlights in all, opens inspector.
- Filter bus: single source of truth; views publish (brush/draw) or subscribe (render subset).
- URL sync: parse on load; update on change; boards can override filters.

Performance & thresholds
- Virtualize large tables; throttle selection broadcasts; debounce filter changes.
- Map clustering and heatmap; limit graph to a max node/edge count with truncation notice.

Accessibility
- Keyboard navigation for table and inspector; ARIA roles for filters and omnibar.
- Announce result counts and applied filters to assistive tech.

Accessibility & performance
- Keyboard navigation through table and inspector; ARIA for filters/omnibar.
- Virtualization for lists; LOD for map/graph; debounced filter propagation.
