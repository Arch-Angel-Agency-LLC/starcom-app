import React, { useState, useEffect } from 'react';
import { settingsStorage } from '../utils/settingsStorage';
import styles from './SettingsStatusIndicator.module.css';

// AI-NOTE: Component to show users the status of their persistent settings
// Provides visual feedback when settings are saved/loaded

export const SettingsStatusIndicator: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'save' | 'load' | 'error'>('save');

  useEffect(() => {
    // Monitor localStorage changes to show save feedback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('starcom-')) {
        showStatus('Settings saved', 'save');
      }
    };

    // Monitor our settings storage usage
    const showStorageStats = () => {
      const stats = settingsStorage.getStorageStats();
      if (stats.starcomKeys > 0) {
        console.log(`📊 Settings Status: ${stats.starcomKeys} setting groups stored (${Math.round(stats.estimatedSize / 1024)}KB)`);
      }
    };

    const showStatus = (msg: string, statusType: 'save' | 'load' | 'error') => {
      setMessage(msg);
      setType(statusType);
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 2000);
    };

    // Show initial load status
    showStatus('Settings loaded', 'load');
    showStorageStats();

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'save': return '💾';
      case 'load': return '📥';
      case 'error': return '❌';
      default: return '⚙️';
    }
  };

  return (
    <div className={`${styles.statusIndicator} ${styles[type]}`}>
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.message}>{message}</span>
    </div>
  );
};

export default SettingsStatusIndicator;
