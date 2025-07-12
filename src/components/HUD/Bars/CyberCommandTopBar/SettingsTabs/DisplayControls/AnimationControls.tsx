// AnimationControls.tsx
// Animation settings controls for display tab
import React from 'react';
import { EnhancedSettings } from '../../EnhancedSettingsPopup';
import styles from './AnimationControls.module.css';

export interface AnimationControlsProps {
  settings: EnhancedSettings;
  onSettingChange: <K extends keyof EnhancedSettings>(key: K, value: EnhancedSettings[K]) => void;
  previewMode: boolean;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
  settings,
  onSettingChange,
  previewMode,
}) => {
  const speedOptions = [
    { value: 0.25, label: '🐌 Very Slow', description: '4x slower than normal' },
    { value: 0.5, label: '🚶 Slow', description: '2x slower than normal' },
    { value: 1.0, label: '🚀 Normal', description: 'Default speed' },
    { value: 1.5, label: '⚡ Fast', description: '1.5x faster than normal' },
    { value: 2.0, label: '💨 Very Fast', description: '2x faster than normal' },
    { value: 3.0, label: '🏎️ Ludicrous', description: '3x faster than normal' },
  ];

  return (
    <div className={styles.animationControls}>
      {/* Speed Control */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Scroll Speed
          <span className={styles.currentValue}>
            {settings.animationSpeed}x
          </span>
        </label>
        
        <div className={styles.speedSelector}>
          {speedOptions.map((option) => (
            <button
              key={option.value}
              className={`${styles.speedOption} ${
                settings.animationSpeed === option.value ? styles.active : ''
              }`}
              onClick={() => onSettingChange('animationSpeed', option.value)}
              title={option.description}
            >
              <div className={styles.speedLabel}>{option.label}</div>
              <div className={styles.speedValue}>{option.value}x</div>
            </button>
          ))}
        </div>
        
        {/* Custom Speed Slider */}
        <div className={styles.customSlider}>
          <label className={styles.sliderLabel}>
            Custom Speed
          </label>
          <div className={styles.sliderContainer}>
            <span className={styles.sliderMin}>0.1x</span>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={settings.animationSpeed}
              onChange={(e) => onSettingChange('animationSpeed', parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderMax}>5.0x</span>
          </div>
        </div>
      </div>

      {/* Physics Controls */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Motion Physics
        </label>
        
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.momentumPhysics}
              onChange={(e) => onSettingChange('momentumPhysics', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              🌊 Momentum Physics
              <span className={styles.toggleDescription}>
                Smooth acceleration and deceleration
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Drag Controls */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Interaction
        </label>
        
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.enableDrag}
              onChange={(e) => onSettingChange('enableDrag', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              👆 Drag to Scroll
              <span className={styles.toggleDescription}>
                Allow manual scrolling with mouse/touch
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Performance Mode */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          Performance
        </label>
        
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.performanceMode}
              onChange={(e) => onSettingChange('performanceMode', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              ⚡ Performance Mode
              <span className={styles.toggleDescription}>
                Reduce animations for better performance
              </span>
            </span>
          </label>
        </div>
      </div>

      {previewMode && (
        <div className={styles.previewWarning}>
          ⚠️ Some animation changes require page refresh to fully apply.
        </div>
      )}
    </div>
  );
};

export default AnimationControls;
