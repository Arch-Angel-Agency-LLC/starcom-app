# QA Checklist

Visual Alignment
- [ ] Prime meridian marker aligns with Greenwich seam
- [ ] No 90°/180° texture/geometry offsets
- [ ] No see-through at limb; fills respect horizon

Interactions
- [ ] Hover highlight shows within 50ms; smooth fade
- [ ] Selection locks highlight; neighbors dim ~30%
- [ ] Land border hover accent is crisp at all zooms
- [ ] Maritime border hover accent (EEZ/overlap) is crisp at all zooms when enabled

Edge Cases
- [ ] Antimeridian shapes render correctly
- [ ] Poles and small islands retain visibility
	- [x] Disputed/LoC lines render above fills (see tests/visual/geopolitical/overlay-order.spec.mjs)
	- [x] Maritime overlap > EEZ > international priority (enable with ?geoMaritime=1)
	- Deterministic views available via geoSnap keys: kashmirLoC, southChinaSea, westSahara; lock LOD with ?geoLod=2.
Performance
