import React, { useState, useEffect, useRef } from 'react';
import NostrService, { NostrMessage, NostrTeamChannel } from '../../services/nostrService';
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
  const [messages, setMessages] = useState<NostrMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState<NostrTeamChannel | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<NostrMessage['messageType']>('text');
  const [isConnected, setIsConnected] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<Record<string, {
    isHealthy: boolean;
    successRate: number;
    averageLatency: number;
    score: number;
  }>>({});
  const [activePanel, setActivePanel] = useState<'general' | 'evidence' | 'coordination' | 'verification'>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nostrService = NostrService.getInstance();

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

  // Initialize Earth Alliance service
  useEffect(() => {
    // TODO: Add support for investigation archival and long-term storage - PRIORITY: LOW
    const initializeEarthAlliance = async () => {
      try {
        if (nostrService.isReady()) {
          setIsConnected(true);
          nostrService.setUserDID(userDID);

          // Create Earth Alliance reclamation cell channel
          const channel = await nostrService.createResistanceCellChannel(
            cellCode,
            region,
            ['intelligence_gathering', 'corruption_exposure', 'truth_verification'],
            securityLevel
          );

          // Join the reclamation cell
          await nostrService.joinTeamChannel(channel.id, userDID, 'CONFIDENTIAL');

          setActiveChannel(channel);
          setMessages(nostrService.getChannelMessages(channel.id));

          // Get bridge health status
          const health = nostrService.getBridgeHealthStatus();
          setBridgeStatus(health);

          // Test bridge connectivity
          await nostrService.testBridgeConnectivity();
        } else {
          setTimeout(initializeEarthAlliance, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize Earth Alliance communications:', error);
      }
    };

    initializeEarthAlliance();
  }, [cellCode, region, userDID, securityLevel, nostrService]);

  // Listen for Earth Alliance events
  useEffect(() => {
    const handleMessageReceived = (event: CustomEvent) => {
      const message = event.detail as NostrMessage;
      if (activeChannel && message.channelId === activeChannel.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    const handleEvidenceSubmitted = (event: CustomEvent) => {
      const message = event.detail as NostrMessage;
      if (activeChannel && message.channelId === activeChannel.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    const handleEmergencyCoordination = (event: CustomEvent) => {
      const message = event.detail as NostrMessage;
      if (activeChannel && message.channelId === activeChannel.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        // Show urgent notification
        console.log('🚨 EMERGENCY COORDINATION RECEIVED:', message);
      }
    };

    window.addEventListener('nostr-message-received', handleMessageReceived as EventListener);
    window.addEventListener('earth-alliance-evidence-submitted', handleEvidenceSubmitted as EventListener);
    window.addEventListener('earth-alliance-emergency-coordination', handleEmergencyCoordination as EventListener);

    return () => {
      window.removeEventListener('nostr-message-received', handleMessageReceived as EventListener);
      window.removeEventListener('earth-alliance-evidence-submitted', handleEvidenceSubmitted as EventListener);
      window.removeEventListener('earth-alliance-emergency-coordination', handleEmergencyCoordination as EventListener);
    };
  }, [activeChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send regular message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || !isConnected) return;

    try {
      await nostrService.sendMessage(
        activeChannel.id,
        newMessage,
        messageType,
        {        operativeLevel,
        reclamationCell: cellCode,
        region,
          securityLevel
        }
      );

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send Earth Alliance message:', error);
    }
  };

  // Submit evidence
  const handleSubmitEvidence = async () => {
    if (!activeChannel) return;

    try {
      await nostrService.submitEvidence(activeChannel.id, evidenceForm);
      
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

      setActivePanel('general');
    } catch (error) {
      console.error('Failed to submit evidence:', error);
    }
  };

  // Submit truth verification
  const handleSubmitVerification = async () => {
    if (!activeChannel) return;

    try {
      await nostrService.submitTruthVerification(
        verificationForm.originalMessageId,
        activeChannel.id,
        verificationForm
      );
      
      // Reset form
      setVerificationForm({
        originalMessageId: '',
        verificationStatus: 'verified',
        sourcesProvided: 1,
        expertiseArea: '',
        confidenceLevel: 80,
        additionalEvidence: ''
      });

      setActivePanel('general');
    } catch (error) {
      console.error('Failed to submit verification:', error);
    }
  };

  // Send emergency coordination
  const handleSendEmergency = async () => {
    if (!activeChannel) return;

    try {
      await nostrService.sendEmergencyCoordination(
        activeChannel.id,
        emergencyForm.emergencyType,
        emergencyForm.urgencyLevel,
        emergencyForm
      );
      
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

      setActivePanel('general');
    } catch (error) {
      console.error('Failed to send emergency coordination:', error);
    }
  };

  const getBridgeHealthIndicator = (bridge: string) => {
    const health = bridgeStatus[bridge];
    if (!health) return '⚪';
    if (health.isHealthy && health.successRate > 0.8) return '🟢';
    if (health.isHealthy && health.successRate > 0.5) return '🟡';
    return '🔴';
  };

  const getMessageTypeIcon = (type: NostrMessage['messageType']) => {
    switch (type) {
      case 'evidence': return '📁';
      case 'verification': return '✅';
      case 'coordination': return '🚨';
      case 'alert': return '⚠️';
      case 'intelligence': return '🕵️';
      default: return '💬';
    }
  };

  return (
    <div className={styles.earthAlliancePanel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>🌍 Earth Alliance Communications</h2>
          <div className={styles.cellInfo}>
            <span>Cell: {cellCode}</span>
            <span>Region: {region}</span>
            <span>Security: {securityLevel.toUpperCase()}</span>
            <span className={isConnected ? styles.connected : styles.disconnected}>
              {isConnected ? '🟢 OPERATIONAL' : '🔴 OFFLINE'}
            </span>
          </div>
        </div>

        {/* Bridge Status */}
        <div className={styles.bridgeStatus}>
          <span>Bridges:</span>
          {Object.keys(bridgeStatus).map(bridge => (
            <span key={bridge} title={bridge}>
              {getBridgeHealthIndicator(bridge)}
            </span>
          ))}
        </div>
      </div>

      {/* Panel Navigation */}
      <div className={styles.panelNavigation}>
        <button 
          className={activePanel === 'general' ? styles.active : ''}
          onClick={() => setActivePanel('general')}
        >
          💬 General
        </button>
        <button 
          className={activePanel === 'evidence' ? styles.active : ''}
          onClick={() => setActivePanel('evidence')}
        >
          📁 Evidence
        </button>
        <button 
          className={activePanel === 'coordination' ? styles.active : ''}
          onClick={() => setActivePanel('coordination')}
        >
          🚨 Emergency
        </button>
        <button 
          className={activePanel === 'verification' ? styles.active : ''}
          onClick={() => setActivePanel('verification')}
        >
          ✅ Verify
        </button>
      </div>

      {/* General Communication Panel */}
      {activePanel === 'general' && (
        <>
          {/* Messages Display */}
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div key={message.id} className={styles.message}>
                <div className={styles.messageHeader}>
                  <span className={styles.messageType}>
                    {getMessageTypeIcon(message.messageType)}
                  </span>
                  <span className={styles.sender}>
                    {message.senderDID.slice(0, 20)}...
                  </span>
                  <span className={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={styles.security}>
                    {message.pqcEncrypted ? '🔐 PQC' : '🔒 STD'}
                  </span>
                </div>
                <div className={styles.messageContent}>
                  {message.content}
                </div>
                {message.metadata && (
                  <div className={styles.messageMetadata}>
                    {Object.entries(message.metadata).map(([key, value]) => (
                      <span key={key}>{key}: {String(value)}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className={styles.messageInput}>
            <select 
              value={messageType} 
              onChange={(e) => setMessageType(e.target.value as NostrMessage['messageType'])}
            >
              <option value="text">Text</option>
              <option value="intelligence">Intelligence</option>
              <option value="alert">Alert</option>
              <option value="status">Status</option>
            </select>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter message for Earth Alliance network..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage} disabled={!isConnected}>
              Send
            </button>
          </div>
        </>
      )}

      {/* Evidence Submission Panel */}
      {activePanel === 'evidence' && (
        <div className={styles.evidencePanel}>
          <h3>📁 Submit Corruption Evidence</h3>
          <div className={styles.form}>
            <input
              type="text"
              placeholder="Evidence Title"
              value={evidenceForm.title}
              onChange={(e) => setEvidenceForm({...evidenceForm, title: e.target.value})}
            />
            <textarea
              placeholder="Detailed Description"
              value={evidenceForm.description}
              onChange={(e) => setEvidenceForm({...evidenceForm, description: e.target.value})}
            />
            <select
              value={evidenceForm.corruptionType}
              onChange={(e) => setEvidenceForm({...evidenceForm, corruptionType: e.target.value as 'financial' | 'political' | 'media' | 'tech' | 'pharma' | 'energy' | 'military'})}
            >
              <option value="financial">Financial</option>
              <option value="political">Political</option>
              <option value="media">Media</option>
              <option value="tech">Technology</option>
              <option value="pharma">Pharmaceutical</option>
              <option value="energy">Energy</option>
              <option value="military">Military</option>
            </select>
            <select
              value={evidenceForm.sourceProtection}
              onChange={(e) => setEvidenceForm({...evidenceForm, sourceProtection: e.target.value as 'public' | 'pseudonymous' | 'anonymous' | 'high_security'})}
            >
              <option value="public">Public</option>
              <option value="pseudonymous">Pseudonymous</option>
              <option value="anonymous">Anonymous</option>
              <option value="high_security">High Security</option>
            </select>
            <button onClick={handleSubmitEvidence}>Submit Evidence</button>
          </div>
        </div>
      )}

      {/* Truth Verification Panel */}
      {activePanel === 'verification' && (
        <div className={styles.verificationPanel}>
          <h3>✅ Truth Verification</h3>
          <div className={styles.form}>
            <input
              type="text"
              placeholder="Original Message ID"
              value={verificationForm.originalMessageId}
              onChange={(e) => setVerificationForm({...verificationForm, originalMessageId: e.target.value})}
            />
            <input
              type="text"
              placeholder="Your Expertise Area"
              value={verificationForm.expertiseArea}
              onChange={(e) => setVerificationForm({...verificationForm, expertiseArea: e.target.value})}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={verificationForm.confidenceLevel}
              onChange={(e) => setVerificationForm({...verificationForm, confidenceLevel: Number(e.target.value)})}
            />
            <span>Confidence: {verificationForm.confidenceLevel}%</span>
            <select
              value={verificationForm.verificationStatus}
              onChange={(e) => setVerificationForm({...verificationForm, verificationStatus: e.target.value as 'verified' | 'disputed' | 'requires_more_evidence'})}
            >
              <option value="verified">Verified</option>
              <option value="disputed">Disputed</option>
              <option value="requires_more_evidence">Needs More Evidence</option>
            </select>
            <button onClick={handleSubmitVerification}>Submit Verification</button>
          </div>
        </div>
      )}

      {/* Emergency Coordination Panel */}
      {activePanel === 'coordination' && (
        <div className={styles.emergencyPanel}>
          <h3>🚨 Emergency Coordination</h3>
          <div className={styles.form}>
            <select
              value={emergencyForm.urgencyLevel}
              onChange={(e) => setEmergencyForm({...emergencyForm, urgencyLevel: e.target.value as 'low' | 'medium' | 'high' | 'critical'})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">CRITICAL</option>
            </select>
            <select
              value={emergencyForm.emergencyType}
              onChange={(e) => setEmergencyForm({...emergencyForm, emergencyType: e.target.value as 'operational_security' | 'member_compromise' | 'evidence_critical' | 'timeline_threat'})}
            >
              <option value="operational_security">Operational Security</option>
              <option value="member_compromise">Member Compromise</option>
              <option value="evidence_critical">Critical Evidence</option>
              <option value="timeline_threat">Timeline Threat</option>
            </select>
            <textarea
              placeholder="Emergency Description"
              value={emergencyForm.description}
              onChange={(e) => setEmergencyForm({...emergencyForm, description: e.target.value})}
            />
            <input
              type="text"
              placeholder="Action Required"
              value={emergencyForm.actionRequired}
              onChange={(e) => setEmergencyForm({...emergencyForm, actionRequired: e.target.value})}
            />
            <input
              type="text"
              placeholder="Timeframe"
              value={emergencyForm.timeframe}
              onChange={(e) => setEmergencyForm({...emergencyForm, timeframe: e.target.value})}
            />
            <button 
              onClick={handleSendEmergency}
              className={styles.emergencyButton}
            >
              Send Emergency Coordination
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarthAllianceCommunicationPanel;
