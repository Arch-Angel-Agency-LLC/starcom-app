/**
 * Intel Reports 3D Error Boundary
 * 
 * Enhanced error boundary that integrates with Phase 3 error handling
 * and provides graceful degradation for Intel Reports 3D components.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';

// =============================================================================
// ERROR BOUNDARY PROPS AND STATE
// =============================================================================

export interface IntelReports3DErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<IntelErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

export interface IntelReports3DErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface IntelErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  onReset: () => void;
}

// =============================================================================
// DEFAULT ERROR FALLBACK COMPONENT
// =============================================================================

const DefaultIntelErrorFallback: React.FC<IntelErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReset
}) => {
  return (
    <div 
      className="intel-error-boundary"
      style={{
        padding: '20px',
        margin: '10px',
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#fff5f5',
        color: '#c92a2a'
      }}
    >
      <h3>⚠️ Intel Reports 3D Error</h3>
      <p>An error occurred in the Intel Reports 3D system.</p>
      
      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '10px' }}>
          <summary>Error Details (Development)</summary>
          <pre style={{ 
            fontSize: '12px', 
            backgroundColor: '#f8f9fa', 
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            marginTop: '10px'
          }}>
            {error?.toString()}
            {errorInfo?.componentStack}
          </pre>
        </details>
      )}
      
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#228be6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#868e96',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// =============================================================================

export class IntelReports3DErrorBoundary extends Component<
  IntelReports3DErrorBoundaryProps,
  IntelReports3DErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: IntelReports3DErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<IntelReports3DErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `intel-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with enhanced context information
    const enhancedError = {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Intel Reports 3D Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Enhanced Context:', enhancedError);
      console.groupEnd();
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info in state for fallback component
    this.setState({
      errorInfo
    });
  }

  componentDidUpdate(prevProps: IntelReports3DErrorBoundaryProps) {
    // Reset error boundary if props change (and resetOnPropsChange is enabled)
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      this.handleReset();
    }
  }

  componentWillUnmount() {
    // Clean up timeout if component unmounts
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = () => {
    // Simple retry - just reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReset = () => {
    // Reset with a slight delay to allow for cleanup
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }, 100);
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultIntelErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// HOC FOR WRAPPING COMPONENTS WITH ERROR BOUNDARY
// =============================================================================

export function withIntelErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<IntelReports3DErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <IntelReports3DErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </IntelReports3DErrorBoundary>
  );

  WrappedComponent.displayName = `withIntelErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
