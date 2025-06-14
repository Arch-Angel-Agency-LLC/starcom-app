import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

const WalletStatus: React.FC = () => {
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
  } = useAuth();

  const authButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (connectionStatus === 'connected' && isAuthenticated && !isSessionValid()) {
      authButtonRef.current?.focus();
    }
  }, [connectionStatus, isAuthenticated, isSessionValid]);

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

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork(1); // Example: Switch to Ethereum Mainnet
    } catch (err) {
      console.error('Error switching network:', err);
    }
  };

  const handleAuthenticate = async () => {
    try {
      await authenticate();
    } catch (err) {
      console.error('Error authenticating:', err);
    }
  };

  return (
    <div className="wallet-status">
      {isLoading && <p>Loading...</p>}
      {error && (
        <div className="error">
          <p>Error: {error}</p>
          {connectionStatus === 'error' && (
            <button onClick={handleConnect}>Retry</button>
          )}
        </div>
      )}
      {connectionStatus === 'connecting' && <p>Connecting to wallet...</p>}
      {connectionStatus === 'connected' && isAuthenticated && (
        <div>
          <p>Connected: {address}</p>
          <button onClick={handleDisconnect}>Disconnect</button>
          <button onClick={handleSwitchNetwork}>Switch Network</button>
          {/* SIWE/localStorage session UI */}
          {isSessionValid() ? (
            <p>Session active (client-side, expires in localStorage)</p>
          ) : (
            <>
              <p className="error">Session expired. Please re-authenticate.</p>
              <button
                ref={authButtonRef}
                onClick={handleAuthenticate}
                aria-label="Authenticate (Sign-In with Ethereum)"
              >
                Authenticate (Sign-In with Ethereum)
              </button>
            </>
          )}
          {authError && <p className="error">Auth error: {authError}</p>}
        </div>
      )}
      {connectionStatus === 'idle' && !isAuthenticated && (
        // Custom wallet connect button replaces RainbowKit ConnectButton
        <button
          className="wallet-connect-btn"
          onClick={handleConnect}
          aria-label="Connect Wallet"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletStatus;