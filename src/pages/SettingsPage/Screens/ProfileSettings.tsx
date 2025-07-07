import React from 'react';
import styles from './ProfileSettings.module.css';

/**
 * Profile settings screen component
 * Handles user profile configuration, avatar, and account settings
 */
const ProfileSettings: React.FC = () => {
  return (
    <div className={styles.profileSettings}>
      <h2>Profile Settings</h2>
      
      <div className={styles.settingSection}>
        <h3>User Information</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.setting}>
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              placeholder="Your display name"
              defaultValue="Agent Starcom"
            />
          </div>
          
          <div className={styles.setting}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Your email address"
              defaultValue="agent@starcom.agency"
            />
          </div>
          
          <div className={styles.setting}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              placeholder="Tell us about yourself"
              defaultValue="OSINT specialist and digital investigator."
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Profile Picture</h3>
        
        <div className={styles.avatarSection}>
          <div className={styles.currentAvatar}>
            <div className={styles.avatarPlaceholder}>
              👤
            </div>
          </div>
          
          <div className={styles.avatarControls}>
            <button className={styles.primaryButton}>Upload New Image</button>
            <button className={styles.secondaryButton}>Remove</button>
          </div>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Account Settings</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.setting}>
            <label htmlFor="language">Language</label>
            <select id="language" defaultValue="en">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="jp">Japanese</option>
            </select>
          </div>
          
          <div className={styles.setting}>
            <label htmlFor="timezone">Timezone</label>
            <select id="timezone" defaultValue="utc">
              <option value="utc">UTC</option>
              <option value="est">Eastern Time (ET)</option>
              <option value="cst">Central Time (CT)</option>
              <option value="mst">Mountain Time (MT)</option>
              <option value="pst">Pacific Time (PT)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className={styles.actionButtons}>
        <button className={styles.primaryButton}>Save Changes</button>
        <button className={styles.secondaryButton}>Cancel</button>
      </div>
    </div>
  );
};

export default ProfileSettings;
