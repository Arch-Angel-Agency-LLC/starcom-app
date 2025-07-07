import { Page, Locator } from '@playwright/test';

export interface ReactComponent {
  id: string;
  type: string;
  selector: string;
  properties: Record<string, unknown>;
  reactProps?: Record<string, unknown>;
  children?: ReactComponent[];
  interactions?: string[];
  isVisible: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface ModernComponentPattern {
  name: string;
  selectors: string[];
  dataAttributes: string[];
  classPatterns: RegExp[];
  ariaRoles: string[];
  properties: string[];
  interactions: string[];
}

/**
 * Enhanced component detector for modern React applications
 */
export class EnhancedComponentDetector {
  private modernPatterns: ModernComponentPattern[] = [
    {
      name: 'modern-button',
      selectors: [
        'button',
        '[role="button"]',
        '[data-testid*="button"]',
        '[data-cy*="button"]',
        '[class*="button"]',
        '[class*="btn"]',
        'a[class*="button"]',
        'div[class*="button"][tabindex]'
      ],
      dataAttributes: ['data-testid', 'data-cy', 'data-action'],
      classPatterns: [/btn/, /button/, /cta/, /action/],
      ariaRoles: ['button'],
      properties: ['disabled', 'aria-label', 'title', 'type'],
      interactions: ['click', 'hover', 'focus', 'keydown']
    },
    {
      name: 'modern-input',
      selectors: [
        'input',
        'textarea',
        '[contenteditable]',
        '[role="textbox"]',
        '[data-testid*="input"]',
        '[data-testid*="field"]',
        '[class*="input"]',
        '[class*="field"]'
      ],
      dataAttributes: ['data-testid', 'data-cy', 'data-field'],
      classPatterns: [/input/, /field/, /form-control/, /textbox/],
      ariaRoles: ['textbox', 'searchbox'],
      properties: ['type', 'placeholder', 'value', 'required', 'disabled', 'aria-label'],
      interactions: ['type', 'focus', 'blur', 'clear', 'select']
    },
    {
      name: 'modern-link',
      selectors: [
        'a[href]',
        '[role="link"]',
        '[data-testid*="link"]',
        '[class*="link"]',
        'a[class*="nav"]'
      ],
      dataAttributes: ['data-testid', 'data-cy', 'data-href'],
      classPatterns: [/link/, /nav/, /menu-item/],
      ariaRoles: ['link'],
      properties: ['href', 'target', 'aria-label', 'title'],
      interactions: ['click', 'hover', 'focus']
    },
    {
      name: 'modern-navigation',
      selectors: [
        'nav',
        '[role="navigation"]',
        '[data-testid*="nav"]',
        '[class*="nav"]',
        '[class*="menu"]',
        '[class*="header"]',
        '[class*="sidebar"]'
      ],
      dataAttributes: ['data-testid', 'data-cy', 'data-nav'],
      classPatterns: [/nav/, /menu/, /header/, /sidebar/, /navigation/],
      ariaRoles: ['navigation', 'menubar'],
      properties: ['aria-label', 'role'],
      interactions: ['navigate', 'expand', 'collapse']
    },
    {
      name: 'modern-modal',
      selectors: [
        '[role="dialog"]',
        '[aria-modal="true"]',
        '[data-testid*="modal"]',
        '[data-testid*="dialog"]',
        '[class*="modal"]',
        '[class*="dialog"]',
        '[class*="popup"]'
      ],
      dataAttributes: ['data-testid', 'data-cy', 'data-modal'],
      classPatterns: [/modal/, /dialog/, /popup/, /overlay/],
      ariaRoles: ['dialog', 'alertdialog'],
      properties: ['aria-labelledby', 'aria-describedby', 'aria-modal'],
      interactions: ['close', 'escape', 'click-outside']
    },
    {
      name: 'modern-dropdown',
      selectors: [
        'select',
        '[role="combobox"]',
        '[role="listbox"]',
        '[data-testid*="select"]',
        '[data-testid*="dropdown"]',
        '[class*="select"]',
        '[class*="dropdown"]',
        '[aria-haspopup]'
      ],
      dataAttributes: ['data-testid', 'data-cy', 'data-select'],
      classPatterns: [/select/, /dropdown/, /combobox/, /picker/],
      ariaRoles: ['combobox', 'listbox', 'menu'],
      properties: ['aria-expanded', 'aria-haspopup', 'disabled', 'multiple'],
      interactions: ['select', 'click', 'keyboard-navigation']
    },
    {
      name: 'modern-card',
      selectors: [
        '[data-testid*="card"]',
        '[class*="card"]',
        '[class*="item"]',
        '[class*="tile"]',
        'article',
        '[role="article"]'
      ],
      dataAttributes: ['data-testid', 'data-cy', 'data-card'],
      classPatterns: [/card/, /item/, /tile/, /panel/, /widget/],
      ariaRoles: ['article', 'region'],
      properties: ['aria-label', 'role'],
      interactions: ['click', 'hover', 'select']
    }
  ];

  /**
   * Wait for React application to fully load - Optimized version
   */
  async waitForReactApp(page: Page, timeout = 10000): Promise<boolean> {
    try {
      // Check if page is still active
      if (!page || page.isClosed()) {
        console.warn('Page is closed, cannot wait for React app');
        return false;
      }

      // Wait for basic DOM to be ready first
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      
      // Check for common React app patterns with more flexible approach
      await page.waitForFunction(
        () => {
          // Check for root element or any React content
          const root = document.getElementById('root') || 
                       document.getElementById('app') ||
                       document.querySelector('[data-reactroot]') ||
                       document.querySelector('div[id*="root"]') ||
                       document.querySelector('div[class*="app"]') ||
                       document.querySelector('main') ||
                       document.querySelector('#__next');
          
          if (root && root.children.length > 0) return true;
          
          // Check if we have any significant DOM content (not just empty page)
          const bodyChildren = document.body?.children.length || 0;
          if (bodyChildren > 3) return true; // More than just script tags and basic structure
          
          // Check for any interactive elements or meaningful content
          const meaningfulElements = document.querySelectorAll('button, input, a, nav, main, section, [role="button"], [role="navigation"], canvas, svg, .btn, .button, [data-testid]');
          if (meaningfulElements.length > 0) return true;

          // Check for React-specific indicators
          const hasReact = window.React || 
                          document.querySelector('[data-react]') ||
                          document.querySelector('[data-reactid]') ||
                          document.querySelector('script[src*="react"]');
          
          return Boolean(hasReact);
        },
        { timeout: Math.min(timeout, 6000) } // Reduce timeout to 6 seconds max
      );

      // Wait a bit for any dynamic content (reduced from 500ms)
      await page.waitForTimeout(300);

      return true;
    } catch (error) {
      console.warn('React app may not have fully loaded within timeout, continuing anyway:', error);
      // Don't throw error, just return false and continue with detection
      return false;
    }
  }

  /**
   * Detect all modern components on the page
   */
  async detectModernComponents(page: Page): Promise<ReactComponent[]> {
    try {
      // Check if page is still active
      if (!page || page.isClosed()) {
        console.warn('Page is closed, returning empty modern components list');
        return [];
      }

      // First ensure React has loaded (but don't fail if it hasn't)
      await this.waitForReactApp(page);

      const components: ReactComponent[] = [];

      for (const pattern of this.modernPatterns) {
        try {
          const patternComponents = await this.detectComponentPattern(page, pattern);
          components.push(...patternComponents);
        } catch (error) {
          console.debug(`Error detecting pattern ${pattern.name}:`, error);
          // Continue with other patterns
        }
      }

      // Remove duplicates based on selector and position
      const uniqueComponents = this.deduplicateComponents(components);

      // Sort by DOM order and visibility
      return this.sortComponentsByImportance(page, uniqueComponents);
    } catch (error) {
      console.error('Error detecting modern components:', error);
      return [];
    }
  }

  /**
   * Detect components matching a specific pattern - Optimized version
   */
  private async detectComponentPattern(page: Page, pattern: ModernComponentPattern): Promise<ReactComponent[]> {
    const components: ReactComponent[] = [];

    for (const selector of pattern.selectors) {
      try {
        // Get all elements and their data in a single batch operation
        const elementsData = await page.$$eval(selector, (elements, patternData) => {
          return elements.map((el, index) => {
            // Check visibility and dimensions
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                              window.getComputedStyle(el).visibility !== 'hidden' &&
                              window.getComputedStyle(el).display !== 'none';
            
            if (!isVisible) {
              return null;
            }

            // Extract all properties in one pass
            const properties: Record<string, unknown> = {};
            const reactProps: Record<string, unknown> = {};

            // Get standard properties
            for (const prop of patternData.properties) {
              const value = el.getAttribute(prop);
              if (value !== null) {
                properties[prop] = value;
              }
            }

            // Get data attributes
            for (const dataAttr of patternData.dataAttributes) {
              const value = el.getAttribute(dataAttr);
              if (value !== null) {
                properties[dataAttr] = value;
              }
            }

            // Get element details
            const textContent = el.textContent?.trim() || '';
            const tagName = el.tagName.toLowerCase();
            const className = el.className || '';
            const id = el.id || '';

            if (textContent) properties.textContent = textContent;
            properties.tagName = tagName;
            properties.className = className;
            if (id) properties.id = id;

            // Check React component data (if available)
            const reactFiber = (el as unknown as Record<string, unknown>)._reactInternalFiber || (el as unknown as Record<string, unknown>).__reactInternalInstance;
            if (reactFiber) {
              try {
                const fiberData = reactFiber as Record<string, unknown>;
                const typeData = fiberData.type as Record<string, unknown> | undefined;
                const elementTypeData = fiberData.elementType as Record<string, unknown> | undefined;
                reactProps.componentName = typeData?.name || elementTypeData?.name || 'Unknown';
                reactProps.detected = true;
              } catch {
                // React data not accessible
              }
            }

            // Determine if element is interactive
            const style = window.getComputedStyle(el);
            const isClickable = style.cursor === 'pointer' || 
                               tagName === 'button' || 
                               tagName === 'a' ||
                               el.hasAttribute('onclick') ||
                               el.getAttribute('role') === 'button';

            return {
              index,
              isVisible: true,
              boundingBox: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              },
              properties,
              reactProps,
              textContent,
              tagName,
              isClickable
            };
          }).filter(Boolean);
        }, {
          properties: pattern.properties,
          dataAttributes: pattern.dataAttributes
        });

        // Convert to ReactComponent objects
        for (const data of elementsData) {
          if (data) {
            const componentId = data.properties.id as string || 
                              data.properties['data-testid'] as string ||
                              `${pattern.name}-${selector.replace(/[^a-zA-Z0-9]/g, '')}-${data.index}`;

            // Determine interactions based on pattern and element properties
            const interactions = [...pattern.interactions];
            if (data.isClickable && !interactions.includes('click')) {
              interactions.push('click');
            }

            const component: ReactComponent = {
              id: componentId,
              type: pattern.name,
              selector: `${selector}:nth-of-type(${data.index + 1})`,
              properties: data.properties,
              reactProps: data.reactProps,
              interactions,
              isVisible: data.isVisible,
              boundingBox: data.boundingBox
            };

            components.push(component);
          }
        }
      } catch (error) {
        console.debug(`Error detecting components with selector ${selector}:`, error);
      }
    }

    return components;
  }

  /**
   * Create a modern component object from an element
   * @deprecated - Using batch optimization instead
   */
  // @ts-expect-error - Keeping for potential future use
  private async createModernComponent(
    _page: Page,
    element: Locator,
    pattern: ModernComponentPattern,
    selector: string,
    index: number
  ): Promise<ReactComponent | null> {
    try {
      // Check if element is visible and has dimensions
      const isVisible = await element.isVisible();
      if (!isVisible) {
        return null;
      }

      const boundingBox = await element.boundingBox();
      if (!boundingBox || (boundingBox.width === 0 && boundingBox.height === 0)) {
        return null;
      }

      // Extract properties
      const properties: Record<string, unknown> = {};
      const reactProps: Record<string, unknown> = {};

      // Get standard properties
      for (const prop of pattern.properties) {
        try {
          const value = await element.getAttribute(prop);
          if (value !== null) {
            properties[prop] = value;
          }
        } catch {
          // Property doesn't exist
        }
      }

      // Get data attributes
      for (const dataAttr of pattern.dataAttributes) {
        try {
          const value = await element.getAttribute(dataAttr);
          if (value !== null) {
            properties[dataAttr] = value;
          }
        } catch {
          // Attribute doesn't exist
        }
      }

      // Get text content
      const textContent = await element.textContent();
      if (textContent && textContent.trim()) {
        properties.textContent = textContent.trim();
      }

      // Extract React props if possible
      try {
        const reactInfo = await element.evaluate((el) => {
          // Try to get React props (this works in development mode)
          const keys = Object.keys(el).find(key => key.startsWith('__reactProps') || key.startsWith('__reactInternalInstance'));
          if (keys) {
            return { hasReactProps: true };
          }
          return { hasReactProps: false };
        });
        
        if (reactInfo.hasReactProps) {
          reactProps.detected = true;
        }
      } catch {
        // React props not accessible
      }

      // Generate unique ID
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const id = `${pattern.name}-${tagName}-${index}`;

      // Determine interactions based on element type
      const interactions = await this.determineInteractions(element, pattern);

      return {
        id,
        type: pattern.name,
        selector: `${selector}:nth-of-type(${index + 1})`,
        properties,
        reactProps,
        interactions,
        isVisible,
        boundingBox
      };

    } catch (error) {
      console.debug(`Error creating component from element:`, error);
      return null;
    }
  }

  /**
   * Determine possible interactions for an element
   */
  private async determineInteractions(element: Locator, pattern: ModernComponentPattern): Promise<string[]> {
    const interactions: string[] = [];

    try {
      // Check if clickable
      const isClickable = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.cursor === 'pointer' || 
               el.tagName === 'BUTTON' || 
               el.tagName === 'A' ||
               el.hasAttribute('onclick') ||
               el.getAttribute('role') === 'button';
      });

      if (isClickable) {
        interactions.push('click');
      }

      // Check if focusable
      const isFocusable = await element.evaluate((el) => {
        return el.tabIndex >= 0 || 
               ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName);
      });

      if (isFocusable) {
        interactions.push('focus', 'blur');
      }

      // Add pattern-specific interactions
      interactions.push(...pattern.interactions);

    } catch {
      // Default to pattern interactions
      interactions.push(...pattern.interactions);
    }

    // Remove duplicates
    return [...new Set(interactions)];
  }

  /**
   * Remove duplicate components
   */
  private deduplicateComponents(components: ReactComponent[]): ReactComponent[] {
    const seen = new Set<string>();
    return components.filter(component => {
      const key = `${component.selector}-${component.boundingBox?.x}-${component.boundingBox?.y}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort components by importance (visibility, size, interaction potential)
   */
  private async sortComponentsByImportance(_page: Page, components: ReactComponent[]): Promise<ReactComponent[]> {
    return components.sort((a, b) => {
      // Primary: visibility
      if (a.isVisible !== b.isVisible) {
        return a.isVisible ? -1 : 1;
      }

      // Secondary: size (larger components first)
      const aSize = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
      const bSize = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
      if (aSize !== bSize) {
        return bSize - aSize;
      }

      // Tertiary: interaction count
      const aInteractions = a.interactions?.length || 0;
      const bInteractions = b.interactions?.length || 0;
      if (aInteractions !== bInteractions) {
        return bInteractions - aInteractions;
      }

      // Quaternary: Y position (top first)
      const aY = a.boundingBox?.y || 0;
      const bY = b.boundingBox?.y || 0;
      return aY - bY;
    });
  }

  /**
   * Get interactive elements specifically
   */
  async detectInteractiveElements(page: Page): Promise<ReactComponent[]> {
    const allComponents = await this.detectModernComponents(page);
    
    return allComponents.filter(component => 
      component.interactions && 
      component.interactions.length > 0 &&
      component.isVisible &&
      component.boundingBox &&
      component.boundingBox.width > 0 &&
      component.boundingBox.height > 0
    );
  }

  /**
   * Get components by type
   */
  async detectComponentsByType(page: Page, type: string): Promise<ReactComponent[]> {
    const allComponents = await this.detectModernComponents(page);
    return allComponents.filter(component => component.type === type);
  }

  /**
   * Validate if page has loaded properly
   */
  async validatePageLoad(page: Page): Promise<{
    isLoaded: boolean;
    elementCount: number;
    hasInteractiveElements: boolean;
    loadTime: number;
  }> {
    const startTime = Date.now();
    
    await this.waitForReactApp(page);
    
    const elementCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    const components = await this.detectInteractiveElements(page);
    
    return {
      isLoaded: elementCount > 20, // Arbitrary threshold for "loaded"
      elementCount,
      hasInteractiveElements: components.length > 0,
      loadTime: Date.now() - startTime
    };
  }
}
