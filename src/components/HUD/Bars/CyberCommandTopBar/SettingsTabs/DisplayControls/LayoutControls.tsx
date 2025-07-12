// LayoutControls.tsx
// Layout and spacing controls for display tab
import React from 'react';
import { EnhancedSettings } from '../../EnhancedSettingsPopup';
import styles from './LayoutControls.module.css';

export interface LayoutControlsProps {
  settings: EnhancedSettings;
  onSettingChange: <K extends keyof EnhancedSettings>(key: K, value: EnhancedSettings[K]) => void;
  previewMode: boolean;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({
  settings,
  onSettingChange,
  previewMode,
}) => {
  return (
    <div className={styles.layoutControls}>
      {/* Data Point Limit */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Data Points Display
          <span className={styles.currentValue}>
            Max: {settings.maxDataPoints} items
          </span>
        </label>
        
        <div className={styles.sliderContainer}>
          <span className={styles.sliderMin}>5</span>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={settings.maxDataPoints}
            onChange={(e) => onSettingChange('maxDataPoints', parseInt(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.sliderMax}>50</span>
        </div>
        
        <div className={styles.sliderDescription}>
          Control how many data points are shown in the marquee at once.
          More points = more information but slower performance.
        </div>
      </div>

      {/* Spacing Controls */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Spacing & Sizing
        </label>
        
        <div className={styles.spacingGrid}>
          <div className={styles.spacingControl}>
            <label className={styles.spacingLabel}>Item Padding</label>
            <select className={styles.spacingSelect} defaultValue="normal">
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>
          
          <div className={styles.spacingControl}>
            <label className={styles.spacingLabel}>Font Size</label>
            <select className={styles.spacingSelect} defaultValue="normal">
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>
          
          <div className={styles.spacingControl}>
            <label className={styles.spacingLabel}>Border Radius</label>
            <select className={styles.spacingSelect} defaultValue="normal">
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="round">Round</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsiveness */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Responsive Behavior
        </label>
        
        <div className={styles.responsiveOptions}>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="responsive"
              value="adaptive"
              defaultChecked
            />
            <span className={styles.radioLabel}>
              📱 Adaptive
              <span className={styles.radioDescription}>
                Automatically adjust for screen size
              </span>
            </span>
          </label>
          
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="responsive"
              value="fixed"
            />
            <span className={styles.radioLabel}>
              🖥️ Fixed
              <span className={styles.radioDescription}>
                Maintain consistent size across devices
              </span>
            </span>
          </label>
          
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="responsive"
              value="mobile-first"
            />
            <span className={styles.radioLabel}>
              📲 Mobile First
              <span className={styles.radioDescription}>
                Optimized for mobile devices
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Alignment */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Content Alignment
        </label>
        
        <div className={styles.alignmentControls}>
          <div className={styles.alignmentGroup}>
            <label className={styles.alignmentLabel}>Vertical</label>
            <div className={styles.alignmentButtons}>
              <button className={`${styles.alignmentButton} ${styles.active}`} title="Top">
                ⬆️
              </button>
              <button className={styles.alignmentButton} title="Center">
                ↔️
              </button>
              <button className={styles.alignmentButton} title="Bottom">
                ⬇️
              </button>
            </div>
          </div>
          
          <div className={styles.alignmentGroup}>
            <label className={styles.alignmentLabel}>Text</label>
            <div className={styles.alignmentButtons}>
              <button className={styles.alignmentButton} title="Left">
                ⬅️
              </button>
              <button className={`${styles.alignmentButton} ${styles.active}`} title="Center">
                ↕️
              </button>
              <button className={styles.alignmentButton} title="Right">
                ➡️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Preview */}
      <div className={styles.layoutPreview}>
        <h4 className={styles.previewTitle}>Layout Preview</h4>
        <div className={styles.previewContainer}>
          <div className={styles.previewMarquee}>
            <div className={styles.previewItem}>
              <span>💰</span>
              <span>Commodities:</span>
              <span>$1,234</span>
            </div>
            <div className={styles.previewItem}>
              <span>⚡</span>
              <span>Energy:</span>
              <span>HIGH</span>
            </div>
            <div className={styles.previewItem}>
              <span>🌐</span>
              <span>Grid:</span>
              <span>98.2%</span>
            </div>
          </div>
        </div>
        
        {previewMode && (
          <div className={styles.livePreviewNote}>
            💡 Changes are reflected in the main marquee above
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutControls;
