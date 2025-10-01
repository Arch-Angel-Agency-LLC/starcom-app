# QA: Overlay Order Validation

This document tracks validation of border overlay order over territory fills.

What we assert visually:
- Disputed and Line of Control lines render above fills and are clearly visible.
- Maritime lines render above fills; overlaps (maritime_overlap) take priority over EEZ.
- International borders remain visible but with lowest priority among lines.

Hotspots used for deterministic views (via `geoSnap`):
- kashmirLoC: tests disputed/LoC visibility.
- southChinaSea: tests maritime overlap/EEZ visibility.
- westSahara: tests indefinite/disputed visibility.

See automated tests in `tests/visual/geopolitical/overlay-order.spec.mjs`.
