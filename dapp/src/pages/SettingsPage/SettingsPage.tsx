import React, { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import styles from './SettingsPage.module.css';
import { useView } from '../../context/useView';
import { ScreenType } from '../../context/ViewContext';

/**
 * Settings Page component - serves as a container for settings screens
 * This component uses nested routes with the Outlet component to render settings screens
 */
const SettingsPage: React.FC = () => {
  const { currentScreen, navigateToScreen } = useView();
  const navigate = useNavigate();
  const location = useLocation();

  // Settings sidebar navigation structure
  const settingsNavigation = [
    { id: 'profile', label: '👤 Profile', icon: '👤', path: '/settings/profile' },
    { id: 'appearance', label: '🎨 Appearance', icon: '🎨', path: '/settings/appearance' },
    { id: 'security', label: '🔒 Security', icon: '🔒', path: '/settings/security' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔', path: '/settings/notifications' },
    { id: 'advanced', label: '⚙️ Advanced', icon: '⚙️', path: '/settings/advanced' }
  ];

  // Set default settings screen if none is selected
  useEffect(() => {
    if (!isSettingsScreen(currentScreen)) {
      navigateToScreen('profile');
    }
  }, [currentScreen, navigateToScreen]);

  // Check if current screen is a valid settings screen
  const isSettingsScreen = (screen: ScreenType): boolean => {
    return ['profile', 'appearance', 'security', 'notifications', 'advanced'].includes(screen);
  };

  // Handle navigation between settings screens
  const handleNavigation = (path: string, screenId: ScreenType) => {
    navigateToScreen(screenId);
    navigate(path);
  };

  // Go back to main app
  const handleBackToApp = () => {
    navigate('/');
  };

  // Check if a navigation item is active based on the current path
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.settingsHeader}>
        <button className={styles.backButton} onClick={handleBackToApp}>
          ← Back to App
        </button>
        <h1>Settings</h1>
      </div>
      
      <div className={styles.settingsContainer}>
        {/* Settings navigation sidebar */}
        <div className={styles.settingsSidebar}>
          <nav>
            <ul>
              {settingsNavigation.map(item => (
                <li key={item.id} className={isActive(item.path) ? styles.active : ''}>
                  <button onClick={() => handleNavigation(item.path, item.id as ScreenType)}>
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.label}>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        {/* Settings content area - uses Outlet for nested routes */}
        <div className={styles.settingsContent}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
