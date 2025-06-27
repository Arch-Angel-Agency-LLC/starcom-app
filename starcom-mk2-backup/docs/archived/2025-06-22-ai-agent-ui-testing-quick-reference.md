# AI Agent UI Testing Quick Reference
**Version**: 1.0.0  
**Date**: June 21, 2025  
**Type**: Quick Reference Guide

---

## 🚀 Quick Start Commands

### Setup & Installation
```bash
# Install dependencies
npm install --save-dev @playwright/test playwright @axe-core/playwright pixelmatch pngjs

# Setup testing framework
npm run setup-ai-testing

# Install browsers
npx playwright install
```

### Running Tests
```bash
# AI-safe test execution (ALWAYS USE THIS)
npm run test:ai-agent

# Specific test types
npm run test:ui           # All Playwright tests
npm run test:visual       # Visual regression only
npm run test:a11y         # Accessibility only
npm run test:performance  # Performance only

# Generate reports
npm run generate-test-reports
```

### Safety Commands
```bash
# Safe test runner (prevents system freezes)
npm run test:safe

# NOAA-specific safe testing
npm run test:noaa-safe

# Emergency: Never use these directly with AI agents
# npm test              # ❌ FORBIDDEN
# npx vitest           # ❌ FORBIDDEN  
# npm run test         # ❌ FORBIDDEN
```

---

## 🤖 AI Agent Interface

### Basic Usage
```typescript
import { AIAgentTestingInterface } from './src/testing/ai-agent/agent-interface';

// Initialize
const aiAgent = new AIAgentTestingInterface(page, context);

// Inspect element
const info = await aiAgent.inspectElement('[data-testid="button"]');

// Analyze page
const structure = await aiAgent.analyzePageStructure();

// Detect issues
const anomalies = await aiAgent.detectUIAnomalies();
```

### User Journey Testing
```typescript
const journey = {
  name: 'user-login',
  steps: [
    { action: 'click', selector: '[data-testid="login-btn"]' },
    { action: 'type', selector: '#username', text: 'testuser' },
    { action: 'type', selector: '#password', text: 'password' },
    { action: 'click', selector: '[type="submit"]' },
    { action: 'verify', selector: '.welcome', expected: 'Welcome' }
  ],
  expectedOutcome: 'User successfully logged in'
};

const result = await aiAgent.runUserJourney(journey);
```

### Component Analysis
```typescript
import { SmartComponentDetector } from './src/testing/ai-agent/component-detector';

const detector = new SmartComponentDetector(page);
const componentMap = await detector.scanComponents();

// Find untested components
const untested = componentMap.coverageGaps;

// Generate tests
for (const component of untested) {
  const tests = await detector.generateTests(component);
}
```

---

## 📊 Test Types Reference

### 1. Unit Tests (Existing)
- **Framework**: Vitest + React Testing Library
- **Command**: `npm run test:safe`
- **Location**: `src/**/*.test.tsx`

### 2. UI Automation Tests
- **Framework**: Playwright + AI Agent Interface
- **Command**: `npm run test:ui`
- **Location**: `src/testing/playwright/`

### 3. Visual Regression Tests
- **Framework**: Playwright + Pixelmatch
- **Command**: `npm run test:visual`
- **Location**: `src/testing/playwright/visual/`

### 4. Accessibility Tests
- **Framework**: Playwright + Axe
- **Command**: `npm run test:a11y`
- **Location**: `src/testing/playwright/accessibility/`

### 5. Performance Tests
- **Framework**: Playwright + Lighthouse
- **Command**: `npm run test:performance`
- **Location**: `src/testing/playwright/performance/`

---

## 🛡️ Safety Protocol Quick Reference

### MANDATORY Safety Rules
1. **ALWAYS use AI-safe test runner**: `npm run test:ai-agent`
2. **NEVER run tests directly**: No `npm test`, `npx vitest`, etc.
3. **Monitor timeouts**: 5-minute maximum execution time
4. **Watch memory usage**: 2GB maximum limit
5. **Use emergency stop**: If system becomes unresponsive

### Resource Limits
- **Max Execution Time**: 300,000ms (5 minutes)
- **Memory Limit**: 2GB
- **Output Lines**: 1,000 maximum
- **CPU Usage**: 80% maximum
- **File Writes**: Test directories only

### Emergency Procedures
```typescript
// In code - emergency stop
const runner = new AISafeTestRunner();
runner.emergencyStop();

// Command line - kill all test processes
pkill -f "playwright\|vitest\|test"
```

---

## 📁 File Structure Reference

```
src/
├── testing/
│   ├── ai-agent/
│   │   ├── agent-interface.ts          # Main AI interface
│   │   ├── component-detector.ts       # Component analysis
│   │   ├── ui-health-monitor.ts        # Real-time monitoring
│   │   └── performance-profiler.ts     # Performance analysis
│   ├── playwright/
│   │   ├── basic-ui.test.ts            # Basic UI tests
│   │   ├── visual-regression.test.ts   # Visual tests
│   │   ├── accessibility.test.ts       # A11y tests
│   │   └── performance.test.ts         # Performance tests
│   ├── visual/
│   │   ├── visual-regression.ts        # Visual testing engine
│   │   └── screenshot-manager.ts       # Screenshot utilities
│   └── utils/
│       ├── test-data-generator.ts      # Test data utilities
│       └── report-generator.ts         # Report generation
scripts/
├── ai-safe-test-runner.ts              # Safe test execution
├── setup-ai-testing.ts                 # Setup script
└── generate-test-reports.ts            # Report generation
```

---

## 🔧 Configuration Quick Reference

### Playwright Config
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './src/testing/playwright',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
```

### AI Agent Config
```typescript
// AI safety settings
const config = {
  maxExecutionTime: 300000,  // 5 minutes
  memoryLimit: '2GB',
  maxOutputLines: 1000,
  screenshotOnFailure: true,
  traceOnError: true
};
```

### Visual Testing Config
```typescript
// Visual comparison settings
const visualConfig = {
  threshold: 0.2,           // 0.2% difference tolerance
  viewports: ['desktop', 'tablet', 'mobile'],
  includeAA: true,         // Anti-aliasing
  diffColor: [255, 0, 0]   // Red highlighting
};
```

---

## 📊 Results & Reports

### Report Locations
- **HTML Report**: `test-results/test-report.html`
- **JSON Report**: `test-results/comprehensive-test-report.json`
- **Playwright Report**: `test-results/playwright-report/index.html`
- **Visual Diffs**: `test-results/visual-diffs/`

### Viewing Results
```bash
# Open HTML report
open test-results/test-report.html

# Open Playwright report
npx playwright show-report

# Check latest results
cat test-results/comprehensive-test-report.json | jq '.summary'
```

---

## 🚨 Common Issues & Solutions

### Test Timeouts
```bash
# Increase timeout in test
await page.waitForSelector('.element', { timeout: 30000 });

# Or in config
use: { actionTimeout: 30000 }
```

### Memory Issues
```bash
# Reduce parallel execution
workers: 1

# Clear cache between tests
await context.clearCookies();
```

### Visual Test Failures
```bash
# Update baselines if changes are intentional
npm run test:visual -- --update-snapshots

# Check for dynamic content
await page.waitForLoadState('networkidle');
```

### Browser Launch Failures
```bash
# Reinstall browsers
npx playwright install

# Check permissions
sudo npx playwright install-deps
```

---

## 📋 Test Creation Templates

### Basic UI Test
```typescript
import { test, expect } from '@playwright/test';
import { AIAgentTestingInterface } from '../ai-agent/agent-interface';

test('component renders correctly', async ({ page, context }) => {
  const aiAgent = new AIAgentTestingInterface(page, context);
  
  await page.goto('/component');
  
  const structure = await aiAgent.analyzePageStructure();
  expect(structure.components.length).toBeGreaterThan(0);
  
  const anomalies = await aiAgent.detectUIAnomalies();
  const critical = anomalies.filter(a => a.severity === 'critical');
  expect(critical).toHaveLength(0);
});
```

### Visual Regression Test
```typescript
import { test, expect } from '@playwright/test';
import { VisualRegressionTester } from '../visual/visual-regression';

test('component visual consistency', async ({ page }) => {
  const visualTester = new VisualRegressionTester(page);
  
  await page.goto('/component');
  await page.waitForSelector('[data-testid="component"]');
  
  const result = await visualTester.compareWithBaseline('component-name');
  expect(result.passed).toBe(true);
});
```

### Accessibility Test
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('component accessibility', async ({ page }) => {
  await page.goto('/component');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
    
  expect(results.violations).toEqual([]);
});
```

---

## 🎯 Best Practices

### For AI Agents
1. **Always use safe test runner**: `npm run test:ai-agent`
2. **Check for anomalies**: Use `detectUIAnomalies()`
3. **Verify structure**: Use `analyzePageStructure()`
4. **Monitor resources**: Watch memory and CPU usage
5. **Handle errors gracefully**: Implement try-catch blocks

### For Developers  
1. **Add test IDs**: Use `data-testid` attributes
2. **Wait for loading**: Use `waitForSelector` and `waitForLoadState`
3. **Test multiple viewports**: Desktop, tablet, mobile
4. **Update baselines**: When UI changes are intentional
5. **Review reports**: Check all test reports regularly

### Performance Tips
1. **Use parallel execution**: But limit workers if memory constrained
2. **Clear state**: Clean up between tests
3. **Cache results**: Enable result caching where appropriate
4. **Optimize selectors**: Use efficient, stable selectors
5. **Monitor baselines**: Keep visual baselines up to date

---

## 📞 Getting Help

### Debug Information
```bash
# Enable debug logging
DEBUG=pw:api npm run test:ui

# Verbose Playwright output
npx playwright test --debug

# Check system resources
npm run storage-check
```

### Emergency Contacts
1. **System Issues**: Use emergency stop procedures
2. **Memory Problems**: Reduce parallel execution
3. **Timeout Issues**: Increase timeout limits
4. **Visual Failures**: Update baselines if intentional

### Documentation References
- **Full Documentation**: `docs/ai-agent-ui-testing-documentation.md`
- **Technical Architecture**: `artifacts/ai-agent-ui-testing-technical-architecture.artifact`
- **Implementation Guide**: `artifacts/ai-agent-ui-testing-implementation-guide.artifact`
- **Project Plan**: `artifacts/ai-agent-autonomous-ui-testing-plan.artifact`

---

**AI-NOTE**: This quick reference should be used for rapid implementation and troubleshooting. For comprehensive information, refer to the full documentation and artifacts. Always prioritize safety protocols when performing UI testing operations.
