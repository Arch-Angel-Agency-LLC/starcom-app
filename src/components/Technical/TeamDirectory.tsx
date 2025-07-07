import React, { useState } from 'react';
import styles from './TeamDirectory.module.css';

interface TeamInfo {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  inviteCode: string;
  isPublic: boolean;
  createdAt: number;
}

interface TeamDirectoryProps {
  onJoinTeam: (teamId: string) => void;
  currentTeamId?: string;
  onCreateTeam?: (teamName: string) => void;
}

const TeamDirectory: React.FC<TeamDirectoryProps> = ({ 
  onJoinTeam, 
  currentTeamId,
  onCreateTeam
}) => {
  const [teams] = useState<TeamInfo[]>([
    {
      id: 'starcom-alpha',
      name: 'Starcom Alpha Team',
      description: 'Primary intelligence analysis team',
      memberCount: 3,
      inviteCode: 'ALPHA-2025',
      isPublic: true,
      createdAt: Date.now() - 86400000
    },
    {
      id: 'starcom-bravo',
      name: 'Starcom Bravo Team',
      description: 'OSINT specialists and threat hunters',
      memberCount: 2,
      inviteCode: 'BRAVO-2025',
      isPublic: true,
      createdAt: Date.now() - 172800000
    },
    {
      id: 'starcom-intel',
      name: 'Intelligence Coordination',
      description: 'Cross-team intelligence sharing',
      memberCount: 5,
      inviteCode: 'INTEL-2025',
      isPublic: true,
      createdAt: Date.now() - 259200000
    }
  ]);

  const [newTeamName, setNewTeamName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      const teamId = newTeamName.toLowerCase().replace(/\s+/g, '-');
      onCreateTeam?.(newTeamName);
      onJoinTeam(teamId);
      setNewTeamName('');
      setShowCreateForm(false);
    }
  };

  const handleJoinByCode = () => {
    if (joinCode.trim()) {
      // Find team by invite code
      const team = teams.find(t => t.inviteCode === joinCode.toUpperCase());
      if (team) {
        onJoinTeam(team.id);
        setJoinCode('');
        setShowJoinForm(false);
      } else {
        alert('Invalid invite code. Please check and try again.');
      }
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    // You could add a toast notification here
  };

  return (
    <div className={styles.directory} data-testid="team-directory">
      <h3 className={styles.title}>
        👥 TEAM DIRECTORY
      </h3>

      {/* Current Team */}
      {currentTeamId && (
        <div className={styles.currentTeam} data-testid="current-team">
          <div className={styles.currentTeamHeader}>
            🟢 CURRENT TEAM: {currentTeamId}
          </div>
        </div>
      )}

      {/* Quick Join by Code */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          🔑 QUICK JOIN
        </div>
        
        {!showJoinForm ? (
          <button
            className={styles.joinByCodeButton}
            onClick={() => setShowJoinForm(true)}
            data-testid="show-join-form"
          >
            Join with Invite Code
          </button>
        ) : (
          <div className={styles.joinForm} data-testid="join-form">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code..."
              className={styles.codeInput}
              data-testid="join-code-input"
            />
            <div className={styles.formActions}>
              <button
                onClick={handleJoinByCode}
                className={styles.joinButton}
                data-testid="join-by-code"
              >
                JOIN
              </button>
              <button
                onClick={() => {
                  setShowJoinForm(false);
                  setJoinCode('');
                }}
                className={styles.cancelButton}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Public Teams */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          🌐 PUBLIC TEAMS
        </div>
        
        <div className={styles.teamList} data-testid="public-teams">
          {teams.filter(team => team.isPublic).map(team => (
            <div 
              key={team.id} 
              className={`${styles.teamCard} ${
                currentTeamId === team.id ? styles.currentTeamCard : ''
              }`}
              data-testid={`team-card-${team.id}`}
            >
              <div className={styles.teamHeader}>
                <span className={styles.teamName}>{team.name}</span>
                <span className={styles.memberCount}>
                  👥 {team.memberCount}
                </span>
              </div>
              
              <div className={styles.teamDescription}>
                {team.description}
              </div>
              
              <div className={styles.teamFooter}>
                <code 
                  className={styles.inviteCode}
                  onClick={() => copyInviteCode(team.inviteCode)}
                  title="Click to copy"
                  data-testid={`invite-code-${team.id}`}
                >
                  {team.inviteCode}
                </code>
                
                {currentTeamId !== team.id && (
                  <button
                    onClick={() => onJoinTeam(team.id)}
                    className={styles.joinTeamButton}
                    data-testid={`join-team-${team.id}`}
                  >
                    JOIN
                  </button>
                )}
                
                {currentTeamId === team.id && (
                  <span className={styles.currentBadge}>
                    ✅ ACTIVE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create New Team */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          ➕ CREATE TEAM
        </div>
        
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className={styles.createTeamButton}
            data-testid="show-create-form"
          >
            + NEW TEAM
          </button>
        ) : (
          <div className={styles.createForm} data-testid="create-form">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name..."
              className={styles.teamNameInput}
              data-testid="team-name-input"
            />
            <div className={styles.formActions}>
              <button
                onClick={handleCreateTeam}
                className={styles.createButton}
                disabled={!newTeamName.trim()}
                data-testid="create-team-button"
              >
                CREATE
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTeamName('');
                }}
                className={styles.cancelButton}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        <div className={styles.instructionTitle}>
          💡 Team Collaboration Tips
        </div>
        <ul className={styles.instructionList}>
          <li>Share invite codes with team members for instant access</li>
          <li>Create private teams for sensitive operations</li>
          <li>Use public teams for general coordination</li>
          <li>All messages sync automatically across team members</li>
        </ul>
      </div>
    </div>
  );
};

export default TeamDirectory;
