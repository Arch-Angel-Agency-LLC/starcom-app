# Feature Flags & Rollback

Flags
- geo.fillElevationEpsilon: number (default 0.3)
- geo.usePolygonOffset: boolean (default true)
- geo.bvhPicking: boolean (default true)
- geo.textureOverlayPrototype: boolean (default false)
- geo.idPicking: boolean (default false)

Defaults
- Conservative: only Stage 1 on by default; Stage 2 features gated.

Rollback Procedure
- Toggle flags to off → remove effects immediately; no rebuild required if wired via runtime config.
- Keep a small test to verify seam/prime-meridian on startup in dev.
