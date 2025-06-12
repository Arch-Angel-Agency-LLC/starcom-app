import React, { useCallback, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext.tsx';
import styles from './TopRight.module.css';

const TopRight: React.FC = () => {
  const { connectWallet, address, isLoading, error } = useAuth();
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    try {
      setConnectError(null);
      await connectWallet();
    } catch (error: unknown) {
      setConnectError(error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  }, [connectWallet]);

  return (
    <div className={styles.topRight}>
      {address ? (
        <div>
          <span>Connected: {address.slice(0, 6)}...{address.slice(-4)}</span>
          {isLoading && <span>Loading...</span>}
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