import React, { useState, useEffect } from 'react';
import { CommunicationProvider } from '../context/CommunicationProvider';
import { CommunicationContext } from '../context/CommunicationContext';
import { ChannelSelector } from './ChannelSelector';
import { MessageDisplay } from './MessageDisplay';
import { MessageComposer } from './MessageComposer';
import styles from './EarthAllianceCommunicationPanel.module.css';

// Default NostrService configuration
const DEFAULT_CONFIG = {
  endpoints: ['wss://relay.earth-alliance.org/v1'],
  fallbackEndpoints: ['wss://backup.earth-alliance.org/v1'],
  reconnectStrategy: {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
  },
  batchSize: 50,
  compressionLevel: 1,
  encryptionAlgorithm: 'aes-256-gcm',
  signatureAlgorithm: 'ed25519',
};

interface EarthAllianceCommunicationPanelProps {
  className?: string;
  endpoints?: string[];
}

export const EarthAllianceCommunicationPanel: React.FC<EarthAllianceCommunicationPanelProps> = ({
  className = '',
  endpoints,
}) => {
  const [showEmergencyControls, setShowEmergencyControls] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  // Merge custom endpoints with defaults
  const config = {
    ...DEFAULT_CONFIG,
    endpoints: endpoints ? [...endpoints, ...DEFAULT_CONFIG.endpoints] : DEFAULT_CONFIG.endpoints,
  };
  
  // Toggle emergency controls
  const toggleEmergencyControls = () => {
    setShowEmergencyControls(prev => !prev);
  };
  
  // Listen for emergency events from NostrService
  useEffect(() => {
    const handleEmergencyEvent = (event: CustomEvent<{ active: boolean, reason?: string }>) => {
      const { active, reason } = event.detail;
      setEmergencyMode(active);
      
      if (active && reason) {
        // Update UI with emergency information
        console.info('Emergency declared:', reason);
      } else if (!active) {
        // Update UI when emergency is resolved
        console.info('Emergency resolved');
      }
    };
    
    // Add event listener
    window.addEventListener('nostr-emergency', handleEmergencyEvent as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('nostr-emergency', handleEmergencyEvent as EventListener);
    };
  }, []);
  
  return (
    <CommunicationProvider config={config}>
      <div className={`${styles.panel} ${className} ${emergencyMode ? styles.emergencyModePanel : ''}`}>
        <div className={styles.panelHeader}>
          <h2>Earth Alliance Communication {emergencyMode && <span className={styles.emergencyIndicator}>EMERGENCY MODE</span>}</h2>
          <EmergencyControls 
            show={showEmergencyControls} 
            reason={emergencyReason}
            setReason={setEmergencyReason}
            onToggle={toggleEmergencyControls}
            isEmergencyMode={emergencyMode}
          />
        </div>
        
        <div className={styles.panelContent}>
          <ChannelSelector className={styles.channelSelector} />
          
          <div className={styles.messageArea}>
            <MessageDisplay className={styles.messageDisplay} />
            <MessageComposer className={styles.messageComposer} />
          </div>
        </div>
      </div>
    </CommunicationProvider>
  );
};

interface EmergencyControlsProps {
  show: boolean;
  reason: string;
  setReason: (reason: string) => void;
  onToggle: () => void;
  isEmergencyMode?: boolean;
}

const EmergencyControls: React.FC<EmergencyControlsProps> = ({
  show,
  reason,
  setReason,
  onToggle,
  isEmergencyMode: externalEmergencyMode,
}) => {
  const { 
    declareEmergency, 
    resolveEmergency,
    isEmergencyMode: contextEmergencyMode
  } = React.useContext(CommunicationContext);
  
  // Use external emergency mode if provided, otherwise use context value
  const isEmergencyMode = externalEmergencyMode !== undefined ? externalEmergencyMode : contextEmergencyMode;
  
  const handleDeclareEmergency = async () => {
    if (!reason.trim()) {
      return;
    }
    
    try {
      await declareEmergency(reason);
      setReason('');
      onToggle();
    } catch (error) {
      console.error('Failed to declare emergency:', error);
    }
  };
  
  const handleResolveEmergency = async () => {
    try {
      await resolveEmergency();
    } catch (error) {
      console.error('Failed to resolve emergency:', error);
    }
  };
  
  return (
    <div className={styles.emergencyControlsContainer}>
      <button 
        className={`${styles.emergencyButton} ${isEmergencyMode ? styles.resolveButton : ''}`}
        onClick={isEmergencyMode ? handleResolveEmergency : onToggle}
      >
        {isEmergencyMode ? 'RESOLVE EMERGENCY' : 'EMERGENCY'}
      </button>
      
      {show && !isEmergencyMode && (
        <div className={styles.emergencyForm}>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for emergency declaration"
            className={styles.emergencyInput}
          />
          <button 
            className={styles.declareButton}
            onClick={handleDeclareEmergency}
            disabled={!reason.trim()}
          >
            DECLARE
          </button>
        </div>
      )}
    </div>
  );
};
