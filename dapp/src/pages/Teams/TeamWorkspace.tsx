import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CyberTeam } from '../../types/cyberInvestigation';
import realTimeTeamService from '../../services/RealTimeTeamService';
import styles from './TeamWorkspace.module.css';

const TeamWorkspace: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<CyberTeam | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'investigations' | 'reports' | 'members'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CYBER_ANALYST');

  useEffect(() => {
    // Try to load real team data first
    if (teamId) {
      const realTeam = realTimeTeamService.getTeam(teamId);
      if (realTeam) {
        setTeam(realTeam);
      } else {
        // Create mock team data for demonstration
        const mockCyberTeam: CyberTeam = {
          id: teamId,
          name: 'Cyber Defense Unit Alpha',
          type: 'INCIDENT_RESPONSE',
          agency: 'CYBER_COMMAND',
          lead: 'user-001',
          members: [
            {
              walletAddress: 'user-001',
              name: 'Sarah Chen',
              role: 'LEAD_ANALYST',
              specializations: ['threat-hunting', 'malware-analysis'],
              clearanceLevel: 'SECRET',
              status: 'ONLINE',
              joinedAt: new Date('2024-01-01'),
              lastActivity: new Date()
            },
            {
              walletAddress: 'user-002',
              name: 'Marcus Rodriguez',
              role: 'CYBER_ANALYST',
              specializations: ['network-forensics'],
              clearanceLevel: 'CONFIDENTIAL',
              status: 'ONLINE',
              joinedAt: new Date('2024-01-05'),
              lastActivity: new Date()
            },
            {
              walletAddress: 'user-003',
              name: 'Dr. Emily Watson',
              role: 'FORENSICS_SPECIALIST',
              specializations: ['reverse-engineering', 'attribution'],
              clearanceLevel: 'SECRET',
              status: 'AWAY',
              joinedAt: new Date('2024-01-10'),
              lastActivity: new Date(Date.now() - 30 * 60 * 1000)
            },
            {
              walletAddress: 'user-004',
              name: 'James Park',
              role: 'INCIDENT_COMMANDER',
              specializations: ['coordination', 'communications'],
              clearanceLevel: 'CONFIDENTIAL',
              status: 'OFFLINE',
              joinedAt: new Date('2024-01-15'),
              lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
            }
          ],
          specializations: ['threat-hunting', 'incident-response', 'attribution'],
          clearanceLevel: 'SECRET',
          status: 'ACTIVE',
          currentInvestigations: ['inv-001', 'inv-002'],
          autoShareFindings: true,
          allowExternalCollaboration: false,
          preferredCommunicationChannels: ['secure-chat', 'encrypted-voice'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        };
        setTeam(mockCyberTeam);
      }
    }

    // Set up real-time listeners
    const unsubscribeTeamUpdated = realTimeTeamService.on('team-updated', (data: unknown) => {
      const { team: updatedTeam } = data as { team: CyberTeam };
      if (updatedTeam.id === teamId) {
        setTeam(updatedTeam);
      }
    });

    const unsubscribeMemberJoined = realTimeTeamService.on('member-joined', (data: unknown) => {
      const { teamId: eventTeamId } = data as { teamId: string };
      if (eventTeamId === teamId) {
        // Refresh team data
        const refreshedTeam = realTimeTeamService.getTeam(teamId);
        if (refreshedTeam) {
          setTeam(refreshedTeam);
        }
      }
    });

    return () => {
      unsubscribeTeamUpdated();
      unsubscribeMemberJoined();
    };
  }, [teamId]);

  const handleInviteMember = async () => {
    if (inviteEmail && team) {
      try {
        const success = await realTimeTeamService.joinTeam(team.id, {
          walletAddress: `user-${Date.now()}`,
          name: inviteEmail.split('@')[0],
          role: inviteRole as 'CYBER_ANALYST',
          specializations: [],
          clearanceLevel: 'UNCLASSIFIED'
        });

        if (success) {
          // Refresh team data
          const updatedTeam = realTimeTeamService.getTeam(team.id);
          if (updatedTeam) {
            setTeam(updatedTeam);
          }
        }
      } catch (error) {
        console.error('Failed to invite member:', error);
      }

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('CYBER_ANALYST');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE': return '🟢';
      case 'AWAY': return '🟡';
      case 'OFFLINE': return '⚫';
      default: return '⚫';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#44ff44';
      default: return '#888';
    }
  };

  // Helper functions to get derived data
  const getTeamInvestigations = () => {
    if (!team) return [];
    return realTimeTeamService.getTeamInvestigations(team.id);
  };

  const getTeamReports = () => {
    // Mock reports data - in real implementation, this would come from a reports service
    return [
      {
        id: '1',
        title: 'Weekly Threat Intelligence Brief',
        type: 'analysis' as const,
        status: 'published' as const,
        author: team?.lead || 'Unknown',
        createdDate: '2024-01-20'
      },
      {
        id: '2',
        title: 'Critical Vulnerability Assessment',
        type: 'vulnerability' as const,
        status: 'review' as const,
        author: team?.members[1]?.name || 'Unknown',
        createdDate: '2024-01-19'
      }
    ];
  };

  if (!team) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading team workspace...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/teams')}
        >
          ← Back to Teams
        </button>
        <div className={styles.teamInfo}>
          <h1 className={styles.teamName}>{team.name}</h1>
          <p className={styles.teamDescription}>
            {team.type} team for {team.agency} - {team.specializations.join(', ')}
          </p>
        </div>
        <button 
          className={styles.inviteButton}
          onClick={() => setShowInviteModal(true)}
        >
          Invite Member
        </button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'investigations' ? styles.active : ''}`}
          onClick={() => setActiveTab('investigations')}
        >
          Investigations ({getTeamInvestigations().length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'reports' ? styles.active : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports ({getTeamReports().length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'members' ? styles.active : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members ({team.members.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Active Investigations</h3>
                <span className={styles.statNumber}>
                  {getTeamInvestigations().filter(i => 
                    ['INITIATED', 'INVESTIGATING', 'ANALYZING', 'CONTAINING', 'RECOVERING'].includes(i.status)
                  ).length}
                </span>
              </div>
              <div className={styles.statCard}>
                <h3>Team Members</h3>
                <span className={styles.statNumber}>{team.members.length}</span>
              </div>
              <div className={styles.statCard}>
                <h3>Published Reports</h3>
                <span className={styles.statNumber}>
                  {getTeamReports().filter(r => r.status === 'published').length}
                </span>
              </div>
              <div className={styles.statCard}>
                <h3>Members Online</h3>
                <span className={styles.statNumber}>
                  {team.members.filter(m => m.status === 'ONLINE').length}
                </span>
              </div>
            </div>

            <div className={styles.recentActivity}>
              <h3>Recent Activity</h3>
              <div className={styles.activityList}>
                {getTeamInvestigations().slice(0, 3).map(investigation => (
                  <div key={investigation.id} className={styles.activityItem}>
                    <span className={styles.activityIcon}>🔍</span>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>{investigation.title}</div>
                      <div className={styles.activityMeta}>
                        Last updated: {investigation.updatedAt.toLocaleDateString()}
                      </div>
                    </div>
                    <span 
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(investigation.priority) }}
                    >
                      {investigation.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investigations' && (
          <div className={styles.investigations}>
            <div className={styles.sectionHeader}>
              <h3>Team Investigations</h3>
              <button 
                className={styles.createButton}
                onClick={() => navigate('/investigations/new')}
              >
                New Investigation
              </button>
            </div>
            <div className={styles.investigationsList}>
              {getTeamInvestigations().map(investigation => (
                <div key={investigation.id} className={styles.investigationCard}>
                  <div className={styles.investigationHeader}>
                    <h4>{investigation.title}</h4>
                    <span 
                      className={styles.statusBadge}
                      data-status={investigation.status}
                    >
                      {investigation.status}
                    </span>
                  </div>
                  <div className={styles.investigationMeta}>
                    <span>Priority: 
                      <span 
                        style={{ color: getPriorityColor(investigation.priority) }}
                      >
                        {investigation.priority}
                      </span>
                    </span>
                    <span>Assigned: {investigation.assignedTeam}</span>
                    <span>Created: {investigation.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className={styles.investigationActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => navigate(`/investigations/${investigation.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className={styles.reports}>
            <div className={styles.sectionHeader}>
              <h3>Team Reports</h3>
              <button 
                className={styles.createButton}
                onClick={() => navigate('/intel/new')}
              >
                New Report
              </button>
            </div>
            <div className={styles.reportsList}>
              {getTeamReports().map(report => (
                <div key={report.id} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <h4>{report.title}</h4>
                    <span 
                      className={styles.typeBadge}
                      data-type={report.type}
                    >
                      {report.type}
                    </span>
                  </div>
                  <div className={styles.reportMeta}>
                    <span>Author: {report.author}</span>
                    <span>Status: {report.status}</span>
                    <span>Created: {report.createdDate}</span>
                  </div>
                  <div className={styles.reportActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => navigate(`/intel/${report.id}`)}
                    >
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className={styles.members}>
            <div className={styles.sectionHeader}>
              <h3>Team Members</h3>
              <button 
                className={styles.createButton}
                onClick={() => setShowInviteModal(true)}
              >
                Invite Member
              </button>
            </div>
            <div className={styles.membersList}>
              {team.members.map((member) => (
                <div key={member.walletAddress} className={styles.memberCard}>
                  <div className={styles.memberAvatar}>
                    <div className={styles.avatarPlaceholder}>
                      {member.name.charAt(0)}
                    </div>
                    <span className={styles.statusIndicator}>
                      {getStatusIcon(member.status)}
                    </span>
                  </div>
                  <div className={styles.memberInfo}>
                    <h4>{member.name}</h4>
                    <p>{member.role}</p>
                    <span className={styles.memberStatus}>{member.status}</span>
                  </div>
                  <div className={styles.memberActions}>
                    <button className={styles.actionButton}>Message</button>
                    <button className={styles.actionButton}>Profile</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Invite Team Member</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowInviteModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@organization.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="CYBER_ANALYST">Cyber Analyst</option>
                  <option value="FORENSICS_SPECIALIST">Forensics Specialist</option>
                  <option value="THREAT_HUNTER">Threat Hunter</option>
                  <option value="SOC_ANALYST">SOC Analyst</option>
                  <option value="INCIDENT_COMMANDER">Incident Commander</option>
                  <option value="LEAD_ANALYST">Lead Analyst</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleInviteMember}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamWorkspace;
