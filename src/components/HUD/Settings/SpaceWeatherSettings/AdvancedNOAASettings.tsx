// AdvancedNOAASettings.tsx - Modal for detailed NOAA dataset controls

import React, { useState } from 'react';
import { 
  NOAA_VISUALIZATIONS, 
  VISUALIZATION_PRESETS,
  getVisualizationsByCategory 
} from '../../Bars/CyberCommandLeftSideBar/NOAAVisualizationConfig';
import styles from './AdvancedNOAASettings.module.css';

interface AdvancedNOAASettingsProps {
  onClose: () => void;
  config: any;
  onConfigChange: (config: any) => void;
}

/**
 * Advanced NOAA settings modal with full dataset control
 * Provides access to all 30+ NOAA datasets organized by category
 */
const AdvancedNOAASettings: React.FC<AdvancedNOAASettingsProps> = ({
  onClose,
  config,
  onConfigChange
}) => {
  const [activeCategory, setActiveCategory] = useState<'solar' | 'geomagnetic' | 'radiation' | 'cosmic'>('solar');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'solar', name: 'Solar', icon: '☀️', count: getVisualizationsByCategory('solar').length },
    { id: 'geomagnetic', name: 'Geomagnetic', icon: '🧲', count: getVisualizationsByCategory('geomagnetic').length },
    { id: 'radiation', name: 'Radiation', icon: '☢️', count: getVisualizationsByCategory('radiation').length },
    { id: 'cosmic', name: 'Cosmic', icon: '🌌', count: getVisualizationsByCategory('cosmic').length }
  ];

  const getActiveDatasets = () => {
    const categoryDatasets = getVisualizationsByCategory(activeCategory);
    if (!searchTerm) return categoryDatasets;
    
    return categoryDatasets.filter(dataset => 
      dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getEnabledCount = () => {
    return NOAA_VISUALIZATIONS.reduce((total, dataset) => 
      total + dataset.options.filter(opt => opt.enabled).length, 0);
  };

  const applyPreset = (presetId: string) => {
    const preset = VISUALIZATION_PRESETS[presetId as keyof typeof VISUALIZATION_PRESETS];
    if (preset) {
      // Disable all first
      NOAA_VISUALIZATIONS.forEach(dataset => {
        dataset.options.forEach(option => {
          option.enabled = false;
        });
      });
      
      // Enable preset options
      preset.enabled.forEach(optionId => {
        NOAA_VISUALIZATIONS.forEach(dataset => {
          const option = dataset.options.find(opt => opt.id === optionId);
          if (option) option.enabled = true;
        });
      });
    }
  };

  const toggleOption = (datasetId: string, optionId: string) => {
    const dataset = NOAA_VISUALIZATIONS.find(d => d.datasetId === datasetId);
    if (dataset) {
      const option = dataset.options.find(opt => opt.id === optionId);
      if (option) {
        option.enabled = !option.enabled;
      }
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.overlay} onClick={onClose} />
      
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h3 className={styles.title}>🛰️ Advanced NOAA Controls</h3>
            <span className={styles.activeCount}>{getEnabledCount()} active visualizations</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        {/* Quick Presets */}
        <div className={styles.presets}>
          <div className={styles.sectionTitle}>Quick Presets</div>
          <div className={styles.presetButtons}>
            {Object.entries(VISUALIZATION_PRESETS).slice(0, 4).map(([id, preset]) => (
              <button
                key={id}
                className={styles.presetButton}
                onClick={() => applyPreset(id)}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Category Tabs */}
        <div className={styles.categoryTabs}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryTab} ${activeCategory === category.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(category.id as any)}
            >
              <span className={styles.categoryIcon}>{category.icon}</span>
              <span className={styles.categoryName}>{category.name}</span>
              <span className={styles.categoryCount}>({category.count})</span>
            </button>
          ))}
        </div>

        {/* Datasets List */}
        <div className={styles.datasetsList}>
          {getActiveDatasets().map((dataset) => (
            <div key={dataset.datasetId} className={styles.dataset}>
              <div className={styles.datasetHeader}>
                <span className={styles.datasetIcon}>{dataset.icon}</span>
                <span className={styles.datasetName}>{dataset.name}</span>
              </div>
              <div className={styles.datasetDescription}>{dataset.description}</div>
              
              <div className={styles.datasetOptions}>
                {dataset.options.map((option) => (
                  <label key={option.id} className={styles.optionToggle}>
                    <input
                      type="checkbox"
                      checked={option.enabled}
                      onChange={() => toggleOption(dataset.datasetId, option.id)}
                      className={styles.optionCheckbox}
                    />
                    <span className={styles.optionLabel}>{option.name}</span>
                    <span className={styles.optionType}>{option.type}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.helpText}>
            Toggle individual visualizations or use presets for common scenarios
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedNOAASettings;
