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
   - Always follow `.primer` for naming, documentation, and AI agent protocols.
   - Use short, clear comments and repeat key terms (see Glossary in `.primer`).

4. **If onboarding fails:**
   - Create a `TODO:` with the error and reference this file and the failed artifact.
   - Do not proceed with code generation until onboarding is successful.

---

## 2. AI Agent Protocols (Summary)
- Always check for and use existing artifacts before generating new code.
- Update `cache/code-summary.json` and `cache/code-health.json` after significant changes.
- Leave `AI-NOTE:` comments for non-obvious logic or context.
- Escalate missing context with a `TODO:` referencing the relevant artifact or doc.

---

## 3. Artifacts & Scripts
- **Onboarding Script:** `scripts/onboard.cjs`
- **Summary Artifact:** `cache/code-summary.json`
- **Health Artifact:** `cache/code-health.json`
- **Project Primer:** `.primer`

---

## 4. Example (Pseudocode)

```
# Step 1: Run onboarding
node scripts/onboard.cjs

# Step 2: Load context
context = load('cache/code-summary.json')
health = load('cache/code-health.json')

# Step 3: Follow .primer protocols
# ...
```

---

**This file is for Copilot AI Agent use only.**
