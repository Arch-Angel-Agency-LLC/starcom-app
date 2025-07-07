/**
 * Enhanced Team Collaboration Integration Component
 * 
 * This component provides a comprehensive interface for team collaboration
 * features including team management, intel package creation, and real-time
 * synchronization with the Solana blockchain.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { EnhancedTeamCollaborationService, BlockchainTeam, TeamIntelPackage } from '../../services/collaboration/EnhancedTeamCollaborationService';
import { Team, ClearanceLevel, AgencyType } from '../../types/features/collaboration';
import type { IntelReportData } from '../../models/IntelReportData';
import './TeamCollaborationHub.css';

interface TeamCollaborationHubProps {
  onTeamSelect?: (teamId: string | null) => void;
  onPackageCreate?: (packageId: string) => void;
  className?: string;
  compact?: boolean;
}

export const TeamCollaborationHub: React.FC<TeamCollaborationHubProps> = ({
  onTeamSelect,
  onPackageCreate,
  className = '',
  compact = false
}) => {
  const { publicKey, signTransaction } = useWallet();
  const [collaborationService, setCollaborationService] = useState<EnhancedTeamCollaborationService | null>(null);
  const [userTeams, setUserTeams] = useState<BlockchainTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamPackages, setTeamPackages] = useState<TeamIntelPackage[]>([]);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize collaboration service
  useEffect(() => {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const service = new EnhancedTeamCollaborationService(connection, undefined, {
      enableRealTimeSync: true,
      autoConfirmTransactions: true,
      defaultNetwork: 'devnet'
    });
    setCollaborationService(service);
  }, []);

  // Load user teams and packages
  const loadTeamData = useCallback(async () => {
    if (!collaborationService || !publicKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const teams = await collaborationService.getUserTeams(publicKey.toString());
      setUserTeams(teams);
      
      // Load packages for all teams
      const allPackages: TeamIntelPackage[] = [];
      for (const team of teams) {
        const packages = await collaborationService.getTeamPackages(team.id);
        allPackages.push(...packages);
      }
      setTeamPackages(allPackages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
    }
  }, [collaborationService, publicKey]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Handle team selection
  const handleTeamSelect = useCallback((teamId: string | null) => {
    setSelectedTeam(teamId);
    onTeamSelect?.(teamId);
  }, [onTeamSelect]);

  // Create new team
  const createTeam = useCallback(async (teamData: {
    name: string;
    description: string;
    agency: AgencyType;
    classification: ClearanceLevel;
  }) => {
    if (!collaborationService || !publicKey || !signTransaction) {
      setError('Please connect your wallet to create a team');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newTeamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> = {
        ...teamData,
        members: [],
        status: 'ACTIVE'
      };

      const wallet = { publicKey, signTransaction };
      const { team, signature } = await collaborationService.createTeam(
        newTeamData,
        wallet,
        {
          enableMultiSig: false,
          initialStake: 0,
          membershipNFT: true
        }
      );

      console.log('Team created:', { teamId: team.id, signature });
      await loadTeamData();
      setIsCreatingTeam(false);
      
      // Auto-select the new team
      handleTeamSelect(team.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
      console.error('Error creating team:', err);
    } finally {
      setLoading(false);
    }
  }, [collaborationService, publicKey, signTransaction, loadTeamData, handleTeamSelect]);

  // Create intel package
  const createIntelPackage = useCallback(async (
    reports: IntelReportData[],
    packageInfo: {
      name: string;
      description: string;
      classification: ClearanceLevel;
      tags: string[];
    }
  ) => {
    if (!collaborationService || !publicKey || !signTransaction || !selectedTeam) {
      setError('Please select a team and connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wallet = { publicKey, signTransaction };
      const { packageId, signature } = await collaborationService.createIntelPackage(
        selectedTeam,
        reports,
        packageInfo,
        wallet
      );

      console.log('Intel package created:', { packageId, signature });
      await loadTeamData();
      onPackageCreate?.(packageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create intel package');
      console.error('Error creating package:', err);
    } finally {
      setLoading(false);
    }
  }, [collaborationService, publicKey, signTransaction, selectedTeam, loadTeamData, onPackageCreate]);

  // Add team member (TODO: Add UI component to call this function)
  /*
  const addTeamMember = useCallback(async (memberData: Operator) => {
    if (!collaborationService || !publicKey || !signTransaction || !selectedTeam) {
      setError('Please select a team and connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wallet = { publicKey, signTransaction };
      const { signature } = await collaborationService.addTeamMember(
        selectedTeam,
        memberData,
        wallet,
        { membershipNFT: true }
      );

      console.log('Team member added:', { signature });
      await loadTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team member');
      console.error('Error adding team member:', err);
    } finally {
      setLoading(false);
    }
  }, [collaborationService, publicKey, signTransaction, selectedTeam, loadTeamData]);
  */

  if (!publicKey) {
    return (
      <div className={`team-collaboration-hub wallet-required ${className}`}>
        <div className="wallet-prompt">
          <h3>🔗 Team Collaboration</h3>
          <p>Connect your wallet to access team collaboration features</p>
        </div>
      </div>
    );
  }

  if (loading && userTeams.length === 0) {
    return (
      <div className={`team-collaboration-hub loading ${className}`}>
        <div className="loading-spinner">⟳</div>
        <p>Loading team collaboration data...</p>
      </div>
    );
  }

  return (
    <div className={`team-collaboration-hub ${compact ? 'compact' : ''} ${className}`}>
      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {!compact && (
        <header className="hub-header">
          <h3>🤝 Team Collaboration</h3>
          <div className="stats">
            <span>{userTeams.length} Teams</span>
            <span>{teamPackages.length} Packages</span>
          </div>
        </header>
      )}

      {/* Team Selection */}
      <div className="team-selector">
        <label htmlFor="team-select">Active Team:</label>
        <select
          id="team-select"
          value={selectedTeam || ''}
          onChange={(e) => handleTeamSelect(e.target.value || null)}
        >
          <option value="">No Team Selected</option>
          {userTeams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name} ({team.members.length} members)
            </option>
          ))}
        </select>
        <button
          onClick={() => setIsCreatingTeam(true)}
          className="create-team-btn"
          disabled={loading}
        >
          + New Team
        </button>
      </div>

      {/* Selected Team Info */}
      {selectedTeam && (
        <div className="selected-team-info">
          {(() => {
            const team = userTeams.find(t => t.id === selectedTeam);
            if (!team) return null;
            
            return (
              <div className="team-details">
                <h4>{team.name}</h4>
                <p>{team.description}</p>
                <div className="team-meta">
                  <span>Members: {team.members.length}</span>
                  <span>Classification: {team.classification}</span>
                  <span>On-Chain: {team.onChainAddress.toBase58().slice(0, 8)}...</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Team Packages */}
      {teamPackages.length > 0 && !compact && (
        <div className="team-packages">
          <h4>📦 Intel Packages</h4>
          <div className="packages-list">
            {teamPackages.map(pkg => (
              <div key={pkg.packageId} className="package-item">
                <span className="package-id">{pkg.packageId.slice(0, 12)}...</span>
                <span className="package-reports">{pkg.reports.length} reports</span>
                <span className="package-classification">{pkg.metadata.classification}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {selectedTeam && (
        <div className="quick-actions">
          <button
            onClick={() => createIntelPackage([], {
              name: 'Quick Package',
              description: 'Package created from collaboration hub',
              classification: 'CONFIDENTIAL',
              tags: ['quick-create']
            })}
            disabled={loading}
            className="action-btn package-btn"
          >
            📦 Create Package
          </button>
        </div>
      )}

      {/* Team Creation Modal */}
      {isCreatingTeam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <TeamCreationForm
              onSubmit={createTeam}
              onCancel={() => setIsCreatingTeam(false)}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Team Creation Form Component
interface TeamCreationFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    agency: AgencyType;
    classification: ClearanceLevel;
  }) => void;
  onCancel: () => void;
  loading: boolean;
}

const TeamCreationForm: React.FC<TeamCreationFormProps> = ({
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agency: 'CYBER_COMMAND' as AgencyType,
    classification: 'CONFIDENTIAL' as ClearanceLevel
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.description.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="team-creation-form">
      <h3>Create New Team</h3>
      
      <div className="form-group">
        <label htmlFor="team-name">Team Name:</label>
        <input
          id="team-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter team name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="team-description">Description:</label>
        <textarea
          id="team-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the team's purpose"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="team-agency">Agency:</label>
        <select
          id="team-agency"
          value={formData.agency}
          onChange={(e) => setFormData(prev => ({ ...prev, agency: e.target.value as AgencyType }))}
        >
          <option value="CYBER_COMMAND">Cyber Command</option>
          <option value="SPACE_FORCE">Space Force</option>
          <option value="SOCOM">SOCOM</option>
          <option value="NSA">NSA</option>
          <option value="DIA">DIA</option>
          <option value="CIA">CIA</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="team-classification">Classification:</label>
        <select
          id="team-classification"
          value={formData.classification}
          onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value as ClearanceLevel }))}
        >
          <option value="UNCLASSIFIED">Unclassified</option>
          <option value="CONFIDENTIAL">Confidential</option>
          <option value="SECRET">Secret</option>
          <option value="TOP_SECRET">Top Secret</option>
          <option value="SCI">SCI</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </div>
    </form>
  );
};

export default TeamCollaborationHub;
