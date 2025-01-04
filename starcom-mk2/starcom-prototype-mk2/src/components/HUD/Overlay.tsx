import React, { useEffect, useState } from 'react';

interface Stat {
  label: string;
  value: string | number;
}

interface Notification {
  id: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  priority?: number; // Lower number indicates higher priority
  timestamp?: string; // Adds context for notification timing
}

interface OverlayProps {
  stats: Stat[]; // Array of stats to display
  notifications?: Notification[]; // Optional notifications
  onNotificationClick?: (id: string) => void; // Callback when a notification is clicked
  onStatsUpdate?: () => Promise<Stat[]>; // Function to dynamically fetch updated stats
  onClearNotifications?: () => void; // Callback to clear notifications
  theme?: 'dark' | 'light'; // Theme for the overlay
}

const Overlay: React.FC<OverlayProps> = ({
  stats,
  notifications = [],
  onNotificationClick,
  onStatsUpdate,
  onClearNotifications,
  theme = 'dark',
}) => {
  const [currentStats, setCurrentStats] = useState<Stat[]>(stats);
  const [sortedNotifications, setSortedNotifications] = useState<Notification[]>([]);

  // Dynamically fetch updated stats
  useEffect(() => {
    if (onStatsUpdate) {
      const fetchStats = async () => {
        try {
          const updatedStats = await onStatsUpdate();
          setCurrentStats(updatedStats);
        } catch (error) {
          console.error('Error fetching updated stats:', error);
        }
      };

      fetchStats();
    }
  }, [onStatsUpdate]);

  // Sort notifications by priority and timestamp
  useEffect(() => {
    const sorted = [...notifications].sort(
      (a, b) =>
        (a.priority ?? 999) - (b.priority ?? 999) || 
        new Date(b.timestamp ?? '').getTime() - new Date(a.timestamp ?? '').getTime()
    );
    setSortedNotifications(sorted);
  }, [notifications]);

  const isDarkTheme = theme === 'dark';

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        zIndex: 1000,
        pointerEvents: 'none', // Allows interactions with underlying globe
      }}
    >
      {/* Stats Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          color: isDarkTheme ? 'white' : 'black',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '10px',
          pointerEvents: 'auto', // Allows interaction
        }}
      >
        {currentStats.map((stat, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{stat.label}</span>
            <br />
            <span style={{ fontSize: '18px' }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Notifications Section */}
      {sortedNotifications.length > 0 && (
        <div
          style={{
            background: isDarkTheme ? 'rgba(20, 20, 20, 0.9)' : 'rgba(240, 240, 240, 0.9)',
            color: isDarkTheme ? 'white' : 'black',
            padding: '10px',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            pointerEvents: 'auto', // Allows interaction
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h4 style={{ margin: 0 }}>Notifications</h4>
            {onClearNotifications && (
              <button
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={onClearNotifications}
              >
                Clear All
              </button>
            )}
          </div>
          {sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                marginBottom: '8px',
                padding: '10px',
                backgroundColor:
                  notification.type === 'error'
                    ? '#dc3545'
                    : notification.type === 'warning'
                    ? '#ffc107'
                    : notification.type === 'success'
                    ? '#28a745'
                    : '#007bff',
                borderRadius: '5px',
                cursor: onNotificationClick ? 'pointer' : 'default',
              }}
              onClick={() => onNotificationClick && onNotificationClick(notification.id)}
            >
              <div>
                <strong>{notification.type?.toUpperCase() || 'INFO'}</strong> - {notification.message}
              </div>
              {notification.timestamp && (
                <div style={{ fontSize: '12px', color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
                  {new Date(notification.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Overlay;