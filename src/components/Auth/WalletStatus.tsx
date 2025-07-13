import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../Shared/Modal';
import Snackbar from '../Shared/Snackbar';
import Tooltip from '../Shared/Tooltip';
import SessionExpiryCountdown from '../Shared/SessionExpiryCountdown';
import styles from './WalletStatus.module.css';

interface WalletStatusProps {
  sessionWarningThreshold?: number;
}

// TODO: Implement collision detection for 3D objects and user interactions - PRIORITY: MEDIUM
const WalletStatus: React.FC<WalletStatusProps> = ({ sessionWarningThreshold = 5 }) => {
  const {
    isAuthenticated,
    address,
    isLoading,
    error,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    authenticate,
    logout,
    isSessionValid,
    authError,
    expectedChainId,
    expectedNetworkName,
    setError, // Add setError to context destructure
  } = useAuth();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'info' | 'error'>('info');
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showSwitchNetworkConfirm, setShowSwitchNetworkConfirm] = useState(false);
  const authButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (connectionStatus === 'connected' && isAuthenticated && !isSessionValid) {
      authButtonRef.current?.focus();
    }
  }, [connectionStatus, isAuthenticated, isSessionValid]);

  // Show snackbar on successful connect/auth/disconnect
  useEffect(() => {
    if (connectionStatus === 'connected' && isAuthenticated && !error) {
      setSnackbarMessage('Wallet connected!');
      setSnackbarType('success');
      setSnackbarOpen(true);
    }
  }, [connectionStatus, isAuthenticated, error]);

  // Show snackbar on error
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarType('error');
      setSnackbarOpen(true);
    }
  }, [error]);

  // Show snackbar on disconnect
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !isAuthenticated) {
      setSnackbarMessage('Wallet disconnected.');
      setSnackbarType('info');
      setSnackbarOpen(true);
    }
  }, [connectionStatus, isAuthenticated]);

  // Show snackbar on successful authentication
  useEffect(() => {
    if (isAuthenticated && isSessionValid) {
      setSnackbarMessage('Authenticated!');
      setSnackbarType('success');
      setSnackbarOpen(true);
    }
  }, [isAuthenticated, isSessionValid]);

  // Extract session expiry from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      if (auth.expiry) setSessionExpiry(auth.expiry);
    } else {
      setSessionExpiry(null);
    }
  }, [isAuthenticated]);

  // Show warning modal when session is about to expire
  const handleSessionWarning = () => {
    setShowSessionWarning(true);
  };
  const handleSessionExpire = () => {
    setShowSessionWarning(true);
  };
  const handleReauth = async () => {
    setShowSessionWarning(false);
    await handleAuthenticate();
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error('Error connecting wallet:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      logout();
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
    }
  };

  const handleAuthenticate = async () => {
    try {
      await authenticate();
    } catch (err) {
      console.error('Error authenticating:', err);
    }
  };

  const handleDisconnectConfirm = async () => {
    setShowDisconnectConfirm(false);
    await handleDisconnect();
  };
  const handleSwitchNetworkConfirm = async () => {
    setShowSwitchNetworkConfirm(false);
    await switchNetwork();
  };

  return (
    <div className={styles.walletStatusModal}>
      <div className={styles.headerSection}>
        <div className={styles.titleBar}>
          <h2 className={styles.title}>🛡️ STARCOM WALLET STATUS</h2>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${isAuthenticated ? styles.connected : styles.disconnected}`}></div>
            <span className={styles.statusText}>
              {isAuthenticated ? 'AUTHENTICATED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>

      <Snackbar
        message={snackbarMessage}
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        type={snackbarType}
      />

      {isLoading && (
        <div className={styles.loadingSection}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>INITIALIZING SECURE CONNECTION...</p>
        </div>
      )}

      {connectionStatus === 'connecting' && (
        <div className={styles.connectingSection}>
          <div className={styles.scanLine}></div>
          <p className={styles.connectingText}>🔗 ESTABLISHING WALLET LINK...</p>
        </div>
      )}

      {connectionStatus === 'connected' && isAuthenticated && (
        <div className={styles.authenticatedSection}>
          <div className={styles.walletInfo}>
            <div className={styles.addressBlock}>
              <label className={styles.label}>WALLET ADDRESS:</label>
              <div className={styles.addressDisplay}>
                <code className={styles.address}>{address}</code>
                <button 
                  className={styles.copyBtn}
                  onClick={() => navigator.clipboard?.writeText(address || '')}
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </div>

            <div className={styles.networkInfo}>
              <label className={styles.label}>NETWORK:</label>
              <div className={styles.networkDisplay}>
                <span className={styles.networkName}>{expectedNetworkName}</span>
                <span className={styles.chainId}>Chain ID: {expectedChainId}</span>
              </div>
            </div>
          </div>

          <div className={styles.actionGrid}>
            <Tooltip content="Securely disconnect from Starcom Command">
              <button 
                className={`${styles.actionBtn} ${styles.disconnectBtn}`}
                onClick={() => setShowDisconnectConfirm(true)}
              >
                <span className={styles.btnIcon}>🔓</span>
                DISCONNECT
              </button>
            </Tooltip>
            
            <Tooltip content="Switch to required network">
              <button 
                className={`${styles.actionBtn} ${styles.networkBtn}`}
                onClick={() => setShowSwitchNetworkConfirm(true)}
              >
                <span className={styles.btnIcon}>🌐</span>
                SWITCH NETWORK
              </button>
            </Tooltip>
          </div>

          {/* Session Status */}
          <div className={styles.sessionSection}>
            {isSessionValid ? (
              <div className={styles.sessionActive}>
                <div className={styles.sessionHeader}>
                  <span className={styles.sessionIcon}>✅</span>
                  <span className={styles.sessionTitle}>SECURE SESSION ACTIVE</span>
                </div>
                {sessionExpiry && (
                  <div className={styles.countdownWrapper}>
                    <SessionExpiryCountdown
                      expiry={sessionExpiry}
                      onExpire={handleSessionExpire}
                      warningThreshold={sessionWarningThreshold}
                      onWarning={handleSessionWarning}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.sessionExpired}>
                <div className={styles.sessionHeader}>
                  <span className={styles.sessionIcon}>⚠️</span>
                  <span className={styles.sessionTitle}>SESSION EXPIRED</span>
                </div>
                <p className={styles.expiredMessage}>Authentication required for secure access</p>
                <Tooltip content="Sign message to verify wallet ownership">
                  <button
                    ref={authButtonRef}
                    className={`${styles.actionBtn} ${styles.authBtn}`}
                    onClick={handleAuthenticate}
                    aria-label="Authenticate with Starcom"
                  >
                    <span className={styles.btnIcon}>🔐</span>
                    AUTHENTICATE
                  </button>
                </Tooltip>
              </div>
            )}
          </div>

          {authError && (
            <div className={styles.errorSection}>
              <span className={styles.errorIcon}>❌</span>
              <span className={styles.errorText}>{authError}</span>
            </div>
          )}
        </div>
      )}

      {connectionStatus === 'disconnected' && !isAuthenticated && (
        <div className={styles.idleSection}>
          <div className={styles.connectPrompt}>
            <div className={styles.promptIcon}>🚀</div>
            <h3 className={styles.promptTitle}>CONNECT TO STARCOM NETWORK</h3>
            <p className={styles.promptMessage}>
              Establish secure connection to access Starcom Command systems
            </p>
            <Tooltip content="Initialize wallet connection to Starcom">
              <button
                className={`${styles.actionBtn} ${styles.connectBtn}`}
                onClick={handleConnect}
                aria-label="Connect Wallet to Starcom"
              >
                <span className={styles.btnIcon}>🔗</span>
                CONNECT WALLET
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Enhanced Modals with Starcom Theme */}
      <Modal isOpen={showSessionWarning} onClose={() => setShowSessionWarning(false)} ariaLabel="Session Expiry Warning">
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <span className={styles.modalIcon}>⏰</span>
            <h3 className={styles.modalTitle}>SESSION EXPIRING</h3>
          </div>
          <p className={styles.modalMessage}>
            Your secure session will expire soon. Re-authenticate to maintain access to Starcom systems.
          </p>
          <div className={styles.modalActions}>
            <button className={`${styles.modalBtn} ${styles.primaryBtn}`} onClick={handleReauth}>
              RE-AUTHENTICATE
            </button>
            <button className={`${styles.modalBtn} ${styles.secondaryBtn}`} onClick={() => setShowSessionWarning(false)}>
              DISMISS
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDisconnectConfirm} onClose={() => setShowDisconnectConfirm(false)} ariaLabel="Disconnect Confirmation">
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <span className={styles.modalIcon}>🔓</span>
            <h3 className={styles.modalTitle}>DISCONNECT WALLET</h3>
          </div>
          <p className={styles.modalMessage}>
            Are you sure you want to disconnect from Starcom Command? You will lose access to secure features.
          </p>
          <div className={styles.modalActions}>
            <button className={`${styles.modalBtn} ${styles.dangerBtn}`} onClick={handleDisconnectConfirm}>
              YES, DISCONNECT
            </button>
            <button className={`${styles.modalBtn} ${styles.secondaryBtn}`} onClick={() => setShowDisconnectConfirm(false)}>
              CANCEL
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSwitchNetworkConfirm} onClose={() => setShowSwitchNetworkConfirm(false)} ariaLabel="Network Switch Confirmation">
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <span className={styles.modalIcon}>🌐</span>
            <h3 className={styles.modalTitle}>SWITCH NETWORK</h3>
          </div>
          <p className={styles.modalMessage}>
            Switch to {expectedNetworkName} network for optimal Starcom compatibility?
          </p>
          <div className={styles.modalActions}>
            <button className={`${styles.modalBtn} ${styles.primaryBtn}`} onClick={handleSwitchNetworkConfirm}>
              SWITCH NETWORK
            </button>
            <button className={`${styles.modalBtn} ${styles.secondaryBtn}`} onClick={() => setShowSwitchNetworkConfirm(false)}>
              CANCEL
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      {error && (
        <Modal isOpen={true} onClose={() => setError(null)} ariaLabel="Wallet Error">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <span className={styles.modalIcon}>⚠️</span>
              <h3 className={styles.modalTitle}>SYSTEM ERROR</h3>
            </div>
            <p className={styles.modalMessage}>
              {error.toLowerCase().includes('network')
                ? `Network error detected: ${error}`
                : `Error: ${error}`}
            </p>
            <div className={styles.modalActions}>
              {error.toLowerCase().includes('network') && (
                <button 
                  className={`${styles.modalBtn} ${styles.primaryBtn}`}
                  onClick={async () => { await switchNetwork(); setError(null); }}
                >
                  SWITCH NETWORK
                </button>
              )}
              <button 
                className={`${styles.modalBtn} ${styles.secondaryBtn}`}
                onClick={async () => { await connectWallet(); setError(null); }}
              >
                RETRY CONNECTION
              </button>
              <button 
                className={`${styles.modalBtn} ${styles.secondaryBtn}`}
                onClick={() => setError(null)} 
                aria-label="Close Error Modal" 
                data-testid="modal-close"
              >
                DISMISS
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WalletStatus;