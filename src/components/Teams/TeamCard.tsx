import React from 'react';
import styles from './TeamCard.module.css';

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description: string;
    members: number;
    activeInvestigations: number;
    status: 'active' | 'paused' | 'archived';
    lastActivity: Date;
    onChainAddress?: string;
    blockchainEnabled?: boolean;
  };
  onClick: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00ff41';
      case 'paused': return '#ffa500';
      case 'archived': return '#666';
      default: return '#666';
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Active now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={styles.teamCard} onClick={onClick}>
      {/* Status Indicator */}
      <div 
        className={styles.statusIndicator}
        style={{ backgroundColor: getStatusColor(team.status) }}
      />
      
      {/* Team Info */}
      <div className={styles.teamHeader}>
        <h3 className={styles.teamName}>{team.name}</h3>
        <div className={styles.headerBadges}>
          <span className={styles.teamStatus}>{team.status.toUpperCase()}</span>
          {team.blockchainEnabled && (
            <span className={styles.blockchainBadge} title="Solana Blockchain Enabled">
              ⛓️
            </span>
          )}
        </div>
      </div>
      
      <p className={styles.teamDescription}>{team.description}</p>
      
      {/* Blockchain Info */}
      {team.blockchainEnabled && team.onChainAddress && (
        <div className={styles.blockchainInfo}>
          <span className={styles.blockchainLabel}>On-Chain Address:</span>
          <span className={styles.blockchainAddress} title={team.onChainAddress}>
            {team.onChainAddress.slice(0, 8)}...{team.onChainAddress.slice(-4)}
          </span>
        </div>
      )}
      
      {/* Team Stats */}
      <div className={styles.teamStats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{team.members}</span>
          <span className={styles.statLabel}>Members</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{team.activeInvestigations}</span>
          <span className={styles.statLabel}>Investigations</span>
        </div>
      </div>
      
      {/* Last Activity */}
      <div className={styles.lastActivity}>
        Last activity: {formatLastActivity(team.lastActivity)}
      </div>
      
      {/* Hover Action */}
      <div className={styles.hoverAction}>
        <span>Open Workspace →</span>
      </div>
    </div>
  );
};

export default TeamCard;
