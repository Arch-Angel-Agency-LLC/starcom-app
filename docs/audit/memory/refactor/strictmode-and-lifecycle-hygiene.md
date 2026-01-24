# StrictMode and Lifecycle Hygiene

## Purpose
- Ensure refactors are safe under React StrictMode, hot reloads, and rapid mount/unmount cycles.
- Prevent duplicate intervals/pollers and ensure deterministic teardown.

## Principles
- Idempotent setup: registering the same poller/cache/observer twice returns existing handle or no-op.
- Deterministic teardown: stop intervals, abort fetches, dispose resources on unmount and mode change.
- Avoid side effects in render; initialize in effects with guards.
- Hot-reload friendly: tolerates re-registration without leaking state.

## Patterns to Apply
- useRegisteredPoller hook: registers on mount; returns handle; cleans up on unmount; dedup by key.
- useSingleton effect: ensure singletons (AudioContext, tracer, cache scheduler) are reused, not recreated per render.
- Teardown hooks: on route/mode switch, stop scoped pollers and purge caches/resources.
- AbortControllers: pass to fetchers; abort on unmount.
- Defensive checks: before starting interval, ensure not already active; log dedup event.

## Targets
- Pollers in Globe/SpaceWeather/Discord/providers/SecureChat.
- Cache schedulers (cleanup interval) and tracer initialization.
- GLB/asset loader consumers to ensure dispose on unmount.
- AudioContext creation sites.

## Testing Strategy
- Unit: StrictMode double-mount triggers only one active poller; cleanup runs once.
- Integration: hot reload (simulated remount) does not leak intervals or caches; registry shows single instance.
- Hooks: useMemoryAware and useRegisteredPoller do not spawn multiple intervals when rendered twice in StrictMode.

## Acceptance Criteria
- Enabling StrictMode does not double work or leak intervals/resources.
- Hot reload leaves no extra pollers/caches/tracer instances running.
- Teardown on mode/route change consistently stops scoped work and purges caches.

## References
- React StrictMode docs; hooks under src/hooks; poller registry planned module; cache utility scheduler; audio/tracer singletons.
