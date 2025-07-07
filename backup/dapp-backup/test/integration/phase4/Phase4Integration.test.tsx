/**
 * Phase 4 Integration Tests
 * 
 * Tests for the Phase 4 Gaming Enhancement Integration system.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock feature flags before importing components
vi.mock('../../../src/utils/featureFlags', () => ({
  useFeatureFlag: vi.fn()
}));

import Phase4Integration from '../../../src/components/Gaming/Phase4Integration';
import { AdaptiveInterfaceProvider } from '../../../src/context/AdaptiveInterfaceContext';
import { EnhancedGlobalCommandProvider } from '../../../src/context/EnhancedGlobalCommandContext';
import { GlobalCommandProvider } from '../../../src/context/GlobalCommandContext';
import { useFeatureFlag } from '../../../src/utils/featureFlags';

const mockUseFeatureFlag = vi.mocked(useFeatureFlag);

// Test wrapper component with all required providers (matching App.tsx structure)
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GlobalCommandProvider>
    <EnhancedGlobalCommandProvider>
      <AdaptiveInterfaceProvider>
        {children}
      </AdaptiveInterfaceProvider>
    </EnhancedGlobalCommandProvider>
  </GlobalCommandProvider>
);

describe('Phase4Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default feature flag states
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      switch (flag) {
        case 'adaptiveInterfaceEnabled':
          return true;
        case 'rtsEnhancementsEnabled':
          return true;
        case 'enhancedContextEnabled':
          return true; // Enable enhanced context for tests
        default:
          return false;
      }
    });
  });

  it('renders children when adaptive interface is enabled', () => {
    render(
      <TestWrapper>
        <Phase4Integration>
          <div data-testid="test-child">Test Content</div>
        </Phase4Integration>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('renders children without enhancements when adaptive interface is disabled', () => {
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      return flag === 'adaptiveInterfaceEnabled' ? false : true;
    });

    render(
      <Phase4Integration>
        <div data-testid="test-child">Test Content</div>
      </Phase4Integration>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('displays Phase 4 status indicator when enabled', () => {
    render(
      <TestWrapper>
        <Phase4Integration>
          <div>Test Content</div>
        </Phase4Integration>
      </TestWrapper>
    );

    expect(screen.getByText('PHASE 4')).toBeInTheDocument();
    expect(screen.getByText('ADAPTIVE GAMING UX')).toBeInTheDocument();
  });

  it('shows RTS indicator when RTS enhancements are enabled', () => {
    render(
      <TestWrapper>
        <Phase4Integration>
          <div>Test Content</div>
        </Phase4Integration>
      </TestWrapper>
    );

    expect(screen.getByText('RTS ENHANCED')).toBeInTheDocument();
  });

  it('applies correct data attributes when Phase 4 is enabled', () => {
    const { container } = render(
      <TestWrapper>
        <Phase4Integration>
          <div>Test Content</div>
        </Phase4Integration>
      </TestWrapper>
    );

    const phase4Container = container.querySelector('[data-phase4-enabled="true"]');
    expect(phase4Container).toBeInTheDocument();
    expect(phase4Container).toHaveAttribute('data-adaptive-interface', 'true');
    expect(phase4Container).toHaveAttribute('data-rts-enhancements', 'true');
  });

  it('handles feature flag combinations correctly', () => {
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      switch (flag) {
        case 'adaptiveInterfaceEnabled':
          return true;
        case 'rtsEnhancementsEnabled':
          return false;
        case 'enhancedContextEnabled':
          return true; // Keep enhanced context enabled
        default:
          return false;
      }
    });

    render(
      <TestWrapper>
        <Phase4Integration>
          <div data-testid="test-child">Test Content</div>
        </Phase4Integration>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('PHASE 4')).toBeInTheDocument();
    expect(screen.queryByText('RTS ENHANCED')).not.toBeInTheDocument();
  });

  it('maintains proper component hierarchy with providers', () => {
    const { container } = render(
      <TestWrapper>
        <Phase4Integration>
          <div data-testid="nested-content">
            <span>Nested Content</span>
          </div>
        </Phase4Integration>
      </TestWrapper>
    );

    // Should have nested provider structure
    expect(container.querySelector('[data-phase4-enabled="true"]')).toBeInTheDocument();
    expect(screen.getByTestId('nested-content')).toBeInTheDocument();
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });
});
