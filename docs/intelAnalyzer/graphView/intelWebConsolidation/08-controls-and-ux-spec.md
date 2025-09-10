# Controls and UX Spec

## Controls
- Saved Views dropdown + manage dialog (create, rename, delete, duplicate)
- Layout: Freeze/Unfreeze toggle
- Sizing: Fixed vs Degree sizing toggle
- Clusters: Show/Hide toggle
- Isolate: Context menu on node → Isolate (depth 0..5); pill to adjust/clear

## States
- Reflect current state in controls; disabled states when unavailable (e.g., degree sizing disabled if no degree data)
- Persist last applied view id for quick resume

## Keyboard
- f: Freeze/unfreeze layout
- g: Toggle degree sizing
- c: Toggle clusters
- esc: Clear isolate (if active)

## Save View Flow
1) Configure filters/controls
2) Click "Save View"
3) Enter name (validate uniqueness)
4) View added; sets lastView

## Empty States
- No views: callout with CTA to create first view
- Invalid root for isolate: show toast and clear isolate

## Accessibility
- All controls keyboard accessible; ARIA labels; color contrast AA

## Visual Language
- Use existing Analyzer styles; keep compact; avoid modal blocking interactions unless necessary
