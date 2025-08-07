import React, { useState, useEffect } from 'react';
import { useDiscordStats } from '../../hooks/useDiscordStats';
import { trackInvestorEvents } from '../../utils/analytics';
import { discordBotService } from '../../services/discordBotService';
import styles from './DiscordWidget.module.css';

interface DiscordWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const DISCORD_CONFIG = {
  serverUrl: 'https://discord.gg/Mea5v8pQmt',
  serverId: '1145517675389403287', // Real Discord server ID
  serverName: 'Starcom Earth Alliance', // Will be replaced by real API data
  description: 'Join the Earth Alliance community for real-time intelligence sharing, mission coordination, and global security collaboration.',
  embedWidgetUrl: 'https://discord.com/widget?id=1145517675389403287&theme=dark', // Real Discord widget embed
  webhookUrl: 'https://discord.com/api/webhooks/1402691803630669926/2BPOdRKq1djDjDRN_N8tpdQ1IdNL9zOSthoJjxWlW6fDiHn_inLvEfJ6lVpBjb_X2qiy'
};

interface DiscordMember {
  id: string;
  username: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  avatar?: string;
}

interface DiscordChannel {
  id: string;
  name: string;
  position: number;
}

interface DiscordWidgetData {
  name: string;
  instant_invite: string;
  channels: DiscordChannel[];
  members: DiscordMember[];
  presence_count: number;
}

const DiscordWidget: React.FC<DiscordWidgetProps> = ({ isOpen, onClose }) => {
  const { error } = useDiscordStats();
  const [widgetData, setWidgetData] = useState<DiscordWidgetData | null>(null);
  const [totalMemberCount, setTotalMemberCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Track Discord widget usage
      trackInvestorEvents.featureUsed('discord-widget');
      
      // Fetch both widget data and bot data in parallel for efficiency
      const fetchDiscordData = async () => {
        try {
          // Start both requests in parallel
          const [widgetResponse, botDataPromise] = await Promise.allSettled([
            fetch(`https://discord.com/api/guilds/${DISCORD_CONFIG.serverId}/widget.json`),
            discordBotService.getTotalMemberCount(DISCORD_CONFIG.serverId)
          ]);

          // Handle widget data
          let widgetResult: DiscordWidgetData | null = null;
          if (widgetResponse.status === 'fulfilled' && widgetResponse.value.ok) {
            widgetResult = await widgetResponse.value.json();
            console.log('Discord API response:', widgetResult);
            setWidgetData(widgetResult);
          } else {
            console.log('Discord widget API failed');
            widgetResult = {
              name: 'Discord Server (Widget Disabled)',
              instant_invite: DISCORD_CONFIG.serverUrl,
              channels: [],
              members: [],
              presence_count: 0
            };
            setWidgetData(widgetResult);
          }

          // Handle bot data - only use real data, no estimation
          if (botDataPromise.status === 'fulfilled' && botDataPromise.value) {
            setTotalMemberCount(botDataPromise.value);
            console.log('Discord: Real total member count:', botDataPromise.value);
          } else {
            // No fallback to estimation - only show real data
            setTotalMemberCount(null);
            
            if (botDataPromise.status === 'rejected') {
              console.log('Discord bot API failed, no member count available:', botDataPromise.reason);
            }
          }
        } catch (error) {
          console.error('Discord data fetch error:', error);
          setTotalMemberCount(null);
        }
      };

      fetchDiscordData().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen]); // Removed onlineCount dependency to prevent excessive API calls

  const handleJoinServer = () => {
    trackInvestorEvents.navigationClick('discord-server-join');
    window.open(DISCORD_CONFIG.serverUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#43b581';
      case 'idle': return '#faa61a';
      case 'dnd': return '#f04747';
      default: return '#747f8d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'idle': return '🟡';
      case 'dnd': return '🔴';
      default: return '⚫';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.discordWidget}>
      <div className={styles.header}>
        <div className={styles.title}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ marginRight: '8px', color: '#ffffff' }}
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.446.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Discord
        </div>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close Discord widget"
        >
          ✕
        </button>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Connecting to Discord server...</p>
          </div>
        ) : (
          <>
            {/* Server Info Section */}
            <div className={styles.serverSection}>
              <div className={styles.serverHeader}>
                <div className={styles.serverIcon}>
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    style={{ color: '#ffffff' }}
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.446.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div className={styles.serverInfo}>
                  <h3>{widgetData?.name || DISCORD_CONFIG.serverName}</h3>
                  <p className={styles.memberCount}>
                    {totalMemberCount ? (
                      <>
                        {totalMemberCount.toLocaleString()} Total Members
                      </>
                    ) : (
                      'Discord Server'
                    )}
                  </p>
                </div>
                <div className={styles.statusIndicator}>
                  {error ? (
                    <span className={styles.errorStatus}>OFFLINE</span>
                  ) : (
                    <span className={styles.onlineStatus}>ONLINE</span>
                  )}
                </div>
              </div>
              
              <p className={styles.serverDescription}>
                {DISCORD_CONFIG.description}
              </p>
              
              <div className={styles.actionButtons}>
                <button 
                  className={styles.actionButton}
                  onClick={handleJoinServer}
                >
                  Join Discord
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={() => {
                    trackInvestorEvents.navigationClick('discord-widget-share');
                    navigator.clipboard?.writeText(DISCORD_CONFIG.serverUrl);
                  }}
                >
                  Share Invite
                </button>
              </div>
            </div>

            {/* Online Members */}
            {widgetData?.members && widgetData.members.length > 0 && (
              <div className={styles.membersSection}>
                <h3>
                  {(() => {
                    const onlineCount = widgetData?.presence_count || 0;
                    return onlineCount === 1 ? '1 Member Online' : `${onlineCount} Members Online`;
                  })()}
                </h3>
                <div className={styles.membersScrollContainer}>
                  <div className={styles.membersList}>
                    {widgetData.members.filter(m => m.status !== 'offline').slice(0, 12).map(member => (
                      <div key={member.id} className={styles.memberItem}>
                        <div 
                          className={styles.memberStatus}
                          style={{ backgroundColor: getStatusColor(member.status) }}
                        >
                          {getStatusIcon(member.status)}
                        </div>
                        <span className={styles.memberName}>{member.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.uplinkIndicator}>
          <span className={widgetData && widgetData.presence_count !== undefined ? styles.glowingGreenDot : styles.glowingRedDot}></span>
          <span>
            {widgetData && widgetData.presence_count !== undefined ? 'Discord Uplink Online' : 'Uplink Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DiscordWidget;
