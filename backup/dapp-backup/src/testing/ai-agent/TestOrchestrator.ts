import { DetectedComponent } from './ComponentDetector';
import { TestScenario, TestStep, TestAssertion, AgentConfig } from './AgentInterface';

export interface ScenarioTemplate {
  name: string;
  description: string;
  componentTypes: string[];
  steps: (component: DetectedComponent) => TestStep[];
  assertions: (component: DetectedComponent) => TestAssertion[];
  priority: number;
}

/**
 * Orchestrates test scenario generation and execution planning
 */
export class TestOrchestrator {
  private scenarioTemplates: ScenarioTemplate[];

  constructor(_config: AgentConfig) {
    this.scenarioTemplates = this.initializeScenarioTemplates();
  }

  /**
   * Initialize built-in scenario templates
   */
  private initializeScenarioTemplates(): ScenarioTemplate[] {
    return [
      {
        name: 'Button Click Test',
        description: 'Test button click functionality and states',
        componentTypes: ['button'],
        priority: 8,
        steps: (component) => [
          {
            type: 'screenshot'
          },
          {
            type: 'click',
            selector: component.selector,
            timeout: 5000
          },
          {
            type: 'wait',
            timeout: 1000
          },
          {
            type: 'screenshot'
          }
        ],
        assertions: (component) => [
          {
            type: 'visible',
            selector: component.selector,
            expected: true,
            message: `Button ${component.id} should be visible`
          }
        ]
      },
      {
        name: 'Form Input Test',
        description: 'Test form input functionality and validation',
        componentTypes: ['input'],
        priority: 9,
        steps: (component) => {
          const testValue = this.generateTestValue(component);
          return [
            {
              type: 'screenshot'
            },
            {
              type: 'click',
              selector: component.selector
            },
            {
              type: 'type',
              selector: component.selector,
              text: testValue
            },
            {
              type: 'wait',
              timeout: 500
            },
            {
              type: 'screenshot'
            }
          ];
        },
        assertions: (component) => {
          const testValue = this.generateTestValue(component);
          return [
            {
              type: 'visible',
              selector: component.selector,
              expected: true,
              message: `Input ${component.id} should be visible`
            },
            {
              type: 'attribute',
              selector: component.selector,
              expected: { name: 'value', value: testValue },
              message: `Input ${component.id} should contain test value`
            }
          ];
        }
      },
      {
        name: 'Navigation Link Test',
        description: 'Test navigation links and routing',
        componentTypes: ['link'],
        priority: 7,
        steps: (component) => [
          {
            type: 'screenshot'
          },
          {
            type: 'click',
            selector: component.selector,
            timeout: 10000
          },
          {
            type: 'wait',
            timeout: 2000
          },
          {
            type: 'screenshot'
          }
        ],
        assertions: (component) => [
          {
            type: 'visible',
            selector: component.selector,
            expected: true,
            message: `Link ${component.id} should be visible`
          }
        ]
      },
      {
        name: 'Modal Dialog Test',
        description: 'Test modal open, close, and interaction',
        componentTypes: ['modal'],
        priority: 6,
        steps: (component) => [
          {
            type: 'screenshot'
          },
          {
            type: 'wait',
            selector: component.selector,
            timeout: 5000
          },
          {
            type: 'screenshot'
          },
          {
            type: 'custom',
            customAction: async (page) => {
              // Try to close modal with escape key
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
            }
          },
          {
            type: 'screenshot'
          }
        ],
        assertions: (component) => [
          {
            type: 'visible',
            selector: component.selector,
            expected: true,
            message: `Modal ${component.id} should be visible when open`
          }
        ]
      },
      {
        name: 'Form Submission Test',
        description: 'Test complete form submission flow',
        componentTypes: ['form'],
        priority: 10,
        steps: (component) => [
          {
            type: 'screenshot'
          },
          {
            type: 'custom',
            customAction: async (page) => {
              // Fill all form inputs
              const inputs = await page.locator(`${component.selector} input, ${component.selector} textarea, ${component.selector} select`).all();
              
              for (const input of inputs) {
                const type = await input.getAttribute('type') || 'text';
                const tagName = await input.evaluate((el: Element) => el.tagName.toLowerCase());
                
                if (tagName === 'input') {
                  switch (type) {
                    case 'text':
                    case 'email':
                      await input.fill('test@example.com');
                      break;
                    case 'password':
                      await input.fill('password123');
                      break;
                    case 'number':
                      await input.fill('123');
                      break;
                    case 'checkbox':
                      await input.check();
                      break;
                    case 'radio':
                      await input.check();
                      break;
                  }
                } else if (tagName === 'textarea') {
                  await input.fill('Test message content');
                } else if (tagName === 'select') {
                  const options = await input.locator('option').all();
                  if (options.length > 1) {
                    await input.selectOption({ index: 1 });
                  }
                }
              }
            }
          },
          {
            type: 'screenshot'
          },
          {
            type: 'custom',
            customAction: async (page) => {
              // Try to submit the form
              const submitButton = await page.locator(`${component.selector} input[type="submit"], ${component.selector} button[type="submit"], ${component.selector} button:has-text("submit")`).first();
              if (await submitButton.isVisible()) {
                await submitButton.click();
              }
            }
          },
          {
            type: 'wait',
            timeout: 3000
          },
          {
            type: 'screenshot'
          }
        ],
        assertions: (component) => [
          {
            type: 'visible',
            selector: component.selector,
            expected: true,
            message: `Form ${component.id} should be visible`
          }
        ]
      },
      {
        name: 'Dropdown Menu Test',
        description: 'Test dropdown menu interaction',
        componentTypes: ['dropdown'],
        priority: 5,
        steps: (component) => [
          {
            type: 'screenshot'
          },
          {
            type: 'click',
            selector: component.selector
          },
          {
            type: 'wait',
            timeout: 1000
          },
          {
            type: 'screenshot'
          },
          {
            type: 'custom',
            customAction: async (page) => {
              // Try to select first menu item
              const menuItems = await page.locator(`${component.selector} [role="menuitem"], ${component.selector} li, ${component.selector} option`).all();
              if (menuItems.length > 0) {
                await menuItems[0].click();
              }
            }
          },
          {
            type: 'wait',
            timeout: 1000
          },
          {
            type: 'screenshot'
          }
        ],
        assertions: (component) => [
          {
            type: 'visible',
            selector: component.selector,
            expected: true,
            message: `Dropdown ${component.id} should be visible`
          }
        ]
      }
    ];
  }

  /**
   * Generate test scenarios based on detected components
   */
  generateScenarios(components: DetectedComponent[]): TestScenario[] {
    const scenarios: TestScenario[] = [];

    // Generate scenarios for each component
    for (const component of components) {
      const applicableTemplates = this.scenarioTemplates.filter(template =>
        template.componentTypes.includes(component.type)
      );

      for (const template of applicableTemplates) {
        const scenario = this.createScenarioFromTemplate(component, template);
        scenarios.push(scenario);
      }
    }

    // Generate cross-component scenarios
    const crossComponentScenarios = this.generateCrossComponentScenarios(components);
    scenarios.push(...crossComponentScenarios);

    // Sort by priority
    return scenarios.sort((a, b) => {
      const aPriority = this.getScenarioPriority(a);
      const bPriority = this.getScenarioPriority(b);
      return bPriority - aPriority;
    });
  }

  /**
   * Create a scenario from a template and component
   */
  private createScenarioFromTemplate(component: DetectedComponent, template: ScenarioTemplate): TestScenario {
    const steps = template.steps(component);
    const assertions = template.assertions(component);

    return {
      id: `${template.name.toLowerCase().replace(/\s+/g, '_')}_${component.id}`,
      name: `${template.name} - ${component.id}`,
      description: `${template.description} for component ${component.id}`,
      steps,
      assertions
    };
  }

  /**
   * Generate cross-component test scenarios
   */
  private generateCrossComponentScenarios(components: DetectedComponent[]): TestScenario[] {
    const scenarios: TestScenario[] = [];

    // Form workflow scenarios
    const forms = components.filter(c => c.type === 'form');
    const inputs = components.filter(c => c.type === 'input');
    const buttons = components.filter(c => c.type === 'button');

    if (forms.length > 0 && inputs.length > 0 && buttons.length > 0) {
      scenarios.push(this.createFormWorkflowScenario(forms[0], inputs, buttons));
    }

    // Navigation workflow scenarios
    const navComponents = components.filter(c => c.type === 'navigation' || c.type === 'link');
    if (navComponents.length > 1) {
      scenarios.push(this.createNavigationWorkflowScenario(navComponents));
    }

    // Modal interaction scenarios
    const modals = components.filter(c => c.type === 'modal');
    const modalTriggers = components.filter(c => 
      c.type === 'button' && 
      (c.properties.textContent as string || '').toLowerCase().includes('modal')
    );

    if (modals.length > 0 && modalTriggers.length > 0) {
      scenarios.push(this.createModalInteractionScenario(modals[0], modalTriggers[0]));
    }

    return scenarios;
  }

  /**
   * Create a form workflow scenario
   */
  private createFormWorkflowScenario(
    form: DetectedComponent,
    inputs: DetectedComponent[],
    buttons: DetectedComponent[]
  ): TestScenario {
    const steps: TestStep[] = [
      { type: 'screenshot' }
    ];

    // Fill each input
    for (const input of inputs.slice(0, 3)) { // Limit to first 3 inputs
      const testValue = this.generateTestValue(input);
      steps.push(
        { type: 'click', selector: input.selector },
        { type: 'type', selector: input.selector, text: testValue },
        { type: 'wait', timeout: 500 }
      );
    }

    // Click submit button
    const submitButton = buttons.find(b => 
      (b.properties.textContent as string || '').toLowerCase().includes('submit')
    ) || buttons[0];

    if (submitButton) {
      steps.push(
        { type: 'click', selector: submitButton.selector },
        { type: 'wait', timeout: 2000 },
        { type: 'screenshot' }
      );
    }

    const assertions: TestAssertion[] = [
      {
        type: 'visible',
        selector: form.selector,
        expected: true,
        message: 'Form should be visible'
      }
    ];

    return {
      id: `form_workflow_${form.id}`,
      name: `Form Workflow - ${form.id}`,
      description: 'Complete form filling and submission workflow',
      steps,
      assertions
    };
  }

  /**
   * Create a navigation workflow scenario
   */
  private createNavigationWorkflowScenario(navComponents: DetectedComponent[]): TestScenario {
    const steps: TestStep[] = [
      { type: 'screenshot' }
    ];

    // Click through navigation items
    for (const navComponent of navComponents.slice(0, 3)) {
      steps.push(
        { type: 'click', selector: navComponent.selector },
        { type: 'wait', timeout: 2000 },
        { type: 'screenshot' }
      );
    }

    return {
      id: 'navigation_workflow',
      name: 'Navigation Workflow',
      description: 'Test navigation between different sections',
      steps,
      assertions: [
        {
          type: 'visible',
          selector: navComponents[0].selector,
          expected: true,
          message: 'Navigation should be visible'
        }
      ]
    };
  }

  /**
   * Create a modal interaction scenario
   */
  private createModalInteractionScenario(
    modal: DetectedComponent,
    trigger: DetectedComponent
  ): TestScenario {
    return {
      id: `modal_interaction_${modal.id}`,
      name: `Modal Interaction - ${modal.id}`,
      description: 'Test modal opening and closing',
      steps: [
        { type: 'screenshot' },
        { type: 'click', selector: trigger.selector },
        { type: 'wait', timeout: 1000 },
        { type: 'screenshot' },
        {
          type: 'custom',
          customAction: async (page) => {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        },
        { type: 'screenshot' }
      ],
      assertions: [
        {
          type: 'visible',
          selector: trigger.selector,
          expected: true,
          message: 'Modal trigger should be visible'
        }
      ]
    };
  }

  /**
   * Generate appropriate test value for an input component
   */
  private generateTestValue(component: DetectedComponent): string {
    const type = component.properties.type as string || 'text';
    const placeholder = component.properties.placeholder as string || '';

    switch (type) {
      case 'email':
        return 'test@example.com';
      case 'password':
        return 'TestPassword123!';
      case 'number':
        return '42';
      case 'tel':
        return '+1-555-123-4567';
      case 'url':
        return 'https://example.com';
      case 'date':
        return '2024-01-15';
      case 'time':
        return '14:30';
      case 'search':
        return 'test search query';
      default:
        if (placeholder) {
          return `Test ${placeholder.toLowerCase()}`;
        }
        return 'Test input value';
    }
  }

  /**
   * Calculate scenario priority
   */
  private getScenarioPriority(scenario: TestScenario): number {
    // Look for template priority in scenario name
    const template = this.scenarioTemplates.find(t => 
      scenario.name.includes(t.name)
    );
    
    if (template) {
      return template.priority;
    }

    // Default priority based on scenario type
    if (scenario.name.includes('Form')) return 9;
    if (scenario.name.includes('Button')) return 8;
    if (scenario.name.includes('Navigation')) return 6;
    if (scenario.name.includes('Modal')) return 5;
    
    return 3;
  }

  /**
   * Filter scenarios based on configuration
   */
  filterScenarios(scenarios: TestScenario[]): TestScenario[] {
    // Apply any filtering logic based on configuration
    // For now, just limit the number of scenarios to prevent overwhelming execution
    const maxScenarios = 20;
    return scenarios.slice(0, maxScenarios);
  }

  /**
   * Get execution plan for scenarios
   */
  getExecutionPlan(scenarios: TestScenario[]): {
    order: TestScenario[];
    estimatedDuration: number;
    parallelizable: boolean;
  } {
    const filtered = this.filterScenarios(scenarios);
    const estimatedDuration = filtered.length * 15000; // 15 seconds per scenario average

    return {
      order: filtered,
      estimatedDuration,
      parallelizable: false // Sequential execution for safety
    };
  }
}
