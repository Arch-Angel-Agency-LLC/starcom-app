# 3D and Media Disposal

## Purpose
- Ensure GLTF/mesh/material/texture/audio resources are disposed or pooled.
- Prevent accumulation from mode churn, overlay toggles, and repeated asset loads.
- Provide helpers and rollout steps for teams to adopt safely.

## Current Risks
- GLTF loaders cache promises but do not always dispose geometries/materials on unmount.
- SolarActivityVisualizer clones flares/particles without pooling; counts grow in long sessions.
- Audio notifications create new AudioContext/BufferSource per event; contexts left open.
- Scene graph retains detached objects if not removed before dispose.
- Mode switches (eco/cyber) do not purge caches or scene objects consistently.

## Objectives
- Centralized dispose helpers for GLTF assets (geometry, material, texture, skeleton, animations).
- Pool or reuse particle/flaring meshes; clear instanced buffers on teardown.
- Singleton AudioContext with limited concurrent BufferSources; stop/close on teardown.
- Purge scene nodes and caches on mode/route exit; verify no retained references.

## GLTF Lifecycle
- Load → attach → detach → dispose. Provide helper `disposeGLTF(scene, opts)` that:
  - Traverses meshes; disposes geometry/material; clears textures; disposes skeletons.
  - Accepts options to preserve shared textures/materials when reused.
  - Clears animations and userData references; removes from parent before dispose.
- Integrate helper in assetLoader consumers (Globe overlays, 3D widgets).
- Ensure cache purge triggers dispose for evicted entries (GLB cache eviction hook).

## Particle/Visual Effects (SolarActivityVisualizer)
- Introduce pool for flare/particle meshes; reuse instances; limit pool size.
- On mode exit/unmount: return instances to pool and dispose excess.
- Clear GPU buffers (geometry attributes) and materials; detach from scene.
- Add counters to detect growth; emit telemetry when pool hits max.

## Audio
- Use singleton AudioContext (lazy init); cap concurrent BufferSources.
- Reuse decoded buffers where appropriate; dispose sources after playback end.
- On teardown or mode switch: stop all sources; close context if idle.
- Gate audio creation behind user interaction if required by browser policies.

## Scene/Overlay Teardown
- Provide `teardownSceneNodes(nodes, { disposeMaterials })` that removes from parent and disposes.
- Ensure overlay/components call teardown on unmount and mode change.
- Add purge hook tied to poller registry teardown for related overlays.

## Testing Strategy
- Unit: dispose helper releases geometry/material/texture references; pool returns instances.
- Integration: load GLTF twice with disposal in between → no growth in object/texture counts.
- Audio: repeated notifications reuse AudioContext; concurrent cap enforced; no leaked sources.
- Long-run sim: mode churn triggers purge; scene object count plateaus.

## Rollout Steps
- Add dispose helper utilities and pool implementation.
- Wire GLB cache eviction to dispose entries; update consumers to call dispose on unmount.
- Replace per-notification AudioContext creation with singleton; add teardown hook.
- Integrate pool in SolarActivityVisualizer; add counters/telemetry.

## Acceptance Criteria
- GLTF loads followed by dispose show flat retained geometries/materials over time.
- Particle/audio resources do not grow across mode churn; pools bounded.
- GLB cache eviction disposes assets; no dangling scene nodes after overlay unmount.

## References
- GLB loader: src/utils/assetLoader.ts.
- Solar flares: src/solar-system/effects/SolarActivityVisualizer.ts.
- Audio notifications: search for new AudioContext usage.
- Scene overlays: Globe overlays and 3D widgets.
