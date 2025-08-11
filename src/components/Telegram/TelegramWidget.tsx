import React, { useState, useEffect } from 'react';
import { trackInvestorEvents } from '../../utils/analytics';
import styles from './TelegramWidget.module.css';
import { XOR_KEY, SHARD_A, SHARD_B, SHARD_C, gatedAssembleToken, HONEY_TOKENS } from '../../config/telegramShards';

// Runtime config injection interface (for dApp embeddings that can't use build-time env vars)
declare global {
  interface Window {
    STARCOM_TELEGRAM_CONFIG?: {
      botToken?: string;
      channelId?: string;
    };
  }
  interface ImportMetaEnv {
    VITE_TELEGRAM_BOT_TOKEN?: string;
    VITE_TELEGRAM_CHANNEL_ID?: string;
    VITE_TELEGRAM_BOT_TOKEN_ENC?: string; // base64 of XOR'd bytes
  }
}

interface TelegramWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TelegramChatInfo {
  id: number;
  title: string;
  description?: string;
  username?: string;
  member_count?: number;
  type: string;
}

// HARD-CODED / OBFUSCATED FALLBACKS
// NOTE: This is only light obfuscation (not real security). It deters trivial scraping of a plain string.
// Real protection requires a server proxy so the token never reaches the client.
// Steps to update with real token (example key=7):
//   1. In a local Node REPL or browser console run:
//        const key=7; const t='123456789:ABCdefREALTOKEN'; t.split('').map(c=>c.charCodeAt(0)^key)
//   2. Replace the BOT_TOKEN_SEGMENTS array below with the resulting numbers.
//   3. (Optional) Instead set VITE_TELEGRAM_BOT_TOKEN in .env.local OR provide an encoded variant via
//        VITE_TELEGRAM_BOT_TOKEN_ENC=base64(xorBytes)  (where xorBytes is Uint8Array of the XORed char codes)
//   4. Rotate occasionally.
// Using shard-based approach (see src/config/telegramShards.ts)
const OBF_KEY = XOR_KEY; // shared XOR key (rotate along with shards)

// Channel ID can still be a plain string since it's not sensitive; keep placeholder for detection.
const HARDCODED_CHANNEL_ID = 'your_real_channel_id_here'; // TODO: replace with real channel id e.g. -1001234567890

function decodeBase64Xor(b64: string, key: number): string {
  try {
    const raw = atob(b64);
    const chars: string[] = [];
    for (let i = 0; i < raw.length; i++) {
      chars.push(String.fromCharCode(raw.charCodeAt(i) ^ key));
    }
    return chars.join('');
  } catch {
    return '';
  }
}

// Build the hardcoded bot token via (env > encoded env > obfuscated array > explicit placeholder)
const HARDCODED_BOT_TOKEN = (() => {
  // Explicitly avoid keeping final token as a literal in source
  const encodedEnv = import.meta.env?.VITE_TELEGRAM_BOT_TOKEN_ENC;
  if (encodedEnv) {
    const decoded = decodeBase64Xor(encodedEnv, OBF_KEY);
    if (decoded && !decoded.includes('PLACEHOLDER')) return decoded;
  }
  // Shards decoded lazily via gatedAssembleToken; keep placeholder here.
  return 'your_real_bot_token_here';
})();

// Lazy bot token resolution with interaction + timing gate + honey token trap
let botTokenCache: string | null = null;
let assemblingPromise: Promise<string> | null = null;

async function resolveBotTokenLazy(): Promise<string> {
  if (botTokenCache) return botTokenCache;
  // Highest precedence immediate sources
  const immediate = (typeof window !== 'undefined' && window.STARCOM_TELEGRAM_CONFIG?.botToken?.trim())
    || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (immediate) {
    botTokenCache = immediate;
    return immediate;
  }
  if (!assemblingPromise) {
    assemblingPromise = (async () => {
      const { token, honey } = await gatedAssembleToken([SHARD_A, SHARD_B, SHARD_C], OBF_KEY, {
        earliestMs: 140,
        requireInteraction: true,
        randomDelayRange: [150, 380]
      });
      if (honey) {
        // Optional analytics hook if defined
        const maybeAny = trackInvestorEvents as unknown as { securityEvent?: (code: string) => void };
        maybeAny.securityEvent?.('telegram-honey-token-used');
      }
      const finalToken = token || HARDCODED_BOT_TOKEN;
      botTokenCache = finalToken;
      return finalToken;
    })();
  }
  return assemblingPromise;
}

// Placeholder indicates pending lazy resolution
const resolvedBotToken = 'PENDING_INTERACTION';

const resolvedChannelId = (typeof window !== 'undefined' && window.STARCOM_TELEGRAM_CONFIG?.channelId?.trim())
  || (import.meta.env.VITE_TELEGRAM_CHANNEL_ID as string | undefined)
  || HARDCODED_CHANNEL_ID;

// Unified Telegram configuration object
const TELEGRAM_CONFIG = {
  channelUrl: 'https://t.me/starcomintelgroup',
  channelUsername: '@starcomintelgroup',
  botToken: resolvedBotToken,
  channelId: resolvedChannelId,
};

const TelegramWidget: React.FC<TelegramWidgetProps> = ({ isOpen, onClose }) => {
  const [chatInfo, setChatInfo] = useState<TelegramChatInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const [lastMemberCount, setLastMemberCount] = useState<number | null>(null);

  // Fetch real Telegram data
  const fetchTelegramData = async () => {
    // Determine if configuration still uses placeholders (all sources missing or still tagged)
    const missingToken = !TELEGRAM_CONFIG.botToken 
      || TELEGRAM_CONFIG.botToken === 'PENDING_INTERACTION'
      || TELEGRAM_CONFIG.botToken.includes('your_real_bot_token_here')
      || TELEGRAM_CONFIG.botToken.includes('PLACEHOLDER_TOKEN');
    const missingChannel = !TELEGRAM_CONFIG.channelId || TELEGRAM_CONFIG.channelId.includes('your_real_channel_id_here');
    if (missingToken || missingChannel) {
      setError('Bot credentials not configured');
      setIsLoading(false);
      return; // Abort real fetch until configured
    }

    try {
      setError(null);
      
      // Resolve (may wait for interaction + random delay)
      const realToken = await resolveBotTokenLazy();
      if (HONEY_TOKENS.includes(realToken)) {
        setError('Bot credentials not configured');
        setIsLoading(false);
        return;
      }
      TELEGRAM_CONFIG.botToken = realToken;
      const chatResponse = await fetch(`https://api.telegram.org/bot${realToken}/getChat?chat_id=${TELEGRAM_CONFIG.channelId}`);
      const chatData = await chatResponse.json();
      
      if (chatData.ok) {
        setChatInfo(chatData.result);
        setHasRealData(true);
      } else {
        throw new Error(`Telegram API error: ${chatData.description}`);
      }

      // Get member count (separate call for channels)
  const memberResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/getChatMemberCount?chat_id=${TELEGRAM_CONFIG.channelId}`);
      const memberData = await memberResponse.json();
      
      if (memberData.ok && chatData.result) {
        const newMemberCount = memberData.result;
        setLastMemberCount(prev => prev); // Keep track of previous count
        setChatInfo(prev => prev ? { ...prev, member_count: newMemberCount } : null);
        setLastMemberCount(newMemberCount);
      }

    } catch (err) {
      console.error('Failed to fetch Telegram data:', err);
      setError('Failed to connect to Telegram');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      trackInvestorEvents.featureUsed('telegram-widget');
      fetchTelegramData();
    }
  }, [isOpen]);

  // Real-time member count updates
  useEffect(() => {
    if (!isOpen || !hasRealData) return;

    const updateMemberCount = async () => {
      try {
  const realToken = botTokenCache || (await resolveBotTokenLazy());
  if (HONEY_TOKENS.includes(realToken)) return; // skip updates if honey token path
  const memberResponse = await fetch(`https://api.telegram.org/bot${realToken}/getChatMemberCount?chat_id=${TELEGRAM_CONFIG.channelId}`);
        const memberData = await memberResponse.json();
        
        if (memberData.ok) {
          const newCount = memberData.result;
          setChatInfo(prev => {
            if (prev && prev.member_count !== newCount) {
              // Member count changed - update with visual feedback
              setLastMemberCount(prev.member_count || 0);
              return { ...prev, member_count: newCount };
            }
            return prev;
          });
        }
      } catch (_err) {
        // Silently fail - don't disrupt user experience
      }
    };

    // Update member count every 30 seconds
    const interval = setInterval(updateMemberCount, 30000);
    return () => clearInterval(interval);
  }, [isOpen, hasRealData]);

  const handleJoinChannel = () => {
    trackInvestorEvents.navigationClick('telegram-channel-join');
    window.open(TELEGRAM_CONFIG.channelUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.telegramWidget}>
      <div className={styles.header}>
        <div className={styles.title}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ marginRight: '8px', color: '#ffffff' }}
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram
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
            <p>Connecting to Telegram API...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>⚠️ {error}</p>
            {error.includes('placeholder') ? (
              <div className={styles.configInstructions}>
                <p className={styles.helpText}>
                  <strong>Setup Required:</strong>
                </p>
                <ol className={styles.setupSteps}>
                  <li>Contact @BotFather on Telegram</li>
                  <li>Get bot token for @starcomintel_bot</li>
                  <li>Get channel ID for @starcomintelgroup</li>
                  <li>Update .env.local with real values</li>
                </ol>
                <div className={styles.envExample}>
                  <code>VITE_TELEGRAM_BOT_TOKEN=123456789:ABCdef...</code><br/>
                  <code>VITE_TELEGRAM_CHANNEL_ID=-1001234567890</code>
                </div>
              </div>
            ) : (
              <p className={styles.helpText}>
                Check bot permissions and channel access
              </p>
            )}
            <button 
              className={styles.primaryButton}
              onClick={handleJoinChannel}
            >
              📱 Join Channel Manually
            </button>
          </div>
        ) : (
          <>
            {/* Real Channel Info */}
            {chatInfo && (
              <div className={styles.channelSection}>
                <div className={styles.channelHeader}>
                  <div className={styles.channelInfo}>
                    <h3>{chatInfo.title}</h3>
                    <p className={styles.memberCount}>
                      {chatInfo.member_count ? (
                        <>
                          <span className={lastMemberCount !== null && lastMemberCount !== chatInfo.member_count ? styles.memberCountUpdated : ''}>
                            {chatInfo.member_count.toLocaleString()} members
                          </span>
                          {lastMemberCount !== null && lastMemberCount !== chatInfo.member_count && (
                            <span className={styles.memberChange}>
                              {chatInfo.member_count > lastMemberCount ? ' 📈' : ' 📉'}
                            </span>
                          )}
                        </>
                      ) : (
                        'Private group'
                      )}
                    </p>
                    <p className={styles.channelId}>
                      {TELEGRAM_CONFIG.channelUsername}
                    </p>
                  </div>
                </div>
                
                {chatInfo.description && (
                  <p className={styles.channelDescription}>
                    {chatInfo.description}
                  </p>
                )}
                
                <button 
                  className={styles.primaryButton}
                  onClick={handleJoinChannel}
                >
                  🔗 Join Channel
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.uplinkIndicator}>
          <span className={hasRealData ? styles.glowingGreenDot : styles.glowingRedDot}></span>
          <span>
            {hasRealData ? 'Telegram Uplink Online' : 'Uplink Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TelegramWidget;
