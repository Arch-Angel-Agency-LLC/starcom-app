/**
 * Real-Time Notification System Component
 * Displays collaboration notifications, system alerts, and real-time updates
 */

import React, { useEffect, useState, useCallback } from 'react';
import RealTimeEventSystem from '../../services/realTimeEventSystem';
import styles from './NotificationSystem.module.css';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  actionUrl?: string;
  timestamp: Date;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  source?: 'collaboration' | 'system' | 'user';
}

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const eventSystem = RealTimeEventSystem.getInstance();

  const addNotification = useCallback((notificationData: Partial<NotificationItem>) => {
    const notification: NotificationItem = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: notificationData.title || 'Notification',
      message: notificationData.message || '',
      type: notificationData.type || 'info',
      duration: notificationData.duration || 5000,
      timestamp: new Date(),
      priority: notificationData.priority || 'normal',
      source: notificationData.source || 'system',
      ...notificationData
    };

    setNotifications(prev => {
      // Sort by priority and timestamp
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const newNotifications = [...prev, notification].sort((a, b) => {
        const priorityDiff = (priorityOrder[b.priority || 'normal'] || 2) - (priorityOrder[a.priority || 'normal'] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      // Limit to 5 notifications max
      return newNotifications.slice(0, 5);
    });

    // Auto-remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, notification.duration);

    return notification.id;
  }, []);

  useEffect(() => {
    // Subscribe to real-time event system notifications
    const unsubscribe = eventSystem.subscribe(
      'notification-system',
      ['UI_SHOW_NOTIFICATION'],
      (event) => {
        if (event.payload && typeof event.payload === 'object') {
          const payload = event.payload as {
            title?: string;
            message?: string;
            type?: 'info' | 'success' | 'warning' | 'error';
            duration?: number;
            actionUrl?: string;
          };
          addNotification({
            title: payload.title,
            message: payload.message,
            type: payload.type,
            duration: payload.duration,
            actionUrl: payload.actionUrl,
            priority: event.priority,
            source: event.source
          });
        }
      }
    );

    // Legacy custom event support
    const handleNotification = (event: CustomEvent<NotificationItem>) => {
      addNotification(event.detail);
    };

    window.addEventListener('starcom-notification', handleNotification as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('starcom-notification', handleNotification as EventListener);
    };
  }, [eventSystem, addNotification]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string, source?: string) => {
    if (source === 'collaboration') {
      switch (type) {
        case 'success': return '🤝';
        case 'warning': return '⚠️';
        case 'error': return '🚨';
        default: return '👥';
      }
    }
    
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (notification.actionUrl) {
      // Handle navigation or action
      console.log('Navigate to:', notification.actionUrl);
    }
    removeNotification(notification.id);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Group notifications by priority for better organization
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const priority = notification.priority || 'normal';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(notification);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  if (notifications.length === 0) return null;

  return (
    <div className={styles.notificationContainer}>
      {/* Compact header with count and controls */}
      <div className={styles.notificationHeader}>
        <span className={styles.headerTitle}>
          Notifications ({notifications.length})
        </span>
        <div className={styles.headerControls}>
          {notifications.length > 1 && (
            <button
              className={styles.clearAllButton}
              onClick={clearAllNotifications}
              aria-label="Clear all notifications"
              title="Clear all notifications"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      
      {/* Render notifications with priority grouping */}
      <div className={styles.notificationList}>
        {['critical', 'high', 'normal', 'low'].map(priority => {
          const priorityNotifications = groupedNotifications[priority];
          if (!priorityNotifications?.length) return null;

          return (
            <div key={priority} className={styles.priorityGroup}>
              {priorityNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`${styles.notification} ${styles[notification.type]} ${styles[notification.priority || 'normal']} ${styles[notification.source || 'system']}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <span className={styles.notificationIcon}>
                        {getNotificationIcon(notification.type, notification.source)}
                      </span>
                      <span className={styles.notificationTitle}>
                        {notification.title}
                      </span>
                      <button
                        className={styles.closeButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        aria-label="Close notification"
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.notificationMessage}>
                      {notification.message}
                    </div>
                    {notification.actionUrl && (
                      <div className={styles.notificationAction}>
                        <span className={styles.actionHint}>Click to view →</span>
                      </div>
                    )}
                    <div className={styles.notificationMeta}>
                      <span className={styles.notificationTimestamp}>
                        {notification.timestamp.toLocaleTimeString()}
                      </span>
                      {notification.source && (
                        <span className={styles.notificationSource}>
                          {notification.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationSystem;
