import React, { useState, useEffect, useCallback } from 'react';
import { CommunicationProvider } from '../context/CommunicationProvider';
import { CommunicationContext } from '../context/CommunicationContext';
import { ChannelSelector } from './ChannelSelector';
import { MessageDisplay } from './MessageDisplay';
import { MessageComposer } from './MessageComposer';
import { ErrorBoundary } from '../ErrorBoundary';
import styles from './EarthAllianceCommunicationPanel.module.css';
import { logger } from '../../../utils';

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
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Merge custom endpoints with defaults
  const config = {
    ...DEFAULT_CONFIG,
    endpoints: endpoints ? [...endpoints, ...DEFAULT_CONFIG.endpoints] : DEFAULT_CONFIG.endpoints,
  };
  
  // Toggle emergency controls
  const toggleEmergencyControls = useCallback(() => {
    setShowEmergencyControls(prev => !prev);
  }, []);
  
  // Handle and clear errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Listen for emergency events from NostrService
  useEffect(() => {
    const handleEmergencyEvent = (event: CustomEvent<{ active: boolean, reason?: string }>) => {
      const { active, reason } = event.detail;
      setEmergencyMode(active);
      
      if (active && reason) {
        // Update UI with emergency information
        logger.info('Emergency declared:', reason);
      } else if (!active) {
        // Update UI when emergency is resolved
        logger.info('Emergency resolved');
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
    <ErrorBoundary fallback={<div className={styles.errorState}>Communication system is experiencing critical issues. Please try again later.</div>}>
      <CommunicationProvider config={config}>
        <div className={`${styles.panel} ${className} ${emergencyMode ? styles.emergencyModePanel : ''} ${error ? styles.errorPanel : ''}`}>
          {error && (
            <div className={styles.errorMessage}>
              <span>{error}</span>
              <button onClick={clearError} className={styles.dismissButton}>Dismiss</button>
            </div>
          )}
          
          <div className={styles.panelHeader}>
            <h2>Earth Alliance Communication {emergencyMode && <span className={styles.emergencyIndicator}>EMERGENCY MODE</span>}</h2>
            <EmergencyControls 
              show={showEmergencyControls} 
              reason={emergencyReason}
              setReason={setEmergencyReason}
              onToggle={toggleEmergencyControls}
              isEmergencyMode={emergencyMode}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              setError={setError}
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
    </ErrorBoundary>
  );
};

interface EmergencyControlsProps {
  show: boolean;
  reason: string;
  setReason: (reason: string) => void;
  onToggle: () => void;
  isEmergencyMode?: boolean;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
}

const EmergencyControls: React.FC<EmergencyControlsProps> = ({
  show,
  reason,
  setReason,
  onToggle,
  isEmergencyMode: externalEmergencyMode,
  isProcessing,
  setIsProcessing,
  setError,
}) => {
  const { 
    declareEmergency, 
    resolveEmergency,
    isEmergencyMode: contextEmergencyMode
  } = React.useContext(CommunicationContext);
  
  // Use external emergency mode if provided, otherwise use context value
  const isEmergencyMode = externalEmergencyMode !== undefined ? externalEmergencyMode : contextEmergencyMode;
  
  const handleDeclareEmergency = async () => {
    if (!reason.trim() || isProcessing) {
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      await declareEmergency(reason);
      setReason('');
      onToggle();
    } catch (error) {
      logger.error('Failed to declare emergency:', error);
      setError(`Failed to declare emergency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleResolveEmergency = async () => {
    if (isProcessing) {
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      await resolveEmergency();
    } catch (error) {
      logger.error('Failed to resolve emergency:', error);
      setError(`Failed to resolve emergency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className={styles.emergencyControlsContainer}>
      <button 
        className={`${styles.emergencyButton} ${isEmergencyMode ? styles.resolveButton : ''} ${isProcessing ? styles.processingButton : ''}`}
        onClick={isEmergencyMode ? handleResolveEmergency : onToggle}
        disabled={isProcessing}
      >
        {isProcessing ? 
          (isEmergencyMode ? 'RESOLVING...' : 'PROCESSING...') : 
          (isEmergencyMode ? 'RESOLVE EMERGENCY' : 'EMERGENCY')}
      </button>
      
      {show && !isEmergencyMode && (
        <div className={styles.emergencyForm}>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for emergency declaration"
            className={styles.emergencyInput}
            disabled={isProcessing}
          />
          <button 
            className={`${styles.declareButton} ${isProcessing ? styles.processingButton : ''}`}
            onClick={handleDeclareEmergency}
            disabled={!reason.trim() || isProcessing}
          >
            {isProcessing ? 'DECLARING...' : 'DECLARE'}
          </button>
        </div>
      )}
    </div>
  );
};
