# Accessibility & Performance

Accessibility (AA baseline)
- Keyboard: full navigation for table and inspector; shortcuts for view switching and omnibar.
- ARIA: combobox (omnibar), roles for filters, live region for result counts and filter changes.
- Contrast: chips/badges meet contrast; status colors have text labels.
- Focus: trap in inspector; return focus to origin on close.

Performance budgets
- Table: virtualized; 50k rows ok; <16ms scroll frames.
- Timeline: WebGL/canvas rendering; clustering at low zoom; throttle updates.
- Map: WebGL map (MapLibre GL) + Supercluster; cap markers per tile.
- Graph: ≤300–500 nodes for force layout; cap to sampled graph beyond; use Web Worker; 60fps panning.

Debounce & LOD
- Debounce filter propagation; incremental updates for selection; avoid re-layout on minor changes.
