import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import Modal from '../Shared/Modal';
import Snackbar from '../Shared/Snackbar';
import Tooltip from '../Shared/Tooltip';
import SessionExpiryCountdown from '../Shared/SessionExpiryCountdown';

interface WalletStatusProps {
  sessionWarningThreshold?: number;
}

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
    provider,
    setError, // Add setError to context destructure
  } = useAuth();

  const [currentNetwork, setCurrentNetwork] = React.useState<string>('');
  const [currentChainId, setCurrentChainId] = React.useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarType, setSnackbarType] = React.useState<'success' | 'info' | 'error'>('info');
  const [sessionExpiry, setSessionExpiry] = React.useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = React.useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = React.useState(false);
  const [showSwitchNetworkConfirm, setShowSwitchNetworkConfirm] = React.useState(false);
  const authButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (provider && provider.getNetwork) {
      provider.getNetwork().then((net) => {
        setCurrentNetwork(net.name || 'Unknown');
        setCurrentChainId(Number(net.chainId));
      });
    } else {
      setCurrentNetwork('');
      setCurrentChainId(null);
    }
  }, [provider]);

  React.useEffect(() => {
    if (connectionStatus === 'connected' && isAuthenticated && !isSessionValid()) {
      authButtonRef.current?.focus();
    }
  }, [connectionStatus, isAuthenticated, isSessionValid]);

  // Show snackbar on successful connect/auth/disconnect
  React.useEffect(() => {
    if (connectionStatus === 'connected' && isAuthenticated && !error) {
      setSnackbarMessage('Wallet connected!');
      setSnackbarType('success');
      setSnackbarOpen(true);
    }
  }, [connectionStatus, isAuthenticated, error]);

  // Show snackbar on error
  React.useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarType('error');
      setSnackbarOpen(true);
    }
  }, [error]);

  // Show snackbar on disconnect
  React.useEffect(() => {
    if (connectionStatus === 'idle' && !isAuthenticated) {
      setSnackbarMessage('Wallet disconnected.');
      setSnackbarType('info');
      setSnackbarOpen(true);
    }
  }, [connectionStatus, isAuthenticated]);

  // Show snackbar on successful authentication
  React.useEffect(() => {
    if (isAuthenticated && isSessionValid()) {
      setSnackbarMessage('Authenticated!');
      setSnackbarType('success');
      setSnackbarOpen(true);
    }
  }, [isAuthenticated, isSessionValid]);

  // Extract session expiry from localStorage
  React.useEffect(() => {
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
    <div className="wallet-status">
      <Snackbar
        message={snackbarMessage}
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        type={snackbarType}
      />
      {isLoading && <p>Loading...</p>}
      {connectionStatus === 'connecting' && <p>Connecting to wallet...</p>}
      {connectionStatus === 'connected' && isAuthenticated && (
        <div>
          <p>Connected: {address}</p>
          <p>Network: {expectedNetworkName} (chainId: {expectedChainId})</p>
          <Tooltip content="Disconnect your wallet from the app.">
            <button onClick={() => setShowDisconnectConfirm(true)}>Disconnect</button>
          </Tooltip>
          <Tooltip content="Switch to the expected network.">
            <button onClick={() => setShowSwitchNetworkConfirm(true)}>Switch Network</button>
          </Tooltip>
          {/* SIWE/localStorage session UI */}
          {isSessionValid() ? (
            <>
              <p>Session active (client-side, expires in localStorage)</p>
              {/* Always render countdown if expiry is set and session is valid */}
              {sessionExpiry && (
                <SessionExpiryCountdown
                  expiry={sessionExpiry}
                  onExpire={handleSessionExpire}
                  warningThreshold={sessionWarningThreshold}
                  onWarning={handleSessionWarning}
                />
              )}
            </>
          ) : (
            <>
              <p className="error">Session expired. Please re-authenticate.</p>
              <Tooltip content="Sign a message to authenticate your wallet.">
                <button
                  ref={authButtonRef}
                  onClick={handleAuthenticate}
                  aria-label="Authenticate (Sign-In with Ethereum)"
                >
                  Authenticate (Sign-In with Ethereum)
                </button>
              </Tooltip>
            </>
          )}
          {authError && <p className="error">Auth error: {authError}</p>}
        </div>
      )}
      {connectionStatus === 'idle' && !isAuthenticated && (
        <Tooltip content="Connect your wallet to start using the app.">
          <button
            className="wallet-connect-btn"
            onClick={handleConnect}
            aria-label="Connect Wallet"
          >
            Connect Wallet
          </button>
        </Tooltip>
      )}
      <Modal isOpen={showSessionWarning} onClose={() => setShowSessionWarning(false)} ariaLabel="Session Expiry Warning">
        <p>Your session is about to expire. Please re-authenticate to stay connected.</p>
        <div className="modal-actions">
          <button onClick={handleReauth}>Re-authenticate</button>
          <button onClick={() => setShowSessionWarning(false)}>Close</button>
        </div>
      </Modal>
      <Modal isOpen={showDisconnectConfirm} onClose={() => setShowDisconnectConfirm(false)} ariaLabel="Disconnect Wallet Confirmation">
        <p>Are you sure you want to disconnect your wallet?</p>
        <div className="modal-actions">
          <button onClick={handleDisconnectConfirm}>Yes, disconnect</button>
          <button onClick={() => setShowDisconnectConfirm(false)}>Cancel</button>
        </div>
      </Modal>
      <Modal isOpen={showSwitchNetworkConfirm} onClose={() => setShowSwitchNetworkConfirm(false)} ariaLabel="Switch Network Confirmation">
        <p>Are you sure you want to switch to the expected network?</p>
        <div className="modal-actions">
          <button onClick={handleSwitchNetworkConfirm}>Yes, switch</button>
          <button onClick={() => setShowSwitchNetworkConfirm(false)}>Cancel</button>
        </div>
      </Modal>
      {/* Error Modal: open if error exists */}
      {error && (
        <Modal isOpen={true} onClose={() => setError(null)} ariaLabel="Wallet Error Dialog">
          <p>
            {error.toLowerCase().includes('network')
              ? `Network error: ${error}`
              : `Error: ${error}`}
          </p>
          <div className="modal-actions">
            {error.toLowerCase().includes('network') && (
              <button onClick={async () => { await switchNetwork(); setError(null); }}>Switch Network</button>
            )}
            <button onClick={async () => { await connectWallet(); setError(null); }}>Retry</button>
            <button onClick={() => setError(null)} aria-label="Close Modal" data-testid="modal-close">Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WalletStatus;