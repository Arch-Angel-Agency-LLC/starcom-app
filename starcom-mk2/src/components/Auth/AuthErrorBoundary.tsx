import React from 'react';

// AI-NOTE: Error boundary for authentication and wallet errors (see artifacts)
class AuthErrorBoundary extends React.Component<{
  children: React.ReactNode
}, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Optionally log error
    // console.error('AuthErrorBoundary caught:', error, errorInfo);
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
