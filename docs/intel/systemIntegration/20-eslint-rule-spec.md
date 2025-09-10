## ESLint Rule Spec: no-local-intelreport

Purpose
Enforce migration away from ad-hoc / legacy Intel report interface declarations toward the canonical `IntelReportUI` and `CreateIntelReportInput` types.

Scope
- Flags any `interface IntelReport`, `interface NetRunnerIntelReport`, or `interface LegacyIntelReport` and matching type aliases outside `src/types/intel/IntelReportUI.ts`.
- Ignores generated / test folders already excluded by global ESLint ignore list.

Rationale
Local duplications caused drift (missing fields: history, classification naming, status enum). Centralizing ensures adapters + serialization remain single-source.

Heuristics
- Name match: `IntelReport`, `NetRunnerIntelReport`, or `LegacyIntelReport`.
- Not in canonical file path.

Severity Phases
1. Phase 3-4: warn (surfacing remaining spots while migration ongoing).
2. Phase 5: escalate to error once tracker milestone “Replace NetRunnerIntelReport usages” is complete.

Autofix Strategy (multi-suggestion)
1. Comment out declaration (default safe placeholder)
2. Replace with `type <Name> = IntelReportUI;` transitional alias
3. Insert canonical import if missing

False Positive Mitigation
- Does not flag variables, only interface or type alias declarations.
- Does not scan `.d.ts` or ignored paths.

Developer Workflow
1. See warning: remove local declaration.
2. Import `{ IntelReportUI }` or appropriate creation input.
3. Adjust code to service/provider flows (reference cookbook section 01-integration-cookbook.md: “Creating Reports”).

Future Enhancements
- Detect partial shadow interfaces (subset field sets) and suggest explicit pick utility.
- Cross-file auto-suggestion: propose replacing with `Pick<IntelReportUI, ...>` when shape is intentionally narrower.

References
- Tracker: `00-progress-tracker.md` Phase 0 / Phase 5 tasks.
- Cookbook: standard creation and persistence snippets.

