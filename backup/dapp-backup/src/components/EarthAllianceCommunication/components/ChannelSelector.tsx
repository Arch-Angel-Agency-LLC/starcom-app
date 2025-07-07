import React from 'react';
import { useCommunication } from '../hooks/useCommunication';
import styles from './ChannelSelector.module.css';

interface ChannelSelectorProps {
  className?: string;
}

export const ChannelSelector: React.FC<ChannelSelectorProps> = ({ className = '' }) => {
  const { 
    channels, 
    currentChannel, 
    joinChannel, 
    channelStatus,
    isEmergencyMode,
    emergencyChannels
  } = useCommunication();
  
  // Combine regular and emergency channels, with emergency channels at the top
  const allChannels = isEmergencyMode
    ? [...emergencyChannels, ...channels.filter(c => !emergencyChannels.some(ec => ec.id === c.id))]
    : channels;
    
  const handleChannelSelect = async (channelId: string) => {
    if (currentChannel?.id === channelId) {
      return; // Already selected
    }
    
    try {
      await joinChannel(channelId);
    } catch (error) {
      console.error('Failed to join channel:', error);
      // Error handling could be improved with a toast notification
    }
  };
  
  return (
    <div className={`${styles.channelSelector} ${isEmergencyMode ? styles.emergencyMode : ''} ${className}`}>
      <div className={styles.header}>
        <h3>Channels</h3>
        {isEmergencyMode && (
          <div className={styles.emergencyBadge}>EMERGENCY</div>
        )}
      </div>
      
      {allChannels.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No channels available</p>
        </div>
      ) : (
        <ul className={styles.channelList}>
          {allChannels.map(channel => {
            const isActive = currentChannel?.id === channel.id;
            const status = channelStatus[channel.id];
            const isEmergencyChannel = emergencyChannels.some(c => c.id === channel.id);
            
            return (
              <li 
                key={channel.id}
                className={`
                  ${styles.channelItem} 
                  ${isActive ? styles.active : ''}
                  ${isEmergencyChannel ? styles.emergencyChannel : ''}
                `}
                onClick={() => handleChannelSelect(channel.id)}
              >
                <div className={styles.channelInfo}>
                  <span className={styles.channelName}>{channel.name}</span>
                  {channel.description && (
                    <span className={styles.channelDescription}>{channel.description}</span>
                  )}
                </div>
                
                {status && status.unreadCount > 0 && (
                  <div className={styles.unreadBadge}>
                    {status.unreadCount > 99 ? '99+' : status.unreadCount}
                  </div>
                )}
                
                {isEmergencyChannel && (
                  <div className={styles.emergencyChannelIndicator}>
                    Priority
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
