// CategoriesTab.tsx
// Categories management tab for Marquee Settings
import React from 'react';
import { TopBarCategory } from '../topbarCategories';
import { MarqueeDataPoint } from '../interfaces';
import CategoryList from './CategoryList';
import DataPointList from './DataPointList';
import styles from './CategoriesTab.module.css';

export interface CategoriesTabProps {
  categories: TopBarCategory[];
  enabledCategories: Record<string, boolean>;
  currentDataPoints: MarqueeDataPoint[];
  onCategoryToggle: (id: string, enabled: boolean) => void;
  onReorderCategories?: (newOrder: string[]) => void;
  highlightedDataPoint: string | null;
  draggedCategory: string | null;
  setDraggedCategory: (id: string | null) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  enabledCategories,
  currentDataPoints,
  onCategoryToggle,
  onReorderCategories,
  highlightedDataPoint,
  draggedCategory,
  setDraggedCategory,
}) => {
  return (
    <div className={styles.categoriesTab}>
      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          📊 Data Categories
        </h3>
        <p className={styles.sectionDescription}>
          Select which data categories to display in the marquee. Drag to reorder.
        </p>
        
        <CategoryList
          categories={categories}
          enabledCategories={enabledCategories}
          onCategoryToggle={onCategoryToggle}
          onReorderCategories={onReorderCategories}
          draggedCategory={draggedCategory}
          setDraggedCategory={setDraggedCategory}
        />
      </div>

      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          🔍 Current Data Points
        </h3>
        <p className={styles.sectionDescription}>
          Currently active data points in the marquee. Click any data point to configure its specific settings.
        </p>
        
        <DataPointList
          dataPoints={currentDataPoints}
          highlightedDataPoint={highlightedDataPoint}
        />
      </div>

      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          ⚡ Quick Actions
        </h3>
        <div className={styles.quickActions}>
          <button 
            className={styles.quickActionButton}
            onClick={() => categories.forEach(cat => onCategoryToggle(cat.id, true))}
          >
            ✅ Enable All
          </button>
          <button 
            className={styles.quickActionButton}
            onClick={() => categories.forEach(cat => onCategoryToggle(cat.id, false))}
          >
            ❌ Disable All
          </button>
          <button 
            className={styles.quickActionButton}
            onClick={() => {
              // Enable only critical categories
              const criticalCategories = ['energy-security', 'power-grid', 'strategic-fuels'];
              categories.forEach(cat => 
                onCategoryToggle(cat.id, criticalCategories.includes(cat.id))
              );
            }}
          >
            🚨 Critical Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesTab;
