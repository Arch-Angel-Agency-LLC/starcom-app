import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatWindow from '../Chat/ChatWindow';
import styles from './EarthAllianceCommunicationPanel.module.css';

interface EarthAllianceCommunicationPanelProps {
  cellCode?: string;
  region?: string;
  userDID?: string;
  operativeLevel?: 'civilian' | 'coordinator' | 'cell_leader' | 'alliance_command';
  securityLevel?: 'standard' | 'enhanced' | 'maximum';
}

const EarthAllianceCommunicationPanel: React.FC<EarthAllianceCommunicationPanelProps> = ({
  cellCode = 'ALPHA-001',
  region = 'Global',
  userDID = 'did:earth-alliance:operative',
  operativeLevel = 'civilian',
  securityLevel = 'enhanced'
}) => {
  const [activePanel, setActivePanel] = useState<'general' | 'evidence' | 'coordination' | 'verification'>('general');
  const [channelLoaded, setChannelLoaded] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<Record<string, {
    isHealthy: boolean;
    successRate: number;
    averageLatency: number;
    score: number;
  }>>({});

  // Use the unified chat context
  const chat = useChat();

  // Evidence submission form state
  const [evidenceForm, setEvidenceForm] = useState({
    title: '',
    description: '',
    corruptionType: 'financial' as 'financial' | 'political' | 'media' | 'tech' | 'pharma' | 'energy' | 'military',
    evidenceType: 'document' as 'document' | 'testimony' | 'financial_record' | 'communication' | 'video' | 'audio',
    targetEntities: [''],
    sourceProtection: 'pseudonymous' as 'public' | 'pseudonymous' | 'anonymous' | 'high_security',
    riskLevel: 'medium' as 'low' | 'medium' | 'high' | 'extreme'
  });

  // Truth verification form state
  const [verificationForm, setVerificationForm] = useState({
    originalMessageId: '',
    verificationStatus: 'verified' as 'verified' | 'disputed' | 'requires_more_evidence',
    sourcesProvided: 1,
    expertiseArea: '',
    confidenceLevel: 80,
    additionalEvidence: ''
  });

  // Emergency coordination form state
  const [emergencyForm, setEmergencyForm] = useState({
    emergencyType: 'operational_security' as 'operational_security' | 'member_compromise' | 'evidence_critical' | 'timeline_threat',
    urgencyLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
    actionRequired: '',
    timeframe: '',
    affectedRegions: [''],
    resourcesNeeded: ['']
  });

  // Initialize Earth Alliance communications using unified chat API
  useEffect(() => {
    const initializeEarthAlliance = async () => {
      try {
        if (chat.isConnected) {
          // Create a channel ID based on cell code
          const channelId = `alliance-${cellCode.toLowerCase()}`;
          
          // Check if channel exists, create if not
          if (!chat.channels.some(c => c.id === channelId)) {
            await chat.createChannel(
              `Earth Alliance - ${cellCode} (${region})`,
              'team',
              [userDID]
            );
          }
          
          // Join and set as current channel
          await chat.joinChannel(channelId);
          chat.setCurrentChannel(channelId);
          
          // Set encryption based on security level
          chat.setEncryptionEnabled(securityLevel !== 'standard');
          
          // Simulate bridge status
          setBridgeStatus({
            'relay-1': {
              isHealthy: true,
              successRate: 98.7,
              averageLatency: 112,
              score: 4.9
            },
            'relay-2': {
              isHealthy: true,
              successRate: 96.2,
              averageLatency: 134,
              score: 4.7
            },
            'secure-bridge': {
              isHealthy: securityLevel === 'maximum',
              successRate: securityLevel === 'maximum' ? 99.9 : 86.3,
              averageLatency: securityLevel === 'maximum' ? 89 : 250,
              score: securityLevel === 'maximum' ? 5.0 : 3.8
            }
          });
          
          setChannelLoaded(true);
        } else {
          // Connect if not already connected
          if (!chat.isConnected) {
            await chat.connect({
              type: 'nostr', // Default provider for Earth Alliance
              options: {
                userId: userDID,
                userName: `Operative-${userDID.slice(-8)}`,
                encryption: securityLevel !== 'standard',
                metadata: {
                  region,
                  operativeLevel,
                  securityLevel
                }
              }
            });
          }
          
          // Retry after a short delay
          setTimeout(initializeEarthAlliance, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize Earth Alliance communications:', error);
      }
    };

    initializeEarthAlliance();
  }, [chat, cellCode, region, userDID, operativeLevel, securityLevel]);

  // Submit evidence
  const handleEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chat.currentChannel) return;
    
    try {
      // Format evidence as structured message
      const evidenceMessage = JSON.stringify(evidenceForm);
      
      // Send using unified chat API
      await chat.sendMessage(`[EVIDENCE SUBMISSION]\n${evidenceMessage}`);
      
      // Reset form
      setEvidenceForm({
        title: '',
        description: '',
        corruptionType: 'financial',
        evidenceType: 'document',
        targetEntities: [''],
        sourceProtection: 'pseudonymous',
        riskLevel: 'medium'
      });
      
      // Switch back to general panel
      setActivePanel('general');
    } catch (error) {
      console.error('Failed to submit evidence:', error);
    }
  };

  // Submit verification
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chat.currentChannel) return;
    
    try {
      // Format verification as structured message
      const verificationMessage = JSON.stringify(verificationForm);
      
      // Send using unified chat API
      await chat.sendMessage(`[VERIFICATION REPORT]\n${verificationMessage}`);
      
      // Reset form
      setVerificationForm({
        originalMessageId: '',
        verificationStatus: 'verified',
        sourcesProvided: 1,
        expertiseArea: '',
        confidenceLevel: 80,
        additionalEvidence: ''
      });
      
      // Switch back to general panel
      setActivePanel('general');
    } catch (error) {
      console.error('Failed to submit verification:', error);
    }
  };

  // Submit emergency coordination
  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chat.currentChannel) return;
    
    try {
      // Format emergency coordination as structured message
      const emergencyMessage = JSON.stringify(emergencyForm);
      
      // Send using unified chat API
      await chat.sendMessage(`[EMERGENCY COORDINATION]\n${emergencyMessage}`);
      
      // Reset form
      setEmergencyForm({
        emergencyType: 'operational_security',
        urgencyLevel: 'medium',
        description: '',
        actionRequired: '',
        timeframe: '',
        affectedRegions: [''],
        resourcesNeeded: ['']
      });
      
      // Switch back to general panel
      setActivePanel('general');
    } catch (error) {
      console.error('Failed to submit emergency coordination:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with Earth Alliance branding */}
      <div className={styles.header}>
        <div className={styles.allianceInfo}>
          <h2>Earth Alliance Communications</h2>
          <div className={styles.cellInfo}>
            <span className={styles.cellCode}>{cellCode}</span>
            <span className={styles.region}>{region}</span>
            <span className={styles.securityBadge}>
              {securityLevel === 'standard' ? '🟢' :
               securityLevel === 'enhanced' ? '🟠' : '🔴'}
              {securityLevel.toUpperCase()}
            </span>
          </div>
        </div>
        <div className={styles.operativeInfo}>
          <div className={styles.operativeLevel}>
            {operativeLevel === 'civilian' ? 'Civilian Operative' :
             operativeLevel === 'coordinator' ? 'Field Coordinator' :
             operativeLevel === 'cell_leader' ? 'Cell Leader' : 'Command'}
          </div>
          <div className={styles.operativeId}>{userDID.slice(-12)}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.navigation}>
        <button 
          className={`${styles.navButton} ${activePanel === 'general' ? styles.active : ''}`}
          onClick={() => setActivePanel('general')}
        >
          General Communications
        </button>
        <button 
          className={`${styles.navButton} ${activePanel === 'evidence' ? styles.active : ''}`}
          onClick={() => setActivePanel('evidence')}
        >
          Evidence Submission
        </button>
        <button 
          className={`${styles.navButton} ${activePanel === 'verification' ? styles.active : ''}`}
          onClick={() => setActivePanel('verification')}
        >
          Truth Verification
        </button>
        <button 
          className={`${styles.navButton} ${activePanel === 'coordination' ? styles.active : ''}`}
          onClick={() => setActivePanel('coordination')}
        >
          Emergency Coordination
        </button>
      </div>

      {/* Panel Content */}
      <div className={styles.panelContent}>
        {activePanel === 'general' && (
          <div className={styles.generalPanel}>
            {/* Bridge Status */}
            <div className={styles.bridgeStatus}>
              <h3>Secure Bridge Status</h3>
              <div className={styles.bridges}>
                {Object.entries(bridgeStatus).map(([bridgeId, status]) => (
                  <div key={bridgeId} className={styles.bridge}>
                    <div className={styles.bridgeHeader}>
                      <span className={styles.bridgeName}>{bridgeId}</span>
                      <span className={`${styles.bridgeHealth} ${status.isHealthy ? styles.healthy : styles.unhealthy}`}>
                        {status.isHealthy ? '● HEALTHY' : '● DEGRADED'}
                      </span>
                    </div>
                    <div className={styles.bridgeMetrics}>
                      <div className={styles.metric}>
                        <span>Success Rate</span>
                        <span>{status.successRate.toFixed(1)}%</span>
                      </div>
                      <div className={styles.metric}>
                        <span>Latency</span>
                        <span>{status.averageLatency}ms</span>
                      </div>
                      <div className={styles.metric}>
                        <span>Score</span>
                        <span>{status.score.toFixed(1)}/5.0</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main chat window */}
            <div className={styles.chatContainer}>
              <ChatWindow 
                showHeader={false}
                showChannelSelector={false}
                maxHeight="calc(100vh - 300px)"
                className={styles.chatWindow}
              />
            </div>
          </div>
        )}

        {activePanel === 'evidence' && (
          <div className={styles.evidencePanel}>
            <h3>Evidence Submission Form</h3>
            <form className={styles.evidenceForm} onSubmit={handleEvidenceSubmit}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Evidence Title</label>
                  <input 
                    type="text" 
                    value={evidenceForm.title}
                    onChange={(e) => setEvidenceForm({...evidenceForm, title: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea 
                    value={evidenceForm.description}
                    onChange={(e) => setEvidenceForm({...evidenceForm, description: e.target.value})}
                    required
                    rows={4}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Corruption Type</label>
                  <select 
                    value={evidenceForm.corruptionType}
                    onChange={(e) => setEvidenceForm({...evidenceForm, corruptionType: e.target.value as 'financial' | 'political' | 'media' | 'tech' | 'pharma' | 'energy' | 'military'})}
                  >
                    <option value="financial">Financial Corruption</option>
                    <option value="political">Political Corruption</option>
                    <option value="media">Media Manipulation</option>
                    <option value="tech">Tech Surveillance</option>
                    <option value="pharma">Pharma Corruption</option>
                    <option value="energy">Energy Industry</option>
                    <option value="military">Military Industrial Complex</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Evidence Type</label>
                  <select 
                    value={evidenceForm.evidenceType}
                    onChange={(e) => setEvidenceForm({...evidenceForm, evidenceType: e.target.value as 'document' | 'testimony' | 'financial_record' | 'communication' | 'video' | 'audio'})}
                  >
                    <option value="document">Document</option>
                    <option value="testimony">Testimony</option>
                    <option value="financial_record">Financial Record</option>
                    <option value="communication">Communication</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Source Protection Level</label>
                  <select 
                    value={evidenceForm.sourceProtection}
                    onChange={(e) => setEvidenceForm({...evidenceForm, sourceProtection: e.target.value as 'public' | 'pseudonymous' | 'anonymous' | 'high_security'})}
                  >
                    <option value="public">Public (No Protection)</option>
                    <option value="pseudonymous">Pseudonymous (Basic Protection)</option>
                    <option value="anonymous">Anonymous (Enhanced Protection)</option>
                    <option value="high_security">High Security (Maximum Protection)</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Risk Level</label>
                  <select 
                    value={evidenceForm.riskLevel}
                    onChange={(e) => setEvidenceForm({...evidenceForm, riskLevel: e.target.value as 'low' | 'medium' | 'high' | 'extreme'})}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                    <option value="extreme">Extreme Risk</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button type="button" onClick={() => setActivePanel('general')}>Cancel</button>
                <button type="submit">Submit Evidence</button>
              </div>
            </form>
          </div>
        )}

        {activePanel === 'verification' && (
          <div className={styles.verificationPanel}>
            <h3>Truth Verification Form</h3>
            <form className={styles.verificationForm} onSubmit={handleVerificationSubmit}>
              {/* Form fields for verification */}
              <div className={styles.formActions}>
                <button type="button" onClick={() => setActivePanel('general')}>Cancel</button>
                <button type="submit">Submit Verification</button>
              </div>
            </form>
          </div>
        )}

        {activePanel === 'coordination' && (
          <div className={styles.coordinationPanel}>
            <h3>Emergency Coordination Form</h3>
            <form className={styles.emergencyForm} onSubmit={handleEmergencySubmit}>
              {/* Form fields for emergency coordination */}
              <div className={styles.formActions}>
                <button type="button" onClick={() => setActivePanel('general')}>Cancel</button>
                <button type="submit">Submit Emergency Coordination</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer with connectivity status */}
      <div className={styles.footer}>
        <div className={styles.connectionStatus}>
          <span className={`${styles.statusDot} ${chat.isConnected && channelLoaded ? styles.connected : styles.disconnected}`}></span>
          <span>{chat.isConnected && channelLoaded ? 'Secure Connection Established' : 'Establishing Secure Connection...'}</span>
        </div>
        <div className={styles.encryptionStatus}>
          {chat.isEncryptionEnabled ? '🔒 Encrypted' : '🔓 Unencrypted'} • 
          Provider: {chat.providerType === 'nostr' ? 'Nostr' : 
                     chat.providerType === 'secure' ? 'SecureChat' : 
                     chat.providerType === 'gun' ? 'Gun.js' : 'Standard'}
        </div>
      </div>
    </div>
  );
};

export default EarthAllianceCommunicationPanel;
