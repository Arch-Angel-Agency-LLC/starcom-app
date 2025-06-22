import React, { useState } from 'react';
import { 
  NOAA_VISUALIZATIONS, 
  VISUALIZATION_PRESETS,
  toggleVisualizationOption,
  getVisualizationsByCategory 
} from './NOAAVisualizationConfig';
import { globeVisualizationManager } from './NOAAGlobeVisualizationManager';
import DeepSettingsPanel from './DeepSettingsPanel';
import styles from './CompactNOAAControls.module.css';

interface CompactNOAAControlsProps {
  className?: string;
}

const CompactNOAAControls: React.FC<CompactNOAAControlsProps> = ({ className }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('space-weather-overview');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showDeepSettings, setShowDeepSettings] = useState(false);
  const [deepSettingsCategory, setDeepSettingsCategory] = useState<string | null>(null);

  // Handle visualization preset changes
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = VISUALIZATION_PRESETS[presetId as keyof typeof VISUALIZATION_PRESETS];
    if (preset) {
      // First disable all visualizations
      NOAA_VISUALIZATIONS.forEach(dataset => {
        dataset.options.forEach(option => {
          option.enabled = false;
        });
      });
      
      // Then enable preset visualizations
      preset.enabled.forEach(optionId => {
        NOAA_VISUALIZATIONS.forEach(dataset => {
          const option = dataset.options.find(opt => opt.id === optionId);
          if (option) {
            option.enabled = true;
          }
        });
      });
      
      // Sync with globe visualization manager
      globeVisualizationManager.forceSync();
    }
  };

  // Handle category expansion (only one at a time for compact view)
  const toggleCategory = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  // Handle category deep settings
  const openDeepSettings = (category?: string) => {
    setDeepSettingsCategory(category || null);
    setShowDeepSettings(true);
  };

  // Handle individual visualization toggle
  const handleVisualizationToggle = (datasetId: string, optionId: string) => {
    toggleVisualizationOption(datasetId, optionId);
    // Sync with globe visualization manager
    globeVisualizationManager.forceSync();
    // Force re-render by updating state
    setExpandedCategory(expandedCategory);
  };

  // Get active visualization count
  const getActiveCount = () => {
    return NOAA_VISUALIZATIONS.reduce((total, dataset) => 
      total + dataset.options.filter(opt => opt.enabled).length, 0);
  };

  return (
    <>
      <div className={`${styles.compactNOAAControls} ${className || ''}`}>
        {/* Header with count and settings access */}
        <div className={styles.header}>
          <span className={styles.title}>🛰️ NOAA</span>
          <div className={styles.headerControls}>
            <span className={styles.activeCount}>{getActiveCount()}</span>
            <button 
              className={styles.settingsBtn}
              onClick={() => openDeepSettings()}
              title="Open detailed settings"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Quick Presets - More accessible */}
        <div className={styles.presetsSection}>
          <div className={styles.presetGrid}>
            {Object.entries(VISUALIZATION_PRESETS).slice(0, 4).map(([presetId, preset]) => (
              <button
                key={presetId}
                className={`${styles.presetBtn} ${selectedPreset === presetId ? styles.active : ''}`}
                onClick={() => handlePresetChange(presetId)}
                title={preset.description}
              >
                {preset.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Categories - Improved discoverability */}
        <div className={styles.categoriesSection}>
          {['solar', 'geomagnetic', 'radiation', 'cosmic'].map(category => {
            const datasets = getVisualizationsByCategory(category);
            const isExpanded = expandedCategory === category;
            const activeInCategory = datasets.reduce((sum, dataset) => 
              sum + dataset.options.filter(opt => opt.enabled).length, 0);
            
            return (
              <div key={category} className={styles.categoryGroup}>
                <div className={styles.categoryHeader}>
                  <button
                    className={`${styles.categoryBtn} ${isExpanded ? styles.expanded : ''} ${activeInCategory > 0 ? styles.hasActive : ''}`}
                    onClick={() => toggleCategory(category)}
                    title={`${category.charAt(0).toUpperCase() + category.slice(1)} (${activeInCategory} active)`}
                  >
                    <span className={styles.categoryIcon}>
                      {category === 'solar' && '☀️'}
                      {category === 'geomagnetic' && '🧲'}
                      {category === 'radiation' && '☢️'}
                      {category === 'cosmic' && '🌌'}
                    </span>
                    <span className={styles.categoryCount}>{activeInCategory}</span>
                    <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                  </button>
                  <button 
                    className={styles.categorySettingsBtn}
                    onClick={() => openDeepSettings(category)}
                    title={`Detailed ${category} settings`}
                  >
                    ⚙️
                  </button>
                </div>
                
                {isExpanded && (
                  <div className={styles.expandedContent}>
                    {datasets.slice(0, 2).map(dataset => (
                      <div key={dataset.datasetId} className={styles.datasetGroup}>
                        <div className={styles.datasetHeader}>
                          <span className={styles.datasetIcon}>{dataset.icon}</span>
                          <span className={styles.datasetName}>{dataset.name.split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                        <div className={styles.visualizationList}>
                          {dataset.options.slice(0, 2).map(option => (
                            <button
                              key={option.id}
                              className={`${styles.visualizationBtn} ${option.enabled ? styles.enabled : ''}`}
                              onClick={() => handleVisualizationToggle(dataset.datasetId, option.id)}
                              title={option.description}
                            >
                              <span 
                                className={styles.visualizationDot} 
                                style={{ backgroundColor: option.color }}
                              ></span>
                              <span className={styles.visualizationName}>
                                {option.name.split(' ').slice(0, 2).join(' ')}
                              </span>
                              <span className={styles.visualizationStatus}>
                                {option.enabled ? '●' : '○'}
                              </span>
                            </button>
                          ))}
                          {dataset.options.length > 2 && (
                            <button 
                              className={styles.moreBtn}
                              onClick={() => openDeepSettings(category)}
                            >
                              +{dataset.options.length - 2} more...
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {datasets.length > 2 && (
                      <button 
                        className={styles.moreBtn}
                        onClick={() => openDeepSettings(category)}
                      >
                        +{datasets.length - 2} more datasets...
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions - Enhanced */}
        <div className={styles.quickActions}>
          <button 
            className={styles.actionBtn}
            onClick={() => handlePresetChange('research-mode')}
            title="Enable all visualizations"
          >
            All
          </button>
          <button 
            className={styles.actionBtn}
            onClick={() => {
              NOAA_VISUALIZATIONS.forEach(dataset => {
                dataset.options.forEach(option => {
                  option.enabled = false;
                });
              });
              setSelectedPreset('');
              // Sync with globe visualization manager
              globeVisualizationManager.forceSync();
              setExpandedCategory(expandedCategory); // Force re-render
            }}
            title="Disable all visualizations"
          >
            None
          </button>
          <button 
            className={styles.helpBtn}
            onClick={() => openDeepSettings()}
            title="Open help and detailed settings"
          >
            ?
          </button>
        </div>
      </div>

      {/* Deep Settings Panel */}
      {showDeepSettings && (
        <DeepSettingsPanel
          isOpen={showDeepSettings}
          onClose={() => setShowDeepSettings(false)}
          currentCategory={deepSettingsCategory}
        />
      )}
    </>
  );
};

export default CompactNOAAControls;
