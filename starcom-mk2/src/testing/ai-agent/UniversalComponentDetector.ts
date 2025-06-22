import { Page } from '@playwright/test';

export interface UniversalComponent {
  id: string;
  type: string;
  selector: string;
  properties: Record<string, unknown>;
  isVisible: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  interactions?: string[];
  textContent?: string;
  tagName?: string;
}

interface ElementData {
  index: number;
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  href: string;
  src: string;
  alt: string;
  title: string;
  type: string;
  role: string;
  ariaLabel: string;
  dataTestId: string;
  placeholder: string;
  disabled: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  isVisible: boolean;
  isClickable: boolean;
  isInput: boolean;
  hasChildren: boolean;
  parentTagName: string;
}

/**
 * Universal component detector that works with any web application
 * Does not require React or specific frameworks to be loaded
 */
export class UniversalComponentDetector {
  
  /**
   * Detect all interactive and structural components on any page
   */
  async detectAllComponents(page: Page, waitTime = 2000): Promise<UniversalComponent[]> {
    try {
      // Check if page is still active before proceeding
      if (!page || page.isClosed()) {
        console.warn('Page is closed or invalid, cannot detect components');
        return [];
      }

      // Wait for basic page load and any dynamic content
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      await page.waitForTimeout(Math.min(waitTime, 3000)); // Cap wait time
    } catch (error) {
      console.warn('Error waiting for page load state:', error);
      // Continue with detection even if wait fails
    }

    const components: UniversalComponent[] = [];

    try {
      // Check if page is still active
      if (!page || page.isClosed()) {
        console.warn('Page is closed, returning empty components list');
        return [];
      }

      // Get all elements and their properties
      const elementData = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        return Array.from(elements).map((el, index) => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           getComputedStyle(el).visibility !== 'hidden' &&
                           getComputedStyle(el).display !== 'none';

          return {
            index,
            tagName: el.tagName.toLowerCase(),
            id: el.id || '',
            className: el.className || '',
            textContent: el.textContent?.trim().substring(0, 100) || '',
            href: el.getAttribute('href') || '',
            src: el.getAttribute('src') || '',
            alt: el.getAttribute('alt') || '',
            title: el.getAttribute('title') || '',
            type: el.getAttribute('type') || '',
            role: el.getAttribute('role') || '',
            ariaLabel: el.getAttribute('aria-label') || '',
            dataTestId: el.getAttribute('data-testid') || '',
            placeholder: el.getAttribute('placeholder') || '',
            disabled: el.hasAttribute('disabled'),
            boundingBox: isVisible ? {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            } : null,
            isVisible,
            isClickable: el.tagName === 'BUTTON' || 
                        el.tagName === 'A' || 
                        el.getAttribute('role') === 'button' ||
                        el.getAttribute('onclick') !== null ||
                        getComputedStyle(el).cursor === 'pointer',
            isInput: ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
                    el.getAttribute('contenteditable') === 'true',
            hasChildren: el.children.length > 0,
            parentTagName: el.parentElement?.tagName.toLowerCase() || ''
          };
        }).filter(el => 
          // Filter out script, style, head elements and very small elements
          !['script', 'style', 'head', 'meta', 'link', 'title'].includes(el.tagName) &&
          (el.isVisible || el.tagName === 'html' || el.tagName === 'body')
        );
      });

      console.log(`Found ${elementData.length} potential elements`);

      // Process each element and create components
      for (const data of elementData) {
        const component = this.createComponentFromData(data);
        if (component) {
          components.push(component);
        }
      }

    } catch (error) {
      console.error('Error during component detection:', error);
      // Return empty array if detection fails
      return [];
    }

    // Sort by importance (interactive elements first, then by size)
    return components.sort((a, b) => {
      // Interactive elements first
      if (a.interactions?.length !== b.interactions?.length) {
        return (b.interactions?.length || 0) - (a.interactions?.length || 0);
      }
      
      // Then by visibility
      if (a.isVisible !== b.isVisible) {
        return a.isVisible ? -1 : 1;
      }
      
      // Then by size
      const aSize = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
      const bSize = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
      return bSize - aSize;
    });
  }

  /**
   * Get only interactive components
   */
  async detectInteractiveComponents(page: Page): Promise<UniversalComponent[]> {
    try {
      if (!page || page.isClosed()) {
        console.warn('Page is closed, returning empty interactive components list');
        return [];
      }
      
      const allComponents = await this.detectAllComponents(page);
      return allComponents.filter(component => 
        component.interactions && 
        component.interactions.length > 0 &&
        component.isVisible
      );
    } catch (error) {
      console.error('Error detecting interactive components:', error);
      return [];
    }
  }

  /**
   * Get only structural components (containers, layouts)
   */
  async detectStructuralComponents(page: Page): Promise<UniversalComponent[]> {
    try {
      if (!page || page.isClosed()) {
        console.warn('Page is closed, returning empty structural components list');
        return [];
      }
      
      const allComponents = await this.detectAllComponents(page);
      return allComponents.filter(component => 
        ['div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'].includes(component.tagName || '') &&
        component.isVisible &&
        component.boundingBox &&
        component.boundingBox.width > 100 &&
        component.boundingBox.height > 50
      );
    } catch (error) {
      console.error('Error detecting structural components:', error);
      return [];
    }
  }

  /**
   * Create a component from element data
   */
  private createComponentFromData(data: ElementData): UniversalComponent | null {
    if (!data.tagName) return null;

    const interactions: string[] = [];
    let type = 'unknown';

    // Determine component type and interactions
    if (data.isClickable) {
      interactions.push('click', 'hover');
      if (data.tagName === 'button') {
        type = 'button';
      } else if (data.tagName === 'a') {
        type = 'link';
        interactions.push('navigate');
      } else {
        type = 'clickable';
      }
    }

    if (data.isInput) {
      interactions.push('focus', 'blur');
      if (data.tagName === 'input') {
        type = 'input';
        interactions.push('type', 'clear');
      } else if (data.tagName === 'textarea') {
        type = 'textarea';
        interactions.push('type', 'clear');
      } else if (data.tagName === 'select') {
        type = 'select';
        interactions.push('select');
      }
    }

    // Structural elements
    if (['div', 'section', 'article', 'header', 'footer', 'nav', 'main'].includes(data.tagName)) {
      type = data.tagName;
      if (data.className.includes('modal') || data.className.includes('dialog')) {
        type = 'modal';
        interactions.push('close');
      } else if (data.className.includes('dropdown') || data.className.includes('menu')) {
        type = 'dropdown';
        interactions.push('toggle');
      }
    }

    // Generate selector
    let selector = data.tagName;
    if (data.id) {
      selector = `#${data.id}`;
    } else if (data.dataTestId) {
      selector = `[data-testid="${data.dataTestId}"]`;
    } else if (data.className) {
      const classes = data.className.split(' ').filter((c: string) => c.trim());
      if (classes.length > 0) {
        selector = `${data.tagName}.${classes[0]}`;
      }
    }

    // Add nth-child if needed for uniqueness
    selector += `:nth-of-type(${data.index + 1})`;

    return {
      id: `${type}-${data.index}`,
      type,
      selector,
      properties: {
        id: data.id,
        className: data.className,
        textContent: data.textContent,
        href: data.href,
        src: data.src,
        alt: data.alt,
        title: data.title,
        type: data.type,
        role: data.role,
        ariaLabel: data.ariaLabel,
        dataTestId: data.dataTestId,
        placeholder: data.placeholder,
        disabled: data.disabled
      },
      isVisible: data.isVisible,
      boundingBox: data.boundingBox || undefined,
      interactions,
      textContent: data.textContent,
      tagName: data.tagName
    };
  }

  /**
   * Get page statistics
   */
  async getPageStats(page: Page): Promise<{
    totalElements: number;
    visibleElements: number;
    interactiveElements: number;
    textElements: number;
    hasContent: boolean;
  }> {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    return await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      let visibleElements = 0;
      let interactiveElements = 0;
      let textElements = 0;

      Array.from(allElements).forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        if (isVisible) {
          visibleElements++;
          
          if (el.tagName === 'BUTTON' || 
              el.tagName === 'A' || 
              el.getAttribute('role') === 'button' ||
              ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
            interactiveElements++;
          }
          
          if (el.textContent && el.textContent.trim()) {
            textElements++;
          }
        }
      });

      return {
        totalElements: allElements.length,
        visibleElements,
        interactiveElements,
        textElements,
        hasContent: visibleElements > 5 && textElements > 0
      };
    });
  }

  /**
   * Wait for page to have meaningful content
   */
  async waitForContent(page: Page, minElements = 10, timeout = 5000): Promise<boolean> {
    try {
      await page.waitForFunction(
        (min) => {
          const elements = document.querySelectorAll('*');
          const visibleElements = Array.from(elements).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          return visibleElements.length >= min;
        },
        minElements,
        { timeout }
      );
      return true;
    } catch {
      console.warn(`Page did not reach ${minElements} visible elements within ${timeout}ms`);
      return false;
    }
  }
}
