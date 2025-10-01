# Geopolitical Geometry: Implementation & Operations Guide

This folder documents how we align, render, and interact with geopolitical layers on the Globe without destabilizing existing features. Use this as the source of truth for projection rules, rendering settings, picking, QA, performance, and rollout.

Contents
- projection-conventions.md — Canonical lat/lon → 3D rules and texture alignment
- rendering-tuning.md — Material/depth settings (epsilon, polygonOffset, sides)
- borders-rendering.md — Borders strategy (SDF/line shader), scaling, AA
- picking-strategy.md — Hover/selection picking (Stage 1 BVH, Stage 2 GPU ID)
- implementation-plan.md — Staged rollout, feature flags, ownership
- qa-checklist.md — Visual, interaction, and edge-case validation
- performance-metrics.md — Benchmarks, budgets, and test harness
- feature-flags-rollback.md — Flags, defaults, rollback procedure
- alignment-test-plan.md — Prime meridian, seam, pole and antimeridian tests
- debug-overlays.md — Dev-only helpers for validation
- progress-tracker.md — Status board and milestones

Principles
- Do no harm: ship minimal, reversible changes with flags.
- Verify visually: keep quick checks for seam, poles, borders.
- Measure: track perf and picking latency; regressions block rollout.
