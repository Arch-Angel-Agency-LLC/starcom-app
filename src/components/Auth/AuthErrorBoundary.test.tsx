// Moved from src/__tests__/Web3Login.error-boundary.test.tsx
// Tests for AuthErrorBoundary and error UI - specifically for auth-related errors
// Note: This component is now scoped to auth components only. General app errors use Shared/ErrorBoundary
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthErrorBoundary from './AuthErrorBoundary';
import { vi } from 'vitest';

describe('Auth-specific ErrorBoundary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows authentication error for wallet-related errors', () => {
    const Thrower = () => { throw new Error('WalletNotSelectedError: No wallet selected'); };
    render(
      <AuthErrorBoundary>
        <Thrower />
      </AuthErrorBoundary>
    );
    expect(screen.getByText(/Authentication Error/i)).toBeInTheDocument();
    expect(screen.getByText(/WalletNotSelectedError/i)).toBeInTheDocument();
  });

  it('shows component error for non-auth errors', () => {
    const Thrower = () => { throw new Error('useContext must be used within Provider'); };
    render(
      <AuthErrorBoundary>
        <Thrower />
      </AuthErrorBoundary>
    );
    expect(screen.getByText(/Wallet Component Error/i)).toBeInTheDocument();
    expect(screen.getByText(/useContext must be used within Provider/i)).toBeInTheDocument();
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
    // Rerender with auth error
    const Thrower = () => { throw new Error('wallet authentication failed'); };
    rerender(
      <AuthErrorBoundary>
        <Thrower />
      </AuthErrorBoundary>
    );
    expect(screen.getByText(/Authentication Error/i)).toBeInTheDocument();
  });
});
