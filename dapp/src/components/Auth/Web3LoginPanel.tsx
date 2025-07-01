import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Snackbar from '../Shared/Snackbar';
import Modal from '../Shared/Modal';

const AccountInfoPopup: React.FC<{
  open: boolean;
  onClose: () => void;
  address: string;
  network: string;
  onSwitchNetwork?: () => void;
  wrongNetwork?: boolean;
}> = ({ open, onClose, address, network, onSwitchNetwork, wrongNetwork }) => (
  <Modal isOpen={open} onClose={onClose} ariaLabel="Account Info">
    <div style={{ padding: 24, minWidth: 320 }}>
      <h2>Account Info</h2>
      <div><b>Address:</b> {address}</div>
      <div><b>Network:</b> {network}</div>
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
  const [showAccount, setShowAccount] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'info' | 'error' }>({ open: false, message: '', type: 'info' });
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated) {
      setSnackbar({ open: true, message: 'Wallet connected!', type: 'success' });
      setWasAuthenticated(true);
    } else if (!isAuthenticated && wasAuthenticated) {
      setSnackbar({ open: true, message: 'Logged out', type: 'info' });
      setWasAuthenticated(false);
    }
  }, [isAuthenticated, wasAuthenticated]);

  const handleLogin = async () => {
    try {
      await connectWallet();
      // Snackbar handled by useEffect
    } catch {
      setSnackbar({ open: true, message: 'Login failed', type: 'error' });
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
        <button onClick={handleLogin} disabled={connectionStatus === 'connecting'}>
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Login'}
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
      <AccountInfoPopup
        open={showAccount}
        onClose={() => setShowAccount(false)}
        address={address || ''}
        network={expectedNetworkName}
        onSwitchNetwork={handleSwitchNetwork}
        wrongNetwork={wrongNetwork}
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
