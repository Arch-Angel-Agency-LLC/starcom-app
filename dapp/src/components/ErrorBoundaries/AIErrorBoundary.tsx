/**
 * AI Component Error Boundary
 * Handles errors specific to AI-powered components
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '../../utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

// TODO: Implement HUD component lazy loading for improved startup performance - PRIORITY: MEDIUM
export class AIErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `ai_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AI Component Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.retryCount
    });

    // Enhanced error logging for AI components
    errorLogger.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'AIErrorBoundary',
      errorId: this.state.errorId,
      retryCount: this.retryCount,
      aiComponent: true
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Auto-retry for network-related errors
    if (this.shouldAutoRetry(error) && this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorId: null
        });
      }, 1000 * this.retryCount); // Exponential backoff
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const retryableErrors = [
      'NetworkError',
      'fetch',
      'timeout',
      'Failed to fetch',
      'ERR_NETWORK'
    ];
    
    return retryableErrors.some(keyword => 
      error.message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private handleManualRetry = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="ai-error-boundary p-4 border border-red-300 rounded-lg bg-red-50">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                AI Component Error
              </h3>
            </div>
          </div>
          
          <div className="text-sm text-red-700 mb-4">
            <p className="font-semibold">Error:</p>
            <p className="mt-1">{this.state.error?.message || 'Unknown AI processing error'}</p>
            {this.state.errorId && (
              <p className="mt-2 text-xs text-red-600">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={this.handleManualRetry}
              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Retry AI Component
            </button>
            
            {this.retryCount > 0 && (
              <span className="text-xs text-red-600 self-center">
                Retry {this.retryCount}/{this.maxRetries}
              </span>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
