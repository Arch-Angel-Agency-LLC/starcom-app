# TDD & Playwright Testing Guide for Starcom dApp

This document outlines the Test-Driven Development (TDD) process and best practices for writing, running, and maintaining Playwright end-to-end tests for the Starcom decentralized app (dApp).

## Table of Contents

- [TDD \& Playwright Testing Guide for Starcom dApp](#tdd--playwright-testing-guide-for-starcom-dapp)
  - [Table of Contents](#table-of-contents)
  - [TDD Workflow](#tdd-workflow)
  - [Project Structure](#project-structure)
  - [Running Tests](#running-tests)
  - [Writing Tests](#writing-tests)
    - [Test Naming \& Placement](#test-naming--placement)
    - [Assertions \& Timeouts](#assertions--timeouts)
    - [Mocking External Services](#mocking-external-services)
  - [Best Practices](#best-practices)
  - [Debugging \& Troubleshooting](#debugging--troubleshooting)
  - [CI Integration](#ci-integration)
  - [Test Stability \& Flakiness](#test-stability--flakiness)
  - [Priority Test Plan](#priority-test-plan)
    - [Tier 0: Pre-Test Setup \& Hygiene](#tier-0-pre-test-setup--hygiene)
    - [Tier 1: Core UX Smoke \& Human Simulation](#tier-1-core-ux-smoke--human-simulation)
    - [Tier 2: Accessibility \& Render Stability](#tier-2-accessibility--render-stability)
    - [Tier 3: Performance Threshold \& Agent-Driven Flows](#tier-3-performance-threshold--agent-driven-flows)
    - [Tier 4: Enhanced \& Universal Component Detection](#tier-4-enhanced--universal-component-detection)

---

## TDD Workflow

1. **Red**: Write a failing test describing a new feature or bug fix.
2. **Green**: Implement the minimum code changes to make the test pass.
3. **Refactor**: Clean up code and tests, removing duplication and improving clarity.
4. Repeat for each story or component.

TDD encourages small, incremental improvements with thorough test coverage.

---

## Project Structure

- `src/` - React application source code
- `src/testing/playwright/` - Playwright test suites
  - `basic-ui.spec.ts` - smoke tests for core UI
  - `user-simulation.spec.ts` - human-like flows (chat, navigation)
  - `enhanced-component-detection.spec.ts` / `universal-component-detection.spec.ts` - AI-driven component checks
  - `ai-agent.spec.ts`, `ai-agent-phase2.spec.ts` - autonomous agent testing
  - `deep-react-debug.spec.ts` - diagnostic mount tests
- `playwright.config.ts` - global Playwright configuration
- `docs/` - test documentation and guides

---

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npx playwright test

# Run a single test file
npx playwright test src/testing/playwright/user-simulation.spec.ts

# Open HTML report
npx playwright show-report
```

Ensure the Vite dev server is configured via `webServer` in `playwright.config.ts` for automatic startup before tests.

---

## Writing Tests

### Test Naming & Placement

- **Spec files** use `.spec.ts` suffix and reside under `src/testing/playwright/`.
- **Describe blocks** group related assertions.
- **test()** blocks should target a single behavior or assertion.

### Assertions & Timeouts

- Use `await page.locator(...).waitFor()` to wait for elements.
- Prefer `toHaveText`, `toBeVisible`, etc., for clarity.
- Override global timeouts sparingly:
  ```ts
  test.setTimeout(30_000);
  ```

### Mocking External Services

- Stub Nostr/IPFS/network calls via Playwright's `route` API:
  ```ts
  await page.route('**/api/**', route => route.fulfill({ status: 200, body: '{}' }));
  ```
- Ensure mock data matches production API contracts.

---

## Best Practices

- Use **data-testid** attributes for stable selectors.
- Avoid CSS or deeply nested selectors that break on style changes.
- Keep tests **deterministic**: control network, time, locales.
- Capture screenshots and traces on failure for CI diagnostics.

---

## Debugging & Troubleshooting

- **Screenshots**: `testInfo.attach('screenshot', { path, body })` on failure.
- **Traces**: enable via `trace: 'on-first-retry'` in config, then view with:
  ```bash
  npx playwright show-trace trace.zip
  ```
- **Console logs**: pipe stdout/stderr from `webServer` in config.

---

## CI Integration

- Use `retries: 1` for CI to reduce flakes.
- Break tests into small **projects** in `playwright.config.ts` for parallelism.
- Archive video and trace artifacts.

---

## Test Stability & Flakiness

- Annotate known-flaky tests with `test.skip()` or `test.fixme()`.
- Track failures and flakiness metrics via CI reporting.
- Dedicate time each sprint to stabilize flaky tests.

---

## Priority Test Plan

Below is an enhanced, actionable test-prioritization plan to stabilize high-value UX scenarios first and progressively tackle complex and flaky cases.

### Tier 0: Pre-Test Setup & Hygiene
- Verify `webServer` config is reliable; stub or mock external Nostr/IPFS endpoints for repeatable network behavior
- Adopt `data-testid` attributes across core components for stable selectors
- Configure global `retries: 1` and `reportSlowTimers: true` in CI for faster flake detection

### Tier 1: Core UX Smoke & Human Simulation
- Target files: `basic-ui.spec.ts`, `user-simulation.spec.ts`
- Actions:
  - Increase selector timeouts (e.g. `locator.waitFor({ timeout: 15000 })`)
  - Wrap external API calls with `page.route` mocks to remove network unreliability
  - Mark flaky steps with `test.step` and automated recovery or retry logic
  - Assert critical paths: page load, nav, footer, message send, channel switch

### Tier 2: Accessibility & Render Stability
- Target accessibility checks and render timing:
  - Use `await page.waitForLoadState('domcontentloaded')` before assertions
  - Leverage `accessibility.snapshot()` for ARIA role and label validations
  - Add focus order tests and keyboard navigation flows

### Tier 3: Performance Threshold & Agent-Driven Flows
- Focus on AI agent performance and resilience:
  - Parameterize performance budgets (e.g. page load < 2s, component render < 500ms)
  - Mock slow relay nodes and error conditions so tests converge predictably
  - Break large agent specs (`ai-agent.spec.ts`, `ai-agent-phase2.spec.ts`) into smaller slices for unit-level detection and workflows

### Tier 4: Enhanced & Universal Component Detection
- Stabilize AI-driven detectors:
  - Collect baseline DOM snapshots for each test scenario, store under `test-results/baselines/`
  - Parameterize detector inputs and expected outputs for pages (e.g. homepage, chat view)
  - Gradually un-skip failing assertions, track flake rates via CI

---

*Last updated: 2025-07-02*
