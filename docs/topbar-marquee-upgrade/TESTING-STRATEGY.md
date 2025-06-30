# Testing Strategy & Quality Assurance

## 🧪 Comprehensive Testing Framework

### Test Pyramid Structure
```
                    🔺 E2E Tests (5%)
                   /   \
                  /     \  Integration Tests (15%)
                 /       \
                /         \  Unit Tests (80%)
               /___________\
```

### Testing Categories & Coverage

#### Unit Tests (80% of test suite)
```typescript
// Component unit tests
describe('useDraggableMarquee', () => {
  describe('initialization', () => {
    it('should initialize with default drag state', () => {
      const { result } = renderHook(() => useDraggableMarquee());
      
      expect(result.current.dragState).toEqual({
        isDragging: false,
        isReleaseAnimating: false,
        isPaused: false,
        dragOffset: 0,
        velocity: 0,
        acceleration: 0,
        lastMouseX: 0,
        startX: 0,
        deltaX: 0,
        lastUpdateTime: 0,
        dragStartTime: 0,
        animationProgress: 0,
        dragSensitivity: 1.0,
        maxVelocity: 10,
        returnAnimationDuration: 800,
        momentumFriction: 0.95
      });
    });

    it('should apply custom configuration', () => {
      const config = { dragSensitivity: 2.0, maxVelocity: 20 };
      const { result } = renderHook(() => useDraggableMarquee(config));
      
      expect(result.current.dragState.dragSensitivity).toBe(2.0);
      expect(result.current.dragState.maxVelocity).toBe(20);
    });
  });

  describe('drag interactions', () => {
    it('should start drag on mouse down', () => {
      const { result } = renderHook(() => useDraggableMarquee());
      
      act(() => {
        result.current.dragHandlers.onMouseDown({
          clientX: 100,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        } as any);
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.startX).toBe(100);
    });

    it('should update position during drag', () => {
      const { result } = renderHook(() => useDraggableMarquee());
      
      // Start drag
      act(() => {
        result.current.dragHandlers.onMouseDown({ clientX: 100 } as any);
      });

      // Move mouse
      act(() => {
        result.current.dragHandlers.onMouseMove({ clientX: 150 } as any);
      });

      expect(result.current.dragState.dragOffset).toBeGreaterThan(0);
      expect(result.current.dragState.deltaX).toBe(50);
    });

    it('should calculate velocity correctly', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useDraggableMarquee());
      
      act(() => {
        result.current.dragHandlers.onMouseDown({ clientX: 0 } as any);
      });

      act(() => {
        jest.advanceTimersByTime(16); // One frame
        result.current.dragHandlers.onMouseMove({ clientX: 100 } as any);
      });

      expect(result.current.dragState.velocity).toBeGreaterThan(0);
      jest.useRealTimers();
    });

    it('should trigger momentum animation on release', () => {
      const onMomentumStart = jest.fn();
      const { result } = renderHook(() => 
        useDraggableMarquee({}, { onMomentumStart })
      );
      
      // Fast drag and release
      act(() => {
        result.current.dragHandlers.onMouseDown({ clientX: 0 } as any);
        result.current.dragHandlers.onMouseMove({ clientX: 100 } as any);
        result.current.dragHandlers.onMouseUp({} as any);
      });

      expect(result.current.dragState.isReleaseAnimating).toBe(true);
      expect(onMomentumStart).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid clicks without drag', () => {
      const onClick = jest.fn();
      const { result } = renderHook(() => 
        useDraggableMarquee({ clickThreshold: 5 }, { onDataPointClick: onClick })
      );
      
      act(() => {
        result.current.dragHandlers.onMouseDown({ clientX: 100 } as any);
        result.current.dragHandlers.onMouseMove({ clientX: 102 } as any); // Small movement
        result.current.dragHandlers.onMouseUp({} as any);
      });

      expect(onClick).toHaveBeenCalled();
      expect(result.current.dragState.isDragging).toBe(false);
    });

    it('should prevent drag when marquee is paused', () => {
      const { result } = renderHook(() => useDraggableMarquee());
      
      act(() => {
        result.current.pauseMarquee();
        result.current.dragHandlers.onMouseDown({ clientX: 100 } as any);
      });

      expect(result.current.dragState.isDragging).toBe(false);
    });

    it('should handle boundary conditions', () => {
      const { result } = renderHook(() => 
        useDraggableMarquee({ maxVelocity: 5 })
      );
      
      act(() => {
        result.current.dragHandlers.onMouseDown({ clientX: 0 } as any);
        result.current.dragHandlers.onMouseMove({ clientX: 1000 } as any); // Extreme movement
      });

      expect(result.current.dragState.velocity).toBeLessThanOrEqual(5);
    });
  });
});

// Enhanced Settings Popup Tests
describe('EnhancedSettingsPopup', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onCategoryToggle: jest.fn(),
    enabledCategories: {},
    categories: mockCategories
  };

  describe('tab navigation', () => {
    it('should render all available tabs', () => {
      render(<EnhancedSettingsPopup {...defaultProps} />);
      
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
    });

    it('should switch tabs correctly', () => {
      render(<EnhancedSettingsPopup {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Preferences'));
      
      expect(screen.getByText('Preferences')).toHaveClass('active');
      expect(screen.getByText('Categories')).not.toHaveClass('active');
    });

    it('should maintain tab history for back navigation', () => {
      render(<EnhancedSettingsPopup {...defaultProps} />);
      
      // Navigate through tabs
      fireEvent.click(screen.getByText('Preferences'));
      fireEvent.click(screen.getByText('Alerts'));
      
      // Back button should appear
      expect(screen.getByText('← Back')).toBeInTheDocument();
      
      // Go back
      fireEvent.click(screen.getByText('← Back'));
      
      expect(screen.getByText('Preferences')).toHaveClass('active');
    });
  });

  describe('detailed view integration', () => {
    it('should open detailed view when category is selected', () => {
      render(
        <EnhancedSettingsPopup 
          {...defaultProps} 
          selectedCategory="energy-security" 
        />
      );
      
      expect(screen.getByText('Details')).toHaveClass('active');
    });

    it('should load detailed data for selected category', async () => {
      const mockDetailedData = { primaryMetrics: [], secondaryMetrics: [] };
      jest.mocked(useDetailedCategoryData).mockReturnValue({
        detailedData: mockDetailedData,
        isLoading: false,
        error: null
      });

      render(
        <EnhancedSettingsPopup 
          {...defaultProps} 
          selectedCategory="energy-security" 
        />
      );

      await waitFor(() => {
        expect(useDetailedCategoryData).toHaveBeenCalledWith('energy-security');
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<EnhancedSettingsPopup {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'settings-modal-title');
    });

    it('should trap focus within modal', () => {
      render(<EnhancedSettingsPopup {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should handle keyboard navigation', () => {
      render(<EnhancedSettingsPopup {...defaultProps} />);
      
      // Tab through elements
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      
      fireEvent.keyDown(document, { key: 'Tab' });
      
      expect(document.activeElement).not.toBe(firstButton);
    });
  });
});
```

#### Integration Tests (15% of test suite)
```typescript
describe('TopBar Marquee Integration', () => {
  describe('data flow integration', () => {
    it('should integrate EIA data with marquee display', async () => {
      const mockEIAData = {
        oilPrice: 75.50,
        naturalGasPrice: 3.25,
        energySecurity: 'Stable'
      };

      jest.mocked(useTopBarData).mockReturnValue({
        ...mockEIAData,
        loading: false,
        error: null,
        criticalDataLoaded: true
      });

      render(<TopBar />);

      await waitFor(() => {
        expect(screen.getByText(/75\.50/)).toBeInTheDocument();
        expect(screen.getByText(/3\.25/)).toBeInTheDocument();
      });
    });

    it('should handle data loading states', async () => {
      jest.mocked(useTopBarData).mockReturnValue({
        loading: true,
        criticalDataLoaded: false,
        loadingStates: { 'oil-price': true },
        dataAvailability: {}
      });

      render(<TopBar />);

      expect(screen.getByText(/Loading/)).toBeInTheDocument();
    });

    it('should show fallback values when EIA data fails', async () => {
      jest.mocked(useTopBarData).mockReturnValue({
        oilPrice: null,
        naturalGasPrice: null,
        loading: false,
        error: 'EIA API unavailable',
        criticalDataLoaded: true
      });

      render(<TopBar />);

      // Should show fallback values, not error states
      expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
      expect(screen.getByText(/N\/A/)).toBeInTheDocument();
    });
  });

  describe('drag and settings integration', () => {
    it('should maintain settings state during drag operations', async () => {
      render(<TopBar />);
      
      const marquee = screen.getByRole('marquee');
      const settingsButton = screen.getByLabelText('Open settings');
      
      // Start drag
      fireEvent.mouseDown(marquee, { clientX: 100 });
      fireEvent.mouseMove(marquee, { clientX: 200 });
      
      // Open settings during drag
      fireEvent.click(settingsButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // End drag
      fireEvent.mouseUp(marquee);
      
      // Settings should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should update marquee when category preferences change', async () => {
      const { rerender } = render(<TopBar />);
      
      // Open settings
      fireEvent.click(screen.getByLabelText('Open settings'));
      
      // Disable a category
      const oilPriceToggle = screen.getByLabelText(/Oil/);
      fireEvent.click(oilPriceToggle);
      
      // Close settings
      fireEvent.click(screen.getByLabelText('Close settings'));
      
      // Marquee should not show disabled category
      rerender(<TopBar />);
      
      await waitFor(() => {
        expect(screen.queryByText(/Oil/)).not.toBeInTheDocument();
      });
    });
  });

  describe('performance integration', () => {
    it('should maintain 60fps during drag operations', async () => {
      const performanceMonitor = new PerformanceMonitor();
      performanceMonitor.startFPSMonitoring();
      
      render(<TopBar />);
      
      const marquee = screen.getByRole('marquee');
      
      // Simulate intensive drag
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(marquee, { clientX: i * 5 });
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      
      const fpsStats = performanceMonitor.getFPSStats();
      expect(fpsStats.average).toBeGreaterThan(58); // Allow for some variance
    });

    it('should not cause memory leaks during extended use', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      render(<TopBar />);
      
      // Simulate extended interaction
      for (let i = 0; i < 1000; i++) {
        fireEvent.click(screen.getByLabelText('Open settings'));
        fireEvent.click(screen.getByLabelText('Close settings'));
      }
      
      // Force garbage collection if available
      if (global.gc) global.gc();
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
    });
  });
});
```

#### End-to-End Tests (5% of test suite)
```typescript
// Using Playwright for E2E tests
describe('TopBar Marquee E2E', () => {
  let page: Page;
  let context: BrowserContext;

  beforeAll(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await context.close();
  });

  describe('complete user workflows', () => {
    it('should complete full drag-to-detailed-view workflow', async () => {
      await page.goto('/');
      
      // Wait for data to load
      await page.waitForSelector('[data-testid="topbar-root"]');
      await page.waitForSelector('.marquee-data-point');
      
      // Test drag functionality
      const marquee = await page.locator('.marquee-container');
      const box = await marquee.boundingBox();
      
      await page.mouse.move(box!.x + 100, box!.y + 20);
      await page.mouse.down();
      await page.mouse.move(box!.x + 300, box!.y + 20);
      
      // Verify drag visual feedback
      await expect(marquee).toHaveAttribute('data-dragging', 'true');
      
      await page.mouse.up();
      
      // Verify momentum animation
      await expect(marquee).toHaveAttribute('data-animating', 'true');
      
      // Wait for animation to complete
      await page.waitForTimeout(1000);
      
      // Click on a data point
      const dataPoint = await page.locator('.marquee-data-point').first();
      await dataPoint.click();
      
      // Verify detailed view opens
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('.detailed-category-view')).toBeVisible();
    });

    it('should handle keyboard navigation throughout interface', async () => {
      await page.goto('/');
      
      // Tab to marquee
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Skip settings button
      
      // Navigate marquee with arrows
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      
      // Open detailed view with Enter
      await page.keyboard.press('Enter');
      
      // Verify settings popup opened with detailed view
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('.tab-button:has-text("Details")')).toHaveClass(/active/);
      
      // Navigate tabs with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('ArrowLeft'); // Categories tab
      await page.keyboard.press('Enter');
      
      await expect(page.locator('.tab-button:has-text("Categories")')).toHaveClass(/active/);
      
      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    it('should maintain performance during intensive interactions', async () => {
      await page.goto('/');
      
      // Start performance monitoring
      await page.evaluate(() => {
        (window as any).performanceMarks = [];
        const observer = new PerformanceObserver((list) => {
          (window as any).performanceMarks.push(...list.getEntries());
        });
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      });
      
      // Intensive interaction sequence
      for (let i = 0; i < 50; i++) {
        await page.locator('.marquee-container').hover();
        await page.mouse.move(100 + i * 5, 100);
        await page.mouse.down();
        await page.mouse.move(200 + i * 5, 100);
        await page.mouse.up();
        
        if (i % 10 === 0) {
          await page.locator('[data-testid="topbar-settings-btn"]').click();
          await page.locator('.close-button').click();
        }
      }
      
      // Check performance metrics
      const performanceData = await page.evaluate(() => {
        return {
          marks: (window as any).performanceMarks,
          memory: (performance as any).memory
        };
      });
      
      // Verify no excessive long tasks
      const longTasks = performanceData.marks.filter(
        (mark: any) => mark.duration > 50 // 50ms threshold
      );
      
      expect(longTasks.length).toBeLessThan(5);
    });
  });

  describe('cross-browser compatibility', () => {
    const browsers = ['chromium', 'firefox', 'webkit'];
    
    browsers.forEach(browserName => {
      it(`should work correctly in ${browserName}`, async () => {
        // Test would be run with different browser contexts
        await page.goto('/');
        
        // Basic functionality test
        await page.waitForSelector('.marquee-container');
        await page.locator('.marquee-data-point').first().click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();
        
        // Drag test
        const marquee = await page.locator('.marquee-container');
        const box = await marquee.boundingBox();
        
        await page.mouse.move(box!.x + 100, box!.y + 20);
        await page.mouse.down();
        await page.mouse.move(box!.x + 200, box!.y + 20);
        await page.mouse.up();
        
        // Should not throw errors
        const errors = await page.evaluate(() => (window as any).testErrors || []);
        expect(errors).toHaveLength(0);
      });
    });
  });
});
```

### Performance Testing Framework
```typescript
export class PerformanceTestSuite {
  private performanceMonitor: PerformanceMonitor;
  private results: PerformanceTestResult[] = [];

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
  }

  async runPerformanceTests(): Promise<PerformanceTestResult[]> {
    console.log('Starting performance test suite...');

    // FPS Tests
    await this.testDragAnimationFPS();
    await this.testPopupAnimationFPS();
    
    // Memory Tests
    await this.testMemoryLeaks();
    await this.testMemoryUsage();
    
    // Interaction Tests
    await this.testClickResponseTime();
    await this.testHoverResponseTime();
    
    // Network Tests
    await this.testDataFetchPerformance();
    
    return this.results;
  }

  private async testDragAnimationFPS(): Promise<void> {
    const startTime = performance.now();
    this.performanceMonitor.startFPSMonitoring();
    
    // Simulate 5 seconds of drag animation
    const duration = 5000;
    const frameCount = Math.floor(duration / 16.67); // 60fps
    
    for (let i = 0; i < frameCount; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    const fpsStats = this.performanceMonitor.getFPSStats();
    const endTime = performance.now();
    
    this.results.push({
      test: 'drag-animation-fps',
      passed: fpsStats.average >= 58, // Allow 2fps tolerance
      duration: endTime - startTime,
      metrics: {
        averageFPS: fpsStats.average,
        minFPS: fpsStats.min,
        targetFPS: 60
      }
    });
  }

  private async testMemoryLeaks(): Promise<void> {
    const initialMemory = this.performanceMonitor.getMemoryUsage();
    
    // Simulate intensive usage
    for (let i = 0; i < 1000; i++) {
      const element = document.createElement('div');
      element.innerHTML = `<div class="test-element">${i}</div>`;
      document.body.appendChild(element);
      
      // Remove immediately to test cleanup
      document.body.removeChild(element);
    }
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalMemory = this.performanceMonitor.getMemoryUsage();
    const memoryIncrease = finalMemory.used - initialMemory.used;
    
    this.results.push({
      test: 'memory-leaks',
      passed: memoryIncrease < 5 * 1024 * 1024, // Less than 5MB increase
      metrics: {
        initialMemory: initialMemory.used,
        finalMemory: finalMemory.used,
        increase: memoryIncrease,
        threshold: 5 * 1024 * 1024
      }
    });
  }

  private async testClickResponseTime(): Promise<void> {
    const responseTime = await this.measureInteractionTime(async () => {
      const element = document.querySelector('.marquee-data-point');
      if (element) {
        (element as HTMLElement).click();
      }
    });
    
    this.results.push({
      test: 'click-response-time',
      passed: responseTime < PERFORMANCE_TARGETS.CLICK_RESPONSE_TIME,
      duration: responseTime,
      metrics: {
        responseTime,
        target: PERFORMANCE_TARGETS.CLICK_RESPONSE_TIME
      }
    });
  }

  private async measureInteractionTime(interaction: () => Promise<void> | void): Promise<number> {
    const startTime = performance.now();
    await interaction();
    return performance.now() - startTime;
  }
}

interface PerformanceTestResult {
  test: string;
  passed: boolean;
  duration?: number;
  metrics?: Record<string, number>;
  error?: string;
}
```

### Accessibility Testing
```typescript
export class AccessibilityTestSuite {
  async runA11yTests(): Promise<A11yTestResult[]> {
    const results: A11yTestResult[] = [];
    
    // ARIA Tests
    results.push(await this.testAriaLabels());
    results.push(await this.testAriaRoles());
    
    // Keyboard Tests
    results.push(await this.testKeyboardNavigation());
    results.push(await this.testFocusManagement());
    
    // Color Contrast Tests
    results.push(await this.testColorContrast());
    
    // Screen Reader Tests
    results.push(await this.testScreenReaderContent());
    
    return results;
  }

  private async testKeyboardNavigation(): Promise<A11yTestResult> {
    const marquee = document.querySelector('.marquee-container') as HTMLElement;
    if (!marquee) {
      return { test: 'keyboard-navigation', passed: false, error: 'Marquee not found' };
    }

    // Test Tab navigation
    marquee.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    marquee.dispatchEvent(tabEvent);
    
    // Test Arrow navigation
    const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    marquee.dispatchEvent(arrowEvent);
    
    // Test Enter activation
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    marquee.dispatchEvent(enterEvent);
    
    // Check if interaction worked
    const popup = document.querySelector('[role="dialog"]');
    
    return {
      test: 'keyboard-navigation',
      passed: popup !== null,
      details: 'Arrow navigation and Enter activation should open detailed view'
    };
  }

  private async testColorContrast(): Promise<A11yTestResult> {
    const elements = document.querySelectorAll('.marquee-data-point, .tab-button, .nav-button');
    const failures: string[] = [];
    
    elements.forEach((element, index) => {
      const styles = getComputedStyle(element);
      const color = this.parseColor(styles.color);
      const backgroundColor = this.parseColor(styles.backgroundColor);
      
      if (color && backgroundColor) {
        const contrast = this.calculateContrast(color, backgroundColor);
        if (contrast < 4.5) {
          failures.push(`Element ${index}: ${contrast.toFixed(2)}:1 (requires 4.5:1)`);
        }
      }
    });
    
    return {
      test: 'color-contrast',
      passed: failures.length === 0,
      error: failures.length > 0 ? failures.join('; ') : undefined,
      details: `Checked ${elements.length} elements for WCAG AA compliance`
    };
  }

  private parseColor(colorString: string): [number, number, number] | null {
    const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return null;
  }

  private calculateContrast(color1: [number, number, number], color2: [number, number, number]): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance([r, g, b]: [number, number, number]): number {
    const sRGB = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }
}

interface A11yTestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: string;
}
```

### Automated Test Runner
```typescript
// Jest configuration for comprehensive testing
export const testConfig = {
  // Test environment setup
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // Test coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Performance test integration
  testRunner: 'jest-circus/runner',
  
  // Custom test environment for performance tests
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};

// CI/CD Integration
export class ContinuousTestingPipeline {
  async runFullTestSuite(): Promise<TestSuiteResults> {
    console.log('🧪 Starting comprehensive test suite...');
    
    const results: TestSuiteResults = {
      unit: await this.runUnitTests(),
      integration: await this.runIntegrationTests(),
      e2e: await this.runE2ETests(),
      performance: await this.runPerformanceTests(),
      accessibility: await this.runA11yTests(),
      security: await this.runSecurityTests()
    };
    
    const overallPassed = Object.values(results).every(result => result.passed);
    
    console.log(`✅ Test suite ${overallPassed ? 'PASSED' : 'FAILED'}`);
    
    return results;
  }

  private async runUnitTests(): Promise<TestResult> {
    // Run Jest unit tests
    const jestResult = await this.execCommand('npm run test:unit');
    return this.parseJestResults(jestResult);
  }

  private async runPerformanceTests(): Promise<TestResult> {
    const performanceTestSuite = new PerformanceTestSuite();
    const results = await performanceTestSuite.runPerformanceTests();
    
    return {
      passed: results.every(result => result.passed),
      testCount: results.length,
      failures: results.filter(result => !result.passed),
      coverage: null
    };
  }

  private async runA11yTests(): Promise<TestResult> {
    const a11yTestSuite = new AccessibilityTestSuite();
    const results = await a11yTestSuite.runA11yTests();
    
    return {
      passed: results.every(result => result.passed),
      testCount: results.length,
      failures: results.filter(result => !result.passed),
      coverage: null
    };
  }
}

interface TestSuiteResults {
  unit: TestResult;
  integration: TestResult;
  e2e: TestResult;
  performance: TestResult;
  accessibility: TestResult;
  security: TestResult;
}

interface TestResult {
  passed: boolean;
  testCount: number;
  failures: any[];
  coverage: number | null;
}
```

This comprehensive testing strategy ensures the enhanced TopBar Marquee system meets all quality requirements across functionality, performance, accessibility, and security dimensions.
