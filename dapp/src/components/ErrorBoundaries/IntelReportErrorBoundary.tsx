/**
 * Enhanced Intel Report Error Boundary
 * 
 * React error boundary component that integrates with the centralized error handling system.
 * Provides graceful error recovery and user-friendly error display for Intel Report components.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { intelReportErrorService } from '../../services/IntelReportErrorService';
import { IntelReportError } from '../../types/IntelReportErrorTypes';

// =============================================================================
// INTERFACES
// =============================================================================

// TODO: Add comprehensive HUD analytics and usage tracking - PRIORITY: LOW
export interface IntelReportErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<IntelReportErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export interface IntelReportErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  reportedError: IntelReportError | null;
}

export interface IntelReportErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  reportedError: IntelReportError | null;
  onRetry: () => void;
  onReset: () => void;
  onReport: () => void;
}

// =============================================================================
// DEFAULT FALLBACK COMPONENT
// =============================================================================

const DefaultIntelReportErrorFallback: React.FC<IntelReportErrorFallbackProps> = ({
  reportedError,
  onRetry,
  onReset,
  onReport
}) => {
  const error = reportedError;
  
  return (
    <div style={{
      padding: '20px',
      margin: '10px',
      border: '2px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      color: '#333',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          color: '#e03131',
          fontSize: '16px'
        }}>
          ⚠️ Intel Report Error
        </h3>
        
        {error && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Error Code:</strong> {error.code}<br />
            <strong>Type:</strong> {error.type}<br />
            <strong>Severity:</strong> {error.severity}
          </div>
        )}
        
        <p style={{ 
          margin: '10px 0',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {error?.userMessage || 'An unexpected error occurred in the Intel Report system.'}
        </p>

        {error?.suggestedActions && error.suggestedActions.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <strong>Suggested Actions:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              {error.suggestedActions.map((action, index) => (
                <li key={index} style={{ marginBottom: '3px' }}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        {error?.retryable && (
          <button
            onClick={onRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4c6ef5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Retry
          </button>
        )}
        
        <button
          onClick={onReset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#51cf66',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ↻ Reset
        </button>
        
        <button
          onClick={onReport}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffd43b',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📋 Report Issue
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && error && (
        <details style={{ marginTop: '15px' }}>
          <summary style={{ cursor: 'pointer', color: '#666' }}>
            🔍 Debug Information
          </summary>
          <pre style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify({
              errorId: error.id,
              code: error.code,
              type: error.type,
              message: error.message,
              context: error.context,
              timestamp: error.timestamp
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

export class IntelReportErrorBoundary extends Component<
  IntelReportErrorBoundaryProps,
  IntelReportErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: IntelReportErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      reportedError: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<IntelReportErrorBoundaryState> {
    return {
      hasError: true,
      error: error,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Intel Report Error Boundary caught an error:', error, errorInfo);

    // Report error to centralized service
    try {
      const reportedError = await intelReportErrorService.reportError(error, {
        operation: 'component-render',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          props: this.props,
        },
      });

      this.setState({
        errorInfo,
        reportedError,
      });
    } catch (reportingError) {
      console.error('Failed to report error to service:', reportingError);
      this.setState({
        errorInfo,
        reportedError: null,
      });
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: IntelReportErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when specified props change
    if (hasError && prevProps.resetOnPropsChange !== resetOnPropsChange) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary when reset keys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys![idx] !== resetKey
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      reportedError: null,
    });
  };

  handleRetry = async () => {
    const { reportedError } = this.state;
    
    if (reportedError) {
      try {
        const result = await intelReportErrorService.attemptRecovery(reportedError.id);
        
        if (result.success) {
          // Recovery successful, reset the boundary
          this.resetErrorBoundary();
        } else {
          // Recovery failed, but we can still try to reset
          console.warn('Error recovery failed, but resetting boundary:', result.message);
          this.resetErrorBoundary();
        }
      } catch (recoveryError) {
        console.error('Error during recovery attempt:', recoveryError);
        // Even if recovery fails, allow user to reset
        this.resetErrorBoundary();
      }
    } else {
      // No reported error, just reset
      this.resetErrorBoundary();
    }
  };

  handleReset = () => {
    this.resetErrorBoundary();
  };

  handleReport = () => {
    const { reportedError } = this.state;
    
    if (reportedError) {
      // This would typically open a support interface or copy error details
      const errorDetails = {
        errorId: reportedError.id,
        code: reportedError.code,
        type: reportedError.type,
        timestamp: reportedError.timestamp,
        userMessage: reportedError.userMessage,
      };

      // Copy to clipboard for now
      if (navigator.clipboard) {
        navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
        alert('Error details copied to clipboard');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = JSON.stringify(errorDetails, null, 2);
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Error details copied to clipboard');
      }

      // Mark error as reported
      intelReportErrorService.resolveError(
        reportedError.id, 
        'Error reported by user via error boundary'
      );
    }
  };

  render() {
    const { hasError, error, errorInfo, reportedError } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError) {
      const FallbackComponent = Fallback || DefaultIntelReportErrorFallback;
      
      return (
        <FallbackComponent
          error={error}
          errorInfo={errorInfo}
          reportedError={reportedError}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          onReport={this.handleReport}
        />
      );
    }

    return children;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default IntelReportErrorBoundary;
