import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import realTimeTeamService from '../../services/RealTimeTeamService';
import TeamCard from '../../components/Teams/TeamCard';
import TeamCreationForm from '../../components/Teams/TeamCreationForm';
import styles from './TeamsDashboard.module.css';

interface Team {
  id: string;
  name: string;
  description: string;
  members: number;
  activeInvestigations: number;
  status: 'active' | 'paused' | 'archived';
  lastActivity: Date;
}

const TeamsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
    
    // Set up real-time listeners
    const unsubscribe = realTimeTeamService.on('team-created', () => {
      loadTeams(); // Refresh teams when new team is created
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      // Load teams from real-time service
      const realTeams = realTimeTeamService.getTeams();
      
      // Transform CyberTeam to Team format for display
      const transformedTeams: Team[] = realTeams.map(cyberTeam => ({
        id: cyberTeam.id,
        name: cyberTeam.name,
        description: `${cyberTeam.type} team for ${cyberTeam.agency}`,
        members: cyberTeam.members.length,
        activeInvestigations: cyberTeam.currentInvestigations.length,
        status: cyberTeam.status === 'ACTIVE' ? 'active' : 'paused',
        lastActivity: cyberTeam.updatedAt
      }));

      if (transformedTeams.length > 0) {
        setTeams(transformedTeams);
      } else {
        // Set mock data for development if no real teams exist
        setTeams([
          {
            id: 'team-alpha',
            name: 'Team Alpha',
            description: 'Primary cyber threat investigation unit',
            members: 5,
            activeInvestigations: 3,
            status: 'active',
            lastActivity: new Date()
          },
          {
            id: 'team-beta',
            name: 'Team Beta',
            description: 'Network security analysis team',
            members: 8,
            activeInvestigations: 2,
            status: 'active',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (teamData: {
    name: string;
    description: string;
    collaborationMode: string;
    maxMembers: number;
  }) => {
    if (!publicKey) {
      alert('Please connect your wallet to create a team');
      return;
    }

    try {
      // Create team via real-time service
      const newTeam = await realTimeTeamService.createTeam({
        name: teamData.name,
        type: 'INCIDENT_RESPONSE',
        agency: 'CYBER_COMMAND',
        specializations: ['incident-response', 'threat-analysis']
      }, publicKey.toString());
      
      // Refresh teams list
      await loadTeams();
      setShowCreateForm(false);
      
      // Navigate to new team workspace
      navigate(`/teams/${newTeam.id}`);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>⟳</div>
        <p>Loading teams...</p>
      </div>
    );
  }

  return (
    <div className={styles.teamsDashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>👥 Team Management</h1>
          <p className={styles.subtitle}>
            Coordinate cyber investigation teams and operations
          </p>
        </div>
        
        <div className={styles.actions}>
          <button
            className={styles.createButton}
            onClick={() => setShowCreateForm(true)}
          >
            + Create Team
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{teams.length}</div>
          <div className={styles.statLabel}>Active Teams</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {teams.reduce((sum, team) => sum + team.members, 0)}
          </div>
          <div className={styles.statLabel}>Total Members</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {teams.reduce((sum, team) => sum + team.activeInvestigations, 0)}
          </div>
          <div className={styles.statLabel}>Active Investigations</div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className={styles.teamsGrid}>
        {teams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
            onClick={() => navigate(`/teams/${team.id}`)}
          />
        ))}
        
        {teams.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <h3>No Teams Yet</h3>
            <p>Create your first team to start collaborating on investigations</p>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateForm(true)}
            >
              Create First Team
            </button>
          </div>
        )}
      </div>

      {/* Create Team Form Modal */}
      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <TeamCreationForm
              onSubmit={handleCreateTeam}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsDashboard;
