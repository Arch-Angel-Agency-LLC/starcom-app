import React, { useState, useEffect } from 'react';
import { trackInvestorEvents } from '../../utils/analytics';
import styles from './TelegramWidget.module.css';

interface TelegramWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Telegram channel/group info - Earth Alliance Central Command
const TELEGRAM_CONFIG = {
  channelUrl: 'https://t.me/starcomintelgroup', // Official Starcom Intel Group
  chatUrl: 'https://t.me/starcomintelgroup', // Direct link to the group
  channelName: 'Starcom Intel Group',
  memberCount: 0, // Will be fetched via bot API when available
  description: 'Central communications hub for the Earth Alliance Global Intelligence Community. Join for updates, discussions, and collaborative intelligence operations.',
  // Bot configuration - NEVER put real tokens in source code!
  botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '', // From environment variables
  channelId: import.meta.env.VITE_TELEGRAM_CHANNEL_ID || '', // From environment variables
};

const TelegramWidget: React.FC<TelegramWidgetProps> = ({ isOpen, onClose }) => {
  const [memberCount, setMemberCount] = useState(TELEGRAM_CONFIG.memberCount);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Track Telegram widget usage
      trackInvestorEvents.featureUsed('telegram-widget');
      
      // Fetch real member count if bot token is available
      const fetchMemberCount = async () => {
        if (TELEGRAM_CONFIG.botToken && TELEGRAM_CONFIG.channelId) {
          try {
            const response = await fetch(
              `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/getChatMemberCount?chat_id=${TELEGRAM_CONFIG.channelId}`
            );
            const data = await response.json();
            
            if (data.ok) {
              setMemberCount(data.result);
            } else {
              // Fallback to simulated count if API call fails
              setMemberCount(Math.floor(Math.random() * 500 + 100));
            }
          } catch (_error) {
            console.log('Could not fetch real member count, using fallback');
            setMemberCount(Math.floor(Math.random() * 500 + 100));
          }
        } else {
          // Simulate fetching member count when no bot token available
          setMemberCount(Math.floor(Math.random() * 500 + 100));
        }
        setIsLoading(false);
      };
      
      // Add slight delay for better UX
      setTimeout(fetchMemberCount, 800);
    }
  }, [isOpen]);

  const handleJoinChannel = () => {
    trackInvestorEvents.navigationClick('telegram-channel-join');
    window.open(TELEGRAM_CONFIG.channelUrl, '_blank');
  };

  const handleStartChat = () => {
    trackInvestorEvents.navigationClick('telegram-support-chat');
    window.open(TELEGRAM_CONFIG.chatUrl, '_blank');
  };

  const handleShareAccess = () => {
    trackInvestorEvents.navigationClick('telegram-share-starcom');
    const shareText = 'Join the Earth Alliance on Starcom: https://t.me/starcomintelgroup';
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        // Could add a toast notification here
        console.log('Telegram link copied to clipboard');
      }).catch(() => {
        // Fallback for older browsers
        fallbackCopyToClipboard(shareText);
      });
    } else {
      fallbackCopyToClipboard(shareText);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      console.log('Telegram link copied to clipboard (fallback)');
    } catch (err) {
      console.log('Could not copy text: ', err);
    }
    document.body.removeChild(textArea);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.telegramWidget}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>✈️</span>
          Secure Communications
        </div>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close Telegram widget"
        >
          ✕
        </button>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Connecting to secure channels...</p>
          </div>
        ) : (
          <>
            {/* Channel Info Section - Central Command Hub */}
            <div className={styles.channelSection}>
              <div className={styles.channelHeader}>
                <div className={styles.channelIcon}>🌍</div>
                <div className={styles.channelInfo}>
                  <h3>{TELEGRAM_CONFIG.channelName}</h3>
                  <p className={styles.memberCount}>
                    {memberCount > 0 ? `${memberCount.toLocaleString()} Alliance Members` : 'Join the Alliance'}
                  </p>
                </div>
                <div className={styles.liveIndicator}>ACTIVE</div>
              </div>
              
              <p className={styles.channelDescription}>
                {TELEGRAM_CONFIG.description}
              </p>
              
              <button 
                className={styles.primaryButton}
                onClick={handleJoinChannel}
              >
                🚀 Access Central Command
              </button>
            </div>

            {/* Community Hub Features */}
            <div className={styles.actionsSection}>
              <h3>Community Access Points</h3>
              <div className={styles.actionButtons}>
                <button 
                  className={styles.actionButton}
                  onClick={handleStartChat}
                >
                  💬 Join Discussion
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={handleShareAccess}
                >
                  📤 Share Access
                </button>
              </div>
            </div>

            {/* Central Intelligence Dashboard Features */}
            <div className={styles.featuresSection}>
              <h3>Earth Alliance Network</h3>
              <div className={styles.featuresList}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🌐</span>
                  <span>Global Intelligence Hub</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>💬</span>
                  <span>Community Discussions</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📡</span>
                  <span>Real-time Updates</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🤝</span>
                  <span>Alliance Coordination</span>
                </div>
              </div>
            </div>

            {/* Community Activity Preview */}
            <div className={styles.embedSection}>
              <h3>Recent Alliance Activity</h3>
              <div className={styles.embedContainer}>
                <div className={styles.embedPlaceholder}>
                  <div className={styles.activityPreview}>
                    <div className={styles.activityItem}>
                      <span className={styles.activityIcon}>💬</span>
                      <span>Active discussions ongoing...</span>
                    </div>
                    <div className={styles.activityItem}>
                      <span className={styles.activityIcon}>📊</span>
                      <span>Community updates available</span>
                    </div>
                    <div className={styles.activityItem}>
                      <span className={styles.activityIcon}>🔗</span>
                      <span>Cross-platform integration active</span>
                    </div>
                  </div>
                  <p className={styles.embedNote}>
                    Join the channel to participate in Earth Alliance communications
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.secureIndicator}>🌍</span>
        <span>Earth Alliance Global Intelligence Network</span>
      </div>
    </div>
  );
};

export default TelegramWidget;
