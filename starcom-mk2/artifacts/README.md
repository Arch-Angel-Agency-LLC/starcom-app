# Artifact-Driven GlobeEngine & Overlay System: Onboarding & Extension Guide

## Overview
This project uses an **artifact-driven architecture** for the Starcom GlobeEngine and overlay system. All features, overlays, modes, shaders, and tests are documented and traceable via artifacts in this directory. This ensures maintainability, extensibility, and clear onboarding for new contributors.

---

## Key Artifacts
- **globe-engine-api.artifact**: GlobeEngine public API, events, and integration guide.
- **globe-engine-architecture.artifact**: Module structure, responsibilities, and extensibility guidelines.
- **globe-modes.artifact**: Supported globe modes, their overlays, and configuration.
- **globe-mode-mapping-reference.artifact**: Mapping from Starcom modes to globe shaders, textures, and overlays.
- **globe-overlays.artifact**: All overlays, their data sources, update strategies, and UI/UX guidelines.
- **globe-shaders.artifact**: All shaders/materials, rationale, and mapping to modes.
- **globe-testing-plan.artifact**: Testing strategy, coverage, and artifact-driven test mapping.
- **globe-textures.artifact**: Texture/asset manifest and usage mapping.
- **globe-migration-checklist.artifact**: Migration/refactor progress and known issues.

---

## Onboarding: How to Extend the Globe System

### 1. Adding a New Overlay
- **Update** `globe-overlays.artifact` with the new overlay, data source, update strategy, and UI/UX notes.
- **Implement** overlay logic in `GlobeEngine.ts` (fetch, cache, emit events). Reference the artifact in code comments.
- **Integrate** overlay in the UI (e.g., `Globe.tsx`), using artifact-driven mapping and controls.
- **Add tests** in `GlobeEngine.test.ts` for overlay logic, event emission, and UI integration. Reference the testing artifact.

### 2. Adding a New Mode
- **Update** `globe-modes.artifact` and `globe-mode-mapping-reference.artifact` with the new mode, overlays, shader, and rationale.
- **Extend** `GlobeModeMapping` and `GlobeEngine` to support the new mode.
- **Test** mode switching and overlay mapping.

### 3. Adding a New Shader/Material
- **Update** `globe-shaders.artifact` with shader details, rationale, and mapping.
- **Implement** in `GlobeMaterialManager` and reference in `GlobeEngine`.
- **Test** visual output and mode integration.

### 4. Testing & Validation
- **Follow** `globe-testing-plan.artifact` for unit, integration, and visual regression test strategy.
- **Mock** API services as needed for reliable, artifact-driven tests.
- **Reference** artifacts in all test code for traceability.

### 5. Documentation & PRs
- **Reference** relevant artifacts in all code comments and PR descriptions.
- **Update** this README and artifacts as you extend the system.

---

## Best Practices
- **All new features must be documented in artifacts before implementation.**
- **All code and tests must reference the relevant artifacts for traceability.**
- **UI/UX changes should follow the guidelines in `globe-overlays.artifact`.**
- **Tests should be artifact-driven and mock data sources as needed.**

---

## Quick Links
- [GlobeEngine API](./globe-engine-api.artifact)
- [Overlay Definitions](./globe-overlays.artifact)
- [Mode Mapping](./globe-mode-mapping-reference.artifact)
- [Testing Plan](./globe-testing-plan.artifact)

---

For questions or to propose architectural changes, update the relevant artifact(s) and reference them in your PR.
