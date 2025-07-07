import React from 'react';
import styles from './NotificationSettings.module.css';

/**
 * Notification settings screen component
 * Handles alerts, notification preferences, and channels
 */
const NotificationSettings: React.FC = () => {
  return (
    <div className={styles.notificationSettings}>
      <h2>Notification Settings</h2>
      
      <div className={styles.settingSection}>
        <h3>General Preferences</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="enableNotifications" 
              defaultChecked 
            />
            <label htmlFor="enableNotifications">Enable notifications</label>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="soundAlerts" 
              defaultChecked 
            />
            <label htmlFor="soundAlerts">Play sound for alerts</label>
          </div>
          
          <div className={styles.setting}>
            <label htmlFor="notificationVolume">Alert Volume</label>
            <div className={styles.rangeWithValue}>
              <input 
                type="range" 
                id="notificationVolume" 
                min="0" 
                max="100" 
                step="5" 
                defaultValue="75" 
              />
              <span>75%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Notification Categories</h3>
        
        <div className={styles.notificationTable}>
          <table>
            <thead>
              <tr>
                <th>Event Type</th>
                <th>In-App</th>
                <th>Desktop</th>
                <th>Email</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>System Alerts</td>
                <td><input type="checkbox" defaultChecked /></td>
                <td><input type="checkbox" defaultChecked /></td>
                <td><input type="checkbox" defaultChecked /></td>
                <td>
                  <select defaultValue="high">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Security Events</td>
                <td><input type="checkbox" defaultChecked /></td>
                <td><input type="checkbox" defaultChecked /></td>
                <td><input type="checkbox" defaultChecked /></td>
                <td>
                  <select defaultValue="high">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Data Updates</td>
                <td><input type="checkbox" defaultChecked /></td>
                <td><input type="checkbox" /></td>
                <td><input type="checkbox" /></td>
                <td>
                  <select defaultValue="medium">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Team Activity</td>
                <td><input type="checkbox" defaultChecked /></td>
                <td><input type="checkbox" /></td>
                <td><input type="checkbox" /></td>
                <td>
                  <select defaultValue="medium">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Mentions</td>
                <td><input type="checkbox" defaultChecked /></td>
                <td><input type="checkbox" defaultChecked /></td>
                <td><input type="checkbox" /></td>
                <td>
                  <select defaultValue="high">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Do Not Disturb</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="enableDND" 
            />
            <label htmlFor="enableDND">Enable Do Not Disturb mode</label>
          </div>
          
          <div className={styles.timeRangeSettings}>
            <div className={styles.setting}>
              <label htmlFor="dndStart">From</label>
              <input type="time" id="dndStart" defaultValue="22:00" />
            </div>
            <div className={styles.setting}>
              <label htmlFor="dndEnd">To</label>
              <input type="time" id="dndEnd" defaultValue="08:00" />
            </div>
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

export default NotificationSettings;
