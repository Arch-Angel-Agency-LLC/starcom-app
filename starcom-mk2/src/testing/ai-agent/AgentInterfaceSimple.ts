import { Page, BrowserContext } from '@playwright/test';
import { EnhancedComponentDetector } from './EnhancedComponentDetector';
import { UniversalComponentDetector, UniversalComponent } from './UniversalComponentDetector';
import { AdvancedComponentDetector } from './AdvancedComponentDetector';
import { AgentConfig, DetectedComponent } from './types';

/**
 * Simplified AI Agent Interface focused on component detection
 */
export class AgentInterface {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private enhancedComponentDetector: EnhancedComponentDetector;
  private universalComponentDetector: UniversalComponentDetector;
  private _advancedComponentDetector: AdvancedComponentDetector; // Prefixed with _ to suppress warning
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      maxExecutionTime: 300000, // 5 minutes
      memoryLimit: 512 * 1024 * 1024, // 512MB
      outputLimit: 10 * 1024 * 1024, // 10MB
      emergencyStopEnabled: true,
      visualRegressionEnabled: true,
      accessibilityEnabled: true,
      performanceEnabled: true,
      safetyChecksEnabled: true,
      ...config
    };

    this.enhancedComponentDetector = new EnhancedComponentDetector();
    this.universalComponentDetector = new UniversalComponentDetector();
    this._advancedComponentDetector = new AdvancedComponentDetector(this.config);
  }

  /**
   * Initialize the agent with a browser context and page
   */
  async initialize(context: BrowserContext, page: Page): Promise<void> {
    this.context = context;
    this.page = page;
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    await this.page.goto(url);
  }

  /**
   * Detect UI components on the current page
   */
  async detectComponents(): Promise<DetectedComponent[]> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      // First try enhanced component detector for modern React applications
      const modernComponents = await this.enhancedComponentDetector.detectModernComponents(this.page);
      
      if (modernComponents.length > 0) {
        console.log(`Enhanced detector found ${modernComponents.length} components`);
        // Convert to legacy format for compatibility
        return modernComponents.map(component => ({
          id: component.id,
          type: component.type,
          selector: component.selector,
          properties: component.properties
        }));
      }
      
      console.log('Enhanced detector found no components, falling back to universal detector...');
      
      // Fall back to universal component detector for framework-agnostic detection
      const universalComponents = await this.universalComponentDetector.detectAllComponents(this.page);
      
      console.log(`Universal detector found ${universalComponents.length} components`);
      
      // Convert to legacy format for compatibility
      return universalComponents.map((component: UniversalComponent) => ({
        id: component.id,
        type: component.type,
        selector: component.selector,
        properties: component.properties
      }));
      
    } catch (error) {
      console.error('Error in component detection:', error);
      
      // Return empty array if all detection fails
      return [];
    }
  }

  /**
   * Take a screenshot of the current page
   */
  async takeScreenshot(name: string = 'screenshot'): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const screenshotPath = `./test-results/screenshots/${filename}`;
    
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  /**
   * Get the current page title
   */
  async getPageTitle(): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    return await this.page.title();
  }

  /**
   * Get the current page URL
   */
  async getPageUrl(): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    return this.page.url();
  }

  /**
   * Wait for a selector to be visible
   */
  async waitForSelector(selector: string, timeout: number = 5000): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click on an element
   */
  async click(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    await this.page.click(selector);
  }

  /**
   * Type text into an input
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    await this.page.fill(selector, text);
  }

  /**
   * Get the configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Get the current page instance
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current browser context
   */
  get browserContext(): BrowserContext | null {
    return this.context;
  }

  /**
   * Check if advanced component detector is available
   */
  get hasAdvancedDetector(): boolean {
    return !!this._advancedComponentDetector;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.page = null;
    this.context = null;
  }
}

export default AgentInterface;
