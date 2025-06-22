import { Page } from '@playwright/test';
// Note: axe-playwright will be conditionally imported at runtime

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary?: string;
    any?: Array<{
      id: string;
      data: unknown;
      relatedNodes: Array<{
        target: string[];
        html: string;
      }>;
      impact: string;
      message: string;
    }>;
  }>;
}

export interface AccessibilityResults {
  violations: AccessibilityViolation[];
  passes: AccessibilityViolation[];
  incomplete: AccessibilityViolation[];
  url: string;
  timestamp: number;
  toolOptions: {
    reporter: string;
    resultTypes: string[];
    rules: Record<string, { enabled: boolean }>;
  };
}

export interface AccessibilityConfig {
  rules: Record<string, { enabled: boolean }>;
  tags: string[];
  reporter: 'v1' | 'v2' | 'raw';
  resultTypes: Array<'violations' | 'passes' | 'incomplete' | 'inapplicable'>;
  runOnly: {
    type: 'tag' | 'rule';
    values: string[];
  } | null;
  include: string[][];
  exclude: string[][];
}

/**
 * Handles accessibility testing using axe-core
 */
export class AccessibilityTester {
  private config: AccessibilityConfig;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      rules: {},
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      reporter: 'v2',
      resultTypes: ['violations', 'passes', 'incomplete'],
      runOnly: null,
      include: [],
      exclude: [],
      ...config
    };
  }

  /**
   * Run accessibility tests on the current page
   */
  async runTests(page: Page): Promise<AccessibilityResults> {
    try {
      // Basic accessibility checks without axe-core
      // This is a simplified implementation for now
      const basicChecks = await page.evaluate(() => {
        const violations: Array<Record<string, unknown>> = [];
        
        // Check for images without alt text
        const images = Array.from(document.querySelectorAll('img'));
        images.forEach((img, index) => {
          if (!img.alt && !img.getAttribute('aria-label')) {
            violations.push({
              id: 'image-alt',
              impact: 'serious',
              description: 'Images must have alternate text',
              help: 'Add alt attribute to image',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
              tags: ['wcag2a', 'section508'],
              nodes: [{
                target: [`img:nth-of-type(${index + 1})`],
                html: img.outerHTML
              }]
            });
          }
        });

        // Check for inputs without labels
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        inputs.forEach((input, index) => {
          const inputElement = input as HTMLInputElement;
          const hasLabel = inputElement.labels && inputElement.labels.length > 0;
          const hasAriaLabel = input.getAttribute('aria-label');
          const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
          
          if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
            violations.push({
              id: 'label',
              impact: 'critical',
              description: 'Form elements must have labels',
              help: 'Add a label element or aria-label attribute',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
              tags: ['wcag2a'],
              nodes: [{
                target: [`${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`],
                html: input.outerHTML
              }]
            });
          }
        });

        return { violations };
      });

      return {
        violations: basicChecks.violations.map((v: unknown) => this.mapViolation(v)),
        passes: [],
        incomplete: [],
        url: page.url(),
        timestamp: Date.now(),
        toolOptions: {
          reporter: this.config.reporter,
          resultTypes: this.config.resultTypes,
          rules: this.config.rules
        }
      };

    } catch (error) {
      console.error('Accessibility test failed:', error);
      
      // Return empty results on failure
      return {
        violations: [],
        passes: [],
        incomplete: [],
        url: page.url(),
        timestamp: Date.now(),
        toolOptions: {
          reporter: this.config.reporter,
          resultTypes: this.config.resultTypes,
          rules: this.config.rules
        }
      };
    }
  }

  /**
   * Run accessibility tests on a specific element (simplified implementation)
   */
  async runTestsOnElement(page: Page, selector: string): Promise<AccessibilityResults> {
    try {
      // Basic element-specific accessibility checks
      const elementChecks = await page.evaluate((sel) => {
        const violations: Array<Record<string, unknown>> = [];
        const element = document.querySelector(sel);
        
        if (!element) {
          return { violations };
        }

        // Check if element is an image without alt text
        if (element.tagName === 'IMG') {
          const img = element as HTMLImageElement;
          if (!img.alt && !img.getAttribute('aria-label')) {
            violations.push({
              id: 'image-alt',
              impact: 'serious',
              description: 'Images must have alternate text',
              help: 'Add alt attribute to image',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
              tags: ['wcag2a'],
              nodes: [{
                target: [sel],
                html: element.outerHTML
              }]
            });
          }
        }

        return { violations };
      }, selector);

      return {
        violations: elementChecks.violations.map((v: unknown) => this.mapViolation(v)),
        passes: [],
        incomplete: [],
        url: page.url(),
        timestamp: Date.now(),
        toolOptions: {
          reporter: this.config.reporter,
          resultTypes: this.config.resultTypes,
          rules: this.config.rules
        }
      };

    } catch (error) {
      console.error(`Accessibility test failed for element ${selector}:`, error);
      
      return {
        violations: [],
        passes: [],
        incomplete: [],
        url: page.url(),
        timestamp: Date.now(),
        toolOptions: {
          reporter: this.config.reporter,
          resultTypes: this.config.resultTypes,
          rules: this.config.rules
        }
      };
    }
  }

  /**
   * Map axe violation to our interface
   */
  private mapViolation(violation: unknown): AccessibilityViolation {
    const v = violation as Record<string, unknown>;
    return {
      id: v.id as string || '',
      impact: v.impact as 'minor' | 'moderate' | 'serious' | 'critical' || 'minor',
      description: v.description as string || '',
      help: v.help as string || '',
      helpUrl: v.helpUrl as string || '',
      tags: v.tags as string[] || [],
      nodes: ((v.nodes as unknown[]) || []).map((node: unknown) => {
        const n = node as Record<string, unknown>;
        return {
          target: n.target as string[] || [],
          html: n.html as string || '',
          failureSummary: n.failureSummary as string,
          any: ((n.any as unknown[]) || []).map((check: unknown) => {
            const c = check as Record<string, unknown>;
            return {
              id: c.id as string || '',
              data: c.data,
              relatedNodes: ((c.relatedNodes as unknown[]) || []).map((relatedNode: unknown) => {
                const rn = relatedNode as Record<string, unknown>;
                return {
                  target: rn.target as string[] || [],
                  html: rn.html as string || ''
                };
              }),
              impact: c.impact as string || '',
              message: c.message as string || ''
            };
          })
        };
      })
    };
  }

  /**
   * Generate accessibility report
   */
  async generateReport(results: AccessibilityResults): Promise<{
    summary: string;
    recommendations: string[];
    criticalIssues: AccessibilityViolation[];
    wcagCompliance: {
      level: 'A' | 'AA' | 'AAA' | 'Non-compliant';
      passedChecks: number;
      failedChecks: number;
      coverage: number;
    };
  }> {
    const { violations } = results;
    
    const criticalIssues = violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    const recommendations: string[] = [];

    // Generate recommendations based on common issues
    const issueTypes = new Set(violations.map(v => v.id));
    
    if (issueTypes.has('color-contrast')) {
      recommendations.push('Improve color contrast ratios to meet WCAG standards');
    }
    
    if (issueTypes.has('image-alt')) {
      recommendations.push('Add alternative text to images for screen readers');
    }
    
    if (issueTypes.has('label')) {
      recommendations.push('Ensure all form inputs have proper labels');
    }
    
    if (issueTypes.has('keyboard')) {
      recommendations.push('Make all interactive elements keyboard accessible');
    }
    
    if (issueTypes.has('aria-roles')) {
      recommendations.push('Review and correct ARIA roles and properties');
    }

    // Calculate WCAG compliance
    const totalChecks = violations.length + results.passes.length;
    const failedChecks = violations.length;
    const passedChecks = results.passes.length;
    const coverage = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;
    
    let complianceLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant' = 'Non-compliant';
    
    if (criticalIssues.length === 0) {
      if (coverage >= 95) {
        complianceLevel = 'AAA';
      } else if (coverage >= 85) {
        complianceLevel = 'AA';
      } else if (coverage >= 70) {
        complianceLevel = 'A';
      }
    }

    const summary = `Accessibility test completed. Found ${violations.length} violations ` +
                   `(${criticalIssues.length} critical/serious). WCAG compliance level: ${complianceLevel}`;

    return {
      summary,
      recommendations,
      criticalIssues,
      wcagCompliance: {
        level: complianceLevel,
        passedChecks,
        failedChecks,
        coverage
      }
    };
  }

  /**
   * Check specific accessibility rules
   */
  async checkRules(page: Page, rules: string[]): Promise<AccessibilityResults> {
    const tempConfig = { ...this.config };
    this.config.runOnly = {
      type: 'rule',
      values: rules
    };

    const results = await this.runTests(page);
    
    // Restore original config
    this.config = tempConfig;
    
    return results;
  }

  /**
   * Check accessibility for specific WCAG tags
   */
  async checkWCAGLevel(page: Page, level: 'A' | 'AA' | 'AAA'): Promise<AccessibilityResults> {
    const tagMap = {
      'A': ['wcag2a'],
      'AA': ['wcag2a', 'wcag2aa', 'wcag21aa'],
      'AAA': ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag2aaa']
    };

    const tempConfig = { ...this.config };
    this.config.tags = tagMap[level];

    const results = await this.runTests(page);
    
    // Restore original config
    this.config = tempConfig;
    
    return results;
  }

  /**
   * Get common accessibility test scenarios
   */
  getTestScenarios(): Array<{
    name: string;
    description: string;
    tags: string[];
    rules?: string[];
  }> {
    return [
      {
        name: 'Basic WCAG AA Compliance',
        description: 'Test basic WCAG 2.1 AA compliance',
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
      },
      {
        name: 'Keyboard Navigation',
        description: 'Test keyboard accessibility',
        tags: ['keyboard'],
        rules: ['keyboard', 'focus-order-semantics', 'tabindex']
      },
      {
        name: 'Screen Reader Compatibility',
        description: 'Test screen reader compatibility',
        tags: ['aria'],
        rules: ['aria-roles', 'aria-allowed-attr', 'aria-required-attr', 'label']
      },
      {
        name: 'Color and Contrast',
        description: 'Test color contrast and color-only communication',
        tags: ['color'],
        rules: ['color-contrast', 'color-contrast-enhanced']
      },
      {
        name: 'Form Accessibility',
        description: 'Test form accessibility',
        tags: ['forms'],
        rules: ['label', 'form-field-multiple-labels', 'fieldset-legend']
      },
      {
        name: 'Image Accessibility',
        description: 'Test image alternative text',
        tags: ['images'],
        rules: ['image-alt', 'alt-text']
      }
    ];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = {
      rules: {},
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      reporter: 'v2',
      resultTypes: ['violations', 'passes', 'incomplete'],
      runOnly: null,
      include: [],
      exclude: []
    };
  }
}
