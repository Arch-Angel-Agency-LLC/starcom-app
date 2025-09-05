# Test Plan

Unit
- intelReportService: transitions (valid/invalid), version/history updates, import strategies.
- eventsAdapter: mapping reports/items → events (time/geo fallbacks).
- filter serialization: encode/decode, edge cases (empty, large geo).

Integration
- Provider init → views render filtered data; subscription updates propagate.
- Selection sync: select in one view highlights in others; inspector opens.
- Timeline brush sets time filter; map polygon sets geo filter; chips appear and clear correctly.
- Deep-link restore: view/filters/selection restored; copy link stable.

E2E smoke
- Open Analysis → default timeline with data.
- Apply filters → table shows reduced set; select → inspector shows details.
- Save board → switch and restore; follow deep link.

Accessibility
- Keyboard nav across table and inspector; ARIA roles for filters/omnibar; focus management on panel open/close.
