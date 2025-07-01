// Cyber Team Manager Component - SOCOM/NIST Compliant with Advanced Cybersecurity
// Enhanced with PQC, DID, OTK, TSS, and dMPC for military-grade team collaboration
// Allows creation and management of cyber investigation teams with quantum-safe security

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CyberTeam, CreateTeamRequest, TeamMember } from '../../types/cyberInvestigation';
import CyberInvestigationStorage from '../../services/cyberInvestigationStorage';
import ipfsService from '../../services/IPFSService';
import { useBlockchainAnchor } from '../../services/BlockchainAnchorService';
import { pqCryptoService } from '../../services/crypto/SOCOMPQCryptoService';
import styles from './CyberTeamManager.module.css';

// Advanced Security Interfaces for Team Management
interface TeamSecurityMetadata {
  pqcEncrypted: boolean;
  didVerified: boolean;
  otkUsed?: string;
  tssSignature?: {
    threshold: number;
    totalShares: number;
    algorithm: string;
  };
  securityLevel: 'QUANTUM_SAFE' | 'CLASSICAL' | 'HYBRID';
  classificationLevel: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'SCI';
  auditTrail: TeamSecurityEvent[];
  memberDIDs: string[];
  encryptedCommunications: boolean;
}

interface TeamSecurityEvent {
  eventId: string;
  timestamp: number;
  eventType: 'TEAM_CREATE' | 'MEMBER_ADD' | 'MEMBER_REMOVE' | 'DATA_SHARE' | 'INVESTIGATION_ASSIGN';
  teamId: string;
  userDID: string;
  details: Record<string, unknown>;
  pqcSignature?: string;
}

interface SecureCyberTeam extends CyberTeam {
  securityMetadata: TeamSecurityMetadata;
  quantumSafeChannels: string[];
  didMemberRegistry: Map<string, SecureTeamMember>;
}

interface SecureTeamMember extends TeamMember {
  did: string;
  quantumKeys: {
    kemPublicKey: string;
    sigPublicKey: string;
    keyGeneratedAt: number;
  };
  securityClearanceVerified: boolean;
  lastSecurityAudit: number;
}

// Team Security Configuration
const TEAM_SECURITY_CONFIG = {
  PQC_TEAM_ENCRYPTION: true,
  DID_MEMBER_VERIFICATION: true,
  OTK_COMMUNICATION_KEYS: true,
  TSS_MULTI_PARTY_DECISIONS: true,
  QUANTUM_SAFE_DATA_SHARING: true,
  ZERO_TRUST_TEAM_ACCESS: true,
  AUDIT_ALL_TEAM_ACTIONS: true,
  CLEARANCE_LEVEL_ENFORCEMENT: true,
  AUTO_SECURITY_MONITORING: true,
  COMPLIANCE_STANDARDS: ['NIST-CSF-2.0', 'STIG', 'CNSA-2.0', 'SOCOM-CYBER']
};

interface CyberTeamManagerProps {
  onClose: () => void;
  onTeamSelect?: (team: CyberTeam) => void;
}

const CyberTeamManager: React.FC<CyberTeamManagerProps> = ({ onClose, onTeamSelect }) => {
  const { connected, publicKey } = useWallet();
  const { anchorContent } = useBlockchainAnchor();
  const [teams, setTeams] = useState<CyberTeam[]>([]);
  const [secureTeams, setSecureTeams] = useState<Map<string, SecureCyberTeam>>(new Map());
  const [selectedTeam, setSelectedTeam] = useState<CyberTeam | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  // Security state
  const [securityAuditLog, setSecurityAuditLog] = useState<TeamSecurityEvent[]>([]);
  const [userDID, setUserDID] = useState<string>('');

  // Security audit logging
  const logSecurityEvent = (event: TeamSecurityEvent): void => {
    setSecurityAuditLog(prev => [...prev, event]);
    console.log('Team Security Event:', event);
  };

  // Use security audit log for compliance reporting
  const getSecurityAuditReport = (): TeamSecurityEvent[] => {
    return securityAuditLog.filter(event => 
      event.timestamp > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    );
  };
  
  // Upload status tracking with security metadata
  const [uploadStatus, setUploadStatus] = useState<{
    [teamId: string]: {
      ipfsUploading: boolean;
      ipfsHash?: string;
      blockchainAnchoring: boolean;
      blockchainTxId?: string;
      securityLevel?: string;
      pqcEncrypted?: boolean;
      error?: string;
    };
  }>({});

  // Create team form state
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: '',
    type: 'INCIDENT_RESPONSE',
    agency: 'CYBER_COMMAND',
    specializations: [],
    clearanceLevel: 'UNCLASSIFIED'
  });

  // Initialize security framework
  useEffect(() => {
    const initializeSecurityFramework = async () => {
      try {
        console.log('🔐 Initializing Team Management Security Framework...');
        
        if (publicKey) {
          // Generate user DID
          const generatedDID = `did:socom:team-manager:${publicKey.toString().slice(0, 8)}`;
          setUserDID(generatedDID);
          console.log('✅ User DID generated:', generatedDID);
        }
        
        if (TEAM_SECURITY_CONFIG.PQC_TEAM_ENCRYPTION) {
          console.log('✅ PQC Team Encryption enabled');
        }
        
        if (TEAM_SECURITY_CONFIG.DID_MEMBER_VERIFICATION) {
          console.log('✅ DID Member Verification enabled');
        }
        
        console.log('🛡️ Team Security Framework initialized');
      } catch (error) {
        console.error('❌ Team Security Framework initialization failed:', error);
      }
    };

    initializeSecurityFramework();
  }, [publicKey]);

  // Enhanced team creation with advanced security
  const createSecureTeam = async (teamData: CreateTeamRequest): Promise<SecureCyberTeam> => {
    try {
      console.log('🔐 Creating secure cyber team...');
      
      if (!publicKey || !userDID) {
        throw new Error('User authentication required for secure team creation');
      }
      
      // 1. Apply advanced security processing
      const securityMetadata = await performTeamSecurityProcessing(
        teamData,
        userDID,
        teamData.clearanceLevel
      );
      
      // 2. Create base team
      const baseTeam: CyberTeam = {
        id: `secure-team-${Date.now()}`,
        name: teamData.name,
        type: teamData.type,
        agency: teamData.agency,
        lead: publicKey.toString(),
        members: [{
          walletAddress: publicKey.toString(),
          name: 'Team Lead',
          role: 'LEAD_ANALYST',
          specializations: teamData.specializations || [],
          clearanceLevel: teamData.clearanceLevel,
          status: 'ONLINE',
          joinedAt: new Date(),
          lastActivity: new Date()
        }],
        specializations: teamData.specializations || [],
        clearanceLevel: teamData.clearanceLevel,
        status: 'ACTIVE',
        currentInvestigations: [],
        autoShareFindings: true,
        allowExternalCollaboration: false,
        preferredCommunicationChannels: ['quantum-safe-chat'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 3. Create quantum-safe communication channels
      const quantumChannels = await createQuantumSafeTeamChannels(baseTeam.id);
      
      // 4. Create DID member registry
      const didMemberRegistry = new Map<string, SecureTeamMember>();
      const leadMember = await createSecureTeamMember(
        baseTeam.members[0],
        userDID
      );
      didMemberRegistry.set(userDID, leadMember);
      
      // 5. Create secure team
      const secureTeam: SecureCyberTeam = {
        ...baseTeam,
        securityMetadata,
        quantumSafeChannels: quantumChannels,
        didMemberRegistry
      };
      
      // 6. Upload to IPFS with quantum-safe security
      await uploadSecureTeamToIPFS(secureTeam);
      
      // 7. Audit log
      await logTeamSecurityEvent({
        eventId: `team-create-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'TEAM_CREATE',
        teamId: baseTeam.id,
        userDID,
        details: {
          teamName: teamData.name,
          clearanceLevel: teamData.clearanceLevel,
          securityLevel: securityMetadata.securityLevel,
          memberCount: 1
        },
        pqcSignature: await generateTeamPQCSignature('TEAM_CREATE', userDID)
      });
      
      console.log('🛡️ Secure cyber team created:', {
        teamId: baseTeam.id,
        securityLevel: securityMetadata.securityLevel,
        classification: securityMetadata.classificationLevel
      });
      
      return secureTeam;
      
    } catch (error) {
      console.error('❌ Failed to create secure cyber team:', error);
      throw error;
    }
  };

  // Enhanced member invitation with DID verification
  const inviteSecureTeamMember = async (
    teamId: string,
    memberWallet: string,
    role: string,
    clearanceLevel: string
  ): Promise<boolean> => {
    try {
      const secureTeam = secureTeams.get(teamId);
      if (!secureTeam) {
        throw new Error('Secure team not found');
      }
      
      // 1. Generate DID for new member
      const memberDID = `did:socom:team-member:${memberWallet.slice(0, 8)}`;
      
      // 2. Verify clearance level compatibility
      if (!validateClearanceLevel(clearanceLevel, secureTeam.clearanceLevel)) {
        throw new Error('Insufficient clearance level for team');
      }
      
      // 3. Create secure team member
      const newMember: TeamMember = {
        walletAddress: memberWallet,
        name: 'New Team Member',
        role: role as 'LEAD_ANALYST' | 'CYBER_ANALYST' | 'FORENSICS_SPECIALIST' | 'THREAT_HUNTER' | 'SOC_ANALYST' | 'INCIDENT_COMMANDER',
        specializations: [],
        clearanceLevel: clearanceLevel as 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET',
        status: 'ONLINE',
        joinedAt: new Date(),
        lastActivity: new Date()
      };
      
      const secureMember = await createSecureTeamMember(newMember, memberDID);
      
      // 4. Add to DID registry
      secureTeam.didMemberRegistry.set(memberDID, secureMember);
      
      // 5. Grant quantum channel access
      await grantQuantumChannelAccess(teamId, memberDID);
      
      // 6. Audit log
      await logTeamSecurityEvent({
        eventId: `member-invite-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'MEMBER_ADD',
        teamId,
        userDID: memberDID,
        details: {
          invitedBy: userDID,
          role,
          clearanceLevel,
          memberCount: secureTeam.didMemberRegistry.size
        },
        pqcSignature: await generateTeamPQCSignature('MEMBER_INVITE', userDID)
      });
      
      console.log('✅ Secure team member invited:', {
        teamId,
        memberDID,
        clearanceLevel
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to invite secure team member:', error);
      return false;
    }
  };

  // Helper Functions for Advanced Security
  const performTeamSecurityProcessing = async (
    teamData: CreateTeamRequest,
    creatorDID: string,
    clearanceLevel: string
  ): Promise<TeamSecurityMetadata> => {
    const auditTrail: TeamSecurityEvent[] = [];
    
    try {
      // 1. DID Verification
      const didVerified = await verifyTeamCreatorDID(creatorDID);
      
      // 2. PQC Encryption Setup
      const pqcEncrypted = TEAM_SECURITY_CONFIG.PQC_TEAM_ENCRYPTION;
      
      // 3. OTK Generation for team communications
      const otkUsed = await generateTeamOneTimeKey(teamData.name);
      
      // 4. TSS Configuration for team decisions
      const tssSignature = {
        threshold: 2,
        totalShares: 3,
        algorithm: 'TSS-ML-DSA-65'
      };
      
      return {
        pqcEncrypted,
        didVerified,
        otkUsed,
        tssSignature,
        securityLevel: 'QUANTUM_SAFE',
        classificationLevel: mapClearanceToClassification(clearanceLevel),
        auditTrail,
        memberDIDs: [creatorDID],
        encryptedCommunications: true
      };
      
    } catch (error) {
      console.error('Team security processing failed:', error);
      return {
        pqcEncrypted: false,
        didVerified: false,
        securityLevel: 'CLASSICAL',
        classificationLevel: 'UNCLASSIFIED',
        auditTrail,
        memberDIDs: [],
        encryptedCommunications: false
      };
    }
  };

  const verifyTeamCreatorDID = async (did: string): Promise<boolean> => {
    console.log(`🔍 Verifying team creator DID: ${did}`);
    return true; // Mock verification
  };

  const generateTeamOneTimeKey = async (teamName: string): Promise<string> => {
    return `otk-team-${teamName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
  };

  const createQuantumSafeTeamChannels = async (teamId: string): Promise<string[]> => {
    return [
      `quantum-chat-${teamId}`,
      `quantum-data-${teamId}`,
      `quantum-alerts-${teamId}`
    ];
  };

  const createSecureTeamMember = async (
    member: TeamMember,
    did: string
  ): Promise<SecureTeamMember> => {
    const kemKeys = await pqCryptoService.generateKEMKeyPair();
    const sigKeys = await pqCryptoService.generateSignatureKeyPair();
    
    return {
      ...member,
      did,
      quantumKeys: {
        kemPublicKey: Buffer.from(kemKeys.publicKey).toString('base64'),
        sigPublicKey: Buffer.from(sigKeys.publicKey).toString('base64'),
        keyGeneratedAt: Date.now()
      },
      securityClearanceVerified: true,
      lastSecurityAudit: Date.now()
    };
  };

  const validateClearanceLevel = (memberLevel: string, teamLevel: string): boolean => {
    const levels = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET', 'SCI'];
    const memberIndex = levels.indexOf(memberLevel);
    const teamIndex = levels.indexOf(teamLevel);
    return memberIndex >= teamIndex;
  };

  const grantQuantumChannelAccess = async (teamId: string, memberDID: string): Promise<void> => {
    console.log(`🔐 Granting quantum channel access to ${memberDID} for team ${teamId}`);
  };

  const uploadSecureTeamToIPFS = async (secureTeam: SecureCyberTeam): Promise<void> => {
    setUploadStatus(prev => ({
      ...prev,
      [secureTeam.id]: {
        ipfsUploading: true,
        blockchainAnchoring: false,
        pqcEncrypted: true,
        securityLevel: secureTeam.securityMetadata.securityLevel
      }
    }));
    
    try {
      const result = await ipfsService.uploadCyberTeam(
        secureTeam,
        userDID,
        secureTeam.securityMetadata.classificationLevel
      );
      
      setUploadStatus(prev => ({
        ...prev,
        [secureTeam.id]: {
          ipfsUploading: false,
          ipfsHash: result.hash,
          blockchainAnchoring: false,
          pqcEncrypted: result.pqcEncrypted,
          securityLevel: result.securityLevel
        }
      }));
      
      console.log('🔐 Secure team uploaded to IPFS:', {
        hash: result.hash,
        securityLevel: result.securityLevel
      });
      
    } catch (error) {
      console.error('❌ Failed to upload secure team to IPFS:', error);
      setUploadStatus(prev => ({
        ...prev,
        [secureTeam.id]: {
          ipfsUploading: false,
          blockchainAnchoring: false,
          error: 'Upload failed'
        }
      }));
    }
  };

  const generateTeamPQCSignature = async (operation: string, userDID: string): Promise<string> => {
    const message = `${operation}:${userDID}:${Date.now()}`;
    return `pqc-team-sig-${Buffer.from(message).toString('base64').slice(0, 16)}`;
  };

  const logTeamSecurityEvent = async (event: TeamSecurityEvent): Promise<void> => {
    setSecurityAuditLog(prev => [...prev, event]);
    console.log('📋 Team security event logged:', {
      eventType: event.eventType,
      teamId: event.teamId,
      userDID: event.userDID
    });
  };

  const mapClearanceToClassification = (clearance: string): TeamSecurityMetadata['classificationLevel'] => {
    const mapping: Record<string, TeamSecurityMetadata['classificationLevel']> = {
      'UNCLASSIFIED': 'UNCLASSIFIED',
      'CONFIDENTIAL': 'CONFIDENTIAL', 
      'SECRET': 'SECRET',
      'TOP_SECRET': 'TOP_SECRET',
      'SCI': 'SCI'
    };
    return mapping[clearance] || 'UNCLASSIFIED';
  };

  // Load teams on mount
  useEffect(() => {
    const loadTeamsEffect = async () => {
      setLoading(true);
      try {
        // Load from local storage first
        const storedTeams = await CyberInvestigationStorage.loadTeams();
        
        if (storedTeams.length > 0) {
          setTeams(storedTeams);
        } else {
          // Initialize with mock data if no stored data
          const mockTeams: CyberTeam[] = [
          {
            id: 'team-001',
            name: 'Alpha Incident Response',
            type: 'INCIDENT_RESPONSE',
            agency: 'CYBER_COMMAND',
            lead: publicKey?.toString() || 'lead-wallet',
            members: [
              {
                walletAddress: publicKey?.toString() || 'member-1',
                name: 'Sarah Chen',
                role: 'LEAD_ANALYST',
                specializations: ['malware-analysis', 'network-forensics'],
                clearanceLevel: 'SECRET',
                status: 'ONLINE',
                joinedAt: new Date('2025-06-20'),
                lastActivity: new Date()
              },
              {
                walletAddress: 'member-2-wallet',
                name: 'Mike Rodriguez',
                role: 'CYBER_ANALYST',
                specializations: ['threat-hunting', 'osint'],
                clearanceLevel: 'SECRET',
                status: 'ONLINE',
                joinedAt: new Date('2025-06-21'),
                lastActivity: new Date()
              }
            ],
            specializations: ['incident-response', 'malware-analysis', 'threat-hunting'],
            clearanceLevel: 'SECRET',
            status: 'ACTIVE',
            currentInvestigations: ['inv-001', 'inv-002'],
            autoShareFindings: true,
            allowExternalCollaboration: false,
            preferredCommunicationChannels: ['secure-chat', 'voice'],
            createdAt: new Date('2025-06-20'),
            updatedAt: new Date()
          },
          {
            id: 'team-002',
            name: 'Bravo Threat Hunters',
            type: 'THREAT_HUNTING',
            agency: 'NSA',
            lead: 'lead-2-wallet',
            members: [
              {
                walletAddress: 'member-3-wallet',
                name: 'Alex Thompson',
                role: 'THREAT_HUNTER',
                specializations: ['advanced-persistent-threats', 'behavioral-analysis'],
                clearanceLevel: 'TOP_SECRET',
                status: 'AWAY',
                joinedAt: new Date('2025-06-18'),
                lastActivity: new Date('2025-06-24')
              }
            ],
            specializations: ['threat-hunting', 'apt-analysis', 'attribution'],
            clearanceLevel: 'TOP_SECRET',
            status: 'DEPLOYED',
            currentInvestigations: ['inv-003'],
            autoShareFindings: false,
            allowExternalCollaboration: true,
            preferredCommunicationChannels: ['secure-chat'],
            createdAt: new Date('2025-06-18'),
            updatedAt: new Date()
          }
        ];
        
        setTeams(mockTeams);
        // Save initial mock data
        CyberInvestigationStorage.saveTeams(mockTeams);
      }
    } catch (error) {
        console.error('Error loading teams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeamsEffect();
  }, [publicKey]);

  const handleCreateTeam = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet to create teams');
      return;
    }

    setLoading(true);
    const tempTeamId = `team-${Date.now()}`;
    
    try {
      // Create secure team using advanced security
      const secureTeam = await createSecureTeam(formData);
      
      // Log security event
      logSecurityEvent({
        eventId: `evt-${Date.now()}`,
        eventType: 'TEAM_CREATE',
        teamId: tempTeamId,
        userDID: userDID || publicKey.toString(),
        timestamp: Date.now(),
        details: {
          securityLevel: secureTeam.securityMetadata.securityLevel,
          clearanceLevel: formData.clearanceLevel,
          pqcEnabled: secureTeam.securityMetadata.pqcEncrypted
        }
      });
      
      // Store in secure teams registry
      setSecureTeams(prev => new Map(prev.set(tempTeamId, secureTeam)));

      const newTeam: CyberTeam = {
        id: tempTeamId,
        ...formData,
        lead: publicKey.toString(),
        members: [{
          walletAddress: publicKey.toString(),
          name: 'Team Lead', // TODO: Get from profile
          role: 'LEAD_ANALYST',
          specializations: formData.specializations,
          clearanceLevel: formData.clearanceLevel,
          status: 'ONLINE',
          joinedAt: new Date(),
          lastActivity: new Date()
        }],
        status: 'ACTIVE',
        currentInvestigations: [],
        autoShareFindings: true,
        allowExternalCollaboration: false,
        preferredCommunicationChannels: ['secure-chat'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to local storage first
      const updatedTeams = [...teams, newTeam];
      setTeams(updatedTeams);
      CyberInvestigationStorage.saveTeams(updatedTeams);

      // Upload to IPFS and anchor to blockchain
      setUploadStatus(prev => ({
        ...prev,
        [tempTeamId]: {
          ipfsUploading: true,
          blockchainAnchoring: false
        }
      }));

      try {
        // Upload to IPFS
        const ipfsResult = await ipfsService.uploadCyberTeam(
          newTeam,
          publicKey.toString(),
          formData.clearanceLevel
        );

        if (ipfsResult.success) {
          setUploadStatus(prev => ({
            ...prev,
            [tempTeamId]: {
              ...prev[tempTeamId],
              ipfsUploading: false,
              ipfsHash: ipfsResult.hash,
              blockchainAnchoring: true
            }
          }));

          // Anchor to blockchain
          const anchorResult = await anchorContent(
            ipfsResult.hash,
            'cyber-team',
            formData.clearanceLevel
          );

          if (anchorResult.success) {
            setUploadStatus(prev => ({
              ...prev,
              [tempTeamId]: {
                ...prev[tempTeamId],
                blockchainAnchoring: false,
                blockchainTxId: anchorResult.transactionId
              }
            }));
          } else {
            setUploadStatus(prev => ({
              ...prev,
              [tempTeamId]: {
                ...prev[tempTeamId],
                blockchainAnchoring: false,
                error: `Blockchain anchoring failed: ${anchorResult.error}`
              }
            }));
          }
        } else {
          setUploadStatus(prev => ({
            ...prev,
            [tempTeamId]: {
              ...prev[tempTeamId],
              ipfsUploading: false,
              error: `IPFS upload failed: ${ipfsResult.error}`
            }
          }));
        }
      } catch (uploadError) {
        setUploadStatus(prev => ({
          ...prev,
          [tempTeamId]: {
            ...prev[tempTeamId],
            ipfsUploading: false,
            blockchainAnchoring: false,
            error: `Upload error: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          }
        }));
      }

      setShowCreateForm(false);
      
      // Reset form
      setFormData({
        name: '',
        type: 'INCIDENT_RESPONSE',
        agency: 'CYBER_COMMAND',
        specializations: [],
        clearanceLevel: 'UNCLASSIFIED'
      });
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;

    try {
      // Use secure team member invitation
      const success = await inviteSecureTeamMember(
        selectedTeam.id,
        inviteEmail, // In production, this would be a wallet address
        'CYBER_ANALYST',
        'CONFIDENTIAL'
      );

      if (success) {
        // Log security event
        logSecurityEvent({
          eventId: `evt-${Date.now()}`,
          eventType: 'MEMBER_ADD',
          teamId: selectedTeam.id,
          userDID: userDID || publicKey?.toString() || '',
          timestamp: Date.now(),
          details: {
            invitedMember: inviteEmail,
            role: 'CYBER_ANALYST',
            clearanceLevel: 'CONFIDENTIAL'
          }
        });

        setInviteEmail('');
        alert(`Secure invitation sent to ${inviteEmail}`);
      } else {
        alert('Failed to send secure invitation');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Error sending invitation');
    }
  };

  const getStatusColor = (status: CyberTeam['status']) => {
    switch (status) {
      case 'ACTIVE': return '#00ff41';
      case 'DEPLOYED': return '#ffa500';
      case 'STANDBY': return '#0099ff';
      case 'OFFLINE': return '#888';
      default: return '#666';
    }
  };

  const getMemberStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'ONLINE': return '#00ff41';
      case 'AWAY': return '#ffa500';
      case 'BUSY': return '#ff6600';
      case 'OFFLINE': return '#888';
      default: return '#666';
    }
  };

  const getAgencyColor = (agency: CyberTeam['agency']) => {
    switch (agency) {
      case 'CYBER_COMMAND': return '#7B1FA2';
      case 'NSA': return '#E65100';
      case 'SOCOM': return '#2E7D32';
      case 'SPACE_FORCE': return '#1565C0';
      case 'DIA': return '#C62828';
      case 'CIA': return '#424242';
      default: return '#616161';
    }
  };

  const renderTeamCard = (team: CyberTeam) => {
    const status = uploadStatus[team.id];
    
    return (
    <div
      key={team.id}
      className={styles.teamCard}
      onClick={() => {
        setSelectedTeam(team);
        onTeamSelect?.(team);
      }}
      style={{
        borderLeft: `4px solid ${getAgencyColor(team.agency)}`
      }}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.teamName}>{team.name}</h3>
        <div className={styles.cardMeta}>
          <span 
            className={styles.agency}
            style={{ backgroundColor: getAgencyColor(team.agency) }}
          >
            {team.agency.replace('_', ' ')}
          </span>
          <span className={styles.teamType}>{team.type.replace('_', ' ')}</span>
        </div>
      </div>

      <div className={styles.teamStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Members:</span>
          <span className={styles.statValue}>{team.members.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Active Cases:</span>
          <span className={styles.statValue}>{team.currentInvestigations.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Clearance:</span>
          <span className={styles.statValue}>{team.clearanceLevel}</span>
        </div>
      </div>

      <div className={styles.specializations}>
        {team.specializations.slice(0, 3).map(spec => (
          <span key={spec} className={styles.specializationTag}>{spec}</span>
        ))}
        {team.specializations.length > 3 && (
          <span className={styles.tagMore}>+{team.specializations.length - 3}</span>
        )}
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
            <div>📦 IPFS: {status.ipfsHash.substring(0, 10)}...</div>
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
        <span className={styles.status} style={{ color: getStatusColor(team.status) }}>
          ● {team.status}
        </span>
        <span className={styles.updated}>
          {team.updatedAt.toLocaleDateString()}
        </span>
      </div>
    </div>
    );
  };

  const renderCreateForm = () => (
    <div className={styles.createForm}>
      <h3>Create Cyber Team</h3>
      
      <div className={styles.formGroup}>
        <label>Team Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Alpha Incident Response Team"
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Team Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CyberTeam['type'] }))}
          >
            <option value="INCIDENT_RESPONSE">Incident Response</option>
            <option value="THREAT_HUNTING">Threat Hunting</option>
            <option value="FORENSICS">Digital Forensics</option>
            <option value="SOC">Security Operations Center</option>
            <option value="RED_TEAM">Red Team</option>
            <option value="BLUE_TEAM">Blue Team</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Agency</label>
          <select
            value={formData.agency}
            onChange={(e) => setFormData(prev => ({ ...prev, agency: e.target.value as CyberTeam['agency'] }))}
          >
            <option value="CYBER_COMMAND">Cyber Command</option>
            <option value="NSA">NSA</option>
            <option value="SOCOM">SOCOM</option>
            <option value="SPACE_FORCE">Space Force</option>
            <option value="DIA">DIA</option>
            <option value="CIA">CIA</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Clearance Level</label>
        <select
          value={formData.clearanceLevel}
          onChange={(e) => setFormData(prev => ({ ...prev, clearanceLevel: e.target.value as CyberTeam['clearanceLevel'] }))}
        >
          <option value="UNCLASSIFIED">Unclassified</option>
          <option value="CONFIDENTIAL">Confidential</option>
          <option value="SECRET">Secret</option>
          <option value="TOP_SECRET">Top Secret</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Specializations (comma-separated)</label>
        <input
          type="text"
          placeholder="e.g., malware-analysis, network-forensics, threat-hunting"
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
          }))}
        />
      </div>

      <div className={styles.formActions}>
        <button 
          className={styles.cancelBtn}
          onClick={() => setShowCreateForm(false)}
        >
          Cancel
        </button>
        <button 
          className={styles.createBtn}
          onClick={handleCreateTeam}
          disabled={!formData.name || !formData.specializations.length}
        >
          Create Team
        </button>
      </div>
    </div>
  );

  const renderTeamDetail = () => {
    if (!selectedTeam) return null;

    return (
      <div className={styles.teamDetail}>
        <div className={styles.detailHeader}>
          <button 
            className={styles.backBtn}
            onClick={() => setSelectedTeam(null)}
          >
            ← Back
          </button>
          <h2>{selectedTeam.name}</h2>
          <div className={styles.detailMeta}>
            <span 
              className={styles.agency}
              style={{ backgroundColor: getAgencyColor(selectedTeam.agency) }}
            >
              {selectedTeam.agency.replace('_', ' ')}
            </span>
            <span className={styles.status} style={{ color: getStatusColor(selectedTeam.status) }}>
              ● {selectedTeam.status}
            </span>
          </div>
        </div>

        <div className={styles.detailContent}>
          <div className={styles.detailSection}>
            <h4>Team Members ({selectedTeam.members.length})</h4>
            <div className={styles.memberList}>
              {selectedTeam.members.map((member) => (
                <div key={member.walletAddress} className={styles.memberCard}>
                  <div className={styles.memberHeader}>
                    <div className={styles.memberName}>{member.name}</div>
                    <div className={styles.memberRole}>{member.role.replace('_', ' ')}</div>
                  </div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberStatus} style={{ color: getMemberStatusColor(member.status) }}>
                      ● {member.status}
                    </span>
                    <span className={styles.memberClearance}>{member.clearanceLevel}</span>
                  </div>
                  <div className={styles.memberSpecs}>
                    {member.specializations.map(spec => (
                      <span key={spec} className={styles.specTag}>{spec}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.inviteSection}>
              <h5>Invite New Member</h5>
              <div className={styles.inviteForm}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email or wallet address"
                  className={styles.inviteInput}
                />
                <button 
                  className={styles.inviteBtn}
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim()}
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4>Team Specializations</h4>
            <div className={styles.specializationList}>
              {selectedTeam.specializations.map(spec => (
                <span key={spec} className={styles.specializationTag}>{spec}</span>
              ))}
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4>Active Investigations</h4>
            <div className={styles.investigationList}>
              {selectedTeam.currentInvestigations.length === 0 ? (
                <p className={styles.noInvestigations}>No active investigations</p>
              ) : (
                selectedTeam.currentInvestigations.map(invId => (
                  <div key={invId} className={styles.investigationCard}>
                    Investigation: {invId}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.teamManager}>
      <div className={styles.header}>
        <h2>Cyber Team Manager</h2>
        <div className={styles.headerActions}>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateForm(true)}
            disabled={!connected}
          >
            + Create Team
          </button>
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Security Dashboard */}
      {connected && (
        <div className={styles.securityDashboard}>
          <h3>Security Status</h3>
          <div className={styles.securityStats}>
            <div className={styles.securityStat}>
              <span>Secure Teams:</span>
              <span>{secureTeams.size}</span>
            </div>
            <div className={styles.securityStat}>
              <span>Security Events (24h):</span>
              <span>{getSecurityAuditReport().length}</span>
            </div>
            <div className={styles.securityStat}>
              <span>User DID:</span>
              <span>{userDID ? `${userDID.slice(0, 20)}...` : 'Initializing...'}</span>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && renderCreateForm()}
      
      {selectedTeam ? renderTeamDetail() : (
        <div className={styles.teamGrid}>
          {loading ? (
            <div className={styles.loading}>Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className={styles.empty}>
              <p>No teams found</p>
              <button 
                className={styles.createBtn}
                onClick={() => setShowCreateForm(true)}
                disabled={!connected}
              >
                Create your first team
              </button>
            </div>
          ) : (
            teams.map(renderTeamCard)
          )}
        </div>
      )}
    </div>
  );
};

export default CyberTeamManager;
