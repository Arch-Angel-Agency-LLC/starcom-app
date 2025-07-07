import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { ErrorDetail } from '../types/errors';

describe('ErrorDisplay', () => {
  const mockErrorWithRetry: ErrorDetail = {
    message: 'Test error message',
    timestamp: new Date().toISOString(),
    recoverable: true,
    retryable: true,
    severity: 'error',
    category: 'network',
    operation: 'testOperation',
    userActions: ['Action 1', 'Action 2'],
  };
  
  const mockCriticalError: ErrorDetail = {
    message: 'Critical security error',
    timestamp: new Date().toISOString(),
    recoverable: false,
    retryable: false,
    severity: 'critical',
    category: 'security',
    operation: 'securityCheck',
    userActions: ['Contact administrator'],
  };
  
  const mockWarning: ErrorDetail = {
    message: 'Warning: Some data may be incomplete',
    timestamp: new Date().toISOString(),
    recoverable: true,
    retryable: false,
    severity: 'warning',
    category: 'data',
    operation: 'dataFetch',
    userActions: ['Refresh data'],
  };
  
  const mockRetry = jest.fn();
  const mockDismiss = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders nothing when error is null', () => {
    const { container } = render(
      <ErrorDisplay 
        error={null} 
        onRetry={mockRetry} 
        onDismiss={mockDismiss} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  it('renders standard error correctly', () => {
    render(
      <ErrorDisplay 
        error={mockErrorWithRetry} 
        onRetry={mockRetry} 
        onDismiss={mockDismiss} 
      />
    );
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Operation: testOperation')).toBeInTheDocument();
    expect(screen.getByText('Suggested actions:')).toBeInTheDocument();
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });
  
  it('renders critical error with appropriate styling', () => {
    render(
      <ErrorDisplay 
        error={mockCriticalError} 
        onRetry={mockRetry} 
        onDismiss={mockDismiss} 
      />
    );
    
    expect(screen.getByText('Critical security error')).toBeInTheDocument();
    
    // Critical errors should not have retry option
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    
    // But should still have dismiss
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
    
    // Should have the critical class
    const errorContainer = screen.getByText('Critical security error').closest('div');
    expect(errorContainer).toHaveClass('critical');
  });
  
  it('renders warning with appropriate styling', () => {
    render(
      <ErrorDisplay 
        error={mockWarning} 
        onRetry={mockRetry} 
        onDismiss={mockDismiss} 
      />
    );
    
    expect(screen.getByText('Warning: Some data may be incomplete')).toBeInTheDocument();
    
    // Non-retryable errors should not have retry option
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    
    // Should have the warning class
    const errorContainer = screen.getByText('Warning: Some data may be incomplete').closest('div');
    expect(errorContainer).toHaveClass('warning');
  });
  
  it('calls onRetry when retry button is clicked', () => {
    render(
      <ErrorDisplay 
        error={mockErrorWithRetry} 
        onRetry={mockRetry} 
        onDismiss={mockDismiss} 
      />
    );
    
    fireEvent.click(screen.getByText('Retry'));
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
  
  it('calls onDismiss when dismiss button is clicked', () => {
    render(
      <ErrorDisplay 
        error={mockErrorWithRetry} 
        onRetry={mockRetry} 
        onDismiss={mockDismiss} 
      />
    );
    
    fireEvent.click(screen.getByText('Dismiss'));
    
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
  
  it('accepts and applies additional className', () => {
    render(
      <ErrorDisplay 
        error={mockErrorWithRetry} 
        onRetry={mockRetry} 
        onDismiss={mockDismiss}
        className="customClass"
      />
    );
    
    const errorContainer = screen.getByText('Test error message').closest('div');
    expect(errorContainer).toHaveClass('customClass');
  });
  
  it('handles missing optional callbacks', () => {
    // Should not throw errors when callbacks are not provided
    render(
      <ErrorDisplay 
        error={mockErrorWithRetry}
      />
    );
    
    // Buttons should not be rendered without callbacks
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
  });
});
