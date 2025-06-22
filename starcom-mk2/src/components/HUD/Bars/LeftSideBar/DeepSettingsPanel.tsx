import React, { useState } from 'react';
import { NOAA_VISUALIZATIONS, VISUALIZATION_PRESETS } from './NOAAVisualizationConfig';
import styles from './DeepSettingsPanel.module.css';

interface DeepSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory: string | null;
}

const DeepSettingsPanel: React.FC<DeepSettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  currentCategory 
}) => {
  const [activeTab, setActiveTab] = useState<'visualizations' | 'presets' | 'advanced'>('visualizations');

  if (!isOpen) return null;

  const getCategoryData = (category: string) => {
    return NOAA_VISUALIZATIONS.filter(dataset => dataset.category === category);
  };

  const handleVisualizationToggle = (datasetId: string, optionId: string) => {
    const dataset = NOAA_VISUALIZATIONS.find(d => d.datasetId === datasetId);
    const option = dataset?.options.find(o => o.id === optionId);
    if (option) {
      option.enabled = !option.enabled;
    }
  };

  const handlePresetApply = (presetId: string) => {
    const preset = VISUALIZATION_PRESETS[presetId as keyof typeof VISUALIZATION_PRESETS];
    if (preset) {
      // First disable all
      NOAA_VISUALIZATIONS.forEach(dataset => {
        dataset.options.forEach(option => {
          option.enabled = false;
        });
      });
      
      // Then enable preset options
      preset.enabled.forEach(optionId => {
        NOAA_VISUALIZATIONS.forEach(dataset => {
          const option = dataset.options.find(opt => opt.id === optionId);
          if (option) {
            option.enabled = true;
          }
        });
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />
      
      {/* Panel */}
      <div className={styles.deepSettingsPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            {currentCategory ? (
              <>
                <span className={styles.categoryIcon}>
                  {currentCategory === 'solar' && '☀️'}
                  {currentCategory === 'geomagnetic' && '🧲'}
                  {currentCategory === 'radiation' && '☢️'}
                  {currentCategory === 'cosmic' && '🌌'}
                </span>
                {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Settings
              </>
            ) : (
              '🛰️ NOAA Deep Settings'
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tab} ${activeTab === 'visualizations' ? styles.active : ''}`}
            onClick={() => setActiveTab('visualizations')}
          >
            📊 Data
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'presets' ? styles.active : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            🎯 Presets
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'advanced' ? styles.active : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            ⚙️ Advanced
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'visualizations' && (
            <div className={styles.visualizationsTab}>
              {currentCategory ? (
                // Show detailed view for specific category
                <div className={styles.categoryDetail}>
                  {getCategoryData(currentCategory).map(dataset => (
                    <div key={dataset.datasetId} className={styles.datasetSection}>
                      <div className={styles.datasetHeader}>
                        <span className={styles.datasetIcon}>{dataset.icon}</span>
                        <div className={styles.datasetInfo}>
                          <div className={styles.datasetName}>{dataset.name}</div>
                          <div className={styles.datasetDesc}>{dataset.description}</div>
                        </div>
                      </div>
                      
                      <div className={styles.visualizationOptions}>
                        {dataset.options.map(option => (
                          <div key={option.id} className={styles.visualizationOption}>
                            <label className={styles.optionLabel}>
                              <input
                                type="checkbox"
                                checked={option.enabled}
                                onChange={() => handleVisualizationToggle(dataset.datasetId, option.id)}
                                className={styles.checkbox}
                              />
                              <div className={styles.optionContent}>
                                <div className={styles.optionHeader}>
                                  <span 
                                    className={styles.colorDot}
                                    style={{ backgroundColor: option.color }}
                                  />
                                  <span className={styles.optionName}>{option.name}</span>
                                </div>
                                <div className={styles.optionDesc}>{option.description}</div>
                                <div className={styles.optionMeta}>
                                  Type: {option.type} • Intensity: {option.intensity}
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Show overview of all categories
                <div className={styles.allCategories}>
                  {['solar', 'geomagnetic', 'radiation', 'cosmic'].map(category => {
                    const datasets = getCategoryData(category);
                    const activeCount = datasets.reduce((sum, dataset) => 
                      sum + dataset.options.filter(opt => opt.enabled).length, 0);
                    
                    return (
                      <div key={category} className={styles.categoryOverview}>
                        <div className={styles.categoryTitle}>
                          <span className={styles.categoryIcon}>
                            {category === 'solar' && '☀️'}
                            {category === 'geomagnetic' && '🧲'}
                            {category === 'radiation' && '☢️'}
                            {category === 'cosmic' && '🌌'}
                          </span>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                          <span className={styles.activeCount}>({activeCount} active)</span>
                        </div>
                        <div className={styles.datasetsGrid}>
                          {datasets.map(dataset => (
                            <div key={dataset.datasetId} className={styles.datasetCard}>
                              <span className={styles.datasetIcon}>{dataset.icon}</span>
                              <span className={styles.datasetName}>{dataset.name}</span>
                              <span className={styles.datasetCount}>
                                {dataset.options.filter(opt => opt.enabled).length}/{dataset.options.length}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className={styles.presetsTab}>
              <div className={styles.presetsGrid}>
                {Object.entries(VISUALIZATION_PRESETS).map(([presetId, preset]) => (
                  <div key={presetId} className={styles.presetCard}>
                    <div className={styles.presetHeader}>
                      <span className={styles.presetIcon}>🎯</span>
                      <div className={styles.presetInfo}>
                        <div className={styles.presetName}>{preset.name}</div>
                        <div className={styles.presetDesc}>{preset.description}</div>
                      </div>
                    </div>
                    <div className={styles.presetMeta}>
                      <span className={styles.presetCount}>{preset.enabled.length} visualizations</span>
                      <button 
                        className={styles.applyBtn}
                        onClick={() => handlePresetApply(presetId)}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className={styles.advancedTab}>
              <div className={styles.settingsSection}>
                <div className={styles.sectionTitle}>🎨 Rendering Settings</div>
                <div className={styles.settingRow}>
                  <label className={styles.settingLabel}>Quality Level</label>
                  <select className={styles.select}>
                    <option value="high">High Quality</option>
                    <option value="medium">Balanced</option>
                    <option value="low">Performance</option>
                  </select>
                </div>
                <div className={styles.settingRow}>
                  <label className={styles.settingLabel}>Update Frequency</label>
                  <select className={styles.select}>
                    <option value="realtime">Real-time</option>
                    <option value="30s">Every 30 seconds</option>
                    <option value="1m">Every minute</option>
                    <option value="5m">Every 5 minutes</option>
                  </select>
                </div>
              </div>

              <div className={styles.settingsSection}>
                <div className={styles.sectionTitle}>💾 Data Management</div>
                <div className={styles.settingRow}>
                  <label className={styles.settingLabel}>Cache Duration</label>
                  <select className={styles.select}>
                    <option value="5m">5 minutes</option>
                    <option value="15m">15 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="24h">24 hours</option>
                  </select>
                </div>
                {/* Clear Cache and Export Settings moved to RightSideBar Developer Tools */}
                {/*
                <div className={styles.settingRow}>
                  <button className={styles.actionBtn}>Clear Cache</button>
                  <button className={styles.actionBtn}>Export Settings</button>
                </div>
                */}
              </div>

              {/* Debug Tools section moved to RightSideBar Developer Tools */}
              {/* 
              <div className={styles.settingsSection}>
                <div className={styles.sectionTitle}>🔧 Debug Tools</div>
                <div className={styles.settingRow}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} />
                    Show Performance Metrics
                  </label>
                </div>
                <div className={styles.settingRow}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} />
                    Enable Debug Logging
                  </label>
                </div>
                <div className={styles.settingRow}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} />
                    Show Data Source URLs
                  </label>
                </div>
              </div>
              */}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DeepSettingsPanel;
