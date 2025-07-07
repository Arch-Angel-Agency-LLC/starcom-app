# Migration Automation Specification

## Overview

This document outlines automated tools and processes to accelerate the migration from legacy chat components to the unified chat system, reducing technical debt and ensuring consistency.

## Current Migration Challenges

1. **Manual Import Updates**: Developers must manually update imports across many files
2. **Inconsistent Migration**: Risk of missing references or partial migrations
3. **Feature Parity Verification**: No automated way to ensure unified components maintain all legacy features
4. **Duplicate Maintenance**: Both legacy and unified components need updates during transition

## Automation Strategy

### 1. Automated Import Migration Tool

#### 1.1 Import Mapping Configuration

```javascript
// scripts/migration/import-mappings.js
export const IMPORT_MAPPINGS = {
  // Component mappings
  'SecureChatWindow': {
    from: [
      '../components/SecureChat/SecureChatWindow',
      './SecureChatWindow',
      '@/components/SecureChat/SecureChatWindow'
    ],
    to: '../components/SecureChat/SecureChatWindow-unified',
    propsChanges: {
      'chatWindow': 'chatId', // Prop name changed
      // Add prop transformations as needed
    },
    additionalImports: [
      "import { useChat } from '../context/ChatContext';"
    ]
  },
  'SecureChatContactList': {
    from: [
      '../components/SecureChat/SecureChatContactList',
      './SecureChatContactList'
    ],
    to: '../components/SecureChat/SecureChatContactList-unified',
    propsChanges: {},
    additionalImports: []
  },
  'SecureChatManager': {
    from: [
      '../components/SecureChat/SecureChatManager',
      './SecureChatManager'
    ],
    to: '../components/SecureChat/SecureChatManager-unified',
    propsChanges: {},
    additionalImports: []
  },
  
  // Hook mappings
  'useSecureChat': {
    from: [
      '../../communication/context/useSecureChat',
      '../communication/context/useSecureChat'
    ],
    to: '../../context/ChatContext',
    hookName: 'useChat',
    transformations: [
      {
        from: 'const { state, openSecureChat } = useSecureChat()',
        to: 'const chat = useChat(); const { isConnected, joinChannel } = chat'
      }
    ]
  }
};

export const CONTEXT_MAPPINGS = {
  'SecureChatContext': {
    from: 'SecureChatContext',
    to: 'ChatContext',
    transformations: [
      {
        pattern: /state\.activeWindows/g,
        replacement: 'managedWindows' // Local state in component
      },
      {
        pattern: /state\.verifiedContacts/g,
        replacement: 'chat.channels'
      }
    ]
  }
};
```

#### 1.2 AST-Based Code Transformation

```javascript
// scripts/migration/ast-transformer.js
import { parse, traverse, generate } from '@babel/core';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';

export class CodeTransformer {
  constructor(mappings) {
    this.mappings = mappings;
  }

  async transformFile(filePath) {
    const source = await fs.promises.readFile(filePath, 'utf8');
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    let hasChanges = false;

    traverse(ast, {
      ImportDeclaration: (path) => {
        const importSource = path.node.source.value;
        const mapping = this.findMapping(importSource);
        
        if (mapping) {
          // Update import path
          path.node.source.value = mapping.to;
          hasChanges = true;

          // Transform import specifiers if needed
          if (mapping.hookName) {
            path.node.specifiers.forEach(spec => {
              if (t.isImportSpecifier(spec) && spec.imported.name === Object.keys(this.mappings)[0]) {
                spec.imported.name = mapping.hookName;
                spec.local.name = mapping.hookName;
              }
            });
          }

          // Add additional imports
          if (mapping.additionalImports) {
            const additionalImports = mapping.additionalImports.map(imp => 
              parse(imp, { sourceType: 'module' }).body[0]
            );
            path.insertAfter(additionalImports);
          }
        }
      },

      JSXElement: (path) => {
        const elementName = path.node.openingElement.name.name;
        const mapping = this.mappings[elementName];
        
        if (mapping && mapping.propsChanges) {
          // Transform props
          path.node.openingElement.attributes.forEach(attr => {
            if (t.isJSXAttribute(attr) && mapping.propsChanges[attr.name.name]) {
              attr.name.name = mapping.propsChanges[attr.name.name];
              hasChanges = true;
            }
          });
        }
      },

      VariableDeclarator: (path) => {
        // Transform hook usage patterns
        if (t.isCallExpression(path.node.init)) {
          const callee = path.node.init.callee;
          if (t.isIdentifier(callee)) {
            const mapping = this.mappings[callee.name];
            if (mapping && mapping.transformations) {
              // Apply custom transformations
              mapping.transformations.forEach(transform => {
                const sourceCode = generate(path.node).code;
                if (sourceCode.includes(transform.from)) {
                  // This is a simplified approach - in practice, use more sophisticated AST manipulation
                  hasChanges = true;
                }
              });
            }
          }
        }
      }
    });

    if (hasChanges) {
      const transformedCode = generate(ast, {
        retainLines: true,
        compact: false
      }).code;

      await fs.promises.writeFile(filePath, transformedCode);
      return { filePath, transformed: true };
    }

    return { filePath, transformed: false };
  }

  findMapping(importSource) {
    for (const [key, mapping] of Object.entries(this.mappings)) {
      if (mapping.from && mapping.from.includes(importSource)) {
        return mapping;
      }
    }
    return null;
  }
}
```

#### 1.3 Migration CLI Tool

```javascript
// scripts/migration/migrate-imports.js
import { glob } from 'glob';
import { CodeTransformer } from './ast-transformer.js';
import { IMPORT_MAPPINGS, CONTEXT_MAPPINGS } from './import-mappings.js';
import chalk from 'chalk';

class MigrationTool {
  constructor() {
    this.transformer = new CodeTransformer({
      ...IMPORT_MAPPINGS,
      ...CONTEXT_MAPPINGS
    });
    this.results = {
      processed: 0,
      transformed: 0,
      errors: 0,
      files: []
    };
  }

  async run(options = {}) {
    const {
      pattern = 'src/**/*.{ts,tsx,js,jsx}',
      dryRun = false,
      verbose = false
    } = options;

    console.log(chalk.blue('🔄 Starting chat component migration...'));
    console.log(chalk.gray(`Pattern: ${pattern}`));
    
    if (dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No files will be modified'));
    }

    const files = await glob(pattern, {
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*-unified.{ts,tsx}' // Skip already unified files
      ]
    });

    console.log(chalk.blue(`Found ${files.length} files to process`));

    for (const file of files) {
      try {
        this.results.processed++;
        
        if (verbose) {
          console.log(chalk.gray(`Processing: ${file}`));
        }

        if (!dryRun) {
          const result = await this.transformer.transformFile(file);
          
          if (result.transformed) {
            this.results.transformed++;
            this.results.files.push(file);
            console.log(chalk.green(`✅ Transformed: ${file}`));
          } else if (verbose) {
            console.log(chalk.gray(`⏭️  No changes: ${file}`));
          }
        } else {
          // In dry run, just check if file would be transformed
          const hasLegacyImports = await this.checkForLegacyImports(file);
          if (hasLegacyImports) {
            this.results.transformed++;
            this.results.files.push(file);
            console.log(chalk.yellow(`🔍 Would transform: ${file}`));
          }
        }
      } catch (error) {
        this.results.errors++;
        console.error(chalk.red(`❌ Error processing ${file}: ${error.message}`));
      }
    }

    this.printSummary(dryRun);
  }

  async checkForLegacyImports(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const legacyPatterns = [
      /from ['"'].*SecureChatWindow[^-]/,
      /from ['"'].*SecureChatContactList[^-]/,
      /from ['"'].*SecureChatManager[^-]/,
      /from ['"'].*useSecureChat/,
      /from ['"'].*SecureChatContext/
    ];

    return legacyPatterns.some(pattern => pattern.test(content));
  }

  printSummary(dryRun) {
    console.log(chalk.blue('\n📊 Migration Summary'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`Files processed: ${this.results.processed}`);
    console.log(`Files ${dryRun ? 'to be ' : ''}transformed: ${this.results.transformed}`);
    console.log(`Errors: ${this.results.errors}`);
    
    if (this.results.files.length > 0) {
      console.log('\n📝 Affected files:');
      this.results.files.forEach(file => {
        console.log(chalk.gray(`  - ${file}`));
      });
    }

    if (!dryRun && this.results.transformed > 0) {
      console.log(chalk.green('\n✅ Migration completed successfully!'));
      console.log(chalk.yellow('🔍 Please review the changes and run tests to ensure everything works correctly.'));
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1]
  };

  const migrationTool = new MigrationTool();
  migrationTool.run(options).catch(console.error);
}
```

### 2. Feature Parity Verification Tool

#### 2.1 Component API Analyzer

```javascript
// scripts/migration/feature-parity-checker.js
import { parse, traverse } from '@babel/core';
import fs from 'fs';
import path from 'path';

export class FeatureParityChecker {
  constructor() {
    this.legacyAPIs = new Map();
    this.unifiedAPIs = new Map();
  }

  async analyzeLegacyComponent(filePath) {
    const source = await fs.promises.readFile(filePath, 'utf8');
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    const api = {
      props: new Set(),
      methods: new Set(),
      hooks: new Set(),
      exports: new Set()
    };

    traverse(ast, {
      // Extract component props from interface/type definitions
      TSInterfaceDeclaration: (path) => {
        if (path.node.id.name.endsWith('Props')) {
          path.node.body.body.forEach(prop => {
            if (prop.type === 'TSPropertySignature') {
              api.props.add(prop.key.name);
            }
          });
        }
      },

      // Extract component methods
      ClassMethod: (path) => {
        if (path.node.kind === 'method') {
          api.methods.add(path.node.key.name);
        }
      },

      // Extract hook usage
      CallExpression: (path) => {
        if (path.node.callee.name && path.node.callee.name.startsWith('use')) {
          api.hooks.add(path.node.callee.name);
        }
      },

      // Extract exports
      ExportNamedDeclaration: (path) => {
        if (path.node.declaration) {
          if (path.node.declaration.id) {
            api.exports.add(path.node.declaration.id.name);
          }
        }
      }
    });

    const componentName = path.basename(filePath, path.extname(filePath));
    this.legacyAPIs.set(componentName, api);
    
    return api;
  }

  async analyzeUnifiedComponent(filePath) {
    // Similar analysis for unified components
    const api = await this.analyzeLegacyComponent(filePath);
    const componentName = path.basename(filePath, path.extname(filePath)).replace('-unified', '');
    this.unifiedAPIs.set(componentName, api);
    
    return api;
  }

  compareAPIs(componentName) {
    const legacy = this.legacyAPIs.get(componentName);
    const unified = this.unifiedAPIs.get(componentName);

    if (!legacy || !unified) {
      return { error: `Missing API data for ${componentName}` };
    }

    const comparison = {
      missingProps: [...legacy.props].filter(prop => !unified.props.has(prop)),
      extraProps: [...unified.props].filter(prop => !legacy.props.has(prop)),
      missingMethods: [...legacy.methods].filter(method => !unified.methods.has(method)),
      extraMethods: [...unified.methods].filter(method => !legacy.methods.has(method)),
      missingHooks: [...legacy.hooks].filter(hook => !unified.hooks.has(hook)),
      extraHooks: [...unified.hooks].filter(hook => !legacy.hooks.has(hook))
    };

    return comparison;
  }

  async generateParityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      components: {},
      summary: {
        totalComponents: 0,
        fullyCompatible: 0,
        partiallyCompatible: 0,
        incompatible: 0
      }
    };

    for (const [componentName] of this.legacyAPIs) {
      const comparison = this.compareAPIs(componentName);
      
      if (comparison.error) {
        report.components[componentName] = { error: comparison.error };
        continue;
      }

      const hasIssues = Object.values(comparison).some(arr => arr.length > 0);
      const criticalIssues = comparison.missingProps.length + comparison.missingMethods.length;

      let compatibility = 'full';
      if (criticalIssues > 0) {
        compatibility = 'incompatible';
      } else if (hasIssues) {
        compatibility = 'partial';
      }

      report.components[componentName] = {
        compatibility,
        ...comparison
      };

      report.summary.totalComponents++;
      switch (compatibility) {
        case 'full':
          report.summary.fullyCompatible++;
          break;
        case 'partial':
          report.summary.partiallyCompatible++;
          break;
        case 'incompatible':
          report.summary.incompatible++;
          break;
      }
    }

    return report;
  }
}
```

#### 2.2 Runtime Behavior Testing

```javascript
// scripts/migration/behavior-tests.js
import { render, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';

export class BehaviorTester {
  constructor() {
    this.testResults = new Map();
  }

  async testComponentBehavior(LegacyComponent, UnifiedComponent, testScenarios) {
    const results = {
      passed: 0,
      failed: 0,
      errors: []
    };

    for (const scenario of testScenarios) {
      try {
        const legacyResult = await this.runScenario(LegacyComponent, scenario);
        const unifiedResult = await this.runScenario(UnifiedComponent, scenario);

        if (this.compareResults(legacyResult, unifiedResult)) {
          results.passed++;
        } else {
          results.failed++;
          results.errors.push({
            scenario: scenario.name,
            legacy: legacyResult,
            unified: unifiedResult
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          scenario: scenario.name,
          error: error.message
        });
      }
    }

    return results;
  }

  async runScenario(Component, scenario) {
    const mockProps = this.createMockProps(scenario.props);
    const component = render(<Component {...mockProps} />);

    // Execute scenario actions
    for (const action of scenario.actions) {
      switch (action.type) {
        case 'click':
          fireEvent.click(component.getByTestId(action.target));
          break;
        case 'input':
          fireEvent.change(component.getByTestId(action.target), {
            target: { value: action.value }
          });
          break;
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, action.duration));
          break;
      }
    }

    // Capture results
    return {
      dom: component.container.innerHTML,
      calls: this.extractMockCalls(mockProps),
      state: this.extractComponentState(component)
    };
  }

  compareResults(legacy, unified) {
    // Compare key aspects of behavior
    return (
      this.compareDOMStructure(legacy.dom, unified.dom) &&
      this.compareFunctionCalls(legacy.calls, unified.calls) &&
      this.compareState(legacy.state, unified.state)
    );
  }

  // Helper methods for comparison logic...
}
```

### 3. Automated Regression Detection

#### 3.1 Visual Regression Testing

```javascript
// scripts/migration/visual-regression.js
import puppeteer from 'puppeteer';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';

export class VisualRegressionTester {
  constructor(options = {}) {
    this.browser = null;
    this.baselineDir = options.baselineDir || 'tests/visual-baselines';
    this.outputDir = options.outputDir || 'tests/visual-output';
    this.threshold = options.threshold || 0.2; // 20% difference threshold
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1200, height: 800 }
    });
  }

  async captureComponent(componentName, url, selector) {
    const page = await this.browser.newPage();
    
    try {
      await page.goto(url);
      await page.waitForSelector(selector);
      
      const element = await page.$(selector);
      const screenshot = await element.screenshot();
      
      const outputPath = `${this.outputDir}/${componentName}.png`;
      await fs.promises.writeFile(outputPath, screenshot);
      
      return outputPath;
    } finally {
      await page.close();
    }
  }

  async compareWithBaseline(componentName) {
    const baselinePath = `${this.baselineDir}/${componentName}.png`;
    const currentPath = `${this.outputDir}/${componentName}.png`;
    
    if (!fs.existsSync(baselinePath)) {
      // No baseline exists, create one
      await fs.promises.copyFile(currentPath, baselinePath);
      return { status: 'baseline_created', difference: 0 };
    }

    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const current = PNG.sync.read(fs.readFileSync(currentPath));
    
    const { width, height } = baseline;
    const diff = new PNG({ width, height });
    
    const pixelDiff = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      { threshold: this.threshold }
    );

    const totalPixels = width * height;
    const diffPercentage = (pixelDiff / totalPixels) * 100;

    if (diffPercentage > this.threshold) {
      // Save diff image
      const diffPath = `${this.outputDir}/${componentName}-diff.png`;
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      
      return {
        status: 'regression_detected',
        difference: diffPercentage,
        diffPath
      };
    }

    return {
      status: 'passed',
      difference: diffPercentage
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

### 4. Migration Dashboard

#### 4.1 Progress Tracking Web Interface

```javascript
// scripts/migration/dashboard/server.js
import express from 'express';
import { MigrationProgress } from './migration-progress.js';
import { FeatureParityChecker } from '../feature-parity-checker.js';

const app = express();
const migrationProgress = new MigrationProgress();
const parityChecker = new FeatureParityChecker();

app.use(express.static('public'));
app.use(express.json());

app.get('/api/migration-status', async (req, res) => {
  const status = await migrationProgress.getOverallStatus();
  res.json(status);
});

app.get('/api/parity-report', async (req, res) => {
  const report = await parityChecker.generateParityReport();
  res.json(report);
});

app.post('/api/run-migration', async (req, res) => {
  const { pattern, dryRun } = req.body;
  
  try {
    const migrationTool = new MigrationTool();
    const results = await migrationTool.run({ pattern, dryRun });
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Migration dashboard available at http://localhost:3001');
});
```

### 5. NPM Scripts Integration

```json
{
  "scripts": {
    "migrate:imports": "node scripts/migration/migrate-imports.js",
    "migrate:imports:dry": "node scripts/migration/migrate-imports.js --dry-run",
    "migrate:check-parity": "node scripts/migration/check-feature-parity.js",
    "migrate:visual-test": "node scripts/migration/visual-regression-test.js",
    "migrate:dashboard": "node scripts/migration/dashboard/server.js",
    "migrate:status": "node scripts/migration/migration-status.js",
    "migrate:validate": "npm run test && npm run migrate:check-parity && npm run migrate:visual-test"
  }
}
```

## Implementation Timeline

### Phase 1: Core Automation (Week 1)
- [ ] Implement AST-based code transformer
- [ ] Create import mapping configurations
- [ ] Build CLI migration tool
- [ ] Add dry-run capability

### Phase 2: Verification Tools (Week 2)
- [ ] Implement feature parity checker
- [ ] Add behavior testing framework
- [ ] Create visual regression testing
- [ ] Build automated validation pipeline

### Phase 3: Dashboard and Integration (Week 3)
- [ ] Create migration progress dashboard
- [ ] Integrate with CI/CD pipeline
- [ ] Add automated reporting
- [ ] Documentation and training

### Phase 4: Rollout and Cleanup (Week 4)
- [ ] Run automated migration on codebase
- [ ] Verify all transformations
- [ ] Remove legacy components
- [ ] Update documentation

## Success Metrics

- [ ] 95%+ of imports automatically migrated
- [ ] 100% feature parity verification
- [ ] Zero visual regressions detected
- [ ] <1 day for complete migration execution
- [ ] <2 hours for full verification suite
- [ ] Zero manual intervention required for standard migrations

This automation specification provides the tools needed to efficiently and safely migrate the entire codebase from legacy chat components to the unified system while maintaining quality and reducing technical debt.
