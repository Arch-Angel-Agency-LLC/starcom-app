import React from 'react';

// 🚨🚨🚨 AUTH ERROR BOUNDARY DEBUGGING
console.log('🔍 AuthErrorBoundary.tsx loaded - will monitor authentication errors');

// AI-NOTE: Error boundary specifically for authentication and wallet errors
// This component should only be used around auth-related components (WalletStatusMini, AuthGate, etc.)
// For general application errors, use components/Shared/ErrorBoundary instead
// TODO: Add support for enterprise SSO integration for organizational users - PRIORITY: LOW
class AuthErrorBoundary extends React.Component<{
  children: React.ReactNode
}, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
    console.log('🔍 AuthErrorBoundary constructor called');
  }

  static getDerivedStateFromError(error: Error) {
    // 🚨🚨🚨 CRITICAL: Error boundary caught an error!
    console.error('🚨🚨🚨 AUTH ERROR BOUNDARY CAUGHT ERROR!');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    if (error.name === 'WalletNotSelectedError' || error.message?.includes('WalletNotSelectedError')) {
      console.error('🎯 ERROR BOUNDARY: WalletNotSelectedError caught!');
      alert('ERROR BOUNDARY: WalletNotSelectedError caught! Check console.');
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 🚨🚨🚨 COMPREHENSIVE ERROR LOGGING
    console.error('🚨🚨🚨 AUTH ERROR BOUNDARY componentDidCatch called!');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Determine if this is actually an authentication error or something else
      const error = this.state.error;
      const isAuthError = error && (
        error.name === 'WalletNotSelectedError' ||
        error.message?.includes('wallet') ||
        error.message?.includes('authentication') ||
        error.message?.includes('auth') ||
        error.message?.includes('sign') ||
        error.message?.includes('connect')
      );

      const errorTitle = isAuthError ? 'Authentication Error' : 'Wallet Component Error';
      const errorMessage = isAuthError 
        ? 'There was a problem with wallet authentication. Please try connecting your wallet again.'
        : 'A component error occurred. This may not be related to authentication.';

      return (
        <div className="p-6 text-center">
          <h2 className="text-lg font-bold mb-2">{errorTitle}</h2>
          <p className="mb-4">{error?.message || errorMessage}</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={this.handleRetry}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AuthErrorBoundary;
