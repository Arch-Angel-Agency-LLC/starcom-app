/**
 * Wallet Connection Fix Utilities
 * 
 * This file contains utilities to help with the wallet connection state management fixes.
 * The fixes address the following issues:
 * 
 * 1. Removed problematic monkey patching that interfered with wallet operations
 * 2. Added proper async waiting for wallet adapter state propagation
 * 3. Fixed state checking timing after connection attempts  
 * 4. Improved button state logic to handle wallet selection vs connection states
 * 5. Added proper error recovery that resets to "Select Wallet" when appropriate
 */

export interface WalletConnectionState {
  isWalletSelected: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  hasPublicKey: boolean;
  isAuthenticated: boolean;
  hasError: boolean;
  errorType: 'selection' | 'connection' | 'authentication' | 'none';
}

/**
 * Analyzes the current wallet connection state to determine the appropriate button state
 */
export const analyzeWalletState = (
  wallet: unknown,
  connected: boolean,
  connecting: boolean,
  publicKey: unknown,
  isAuthenticated: boolean,
  error: string | null,
  authError: string | null
): WalletConnectionState => {
  const hasWallet = !!wallet;
  const hasPublicKey = !!publicKey;
  const hasError = !!(error || authError);
  
  let errorType: 'selection' | 'connection' | 'authentication' | 'none' = 'none';
  
  if (hasError) {
    const errorMessage = error || authError || '';
    if (errorMessage.includes('WalletNotSelectedError') || 
        errorMessage.includes('not selected') ||
        errorMessage.includes('No wallet selected')) {
      errorType = 'selection';
    } else if (errorMessage.includes('connection') || !connected) {
      errorType = 'connection';
    } else {
      errorType = 'authentication';
    }
  }
  
  return {
    isWalletSelected: hasWallet,
    isConnected: connected,
    isConnecting: connecting,
    hasPublicKey,
    isAuthenticated,
    hasError,
    errorType
  };
};

/**
 * Determines the appropriate button label and action based on wallet state
 */
export const getButtonStateFromWalletState = (state: WalletConnectionState) => {
  // Error cases
  if (state.hasError) {
    if (state.errorType === 'selection' || !state.isWalletSelected) {
      return { label: 'Select Wallet', action: 'openModal', className: 'default' };
    }
    if (state.errorType === 'connection') {
      return { label: 'Retry', action: 'connect', className: 'error' };
    }
    if (state.errorType === 'authentication') {
      return { label: 'Sign In', action: 'authenticate', className: 'authError' };
    }
  }
  
  // No wallet selected
  if (!state.isWalletSelected) {
    return { label: 'Select Wallet', action: 'openModal', className: 'default' };
  }
  
  // Connecting states
  if (state.isConnecting) {
    return { label: 'Connecting...', action: 'none', className: 'connecting' };
  }
  
  // Connected but not authenticated
  if (state.isConnected && state.hasPublicKey && !state.isAuthenticated) {
    return { label: 'Sign In', action: 'authenticate', className: 'signIn' };
  }
  
  // Fully connected and authenticated
  if (state.isConnected && state.hasPublicKey && state.isAuthenticated) {
    return { label: 'Connected', action: 'none', className: 'connected' };
  }
  
  // Default: wallet selected but not connected
  return { label: 'Connect', action: 'connect', className: 'default' };
};

/**
 * Validates that wallet connection state is consistent
 */
export const validateWalletState = (state: WalletConnectionState): string[] => {
  const issues: string[] = [];
  
  if (state.isConnected && !state.isWalletSelected) {
    issues.push('Connected but no wallet selected - state inconsistency');
  }
  
  if (state.hasPublicKey && !state.isConnected) {
    issues.push('Has public key but not connected - potential race condition');
  }
  
  if (state.isAuthenticated && !state.hasPublicKey) {
    issues.push('Authenticated but no public key - authentication state invalid');
  }
  
  if (state.isConnecting && state.isConnected) {
    issues.push('Both connecting and connected - state conflict');
  }
  
  return issues;
};
