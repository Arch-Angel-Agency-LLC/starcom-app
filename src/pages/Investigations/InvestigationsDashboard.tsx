import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { CyberInvestigation, CreateInvestigationRequest } from '../../types/cyberInvestigation';
import realTimeTeamService from '../../services/RealTimeTeamService';
import styles from './InvestigationsDashboard.module.css';

const InvestigationsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  
  const [investigations, setInvestigations] = useState<CyberInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('updatedAt');

  // Create investigation form state
  const [formData, setFormData] = useState<CreateInvestigationRequest>({
    title: '',
    description: '',
    type: 'INCIDENT_RESPONSE',
    classification: 'UNCLASSIFIED',
    priority: 'MEDIUM',
    affectedSystems: [],
    incidentDate: new Date()
  });

  // Investigation status columns for Kanban view
  const statusColumns = [
    { id: 'INITIATED', title: 'Initiated', color: '#ffa500' },
    { id: 'INVESTIGATING', title: 'Investigating', color: '#00ff41' },
    { id: 'ANALYZING', title: 'Analyzing', color: '#0099ff' },
    { id: 'CONTAINING', title: 'Containing', color: '#ff6600' },
    { id: 'RECOVERING', title: 'Recovering', color: '#9900ff' },
    { id: 'CLOSED', title: 'Closed', color: '#888' }
  ];

  // Load investigations
  useEffect(() => {
    const loadInvestigations = () => {
      setLoading(true);
      try {
        if (publicKey) {
          // Load user's team investigations
          const userTeams = realTimeTeamService.getUserTeams(publicKey.toString());
          const allInvestigations: CyberInvestigation[] = [];
          
          // Get investigations from all user teams
          userTeams.forEach(team => {
            const teamInvestigations = realTimeTeamService.getTeamInvestigations(team.id);
            allInvestigations.push(...teamInvestigations);
          });

          if (allInvestigations.length > 0) {
            setInvestigations(allInvestigations);
          } else {
            // Initialize with mock data if no stored data
            const mockInvestigations: CyberInvestigation[] = [
              {
                id: 'inv-001',
                title: 'APT29 Cozy Bear Infrastructure Analysis',
                description: 'Analyzing sophisticated phishing campaign targeting government networks',
                type: 'THREAT_HUNTING',
                classification: 'SECRET',
                priority: 'HIGH',
                severity: 'HIGH',
                detectedDate: new Date('2024-01-15'),
                incidentDate: new Date('2024-01-15'),
                reportedBy: publicKey?.toString() || 'analyst-001',
                assignedTeam: 'team-001',
                status: 'INVESTIGATING',
                progress: 45,
                affectedSystems: ['mail-server-01', 'domain-controller'],
                affectedUsers: ['john.doe@gov.us', 'jane.smith@gov.us'],
                estimatedImpact: 'HIGH',
                intelPackages: ['intel-001', 'intel-002'],
              timeline: [],
              ioCs: [],
              evidence: [],
              collaboratingTeams: [],
              sharedWith: [],
              createdAt: new Date('2024-01-15'),
              updatedAt: new Date(),
              recommendedActions: []
            },
            {
              id: 'inv-002',
              title: 'Ransomware Incident - Financial Systems',
              description: 'Active ransomware deployment targeting financial infrastructure',
              type: 'INCIDENT_RESPONSE',
              classification: 'CONFIDENTIAL',
              priority: 'CRITICAL',
              severity: 'CRITICAL',
              detectedDate: new Date(),
              incidentDate: new Date(),
              reportedBy: publicKey?.toString() || 'analyst-002',
              assignedTeam: 'team-002',
              status: 'CONTAINING',
              progress: 75,
              affectedSystems: ['payment-gateway', 'db-cluster-01'],
              affectedUsers: [],
              estimatedImpact: 'CRITICAL',
              intelPackages: [],
              timeline: [],
              ioCs: [],
              evidence: [],
              collaboratingTeams: [],
              sharedWith: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              recommendedActions: []
            }
          ];
          setInvestigations(mockInvestigations);
        }
      } else {
        setInvestigations([]);
      }
      } catch (error) {
        console.error('Failed to load investigations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvestigations();
  }, [publicKey]);

  const handleCreateInvestigation = async () => {
    try {
      const newInvestigation: CyberInvestigation = {
        id: `inv-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        classification: formData.classification,
        priority: formData.priority,
        severity: formData.priority, // Using priority as severity for simplicity
        detectedDate: new Date(),
        incidentDate: formData.incidentDate,
        reportedBy: publicKey?.toString() || 'unknown',
        assignedTeam: 'team-001', // Default team
        status: 'INITIATED',
        progress: 0,
        affectedSystems: formData.affectedSystems,
        affectedUsers: [],
        estimatedImpact: formData.priority,
        intelPackages: [],
        timeline: [],
        ioCs: [],
        evidence: [],
        collaboratingTeams: [],
        sharedWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        recommendedActions: []
      };

      const updatedInvestigations = [...investigations, newInvestigation];
      setInvestigations(updatedInvestigations);

      // Store investigation via real-time service
      if (publicKey) {
        const userTeams = realTimeTeamService.getUserTeams(publicKey.toString());
        const teamId = userTeams.length > 0 ? userTeams[0].id : 'default-team';
        
        await realTimeTeamService.createInvestigation(
          newInvestigation,
          teamId,
          publicKey.toString()
        );
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'INCIDENT_RESPONSE',
        classification: 'UNCLASSIFIED',
        priority: 'MEDIUM',
        affectedSystems: [],
        incidentDate: new Date()
      });
      setShowCreateForm(false);

      // Navigate to new investigation
      navigate(`/investigations/${newInvestigation.id}`);
    } catch (error) {
      console.error('Failed to create investigation:', error);
    }
  };

  // Filter and sort investigations
  const filteredInvestigations = investigations.filter(inv => {
    if (filterStatus !== 'ALL' && inv.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && inv.priority !== filterPriority) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'priority': {
        const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      }
      case 'updatedAt':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    const column = statusColumns.find(col => col.id === status);
    return column?.color || '#888';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#ff0000';
      case 'HIGH': return '#ff6600';
      case 'MEDIUM': return '#ffa500';
      case 'LOW': return '#888';
      default: return '#888';
    }
  };

  if (loading) {
    return (
      <div className={styles.investigationsDashboard}>
        <div className={styles.loading}>Loading investigations...</div>
      </div>
    );
  }

  return (
    <div className={styles.investigationsDashboard}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Cyber Investigations</h1>
          <p>Manage and track cyber security investigations and incidents</p>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowCreateForm(true)}
          >
            + New Investigation
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Status</option>
            {statusColumns.map(col => (
              <option key={col.id} value={col.id}>{col.title}</option>
            ))}
          </select>

          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="updatedAt">Last Updated</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{investigations.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {investigations.filter(inv => inv.status === 'INVESTIGATING').length}
            </span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {investigations.filter(inv => inv.priority === 'CRITICAL' || inv.priority === 'HIGH').length}
            </span>
            <span className={styles.statLabel}>High Priority</span>
          </div>
        </div>
      </div>

      <div className={styles.investigationsGrid}>
        {filteredInvestigations.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No investigations found</h3>
            <p>Start by creating your first cyber investigation.</p>
            <button 
              className={styles.primaryButton}
              onClick={() => setShowCreateForm(true)}
            >
              Create Investigation
            </button>
          </div>
        ) : (
          filteredInvestigations.map(investigation => (
            <div 
              key={investigation.id} 
              className={styles.investigationCard}
              onClick={() => navigate(`/investigations/${investigation.id}`)}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{investigation.title}</h3>
                <div className={styles.cardMeta}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(investigation.status) }}
                  >
                    {investigation.status}
                  </span>
                  <span 
                    className={styles.priorityBadge}
                    style={{ color: getPriorityColor(investigation.priority) }}
                  >
                    {investigation.priority}
                  </span>
                </div>
              </div>
              
              <p className={styles.cardDescription}>{investigation.description}</p>
              
              <div className={styles.cardDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Type:</span>
                  <span className={styles.detailValue}>{investigation.type}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Progress:</span>
                  <span className={styles.detailValue}>{investigation.progress}%</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Affected Systems:</span>
                  <span className={styles.detailValue}>{investigation.affectedSystems.length}</span>
                </div>
              </div>
              
              <div className={styles.cardFooter}>
                <span className={styles.lastUpdated}>
                  Updated {new Date(investigation.updatedAt).toLocaleDateString()}
                </span>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${investigation.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Investigation Modal */}
      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create New Investigation</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Investigation Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter investigation title..."
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the investigation..."
                  rows={3}
                />
              </div>
              
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as CreateInvestigationRequest['type']})}
                  >
                    <option value="INCIDENT_RESPONSE">Incident Response</option>
                    <option value="THREAT_HUNTING">Threat Hunting</option>
                    <option value="FORENSICS">Digital Forensics</option>
                    <option value="VULNERABILITY_ASSESSMENT">Vulnerability Assessment</option>
                    <option value="COMPLIANCE_AUDIT">Compliance Audit</option>
                  </select>
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as CreateInvestigationRequest['priority']})}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Classification</label>
                  <select 
                    value={formData.classification}
                    onChange={(e) => setFormData({...formData, classification: e.target.value as CreateInvestigationRequest['classification']})}
                  >
                    <option value="UNCLASSIFIED">Unclassified</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                    <option value="SECRET">Secret</option>
                    <option value="TOP_SECRET">Top Secret</option>
                  </select>
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Incident Date</label>
                  <input
                    type="date"
                    value={formData.incidentDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({...formData, incidentDate: new Date(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryButton}
                onClick={handleCreateInvestigation}
                disabled={!formData.title.trim() || !formData.description.trim()}
              >
                Create Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationsDashboard;
