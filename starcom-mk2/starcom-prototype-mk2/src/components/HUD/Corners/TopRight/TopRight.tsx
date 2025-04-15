import React, { useCallback, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext.tsx';
import styles from './TopRight.module.css';
import { useWallet } from '../../../../hooks/useWallet';

const TopRight: React.FC = () => {
  const { connectWallet, address } = useAuth();
  const { balance, error, isLoading, validateNetwork } = useWallet();
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    try {
      setConnectError(null);
      await connectWallet();
      await validateNetwork(1); // Validate Ethereum Mainnet
    } catch (error: unknown) {
      console.error('Failed to connect wallet:', error);
      if (error instanceof Error) {
        setConnectError(
          error.message.includes('No Web3 provider')
            ? 'Please install MetaMask to connect your wallet.'
            : 'Failed to connect wallet. Please try again.'
        );
      } else {
        setConnectError('An unknown error occurred. Please try again.');
      }
    }
  }, [connectWallet, validateNetwork]);

  return (
    <div className={styles.topRight}>
      {address ? (
        <div>
          <span>Connected: {address.slice(0, 6)}...{address.slice(-4)}</span>
          {isLoading && <span>Loading...</span>}
          {balance && <span>Balance: {balance} ETH</span>}
          {error && <span>Error: {error}</span>}
        </div>
      ) : (
        <>
          <button onClick={handleLogin}>Login with Web3</button>
          {connectError && <span style={{ color: 'red' }}>{connectError}</span>}
        </>
      )}
    </div>
  );
};

export default TopRight;