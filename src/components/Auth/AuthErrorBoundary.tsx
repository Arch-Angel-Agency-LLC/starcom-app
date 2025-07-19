import React from 'react';

// 🚨🚨🚨 AUTH ERROR BOUNDARY DEBUGGING
console.log('🔍 AuthErrorBoundary.tsx loaded - will monitor authentication errors');

// AI-NOTE: Error boundary for authentication and wallet errors (see artifacts)
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
      return (
        <div className="p-6 text-center">
          <h2 className="text-lg font-bold mb-2">Authentication Error</h2>
          <p className="mb-4">{this.state.error?.message || 'An unknown error occurred.'}</p>
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
