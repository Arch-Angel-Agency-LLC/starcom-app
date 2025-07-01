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
  // TODO: Implement advanced lighting and shadow systems for realistic rendering - PRIORITY: LOW
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
    enableAutoAuth,
    autoAuthDisabled,
    authFailureCount,
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
  // Track if auto-reset countdown is active
  const [autoResetCountdown, setAutoResetCountdown] = useState(false);
  // Track persistent error states to detect quagmires
  const persistentErrorStartTime = useRef<number | null>(null);
  const consecutiveErrorCount = useRef(0);
  // Track if we're in a quagmire state requiring emergency reset
  const [inQuagmire, setInQuagmire] = useState(false);
  // Track manual signing state to prevent button state flashing
  const [isManualSigning, setIsManualSigning] = useState(false);
  // Track last sign-in attempt to prevent rapid state changes
  const lastSignInAttempt = useRef(0);
  
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

  // Monitor persistent error states and timeouts
  useEffect(() => {
    const currentTime = Date.now();
    const hasAuthError = !!(error || authError);
    const isInProblemState = connectionStatus === 'connected' && address && !isAuthenticated && hasAuthError;
    
    // Auto-reset manual signing state if it's been too long (30 seconds timeout)
    if (isManualSigning && lastSignInAttempt.current > 0) {
      const timeSinceLastAttempt = currentTime - lastSignInAttempt.current;
      if (timeSinceLastAttempt > 30000) { // 30 seconds
        console.warn('Manual signing state timeout - resetting');
        setIsManualSigning(false);
        lastSignInAttempt.current = 0;
      }
    }
    
    if (isInProblemState) {
      // Track start of persistent error state
      if (persistentErrorStartTime.current === null) {
        persistentErrorStartTime.current = currentTime;
        consecutiveErrorCount.current = 1;
      } else {
        consecutiveErrorCount.current += 1;
      }
      
      // Check for quagmire conditions:
      // 1. Same error state for more than 30 seconds
      // 2. More than 5 consecutive error cycles
      // 3. Specific JSON-RPC error patterns that indicate wallet state corruption
      const persistentDuration = currentTime - persistentErrorStartTime.current;
      const isLongStuck = persistentDuration > 30000; // 30 seconds
      const isTooManyErrors = consecutiveErrorCount.current > 5;
      const hasJSONRPCError = (error || authError || '').includes('JSON-RPC') || 
                             (error || authError || '').includes('Internal error') ||
                             (error || authError || '').includes('WalletSignMessageError');
      
      if ((isLongStuck || isTooManyErrors || hasJSONRPCError) && !inQuagmire) {
        console.warn('🚨 QUAGMIRE DETECTED: User stuck in persistent auth error state', {
          duration: persistentDuration,
          errorCount: consecutiveErrorCount.current,
          error: error || authError,
          retryCount: signingFailureCount.current
        });
        setInQuagmire(true);
      }
    } else {
      // Reset tracking when not in problem state
      if (persistentErrorStartTime.current !== null) {
        persistentErrorStartTime.current = null;
        consecutiveErrorCount.current = 0;
        setInQuagmire(false);
      }
    }
  }, [connectionStatus, address, isAuthenticated, error, authError, inQuagmire, isManualSigning]);

  // Monitor when wallet modal visibility changes
  useEffect(() => {
    // This effect will trigger when the wallet selection modal state changes
    // If we have a wallet selected but not connected, user just made a selection
    if (provider?.wallet && !provider?.connected && !provider?.connecting && connectionStatus === 'disconnected') {
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
      // Also reset quagmire tracking
      persistentErrorStartTime.current = null;
      consecutiveErrorCount.current = 0;
      setInQuagmire(false);
      setIsManualSigning(false); // Reset manual signing state
      lastSignInAttempt.current = 0;
    }
  }, [address]);

  // Check for stale localStorage data that might cause auth issues
  useEffect(() => {
    // Only run this check once on component mount
    const checkForStaleData = () => {
      try {
        const potentiallyStaleKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('walletName') || key.includes('session') || key.includes('auth'))) {
            const value = localStorage.getItem(key);
            // Check if the stored data looks corrupted or very old
            if (value) {
              try {
                const parsed = JSON.parse(value);
                // If it's a session/auth object with timestamp, check if it's old (> 24 hours)
                if (parsed.timestamp && Date.now() - parsed.timestamp > 86400000) {
                  potentiallyStaleKeys.push(key);
                }
              } catch {
                // If JSON parsing fails, data might be corrupted
                potentiallyStaleKeys.push(key);
              }
            }
          }
        }
        
        if (potentiallyStaleKeys.length > 0) {
          console.warn('🧹 Detected potentially stale localStorage data:', potentiallyStaleKeys);
          // Don't auto-remove here, but flag for emergency reset if user gets stuck
        }
      } catch (error) {
        console.warn('Error checking localStorage for stale data:', error);
      }
    };
    
    checkForStaleData();
  }, []); // Only run once on mount

  // Clear manual connecting state when connection status changes
  useEffect(() => {
    if (connectionStatus !== 'disconnected') {
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
        
        // EMERGENCY QUAGMIRE HANDLING: If user is stuck, offer immediate escape
        if (inQuagmire) {
          setSnackbarMessage('🚨 STUCK STATE DETECTED! Emergency reset available. This will completely clear wallet connection and start fresh.');
          setSnackbarType('error');
          setSnackbarOpen(true);
          return; // Skip normal error handling when in quagmire
        }
        
        // Special handling for keyring/signing errors
        if (errorMsg.includes('keyring request') || errorMsg.includes('unknown error') || errorMsg.includes('signing error') || errorMsg.includes('Internal JSON-RPC error') || errorMsg.includes('WalletSignMessageError')) {
          signingFailureCount.current += 1;
          if (signingFailureCount.current >= 3) {
            setSnackbarMessage('3 retry attempts failed. Auto-reset will occur in 5 seconds, or click the button to reset now.');
            setSnackbarType('error');
            setSnackbarOpen(true);
            // Set countdown state to prevent button state changes
            setAutoResetCountdown(true);
            // Delay auto-reset to give user time to see the button state
            setTimeout(async () => {
              // Only auto-reset if user hasn't manually clicked the button
              if (signingFailureCount.current >= 3 && autoResetCountdown) {
                try {
                  await disconnectWallet();
                  await forceReset();
                  signingFailureCount.current = 0;
                  setShowForceReset(false);
                  setAutoResetCountdown(false);
                  setSnackbarMessage('Authentication automatically reset. You can now connect your wallet again.');
                  setSnackbarType('success');
                  setSnackbarOpen(true);
                } catch (resetError) {
                  console.error('Auto-reset after 3 failures failed:', resetError);
                  setAutoResetCountdown(false);
                }
              }
            }, 5000); // Increased from 2000ms to 5000ms
          } else if (signingFailureCount.current >= 2) {
            setSnackbarMessage('Persistent signing error detected. Click "Reset & Retry" to disconnect and reset authentication state.');
          } else {
            setSnackbarMessage('Wallet signing error detected. This may be due to wallet compatibility. Click "Retry" to try again.');
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
  }, [error, authError, connectionStatus, isSigningIn, disconnectWallet, forceReset, autoResetCountdown, inQuagmire]);

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
          
        case 'emergencyReset':
          // EMERGENCY QUAGMIRE ESCAPE: Nuclear option for completely stuck users
          setSnackbarMessage('🚨 EMERGENCY RESET: Performing complete wallet state cleanup...');
          setSnackbarType('error');
          setSnackbarOpen(true);
          
          try {
            // Step 1: Force disconnect wallet
            await disconnectWallet();
            
            // Step 2: Clear all local storage related to wallet/auth
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('wallet') || key.includes('auth') || key.includes('session') || key.includes('solana'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Step 3: Force reset auth system
            await forceReset();
            
            // Step 4: Reset all local state variables
            signingFailureCount.current = 0;
            consecutiveErrorCount.current = 0;
            persistentErrorStartTime.current = null;
            setShowForceReset(false);
            setAutoResetCountdown(false);
            setInQuagmire(false);
            
            // Step 5: Clear any residual connection state
            setIsManuallyConnecting(false);
            setWalletSelectionVisible(false);
            
            // Give user feedback about what happened
            setTimeout(() => {
              setSnackbarMessage('🟢 EMERGENCY RESET COMPLETE! All wallet state cleared. Page will refresh in 3 seconds to ensure clean start.');
              setSnackbarType('success');
              setSnackbarOpen(true);
              
              // Force page refresh after emergency reset to ensure completely clean state
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            }, 1000);
            
          } catch (emergencyError) {
            console.error('Emergency reset failed:', emergencyError);
            setSnackbarMessage('🚨 Emergency reset failed. Please manually refresh the page (F5) to clear all state.');
            setSnackbarType('error');
            setSnackbarOpen(true);
          }
          return;
          
        case 'restoreSession':
        case 'signIn':
          // Enhanced authentication attempts with stable state management
          setIsManualSigning(true);
          lastSignInAttempt.current = Date.now();
          
          // Re-enable auto-auth if it was disabled (user is manually trying again)
          if (autoAuthDisabled) {
            enableAutoAuth();
            setSnackbarMessage('Re-enabling auto-authentication and attempting manual sign-in...');
          } else {
            setSnackbarMessage('Initiating authentication...');
          }
          setSnackbarType('info');
          setSnackbarOpen(true);
          
          try {
            await signIn();
          } catch (signInError) {
            // Enhanced error handling for different types of JSON-RPC errors
            const errorMessage = signInError instanceof Error ? signInError.message : 'Unknown error';
            signingFailureCount.current += 1;
            
            // Categorize the error type for better handling
            if (errorMessage.includes('JSON-RPC') || errorMessage.includes('Internal error')) {
              console.warn('🚨 JSON-RPC Error detected:', errorMessage);
              setSnackbarMessage('Wallet communication error. This usually resolves on retry.');
              setSnackbarType('error');
              setSnackbarOpen(true);
            } else if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
              console.log('User cancelled authentication');
              setSnackbarMessage('Authentication cancelled by user.');
              setSnackbarType('info');
              setSnackbarOpen(true);
              // Don't count user cancellation as a failure
              signingFailureCount.current = Math.max(0, signingFailureCount.current - 1);
            } else {
              console.error('Authentication failed:', errorMessage);
              setSnackbarMessage(`Authentication failed: ${errorMessage}`);
              setSnackbarType('error');
              setSnackbarOpen(true);
            }
            
            throw signInError; // Re-throw to be handled by outer catch
          } finally {
            setIsManualSigning(false);
          }
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
            
            // After 2+ failed attempts, force disconnect and reset
            setSnackbarMessage('Force disconnecting and resetting authentication state...');
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
                setSnackbarMessage('Authentication reset complete! Click Connect to try again.');
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
            // Enhanced retry logic for first 1-2 failures with JSON-RPC awareness
            setIsManualSigning(true);
            lastSignInAttempt.current = Date.now();
            
            setSnackbarMessage('Retrying authentication...');
            setSnackbarType('info');
            setSnackbarOpen(true);
            
            try {
              await signIn();
            } catch (retryError) {
              // Handle retry failure
              const errorMessage = retryError instanceof Error ? retryError.message : 'Unknown error';
              signingFailureCount.current += 1;
              
              if (errorMessage.includes('JSON-RPC') || errorMessage.includes('Internal error')) {
                console.warn('🚨 JSON-RPC Error on retry:', errorMessage);
                setSnackbarMessage('Persistent wallet communication error. Try "Reset & Retry" next.');
                setSnackbarType('error');
                setSnackbarOpen(true);
              } else if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
                console.log('User cancelled authentication on retry');
                setSnackbarMessage('Authentication cancelled by user.');
                setSnackbarType('info');
                setSnackbarOpen(true);
                // Don't count user cancellation as a failure
                signingFailureCount.current = Math.max(0, signingFailureCount.current - 1);
              } else {
                console.error('Retry authentication failed:', errorMessage);
                setSnackbarMessage(`Retry failed: ${errorMessage}`);
                setSnackbarType('error');
                setSnackbarOpen(true);
              }
              
              throw retryError;
            } finally {
              setIsManualSigning(false);
            }
            return;
          }
          
        case 'forceReset':
          // Handle 3rd strike - manual reset or auto-reset after delay
          setSnackbarMessage('Performing final reset after 3 authentication failures...');
          setSnackbarType('info');
          setSnackbarOpen(true);
          // Clear countdown state since user manually clicked
          setAutoResetCountdown(false);
          
          try {
            // Force complete disconnect and reset
            await disconnectWallet();
            await forceReset();
            
            // Reset all local state
            signingFailureCount.current = 0;
            setShowForceReset(false);
            
            // Show completion message
            setTimeout(() => {
              setSnackbarMessage('All authentication state cleared. Click Connect to start fresh.');
              setSnackbarType('success');
              setSnackbarOpen(true);
            }, 1000);
            
          } catch (resetError) {
            console.error('Final reset failed:', resetError);
            setSnackbarMessage('Reset failed. Please refresh the page to clear all state.');
            setSnackbarType('error');
            setSnackbarOpen(true);
          }
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
          // Special handling for 3-strike reset scenario
          if (signingFailureCount.current >= 3 && (address || connectionStatus === 'connected')) {
            // We're in a 3-strike reset scenario but still have connection remnants
            setSnackbarMessage('Performing final cleanup after 3 retry attempts...');
            setSnackbarType('info');
            setSnackbarOpen(true);
            
            try {
              // Force complete disconnect and reset
              await disconnectWallet();
              await forceReset();
              
              // Reset all local state
              signingFailureCount.current = 0;
              setShowForceReset(false);
              
              // Clear any manual connecting state
              setIsManuallyConnecting(false);
              
              // Wait a moment then show ready message
              setTimeout(() => {
                setSnackbarMessage('All authentication state cleared. Ready for fresh connection.');
                setSnackbarType('success');
                setSnackbarOpen(true);
              }, 1000);
              
            } catch (error) {
              console.error('Final cleanup after 3-strike reset failed:', error);
              setSnackbarMessage('Cleanup failed. Please refresh the page.');
              setSnackbarType('error');
              setSnackbarOpen(true);
            }
            return;
          }
          
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
    (!!address && connectionStatus !== 'disconnected' && !error)
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
      case 'emergencyReset':
        return '🚨';
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
    if (isManuallyConnecting && connectionStatus === 'disconnected') {
      return { 
        label: 'Opening Wallet...', 
        disabled: true, 
        showSpinner: true, 
        className: 'connecting',
        icon: '⟳'
      };
    }
    
    // Show "Wallet Selected" state when user selected wallet but hasn't connected yet
    if (walletSelectionVisible && connectionStatus === 'disconnected' && !address) {
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
    
    if (isSigningIn || isManualSigning) {
      // Prevent state flashing by maintaining signing state
      const timeSinceLastAttempt = Date.now() - lastSignInAttempt.current;
      const isRecentSignAttempt = timeSinceLastAttempt < 10000; // 10 seconds
      
      return { 
        label: isRecentSignAttempt ? 'Signing In...' : 'Processing...',
        disabled: true, 
        showSpinner: true, 
        className: 'signing',
        icon: '✍️'
      };
    }
    
    // Error states
    if (connectionStatus === 'disconnected' || (error && !address)) {
      return { 
        label: 'Retry', 
        disabled: false, 
        showError: true, 
        className: 'error',
        icon: '⚠️'
      };
    }
    
    if (authError && address && !isAuthenticated) {
      // EMERGENCY QUAGMIRE STATE: User is completely stuck
      if (inQuagmire) {
        return { 
          label: 'Emergency Reset', 
          disabled: false, 
          showError: true, 
          className: 'emergencyReset',
          icon: '🚨'
        };
      }
      
      // Show different retry messages based on failure count
      if (signingFailureCount.current >= 3) {
        return { 
          label: 'Auto-Reset', 
          disabled: false, 
          showError: true, 
          className: 'forceReset',
          icon: '🔄'
        };
      } else if (signingFailureCount.current >= 2) {
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
      // Special handling when auto-auth is disabled due to JSON-RPC errors
      if (autoAuthDisabled) {
        return { 
          label: 'Manual Sign In Required', 
          disabled: false, 
          showError: true, 
          className: 'authError',
          icon: '🔐'
        };
      }
      
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
    const retryCount = signingFailureCount.current;
    
    switch (buttonState.className) {
      case 'connecting':
        return 'Establishing connection to wallet...';
      case 'signing':
        return 'Signing authentication message...';
      case 'error':
        return `Connection failed: ${error || 'Unknown error'}. Click to retry.`;
      case 'authError':
        if (autoAuthDisabled) {
          return `Auto-authentication disabled due to ${authFailureCount} JSON-RPC failures. Click to sign in manually and reset auto-auth.`;
        } else if (retryCount >= 3) {
          return `3+ authentication failures detected. Click to manually reset now (auto-reset in progress).`;
        } else if (retryCount >= 2) {
          return `Authentication failed ${retryCount} times. Click to force reset and try again. JSON-RPC errors usually resolve after reset.`;
        } else {
          const errorMsg = authError || 'Unknown error';
          if (errorMsg.includes('JSON-RPC') || errorMsg.includes('Internal error')) {
            return `JSON-RPC communication error detected. This is usually temporary - click to retry. If it persists, try "Reset & Retry".`;
          } else {
            return `Authentication failed: ${errorMsg}. Click to retry.`;
          }
        }
      case 'emergencyReset':
        return '🚨 EMERGENCY RESET: Complete wallet state reset. JSON-RPC errors usually resolve after this.';
      case 'forceReset':
        return 'Click to perform final reset after 3+ failures and return to Connect state.';
      case 'restoreSession':
        return 'Previous session found. Click to restore authentication.';
      case 'signIn':
        return 'Wallet connected. Click to authenticate and sign in.';
      case 'connected':
        return 'Wallet connected and authenticated successfully.';
      case 'default':
      default:
        if (retryCount >= 3) {
          return 'After 3+ retry attempts, returned to fresh state. Click to connect wallet.';
        } else {
          return 'Connect your wallet to get started.';
        }
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
      isSigningIn,
      isManualSigning,
      retryCount: signingFailureCount.current, // Added retry count tracking
      showForceReset,
      autoResetCountdown,
      inQuagmire,
      consecutiveErrors: consecutiveErrorCount.current,
      persistentErrorDuration: persistentErrorStartTime.current ? Date.now() - persistentErrorStartTime.current : 0,
      timeSinceLastSignAttempt: lastSignInAttempt.current ? Date.now() - lastSignInAttempt.current : 0,
      // Auto-auth state
      autoAuthDisabled,
      authFailureCount
    });
  }, [connectionStatus, address, isAuthenticated, error, authError, session, isWalletConnected, buttonState, isSigningIn, isManualSigning, showForceReset, autoResetCountdown, inQuagmire, autoAuthDisabled, authFailureCount]);
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
