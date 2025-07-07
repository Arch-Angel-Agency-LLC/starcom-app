// Enhanced TypeScript interfaces for TopBar/Marquee upgrade
// Based on COMPONENT-INTERFACES.md specifications

// ============================================================================
// CORE DATA INTERFACES
// ============================================================================

export interface MarqueeDataPoint {
  // Core identification
  id: string;
  label: string;
  icon: string;
  value: string;
  
  // Current state (backward compatibility)
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  priority?: 'critical' | 'important' | 'standard';
  
  // Enhanced properties for upgrade
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
  showOnHover?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  richContent?: React.ReactNode;
}

// ============================================================================
// DETAILED DATA INTERFACES
// ============================================================================

export interface DetailedDataSet {
  id: string;
  title: string;
  category: string;
  
  // Core data
  currentValue: DetailedValue;
  historicalData: HistoricalDataPoint[];
  trend: TrendData;
  
  // Contextual information
  relatedCategories: RelatedCategory[];
  correlationData: CorrelationData[];
  insights: DataInsight[];
  
  // Metadata
  lastUpdated: Date;
  source: DataSource;
  reliability: 'high' | 'medium' | 'low';
  
  // Earth Alliance context
  earthAllianceImpact?: EarthAllianceImpact;
  geopoliticalContext?: GeopoliticalContext;
}

export interface DetailedValue {
  raw: number;
  formatted: string;
  unit: string;
  precision: number;
  changeFromPrevious?: {
    absolute: number;
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export interface HistoricalDataPoint {
  timestamp: Date;
  value: number;
  source?: string;
  note?: string;
}

export interface TrendData {
  direction: 'up' | 'down' | 'sideways';
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number; // 0-1
  period: '24h' | '7d' | '30d' | '90d' | '1y';
  changePercent: number;
  movingAverage?: number;
  volatility?: number;
}

export interface RelatedCategory {
  id: string;
  title: string;
  correlationStrength: number; // -1 to 1
  correlationType: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface CorrelationData {
  categoryId: string;
  categoryName: string;
  correlation: number; // -1 to 1
  significance: number; // 0-1
  timeframe: string;
  explanation: string;
}

export interface DataInsight {
  type: 'trend' | 'correlation' | 'anomaly' | 'forecast' | 'context';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  actionable?: boolean;
  earthAllianceRelevance?: string;
}

export interface DataSource {
  name: string;
  url?: string;
  lastUpdate: Date;
  frequency: string;
  reliability: 'high' | 'medium' | 'low';
}

export interface EarthAllianceImpact {
  relevanceScore: number; // 0-1
  impactAreas: string[];
  strategicImportance: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface GeopoliticalContext {
  regions: string[];
  tensions: string[];
  implications: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// DRAG SYSTEM INTERFACES
// ============================================================================

export interface DragState {
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  momentum: number;
  lastMoveTime: number;
}

export interface DragConstraints {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  snapToGrid?: boolean;
  gridSize?: number;
}

export interface DragPhysics {
  friction: number; // 0-1
  elasticity: number; // 0-1
  snapBackSpeed: number;
  momentumDecay: number; // 0-1
  velocityThreshold: number;
}

export interface DragCallbacks {
  onDragStart?: (state: DragState) => void;
  onDragMove?: (state: DragState) => void;
  onDragEnd?: (state: DragState) => void;
  onMomentumStart?: (state: DragState) => void;
  onMomentumEnd?: (state: DragState) => void;
}

// ============================================================================
// ENHANCED SETTINGS INTERFACES
// ============================================================================

export interface SettingsTab {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType<SettingsTabProps>;
  badge?: number;
  disabled?: boolean;
}

export interface SettingsTabProps {
  categories: CategoryConfig[];
  preferences: TopBarPreferences;
  onPreferenceChange: (key: string, value: unknown) => void;
  onCategoryToggle: (categoryId: string, enabled: boolean) => void;
}

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string;
  description: string;
  subcategories?: SubcategoryConfig[];
  dataSource: string;
  updateFrequency: string;
  earthAllianceRelevance?: number; // 0-1
}

export interface SubcategoryConfig {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  dependencies?: string[];
}

export interface TopBarPreferences {
  enabledCategories: Record<string, boolean>;
  marqueeSpeed: number;
  autoScrollEnabled: boolean;
  clickToNavigateEnabled: boolean;
  showBadges: boolean;
  showTooltips: boolean;
  alertLevels: ('normal' | 'warning' | 'critical')[];
  colorTheme: 'auto' | 'light' | 'dark' | 'earth-alliance';
  densityMode: 'compact' | 'normal' | 'comfortable';
  animationLevel: 'none' | 'reduced' | 'normal' | 'enhanced';
}

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
}

export interface MultiSelectOption extends DropdownOption {
  selected: boolean;
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseDraggableMarqueeReturn {
  dragState: DragState;
  dragHandlers: {
    onMouseDown: (event: React.MouseEvent) => void;
    onMouseMove: (event: React.MouseEvent) => void;
    onMouseUp: (event: React.MouseEvent) => void;
    onTouchStart: (event: React.TouchEvent) => void;
    onTouchMove: (event: React.TouchEvent) => void;
    onTouchEnd: (event: React.TouchEvent) => void;
  };
  isDragging: boolean;
  hasStarted: boolean;
  momentum: number;
  resetDrag: () => void;
}

export interface UseDetailedCategoryDataReturn {
  detailedData: DetailedDataSet | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export interface UseRelatedCategoriesReturn {
  relatedCategories: RelatedCategory[];
  correlationData: CorrelationData[];
  loading: boolean;
  error: string | null;
  refreshCorrelations: () => Promise<void>;
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

export interface MarqueeProps {
  dataPoints: MarqueeDataPoint[];
  loading?: boolean;
  error?: string | null;
  loadingStates?: Record<string, boolean>;
  dataAvailability?: Record<string, boolean>;
  partialData?: boolean;
  criticalDataLoaded?: boolean;
  
  // Enhanced props for upgrade
  isDraggable?: boolean;
  onDataPointClick?: (dataPoint: MarqueeDataPoint) => void;
  onDataPointHover?: (dataPoint: MarqueeDataPoint) => void;
  customClassName?: string;
  onOpenSettings?: (dataPointId?: string) => void; // Add settings callback
}

export interface EnhancedSettingsPopupProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryConfig[];
  enabledCategories: Record<string, boolean>;
  onCategoryToggle: (categoryId: string, enabled: boolean) => void;
  preferences?: TopBarPreferences;
  onPreferenceChange?: (key: string, value: unknown) => void;
  
  // Enhanced props for upgrade
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  allowDragReorder?: boolean;
  showAdvancedOptions?: boolean;
}

export interface DetailedDataPopupProps {
  open: boolean;
  onClose: () => void;
  dataPoint: MarqueeDataPoint;
  detailedData: DetailedDataSet;
  relatedCategories: RelatedCategory[];
  onNavigateToCategory?: (categoryId: string) => void;
  showCorrelations?: boolean;
  showInsights?: boolean;
}

// ============================================================================
// EVENT INTERFACES
// ============================================================================

export interface MarqueeClickEvent {
  dataPoint: MarqueeDataPoint;
  clickPosition: { x: number; y: number };
  timestamp: Date;
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

export interface MarqueeHoverEvent {
  dataPoint: MarqueeDataPoint;
  hoverPosition: { x: number; y: number };
  timestamp: Date;
  isEntering: boolean;
}

export interface SettingsChangeEvent {
  category: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
}
