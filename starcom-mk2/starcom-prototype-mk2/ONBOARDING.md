# ONBOARDING for AI Agents: Starcom App

---

## AI & Copilot Onboarding Quickstart (2025)

**To onboard, follow these steps:**

1. **Open VS Code in this project.**
2. **Run the Onboard task:**
   - If you are a human, use Command Palette (⇧⌘P) → `Tasks: Run Task` → `Onboard (Generate Code Status)`
   - **If you are an AI agent, run the onboarding task directly via CLI (no user input required):**
     ```
     npm run onboard
     ```
     or
     ```
     npx tsx scripts/onboard.cjs
     ```
     - The onboarding script must run fully non-interactively for AI agents. No confirmation or prompts should occur.
3. **Review outputs:**
   - `cache/code-summary.json`: Project structure, artifact links, docs
   - `cache/code-health.json`: Lint/test status, TODOs, AI-NOTEs

This gives all agents a single-pass, up-to-date snapshot of the codebase and health. No manual searching required.

---

## AI Agent Protocols & Best Practices
- **When in doubt:** Add a `TODO:` with your question and reference the relevant artifact or doc.
- **Always:**
  - Check for existing artifacts, modules, or docs before generating new code.
  - Link new code to artifacts and update docs.
  - Use short, clear comments and repeat key terms (see Glossary in .primer).
  - Leave `AI-NOTE:` comments for non-obvious logic or context for future agents.
- **Context Window:**
  - You can only see ~25-75 lines at a time. Chunk your work. Use file/folder names and section headers as anchors.
  - Use the directory structure and `docs/` for navigation and context.

---

## Project Overview
- **Starcom App**: Decentralized web3 3D global cyber command interface for cyber investigations, intelligence, financial analysis, and monitoring.
- Built with React, TypeScript, Vite, Rust/WASM, Solidity, and artifact-driven development.

## Directory Anchors
- `src/`: Main app code
- `artifacts/`: Generated/reference artifacts
- `docs/`: Reference material and design notes
- `contracts/`: Smart contracts and ABIs
- `wasm-ephemeris/`, `wasm-mini-server/`: Rust/WASM modules

## Artifact-Driven Workflow
1. Check for existing artifacts before creating new ones.
2. When adding features, create/update artifacts in `artifacts/` and/or `docs/`.
3. Link code, tests, and docs to relevant artifacts.
4. Use structured TODOs: `TODO: [QUESTION] — [FILE/ARTIFACT]`
5. Leave `AI-NOTE:` comments for future agents.

## Artifact Lifecycle Checklist
- [ ] Artifact created/updated in `artifacts/` or `docs/`
- [ ] Code/tests linked to artifact
- [ ] Documentation updated
- [ ] TODOs/AI-NOTEs left for unresolved or complex areas

## Reference & Meta-Coordination
- Use `docs/` for design notes, requirements, and reference implementations.
- Always check for existing documentation before creating new artifacts or modules.
- Leave breadcrumbs: Use `AI-NOTE:` comments to explain non-obvious decisions or context for future agents.
- Document all new or updated artifacts in `artifacts/` and/or `docs/`.

---

Prioritize clarity, traceability, and context. Use this ONBOARDING.md and the .primer as your anchors. Escalate uncertainty with TODOs and AI-NOTEs. Chunk your work and use anchors for navigation.
