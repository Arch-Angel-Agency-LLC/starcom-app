// AppearanceControls.tsx
// Appearance settings controls for display tab
import React from 'react';
import { EnhancedSettings } from '../../EnhancedSettingsPopup';
import styles from './AppearanceControls.module.css';

export interface AppearanceControlsProps {
  settings: EnhancedSettings;
  onSettingChange: <K extends keyof EnhancedSettings>(key: K, value: EnhancedSettings[K]) => void;
  previewMode: boolean;
}

const AppearanceControls: React.FC<AppearanceControlsProps> = ({
  settings,
  onSettingChange,
  previewMode,
}) => {
  const colorSchemes = [
    {
      id: 'default' as const,
      name: '🌌 Default',
      description: 'Blue-cyan sci-fi theme',
      colors: {
        primary: '#38bdf8',
        secondary: '#3b82f6',
        background: 'rgba(15, 23, 42, 0.9)',
      },
    },
    {
      id: 'high-contrast' as const,
      name: '⚡ High Contrast',
      description: 'Enhanced visibility',
      colors: {
        primary: '#ffffff',
        secondary: '#fbbf24',
        background: 'rgba(0, 0, 0, 0.95)',
      },
    },
    {
      id: 'earth-alliance' as const,
      name: '🌍 Earth Alliance',
      description: 'Green-gold military theme',
      colors: {
        primary: '#22c55e',
        secondary: '#eab308',
        background: 'rgba(20, 30, 20, 0.9)',
      },
    },
  ];

  return (
    <div className={styles.appearanceControls}>
      {/* Color Scheme Selection */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Color Scheme
        </label>
        
        <div className={styles.colorSchemeGrid}>
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              className={`${styles.colorSchemeCard} ${
                settings.colorScheme === scheme.id ? styles.active : ''
              }`}
              onClick={() => onSettingChange('colorScheme', scheme.id)}
            >
              <div 
                className={styles.colorPreview}
                style={{
                  background: `linear-gradient(135deg, ${scheme.colors.primary} 0%, ${scheme.colors.secondary} 100%)`,
                }}
              />
              <div className={styles.schemeInfo}>
                <div className={styles.schemeName}>{scheme.name}</div>
                <div className={styles.schemeDescription}>{scheme.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Icon Settings */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Icons & Symbols
        </label>
        
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.showIcons}
              onChange={(e) => onSettingChange('showIcons', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              🎭 Show Category Icons
              <span className={styles.toggleDescription}>
                Display emoji icons next to data values
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Compact Mode */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Layout Density
        </label>
        
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(e) => onSettingChange('compactMode', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              📏 Compact Mode
              <span className={styles.toggleDescription}>
                Reduce spacing and font sizes for more data
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Typography Preview */}
      {settings.colorScheme && (
        <div className={styles.previewSection}>
          <h4 className={styles.previewTitle}>Typography Preview</h4>
          <div 
            className={styles.typographyPreview}
            style={{
              background: colorSchemes.find(s => s.id === settings.colorScheme)?.colors.background,
              color: colorSchemes.find(s => s.id === settings.colorScheme)?.colors.primary,
            }}
          >
            <div className={styles.sampleText}>
              {settings.showIcons && '💰'} Commodities: $1,234.56
            </div>
            <div className={styles.sampleText}>
              {settings.showIcons && '⚡'} Energy Security: HIGH
            </div>
            <div className={styles.sampleText}>
              {settings.showIcons && '🌐'} Power Grid: 98.2% Stable
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS Override */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Advanced Styling
        </label>
        
        <details className={styles.advancedSection}>
          <summary className={styles.advancedToggle}>
            🛠️ Custom CSS Overrides
          </summary>
          
          <div className={styles.cssEditor}>
            <textarea
              className={styles.cssTextarea}
              placeholder="/* Add custom CSS here */
.marquee-item {
  font-family: 'Monaco', monospace;
}

.marquee-value {
  font-weight: bold;
}"
              rows={8}
            />
            <div className={styles.cssHint}>
              💡 Advanced users can add custom CSS to override default styles
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default AppearanceControls;
