// Investigation Board Component - MVP for cyber investigation management
// Kanban-style board for managing investigation workflows

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CyberInvestigation, CreateInvestigationRequest } from '../../types/cyberInvestigation';
import CyberInvestigationStorage from '../../services/cyberInvestigationStorage';
import ipfsService from '../../services/IPFSService';
import { useBlockchainAnchor } from '../../services/BlockchainAnchorService';
import styles from './InvestigationBoard.module.css';

interface InvestigationBoardProps {
  onClose: () => void;
  teamId?: string;
}

const InvestigationBoard: React.FC<InvestigationBoardProps> = ({ onClose, teamId }) => {
  const { connected, publicKey } = useWallet();
  const { anchorContent } = useBlockchainAnchor();
  const [investigations, setInvestigations] = useState<CyberInvestigation[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Upload status tracking
  const [uploadStatus, setUploadStatus] = useState<{
    [investigationId: string]: {
      ipfsUploading: boolean;
      ipfsHash?: string;
      blockchainAnchoring: boolean;
      blockchainTxId?: string;
      error?: string;
    };
  }>({});

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

  // Investigation status columns
  const statusColumns = [
    { id: 'INITIATED', title: 'Initiated', color: '#ffa500' },
    { id: 'INVESTIGATING', title: 'Investigating', color: '#00ff41' },
    { id: 'ANALYZING', title: 'Analyzing', color: '#0099ff' },
    { id: 'CONTAINING', title: 'Containing', color: '#ff6600' },
    { id: 'RECOVERING', title: 'Recovering', color: '#9900ff' },
    { id: 'CLOSED', title: 'Closed', color: '#888' }
  ];

  // Load investigations on mount
  useEffect(() => {
    const loadInvestigationsEffect = async () => {
      setLoading(true);
      try {
        // Load from local storage first
        const storedInvestigations = CyberInvestigationStorage.loadInvestigations();
        
        if (storedInvestigations.length > 0) {
          setInvestigations(storedInvestigations);
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
              assignedTeam: teamId || 'team-001',
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
            }
          ];
          setInvestigations(mockInvestigations);
          CyberInvestigationStorage.saveInvestigations(mockInvestigations);
        }
      } catch (error) {
        console.error('Error loading investigations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvestigationsEffect();
  }, [publicKey, teamId]);

  const handleCreateInvestigation = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet to create investigations');
      return;
    }

    setLoading(true);
    const tempInvestigationId = `inv-${Date.now()}`;
    
    try {
      const newInvestigation: CyberInvestigation = {
        id: tempInvestigationId,
        ...formData,
        severity: 'MEDIUM',
        detectedDate: new Date(),
        reportedBy: publicKey.toString(),
        assignedTeam: teamId || 'default-team',
        status: 'INITIATED',
        progress: 0,
        affectedUsers: [],
        estimatedImpact: 'MEDIUM',
        intelPackages: [],
        timeline: [{
          id: `evt-${Date.now()}`,
          timestamp: new Date(),
          type: 'INCIDENT_DETECTED',
          description: `Investigation "${formData.title}" created`,
          author: publicKey.toString(),
          relatedReports: [],
          evidence: []
        }],
        ioCs: [],
        evidence: [],
        collaboratingTeams: [],
        sharedWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        recommendedActions: []
      };

      // Save to local storage first
      const updatedInvestigations = [...investigations, newInvestigation];
      setInvestigations(updatedInvestigations);
      CyberInvestigationStorage.saveInvestigations(updatedInvestigations);

      // Upload to IPFS and anchor to blockchain
      setUploadStatus(prev => ({
        ...prev,
        [tempInvestigationId]: {
          ipfsUploading: true,
          blockchainAnchoring: false
        }
      }));

      try {
        // Upload to IPFS
        const ipfsResult = await ipfsService.uploadInvestigation(
          newInvestigation,
          publicKey.toString(),
          formData.classification
        );

        if (ipfsResult.success) {
          setUploadStatus(prev => ({
            ...prev,
            [tempInvestigationId]: {
              ...prev[tempInvestigationId],
              ipfsUploading: false,
              ipfsHash: ipfsResult.hash,
              blockchainAnchoring: true
            }
          }));

          // Anchor to blockchain
          const anchorResult = await anchorContent(
            ipfsResult.hash,
            'investigation',
            formData.classification
          );

          if (anchorResult.success) {
            setUploadStatus(prev => ({
              ...prev,
              [tempInvestigationId]: {
                ...prev[tempInvestigationId],
                blockchainAnchoring: false,
                blockchainTxId: anchorResult.transactionId
              }
            }));
          } else {
            setUploadStatus(prev => ({
              ...prev,
              [tempInvestigationId]: {
                ...prev[tempInvestigationId],
                blockchainAnchoring: false,
                error: `Blockchain anchoring failed: ${anchorResult.error}`
              }
            }));
          }
        } else {
          setUploadStatus(prev => ({
            ...prev,
            [tempInvestigationId]: {
              ...prev[tempInvestigationId],
              ipfsUploading: false,
              error: `IPFS upload failed: ${ipfsResult.error}`
            }
          }));
        }
      } catch (uploadError) {
        setUploadStatus(prev => ({
          ...prev,
          [tempInvestigationId]: {
            ...prev[tempInvestigationId],
            ipfsUploading: false,
            blockchainAnchoring: false,
            error: `Upload error: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          }
        }));
      }

      setShowCreateForm(false);
      
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
    } catch (error) {
      console.error('Error creating investigation:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInvestigationStatus = (investigationId: string, newStatus: CyberInvestigation['status']) => {
    setInvestigations(prev => 
      prev.map(inv => 
        inv.id === investigationId 
          ? { ...inv, status: newStatus, updatedAt: new Date() }
          : inv
      )
    );
  };

  const renderInvestigationCard = (investigation: CyberInvestigation) => {
    const status = uploadStatus[investigation.id];
    
    return (
      <div
        key={investigation.id}
        className={styles.investigationCard}
        onClick={() => console.log('Selected investigation:', investigation.id)}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', investigation.id);
        }}
      >
        <div className={styles.cardHeader}>
          <h4 className={styles.investigationTitle}>{investigation.title}</h4>
          <div className={styles.cardMeta}>
            <span 
              className={styles.priority}
              data-priority={investigation.priority}
            >
              {investigation.priority}
            </span>
            <span 
              className={styles.classification}
            >
              {investigation.classification}
            </span>
          </div>
        </div>

        <p className={styles.investigationDescription}>{investigation.description}</p>

        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>Progress: {investigation.progress}%</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${investigation.progress}%` }}
            />
          </div>
        </div>

        <div className={styles.investigationStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Systems:</span>
            <span className={styles.statValue}>{investigation.affectedSystems.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Packages:</span>
            <span className={styles.statValue}>{investigation.intelPackages.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>IoCs:</span>
            <span className={styles.statValue}>{investigation.ioCs.length}</span>
          </div>
        </div>

        {/* Upload Status Display */}
        {status && (
          <div className={`${styles.uploadStatus} ${
            status.error ? styles.error : 
            (status.ipfsUploading || status.blockchainAnchoring) ? styles.uploading : 
            status.blockchainTxId ? styles.success : ''
          }`}>
            {status.ipfsUploading && (
              <div>📤 Uploading to IPFS...</div>
            )}
            {status.ipfsHash && !status.blockchainAnchoring && !status.blockchainTxId && (
              <div className={styles.ipfsHash}>📦 IPFS: {status.ipfsHash.substring(0, 10)}...</div>
            )}
            {status.blockchainAnchoring && (
              <div>⛓️ Anchoring to blockchain...</div>
            )}
            {status.blockchainTxId && (
              <div>✅ Anchored: {status.blockchainTxId.substring(0, 10)}...</div>
            )}
            {status.error && (
              <div>❌ {status.error}</div>
            )}
          </div>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.investigationType}>{investigation.type.replace('_', ' ')}</span>
          <span className={styles.dueDate}>
            {investigation.dueDate ? investigation.dueDate.toLocaleDateString() : 'No due date'}
          </span>
        </div>
      </div>
    );
  };

  const renderCreateForm = () => (
    <div className={styles.createForm}>
      <h3>Create Investigation</h3>
      
      <div className={styles.formGroup}>
        <label>Investigation Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., APT29 Infrastructure Compromise"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of the investigation"
          rows={3}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CyberInvestigation['type'] }))}
          >
            <option value="INCIDENT_RESPONSE">Incident Response</option>
            <option value="THREAT_HUNTING">Threat Hunting</option>
            <option value="FORENSIC_ANALYSIS">Forensic Analysis</option>
            <option value="VULNERABILITY_ASSESSMENT">Vulnerability Assessment</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as CyberInvestigation['priority'] }))}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Classification</label>
          <select
            value={formData.classification}
            onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value as CyberInvestigation['classification'] }))}
          >
            <option value="UNCLASSIFIED">Unclassified</option>
            <option value="CONFIDENTIAL">Confidential</option>
            <option value="SECRET">Secret</option>
            <option value="TOP_SECRET">Top Secret</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Incident Date</label>
          <input
            type="date"
            value={formData.incidentDate.toISOString().split('T')[0]}
            onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: new Date(e.target.value) }))}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button 
          className={styles.cancelBtn}
          onClick={() => setShowCreateForm(false)}
        >
          Cancel
        </button>
        <button 
          className={styles.submitBtn}
          onClick={handleCreateInvestigation}
          disabled={!formData.title || !formData.description || loading}
        >
          {loading ? 'Creating...' : 'Create Investigation'}
        </button>
      </div>
    </div>
  );

  const renderBoard = () => (
    <div className={styles.kanbanBoard}>
      {statusColumns.map(column => {
        const columnInvestigations = investigations.filter(inv => inv.status === column.id);
        
        return (
          <div
            key={column.id}
            className={styles.kanbanColumn}
            onDrop={(e) => {
              e.preventDefault();
              const investigationId = e.dataTransfer.getData('text/plain');
              updateInvestigationStatus(investigationId, column.id as CyberInvestigation['status']);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className={styles.columnHeader} style={{ borderBottomColor: column.color }}>
              <h3 className={styles.columnTitle}>{column.title}</h3>
              <span className={styles.columnCount}>{columnInvestigations.length}</span>
            </div>
            
            <div className={styles.columnContent}>
              {columnInvestigations.map(renderInvestigationCard)}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={styles.investigationBoard}>
      <div className={styles.header}>
        <h2>Investigation Board</h2>
        <div className={styles.headerActions}>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateForm(true)}
            disabled={!connected}
          >
            + New Investigation
          </button>
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {showCreateForm && renderCreateForm()}
      
      {loading ? (
        <div className={styles.loading}>Loading investigations...</div>
      ) : investigations.length === 0 ? (
        <div className={styles.empty}>
          <p>No investigations found</p>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateForm(true)}
            disabled={!connected}
          >
            Create your first investigation
          </button>
        </div>
      ) : (
        renderBoard()
      )}
    </div>
  );
};

export default InvestigationBoard;
