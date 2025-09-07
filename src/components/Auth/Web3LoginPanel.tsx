import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Snackbar from '../Shared/Snackbar';
import Modal from '../Shared/Modal';
import { debugLogger, DebugCategory } from '../../utils/debugLogger';
// Storage status chip removed as pinning UI is no longer needed

// Component loading debug
debugLogger.info(DebugCategory.COMPONENT_LOAD, 'Web3LoginPanel.tsx loaded - will monitor wallet connection calls');

const AccountInfoPopup: React.FC<{
  open: boolean;
  onClose: () => void;
  address: string;
  network: string;
  onSwitchNetwork?: () => void;
  wrongNetwork?: boolean;
  lastLoginCid?: string | null;
}> = ({ open, onClose, address, network, onSwitchNetwork, wrongNetwork, lastLoginCid }) => (
  <Modal isOpen={open} onClose={onClose} ariaLabel="Account Info">
    <div style={{ padding: 24, minWidth: 320 }}>
      <h2>Account Info</h2>
      <div><b>Address:</b> {address}</div>
      <div><b>Network:</b> {network}</div>
      {lastLoginCid && (
        <div style={{ marginTop: 8 }}>
          <b>Last Login CID:</b>{' '}
          <a href={`https://ipfs.io/ipfs/${lastLoginCid}`} target="_blank" rel="noreferrer">{lastLoginCid.slice(0, 10)}…</a>
        </div>
      )}
      {wrongNetwork && onSwitchNetwork && (
        <button onClick={onSwitchNetwork} style={{ marginTop: 16 }}>Switch Network</button>
      )}
      <button onClick={onClose} style={{ marginTop: 16 }}>Close</button>
    </div>
  </Modal>
);

// TODO: Add comprehensive search and filtering across all investigation data - PRIORITY: HIGH
const Web3LoginPanel: React.FC = () => {
  const {
    isAuthenticated,
    address,
    expectedNetworkName,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useAuth();
  
  // Debug: Log Web3LoginPanel state
  debugLogger.debug(DebugCategory.AUTH, 'Web3LoginPanel rendered with state', {
    isAuthenticated,
    address: !!address,
    connectionStatus,
    connectWallet: !!connectWallet,
    timestamp: new Date().toISOString()
  });
  
  const [showAccount, setShowAccount] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'info' | 'error' }>({ open: false, message: '', type: 'info' });
  const [lastLoginCid, setLastLoginCid] = useState<string | null>(null);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated) {
      setSnackbar({ open: true, message: 'Wallet connected!', type: 'success' });
      setWasAuthenticated(true);
  // Load last login CID opportunistically
  const cid = localStorage.getItem('last_login_cid');
  if (cid) setLastLoginCid(cid);
    } else if (!isAuthenticated && wasAuthenticated) {
      setSnackbar({ open: true, message: 'Logged out', type: 'info' });
      setWasAuthenticated(false);
  setLastLoginCid(null);
    }
  }, [isAuthenticated, wasAuthenticated]);

  const [loginInFlight, setLoginInFlight] = useState(false);
  const handleLogin = async () => {
    if (loginInFlight || connectionStatus === 'connecting' || isAuthenticated) return;
    setLoginInFlight(true);
    try {
      await connectWallet();
      // Snackbar handled by useEffect
    } catch (error) {
      console.error('Web3LoginPanel connectWallet failed:', error);
      setSnackbar({ open: true, message: 'Login failed', type: 'error' });
    } finally {
      setLoginInFlight(false);
    }
  };
  const handleLogout = async () => {
    try {
      await disconnectWallet();
      // Snackbar handled by useEffect
    } catch {
      setSnackbar({ open: true, message: 'Logout failed', type: 'error' });
    }
  };
  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
      setSnackbar({ open: true, message: 'Network switched!', type: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Network switch failed', type: 'error' });
    }
  };
  // For demo: always false, but you can implement real network check
  const wrongNetwork = false;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {!isAuthenticated ? (
        <button onClick={handleLogin} disabled={connectionStatus === 'connecting' || loginInFlight}>
          {connectionStatus === 'connecting' || loginInFlight ? 'Connecting...' : 'Login'}
        </button>
      ) : (
        <>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowAccount(true)}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <span>{expectedNetworkName}</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
  {/* Storage status chip removed */}
      <AccountInfoPopup
        open={showAccount}
        onClose={() => setShowAccount(false)}
        address={address || ''}
        network={expectedNetworkName}
        onSwitchNetwork={handleSwitchNetwork}
        wrongNetwork={wrongNetwork}
  lastLoginCid={lastLoginCid}
      />
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      />
    </div>
  );
};

export default Web3LoginPanel;
