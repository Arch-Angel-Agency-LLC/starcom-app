# Picking Strategy (Hover & Selection)

Stage 1 (Fast Ship)
- Territories: three-mesh-bvh accelerated raycasting; build BVH once per LOD.
- Borders (land + maritime when enabled): ray → sphere hit → lat/lon → nearest segment via spatial index (R-tree).
- Debounce mousemove sampling (~60–90Hz). Highlight state via materials.

Stage 2 (Prototype)
- GPU ID picking or ID-map texture: offscreen render where each nation has a unique color/ID.
- On mouse move, read the pixel at the ray–sphere hit; map to nation and border proximity.
- Predictable O(1), minimal CPU overhead.

UX Targets
- Hover latency < 50ms; selection instant; smooth transitions (120–200ms).
