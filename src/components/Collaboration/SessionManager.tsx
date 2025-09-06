/**
 * Collaboration Session Manager
 * 
 * Manages multi-agency collaboration sessions with secure access control,
 * real-time participant management, and encrypted communication channels.
 */

import React, { useState, useCallback } from 'react';
import type { 
  CollaborationSession,
  AgencyType
} from '../../types';
import styles from './SessionManager.module.css';

// AI-NOTE: Mock hooks until proper implementations are available
// TODO: Implement message search and archival across all conversations - PRIORITY: MEDIUM
const useCollaboration = () => ({
  currentSession: null as CollaborationSession | null,
  createSession: (sessionData: unknown) => {
    // AI-NOTE: Suppress unused parameter warning until implementation
    void sessionData;
    return Promise.resolve('mock-session-id');
  },
  joinSession: (sessionId: string) => {
    // AI-NOTE: Suppress unused parameter warning until implementation
    void sessionId;
    return Promise.resolve();
  },
  leaveSession: () => Promise.resolve()
});

const useOperatorProfile = () => ({
  operator: {
    id: 'temp-operator',
    name: 'Temp Operator',
    agency: 'TEMP' as AgencyType,
    role: 'LEAD_ANALYST' as const,
    specializations: ['GEOINT'],
    status: 'ONLINE' as const,
    lastActivity: new Date()
  }
});

// ============================================================================
// SESSION LIST COMPONENT
// ============================================================================

interface SessionListProps {
  onSessionSelect: (session: CollaborationSession) => void;
  onCreateNew: () => void;
  currentSession?: CollaborationSession | null;
}

export const SessionList: React.FC<SessionListProps> = ({
  onSessionSelect,
  onCreateNew,
  currentSession
}) => {
  // AI-NOTE: Mock collaboration features until proper implementation
  const collaborationFeatures = {
    isActive: false,
    hasCollaboration: true,
    sessions: [] as CollaborationSession[]
  };
  const [availableSessions] = useState<CollaborationSession[]>([]);
  const [loading] = useState(false);

  // TODO: Implement full session management
  if (!collaborationFeatures?.hasCollaboration) {
    return (
      <div className={styles.noCollaboration}>
        <p>Collaboration features not available</p>
        <button onClick={onCreateNew} className={styles.createButton}>
          Create New Session (Offline)
        </button>
      </div>
    );
  }

  const getAgencyColor = (agency: AgencyType) => {
    switch (agency) {
      case 'SOCOM': return '#2E7D32';
      case 'SPACE_FORCE': return '#1565C0';
      case 'CYBER_COMMAND': return '#7B1FA2';
      case 'NSA': return '#E65100';
      case 'DIA': return '#C62828';
      case 'CIA': return '#424242';
      default: return '#616161';
    }
  };

  // Removed clearance color coding for civilian version

  const getStatusIcon = (status: CollaborationSession['status']) => {
    switch (status) {
      case 'ACTIVE': return '🟢';
      case 'SUSPENDED': return '🟡';
      case 'COMPLETED': return '⚪';
      case 'ARCHIVED': return '⚫';
      default: return '🔵';
    }
  };

  if (loading) {
    return (
      <div className={styles.sessionList}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <span>Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionList}>
      <div className={styles.sessionHeader}>
        <h3>Collaboration Sessions</h3>
        <button
          onClick={onCreateNew}
          className={styles.createSessionButton}
        >
          + New Session
        </button>
      </div>

      <div className={styles.sessions}>
        {availableSessions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <div className={styles.emptyMessage}>
              No collaboration sessions available
            </div>
            <button
              onClick={onCreateNew}
              className={styles.emptyCreateButton}
            >
              Create First Session
            </button>
          </div>
        ) : (
          availableSessions.map(session => (
            <div
              key={session.id}
              className={`${styles.sessionCard} ${
                currentSession?.id === session.id ? styles.activeSession : ''
              }`}
              onClick={() => onSessionSelect(session)}
              style={{
                '--agency-color': getAgencyColor(session.leadAgency),
                '--classification-color': '#888'
              } as React.CSSProperties}
            >
              <div className={styles.sessionCardHeader}>
                <div className={styles.sessionStatus}>
                  {getStatusIcon(session.status)}
                </div>
                <div className={styles.sessionMeta}>
                  <div className={styles.sessionName}>{session.name}</div>
                  <div className={styles.sessionAgency}>{session.leadAgency}</div>
                </div>
                {/* Classification removed */}
              </div>

              <div className={styles.sessionDescription}>
                {session.description}
              </div>

              <div className={styles.sessionStats}>
                <div className={styles.participantCount}>
                  👥 {session.participants.length} participant(s)
                </div>
                <div className={styles.sessionTime}>
                  🕒 {session.createdAt.toLocaleDateString()}
                </div>
                <div className={styles.sessionChannels}>
                  💬 {session.communicationChannels.length} channel(s)
                </div>
              </div>

              {currentSession?.id === session.id && (
                <div className={styles.currentSessionIndicator}>
                  Current Session
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SESSION CREATOR COMPONENT
// ============================================================================

interface SessionCreatorProps {
  onSessionCreated: (sessionId: string) => void;
  onCancel: () => void;
}

export const SessionCreator: React.FC<SessionCreatorProps> = ({
  onSessionCreated,
  onCancel
}) => {
  const { createSession } = useCollaboration();
  const { operator } = useOperatorProfile();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Classification removed for civilian version
  const [leadAgency, setLeadAgency] = useState<AgencyType>(operator?.agency || 'CYBER_COMMAND');
  const [creating, setCreating] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !operator) return;

    setCreating(true);
    try {
      const sessionData: Partial<CollaborationSession> = {
        name: name.trim(),
        description: description.trim(),
        leadAgency,
        participants: [operator],
        invitedOperators: [],
        status: 'ACTIVE',
        sharedContexts: [],
        communicationChannels: [],
        intelligenceAssets: []
      };

      const sessionId = await createSession(sessionData);
      onSessionCreated(sessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setCreating(false);
    }
  }, [name, description, leadAgency, operator, createSession, onSessionCreated]);

  if (!operator) {
    return (
      <div className={styles.sessionCreator}>
        <div className={styles.errorMessage}>
          No operator profile set. Cannot create sessions.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionCreator}>
      <div className={styles.creatorHeader}>
        <h3>Create New Collaboration Session</h3>
        <div className={styles.operatorInfo}>
          {operator.name} ({operator.agency})
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.creatorForm}>
        <div className={styles.formRow}>
          <label htmlFor="session-name">Session Name *</label>
          <input
            id="session-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter session name..."
            className={styles.textInput}
            required
          />
        </div>

        <div className={styles.formRow}>
          <label htmlFor="session-description">Description</label>
          <textarea
            id="session-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose and objectives of this collaboration session..."
            className={styles.textArea}
            rows={3}
          />
        </div>

  {/* Classification selection removed */}

        <div className={styles.formRow}>
          <label htmlFor="session-agency">Lead Agency *</label>
          <select
            id="session-agency"
            value={leadAgency}
            onChange={(e) => setLeadAgency(e.target.value as AgencyType)}
            className={styles.selectInput}
            required
          >
            <option value="SOCOM">SOCOM</option>
            <option value="SPACE_FORCE">Space Force</option>
            <option value="CYBER_COMMAND">Cyber Command</option>
            <option value="NSA">NSA</option>
            <option value="DIA">DIA</option>
            <option value="CIA">CIA</option>
          </select>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={!name.trim() || creating}
            className={styles.createButton}
          >
            {creating ? 'Creating...' : 'Create Session'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={creating}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// SESSION MANAGER COMPONENT
// ============================================================================

interface SessionManagerProps {
  onSessionJoined?: (session: CollaborationSession) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  onSessionJoined
}) => {
  const { currentSession, joinSession, leaveSession } = useCollaboration();
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedSession, setSelectedSession] = useState<CollaborationSession | null>(null);

  const handleSessionSelect = useCallback(async (session: CollaborationSession) => {
    try {
      await joinSession(session.id);
      setSelectedSession(session);
      setView('details');
      onSessionJoined?.(session);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  }, [joinSession, onSessionJoined]);

  const handleSessionCreated = useCallback((sessionId: string) => {
    console.log('Session created:', sessionId);
    setView('list');
    // The created session should automatically be joined by the createSession hook
  }, []);

  const handleLeaveSession = useCallback(async () => {
    try {
      await leaveSession();
      setSelectedSession(null);
      setView('list');
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  }, [leaveSession]);

  const renderCurrentSessionInfo = () => {
    if (!currentSession) return null;

    return (
      <div className={styles.currentSessionInfo}>
        <div className={styles.currentSessionHeader}>
          <div className={styles.currentSessionName}>
            {currentSession.name}
          </div>
          <button
            onClick={handleLeaveSession}
            className={styles.leaveSessionButton}
          >
            Leave Session
          </button>
        </div>
        <div className={styles.currentSessionDetails}>
          <span className={styles.sessionDetail}>
            {currentSession.leadAgency}
          </span>
          <span className={styles.sessionDetail}>
            {currentSession.participants.length} participants
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.sessionManager}>
      {renderCurrentSessionInfo()}

      <div className={styles.sessionManagerContent}>
        {view === 'list' && (
          <SessionList
            onSessionSelect={handleSessionSelect}
            onCreateNew={() => setView('create')}
            currentSession={currentSession}
          />
        )}

        {view === 'create' && (
          <SessionCreator
            onSessionCreated={handleSessionCreated}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'details' && selectedSession && (
          <div className={styles.sessionDetails}>
            {/* Session details view can be implemented here */}
            <h3>Session Details</h3>
            <p>Details for {selectedSession.name}</p>
            <button
              onClick={() => setView('list')}
              className={styles.backButton}
            >
              Back to Sessions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager;
