import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import { TopBarCategory } from './topbarCategories';
import { useSpaceWeatherSettings } from '../../../../hooks/useSpaceWeatherSettings';
import styles from './EnhancedSettingsPopup.module.css';

// AI-NOTE: Enhanced settings popup with tabs for quick settings that benefit from real-time preview

export interface EnhancedSettingsPopupProps {
  open: boolean;
  enabledCategories: Record<string, boolean>;
  onCategoryToggle: (id: string, enabled: boolean) => void;
  onClose: () => void;
  categories: TopBarCategory[];
}

type SettingsTab = 'data' | 'visualization' | 'display';

const EnhancedSettingsPopup: React.FC<EnhancedSettingsPopupProps> = ({
  open,
  enabledCategories,
  onCategoryToggle,
  onClose,
  categories,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('data');
  const { config: spaceWeatherConfig, updateConfig } = useSpaceWeatherSettings();

  // Close on ESC or outside click
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
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
  }, [open, onClose]);

  const handleAdvancedSettings = () => {
    onClose();
    navigate('/settings');
  };

  if (!open) return null;

  const renderDataFeedsTab = () => (
    <div className={styles.tabContent}>
      <p className={styles.tabDescription}>
        Toggle which data categories are visible in the TopBar marquee.
      </p>
      <div className={styles.categoryList}>
        {categories.map((cat: TopBarCategory) => (
          <label key={cat.id} className={styles.categoryItem}>
            <input
              type="checkbox"
              checked={!!enabledCategories[cat.id]}
              onChange={e => onCategoryToggle(cat.id, e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.categoryIcon}>{cat.icon}</span>
            <span className={styles.categoryLabel}>{cat.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderVisualizationTab = () => (
    <div className={styles.tabContent}>
      <p className={styles.tabDescription}>
        Quick visualization controls with live preview.
      </p>
      
      <div className={styles.settingsSection}>
        <h4 className={styles.sectionTitle}>🎨 Globe Visualization</h4>
        
        <label className={styles.settingRow}>
          <input
            type="checkbox"
            checked={spaceWeatherConfig.showElectricFields}
            onChange={(e) => updateConfig({ showElectricFields: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.settingLabel}>⚡ Electric Fields</span>
        </label>

        <label className={styles.settingRow}>
          <input
            type="checkbox"
            checked={spaceWeatherConfig.showAlerts}
            onChange={(e) => updateConfig({ showAlerts: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.settingLabel}>🚨 Space Weather Alerts</span>
        </label>

        <div className={styles.sliderRow}>
          <label className={styles.sliderLabel}>
            💪 Vector Intensity: {spaceWeatherConfig.vectorIntensity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={spaceWeatherConfig.vectorIntensity}
            onChange={(e) => updateConfig({ vectorIntensity: parseInt(e.target.value) })}
            className={styles.slider}
          />
        </div>

        <div className={styles.sliderRow}>
          <label className={styles.sliderLabel}>
            👁️ Opacity: {spaceWeatherConfig.vectorOpacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={spaceWeatherConfig.vectorOpacity}
            onChange={(e) => updateConfig({ vectorOpacity: parseInt(e.target.value) })}
            className={styles.slider}
          />
        </div>
      </div>
    </div>
  );

  const renderDisplayTab = () => (
    <div className={styles.tabContent}>
      <p className={styles.tabDescription}>
        Display and theme preferences.
      </p>
      
      <div className={styles.settingsSection}>
        <h4 className={styles.sectionTitle}>🖥️ HUD Display</h4>
        
        <label className={styles.settingRow}>
          <input
            type="checkbox"
            checked={spaceWeatherConfig.showStatistics}
            onChange={(e) => updateConfig({ showStatistics: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.settingLabel}>📊 Show Statistics</span>
        </label>

        <div className={styles.comingSoon}>
          <span className={styles.comingSoonIcon}>🎨</span>
          <span className={styles.comingSoonText}>Theme customization coming soon...</span>
        </div>
      </div>
    </div>
  );

  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enhanced-settings-title"
        className={styles.overlay}
      >
        <div ref={modalRef} className={styles.modal}>
          <div className={styles.header}>
            <h2 id="enhanced-settings-title" className={styles.title}>
              <span className={styles.titleIcon}>⚙️</span>
              <span>Quick Settings</span>
            </h2>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'data' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('data')}
            >
              📊 Data Feeds
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'visualization' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('visualization')}
            >
              🌍 Visualization
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'display' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('display')}
            >
              🖥️ Display
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === 'data' && renderDataFeedsTab()}
            {activeTab === 'visualization' && renderVisualizationTab()}
            {activeTab === 'display' && renderDisplayTab()}
          </div>

          <div className={styles.footer}>
            <button
              onClick={handleAdvancedSettings}
              className={styles.advancedButton}
            >
              🔧 Advanced Settings
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default EnhancedSettingsPopup;
