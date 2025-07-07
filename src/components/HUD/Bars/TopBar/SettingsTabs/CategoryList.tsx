// CategoryList.tsx
// Draggable category list component
import React from 'react';
import { TopBarCategory } from '../topbarCategories';
import { CATEGORY_GROUPS } from '../topbarCategories';
import styles from './CategoryList.module.css';

export interface CategoryListProps {
  categories: TopBarCategory[];
  enabledCategories: Record<string, boolean>;
  onCategoryToggle: (id: string, enabled: boolean) => void;
  onReorderCategories?: (newOrder: string[]) => void;
  draggedCategory: string | null;
  setDraggedCategory: (id: string | null) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  enabledCategories,
  onCategoryToggle,
  onReorderCategories,
  draggedCategory,
  setDraggedCategory,
}) => {
  // Group categories by their type
  const groupedCategories = React.useMemo(() => {
    const groups: Record<string, TopBarCategory[]> = {};
    
    Object.keys(CATEGORY_GROUPS).forEach(groupKey => {
      const groupCategories = CATEGORY_GROUPS[groupKey as keyof typeof CATEGORY_GROUPS];
      if (Array.isArray(groupCategories)) {
        groups[groupKey] = categories.filter(cat => 
          groupCategories.includes(cat.id)
        );
      }
    });
    
    return groups;
  }, [categories]);

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', categoryId);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    const sourceCategoryId = e.dataTransfer.getData('text/plain');
    
    if (sourceCategoryId && sourceCategoryId !== targetCategoryId && onReorderCategories) {
      // Implement reordering logic
      const newOrder = categories.map(cat => cat.id);
      const sourceIndex = newOrder.indexOf(sourceCategoryId);
      const targetIndex = newOrder.indexOf(targetCategoryId);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, sourceCategoryId);
        onReorderCategories(newOrder);
      }
    }
  };

  const renderCategoryCard = (category: TopBarCategory) => {
    const isEnabled = enabledCategories[category.id];
    const isDragging = draggedCategory === category.id;

    return (
      <div
        key={category.id}
        className={`${styles.categoryCard} ${isEnabled ? styles.enabled : styles.disabled} ${isDragging ? styles.dragging : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, category.id)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, category.id)}
      >
        <div className={styles.categoryHeader}>
          <div className={styles.categoryIcon}>{category.icon}</div>
          <div className={styles.categoryInfo}>
            <div className={styles.categoryLabel}>{category.label}</div>
            <div className={styles.categoryDescription}>{category.description}</div>
          </div>
          <div className={styles.categoryControls}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => onCategoryToggle(category.id, e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>
        
        {isEnabled && (
          <div className={styles.categoryDetails}>
            <div className={styles.categoryStats}>
              <span className={styles.statItem}>
                🎯 Priority: {getPriority(category.id)}
              </span>
              <span className={styles.statItem}>
                🔄 Update: {getUpdateFrequency(category.id)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getPriority = (categoryId: string): string => {
    const criticalCategories = ['energy-security', 'power-grid', 'strategic-fuels'];
    const importantCategories = ['market-intelligence', 'renewables', 'supply-chain'];
    
    if (criticalCategories.includes(categoryId)) return 'Critical';
    if (importantCategories.includes(categoryId)) return 'Important';
    return 'Standard';
  };

  const getUpdateFrequency = (categoryId: string): string => {
    const realTimeCategories = ['crypto', 'forex', 'indices'];
    const frequentCategories = ['commodities', 'economic', 'news'];
    
    if (realTimeCategories.includes(categoryId)) return 'Real-time';
    if (frequentCategories.includes(categoryId)) return '5 min';
    return '15 min';
  };

  return (
    <div className={styles.categoryList}>
      {Object.entries(groupedCategories).map(([groupKey, groupCategories]) => (
        <div key={groupKey} className={styles.categoryGroup}>
          <div className={styles.groupHeader}>
            <h4 className={styles.groupTitle}>{getGroupTitle(groupKey)}</h4>
            <span className={styles.groupCount}>
              {groupCategories.filter(cat => enabledCategories[cat.id]).length} / {groupCategories.length} enabled
            </span>
          </div>
          <div className={styles.groupCategories}>
            {groupCategories.map(renderCategoryCard)}
          </div>
        </div>
      ))}
    </div>
  );
};

const getGroupTitle = (groupKey: string): string => {
  const titles: Record<string, string> = {
    'financial': '💰 Financial Markets',
    'energy': '⚡ Energy Intelligence', 
    'information': '📰 Information Flow',
    'technical': '⚙️ Technical Metrics'
  };
  return titles[groupKey] || groupKey;
};

export default CategoryList;
