# Component Interface Definitions

## 🎯 Core Component Interfaces

### Enhanced MarqueeDataPoint
```typescript
export interface MarqueeDataPoint {
  // Core identification
  id: string;
  label: string;
  icon: string;
  value: string;
  
  // Current state
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  priority?: 'critical' | 'important' | 'standard';
  
  // Enhanced properties
  onClick?: (dataPoint: MarqueeDataPoint) => void;
  onHover?: (dataPoint: MarqueeDataPoint) => void;
  detailedData?: DetailedDataSet;
  relatedDataPoints?: string[];
  historicalTrend?: TrendData;
  alertLevel?: 'normal' | 'warning' | 'critical';
  lastUpdated?: Date;
  metadata?: DataPointMetadata;
  
  // Visual customization
  customColor?: string;
  customIcon?: string;
  badge?: BadgeData;
  tooltip?: TooltipData;
}

export interface DataPointMetadata {
  source: string;
  updateFrequency: '1m' | '5m' | '15m' | '1h' | '1d';
  reliability: 'high' | 'medium' | 'low';
  category: string;
  subcategory?: string;
  tags: string[];
  earthAllianceContext?: string;
}

export interface BadgeData {
  text: string;
  color: 'success' | 'warning' | 'error' | 'info';
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface TooltipData {
  title: string;
  description: string;
  shortcut?: string;
  showOnHover: boolean;
}
```

### Detailed Data Set
```typescript
export interface DetailedDataSet {
  // Primary metrics (most important)
  primaryMetrics: MetricData[];
  
  // Secondary metrics (supporting data)
  secondaryMetrics: MetricData[];
  
  // Contextual information
  contextualInfo: ContextualData[];
  
  // Related categories
  correlatedCategories: CorrelationData[];
  
  // Actionable insights
  recommendations?: RecommendationData[];
  
  // Historical context
  alertHistory?: AlertEvent[];
  
  // Trends and patterns
  trendAnalysis?: TrendAnalysis;
  
  // External references
  externalLinks?: ExternalLink[];
}

export interface MetricData {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  
  // Trend information
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
  trendTimeframe?: string;
  
  // Presentation
  description?: string;
  importance?: 'primary' | 'secondary' | 'tertiary';
  format?: 'currency' | 'percentage' | 'number' | 'text';
  precision?: number;
  
  // Threshold monitoring
  thresholds?: {
    warning: number;
    critical: number;
    optimal?: number;
  };
  
  // Historical context
  historicalAverage?: number;
  percentileRank?: number;
}

export interface ContextualData {
  type: 'explanation' | 'analysis' | 'warning' | 'opportunity';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  timestamp?: Date;
  source?: string;
  references?: string[];
}

export interface CorrelationData {
  categoryId: string;
  categoryLabel: string;
  categoryIcon: string;
  
  // Correlation metrics
  correlationStrength: number; // -1 to 1
  correlationType: 'positive' | 'negative' | 'complex';
  confidence: number; // 0 to 1
  
  // Temporal aspects
  timeDelay?: number; // minutes
  historicalPattern?: string;
  
  // Presentation
  description: string;
  visualIndicator?: 'strong' | 'medium' | 'weak';
}

export interface RecommendationData {
  id: string;
  type: 'action' | 'monitor' | 'investigate' | 'alert';
  title: string;
  description: string;
  priority: 'critical' | 'important' | 'suggested';
  
  // Actionability
  actionable: boolean;
  estimatedImpact?: 'high' | 'medium' | 'low';
  timeframe?: string;
  
  // Links and resources
  relatedCategories?: string[];
  externalResources?: ExternalLink[];
}
```

### Drag System Interfaces
```typescript
export interface DragState {
  // Current drag status
  isDragging: boolean;
  isReleaseAnimating: boolean;
  isPaused: boolean;
  
  // Position tracking
  dragOffset: number;
  velocity: number;
  acceleration: number;
  
  // Mouse/touch tracking
  lastMouseX: number;
  startX: number;
  deltaX: number;
  
  // Timing
  lastUpdateTime: number;
  dragStartTime: number;
  
  // Animation
  releaseAnimationId?: number;
  animationStartTime?: number;
  animationProgress: number;
  
  // Configuration
  dragSensitivity: number;
  maxVelocity: number;
  returnAnimationDuration: number;
  momentumFriction: number;
}

export interface DragConfiguration {
  // Physics settings
  dragSensitivity: number; // Default: 1.0
  maxVelocity: number; // Default: 10
  momentumFriction: number; // Default: 0.95
  snapBackThreshold: number; // Default: 50
  
  // Animation settings
  returnAnimationDuration: number; // Default: 800ms
  easingFunction: (t: number) => number;
  
  // Interaction settings
  clickThreshold: number; // Default: 5px
  clickTimeThreshold: number; // Default: 200ms
  longPressThreshold: number; // Default: 500ms
  
  // Performance settings
  updateFrequency: number; // Default: 60fps
  throttleUpdates: boolean; // Default: true
}

export interface DragCallbacks {
  onDragStart?: (state: DragState) => void;
  onDragMove?: (state: DragState) => void;
  onDragEnd?: (state: DragState) => void;
  onMomentumStart?: (state: DragState) => void;
  onMomentumEnd?: (state: DragState) => void;
  onSnapBack?: (state: DragState) => void;
  onPause?: (state: DragState) => void;
  onResume?: (state: DragState) => void;
}
```

### Settings Interface System
```typescript
export enum SettingsTabs {
  CATEGORIES = 'categories',
  DETAILED_VIEW = 'detailed',
  PREFERENCES = 'preferences',
  ALERTS = 'alerts',
  ANALYTICS = 'analytics'
}

export interface TabConfig {
  id: SettingsTabs;
  label: string;
  icon: string;
  description: string;
  component: React.ComponentType<TabProps>;
  
  // Accessibility
  ariaLabel: string;
  ariaDescription?: string;
  
  // Permissions and access
  accessLevel?: 'basic' | 'advanced' | 'expert';
  requiresData?: boolean;
  requiresConnection?: boolean;
  
  // Behavior
  defaultProps?: Record<string, any>;
  preloadData?: boolean;
  cacheData?: boolean;
  
  // Navigation
  canNavigateFrom?: SettingsTabs[];
  canNavigateTo?: SettingsTabs[];
  showInNavigation?: boolean;
}

export interface TabProps {
  isActive: boolean;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
  onNavigate?: (tab: SettingsTabs) => void;
  sharedData?: Record<string, any>;
}

export interface TabNavigationState {
  activeTab: SettingsTabs;
  availableTabs: SettingsTabs[];
  previousTab?: SettingsTabs;
  tabHistory: SettingsTabs[];
  
  // Navigation capabilities
  canGoBack: boolean;
  canGoForward: boolean;
  canClose: boolean;
  
  // State management
  tabData: Record<SettingsTabs, any>;
  isLoading: Record<SettingsTabs, boolean>;
  hasError: Record<SettingsTabs, boolean>;
}
```

### Category Control System
```typescript
export interface CategoryControl {
  // Basic properties
  id: string;
  type: ControlType;
  label: string;
  description?: string;
  
  // Control-specific properties
  options?: DropdownOption[];
  range?: SliderRange;
  defaultValue?: any;
  currentValue?: any;
  
  // Behavior
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  
  // Validation
  validation?: ValidationRule[];
  customValidator?: (value: any) => ValidationResult;
  
  // Dependencies
  dependencies?: string[];
  conditionalDisplay?: (state: any) => boolean;
  
  // Advanced features
  preview?: boolean;
  realTimeUpdate?: boolean;
  showInSidebar?: boolean;
  
  // Help and guidance
  helpText?: string;
  tooltipText?: string;
  externalHelpUrl?: string;
}

export type ControlType = 
  | 'toggle'
  | 'dropdown'
  | 'multi-select'
  | 'slider'
  | 'number-input'
  | 'text-input'
  | 'button-group'
  | 'color-picker'
  | 'date-picker'
  | 'time-picker';

export interface DropdownOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
  metadata?: Record<string, any>;
}

export interface SliderRange {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  marks?: SliderMark[];
  showLabels?: boolean;
}

export interface SliderMark {
  value: number;
  label: string;
  style?: React.CSSProperties;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}
```

### Data Fetching and Caching
```typescript
export interface DataFetchingStrategy {
  // Fetch configuration
  fetchOnMount?: boolean;
  fetchOnFocus?: boolean;
  refetchInterval?: number;
  staleWhileRevalidate?: boolean;
  
  // Cache configuration
  cacheKey: string;
  cacheTime?: number; // ms
  staleTime?: number; // ms
  
  // Error handling
  retryCount?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  
  // Performance
  debounceMs?: number;
  throttleMs?: number;
  
  // Dependencies
  dependencies?: string[];
  enabled?: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  isStale: boolean;
  error?: Error;
  metadata?: {
    fetchTime: number;
    source: string;
    version: string;
  };
}

export interface DataState<T = any> {
  data?: T;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  isStale: boolean;
  lastUpdated?: Date;
  fetchCount: number;
}
```

### Animation and Transition System
```typescript
export interface AnimationConfig {
  // Basic animation properties
  duration: number;
  delay?: number;
  easing?: EasingFunction;
  loop?: boolean | number;
  
  // Animation type
  type: 'tween' | 'spring' | 'keyframes';
  
  // Spring physics (if type is 'spring')
  springConfig?: SpringConfig;
  
  // Keyframe animation (if type is 'keyframes')
  keyframes?: Keyframe[];
  
  // Callbacks
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  
  // Performance
  useGPU?: boolean;
  throttle?: boolean;
}

export interface SpringConfig {
  tension: number;
  friction: number;
  mass?: number;
  velocity?: number;
  precision?: number;
}

export interface Keyframe {
  offset: number; // 0 to 1
  value: any;
  easing?: EasingFunction;
}

export type EasingFunction = (t: number) => number;

export interface TransitionState {
  isAnimating: boolean;
  progress: number;
  currentValue: any;
  startValue: any;
  endValue: any;
  startTime: number;
  duration: number;
}
```

### Event System
```typescript
export interface EventEmitter {
  on<T = any>(event: string, callback: (data: T) => void): () => void;
  off(event: string, callback?: Function): void;
  emit<T = any>(event: string, data?: T): void;
  once<T = any>(event: string, callback: (data: T) => void): () => void;
  clear(): void;
}

export interface MarqueeEvents {
  'drag:start': DragState;
  'drag:move': DragState;
  'drag:end': DragState;
  'click:datapoint': { dataPoint: MarqueeDataPoint; event: Event };
  'hover:datapoint': { dataPoint: MarqueeDataPoint; event: Event };
  'animation:complete': { type: string; duration: number };
  'error': { error: Error; context: string };
  'performance:warning': { metric: string; value: number; threshold: number };
}

export interface SettingsEvents {
  'tab:change': { from: SettingsTabs; to: SettingsTabs };
  'category:toggle': { categoryId: string; enabled: boolean };
  'category:select': { categoryId: string; context: string };
  'control:change': { controlId: string; value: any; previousValue: any };
  'settings:save': { settings: any };
  'settings:reset': { scope: 'all' | 'tab' | 'category' };
}
```

## 🎯 Usage Examples

### Basic Enhanced Marquee Usage
```typescript
const MyTopBar: React.FC = () => {
  const { dataPoints, loading, error } = useTopBarData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>();

  const handleDataPointClick = (dataPoint: MarqueeDataPoint) => {
    setSelectedCategory(dataPoint.id);
    setSettingsOpen(true);
  };

  const enhancedDataPoints = dataPoints.map(dp => ({
    ...dp,
    onClick: handleDataPointClick,
    detailedData: useDetailedCategoryData(dp.id),
    relatedDataPoints: useRelatedCategories(dp.id)
  }));

  return (
    <TopBar>
      <EnhancedMarquee 
        dataPoints={enhancedDataPoints}
        dragEnabled={true}
        clickEnabled={true}
        animationConfig={{
          duration: 800,
          easing: easeOutCubic
        }}
      />
      <EnhancedSettingsPopup
        open={settingsOpen}
        selectedCategory={selectedCategory}
        onClose={() => setSettingsOpen(false)}
      />
    </TopBar>
  );
};
```
