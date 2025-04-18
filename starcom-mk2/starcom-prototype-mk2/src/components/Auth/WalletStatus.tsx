import React from 'react';
import { useAuth } from '../../context/AuthContext';

const WalletStatus: React.FC = () => {
  const {
    isAuthenticated,
    address,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useAuth();

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

  return (
    <div className="wallet-status">
      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}

      {isAuthenticated ? (
        <div>
          <p>Connected: {address}</p>
          <button onClick={handleDisconnect}>Disconnect</button>
          <button onClick={handleSwitchNetwork}>Switch Network</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
};

export default WalletStatus;