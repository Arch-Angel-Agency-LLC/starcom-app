/**
 * Provenance and Audit Trail Component
 * 
 * This component displays the blockchain provenance and audit trail
 * for intelligence reports and team collaboration actions.
 */

import React, { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { EnhancedTeamCollaborationService } from '../../services/collaboration/EnhancedTeamCollaborationService';
import './ProvenanceAuditTrail.css';

interface AuditEntry {
  timestamp: number;
  action: string;
  actor: string;
  target: string;
  details: string;
  transactionSignature?: string;
  blockHeight?: number;
}

interface ProvenanceData {
  reportId: string;
  createdBy: string;
  createdAt: number;
  modifiedBy: string[];
  sharedWith: string[];
  teamActions: {
    teamId: string;
    action: string;
    timestamp: number;
    actor: string;
  }[];
  blockchainHistory: {
    signature: string;
    blockTime: number;
    instruction: string;
  }[];
}

interface ProvenanceAuditTrailProps {
  reportId?: string;
  teamId?: string;
  packageId?: string;
  className?: string;
  compact?: boolean;
}

export const ProvenanceAuditTrail: React.FC<ProvenanceAuditTrailProps> = ({
  reportId,
  teamId,
  packageId,
  className = '',
  compact = false
}) => {
  const { publicKey } = useWallet();
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [provenance, setProvenance] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const [collaborationService, setCollaborationService] = useState<EnhancedTeamCollaborationService | null>(null);

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

  // Load audit trail and provenance data
  useEffect(() => {
    const loadProvenanceData = async () => {
      if (!collaborationService) return;
      
      setLoading(true);
      try {
        const auditEntries: AuditEntry[] = [];
        let provenanceData: ProvenanceData | null = null;

        // Mock provenance data for demonstration
        if (reportId) {
          provenanceData = {
            reportId,
            createdBy: publicKey?.toString() || 'unknown',
            createdAt: Date.now() - Math.random() * 86400000, // Within last day
            modifiedBy: ['user1', 'user2'],
            sharedWith: ['team1', 'team2'],
            teamActions: [
              {
                teamId: teamId || 'team1',
                action: 'added_to_package',
                timestamp: Date.now() - 3600000,
                actor: 'team_lead'
              },
              {
                teamId: teamId || 'team1',
                action: 'classified',
                timestamp: Date.now() - 1800000,
                actor: 'analyst'
              }
            ],
            blockchainHistory: [
              {
                signature: `${reportId?.slice(0, 44)}...`,
                blockTime: Date.now() - 3600000,
                instruction: 'create_intel_report'
              },
              {
                signature: `${packageId?.slice(0, 44)}...`,
                blockTime: Date.now() - 1800000,
                instruction: 'add_to_package'
              }
            ]
          };

          // Convert to audit entries
          auditEntries.push({
            timestamp: provenanceData.createdAt,
            action: 'Report Created',
            actor: provenanceData.createdBy.slice(0, 8) + '...',
            target: `Report ${reportId.slice(0, 8)}...`,
            details: 'Initial intelligence report created',
            transactionSignature: provenanceData.blockchainHistory[0]?.signature
          });

          provenanceData.teamActions.forEach(teamAction => {
            auditEntries.push({
              timestamp: teamAction.timestamp,
              action: teamAction.action.replace(/_/g, ' ').toUpperCase(),
              actor: teamAction.actor,
              target: `Team ${teamAction.teamId}`,
              details: `Team collaboration action performed`,
              transactionSignature: provenanceData?.blockchainHistory[1]?.signature
            });
          });
        }

        // Add team-specific audit entries
        if (teamId && collaborationService) {
          try {
            const teamPackages = await collaborationService.getTeamPackages(teamId);
            teamPackages.forEach(pkg => {
              auditEntries.push({
                timestamp: pkg.metadata.lastModified,
                action: 'Package Modified',
                actor: (typeof pkg.metadata.contributors[0] === 'string' 
                  ? pkg.metadata.contributors[0] 
                  : pkg.metadata.contributors[0]?.operatorId) || 'unknown',
                target: `Package ${pkg.packageId.slice(0, 8)}...`,
                details: `Package updated with ${pkg.reports.length} reports`,
                transactionSignature: pkg.packageId
              });
            });
          } catch (error) {
            console.warn('Failed to load team audit data:', error);
          }
        }

        // Sort by timestamp (newest first)
        auditEntries.sort((a, b) => b.timestamp - a.timestamp);

        setAuditTrail(auditEntries);
        setProvenance(provenanceData);
      } catch (error) {
        console.error('Failed to load provenance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProvenanceData();
  }, [collaborationService, reportId, teamId, packageId, publicKey]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'report created': return '📝';
      case 'added to package': return '📦';
      case 'classified': return '🔒';
      case 'package modified': return '✏️';
      case 'shared': return '🔗';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className={`provenance-loading ${className}`}>
        <div className="loading-spinner">🔄</div>
        <span>Loading audit trail...</span>
      </div>
    );
  }

  return (
    <div className={`provenance-audit-trail ${className} ${compact ? 'compact' : ''}`}>
      <div className="provenance-header">
        <h3>
          🔍 Audit Trail & Provenance
          {compact && (
            <button 
              className="expand-btn"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '▼' : '▶'}
            </button>
          )}
        </h3>
        {provenance && (
          <div className="provenance-summary">
            <span>Created: {formatTimestamp(provenance.createdAt)}</span>
            <span>•</span>
            <span>{provenance.teamActions.length} team actions</span>
            <span>•</span>
            <span>{provenance.blockchainHistory.length} blockchain events</span>
          </div>
        )}
      </div>

      {expanded && (
        <>
          {/* Blockchain Provenance */}
          {provenance && (
            <div className="blockchain-provenance">
              <h4>🔗 Blockchain Provenance</h4>
              <div className="provenance-details">
                <div className="provenance-item">
                  <span className="label">Creator:</span>
                  <span className="value">{provenance.createdBy.slice(0, 12)}...</span>
                </div>
                <div className="provenance-item">
                  <span className="label">Shared with:</span>
                  <span className="value">{provenance.sharedWith.length} teams</span>
                </div>
                <div className="provenance-item">
                  <span className="label">On-chain events:</span>
                  <span className="value">{provenance.blockchainHistory.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          <div className="audit-trail">
            <h4>📋 Activity Log</h4>
            {auditTrail.length === 0 ? (
              <div className="no-audit-data">
                <p>No audit trail available</p>
              </div>
            ) : (
              <div className="audit-entries">
                {auditTrail.map((entry, index) => (
                  <div key={index} className="audit-entry">
                    <div className="audit-icon">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="audit-content">
                      <div className="audit-main">
                        <span className="action">{entry.action}</span>
                        <span className="actor">by {entry.actor}</span>
                        <span className="target">→ {entry.target}</span>
                      </div>
                      <div className="audit-details">
                        <span className="details">{entry.details}</span>
                        <span className="timestamp">{formatTimestamp(entry.timestamp)}</span>
                      </div>
                      {entry.transactionSignature && (
                        <div className="audit-tx">
                          <small>Tx: {entry.transactionSignature.slice(0, 16)}...</small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
