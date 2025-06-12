<!-- filepath: /Users/jono/Documents/GitHub/starcom-app/starcom-mk2/ONBOARDING.md -->

# AI Agent Onboarding Protocol (Copilot/GPT-4.1 Only)

**Audience:** GitHub Copilot AI Agent (GPT-4.1) — Not for human use.

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

---

## 3. Project Overview
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
4. When adding or updating tests, colocate them with the relevant module and update the test suite artifacts as needed.
5. Use structured TODOs: `TODO: [QUESTION] — [FILE/ARTIFACT]`
6. Leave `AI-NOTE:` comments for future agents.
