// Collaboration Sidebar Component - Real-time Team Collaboration
// Part of the Collaborative Operations Bridge MVP

import React, { useState, useEffect } from 'react';
import { TeamMember, CollaborationEvent } from '../../interfaces/Investigation';
import { secureLogger } from '../../security/logging/SecureLogger';
import styles from './CollaborationSidebar.module.css';

interface CollaborationSidebarProps {
  investigationId: string;
  teamMembers: TeamMember[];
  collaborationEvents: CollaborationEvent[];
  onSendMessage?: (message: string) => void;
  onInviteUser?: () => void;
  currentUserId?: string;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system';
}

const CollaborationSidebar: React.FC<CollaborationSidebarProps> = ({
  investigationId,
  teamMembers,
  collaborationEvents,
  onSendMessage,
  onInviteUser,
  currentUserId = 'current-user',
  isCollapsed = false,
  onToggleCollapsed,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'activity' | 'chat'>('team');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user_id: 'system',
      user_name: 'System',
      message: 'Investigation workspace initialized',
      timestamp: new Date().toISOString(),
      type: 'system',
    },
  ]);

  // Simulate real-time presence updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would be connected to WebSocket
      // For now, we'll just update the last seen timestamps
      secureLogger.log('debug', 'Updating presence for investigation', { investigationId }, {
        component: 'CollaborationSidebar'
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [investigationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: currentUserId,
      user_name: 'You',
      message: chatMessage,
      timestamp: new Date().toISOString(),
      type: 'message',
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');

    if (onSendMessage) {
      onSendMessage(chatMessage);
    }
  };

  const getStatusColor = (status: TeamMember['status']): string => {
    const colors = {
      online: '#00ff88',
      offline: '#ff4757',
      away: '#ffa502',
    };
    return colors[status];
  };

  const getStatusIcon = (status: TeamMember['status']): string => {
    const icons = {
      online: '🟢',
      offline: '🔴',
      away: '🟡',
    };
    return icons[status];
  };

  const getEventIcon = (eventType: CollaborationEvent['type']): string => {
    const icons = {
      investigation_updated: '📝',
      task_updated: '📋',
      evidence_added: '🔍',
      user_joined: '👤',
      user_left: '👋',
    };
    return icons[eventType] || '📝';
  };

  const formatEventMessage = (event: CollaborationEvent): string => {
    const messages = {
      investigation_updated: 'updated the investigation',
      task_updated: 'updated a task',
      evidence_added: 'added new evidence',
      user_joined: 'joined the investigation',
      user_left: 'left the investigation',
    };
    return messages[event.type] || 'performed an action';
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderTeamTab = () => (
    <div className={styles.teamTab}>
      <div className={styles.sectionHeader}>
        <h3>👥 Team Members</h3>
        <span className={styles.count}>{teamMembers.length}</span>
      </div>

      <div className={styles.membersList}>
        {teamMembers.map(member => (
          <div key={member.id} className={styles.memberCard}>
            <div className={styles.memberAvatar}>
              <div 
                className={styles.statusDot}
                style={{ backgroundColor: getStatusColor(member.status) }}
              />
              <span className={styles.memberInitials}>
                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            
            <div className={styles.memberInfo}>
              <div className={styles.memberName}>{member.name}</div>
              <div className={styles.memberRole}>{member.role}</div>
              <div className={styles.memberStatus}>
                <span className={styles.statusIcon}>
                  {getStatusIcon(member.status)}
                </span>
                <span className={styles.statusText}>
                  {member.status === 'online' ? 'Online' : 
                   member.status === 'away' ? 'Away' : 
                   member.last_seen ? `Last seen ${formatTime(member.last_seen)}` : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {onInviteUser && (
        <button className={styles.inviteButton} onClick={onInviteUser}>
          ➕ Invite Team Member
        </button>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <div className={styles.activityTab}>
      <div className={styles.sectionHeader}>
        <h3>📊 Recent Activity</h3>
        <span className={styles.count}>{collaborationEvents.length}</span>
      </div>

      <div className={styles.activityList}>
        {collaborationEvents.slice(-10).reverse().map((event, index) => (
          <div key={index} className={styles.activityItem}>
            <div className={styles.activityIcon}>
              {getEventIcon(event.type)}
            </div>
            <div className={styles.activityContent}>
              <div className={styles.activityText}>
                <strong>{event.user_id}</strong> {formatEventMessage(event)}
              </div>
              <div className={styles.activityTime}>
                {formatTime(event.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatTab = () => (
    <div className={styles.chatTab}>
      <div className={styles.sectionHeader}>
        <h3>💬 Team Chat</h3>
        <span className={styles.count}>{chatMessages.length}</span>
      </div>

      <div className={styles.chatMessages}>
        {chatMessages.map(message => (
          <div 
            key={message.id} 
            className={`${styles.chatMessage} ${
              message.user_id === currentUserId ? styles.own : ''
            } ${message.type === 'system' ? styles.system : ''}`}
          >
            {message.type !== 'system' && (
              <div className={styles.messageAvatar}>
                {message.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            )}
            <div className={styles.messageContent}>
              {message.type !== 'system' && (
                <div className={styles.messageMeta}>
                  <span className={styles.messageSender}>{message.user_name}</span>
                  <span className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              )}
              <div className={styles.messageText}>{message.message}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className={styles.chatForm}>
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder="Type a message..."
          className={styles.chatInput}
        />
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={!chatMessage.trim()}
        >
          📤
        </button>
      </form>
    </div>
  );

  if (isCollapsed) {
    return (
      <div className={styles.collapsedSidebar}>
        <button 
          className={styles.expandButton}
          onClick={onToggleCollapsed}
          title="Expand collaboration panel"
        >
          👥
        </button>
        <div className={styles.collapsedIndicators}>
          <div className={styles.onlineCount} title="Online team members">
            {teamMembers.filter(m => m.status === 'online').length}
          </div>
          <div className={styles.activityCount} title="Recent activities">
            {collaborationEvents.length}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2>🤝 Collaboration</h2>
        {onToggleCollapsed && (
          <button 
            className={styles.collapseButton}
            onClick={onToggleCollapsed}
            title="Collapse collaboration panel"
          >
            ↔️
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        {[
          { id: 'team', label: 'Team', icon: '👥' },
          { id: 'activity', label: 'Activity', icon: '📊' },
          { id: 'chat', label: 'Chat', icon: '💬' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'team' && renderTeamTab()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'chat' && renderChatTab()}
      </div>
    </div>
  );
};

export default CollaborationSidebar;
