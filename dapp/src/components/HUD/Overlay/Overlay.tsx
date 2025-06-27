import React from 'react';

interface OverlayProps {
  stats: { label: string; value: string | number }[];
  notifications?: { id: string; message: string }[];
}

const Overlay: React.FC<OverlayProps> = ({ stats, notifications = [] }) => {
  return (
    <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px', marginBottom: '10px' }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <strong>{stat.label}</strong>
            <br />
            <span>{stat.value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} style={{ marginBottom: '8px', padding: '10px' }}>
              <div>{notification.message}</div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center' }}>No notifications available</p>
        )}
      </div>
    </div>
  );
};

export default Overlay;