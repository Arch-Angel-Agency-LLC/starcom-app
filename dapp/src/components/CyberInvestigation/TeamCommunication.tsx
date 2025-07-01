import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import NostrService, { NostrMessage } from '../../services/nostrService';
import styles from './TeamCommunication.module.css';

// AI-NOTE: Team communication for cyber investigation teams
// Group chat + direct messages with offline support via localStorage

interface TeamCommunicationProps {
  teamId: string;
  onlineStatus: boolean;
}

interface OfflineMessage {
  id: string;
  content: string;
  type: 'group' | 'direct';
  recipient?: string;
  timestamp: number;
  status: 'pending' | 'sent';
}

const TeamCommunication: React.FC<TeamCommunicationProps> = ({
  teamId,
  onlineStatus
}) => {
  const { connected, publicKey } = useWallet();
  const [messages, setMessages] = useState<NostrMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType] = useState<'group' | 'direct'>('group');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [offlineMessages, setOfflineMessages] = useState<OfflineMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'group' | 'direct'>('group');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nostrService = NostrService.getInstance();

  // Mock team members for MVP
  const teamMembers = [
    { id: 'member1', name: 'Alice Chen', role: 'Lead Analyst' },
    { id: 'member2', name: 'Bob Martinez', role: 'OSINT Specialist' },
    { id: 'member3', name: 'Carol Johnson', role: 'Threat Hunter' },
    { id: 'member4', name: 'David Kim', role: 'Digital Forensics' },
  ];

  // Load offline messages
  useEffect(() => {
    const stored = localStorage.getItem(`offline-messages-${teamId}`);
    if (stored) {
      setOfflineMessages(JSON.parse(stored));
    }
  }, [teamId]);

  // Load message history
  useEffect(() => {
    const stored = localStorage.getItem(`message-history-${teamId}`);
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  }, [teamId]);

  // TODO: Implement comprehensive communication analytics and reporting - PRIORITY: LOW
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const syncOfflineMessages = useCallback(async () => {
    const pendingMessages = offlineMessages.filter(m => m.status === 'pending');
    
    for (const message of pendingMessages) {
      try {
        if (message.type === 'group') {
          await nostrService.sendMessage(
            `team-${teamId}`,
            message.content,
            'text'
          );
        }
        // TODO: Implement direct messages when Nostr DM support is added
        
        // Update status to sent
        setOfflineMessages(prev => 
          prev.map(m => m.id === message.id ? { ...m, status: 'sent' } : m)
        );
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }

    // Update localStorage
    localStorage.setItem(`offline-messages-${teamId}`, JSON.stringify(offlineMessages));
  }, [offlineMessages, teamId, nostrService]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync offline messages when coming online
  useEffect(() => {
    if (onlineStatus && connected && offlineMessages.length > 0) {
      syncOfflineMessages();
    }
  }, [onlineStatus, connected, offlineMessages.length, syncOfflineMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    if (!onlineStatus || !connected) {
      // Save offline
      const offlineMessage: OfflineMessage = {
        id: `offline-${Date.now()}`,
        content: messageContent,
        type: messageType,
        recipient: messageType === 'direct' ? selectedRecipient : undefined,
        timestamp: Date.now(),
        status: 'pending'
      };

      const updated = [...offlineMessages, offlineMessage];
      setOfflineMessages(updated);
      localStorage.setItem(`offline-messages-${teamId}`, JSON.stringify(updated));

      // Add to local message history for immediate feedback
      const localMessage: NostrMessage = {
        id: offlineMessage.id,
        teamId,
        channelId: `team-${teamId}`,
        senderId: publicKey?.toString() || 'offline-user',
        senderDID: publicKey?.toString() || 'offline-user',
        senderAgency: 'SOCOM',
        content: messageContent,
        clearanceLevel: 'UNCLASSIFIED',
        messageType: 'text',
        timestamp: Date.now(),
        encrypted: false,
        pqcEncrypted: false,
        metadata: { offline: true, status: 'pending' }
      };

      const updatedMessages = [...messages, localMessage];
      setMessages(updatedMessages);
      localStorage.setItem(`message-history-${teamId}`, JSON.stringify(updatedMessages));
      
      return;
    }

    try {
      if (messageType === 'group') {
        const message = await nostrService.sendMessage(
          `team-${teamId}`,
          messageContent,
          'text',
          { teamId, investigationType: 'cyber-osint' }
        );

        if (message) {
          const updatedMessages = [...messages, message];
          setMessages(updatedMessages);
          localStorage.setItem(`message-history-${teamId}`, JSON.stringify(updatedMessages));
        }
      } else {
        // Direct message (simplified for MVP)
        console.log('Direct message to:', selectedRecipient, messageContent);
        // TODO: Implement Nostr direct messaging using NIP-04 encryption for secure team communications
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to offline storage
      const offlineMessage: OfflineMessage = {
        id: `failed-${Date.now()}`,
        content: messageContent,
        type: messageType,
        recipient: messageType === 'direct' ? selectedRecipient : undefined,
        timestamp: Date.now(),
        status: 'pending'
      };

      setOfflineMessages(prev => [...prev, offlineMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: NostrMessage) => {
    const isOwn = message.senderId === publicKey?.toString();
    const isOffline = Boolean(message.metadata?.offline);
    
    return (
      <div key={message.id} className={`${styles.message} ${isOwn ? styles.own : ''}`}>
        <div className={styles.messageHeader}>
          <span className={styles.sender}>
            {isOwn ? 'You' : message.senderId.substring(0, 8)}
          </span>
          <span className={styles.timestamp}>
            {formatTimestamp(message.timestamp)}
          </span>
          {isOffline && <span className={styles.offlineIndicator}>📱</span>}
        </div>
        <div className={styles.messageContent}>
          {message.content}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Team Communication</h2>
        <div className={styles.metadata}>
          <span>Team: {teamId}</span>
          <span className={onlineStatus ? styles.online : styles.offline}>
            {onlineStatus ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'group' ? styles.active : ''}`}
          onClick={() => setActiveTab('group')}
        >
          💬 Group Chat
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'direct' ? styles.active : ''}`}
          onClick={() => setActiveTab('direct')}
        >
          📧 Direct Messages
        </button>
      </div>

      {offlineMessages.length > 0 && (
        <div className={styles.offlineStatus}>
          <span>📱 {offlineMessages.filter(m => m.status === 'pending').length} messages pending sync</span>
        </div>
      )}

      <div className={styles.chatArea}>
        {activeTab === 'group' ? (
          <>
            <div className={styles.messages}>
              {messages
                .filter(m => !m.metadata?.direct)
                .map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Type a message to the team... ${!onlineStatus ? '(offline mode)' : ''}`}
                className={styles.messageInput}
                rows={2}
              />
              <button 
                onClick={handleSendMessage}
                className={styles.sendButton}
                disabled={!newMessage.trim()}
              >
                {onlineStatus && connected ? 'Send' : 'Send (Offline)'}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.directMessages}>
            <div className={styles.memberList}>
              <h3>Team Members</h3>
              {teamMembers.map(member => (
                <div 
                  key={member.id}
                  className={`${styles.member} ${selectedRecipient === member.id ? styles.selected : ''}`}
                  onClick={() => setSelectedRecipient(member.id)}
                >
                  <div className={styles.memberName}>{member.name}</div>
                  <div className={styles.memberRole}>{member.role}</div>
                </div>
              ))}
            </div>

            <div className={styles.dmArea}>
              {selectedRecipient ? (
                <>
                  <div className={styles.dmHeader}>
                    Direct message with {teamMembers.find(m => m.id === selectedRecipient)?.name}
                  </div>
                  <div className={styles.dmPlaceholder}>
                    Direct messaging will be available in the next release.
                    For now, use group chat or external secure channels.
                  </div>
                </>
              ) : (
                <div className={styles.dmPlaceholder}>
                  Select a team member to start a direct conversation
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCommunication;
