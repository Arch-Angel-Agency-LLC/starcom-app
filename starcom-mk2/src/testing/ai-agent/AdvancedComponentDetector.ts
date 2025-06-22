import { Page, Locator } from '@playwright/test';
import { AgentConfig, DetectedComponent } from './types';

/**
 * Advanced Component Detector - Phase 2 Enhancement
 * Uses multiple strategies to detect UI components regardless of framework
 */
export class AdvancedComponentDetector {
  constructor(_config?: Partial<AgentConfig>) {
    // Config available for future features
  }

  /**
   * Main detection method that tries multiple strategies
   */
  async detectComponents(page: Page): Promise<DetectedComponent[]> {
    const strategies = [
      this.detectInteractiveElements.bind(this),
      this.detectSemanticElements.bind(this),
      this.detectAriaElements.bind(this),
      this.detectDataTestElements.bind(this),
      this.detectCommonPatterns.bind(this)
    ];

    const allComponents: DetectedComponent[] = [];
    
    for (const strategy of strategies) {
      try {
        const components = await strategy(page);
        allComponents.push(...components);
      } catch (error) {
        console.log(`Strategy failed: ${strategy.name}`, error);
      }
    }

    // Deduplicate and prioritize components
    return this.deduplicateComponents(allComponents);
  }

  /**
   * Detect interactive elements (buttons, inputs, links)
   */
  private async detectInteractiveElements(page: Page): Promise<DetectedComponent[]> {
    const components: DetectedComponent[] = [];

    // Buttons
    const buttons = await page.locator('button, [role="button"], input[type="button"], input[type="submit"]').all();
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent() || '';
      const type = await button.getAttribute('type') || 'button';
      components.push({
        id: `button-${i}`,
        type: 'button',
        selector: await this.generateSelector(button),
        properties: {
          text: text.trim(),
          type,
          disabled: await button.isDisabled(),
          visible: await button.isVisible()
        }
      });
    }

    // Input fields
    const inputs = await page.locator('input, textarea, select').all();
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type') || 'text';
      const placeholder = await input.getAttribute('placeholder') || '';
      components.push({
        id: `input-${i}`,
        type: 'input',
        selector: await this.generateSelector(input),
        properties: {
          type,
          placeholder,
          required: await input.getAttribute('required') !== null,
          disabled: await input.isDisabled(),
          visible: await input.isVisible()
        }
      });
    }

    // Links
    const links = await page.locator('a[href]').all();
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const text = await link.textContent() || '';
      const href = await link.getAttribute('href') || '';
      components.push({
        id: `link-${i}`,
        type: 'link',
        selector: await this.generateSelector(link),
        properties: {
          text: text.trim(),
          href,
          target: await link.getAttribute('target') || '_self',
          visible: await link.isVisible()
        }
      });
    }

    return components;
  }

  /**
   * Detect semantic HTML elements
   */
  private async detectSemanticElements(page: Page): Promise<DetectedComponent[]> {
    const components: DetectedComponent[] = [];
    const semanticTags = ['nav', 'header', 'footer', 'main', 'section', 'article', 'aside', 'form'];

    for (const tag of semanticTags) {
      const elements = await page.locator(tag).all();
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const text = await element.textContent() || '';
        components.push({
          id: `${tag}-${i}`,
          type: tag,
          selector: await this.generateSelector(element),
          properties: {
            tagName: tag,
            textLength: text.length,
            hasChildren: await element.locator('*').count() > 0,
            visible: await element.isVisible()
          }
        });
      }
    }

    return components;
  }

  /**
   * Detect elements with ARIA attributes
   */
  private async detectAriaElements(page: Page): Promise<DetectedComponent[]> {
    const components: DetectedComponent[] = [];
    
    // Elements with role attributes
    const roleElements = await page.locator('[role]').all();
    for (let i = 0; i < roleElements.length; i++) {
      const element = roleElements[i];
      const role = await element.getAttribute('role') || '';
      const ariaLabel = await element.getAttribute('aria-label') || '';
      
      components.push({
        id: `aria-${role}-${i}`,
        type: `aria-${role}`,
        selector: await this.generateSelector(element),
        properties: {
          role,
          ariaLabel,
          ariaExpanded: await element.getAttribute('aria-expanded'),
          ariaSelected: await element.getAttribute('aria-selected'),
          visible: await element.isVisible()
        }
      });
    }

    return components;
  }

  /**
   * Detect elements with data-testid attributes (common in React apps)
   */
  private async detectDataTestElements(page: Page): Promise<DetectedComponent[]> {
    const components: DetectedComponent[] = [];
    
    const testElements = await page.locator('[data-testid], [data-test], [data-cy]').all();
    for (let i = 0; i < testElements.length; i++) {
      const element = testElements[i];
      const testId = await element.getAttribute('data-testid') ||
                    await element.getAttribute('data-test') ||
                    await element.getAttribute('data-cy') || '';
      
      components.push({
        id: `test-${testId}-${i}`,
        type: 'test-element',
        selector: await this.generateSelector(element),
        properties: {
          testId,
          tagName: await element.evaluate(el => el.tagName.toLowerCase()),
          visible: await element.isVisible()
        }
      });
    }

    return components;
  }

  /**
   * Detect common UI patterns (cards, modals, dropdowns)
   */
  private async detectCommonPatterns(page: Page): Promise<DetectedComponent[]> {
    const components: DetectedComponent[] = [];

    // Cards (common class patterns)
    const cardSelectors = ['.card', '.panel', '.widget', '[class*="card"]', '[class*="panel"]'];
    for (const selector of cardSelectors) {
      try {
        const cards = await page.locator(selector).all();
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          components.push({
            id: `card-${i}`,
            type: 'card',
            selector: await this.generateSelector(card),
            properties: {
              className: await card.getAttribute('class') || '',
              visible: await card.isVisible()
            }
          });
        }
      } catch {
        // Ignore invalid selectors
      }
    }

    // Modals and overlays
    const modalSelectors = ['.modal', '.overlay', '.popup', '[class*="modal"]', '[class*="overlay"]'];
    for (const selector of modalSelectors) {
      try {
        const modals = await page.locator(selector).all();
        for (let i = 0; i < modals.length; i++) {
          const modal = modals[i];
          components.push({
            id: `modal-${i}`,
            type: 'modal',
            selector: await this.generateSelector(modal),
            properties: {
              className: await modal.getAttribute('class') || '',
              visible: await modal.isVisible()
            }
          });
        }
      } catch {
        // Ignore invalid selectors
      }
    }

    return components;
  }

  /**
   * Generate a unique CSS selector for an element
   */
  private async generateSelector(locator: Locator): Promise<string> {
    try {
      // Try to get a simple selector first
      const id = await locator.getAttribute('id');
      if (id) {
        return `#${id}`;
      }

      const testId = await locator.getAttribute('data-testid');
      if (testId) {
        return `[data-testid="${testId}"]`;
      }

      // Fall back to nth-child selector
      const tagName = await locator.evaluate((el: Element) => el.tagName.toLowerCase());
      const index = await locator.evaluate((el: Element) => {
        const siblings = Array.from(el.parentElement?.children || []);
        return siblings.filter(sibling => sibling.tagName === el.tagName).indexOf(el);
      });
      
      return `${tagName}:nth-of-type(${index + 1})`;
    } catch {
      return 'unknown-selector';
    }
  }

  /**
   * Remove duplicate components and prioritize by relevance
   */
  private deduplicateComponents(components: DetectedComponent[]): DetectedComponent[] {
    const uniqueComponents = new Map<string, DetectedComponent>();

    // Prioritize by type (interactive elements first)
    const priorityOrder = ['button', 'input', 'link', 'test-element', 'aria-button', 'aria-textbox'];

    for (const component of components) {
      const key = component.selector;
      
      if (!uniqueComponents.has(key)) {
        uniqueComponents.set(key, component);
      } else {
        // Keep the higher priority component
        const existing = uniqueComponents.get(key)!;
        const existingPriority = priorityOrder.indexOf(existing.type);
        const newPriority = priorityOrder.indexOf(component.type);
        
        if (newPriority !== -1 && (existingPriority === -1 || newPriority < existingPriority)) {
          uniqueComponents.set(key, component);
        }
      }
    }

    return Array.from(uniqueComponents.values());
  }
}

export default AdvancedComponentDetector;
