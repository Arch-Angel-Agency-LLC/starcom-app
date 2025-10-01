# Rendering Tuning (Fills & Borders)

Fills (territories)
- elevation epsilon: +0.3 to +0.6 at R=100 (configurable)
- material: MeshBasicMaterial, transparent: true, depthTest: true, depthWrite: false, side: FrontSide
- polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: -1.5 (tune as needed)

Borders
- Phase 1: LineBasicMaterial; keep depthTest: true; optional slight polygonOffset if needed.
- Phase 2: SDF or shader-based great-circle lines with screen-space width for crispness at any zoom.

Notes
- renderOrder does not bypass depth; use polygonOffset + epsilon instead.
- Avoid disabling depthTest (breaks horizon occlusion).
