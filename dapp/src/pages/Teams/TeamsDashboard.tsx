import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { EnhancedTeamCollaborationService } from '../../services/collaboration/EnhancedTeamCollaborationService';
import { Team, ClearanceLevel, AgencyType } from '../../types/features/collaboration';
import realTimeTeamService from '../../services/RealTimeTeamService';
import TeamCard from '../../components/Teams/TeamCard';
import TeamCreationForm from '../../components/Teams/TeamCreationForm';
import { TeamCollaborationHub } from '../../components/Teams/TeamCollaborationHub';
import ConnectionStatusDashboard from '../../components/Technical/ConnectionStatusDashboard';
import TeamDirectory from '../../components/Technical/TeamDirectory';
import styles from './TeamsDashboard.module.css';

interface TeamDisplay {
  id: string;
  name: string;
  description: string;
  members: number;
  activeInvestigations: number;
  status: 'active' | 'paused' | 'archived';
  lastActivity: Date;
  onChainAddress?: string;
  blockchainEnabled?: boolean;
}

const TeamsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey, signTransaction } = useWallet();
  const [teams, setTeams] = useState<TeamDisplay[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collaborationService, setCollaborationService] = useState<EnhancedTeamCollaborationService | null>(null);

  // Initialize Enhanced Team Collaboration Service
  useEffect(() => {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const service = new EnhancedTeamCollaborationService(connection, undefined, {
      enableRealTimeSync: true,
      autoConfirmTransactions: true,
      defaultNetwork: 'devnet'
    });
    setCollaborationService(service);
  }, []);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      let displayTeams: TeamDisplay[] = [];

      // Load blockchain teams if service is available
      if (collaborationService && publicKey) {
        try {
          const userBlockchainTeams = await collaborationService.getUserTeams(publicKey.toString());
          
          // Transform blockchain teams to display format
          const blockchainDisplayTeams: TeamDisplay[] = userBlockchainTeams.map(team => ({
            id: team.id,
            name: team.name,
            description: team.description,
            members: team.members.length,
            activeInvestigations: 0, // TODO: Get from team packages
            status: team.status === 'ACTIVE' ? 'active' : team.status === 'SUSPENDED' ? 'paused' : 'archived',
            lastActivity: team.updatedAt,
            onChainAddress: team.onChainAddress.toBase58(),
            blockchainEnabled: true
          }));
          
          displayTeams.push(...blockchainDisplayTeams);
        } catch (error) {
          console.warn('Failed to load blockchain teams:', error);
        }
      }

      // Load teams from real-time service (legacy)
      const realTeams = realTimeTeamService.getTeams();
      
      // Transform CyberTeam to TeamDisplay format for display
      const legacyDisplayTeams: TeamDisplay[] = realTeams.map(cyberTeam => ({
        id: cyberTeam.id,
        name: cyberTeam.name,
        description: `${cyberTeam.type} team for ${cyberTeam.agency}`,
        members: cyberTeam.members.length,
        activeInvestigations: cyberTeam.currentInvestigations.length,
        status: cyberTeam.status === 'ACTIVE' ? 'active' : 'paused',
        lastActivity: cyberTeam.updatedAt,
        blockchainEnabled: false
      }));

      displayTeams.push(...legacyDisplayTeams);

      if (displayTeams.length === 0) {
        // Set mock data for development if no real teams exist
        displayTeams = [
          {
            id: 'team-alpha',
            name: 'Team Alpha',
            description: 'Primary cyber threat investigation unit',
            members: 5,
            activeInvestigations: 3,
            status: 'active',
            lastActivity: new Date(),
            blockchainEnabled: false
          },
          {
            id: 'team-beta',
            name: 'Team Beta',
            description: 'Network security analysis team',
            members: 8,
            activeInvestigations: 2,
            status: 'active',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            blockchainEnabled: false
          }
        ];
      }

      setTeams(displayTeams);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  }, [collaborationService, publicKey]);

  useEffect(() => {
    if (collaborationService) {
      loadTeams();
    }
    
    // Set up real-time listeners
    const unsubscribe = realTimeTeamService.on('team-created', () => {
      if (collaborationService) {
        loadTeams(); // Refresh teams when new team is created
      }
    });

    return () => {
      unsubscribe();
    };
  }, [collaborationService, loadTeams]);

  const handleCreateTeam = async (teamData: {
    name: string;
    description: string;
    collaborationMode: string;
    maxMembers: number;
  }) => {
    if (!publicKey || !signTransaction) {
      alert('Please connect your wallet to create a team');
      return;
    }

    if (!collaborationService) {
      alert('Team collaboration service is not available');
      return;
    }

    try {
      // Create team via Enhanced Team Collaboration Service
      const newTeamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> = {
        name: teamData.name,
        description: teamData.description,
        agency: 'CYBER_COMMAND' as AgencyType,
        classification: 'CONFIDENTIAL' as ClearanceLevel,
        members: [],
        status: 'ACTIVE'
      };

      const wallet = {
        publicKey,
        signTransaction
      };

      const { team: newBlockchainTeam, signature } = await collaborationService.createTeam(
        newTeamData,
        wallet,
        {
          enableMultiSig: teamData.collaborationMode === 'consensus',
          initialStake: 0,
          membershipNFT: true
        }
      );

      console.log('Team created on blockchain:', {
        teamId: newBlockchainTeam.id,
        signature,
        onChainAddress: newBlockchainTeam.onChainAddress.toBase58()
      });
      
      // Also create in real-time service for compatibility
      try {
        await realTimeTeamService.createTeam({
          name: teamData.name,
          type: 'INCIDENT_RESPONSE',
          agency: 'CYBER_COMMAND',
          specializations: ['incident-response', 'threat-analysis']
        }, publicKey.toString());
      } catch (legacyError) {
        console.warn('Failed to create legacy team, but blockchain team was created:', legacyError);
      }
      
      // Refresh teams list
      await loadTeams();
      setShowCreateForm(false);
      
      // Show success message
      alert(`Team "${newBlockchainTeam.name}" created successfully on Solana blockchain!\nTransaction: ${signature}`);
      
      // Navigate to new team workspace
      navigate(`/teams/${newBlockchainTeam.id}`);
    } catch (error) {
      console.error('Failed to create team:', error);
      alert(`Failed to create team: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      {/* Enhanced Team Collaboration Hub */}
      {publicKey && (
        <div className={styles.collaborationHub}>
          <TeamCollaborationHub 
            onTeamSelect={(teamId) => {
              console.log('Team selected:', teamId);
              // Could implement team focus/filtering here
            }}
            onPackageCreate={(packageId) => {
              console.log('Package created:', packageId);
              loadTeams(); // Refresh teams data
            }}
            compact={true}
          />
        </div>
      )}

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
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {teams.filter(team => team.blockchainEnabled).length}
          </div>
          <div className={styles.statLabel}>Blockchain Teams</div>
        </div>
      </div>

      {/* Technical Team Components */}
      <div className={styles.technicalSection}>
        <div className={styles.technicalGrid}>
          <div className={styles.technicalCard}>
            <ConnectionStatusDashboard 
              teamId={teams.find(t => t.status === 'active')?.id}
              compact={false}
            />
          </div>
          <div className={styles.technicalCard}>
            <TeamDirectory
              onJoinTeam={(teamId) => navigate(`/teams/${teamId}`)}
              currentTeamId={teams.find(t => t.status === 'active')?.id}
              onCreateTeam={(teamName) => {
                setShowCreateForm(true);
                // Pre-populate form with team name if needed
              }}
            />
          </div>
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
