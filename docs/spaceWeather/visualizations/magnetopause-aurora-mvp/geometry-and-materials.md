# Geometry and Materials

## Purpose
- Define how meshes and materials are constructed for magnetopause, bow shock, and auroral ovals.
- Specify budgets, LOD rules, blending, and disposal to keep rendering performant and clean.

## Geometry Primitives
- Magnetopause: scaled sphere or ellipsoid at standoff radius; optionally a slight compression toward nightside can be deferred.
- Bow shock: scaled sphere/ellipsoid larger than magnetopause; maintain enforced delta separation.
- Auroral ovals: ribbon or thin mesh built from lat/long sequences; altitude offset relative to Earth radius.
- Blackout mask: coarse grid or band geometry with opacity gradient; avoid full textures for MVP.

## Construction Pipeline
1. Receive payload (radii or lat/long arrays) with metadata.
2. Convert lat/long to 3D coordinates on globe for ovals; duplicate seam points to avoid gaps at +/-180.
3. Generate buffer geometries with capped vertex counts; simplify if over budget.
4. Apply materials based on layer: shells get translucent Phong; ovals get additive glow.
5. Attach to scene with defined renderOrder and depth settings.

## Materials
- Magnetopause material: MeshPhongMaterial, color teal/cyan, opacity ~0.35, transparent true, depthWrite true, depthTest true.
- Bow shock material: MeshPhongMaterial, color amber/orange, opacity ~0.3, slightly emissive rim allowed.
- Aurora material: additive blend, soft green gradient, no depthWrite to reduce artifacts; optional subtle pulse.
- Blackout mask material: dark translucent band with smooth gradient; standard alpha blend.

## Blending and Depth
- Order: aurora (additive) beneath shells; magnetopause above aurora; bow shock outermost.
- Set renderOrder accordingly and use polygonOffset or depthBias if z-fighting observed.
- Keep shell materials writing depth to prevent backfaces showing through; aurora does not write depth.

## LOD and Budgets
- Vertex caps: shells <5k vertices each; ovals combined <8k.
- If ovals exceed cap, run point reduction (e.g., Douglas-Peucker) before mesh build.
- Shader complexity: stick to built-in materials; no custom shaders in MVP.

## Animation and Effects
- MVP: static geometry per update; optional mild opacity pulse for aurora tied to Kp.
- No particle systems in MVP; keep CPU and GPU cost low.

## Disposal and Updates
- On overlay update, dispose old geometries and materials to avoid leaks.
- Reuse materials where safe; dispose only if properties change to reduce churn.
- Remove objects from scene graph before disposing to avoid dangling refs.

## Coordinate and Scale
- Use Earth radius unit = 1 in scene; scale shells by standoffRe and bowShockRe accordingly.
- Aurora altitude offset: small additive factor (e.g., 1.02) to lift above surface.

## Testing Hooks
- Provide debug mode to render wireframes for shells and ovals; toggled via config.
- Include helpers to export vertex counts and bounding spheres for perf inspection.

## Extensibility
- Reserve hooks for future custom shaders (noise, flow) without changing geometry contracts.
- Allow parameterized colors and opacities via configuration constants.
