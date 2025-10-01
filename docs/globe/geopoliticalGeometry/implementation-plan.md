# Implementation Plan (Staged, Flagged)

Stage 1 (1–2 days)
- Add elevation epsilon + polygonOffset + FrontSide on fills.
- Integrate three-mesh-bvh for territory picking; simple border spatial index.
- Hover/selection highlight materials and border accent; dev seam marker.
- Flags: geo.fillElevationEpsilon, geo.usePolygonOffset, geo.bvhPicking.

Stage 2 (1–2 weeks, prototype behind flag)
- GPU ID picking OR ID-map texture; SDF borders + tiled overlay compositor in globe material.
- Flag: geo.textureOverlayPrototype, geo.idPicking.

Stage 3 (hardening)
- Adaptive densification or VS spherical projection for meshes; tile streaming and compression; a11y polish.

Owners
- Rendering/Shader: Game Dev
- Integration/Hooks/Data: Original Dev
- Visual/UX Spec: Designer
- QA/Perf: QA Engineer
