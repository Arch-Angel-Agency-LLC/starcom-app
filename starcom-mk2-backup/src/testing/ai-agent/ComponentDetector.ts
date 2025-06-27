import { Page, Locator } from '@playwright/test';

export interface DetectedComponent {
  id: string;
  type: string;
  selector: string;
  properties: Record<string, unknown>;
  children?: DetectedComponent[];
  interactions?: string[];
}

export interface ComponentType {
  name: string;
  selectors: string[];
  properties: string[];
  interactions: string[];
}

/**
 * Detects UI components on a page for automated testing
 */
export class ComponentDetector {
  private componentTypes: ComponentType[] = [
    {
      name: 'button',
      selectors: ['button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]'],
      properties: ['disabled', 'aria-label', 'title'],
      interactions: ['click', 'hover', 'focus']
    },
    {
      name: 'input',
      selectors: ['input', 'textarea', '[contenteditable]'],
      properties: ['type', 'placeholder', 'value', 'required', 'disabled'],
      interactions: ['type', 'focus', 'blur', 'clear']
    },
    {
      name: 'select',
      selectors: ['select', '[role="combobox"]', '[role="listbox"]'],
      properties: ['multiple', 'disabled', 'selected'],
      interactions: ['select', 'click']
    },
    {
      name: 'link',
      selectors: ['a[href]', '[role="link"]'],
      properties: ['href', 'target', 'aria-label'],
      interactions: ['click', 'hover']
    },
    {
      name: 'modal',
      selectors: ['[role="dialog"]', '.modal', '[aria-modal="true"]'],
      properties: ['aria-labelledby', 'aria-describedby'],
      interactions: ['close', 'escape']
    },
    {
      name: 'dropdown',
      selectors: ['[role="menu"]', '.dropdown', '[aria-expanded]'],
      properties: ['aria-expanded', 'aria-haspopup'],
      interactions: ['click', 'hover', 'arrow_keys']
    },
    {
      name: 'tab',
      selectors: ['[role="tab"]', '[role="tablist"]', '.tab'],
      properties: ['aria-selected', 'aria-controls'],
      interactions: ['click', 'arrow_keys']
    },
    {
      name: 'table',
      selectors: ['table', '[role="table"]', '[role="grid"]'],
      properties: ['aria-label', 'aria-describedby'],
      interactions: ['sort', 'filter', 'paginate']
    },
    {
      name: 'form',
      selectors: ['form', '[role="form"]'],
      properties: ['action', 'method', 'novalidate'],
      interactions: ['submit', 'reset', 'validate']
    },
    {
      name: 'navigation',
      selectors: ['nav', '[role="navigation"]', '.navbar', '.nav'],
      properties: ['aria-label'],
      interactions: ['navigate', 'expand', 'collapse']
    }
  ];

  /**
   * Detect all components on the current page
   */
  async detectComponents(page: Page): Promise<DetectedComponent[]> {
    const components: DetectedComponent[] = [];

    for (const componentType of this.componentTypes) {
      const typeComponents = await this.detectComponentType(page, componentType);
      components.push(...typeComponents);
    }

    // Sort by DOM order (top to bottom, left to right)
    return this.sortComponentsByDOMOrder(page, components);
  }

  /**
   * Detect components of a specific type
   */
  private async detectComponentType(page: Page, componentType: ComponentType): Promise<DetectedComponent[]> {
    const components: DetectedComponent[] = [];

    for (const selector of componentType.selectors) {
      try {
        const elements = await page.locator(selector).all();
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const isVisible = await element.isVisible();
          
          if (isVisible) {
            const component = await this.createComponentFromElement(
              page,
              element,
              componentType,
              `${selector}:nth-child(${i + 1})`
            );
            
            if (component) {
              components.push(component);
            }
          }
        }
      } catch (error) {
        // Selector might not be valid or elements not found
        console.debug(`Error detecting components with selector ${selector}:`, error);
      }
    }

    return components;
  }

  /**
   * Create a component object from a page element
   */
  private async createComponentFromElement(
    _page: Page,
    element: Locator,
    componentType: ComponentType,
    selector: string
  ): Promise<DetectedComponent | null> {
    try {
      const properties: Record<string, unknown> = {};
      
      // Extract standard properties
      for (const prop of componentType.properties) {
        try {
          const value = await element.getAttribute(prop);
          if (value !== null) {
            properties[prop] = value;
          }
        } catch {
          // Property might not exist
        }
      }

      // Get additional useful properties
      const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
      const textContent = await element.textContent();
      const boundingBox = await element.boundingBox();

      properties.tagName = tagName;
      properties.textContent = textContent?.trim() || '';
      properties.boundingBox = boundingBox;

      // Generate unique ID
      const id = await this.generateComponentId(element, componentType.name);

      return {
        id,
        type: componentType.name,
        selector,
        properties,
        interactions: componentType.interactions
      };
    } catch (error) {
      console.debug('Error creating component from element:', error);
      return null;
    }
  }

  /**
   * Generate a unique ID for a component
   */
  private async generateComponentId(element: Locator, type: string): Promise<string> {
    try {
      // Try to use existing ID
      const existingId = await element.getAttribute('id');
      if (existingId) {
        return `${type}_${existingId}`;
      }

      // Try to use data-testid
      const testId = await element.getAttribute('data-testid');
      if (testId) {
        return `${type}_${testId}`;
      }

      // Try to use class names
      const className = await element.getAttribute('class');
      if (className) {
        const cleanClass = className.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
        if (cleanClass) {
          return `${type}_${cleanClass}_${Date.now()}`;
        }
      }

      // Fall back to type + timestamp
      return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch {
      return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Sort components by their DOM order
   */
  private async sortComponentsByDOMOrder(page: Page, components: DetectedComponent[]): Promise<DetectedComponent[]> {
    try {
      // Get DOM order by evaluating all selectors at once
      const sortedSelectors = await page.evaluate((selectors) => {
        const elements = selectors.map(selector => {
          try {
            return document.querySelector(selector);
          } catch {
            return null;
          }
        }).filter(Boolean);

        // Sort by DOM order
        elements.sort((a, b) => {
          if (!a || !b) return 0;
          const position = a.compareDocumentPosition(b);
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
          if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
          return 0;
        });

        return elements.map(el => {
          // Try to reconstruct the selector
          if (el?.id) return `#${el.id}`;
          if (el?.className) return `.${el.className.split(' ')[0]}`;
          return el?.tagName?.toLowerCase() || '';
        });
      }, components.map(c => c.selector));

      // Sort components based on DOM order
      return components.sort((a, b) => {
        const aIndex = sortedSelectors.indexOf(a.selector);
        const bIndex = sortedSelectors.indexOf(b.selector);
        return aIndex - bIndex;
      });
    } catch (error) {
      console.debug('Error sorting components by DOM order:', error);
      return components;
    }
  }

  /**
   * Detect interactive elements that can be tested
   */
  async detectInteractiveElements(page: Page): Promise<DetectedComponent[]> {
    const interactiveSelectors = [
      'button',
      'input',
      'textarea',
      'select',
      'a[href]',
      '[onclick]',
      '[role="button"]',
      '[role="link"]',
      '[role="tab"]',
      '[role="menuitem"]',
      '[tabindex]'
    ];

    const components: DetectedComponent[] = [];

    for (const selector of interactiveSelectors) {
      try {
        const elements = await page.locator(selector).all();
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          
          if (isVisible && isEnabled) {
            const component = await this.createInteractiveComponent(element, selector, i);
            if (component) {
              components.push(component);
            }
          }
        }
      } catch (error) {
        console.debug(`Error detecting interactive elements with selector ${selector}:`, error);
      }
    }

    return components;
  }

  /**
   * Create an interactive component
   */
  private async createInteractiveComponent(
    element: Locator,
    selector: string,
    index: number
  ): Promise<DetectedComponent | null> {
    try {
      const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
      const type = await element.getAttribute('type') || tagName;
      const textContent = await element.textContent();
      const ariaLabel = await element.getAttribute('aria-label');
      const title = await element.getAttribute('title');
      
      const properties = {
        tagName,
        type,
        textContent: textContent?.trim() || '',
        ariaLabel,
        title,
        boundingBox: await element.boundingBox()
      };

      return {
        id: `interactive_${type}_${index}_${Date.now()}`,
        type: 'interactive',
        selector: `${selector}:nth-child(${index + 1})`,
        properties,
        interactions: ['click', 'hover', 'focus']
      };
    } catch (error) {
      console.debug('Error creating interactive component:', error);
      return null;
    }
  }

  /**
   * Get component suggestions for testing
   */
  getTestingSuggestions(components: DetectedComponent[]): Array<{
    component: DetectedComponent;
    suggestedTests: string[];
    priority: number;
  }> {
    return components.map(component => {
      const suggestions = this.generateTestSuggestions(component);
      const priority = this.calculateTestPriority(component);
      
      return {
        component,
        suggestedTests: suggestions,
        priority
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate test suggestions for a component
   */
  private generateTestSuggestions(component: DetectedComponent): string[] {
    const suggestions: string[] = [];
    
    switch (component.type) {
      case 'button':
        suggestions.push('Test click functionality');
        suggestions.push('Test disabled state');
        suggestions.push('Test keyboard navigation');
        break;
        
      case 'input':
        suggestions.push('Test text input');
        suggestions.push('Test validation');
        suggestions.push('Test placeholder text');
        suggestions.push('Test focus/blur events');
        break;
        
      case 'form':
        suggestions.push('Test form submission');
        suggestions.push('Test form validation');
        suggestions.push('Test required fields');
        break;
        
      case 'modal':
        suggestions.push('Test modal open/close');
        suggestions.push('Test escape key');
        suggestions.push('Test focus trap');
        break;
        
      default:
        suggestions.push('Test visibility');
        suggestions.push('Test interactions');
    }
    
    return suggestions;
  }

  /**
   * Calculate test priority for a component
   */
  private calculateTestPriority(component: DetectedComponent): number {
    let priority = 0;
    
    // Higher priority for interactive elements
    if (component.interactions && component.interactions.length > 0) {
      priority += 3;
    }
    
    // Higher priority for critical component types
    const criticalTypes = ['button', 'form', 'input', 'link'];
    if (criticalTypes.includes(component.type)) {
      priority += 2;
    }
    
    // Higher priority for elements with accessibility attributes
    if (component.properties['aria-label'] || component.properties['title']) {
      priority += 1;
    }
    
    // Higher priority for elements that are likely to be important
    const textContent = component.properties.textContent as string || '';
    const importantKeywords = ['submit', 'save', 'delete', 'confirm', 'cancel', 'login', 'register'];
    if (importantKeywords.some(keyword => textContent.toLowerCase().includes(keyword))) {
      priority += 2;
    }
    
    return priority;
  }
}
