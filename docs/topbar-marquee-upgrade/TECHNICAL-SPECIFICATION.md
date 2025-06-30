# Technical Specification: Enhanced TopBar Marquee System

## 🏗️ Architecture Overview

### System Components
```
TopBar Marquee System
├── Core Components
│   ├── TopBar.tsx (Modified)
│   ├── Marquee.tsx (Enhanced) 
│   └── EnhancedSettingsPopup.tsx (Major Upgrade)
├── New Hooks
│   ├── useDraggableMarquee.ts
│   ├── useDetailedCategoryData.ts
│   ├── useRelatedCategories.ts
│   └── useSettingsTabs.ts
├── New Components
│   ├── CategoryDropdown.tsx
│   ├── DetailedCategoryView.tsx
│   ├── TabNavigation.tsx
│   └── DragIndicator.tsx
└── Enhanced Data Layer
    ├── DetailedDataSet interfaces
    ├── Correlation algorithms
    └── Trend analysis
```

## 📊 Data Architecture

### Enhanced Data Point Interface
```typescript
export interface MarqueeDataPoint {
  // Core Properties
  id: string;
  label: string;
  icon: string;
  value: string;
  
  // State Properties
  isLoading?: boolean;
  hasError?: boolean;
  priority?: 'critical' | 'important' | 'standard';
  
  // New Enhanced Properties
  onClick?: (dataPoint: MarqueeDataPoint) => void;
  detailedData?: DetailedDataSet;
  relatedDataPoints?: string[];
  historicalTrend?: TrendData;
  alertLevel?: 'normal' | 'warning' | 'critical';
  lastUpdated?: Date;
  metadata?: DataPointMetadata;
}

export interface DetailedDataSet {
  primaryMetrics: MetricData[];
  secondaryMetrics: MetricData[];
  contextualInfo: ContextualData[];
  correlatedCategories: CorrelationData[];
  recommendations?: RecommendationData[];
  alertHistory?: AlertEvent[];
}

export interface MetricData {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
  description?: string;
  importance?: 'primary' | 'secondary' | 'tertiary';
}

export interface CorrelationData {
  categoryId: string;
  categoryLabel: string;
  correlationStrength: number; // -1 to 1
  description: string;
  historicalPattern?: string;
}

export interface TrendData {
  timeRange: '1h' | '24h' | '7d' | '30d' | '1y';
  dataPoints: { timestamp: Date; value: number }[];
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: 'low' | 'medium' | 'high';
  key_events?: TrendEvent[];
}
```

### Drag Physics System
```typescript
export interface DragState {
  // Drag Status
  isDragging: boolean;
  isReleaseAnimating: boolean;
  
  // Position & Movement
  dragOffset: number;
  velocity: number;
  lastMouseX: number;
  startX: number;
  
  // Animation
  releaseAnimationId?: number;
  animationStartTime?: number;
  
  // Configuration
  dragSensitivity: number;
  maxVelocity: number;
  returnAnimationDuration: number;
}

export interface DragPhysics {
  // Momentum calculation
  calculateVelocity: (currentX: number, deltaTime: number) => number;
  
  // Spring animation
  calculateSpringPosition: (
    currentOffset: number, 
    targetOffset: number, 
    progress: number
  ) => number;
  
  // Easing functions
  easeOutCubic: (progress: number) => number;
  easeInOutQuart: (progress: number) => number;
}
```

## 🖱️ Interaction System

### Drag Event Handling
```typescript
export interface DragHandlers {
  // Mouse Events
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseUp: (event: React.MouseEvent) => void;
  onMouseLeave: (event: React.MouseEvent) => void;
  
  // Touch Events
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
  onTouchCancel: (event: React.TouchEvent) => void;
  
  // Keyboard Events (Accessibility)
  onKeyDown: (event: React.KeyboardEvent) => void;
  onKeyUp: (event: React.KeyboardEvent) => void;
}

export interface ClickDetection {
  // Click vs Drag discrimination
  clickThreshold: number; // Max pixels moved to register as click
  clickTimeThreshold: number; // Max time for click (vs hold)
  
  // Click handlers
  onDataPointClick: (dataPoint: MarqueeDataPoint, event: Event) => void;
  onBackgroundClick: (event: Event) => void;
}
```

## 📱 Multi-Tab Settings Interface

### Tab System Architecture
```typescript
export enum SettingsTabs {
  CATEGORIES = 'categories',
  DETAILED_VIEW = 'detailed',
  PREFERENCES = 'preferences',
  ALERTS = 'alerts'
}

export interface TabConfig {
  id: SettingsTabs;
  label: string;
  icon: string;
  component: React.ComponentType<TabProps>;
  defaultProps?: Record<string, any>;
  requiresData?: boolean;
  accessLevel?: 'basic' | 'advanced' | 'expert';
}

export interface TabNavigationState {
  activeTab: SettingsTabs;
  previousTab?: SettingsTabs;
  tabHistory: SettingsTabs[];
  canGoBack: boolean;
  canGoForward: boolean;
}
```

### Enhanced Category Controls
```typescript
export interface CategoryControl {
  type: 'toggle' | 'dropdown' | 'slider' | 'multi-select' | 'button-group';
  
  // Common properties
  label: string;
  description?: string;
  dependencies?: string[];
  
  // Type-specific properties
  options?: DropdownOption[];
  range?: { min: number; max: number; step: number };
  defaultValue?: any;
  validation?: (value: any) => boolean | string;
  
  // Advanced features
  conditional?: (state: any) => boolean;
  preview?: boolean;
  realTime?: boolean;
}

export interface DropdownOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
}
```

## 🎨 Animation System

### CSS Custom Properties
```css
:root {
  /* Drag Animation */
  --marquee-drag-transition: transform 0.1s ease-out;
  --marquee-release-duration: 0.8s;
  --marquee-spring-timing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  /* Click Feedback */
  --datapoint-hover-scale: 1.05;
  --datapoint-click-scale: 0.95;
  --datapoint-transition: all 0.2s ease;
  
  /* Popup Animations */
  --popup-enter-duration: 0.3s;
  --popup-exit-duration: 0.2s;
  --popup-slide-distance: 20px;
  
  /* Color System */
  --alert-normal: #10b981;
  --alert-warning: #f59e0b;
  --alert-critical: #ef4444;
  --correlation-strong: #3b82f6;
  --correlation-medium: #6366f1;
  --correlation-weak: #8b5cf6;
}
```

### Animation Utilities
```typescript
export class AnimationManager {
  private activeAnimations: Map<string, number> = new Map();
  
  // Start animation with cleanup
  startAnimation(
    id: string,
    animationFn: (progress: number) => void,
    duration: number,
    easing?: (t: number) => number
  ): void;
  
  // Cancel specific animation
  cancelAnimation(id: string): void;
  
  // Cancel all animations
  cancelAllAnimations(): void;
  
  // Performance monitoring
  getActiveAnimationCount(): number;
  getPerformanceMetrics(): AnimationMetrics;
}
```

## 🔍 Data Discovery System

### Category Correlation Engine
```typescript
export interface CorrelationEngine {
  // Calculate correlation between categories
  calculateCorrelation(
    categoryA: string, 
    categoryB: string, 
    timeRange?: string
  ): Promise<CorrelationData>;
  
  // Find related categories
  findRelatedCategories(
    categoryId: string, 
    threshold?: number
  ): Promise<CorrelationData[]>;
  
  // Historical pattern analysis
  analyzeHistoricalPatterns(
    categoryId: string,
    timeRange: string
  ): Promise<PatternAnalysis>;
}

export interface PatternAnalysis {
  cyclical: boolean;
  seasonality?: 'monthly' | 'quarterly' | 'yearly';
  volatilityPattern: 'increasing' | 'decreasing' | 'stable';
  anomalies: AnomalyEvent[];
  predictiveIndicators: string[];
}
```

## 📊 Performance Specifications

### Target Metrics
```typescript
export interface PerformanceTargets {
  // Animation Performance
  frameRate: 60; // fps
  maxFrameTime: 16.67; // ms
  dragResponseTime: 8; // ms
  
  // Interaction Performance
  clickResponseTime: 100; // ms
  popupOpenTime: 200; // ms
  tabSwitchTime: 150; // ms
  
  // Memory Usage
  maxMemoryUsage: 100; // MB
  memoryLeakThreshold: 5; // MB over 5 minutes
  
  // Network Performance
  maxDataFetchTime: 1000; // ms
  cacheHitRatio: 0.8; // 80% cache hits
}
```

### Performance Monitoring
```typescript
export class PerformanceMonitor {
  // FPS monitoring
  startFPSMonitoring(): void;
  getFPSStats(): { current: number; average: number; min: number };
  
  // Memory monitoring
  getMemoryUsage(): MemoryInfo;
  checkForLeaks(): boolean;
  
  // Interaction timing
  measureInteractionTime(type: string, startTime: number): void;
  getInteractionStats(type: string): InteractionStats;
}
```

## 🔐 Security & Data Privacy

### Data Handling
```typescript
export interface DataSecurity {
  // Sensitive data identification
  identifySensitiveData(data: any): string[];
  
  // Data sanitization
  sanitizeForDisplay(data: any): any;
  sanitizeForStorage(data: any): any;
  
  // Privacy controls
  anonymizeUserData(data: any): any;
  respectPrivacySettings(data: any): any;
}
```

## 🧪 Testing Strategy

### Test Categories
```typescript
export interface TestSuite {
  // Unit Tests
  componentTests: ComponentTest[];
  hookTests: HookTest[];
  utilityTests: UtilityTest[];
  
  // Integration Tests
  dragInteractionTests: InteractionTest[];
  popupNavigationTests: NavigationTest[];
  dataFlowTests: DataTest[];
  
  // Performance Tests
  animationPerformanceTests: PerformanceTest[];
  memoryLeakTests: MemoryTest[];
  
  // Accessibility Tests
  keyboardNavigationTests: A11yTest[];
  screenReaderTests: A11yTest[];
  colorContrastTests: A11yTest[];
}
```

## 🎯 Success Criteria

### Functional Requirements
- ✅ Smooth 60fps drag animations with momentum
- ✅ Click data point → opens relevant detailed view
- ✅ Multi-tab settings with rich dropdown controls
- ✅ Related data discovery and correlation
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Accessibility compliance (WCAG 2.1 AA)

### Performance Requirements
- ✅ <200ms popup opening time
- ✅ <100MB memory usage
- ✅ 60fps animation performance
- ✅ No memory leaks over extended use

### User Experience Requirements
- ✅ Intuitive drag-and-release behavior
- ✅ Clear visual feedback for all interactions
- ✅ Fast information discovery
- ✅ No regression in existing functionality
