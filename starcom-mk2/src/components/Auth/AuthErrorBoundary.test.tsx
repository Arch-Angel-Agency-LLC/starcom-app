// Moved from src/__tests__/Web3Login.error-boundary.test.tsx
// Tests for AuthErrorBoundary and error UI
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthErrorBoundary from './AuthErrorBoundary';
import { vi } from 'vitest';

describe('Web3Login AuthErrorBoundary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows error boundary UI if an auth error occurs', () => {
    const Thrower = () => { throw new Error('Test Auth Error'); };
    render(
      <AuthErrorBoundary>
        <Thrower />
      </AuthErrorBoundary>
    );
    expect(screen.getByText(/Authentication Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Auth Error/i)).toBeInTheDocument();
  });

  it('renders children if no error is thrown', () => {
    render(
      <AuthErrorBoundary>
        <div>Safe Child</div>
      </AuthErrorBoundary>
    );
    expect(screen.getByText('Safe Child')).toBeInTheDocument();
  });

  it('resets error boundary on rerender', () => {
    const { rerender } = render(
      <AuthErrorBoundary>
        <div>Safe Child</div>
      </AuthErrorBoundary>
    );
    expect(screen.getByText('Safe Child')).toBeInTheDocument();
    // Rerender with error
    const Thrower = () => { throw new Error('Test Auth Error'); };
    rerender(
      <AuthErrorBoundary>
        <Thrower />
      </AuthErrorBoundary>
    );
    expect(screen.getByText(/Authentication Error/i)).toBeInTheDocument();
  });
});
