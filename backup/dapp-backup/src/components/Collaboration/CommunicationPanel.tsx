import React, { useState, useEffect, useRef } from 'react';
import NostrService, { NostrMessage, NostrTeamChannel } from '../../services/nostrService';
import { AgencyType, ClearanceLevel } from '../../types';
import styles from './CommunicationPanel.module.css';

interface CommunicationPanelProps {
  teamId?: string;
  userDID?: string;
  userAgency?: AgencyType;
  clearanceLevel?: ClearanceLevel;
}

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  teamId = 'demo-team',
  userDID = 'did:socom:demo:user',
  userAgency = 'CYBER_COMMAND',
  clearanceLevel = 'CONFIDENTIAL'
}) => {
  const [messages, setMessages] = useState<NostrMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState<NostrTeamChannel | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<NostrMessage['messageType']>('text');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nostrService = NostrService.getInstance();

  // Initialize Nostr service and create demo channel
  useEffect(() => {
    // TODO: Add support for investigation cross-referencing and link analysis - PRIORITY: MEDIUM
    const initializeNostr = async () => {
      try {
        // Wait for service to be ready
        if (nostrService.isReady()) {
          setIsConnected(true);
          nostrService.setUserDID(userDID);

          // Create a demo team channel
          const channel = await nostrService.createTeamChannel(
            teamId,
            `${userAgency} Secure Channel`,
            clearanceLevel,
            userAgency,
            'SOCOM/NIST compliant secure communications'
          );

          // Join the channel
          await nostrService.joinTeamChannel(channel.id, userDID, clearanceLevel);

          setActiveChannel(channel);
          setMessages(nostrService.getChannelMessages(channel.id));
        } else {
          // Retry after a short delay
          setTimeout(initializeNostr, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize Nostr communication:', error);
      }
    };

    initializeNostr();
  }, [teamId, userDID, userAgency, clearanceLevel]);

  // Listen for new messages
  useEffect(() => {
    const handleMessageReceived = (event: CustomEvent) => {
      const message = event.detail as NostrMessage;
      if (activeChannel && message.channelId === activeChannel.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    const handleMessageSent = (event: CustomEvent) => {
      const message = event.detail as NostrMessage;
      if (activeChannel && message.channelId === activeChannel.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    window.addEventListener('nostr-message-received', handleMessageReceived as EventListener);
    window.addEventListener('nostr-message-sent', handleMessageSent as EventListener);

    return () => {
      window.removeEventListener('nostr-message-received', handleMessageReceived as EventListener);
      window.removeEventListener('nostr-message-sent', handleMessageSent as EventListener);
    };
  }, [activeChannel]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || !isConnected) return;

    try {
      await nostrService.sendMessage(
        activeChannel.id,
        newMessage.trim(),
        messageType
      );
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get agency color
  const getAgencyColor = (agency: AgencyType): string => {
    switch (agency) {
      case 'CYBER_COMMAND': return '#00ff41';
      case 'SPACE_FORCE': return '#0099ff';
      case 'SOCOM': return '#ff6600';
      case 'NSA': return '#9900ff';
      case 'CIA': return '#ff0066';
      default: return '#ffffff';
    }
  };

  // Get clearance color
  const getClearanceColor = (level: ClearanceLevel): string => {
    switch (level) {
      case 'UNCLASSIFIED': return '#00ff00';
      case 'CONFIDENTIAL': return '#ffff00';
      case 'SECRET': return '#ff6600';
      case 'TOP_SECRET': return '#ff0000';
      default: return '#ffffff';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simulate some demo messages for demonstration
  const simulateDemoMessages = () => {
    if (!activeChannel) return;

    const demoMessages = [
      { content: 'Threat detected in sector 7. Initiating investigation protocol.', agency: 'CYBER_COMMAND' as AgencyType, type: 'alert' as const },
      { content: 'Intelligence package uploaded to secure IPFS. Hash: QmX...abc123', agency: 'NSA' as AgencyType, type: 'intelligence' as const },
      { content: 'Team Alpha ready for deployment. All systems green.', agency: 'SOCOM' as AgencyType, type: 'status' as const }
    ];

    demoMessages.forEach((msg, index) => {
      setTimeout(() => {
        nostrService.simulateIncomingMessage(
          activeChannel.id,
          msg.content,
          msg.agency,
          msg.type
        );
      }, (index + 1) * 2000);
    });
  };

  if (!isConnected) {
    return (
      <div className={styles.communicationPanel}>
        <div className={styles.connecting}>
          <div className={styles.spinner}></div>
          <p>Establishing secure Nostr connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.communicationPanel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.channelInfo}>
          <h4>🔒 Secure Communications</h4>
          {activeChannel && (
            <div className={styles.channelDetails}>
              <span className={styles.channelName}>{activeChannel.name}</span>
              <span 
                className={styles.clearanceBadge}
                style={{ backgroundColor: getClearanceColor(activeChannel.clearanceLevel) }}
              >
                {activeChannel.clearanceLevel}
              </span>
            </div>
          )}
        </div>
        <div className={styles.connectionStatus}>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot}></span>
            <span>Nostr Secure</span>
          </div>
          <button 
            className={styles.demoBtn}
            onClick={simulateDemoMessages}
            title="Simulate incoming messages"
          >
            📡 Demo
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>🔐 Secure channel established</p>
            <p>Quantum-safe communications ready</p>
            <button 
              className={styles.startBtn}
              onClick={simulateDemoMessages}
            >
              Start Demo Conversation
            </button>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.message} ${message.senderId === nostrService.getTeamChannels()[0]?.participants[0] ? styles.sent : styles.received}`}
              >
                <div className={styles.messageHeader}>
                  <span 
                    className={styles.senderAgency}
                    style={{ color: getAgencyColor(message.senderAgency) }}
                  >
                    {message.senderAgency.replace('_', ' ')}
                  </span>
                  <span className={styles.messageType}>
                    {message.messageType === 'text' ? '💬' : 
                     message.messageType === 'intelligence' ? '🧠' :
                     message.messageType === 'alert' ? '🚨' :
                     message.messageType === 'status' ? '📊' : '📁'}
                  </span>
                  <span className={styles.timestamp}>
                    {formatTimestamp(message.timestamp)}
                  </span>
                  {message.pqcEncrypted && (
                    <span className={styles.encryptionBadge} title="Post-Quantum Encrypted">
                      🔐 PQC
                    </span>
                  )}
                </div>
                <div className={styles.messageContent}>
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={styles.messageInput}>
        <div className={styles.inputControls}>
          <select 
            value={messageType} 
            onChange={(e) => setMessageType(e.target.value as NostrMessage['messageType'])}
            className={styles.messageTypeSelect}
          >
            <option value="text">💬 Text</option>
            <option value="intelligence">🧠 Intel</option>
            <option value="alert">🚨 Alert</option>
            <option value="status">📊 Status</option>
            <option value="file">📁 File</option>
          </select>
        </div>
        <div className={styles.inputRow}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Send secure ${messageType} message...`}
            className={styles.textInput}
            rows={2}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={styles.sendButton}
          >
            Send 🔒
          </button>
        </div>
        <div className={styles.securityInfo}>
          <span>🔐 End-to-end encrypted</span>
          <span>🛡️ Quantum-safe</span>
          <span>📝 Audit logged</span>
        </div>
      </div>
    </div>
  );
};

export default CommunicationPanel;
