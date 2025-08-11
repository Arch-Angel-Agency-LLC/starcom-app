# UX Specs: IntelWeb Graph (Beyond Obsidian)

## Controls
- Tabs: Filters, Physics, Layout, Views
- Filters
  - Search with clear (keyboard `/` to focus)
  - Node types (badges, clickable legend)
  - Edge types (reference, spatial, temporal) with color hints
  - Confidence range (0–1)
  - Time Window: quick presets + histogram brush; disabled if no timestamps
  - Isolate mode: toggle + depth slider (0–3)
  - Color mode: Type | Folder | Tag
  - Quick actions: Reset Filters
- Physics
  - Charge, link distance/strength, friction, gravity
  - Presets in Layout tab
- Layout
  - Freeze, Save, Reset
- Views
  - Save current state; list; Apply/Delete; export/import (v2)

## Panels
- Node Panel
  - Title, type, confidence, date, tags
  - Tabs: Overview | Mentions/Backlinks | Files | Timeline | Neighbors
- Edge Panel
  - Type, weight, confidence
  - Predicate, provenance, source report links

## Interactions
- Hover: connected subgraph highlight; edge tooltip
- Click: select node or edge; open respective panel
- Keyboard: `/` focus search, `Esc` clear selection, `Ctrl+S` save layout
- Legend items toggle corresponding filters

## Visual
- Node colors: type (default); alternate modes per folder or tag
- Edge colors: reference #9E9E9E, spatial #FF9800, temporal #9C27B0
- Node size: degree/confidence blended
- Labels: LOD (show selected/hover; reveal on zoom)
- Cluster hulls (optional) around communities

## Accessibility
- Aria attributes on controls
- Focus management for panels
- High contrast theme readiness
