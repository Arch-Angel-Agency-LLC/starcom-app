import React, { useState, useCallback, useEffect } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletError } from '@solana/wallet-adapter-base';
import { useSIWS } from '../hooks/useSIWS';

export const AuthProvider: React.FC<{ children: React.ReactNode; value?: AuthContextType }> = ({ children, value }) => {
  // Use Solana wallet adapter directly
  const solanaWallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  
  // Use SIWS for cryptographic authentication
  const { session, isAuthenticated, isLoading: isSIWSLoading, error: siwsError, signIn, signOut, isSessionValid } = useSIWS();
  
  const [authError, setAuthError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    if (!solanaWallet.connected || !solanaWallet.publicKey) {
      setAuthError('Wallet not connected');
      return false;
    }
    
    setAuthError(null);
    try {
      const success = await signIn();
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(errorMessage);
      return false;
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, signIn]);

  const logout = useCallback(() => {
    signOut();
    setAuthError(null);
  }, [signOut]);

  // Wrapper for signIn that matches the expected interface
  const handleSignIn = useCallback(async () => {
    await signIn();
  }, [signIn]);

  const expectedChainId = 101; // Solana mainnet (devnet would be different)
  const expectedNetworkName = 'Solana Devnet';

  const connectWalletHandler = useCallback(async () => {
    try {
      setAuthError(null);
      
      // If no wallet is selected, show the wallet selection modal
      if (!solanaWallet.wallet) {
        setWalletModalVisible(true);
        return;
      }
      
      // If wallet is selected but not connected, connect to it
      if (solanaWallet.connect && !solanaWallet.connected) {
        await solanaWallet.connect();
        // Auto-authenticate after successful connection
        setTimeout(async () => {
          await authenticate();
        }, 1000);
      } else if (solanaWallet.connected) {
        // If already connected, just authenticate
        await authenticate();
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      // Handle specific wallet errors
      if (error instanceof WalletError || (error instanceof Error && error.name?.includes('Wallet'))) {
        if (error.name === 'WalletNotSelectedError') {
          // Open wallet selection modal
          setWalletModalVisible(true);
          return;
        } else if (error.name === 'WalletConnectionError') {
          setAuthError('Failed to connect to wallet. Please try again.');
        } else if (error.name === 'WalletNotReadyError') {
          setAuthError('Wallet is not ready. Please ensure your wallet extension is installed and unlocked.');
        } else if (error.name === 'WalletNotConnectedError') {
          setAuthError('Wallet not connected. Please connect your wallet first.');
        } else {
          setAuthError(error instanceof Error ? error.message : 'Wallet connection failed');
        }
      } else {
        setAuthError(error instanceof Error ? error.message : 'Connection failed');
      }
    }
  }, [solanaWallet, authenticate, setWalletModalVisible]);

  const disconnectWalletHandler = useCallback(async () => {
    try {
      if (solanaWallet.disconnect) {
        await solanaWallet.disconnect();
      }
      logout();
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Disconnection failed');
    }
  }, [solanaWallet, logout]);

  const switchNetworkHandler = useCallback(async () => {
    // Solana wallets typically don't support network switching
    // This would be handled in wallet settings
    setAuthError('Network switching must be done in your wallet settings');
  }, []);

  const forceReset = useCallback(async () => {
    try {
      console.log('🔄 Force resetting authentication state...');
      
      // Clear all errors first
      setAuthError(null);
      
      // Force sign out to clear any stale sessions
      signOut();
      
      // Clear any additional localStorage items that might be stale
      try {
        localStorage.removeItem('siws-session');
        localStorage.removeItem('wallet-adapter');
        // Clear any other wallet-related storage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('wallet') || key.includes('solana') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
        
        // In development, log what was cleared
        if (process.env.NODE_ENV === 'development') {
          console.log('🧹 Cleared localStorage items:', 
            Object.keys(localStorage).filter(key => 
              key.includes('wallet') || key.includes('solana') || key.includes('auth')
            )
          );
        }
      } catch (err) {
        console.warn('Failed to clear some localStorage items:', err);
      }
      
      // Force disconnect wallet
      if (solanaWallet.disconnect) {
        await solanaWallet.disconnect();
      }
      
      // Wait a bit for state to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Authentication state reset complete');
      
    } catch (error) {
      console.error('Force reset failed:', error);
      setAuthError('Reset failed. Please refresh the page.');
    }
  }, [solanaWallet, signOut]);

  // Combine authentication state from wallet connection and SIWS session
  const isFullyAuthenticated = solanaWallet.connected && isSessionValid() && isAuthenticated;
  const combinedError = authError || siwsError;
  const combinedLoading = solanaWallet.connecting || isSIWSLoading;

  const contextValue: AuthContextType = {
    isAuthenticated: isFullyAuthenticated,
    address: solanaWallet.publicKey?.toString() || null,
    provider: solanaWallet,
    signer: solanaWallet,
    connectWallet: connectWalletHandler,
    disconnectWallet: disconnectWalletHandler,
    isLoading: combinedLoading,
    error: combinedError,
    connectionStatus: solanaWallet.connected ? 'connected' : 
                     combinedLoading ? 'connecting' : 
                     combinedError ? 'error' : 'idle',
    switchNetwork: switchNetworkHandler,
    authenticate,
    logout,
    isSessionValid,
    authError: combinedError,
    expectedChainId,
    expectedNetworkName,
    setError: setAuthError,
    // SIWS properties
    session,
    isSigningIn: isSIWSLoading,
    signIn: handleSignIn,
    // Recovery functions
    forceReset,
  };

  // Auto-connect when wallet is selected from modal
  useEffect(() => {
    if (solanaWallet.wallet && !solanaWallet.connected && !solanaWallet.connecting) {
      // User just selected a wallet, auto-connect to it
      const autoConnect = async () => {
        try {
          setAuthError(null);
          await solanaWallet.connect?.();
        } catch (error) {
          console.error('Auto-connect after wallet selection failed:', error);
          setAuthError(error instanceof Error ? error.message : 'Connection failed');
        }
      };
      
      // Small delay to ensure wallet selection is complete
      const timeoutId = setTimeout(autoConnect, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [solanaWallet]);

  // Auto-authenticate when wallet connects (e.g., after being selected from modal)
  useEffect(() => {
    if (solanaWallet.connected && solanaWallet.publicKey && !isAuthenticated) {
      // Add a small delay to ensure wallet is fully connected
      const timeoutId = setTimeout(() => {
        authenticate().catch(error => {
          console.error('Auto-authentication failed:', error);
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, isAuthenticated, authenticate]);

  return (
    <AuthContext.Provider value={value || contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// AI-NOTE: EVM/ethers.js version archived in legacy-evm/AuthContext.tsx. Implement Solana logic here.
