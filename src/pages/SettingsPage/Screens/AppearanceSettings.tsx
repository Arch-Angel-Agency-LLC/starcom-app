import React from 'react';
import styles from './AppearanceSettings.module.css';

/**
 * Appearance settings screen component
 * Handles UI theme, colors, layout preferences
 */
const AppearanceSettings: React.FC = () => {
  return (
    <div className={styles.appearanceSettings}>
      <h2>Appearance Settings</h2>
      
      <div className={styles.settingSection}>
        <h3>Theme</h3>
        
        <div className={styles.themeOptions}>
          <div className={styles.themeOption}>
            <input 
              type="radio" 
              id="theme-dark" 
              name="theme" 
              value="dark" 
              defaultChecked 
            />
            <label htmlFor="theme-dark">
              <div className={styles.themePreview + ' ' + styles.darkTheme}>
                <div className={styles.previewHeader}></div>
                <div className={styles.previewContent}></div>
              </div>
              <span>Dark</span>
            </label>
          </div>
          
          <div className={styles.themeOption}>
            <input 
              type="radio" 
              id="theme-light" 
              name="theme" 
              value="light" 
            />
            <label htmlFor="theme-light">
              <div className={styles.themePreview + ' ' + styles.lightTheme}>
                <div className={styles.previewHeader}></div>
                <div className={styles.previewContent}></div>
              </div>
              <span>Light</span>
            </label>
          </div>
          
          <div className={styles.themeOption}>
            <input 
              type="radio" 
              id="theme-system" 
              name="theme" 
              value="system" 
            />
            <label htmlFor="theme-system">
              <div className={styles.themePreview + ' ' + styles.systemTheme}>
                <div className={styles.previewHeader}></div>
                <div className={styles.previewContent}></div>
              </div>
              <span>System</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Interface Density</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.setting}>
            <label htmlFor="uiDensity">UI Density</label>
            <select id="uiDensity" defaultValue="comfortable">
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>
          
          <div className={styles.setting}>
            <label htmlFor="uiScale">UI Scale</label>
            <div className={styles.rangeWithValue}>
              <input 
                type="range" 
                id="uiScale" 
                min="80" 
                max="120" 
                step="5" 
                defaultValue="100" 
              />
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Layout Options</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="showTopMarquee" 
              defaultChecked 
            />
            <label htmlFor="showTopMarquee">Show top marquee status bar</label>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="enableAutoHide" 
            />
            <label htmlFor="enableAutoHide">Auto-hide panels when not in use</label>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="enableAnimations" 
              defaultChecked 
            />
            <label htmlFor="enableAnimations">Enable UI animations</label>
          </div>
        </div>
      </div>
      
      <div className={styles.actionButtons}>
        <button className={styles.primaryButton}>Save Changes</button>
        <button className={styles.secondaryButton}>Reset to Defaults</button>
      </div>
    </div>
  );
};

export default AppearanceSettings;
