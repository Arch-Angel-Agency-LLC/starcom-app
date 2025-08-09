# 2D Engine Workerization (Draft)

Architecture
- Worker runs d3-force simulation; main thread renders to Canvas.
- Message protocol: init(graph), tick(positions), update(params), pause/resume, dispose.

Data transport
- Use transferable objects: Float32Array for positions/velocities.
- Throttle postMessage to ~30–60 Hz; interpolate positions on main thread if needed.

Persistence
- Save node positions keyed by dataset/package; restore on load; respect pinned nodes.

LOD & clustering
- Hide labels at scale; draw cluster hulls; aggregate edges between clusters.

Testing
- Benchmarks for 1k/5k/10k nodes; FPS and input latency; memory usage.
