// EnhancedSettingsPopup.tsx
// Phase 3: Multi-tab interface with rich controls and drag-and-drop functionality
import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { TopBarCategory } from './topbarCategories';
import { MarqueeDataPoint } from './interfaces';
import CategoriesTab from './SettingsTabs/CategoriesTab';
import DisplayTab from './SettingsTabs/DisplayTab';
import DataTab from './SettingsTabs/DataTab';
import AdvancedTab from './SettingsTabs/AdvancedTab';
import styles from './EnhancedSettingsPopup.module.css';

export interface EnhancedSettingsPopupRef {
  navigateToDataPoint: (dataPointId: string) => void;
}

export interface EnhancedSettingsPopupProps {
  open: boolean;
  enabledCategories: Record<string, boolean>;
  onCategoryToggle: (id: string, enabled: boolean) => void;
  onClose: () => void;
  categories: TopBarCategory[];
  currentDataPoints: MarqueeDataPoint[];
  onReorderCategories?: (newOrder: string[]) => void;
  onPreviewSettings?: (settings: EnhancedSettings) => void;
}

// Tab definitions for the enhanced popup
type TabId = 'categories' | 'display' | 'data' | 'advanced';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'categories',
    label: 'Categories',
    icon: '📊',
    description: 'Select and organize data categories'
  },
  {
    id: 'display', 
    label: 'Display',
    icon: '🎨',
    description: 'Appearance and animation settings'
  },
  {
    id: 'data',
    label: 'Data',
    icon: '🔄',
    description: 'Update frequency and sources'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: '⚙️',
    description: 'Performance and accessibility'
  }
];

// Enhanced settings state interface
export interface EnhancedSettings {
  // Display settings
  animationSpeed: number;
  showIcons: boolean;
  colorScheme: 'default' | 'high-contrast' | 'earth-alliance';
  compactMode: boolean;
  
  // Data settings
  updateFrequency: number;
  maxDataPoints: number;
  enableRealTime: boolean;
  prioritizeCritical: boolean;
  
  // Advanced settings
  enableDrag: boolean;
  momentumPhysics: boolean;
  accessibilityMode: boolean;
  performanceMode: boolean;
}

const DEFAULT_ENHANCED_SETTINGS: EnhancedSettings = {
  animationSpeed: 1.0,
  showIcons: true,
  colorScheme: 'default',
  compactMode: false,
  updateFrequency: 5000,
  maxDataPoints: 10,
  enableRealTime: true,
  prioritizeCritical: true,
  enableDrag: true,
  momentumPhysics: true,
  accessibilityMode: false,
  performanceMode: false,
};

const EnhancedSettingsPopup = forwardRef<EnhancedSettingsPopupRef, EnhancedSettingsPopupProps>(({
  open,
  enabledCategories,
  onCategoryToggle,
  onClose,
  categories,
  currentDataPoints,
  onReorderCategories,
  onPreviewSettings,
}, ref) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Tab and settings state
  const [activeTab, setActiveTab] = useState<TabId>('categories');
  const [enhancedSettings, setEnhancedSettings] = useState<EnhancedSettings>(DEFAULT_ENHANCED_SETTINGS);
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [highlightedDataPoint, setHighlightedDataPoint] = useState<string | null>(null);

  // Expose navigation method to parent
  useImperativeHandle(ref, () => ({
    navigateToDataPoint: (dataPointId: string) => {
      // Navigate to the categories tab where data points are managed
      setActiveTab('categories');
      // Highlight the specific data point
      setHighlightedDataPoint(dataPointId);
      // Auto-scroll to the data point if needed
      setTimeout(() => {
        const element = document.getElementById(`datapoint-${dataPointId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }), []);

  // Handle settings changes with live preview
  const handleSettingChange = useCallback(<K extends keyof EnhancedSettings>(
    key: K,
    value: EnhancedSettings[K]
  ) => {
    const newSettings = { ...enhancedSettings, [key]: value };
    setEnhancedSettings(newSettings);
    
    if (previewMode && onPreviewSettings) {
      onPreviewSettings(newSettings);
    }
  }, [enhancedSettings, previewMode, onPreviewSettings]);

  // Toggle preview mode
  const togglePreview = useCallback(() => {
    setPreviewMode(prev => !prev);
    if (!previewMode && onPreviewSettings) {
      onPreviewSettings(enhancedSettings);
    }
  }, [previewMode, enhancedSettings, onPreviewSettings]);

  // Drag and drop handlers for category reordering
  const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', categoryId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    if (draggedCategory && draggedCategory !== targetCategoryId && onReorderCategories) {
      // Find current order and reorder
      const enabledCategoryIds = categories
        .filter(cat => enabledCategories[cat.id])
        .map(cat => cat.id);
      
      const draggedIndex = enabledCategoryIds.indexOf(draggedCategory);
      const targetIndex = enabledCategoryIds.indexOf(targetCategoryId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...enabledCategoryIds];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedCategory);
        onReorderCategories(newOrder);
      }
    }
    setDraggedCategory(null);
  }, [draggedCategory, onReorderCategories, categories, enabledCategories]);

  // Render functions for each tab
  const renderCategoriesTab = () => (
    <div className={styles.categoriesTab}>
      <div className={styles.sectionHeader}>
        <h3>📊 Available Categories</h3>
        <p>Drag and drop to reorder active categories</p>
      </div>
      
      <div className={styles.categoryGroups}>
        {Object.entries(CATEGORY_GROUPS).map(([groupName, groupCategories]) => (
          <div key={groupName} className={styles.categoryGroup}>
            <h4 className={styles.groupTitle}>{groupName}</h4>
            <div className={styles.categoryGrid}>
              {groupCategories.map((category) => (
                <div
                  key={category.id}
                  className={`${styles.categoryCard} ${
                    enabledCategories[category.id] ? styles.enabled : styles.disabled
                  } ${draggedCategory === category.id ? styles.dragging : ''}`}
                  draggable={enabledCategories[category.id]}
                  onDragStart={(e) => handleDragStart(e, category.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category.id)}
                >
                  <div className={styles.categoryIcon}>{category.icon}</div>
                  <div className={styles.categoryInfo}>
                    <div className={styles.categoryName}>{category.label}</div>
                    <div className={styles.categoryDesc}>{category.description}</div>
                  </div>
                  <label className={styles.categoryToggle}>
                    <input
                      type="checkbox"
                      checked={enabledCategories[category.id]}
                      onChange={(e) => onCategoryToggle(category.id, e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.activeOrder}>
        <h4>Current Display Order</h4>
        <div className={styles.orderList}>
          {categories
            .filter(cat => enabledCategories[cat.id])
            .map((category, index) => (
              <div key={category.id} className={styles.orderItem}>
                <span className={styles.orderNumber}>{index + 1}</span>
                <span className={styles.orderIcon}>{category.icon}</span>
                <span className={styles.orderLabel}>{category.label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Active Data Points Section */}
      <div className={styles.dataPointsSection}>
        <h4>🔢 Current Data Points</h4>
        <p>Click any data point to configure its specific settings</p>
        <div className={styles.dataPointsGrid}>
          {currentDataPoints.map((dataPoint) => (
            <div
              key={dataPoint.id}
              id={`datapoint-${dataPoint.id}`}
              className={`${styles.dataPointCard} ${
                highlightedDataPoint === dataPoint.id ? styles.highlighted : ''
              }`}
              onClick={() => {
                setHighlightedDataPoint(dataPoint.id);
                // Here you could open a specific settings panel for this data point
              }}
            >
              <div className={styles.dataPointIcon}>{dataPoint.icon}</div>
              <div className={styles.dataPointInfo}>
                <div className={styles.dataPointLabel}>{dataPoint.label}</div>
                <div className={styles.dataPointValue}>{dataPoint.value}</div>
                {dataPoint.errorMessage && (
                  <div className={styles.dataPointError}>{dataPoint.errorMessage}</div>
                )}
              </div>
              <div className={styles.dataPointStatus}>
                {dataPoint.isLoading ? (
                  <span className={styles.statusLoading}>⏳</span>
                ) : dataPoint.hasError ? (
                  <span className={styles.statusError}>⚠️</span>
                ) : (
                  <span className={styles.statusOk}>✅</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDisplayTab = () => (
    <div className={styles.displayTab}>
      <div className={styles.sectionHeader}>
        <h3>🎨 Display Settings</h3>
        <p>Customize appearance and animations</p>
      </div>
      
      <div className={styles.settingsGrid}>
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            Animation Speed
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={enhancedSettings.animationSpeed}
              onChange={(e) => handleSettingChange('animationSpeed', parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.settingValue}>{enhancedSettings.animationSpeed.toFixed(1)}x</span>
          </label>
        </div>

        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            Color Scheme
            <select
              value={enhancedSettings.colorScheme}
              onChange={(e) => handleSettingChange('colorScheme', e.target.value as EnhancedSettings['colorScheme'])}
              className={styles.dropdown}
            >
              <option value="default">Default Blue</option>
              <option value="high-contrast">High Contrast</option>
              <option value="earth-alliance">Earth Alliance</option>
            </select>
          </label>
        </div>

        <div className={styles.toggleGroup}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={enhancedSettings.showIcons}
              onChange={(e) => handleSettingChange('showIcons', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            Show Category Icons
          </label>

          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={enhancedSettings.compactMode}
              onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            Compact Mode
          </label>
        </div>
      </div>
    </div>
  );

  // Close on ESC or outside click
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        // Cycle through tabs with Ctrl+Tab
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const currentIndex = TABS.findIndex(tab => tab.id === activeTab);
          const nextIndex = (currentIndex + 1) % TABS.length;
          setActiveTab(TABS[nextIndex].id);
        }
      }
    }
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose, activeTab]);

  if (!open) return null;

  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enhanced-settings-title"
        className={styles.enhancedSettingsOverlay}
        onClick={(e) => {
          // Close on overlay click (background)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          ref={modalRef}
          className={styles.enhancedSettingsModal}
          onClick={(e) => {
            // Prevent modal content clicks from bubbling to overlay
            e.stopPropagation();
          }}
        >
          {/* Header with title and preview toggle */}
          <div className={styles.modalHeader}>
            <h2 id="enhanced-settings-title" className={styles.modalTitle}>
              🎛️ Marquee Settings
            </h2>
            <div className={styles.headerControls}>
              <button
                onClick={togglePreview}
                className={`${styles.previewButton} ${previewMode ? styles.active : ''}`}
                aria-pressed={previewMode}
                title="Toggle live preview"
              >
                👁️ {previewMode ? 'Previewing' : 'Preview'}
              </button>
              <button
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabNavigation} role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.description}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'categories' && (
              <div
                role="tabpanel"
                id="panel-categories"
                aria-labelledby="tab-categories"
                className={styles.tabPanel}
              >
                <CategoriesTab
                  categories={categories}
                  enabledCategories={enabledCategories}
                  currentDataPoints={currentDataPoints}
                  onCategoryToggle={onCategoryToggle}
                  onReorderCategories={onReorderCategories}
                  highlightedDataPoint={highlightedDataPoint}
                  draggedCategory={draggedCategory}
                  setDraggedCategory={setDraggedCategory}
                />
              </div>
            )}

            {activeTab === 'display' && (
              <div
                role="tabpanel"
                id="panel-display"
                aria-labelledby="tab-display"
                className={styles.tabPanel}
              >
                <DisplayTab
                  settings={enhancedSettings}
                  onSettingChange={handleSettingChange}
                  previewMode={previewMode}
                />
              </div>
            )}

            {activeTab === 'data' && (
              <div
                role="tabpanel"
                id="panel-data"
                aria-labelledby="tab-data"
                className={styles.tabPanel}
              >
                <DataTab
                  settings={enhancedSettings}
                  onSettingChange={handleSettingChange}
                  previewMode={previewMode}
                />
              </div>
            )}

            {activeTab === 'advanced' && (
              <div
                role="tabpanel"
                id="panel-advanced"
                aria-labelledby="tab-advanced"
                className={styles.tabPanel}
              >
                <AdvancedTab
                  settings={enhancedSettings}
                  onSettingChange={handleSettingChange}
                  previewMode={previewMode}
                />
              </div>
            )}
          </div>

          {/* Footer with action buttons */}
          <div className={styles.modalFooter}>
            <div className={styles.footerInfo}>
              {previewMode && (
                <span className={styles.previewIndicator}>
                  🔄 Live preview active
                </span>
              )}
            </div>
            <div className={styles.footerActions}>
              <button
                onClick={() => setEnhancedSettings(DEFAULT_ENHANCED_SETTINGS)}
                className={styles.resetButton}
              >
                🔄 Reset to Defaults
              </button>
              <button
                onClick={onClose}
                className={styles.applyButton}
              >
                ✅ Apply Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
});

EnhancedSettingsPopup.displayName = 'EnhancedSettingsPopup';

export default EnhancedSettingsPopup;
