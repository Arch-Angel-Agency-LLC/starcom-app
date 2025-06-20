<!-- filepath: /Users/jono/Documents/GitHub/starcom-app/starcom-mk2/ONBOARDING.md -->

# AI Agent Onboarding Protocol (Copilot)

**Audience:** GitHub Copilot AI Agent — Not for human use.

---

## 1. Automated Self-Onboarding Steps

1. **Run the onboarding script:**
   - The onboarding process is fully automated: `.husky` git hooks run `npm run onboard` (or `npx tsx scripts/onboard.cjs`) automatically on every commit, push, merge, and checkout.
   - No manual input or dialog is required. Artifacts (`cache/code-summary.json`, `cache/code-health.json`) are always kept up to date by this automation.

2. **Load context from artifacts:**
   - Use `cache/code-summary.json` for project structure, key directories, and entry points.
   - Use `cache/code-health.json` for lint/test status, TODOs, and AI-NOTE comments.

3. **Reference project conventions:**
   - Always read the `.primer` to anchor yourself with naming, documentation, and AI agent protocols.
   - Use short, clear comments and repeat key terms (see Glossary in `.primer`).

---

## 2. AI Agent Protocols (Summary)
- Always check for and use existing artifacts before generating new code.
- Update `cache/code-summary.json` and `cache/code-health.json` after significant changes.
- Leave `AI-NOTE:` comments for non-obvious logic or context.
- Escalate missing context with a `TODO:` referencing the relevant artifact or doc.
- **CRITICAL: Always use safe test runner for any test execution to prevent system freezes.**

---

## 5. Data Accumulation Prevention (MANDATORY)

### System Data Bloat Prevention
The project includes systems that can generate large amounts of data, potentially causing system cache bloat. **CRITICAL prevention measures:**

#### Browser Storage Bloat Prevention:
- **Files**: `src/utils/browserStorageManager.ts`, `src/hooks/useStorageMonitoring.ts`
- **Risk**: localStorage accumulation from settings, cache, and visualization data
- **Limits**: 2MB max for Starcom data, 5MB max total localStorage (exceptions for IPFS storage, but monitoring too)
- **Auto-cleanup**: Removes old entries when approaching 80% of limits
- **Monitoring**: Use `useStorageMonitoring` hook in development

### AI-NOTE: Data Bloat Root Causes
1. **Data Fetching**: Python script creates permanent timestamped files
2. **Browser Storage**: Settings and cache data accumulates in localStorage
3. **Development Artifacts**: Build and cache files can grow during development
4. **Copilot Sessions**: Extended AI sessions may trigger repeated data fetches

**VIOLATION OF DATA LIMITS WILL CAUSE SYSTEM STORAGE BLOAT**

---

## 6. Safe Testing Protocol (MANDATORY)

### AI Agent Test Safety Rules:
1. **NEVER run tests directly** - Always use the safe test runner
2. **Use timeout traps** - All tests must have execution limits
3. **Monitor output volume** - Prevent infinite logging scenarios
4. **Detect stack overflows** - Kill processes on recursion detection

### Required Commands:
```bash
# Safe test execution (ALWAYS use this)
npm run test:safe

# For NOAA-specific tests (known to cause freezes)
npm run test:noaa-safe

# NEVER use these commands directly:
# npm test (FORBIDDEN)
# npx vitest (FORBIDDEN)
# npm run test (FORBIDDEN)
```

### Safety Mechanism Files:
- **Safe Runner:** `scripts/safe-test-runner.ts`
- **NOAA Safe Test:** `scripts/test-noaa-safe.ts`
- **Package Scripts:** Updated with safe test commands

### AI-NOTE: Test Freeze Prevention
This protocol was implemented after identifying that data tests cause system freezes/stack overflows. The safe test runner includes:
- 30-second timeout traps
- Output line limiting (max 100 lines)
- Stack overflow pattern detection
- Memory usage limits
- Process termination on infinite loops

**VIOLATION OF THIS PROTOCOL CAN CAUSE SYSTEM FREEZES**

---

## 7. Project Overview
- **Starcom App**: Decentralized web3 3D global cyber command interface for cyber investigations, intelligence, financial analysis, and monitoring.
- Built with React, TypeScript, Vite, Rust/WASM, Solidity, and artifact-driven development.

### Artifacts & Scripts
- **Onboarding Script:** `scripts/onboard.cjs`
- **Summary Artifact:** `cache/code-summary.json`
- **Health Artifact:** `cache/code-health.json`
- **Project Primer:** `.primer`

### Directory Anchors
- `src/`: Main app code (tests are colocated with their modules)
- `artifacts/`: Generated/reference artifacts
- `docs/`: Reference material and design notes
- `contracts/`: Smart contracts and ABIs
- `wasm-ephemeris/`, `wasm-mini-server/`: Rust/WASM modules

### Artifact-Driven Workflow
1. Check for existing artifacts before creating new ones.
2. When adding features, create/update artifacts in `artifacts/` and/or `docs/`.
3. Link code, tests, and docs to relevant artifacts.
4. **When running tests, ALWAYS use the safe test runner protocol.**
5. Use structured TODOs: `TODO: [QUESTION] — [FILE/ARTIFACT]`
6. Leave `AI-NOTE:` comments for future agents.
