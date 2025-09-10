# Guardrails: Lint and CI

## ESLint rule (concept)
- Disallow declaring IntelReport-like interfaces outside `src/types/intel`.
- Allow only imports of `IntelReportUI` and related types.
- Suggestion: custom rule skeleton `no-local-intelreport` checking interface names and property sets.

## CI checks
- Grep: fail if `interface IntelReport` appears outside allowed folders.
- Type-only import enforcement: ensure `IntelReportUI` is used in app code.
- Run `vitest` suite for adapters/serialization on PRs touching intel code.

## Migration enforcement
- Temporary: Allowlist legacy files; reduce over time.
