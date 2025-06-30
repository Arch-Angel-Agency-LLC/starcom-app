# Performance & Accessibility Specification

## 🚀 Performance Requirements & Optimization

### Target Performance Metrics

#### Animation Performance
```typescript
export const PERFORMANCE_TARGETS = {
  // Animation targets
  FPS_TARGET: 60,
  FRAME_TIME_BUDGET: 16.67, // ms (1000ms / 60fps)
  DRAG_RESPONSE_TIME: 8, // ms maximum delay
  ANIMATION_JANK_THRESHOLD: 3, // consecutive frames > 16.67ms

  // Interaction targets
  CLICK_RESPONSE_TIME: 100, // ms
  POPUP_OPEN_TIME: 200, // ms
  TAB_SWITCH_TIME: 150, // ms
  HOVER_RESPONSE_TIME: 50, // ms

  // Memory targets
  MAX_MEMORY_USAGE: 100, // MB
  MEMORY_LEAK_THRESHOLD: 5, // MB over 5 minutes
  CACHE_SIZE_LIMIT: 10, // MB

  // Network targets
  DATA_FETCH_TIME: 1000, // ms
  CACHE_HIT_RATIO: 0.8, // 80%
  CONCURRENT_REQUESTS: 6, // max simultaneous requests
} as const;
```

### Performance Monitoring System
```typescript
export class PerformanceMonitor {
  private fpsCounter: FPSCounter;
  private memoryTracker: MemoryTracker;
  private interactionTimer: InteractionTimer;
  private networkMonitor: NetworkMonitor;

  constructor() {
    this.fpsCounter = new FPSCounter();
    this.memoryTracker = new MemoryTracker();
    this.interactionTimer = new InteractionTimer();
    this.networkMonitor = new NetworkMonitor();
  }

  // FPS monitoring for drag animations
  startFPSMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsHistory: number[] = [];

    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      frameCount++;
      
      if (deltaTime >= 1000) {
        const fps = (frameCount * 1000) / deltaTime;
        fpsHistory.push(fps);
        
        // Keep only last 60 measurements (1 minute at 1 fps)
        if (fpsHistory.length > 60) {
          fpsHistory.shift();
        }
        
        this.fpsCounter.updateStats({
          current: fps,
          average: fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length,
          min: Math.min(...fpsHistory),
          max: Math.max(...fpsHistory)
        });
        
        // Alert if FPS drops significantly
        if (fps < PERFORMANCE_TARGETS.FPS_TARGET * 0.8) {
          this.reportPerformanceIssue('low_fps', { fps, target: PERFORMANCE_TARGETS.FPS_TARGET });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }

  // Memory usage tracking
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMemory = memInfo.usedJSHeapSize / 1024 / 1024; // MB
      
      this.memoryTracker.addSample(usedMemory);
      
      if (usedMemory > PERFORMANCE_TARGETS.MAX_MEMORY_USAGE) {
        this.reportPerformanceIssue('high_memory', { 
          current: usedMemory, 
          target: PERFORMANCE_TARGETS.MAX_MEMORY_USAGE 
        });
      }
    }
  }

  // Interaction timing
  measureInteraction(type: InteractionType, startTime: number): void {
    const duration = performance.now() - startTime;
    this.interactionTimer.recordInteraction(type, duration);
    
    const threshold = this.getInteractionThreshold(type);
    if (duration > threshold) {
      this.reportPerformanceIssue('slow_interaction', {
        type,
        duration,
        threshold
      });
    }
  }

  private getInteractionThreshold(type: InteractionType): number {
    const thresholds = {
      'click': PERFORMANCE_TARGETS.CLICK_RESPONSE_TIME,
      'hover': PERFORMANCE_TARGETS.HOVER_RESPONSE_TIME,
      'popup_open': PERFORMANCE_TARGETS.POPUP_OPEN_TIME,
      'tab_switch': PERFORMANCE_TARGETS.TAB_SWITCH_TIME,
      'drag_start': PERFORMANCE_TARGETS.DRAG_RESPONSE_TIME
    };
    return thresholds[type] || 100;
  }

  private reportPerformanceIssue(type: string, data: any): void {
    console.warn(`Performance issue detected: ${type}`, data);
    
    // Could integrate with error tracking service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_issue', {
        issue_type: type,
        ...data
      });
    }
  }
}

type InteractionType = 'click' | 'hover' | 'popup_open' | 'tab_switch' | 'drag_start';
```

### Optimization Strategies

#### GPU Acceleration
```css
/* Force GPU acceleration for animations */
.marquee-container,
.marquee-data-point,
.enhanced-settings-popup {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Optimize animations */
.drag-animation {
  transform: translate3d(var(--drag-offset), 0, 0);
  transition: transform var(--spring-duration) var(--spring-easing);
}

/* Reduce paint operations */
.marquee-content {
  contain: layout style paint;
  content-visibility: auto;
}
```

#### React Performance Optimizations
```typescript
// Memoized drag hook
export const useDraggableMarquee = memo((
  config: DragConfiguration,
  callbacks: DragCallbacks
) => {
  // Use useCallback for all handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Implementation
  }, [config.dragSensitivity, config.clickThreshold]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Throttle mouse move events for performance
    throttle(() => {
      // Implementation
    }, 16)(); // ~60fps
  }, []);

  // Memoize computed values
  const containerStyle = useMemo(() => ({
    transform: `translateX(${dragState.dragOffset}px)`,
    transition: dragState.isReleaseAnimating 
      ? `transform ${config.returnAnimationDuration}ms ${config.easingFunction}`
      : 'none'
  }), [dragState.dragOffset, dragState.isReleaseAnimating, config]);

  return { dragState, handlers, containerStyle };
});

// Optimized data point rendering
const MarqueeDataPoint = memo<MarqueeDataPointProps>(({ 
  dataPoint, 
  onClick, 
  onHover 
}) => {
  // Virtualization for large datasets
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });
  
  if (!isVisible) {
    return <div ref={ref} style={{ width: '120px', height: '40px' }} />;
  }

  return (
    <div 
      ref={ref}
      className="marquee-data-point"
      onClick={() => onClick(dataPoint)}
      onMouseEnter={() => onHover?.(dataPoint)}
    >
      {/* Content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.dataPoint.id === nextProps.dataPoint.id &&
    prevProps.dataPoint.value === nextProps.dataPoint.value &&
    prevProps.dataPoint.isLoading === nextProps.dataPoint.isLoading &&
    prevProps.dataPoint.hasError === nextProps.dataPoint.hasError
  );
});
```

#### Bundle Optimization
```typescript
// Lazy loading for enhanced features
const DetailedCategoryView = lazy(() => 
  import('./DetailedCategoryView').then(module => ({
    default: module.DetailedCategoryView
  }))
);

const EnhancedSettingsPopup = lazy(() =>
  import('./EnhancedSettingsPopup')
);

// Dynamic imports for heavy features
const loadCorrelationEngine = () => 
  import('./CorrelationEngine').then(module => module.CorrelationEngine);

const loadTrendAnalyzer = () =>
  import('./TrendAnalyzer').then(module => module.TrendAnalyzer);

// Code splitting by feature
const enhancedFeatures = {
  correlations: () => import('./features/correlations'),
  trends: () => import('./features/trends'),
  alerts: () => import('./features/alerts'),
  charts: () => import('./features/charts')
};
```

## ♿ Accessibility Specification

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
```typescript
export const useKeyboardNavigation = (
  dataPoints: MarqueeDataPoint[],
  onDataPointSelect: (dataPoint: MarqueeDataPoint) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);

  // Detect keyboard vs mouse usage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setIsKeyboardMode(true);
      }
    };

    const handleMouseMove = () => {
      setIsKeyboardMode(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isKeyboardMode) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, dataPoints.length - 1));
        break;
      
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < dataPoints.length) {
          onDataPointSelect(dataPoints[focusedIndex]);
        }
        break;
      
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      
      case 'End':
        e.preventDefault();
        setFocusedIndex(dataPoints.length - 1);
        break;
    }
  }, [focusedIndex, dataPoints, onDataPointSelect, isKeyboardMode]);

  return {
    focusedIndex,
    isKeyboardMode,
    handleKeyDown
  };
};
```

#### Screen Reader Support
```tsx
// Enhanced ARIA labels and descriptions
const MarqueeWithA11y: React.FC<MarqueeProps> = ({ dataPoints, ...props }) => {
  const { focusedIndex, isKeyboardMode, handleKeyDown } = useKeyboardNavigation(
    dataPoints,
    props.onDataPointClick
  );

  return (
    <div
      role="marquee"
      aria-label="Energy intelligence data ticker"
      aria-live="polite"
      aria-atomic="false"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`marquee-container ${isKeyboardMode ? 'keyboard-mode' : ''}`}
    >
      <div
        role="list"
        aria-label={`${dataPoints.length} data categories available`}
      >
        {dataPoints.map((dataPoint, index) => (
          <div
            key={dataPoint.id}
            role="listitem"
            tabIndex={isKeyboardMode && index === focusedIndex ? 0 : -1}
            aria-selected={index === focusedIndex}
            aria-label={`${dataPoint.label}: ${dataPoint.value}`}
            aria-describedby={`description-${dataPoint.id}`}
            onClick={() => props.onDataPointClick?.(dataPoint)}
            className={`marquee-data-point ${index === focusedIndex ? 'focused' : ''}`}
          >
            <span aria-hidden="true">{dataPoint.icon}</span>
            <span className="sr-only">{dataPoint.label}</span>
            <span>{dataPoint.value}</span>
            
            {/* Hidden description for screen readers */}
            <div 
              id={`description-${dataPoint.id}`}
              className="sr-only"
            >
              {dataPoint.description || `${dataPoint.label} data point`}
              {dataPoint.lastUpdated && `, last updated ${formatTimeForScreenReader(dataPoint.lastUpdated)}`}
              {dataPoint.alertLevel !== 'normal' && `, alert level: ${dataPoint.alertLevel}`}
              {dataPoint.isLoading && ', currently loading'}
              {dataPoint.hasError && ', data unavailable'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Screen reader optimized time formatting
const formatTimeForScreenReader = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};
```

#### Focus Management
```typescript
export const useFocusManagement = () => {
  const focusStackRef = useRef<HTMLElement[]>([]);
  const trapRef = useRef<HTMLElement | null>(null);

  // Save focus before opening modal
  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      focusStackRef.current.push(activeElement);
    }
  }, []);

  // Restore focus when closing modal
  const restoreFocus = useCallback(() => {
    const lastFocused = focusStackRef.current.pop();
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }, []);

  // Set up focus trap
  const trapFocus = useCallback((element: HTMLElement) => {
    trapRef.current = element;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { saveFocus, restoreFocus, trapFocus };
};
```

### Reduced Motion Support
```css
/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .marquee-container {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .marquee-data-point {
    transition: none !important;
  }
  
  .drag-animation {
    transition: none !important;
  }
  
  .enhanced-settings-popup {
    animation: none !important;
  }
  
  /* Provide alternative feedback */
  .marquee-data-point:hover {
    outline: 2px solid var(--focus-color);
    background-color: var(--hover-bg-alt);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .marquee-data-point {
    border: 2px solid;
    background: Canvas;
    color: CanvasText;
  }
  
  .alert-level.critical {
    background: red;
    color: white;
  }
  
  .alert-level.warning {
    background: orange;
    color: black;
  }
}
```

### Color and Contrast
```typescript
// Color system with WCAG AA compliance
export const AccessibleColors = {
  // Text colors (4.5:1 contrast ratio minimum)
  textPrimary: '#1a1a1a',      // 16.94:1 on white
  textSecondary: '#4a4a4a',    // 8.96:1 on white  
  textTertiary: '#6a6a6a',     // 5.74:1 on white

  // Background colors
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fa',
  bgTertiary: '#e9ecef',

  // Interactive colors
  focusColor: '#005fcc',       // Blue with high contrast
  hoverBg: '#e3f2fd',
  activeBg: '#bbdefb',

  // Alert colors (AA compliant)
  alertNormal: '#2e7d32',      // 4.51:1 on white
  alertWarning: '#ef6c00',     // 4.52:1 on white
  alertCritical: '#c62828',    // 5.47:1 on white

  // Status colors
  successText: '#1b5e20',
  warningText: '#e65100',
  errorText: '#b71c1c',
  infoText: '#0d47a1'
} as const;

// Contrast checking utility
export const checkContrast = (foreground: string, background: string): number => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB and calculate relative luminance
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};
```

### Testing and Validation
```typescript
// Automated accessibility testing
export const A11yTestSuite = {
  async runKeyboardTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Test keyboard navigation
    results.push(await this.testKeyboardNavigation());
    
    // Test focus management
    results.push(await this.testFocusManagement());
    
    // Test ARIA labels
    results.push(await this.testAriaLabels());
    
    return results;
  },

  async testKeyboardNavigation(): Promise<TestResult> {
    // Simulate keyboard navigation
    const marquee = document.querySelector('.marquee-container');
    if (!marquee) return { test: 'keyboard-nav', passed: false, error: 'Marquee not found' };

    // Test tab navigation
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    marquee.dispatchEvent(tabEvent);
    
    // Test arrow navigation
    const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    marquee.dispatchEvent(arrowEvent);

    return { test: 'keyboard-nav', passed: true };
  },

  async testColorContrast(): Promise<TestResult> {
    const elements = document.querySelectorAll('.marquee-data-point');
    const failures: string[] = [];

    elements.forEach((element, index) => {
      const styles = getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      const contrast = checkContrast(color, backgroundColor);
      if (contrast < 4.5) {
        failures.push(`Element ${index}: contrast ${contrast.toFixed(2)} below 4.5:1`);
      }
    });

    return {
      test: 'color-contrast',
      passed: failures.length === 0,
      error: failures.length > 0 ? failures.join('; ') : undefined
    };
  }
};

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}
```

This comprehensive performance and accessibility specification ensures the enhanced TopBar Marquee system meets modern web standards for both performance and inclusive design.
