import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../Shared/Modal';
import Snackbar from '../Shared/Snackbar';
import SessionExpiryCountdown from '../Shared/SessionExpiryCountdown';
import styles from './WalletStatusMini.module.css';
import type { SIWSSession } from '../../hooks/useSIWS';

// AI-NOTE: Starcom command center wallet status for TopBar
// Professional security-focused interface for cyber analysts and intelligence operatives

interface WalletInfoModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  network: string;
  isAuthenticated: boolean;
  session: SIWSSession | null;
  sessionExpiry: number | null;
  onDisconnect: () => void;
  onSignIn: () => void;
  onSwitchNetwork?: () => void;
  isSigningIn: boolean;
  authError?: string;
  wrongNetwork?: boolean;
}

const WalletInfoModal: React.FC<WalletInfoModalProps> = ({ 
  open, 
  onClose, 
  address, 
  network, 
  isAuthenticated,
  session,
  sessionExpiry,
  onDisconnect,
  onSignIn,
  onSwitchNetwork,
  isSigningIn,
  authError,
  wrongNetwork
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle drag move
  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - (modalRef.current?.offsetWidth || 480);
      const maxY = window.innerHeight - (modalRef.current?.offsetHeight || 400);
      
      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  // Reset position when modal opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  return (
    <Modal isOpen={open} onClose={onClose} ariaLabel="Starcom Security Clearance Status">
      <div 
        ref={modalRef}
        className={styles.modalContent}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Dedicated drag handle */}
        <div 
          className={styles.dragHandle} 
          title="Drag to move window"
          onMouseDown={handleDragStart}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className={styles.dragIcon}>⋮⋮⋮</div>
          <span className={styles.dragText}>STARCOM DIAGNOSTICS</span>
          <div className={styles.dragIcon}>⋮⋮⋮</div>
        </div>
        
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon}>🛡️</div>
          <h3 className={styles.modalTitle}>STARCOM SECURITY STATUS</h3>
          <div className={styles.clearanceIndicator}>
            <div className={`${styles.statusDot} ${isAuthenticated ? styles.clearanceActive : styles.clearancePending}`}></div>
            <span className={styles.clearanceText}>
              {isAuthenticated ? 'CLEARANCE ACTIVE' : 'PENDING AUTH'}
            </span>
          </div>
        </div>

      <div className={styles.securityGrid}>
        <div className={styles.infoBlock}>
          <label className={styles.infoLabel}>AGENT ID:</label>
          <div className={styles.addressDisplay}>
            <code className={styles.agentAddress}>{address}</code>
            <button 
              className={styles.copyBtn}
              onClick={() => navigator.clipboard?.writeText(address)}
              title="Copy Agent ID"
            >
              📋
            </button>
          </div>
        </div>

        <div className={styles.infoBlock}>
          <label className={styles.infoLabel}>NETWORK:</label>
          <div className={styles.networkStatus}>
            <span className={styles.networkName}>{network}</span>
            {wrongNetwork && (
              <span className={styles.networkWarning}>⚠️ INCORRECT</span>
            )}
          </div>
        </div>

        <div className={styles.infoBlock}>
          <label className={styles.infoLabel}>AUTH STATUS:</label>
          <div className={styles.authStatus}>
            <span className={`${styles.authIndicator} ${isAuthenticated ? styles.authenticated : styles.notAuthenticated}`}>
              {isAuthenticated ? '✅ AUTHENTICATED' : '🔐 AUTHENTICATION REQUIRED'}
            </span>
          </div>
        </div>

        {session && sessionExpiry && (
          <div className={styles.infoBlock}>
            <label className={styles.infoLabel}>SESSION:</label>
            <div className={styles.sessionInfo}>
              <SessionExpiryCountdown
                expiry={sessionExpiry}
                onExpire={() => {}}
                warningThreshold={5}
                onWarning={() => {}}
              />
            </div>
          </div>
        )}
      </div>

      {authError && !isAuthenticated && (
        <div className={styles.errorSection}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorText}>{authError}</span>
        </div>
      )}

      <div className={styles.actionGrid}>
        {!isAuthenticated && (
          <button 
            onClick={onSignIn} 
            className={`${styles.actionBtn} ${styles.authBtn}`}
            disabled={isSigningIn}
          >
            <span className={styles.btnIcon}>🔐</span>
            {isSigningIn ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        )}
        
        {wrongNetwork && onSwitchNetwork && (
          <button 
            onClick={onSwitchNetwork}
            className={`${styles.actionBtn} ${styles.networkBtn}`}
          >
            <span className={styles.btnIcon}>🌐</span>
            SWITCH NETWORK
          </button>
        )}
        
        <button 
          onClick={onDisconnect} 
          className={`${styles.actionBtn} ${styles.disconnectBtn}`}
        >
          <span className={styles.btnIcon}>🔓</span>
          DISCONNECT
        </button>
        
        <button 
          onClick={onClose} 
          className={`${styles.actionBtn} ${styles.closeBtn}`}
        >
          <span className={styles.btnIcon}>✖️</span>
          CLOSE
        </button>
      </div>
    </div>
  </Modal>
);
};

const WalletStatusMini: React.FC = () => {
  const {
    isAuthenticated,
    address,
    expectedNetworkName,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    error,
    authError,
    session,
    isSigningIn,
    signIn,
    provider,
    forceReset,
  } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'info' | 'error'>('info');
  const [isManuallyConnecting, setIsManuallyConnecting] = useState(false);
  // Track wallet selection to provide immediate feedback
  const [walletSelectionVisible, setWalletSelectionVisible] = useState(false);
  // Track failed signing attempts to prevent infinite retries
  const signingFailureCount = useRef(0);
  // Track if we're in a stuck state that needs force reset
  const [showForceReset, setShowForceReset] = useState(false);
  // Track when we last performed a force reset to prevent spam
  const lastForceResetTime = useRef(0);
  
  /* Enhanced Retry Logic:
   * 1. First failure: Normal "Retry Sign In" 
   * 2. Second failure: "Force Reset & Retry" - disconnects wallet and resets auth state
   * 3. Third+ failure: "Fresh Start" - full application state reset
   * Includes 10-second cooldown between force resets to prevent spam
   */
  
  // Detect stuck states that require force reset
  useEffect(() => {
    // If we're connected but authentication keeps failing, and we have multiple failures
    if (connectionStatus === 'connected' && address && !isAuthenticated && 
        (error || authError) && signingFailureCount.current >= 2) {
      
      // Check if this looks like a stale session issue
      const isStaleSessionError = error?.includes('keyring') || error?.includes('signing') || 
                                  authError?.includes('keyring') || authError?.includes('signing');
      
      if (isStaleSessionError) {
        setShowForceReset(true);
      }
    } else {
      setShowForceReset(false);
    }
  }, [connectionStatus, address, isAuthenticated, error, authError]);

  // Monitor when wallet modal visibility changes
  useEffect(() => {
    // This effect will trigger when the wallet selection modal state changes
    // If we have a wallet selected but not connected, user just made a selection
    if (provider?.wallet && !provider?.connected && !provider?.connecting && connectionStatus === 'idle') {
      setWalletSelectionVisible(true);
      // Show immediate feedback that wallet was selected
      setSnackbarMessage('Wallet selected! Connecting...');
      setSnackbarType('info');
      setSnackbarOpen(true);
      
      // Clear this state after a short time
      const timeoutId = setTimeout(() => {
        setWalletSelectionVisible(false);
      }, 2000);
      return () => clearTimeout(timeoutId);
    } else {
      setWalletSelectionVisible(false);
    }
  }, [provider?.wallet, provider?.connected, provider?.connecting, connectionStatus]);

  // Extract session expiry from localStorage or session
  useEffect(() => {
    if (isAuthenticated && session) {
      setSessionExpiry(session.expiresAt);
    } else {
      setSessionExpiry(null);
    }
  }, [isAuthenticated, session]);

  // Reset the failure count when user disconnects
  useEffect(() => {
    if (!address) {
      signingFailureCount.current = 0; // Reset failure count on disconnect
    }
  }, [address]);

  // Clear manual connecting state when connection status changes
  useEffect(() => {
    if (connectionStatus !== 'idle') {
      setIsManuallyConnecting(false);
    }
  }, [connectionStatus]);

  // Show snackbar notifications
  useEffect(() => {
    if (connectionStatus === 'connected' && isAuthenticated && !error && !authError) {
      setSnackbarMessage('CLEARANCE ACTIVATED');
      setSnackbarType('success');
      setSnackbarOpen(true);
      // Clear manual connecting state on success
      setIsManuallyConnecting(false);
      // Reset failure count on successful authentication
      signingFailureCount.current = 0;
      setShowForceReset(false);
    }
  }, [connectionStatus, isAuthenticated, error, authError]);

  // Handle error notifications more carefully
  useEffect(() => {
    // Only show error if we're not in a normal transitional state
    if ((error || authError) && connectionStatus !== 'connecting' && !isSigningIn) {
      const errorMsg = error || authError;
      // Don't show "wallet not connected" errors during normal flow
      if (errorMsg && !errorMsg.toLowerCase().includes('wallet not connected') && !errorMsg.toLowerCase().includes('not connected')) {
        // Special handling for keyring/signing errors
        if (errorMsg.includes('keyring request') || errorMsg.includes('unknown error') || errorMsg.includes('signing error')) {
          signingFailureCount.current += 1;
          if (signingFailureCount.current >= 3) {
            setSnackbarMessage('Multiple signing failures detected. Fresh Start option available to reset authentication state.');
          } else if (signingFailureCount.current >= 2) {
            setSnackbarMessage('Persistent signing error detected. Click "Force Reset & Retry" to disconnect and reset authentication state.');
          } else {
            setSnackbarMessage('Wallet signing error detected. This may be due to wallet compatibility. Click "Retry Sign In" to try again.');
          }
          setSnackbarType('error');
          setSnackbarOpen(true);
        } else {
          setSnackbarMessage(errorMsg);
          setSnackbarType('error');
          setSnackbarOpen(true);
        }
      }
    }
  }, [error, authError, connectionStatus, isSigningIn]);

  const handleConnect = async () => {
    try {
      // Clear any previous errors immediately
      setSnackbarOpen(false);
      
      // Set manual connecting state for immediate feedback
      if (buttonState.className === 'default') {
        setIsManuallyConnecting(true);
      }
      
      // Handle different button states with specific actions
      switch (buttonState.className) {
        case 'connecting':
        case 'signing':
          // Already in progress, do nothing
          return;
          
        case 'restoreSession':
        case 'signIn':
          // Normal authentication attempts
          setSnackbarMessage('Initiating authentication...');
          setSnackbarType('info');
          setSnackbarOpen(true);
          await signIn();
          return;
          
        case 'authError':
          // Enhanced retry logic with escalation
          if (signingFailureCount.current >= 2) {
            // Check cooldown period (prevent force reset spam)
            const now = Date.now();
            const FORCE_RESET_COOLDOWN = 10000; // 10 seconds
            
            if (now - lastForceResetTime.current < FORCE_RESET_COOLDOWN) {
              setSnackbarMessage(`Please wait ${Math.ceil((FORCE_RESET_COOLDOWN - (now - lastForceResetTime.current)) / 1000)} seconds before force reset.`);
              setSnackbarType('info');
              setSnackbarOpen(true);
              return;
            }
            
            // After 2 failed attempts, escalate to force disconnect and reset
            setSnackbarMessage('Multiple authentication failures detected. Force disconnecting and resetting...');
            setSnackbarType('info');
            setSnackbarOpen(true);
            
            try {
              // Record force reset time
              lastForceResetTime.current = now;
              
              // Force disconnect first
              await disconnectWallet();
              
              // Wait for disconnect to complete
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Force reset authentication state
              await forceReset();
              
              // Reset our local state
              signingFailureCount.current = 0;
              setShowForceReset(false);
              
              // Show success message and guide user to reconnect
              setTimeout(() => {
                setSnackbarMessage('Authentication reset complete! Please connect your wallet again.');
                setSnackbarType('success');
                setSnackbarOpen(true);
              }, 1000);
              
            } catch (resetError) {
              console.error('Force reset during retry failed:', resetError);
              setSnackbarMessage('Reset failed. Please refresh the page to clear all state.');
              setSnackbarType('error');
              setSnackbarOpen(true);
            }
            return;
          } else {
            // Normal retry for first failure
            setSnackbarMessage('Retrying authentication...');
            setSnackbarType('info');
            setSnackbarOpen(true);
            await signIn();
            return;
          }
          
        case 'forceReset':
          // Force reset everything due to stuck state
          setSnackbarMessage('Resetting authentication state...');
          setSnackbarType('info');
          setSnackbarOpen(true);
          await forceReset();
          // Reset our local state too
          signingFailureCount.current = 0;
          setShowForceReset(false);
          // Show success message
          setTimeout(() => {
            setSnackbarMessage('Authentication state reset! You can now connect a wallet.');
            setSnackbarType('success');
            setSnackbarOpen(true);
          }, 1000);
          return;
          
        case 'error':
          // Connection error - retry full connection
          setSnackbarMessage('Retrying connection...');
          setSnackbarType('info');
          setSnackbarOpen(true);
          await connectWallet();
          break;
          
        case 'connected':
          // Already connected and authenticated - do nothing
          return;
          
        case 'default':
        default:
          // No wallet connected - start connection flow immediately
          setSnackbarMessage('Opening wallet selection...');
          setSnackbarType('info');
          setSnackbarOpen(true);
          await connectWallet();
          break;
      }
      
      // Clear manual connecting state
      setIsManuallyConnecting(false);
      
    } catch (error) {
      console.error('Wallet operation failed:', error);
      
      // Clear manual connecting state on error
      setIsManuallyConnecting(false);
      
      // Show contextual error message
      let errorMessage = 'Operation failed';
      if (buttonState.className === 'signIn' || buttonState.className === 'authError') {
        if (signingFailureCount.current >= 2) {
          errorMessage = 'Force reset and retry failed';
        } else {
          errorMessage = 'Authentication failed';
        }
      } else if (buttonState.className === 'restoreSession') {
        errorMessage = 'Session restoration failed';
      } else if (buttonState.className === 'forceReset') {
        errorMessage = 'Force reset failed';
      } else {
        errorMessage = 'Connection failed';
      }
      
      setSnackbarMessage(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarType('error');
      setSnackbarOpen(true);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setShowModal(false);
      setSnackbarMessage('CLEARANCE REVOKED');
      setSnackbarType('info');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
      setSnackbarMessage('NETWORK SWITCHED');
      setSnackbarType('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  // Enhanced connection detection with better edge case handling
  const isWalletConnected = (
    connectionStatus === 'connected' || 
    (!!address && connectionStatus !== 'error' && !error)
  );

  // Get consistent status indicator for all button states
  const getStatusIndicator = (buttonClass: string) => {
    switch (buttonClass) {
      case 'connected':
        return '🟢';
      case 'connecting':
      case 'signing':
        return '🟡';
      case 'error':
      case 'authError':
      case 'forceReset':
        return '🔴';
      case 'signIn':
      case 'restoreSession':
        return '🟡';
      case 'default':
      default:
        return '⚪';
    }
  };
  
  // Comprehensive button state management for all scenarios
  const getConnectButtonState = () => {
    // Override states with manual connecting if user just clicked
    if (isManuallyConnecting && connectionStatus === 'idle') {
      return { 
        label: 'Opening Wallet...', 
        disabled: true, 
        showSpinner: true, 
        className: 'connecting',
        icon: '⟳'
      };
    }
    
    // Show "Wallet Selected" state when user selected wallet but hasn't connected yet
    if (walletSelectionVisible && connectionStatus === 'idle' && !address) {
      return { 
        label: 'Wallet Selected...', 
        disabled: true, 
        showSpinner: true, 
        className: 'connecting',
        icon: '⟳'
      };
    }
    
    // Loading/Processing states
    if (connectionStatus === 'connecting') {
      return { 
        label: 'Connecting...', 
        disabled: true, 
        showSpinner: true, 
        className: 'connecting',
        icon: '⟳'
      };
    }
    
    if (isSigningIn) {
      return { 
        label: 'Signing In...', 
        disabled: true, 
        showSpinner: true, 
        className: 'signing',
        icon: '✍️'
      };
    }
    
    // Error states
    if (connectionStatus === 'error' || (error && !address)) {
      return { 
        label: 'Retry', 
        disabled: false, 
        showError: true, 
        className: 'error',
        icon: '⚠️'
      };
    }
    
    if (authError && address && !isAuthenticated) {
      // If we're in a stuck state, offer force reset option
      if (showForceReset) {
        return { 
          label: 'Reset', 
          disabled: false, 
          showError: true, 
          className: 'forceReset',
          icon: '🔄'
        };
      }
      
      // Show different retry messages based on failure count
      if (signingFailureCount.current >= 2) {
        return { 
          label: 'Reset & Retry', 
          disabled: false, 
          showError: true, 
          className: 'authError',
          icon: '🔄'
        };
      } else if (signingFailureCount.current >= 1) {
        return { 
          label: 'Retry', 
          disabled: false, 
          showError: true, 
          className: 'authError',
          icon: '🔐'
        };
      } else {
        return { 
          label: 'Retry', 
          disabled: false, 
          showError: true, 
          className: 'authError',
          icon: '🔐'
        };
      }
    }
    
    // Connected but not authenticated states
    if (address && !isAuthenticated && !isSigningIn) {
      // If we have a session but aren't authenticated, offer to restore
      if (session) {
        return { 
          label: 'Restore', 
          disabled: false, 
          showAuth: true, 
          className: 'restoreSession',
          icon: '🔄'
        };
      }
      
      // No existing session, need fresh sign-in
      return { 
        label: 'Sign In', 
        disabled: false, 
        showAuth: true, 
        className: 'signIn',
        icon: '🔐'
      };
    }
    
    // Wallet connected and authenticated (shouldn't show this button normally)
    if (isWalletConnected && isAuthenticated) {
      return { 
        label: 'Connected', 
        disabled: true, 
        showSuccess: true, 
        className: 'connected',
        icon: '✅'
      };
    }
    
    // Default: No wallet connected
    return { 
      label: 'Connect', 
      disabled: false, 
      showDefault: true, 
      className: 'default',
      icon: '🔗'
    };
  };
  
  const buttonState = getConnectButtonState();
  
  // Generate contextual tooltip for button state
  const getButtonTooltip = () => {
    switch (buttonState.className) {
      case 'connecting':
        return 'Establishing connection to wallet...';
      case 'signing':
        return 'Signing authentication message...';
      case 'error':
        return `Connection failed: ${error || 'Unknown error'}. Click to retry.`;
      case 'authError':
        return `Authentication failed: ${authError || 'Unknown error'}. Click to retry.`;
      case 'restoreSession':
        return 'Previous session found. Click to restore authentication.';
      case 'signIn':
        return 'Wallet connected. Click to authenticate and sign in.';
      case 'connected':
        return 'Wallet connected and authenticated successfully.';
      case 'default':
      default:
        return 'Connect your wallet to get started.';
    }
  };

  // Debug logging for connection issues
  useEffect(() => {
    console.log('WalletStatusMini Debug:', {
      connectionStatus,
      address: address ? `${address.slice(0, 8)}...` : null,
      isAuthenticated,
      error,
      authError,
      session: !!session,
      isWalletConnected,
      buttonState: buttonState.className,
      buttonLabel: buttonState.label,
      isSigningIn
    });
  }, [connectionStatus, address, isAuthenticated, error, authError, session, isWalletConnected, buttonState, isSigningIn]);
  const wrongNetwork = false; // TODO: Implement actual network validation

  // Show enhanced connect button for all non-authenticated states
  if (!isWalletConnected || !isAuthenticated) {
    return (
      <div className={styles.walletContainer}>
        <button 
          className={`${styles.connectBtn} ${styles[buttonState.className] || ''}`}
          onClick={handleConnect}
          disabled={buttonState.disabled}
          aria-label={`Wallet Connection - ${buttonState.label}`}
          title={getButtonTooltip()}
          data-state={buttonState.className}
        >
          {buttonState.showSpinner ? (
            <>
              <span className={`${styles.indicator} ${styles.connecting}`}>
                <span className={`${styles.spinner} ${styles.spinnerIcon}`}>⟳</span>
              </span>
              <span className={styles.buttonText}>{buttonState.label}</span>
            </>
          ) : (
            <>
              <span className={`${styles.indicator} ${styles[buttonState.className] || styles.default}`}>
                {getStatusIndicator(buttonState.className)}
              </span>
              <span className={styles.buttonText}>{buttonState.label}</span>
            </>
          )}
        </button>
        
        <Snackbar
          open={snackbarOpen}
          message={snackbarMessage}
          type={snackbarType}
          onClose={() => setSnackbarOpen(false)}
        />
      </div>
    );
  }

  // Only show the status button when fully connected AND authenticated
  return (
    <div className={styles.walletContainer}>
      <button
        className={`${styles.statusBtn} ${!isAuthenticated ? styles.unauthenticated : ''}`}
        onClick={() => setShowModal(true)}
        aria-label={`Agent ${isAuthenticated ? 'Authenticated' : 'Pending Auth'}: ${address?.slice(0, 6)}...${address?.slice(-4)}`}
        title={`Starcom Agent ${isAuthenticated ? 'Clearance Active' : 'Authentication Required'}: ${address}`}
      >
        <span className={`${styles.indicator} ${isAuthenticated ? styles.authenticated : styles.warning}`}>
          {isAuthenticated ? '🟢' : '🟡'}
        </span>
        <span className={styles.buttonText}>
          {isAuthenticated ? 'Connected' : `${address?.slice(0, 4)}...${address?.slice(-4)}`}
        </span>
        {!isAuthenticated && (
          <span className={styles.authIndicator} title="Authentication Required">
            🔐
          </span>
        )}
      </button>
      
      <WalletInfoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        address={address || ''}
        network={expectedNetworkName}
        isAuthenticated={isAuthenticated}
        session={session}
        sessionExpiry={sessionExpiry}
        onDisconnect={handleDisconnect}
        onSignIn={handleSignIn}
        onSwitchNetwork={handleSwitchNetwork}
        isSigningIn={isSigningIn}
        authError={authError || undefined}
        wrongNetwork={wrongNetwork}
      />
      
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        type={snackbarType}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
};

export default WalletStatusMini;
