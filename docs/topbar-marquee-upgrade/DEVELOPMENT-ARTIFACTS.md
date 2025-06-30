# Development Artifacts & Code Templates

## 🧩 Component Templates

### useDraggableMarquee Hook Template
```typescript
// hooks/useDraggableMarquee.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { DragState, DragConfiguration, DragCallbacks } from '../types/interfaces';

interface UseDraggableMarqueeReturn {
  dragState: DragState;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  containerProps: {
    style: React.CSSProperties;
    'data-dragging': boolean;
    'data-animating': boolean;
  };
  pauseMarquee: () => void;
  resumeMarquee: () => void;
  resetPosition: () => void;
}

export const useDraggableMarquee = (
  config: Partial<DragConfiguration> = {},
  callbacks: DragCallbacks = {}
): UseDraggableMarqueeReturn => {
  // Default configuration
  const defaultConfig: DragConfiguration = {
    dragSensitivity: 1.0,
    maxVelocity: 10,
    momentumFriction: 0.95,
    snapBackThreshold: 50,
    returnAnimationDuration: 800,
    easingFunction: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
    clickThreshold: 5,
    clickTimeThreshold: 200,
    longPressThreshold: 500,
    updateFrequency: 60,
    throttleUpdates: true
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  // State management
  const [dragState, setDragState] = useState<DragState>({
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
    dragSensitivity: finalConfig.dragSensitivity,
    maxVelocity: finalConfig.maxVelocity,
    returnAnimationDuration: finalConfig.returnAnimationDuration,
    momentumFriction: finalConfig.momentumFriction
  });

  // Refs for animation and cleanup
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  // TODO: Implement drag logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Implementation needed
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Implementation needed
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Implementation needed
  }, []);

  // TODO: Implement touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Implementation needed
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Implementation needed
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Implementation needed
  }, []);

  // Control functions
  const pauseMarquee = useCallback(() => {
    setDragState(prev => ({ ...prev, isPaused: true }));
    callbacks.onPause?.(dragState);
  }, [dragState, callbacks]);

  const resumeMarquee = useCallback(() => {
    setDragState(prev => ({ ...prev, isPaused: false }));
    callbacks.onResume?.(dragState);
  }, [dragState, callbacks]);

  const resetPosition = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dragOffset: 0,
      velocity: 0,
      acceleration: 0,
      isDragging: false,
      isReleaseAnimating: false
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    dragState,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    containerProps: {
      style: {
        transform: `translateX(${dragState.dragOffset}px)`,
        transition: dragState.isReleaseAnimating 
          ? `transform ${finalConfig.returnAnimationDuration}ms ${finalConfig.easingFunction}`
          : 'none',
        cursor: dragState.isDragging ? 'grabbing' : 'grab'
      },
      'data-dragging': dragState.isDragging,
      'data-animating': dragState.isReleaseAnimating
    },
    pauseMarquee,
    resumeMarquee,
    resetPosition
  };
};
```

### DetailedCategoryView Component Template
```typescript
// components/DetailedCategoryView.tsx
import React, { useState, useMemo } from 'react';
import { MarqueeDataPoint, DetailedDataSet, CorrelationData } from '../types/interfaces';
import { useDetailedCategoryData } from '../hooks/useDetailedCategoryData';
import { formatMetricValue, calculateTrendDirection } from '../utils/dataFormatting';

interface DetailedCategoryViewProps {
  category: MarqueeDataPoint;
  onRelatedCategoryClick?: (categoryId: string) => void;
  onClose?: () => void;
  className?: string;
}

export const DetailedCategoryView: React.FC<DetailedCategoryViewProps> = ({
  category,
  onRelatedCategoryClick,
  onClose,
  className = ''
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'metrics' | 'correlations' | 'recommendations'>('overview');
  
  const { 
    detailedData, 
    isLoading, 
    error,
    refresh 
  } = useDetailedCategoryData(category.id);

  const sortedCorrelations = useMemo(() => {
    if (!detailedData?.correlatedCategories) return [];
    return [...detailedData.correlatedCategories]
      .sort((a, b) => Math.abs(b.correlationStrength) - Math.abs(a.correlationStrength));
  }, [detailedData]);

  if (isLoading) {
    return (
      <div className={`detailed-category-view loading ${className}`}>
        <div className="loading-spinner">
          <span>Loading detailed data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`detailed-category-view error ${className}`}>
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`detailed-category-view ${className}`}>
      {/* Header */}
      <div className="category-header">
        <div className="category-title">
          <span className="category-icon">{category.icon}</span>
          <h2>{category.label}</h2>
          <span className={`alert-level ${category.alertLevel}`}>
            {category.alertLevel?.toUpperCase()}
          </span>
        </div>
        <div className="category-actions">
          <button onClick={refresh} aria-label="Refresh data">
            🔄
          </button>
          {onClose && (
            <button onClick={onClose} aria-label="Close detailed view">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Current Value & Trend */}
      <div className="current-value-section">
        <div className="current-value">
          <span className="value">{category.value}</span>
          {category.lastUpdated && (
            <span className="last-updated">
              Updated {formatTimeAgo(category.lastUpdated)}
            </span>
          )}
        </div>
        {category.historicalTrend && (
          <div className="trend-indicator">
            <TrendChart data={category.historicalTrend} />
          </div>
        )}
      </div>

      {/* Section Navigation */}
      <div className="section-navigation">
        {['overview', 'metrics', 'correlations', 'recommendations'].map(section => (
          <button
            key={section}
            className={`nav-button ${activeSection === section ? 'active' : ''}`}
            onClick={() => setActiveSection(section as any)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="section-content">
        {activeSection === 'overview' && (
          <OverviewSection 
            category={category} 
            detailedData={detailedData} 
          />
        )}
        
        {activeSection === 'metrics' && (
          <MetricsSection 
            primaryMetrics={detailedData?.primaryMetrics || []}
            secondaryMetrics={detailedData?.secondaryMetrics || []}
          />
        )}
        
        {activeSection === 'correlations' && (
          <CorrelationsSection 
            correlations={sortedCorrelations}
            onCategoryClick={onRelatedCategoryClick}
          />
        )}
        
        {activeSection === 'recommendations' && (
          <RecommendationsSection 
            recommendations={detailedData?.recommendations || []}
          />
        )}
      </div>
    </div>
  );
};

// TODO: Implement sub-components
const OverviewSection: React.FC<any> = ({ category, detailedData }) => {
  return <div>Overview section - TODO</div>;
};

const MetricsSection: React.FC<any> = ({ primaryMetrics, secondaryMetrics }) => {
  return <div>Metrics section - TODO</div>;
};

const CorrelationsSection: React.FC<any> = ({ correlations, onCategoryClick }) => {
  return <div>Correlations section - TODO</div>;
};

const RecommendationsSection: React.FC<any> = ({ recommendations }) => {
  return <div>Recommendations section - TODO</div>;
};

const TrendChart: React.FC<any> = ({ data }) => {
  return <div>Trend chart - TODO</div>;
};

// Utility function - TODO: move to utils
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
```

### Enhanced Settings Popup Template
```typescript
// components/EnhancedSettingsPopup.tsx
import React, { useState, useCallback, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { SettingsTabs, TabConfig, TabNavigationState } from '../types/interfaces';
import { TabNavigation } from './TabNavigation';
import { DetailedCategoryView } from './DetailedCategoryView';

interface EnhancedSettingsPopupProps {
  open: boolean;
  selectedCategory?: string;
  onClose: () => void;
  onCategoryToggle?: (id: string, enabled: boolean) => void;
  enabledCategories?: Record<string, boolean>;
  categories?: any[];
}

export const EnhancedSettingsPopup: React.FC<EnhancedSettingsPopupProps> = ({
  open,
  selectedCategory,
  onClose,
  onCategoryToggle,
  enabledCategories = {},
  categories = []
}) => {
  // Tab configuration
  const tabConfigs: TabConfig[] = [
    {
      id: SettingsTabs.CATEGORIES,
      label: 'Categories',
      icon: '📊',
      description: 'Configure visible data categories',
      component: CategoriesTab,
      ariaLabel: 'Configure data categories',
      accessLevel: 'basic',
      showInNavigation: true
    },
    {
      id: SettingsTabs.DETAILED_VIEW,
      label: 'Details',
      icon: '🔍',
      description: 'Detailed view of selected category',
      component: DetailedViewTab,
      ariaLabel: 'Detailed category view',
      accessLevel: 'basic',
      requiresData: true,
      showInNavigation: true
    },
    {
      id: SettingsTabs.PREFERENCES,
      label: 'Preferences',
      icon: '⚙️',
      description: 'Customize display and behavior',
      component: PreferencesTab,
      ariaLabel: 'Display and behavior preferences',
      accessLevel: 'advanced',
      showInNavigation: true
    },
    {
      id: SettingsTabs.ALERTS,
      label: 'Alerts',
      icon: '🚨',
      description: 'Configure notifications and thresholds',
      component: AlertsTab,
      ariaLabel: 'Alert configuration',
      accessLevel: 'advanced',
      showInNavigation: true
    }
  ];

  // State management
  const [navigationState, setNavigationState] = useState<TabNavigationState>({
    activeTab: selectedCategory ? SettingsTabs.DETAILED_VIEW : SettingsTabs.CATEGORIES,
    availableTabs: tabConfigs.filter(config => config.showInNavigation).map(config => config.id),
    tabHistory: [],
    canGoBack: false,
    canGoForward: false,
    canClose: true,
    tabData: {},
    isLoading: {},
    hasError: {}
  });

  // Effect to handle selectedCategory changes
  useEffect(() => {
    if (selectedCategory && open) {
      handleTabChange(SettingsTabs.DETAILED_VIEW);
      setNavigationState(prev => ({
        ...prev,
        tabData: {
          ...prev.tabData,
          [SettingsTabs.DETAILED_VIEW]: { selectedCategory }
        }
      }));
    }
  }, [selectedCategory, open]);

  // Tab navigation handlers
  const handleTabChange = useCallback((newTab: SettingsTabs) => {
    setNavigationState(prev => {
      const newHistory = prev.activeTab !== newTab 
        ? [...prev.tabHistory, prev.activeTab]
        : prev.tabHistory;
      
      return {
        ...prev,
        activeTab: newTab,
        previousTab: prev.activeTab,
        tabHistory: newHistory,
        canGoBack: newHistory.length > 0
      };
    });
  }, []);

  const handleGoBack = useCallback(() => {
    setNavigationState(prev => {
      if (prev.tabHistory.length === 0) return prev;
      
      const newHistory = [...prev.tabHistory];
      const previousTab = newHistory.pop();
      
      return {
        ...prev,
        activeTab: previousTab!,
        tabHistory: newHistory,
        canGoBack: newHistory.length > 0
      };
    });
  }, []);

  // Close handlers
  const handleClose = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      activeTab: SettingsTabs.CATEGORIES,
      tabHistory: [],
      tabData: {},
      canGoBack: false
    }));
    onClose();
  }, [onClose]);

  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [open, handleEscapeKey]);

  if (!open) return null;

  const activeTabConfig = tabConfigs.find(config => config.id === navigationState.activeTab);
  const ActiveTabComponent = activeTabConfig?.component;

  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="enhanced-settings-popup-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="enhanced-settings-popup">
          {/* Header */}
          <div className="popup-header">
            <h2 id="settings-modal-title" className="popup-title">
              <span className="title-icon">⚙️</span>
              Enhanced Settings
            </h2>
            <div className="header-actions">
              {navigationState.canGoBack && (
                <button 
                  onClick={handleGoBack}
                  aria-label="Go back to previous tab"
                  className="back-button"
                >
                  ← Back
                </button>
              )}
              <button 
                onClick={handleClose}
                aria-label="Close settings"
                className="close-button"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <TabNavigation
            tabs={tabConfigs.filter(config => config.showInNavigation)}
            activeTab={navigationState.activeTab}
            onTabChange={handleTabChange}
            navigationState={navigationState}
          />

          {/* Tab Content */}
          <div className="tab-content">
            {ActiveTabComponent && (
              <ActiveTabComponent
                isActive={true}
                selectedCategory={navigationationState.tabData[SettingsTabs.DETAILED_VIEW]?.selectedCategory}
                onCategorySelect={(categoryId: string) => {
                  setNavigationState(prev => ({
                    ...prev,
                    tabData: {
                      ...prev.tabData,
                      [SettingsTabs.DETAILED_VIEW]: { selectedCategory: categoryId }
                    }
                  }));
                  handleTabChange(SettingsTabs.DETAILED_VIEW);
                }}
                onNavigate={handleTabChange}
                sharedData={navigationState.tabData}
                // Tab-specific props
                enabledCategories={enabledCategories}
                onCategoryToggle={onCategoryToggle}
                categories={categories}
              />
            )}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

// TODO: Implement tab components
const CategoriesTab: React.FC<any> = (props) => {
  return <div>Categories tab - TODO</div>;
};

const DetailedViewTab: React.FC<any> = (props) => {
  return <div>Detailed view tab - TODO</div>;
};

const PreferencesTab: React.FC<any> = (props) => {
  return <div>Preferences tab - TODO</div>;
};

const AlertsTab: React.FC<any> = (props) => {
  return <div>Alerts tab - TODO</div>;
};
```

## 🎨 CSS Templates

### Drag Animation Styles
```css
/* styles/drag-animations.css */

:root {
  /* Drag Physics */
  --drag-transition-duration: 0.1s;
  --drag-spring-timing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --drag-momentum-duration: 0.8s;
  
  /* Visual Feedback */
  --drag-cursor-grabbing: grabbing;
  --drag-cursor-grab: grab;
  --drag-opacity-active: 0.9;
  --drag-scale-active: 1.02;
  
  /* Performance */
  --will-change-transform: transform;
  --gpu-acceleration: translateZ(0);
}

.marquee-container {
  /* Enable hardware acceleration */
  transform: var(--gpu-acceleration);
  will-change: var(--will-change-transform);
  
  /* Cursor states */
  cursor: var(--drag-cursor-grab);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  /* Smooth transitions */
  transition: opacity var(--drag-transition-duration) ease;
}

.marquee-container[data-dragging="true"] {
  cursor: var(--drag-cursor-grabbing);
  opacity: var(--drag-opacity-active);
  transform: scale(var(--drag-scale-active)) var(--gpu-acceleration);
}

.marquee-container[data-animating="true"] {
  transition: transform var(--drag-momentum-duration) var(--drag-spring-timing);
}

/* Data point interactions */
.marquee-data-point {
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.marquee-data-point:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.marquee-data-point:active {
  transform: scale(0.95);
}

.marquee-data-point.critical {
  border-color: var(--alert-critical);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.marquee-data-point.warning {
  border-color: var(--alert-warning);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

/* Drag indicator */
.drag-indicator {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.marquee-container:hover .drag-indicator {
  opacity: 0.6;
}

.marquee-container[data-dragging="true"] .drag-indicator {
  opacity: 1;
}

/* Performance optimizations */
@media (prefers-reduced-motion: reduce) {
  .marquee-container,
  .marquee-data-point {
    transition: none;
  }
  
  .marquee-container[data-animating="true"] {
    transition: none;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .marquee-container {
    cursor: default;
  }
  
  .marquee-data-point:hover {
    transform: none;
    box-shadow: none;
  }
  
  .marquee-data-point:active {
    transform: scale(0.98);
    background-color: rgba(255, 255, 255, 0.1);
  }
}
```

### Enhanced Settings Popup Styles
```css
/* styles/enhanced-settings.css */

.enhanced-settings-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.enhanced-settings-popup {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.popup-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.back-button,
.close-button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover,
.close-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-primary);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-navigation::-webkit-scrollbar {
  display: none;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
}

.tab-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-button.active {
  color: var(--accent-primary);
  background: var(--bg-secondary);
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-primary);
}

/* Tab Content */
.tab-content {
  padding: 24px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

/* Detailed Category View */
.detailed-category-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  font-size: 1.5rem;
}

.alert-level {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.alert-level.normal {
  background: var(--success-bg);
  color: var(--success-text);
}

.alert-level.warning {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.alert-level.critical {
  background: var(--error-bg);
  color: var(--error-text);
}

.current-value-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.current-value .value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.last-updated {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* Section Navigation */
.section-navigation {
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 4px;
}

.nav-button {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.nav-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-button.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .enhanced-settings-popup {
    width: 95vw;
    max-height: 95vh;
    margin: 2.5vh;
  }
  
  .popup-header {
    padding: 16px 20px;
  }
  
  .tab-content {
    padding: 20px;
  }
  
  .current-value-section {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .section-navigation {
    flex-wrap: wrap;
  }
  
  .nav-button {
    min-width: calc(50% - 2px);
  }
}

@media (max-width: 480px) {
  .popup-title {
    font-size: 1.125rem;
  }
  
  .tab-button {
    padding: 10px 16px;
    font-size: 0.875rem;
  }
  
  .current-value .value {
    font-size: 1.5rem;
  }
}
```

## 🧪 Test Templates

### Drag System Tests
```typescript
// __tests__/useDraggableMarquee.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDraggableMarquee } from '../hooks/useDraggableMarquee';

describe('useDraggableMarquee', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDraggableMarquee());
    
    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.dragOffset).toBe(0);
    expect(result.current.dragState.velocity).toBe(0);
  });

  it('should handle mouse down event', () => {
    const { result } = renderHook(() => useDraggableMarquee());
    
    const mockEvent = {
      clientX: 100,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    } as any;

    act(() => {
      result.current.dragHandlers.onMouseDown(mockEvent);
    });

    expect(result.current.dragState.isDragging).toBe(true);
    expect(result.current.dragState.startX).toBe(100);
  });

  it('should calculate velocity on drag', () => {
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
    expect(result.current.dragState.velocity).toBeGreaterThan(0);
  });

  it('should animate on release', () => {
    const onMomentumStart = jest.fn();
    const { result } = renderHook(() => 
      useDraggableMarquee({}, { onMomentumStart })
    );
    
    // Start and end drag
    act(() => {
      result.current.dragHandlers.onMouseDown({ clientX: 100 } as any);
      result.current.dragHandlers.onMouseMove({ clientX: 200 } as any);
      result.current.dragHandlers.onMouseUp({} as any);
    });

    expect(result.current.dragState.isReleaseAnimating).toBe(true);
    expect(onMomentumStart).toHaveBeenCalled();
  });

  it('should pause and resume marquee', () => {
    const { result } = renderHook(() => useDraggableMarquee());
    
    act(() => {
      result.current.pauseMarquee();
    });
    
    expect(result.current.dragState.isPaused).toBe(true);
    
    act(() => {
      result.current.resumeMarquee();
    });
    
    expect(result.current.dragState.isPaused).toBe(false);
  });

  it('should reset position', () => {
    const { result } = renderHook(() => useDraggableMarquee());
    
    // Set some state
    act(() => {
      result.current.dragHandlers.onMouseDown({ clientX: 100 } as any);
      result.current.dragHandlers.onMouseMove({ clientX: 200 } as any);
    });
    
    // Reset
    act(() => {
      result.current.resetPosition();
    });
    
    expect(result.current.dragState.dragOffset).toBe(0);
    expect(result.current.dragState.velocity).toBe(0);
    expect(result.current.dragState.isDragging).toBe(false);
  });
});
```

### Settings Popup Tests
```typescript
// __tests__/EnhancedSettingsPopup.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedSettingsPopup } from '../components/EnhancedSettingsPopup';
import { SettingsTabs } from '../types/interfaces';

describe('EnhancedSettingsPopup', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onCategoryToggle: jest.fn(),
    enabledCategories: {},
    categories: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<EnhancedSettingsPopup {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Enhanced Settings')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<EnhancedSettingsPopup {...defaultProps} open={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should show categories tab by default', () => {
    render(<EnhancedSettingsPopup {...defaultProps} />);
    
    expect(screen.getByText('Categories')).toHaveClass('active');
  });

  it('should switch to detailed view when category selected', () => {
    render(
      <EnhancedSettingsPopup 
        {...defaultProps} 
        selectedCategory="energy-security" 
      />
    );
    
    expect(screen.getByText('Details')).toHaveClass('active');
  });

  it('should handle tab switching', () => {
    render(<EnhancedSettingsPopup {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Preferences'));
    
    expect(screen.getByText('Preferences')).toHaveClass('active');
  });

  it('should handle back navigation', () => {
    render(<EnhancedSettingsPopup {...defaultProps} />);
    
    // Switch to preferences tab
    fireEvent.click(screen.getByText('Preferences'));
    
    // Go back
    fireEvent.click(screen.getByText('← Back'));
    
    expect(screen.getByText('Categories')).toHaveClass('active');
  });

  it('should close on escape key', () => {
    const onClose = jest.fn();
    render(<EnhancedSettingsPopup {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should close on overlay click', () => {
    const onClose = jest.fn();
    render(<EnhancedSettingsPopup {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should focus trap within modal', () => {
    render(<EnhancedSettingsPopup {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Focus should be trapped within the modal
    // This would require more complex testing with actual focus events
  });
});
```

## 📝 Development Checklist

### Phase 1: Setup & Architecture
- [ ] Create component file structure
- [ ] Set up TypeScript interfaces
- [ ] Create base CSS files
- [ ] Set up test files
- [ ] Configure development environment

### Phase 2: Drag Implementation  
- [ ] Implement useDraggableMarquee hook
- [ ] Add mouse event handlers
- [ ] Add touch event handlers
- [ ] Implement momentum physics
- [ ] Add spring-back animation
- [ ] Performance optimization

### Phase 3: Settings Enhancement
- [ ] Create TabNavigation component
- [ ] Implement tab state management
- [ ] Create DetailedCategoryView component
- [ ] Add rich control components
- [ ] Implement data integration

### Phase 4: Integration & Polish
- [ ] Integrate with existing TopBar
- [ ] Add click-to-navigate functionality
- [ ] Implement accessibility features
- [ ] Add responsive design
- [ ] Performance testing
- [ ] User acceptance testing

This comprehensive set of artifacts provides a solid foundation for implementing the enhanced TopBar Marquee system with all the planned features and functionality.
