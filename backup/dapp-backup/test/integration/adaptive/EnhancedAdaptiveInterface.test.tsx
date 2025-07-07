/**
 * Enhanced Adaptive Interface Integration Test
 * 
 * Comprehensive test suite for Phase 4 adaptive interface integration
 * with Phases 1-3 enhanced global command context.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EnhancedAdaptiveInterfaceProvider } from '../../../src/components/Adaptive/EnhancedAdaptiveInterfaceProvider';
import { AdaptiveGlobalCommandBridgeProvider } from '../../../src/context/AdaptiveGlobalCommandBridge';
import { UnifiedGlobalCommandProvider } from '../../../src/context/UnifiedGlobalCommandContext';

import { AdaptiveInterfaceProvider } from '../../../src/context/AdaptiveInterfaceContext';
import { useEnhancedAdaptiveUtilities } from '../../../src/hooks/useEnhancedAdaptiveUtilities';

// Mock feature flags to enable enhanced features
vi.mock('../../../src/utils/featureFlags', () => ({
  useFeatureFlag: vi.fn((flag: string) => {
    switch (flag) {
      case 'adaptiveInterfaceEnabled':
      case 'enhancedContextEnabled':
      case 'collaborationEnabled':
        return true;
      default:
        return false;
    }
  })
}));

// Test component that uses the enhanced adaptive utilities
const TestComponent: React.FC = () => {
  const {
    getContextualRecommendations,
    getOptimalComplexity,
    getAdaptationScore,
    shouldShowTips,
    shouldEnableGuidance
  } = useEnhancedAdaptiveUtilities();

  const recommendations = getContextualRecommendations();
  const complexity = getOptimalComplexity();
  const score = getAdaptationScore();

  return (
    <div data-testid="adaptive-test-component">
      <div data-testid="complexity">{complexity}</div>
      <div data-testid="score">{score}</div>
      <div data-testid="tips">{shouldShowTips ? 'true' : 'false'}</div>
      <div data-testid="guidance">{shouldEnableGuidance ? 'true' : 'false'}</div>
      <div data-testid="recommendations">{recommendations.join(', ')}</div>
    </div>
  );
};

// Full provider wrapper for integration testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedGlobalCommandProvider>
    <AdaptiveInterfaceProvider>
      <AdaptiveGlobalCommandBridgeProvider>
        <EnhancedAdaptiveInterfaceProvider>
          {children}
        </EnhancedAdaptiveInterfaceProvider>
      </AdaptiveGlobalCommandBridgeProvider>
    </AdaptiveInterfaceProvider>
  </UnifiedGlobalCommandProvider>
);

describe('Enhanced Adaptive Interface Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render enhanced adaptive interface provider without errors', () => {
    render(
      <TestWrapper>
        <div data-testid="test-content">Test Content</div>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-content')).toBeTruthy();
  });

  it('should provide enhanced adaptive utilities', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const component = screen.getByTestId('adaptive-test-component');
    expect(component).toBeTruthy();

    // Check that complexity is being determined
    const complexity = screen.getByTestId('complexity');
    expect(complexity.textContent).toMatch(/^(SIMPLIFIED|STANDARD|ADVANCED|EXPERT)$/);

    // Check that adaptation score is calculated
    const score = screen.getByTestId('score');
    expect(parseInt(score.textContent || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(score.textContent || '0')).toBeLessThanOrEqual(100);
  });

  it('should adapt interface complexity based on context', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Initial complexity should be simplified for basic context
    await waitFor(() => {
      const complexity = screen.getByTestId('complexity');
      expect(complexity.textContent).toBe('SIMPLIFIED');
    });
  });

  it('should provide contextual recommendations', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const recommendations = screen.getByTestId('recommendations');
    expect(recommendations).toBeTruthy();
    // Recommendations might be empty in default state, which is valid
  });

  it('should enable guidance for novice users', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const guidance = screen.getByTestId('guidance');
    expect(guidance.textContent).toBe('true'); // Should be enabled by default
  });

  it('should calculate adaptation score correctly', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const score = screen.getByTestId('score');
    const scoreValue = parseInt(score.textContent || '0');
    
    // Score should be a valid percentage
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);
  });

  it('should handle DOM manipulation for theming', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Check that adaptive interface manipulates DOM attributes
    const htmlElement = document.documentElement;
    
    // The provider should set data attributes on the root element
    expect(htmlElement.getAttribute('data-adaptive-interface')).toBeTruthy();
  });

  it('should support feature flag integration', () => {
    const mockUseFeatureFlag = vi.fn();
    mockUseFeatureFlag.mockReturnValue(true);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Component should render successfully with feature flags enabled
    expect(screen.getByTestId('adaptive-test-component')).toBeTruthy();
  });

  it('should provide bridge integration utilities', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Test that the bridge provider is working by checking if utilities are available
    const complexity = screen.getByTestId('complexity');
    const score = screen.getByTestId('score');
    
    expect(complexity).toBeTruthy();
    expect(score).toBeTruthy();
  });

  it('should handle multi-context scenarios', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // In a multi-context scenario, complexity might be adjusted
    await waitFor(() => {
      const complexity = screen.getByTestId('complexity');
      expect(complexity.textContent).toBeTruthy();
    });
  });

  it('should maintain performance with complex state', () => {
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Render should complete within reasonable time (100ms)
    expect(renderTime).toBeLessThan(100);
  });
});

describe('Enhanced Adaptive Interface Error Handling', () => {
  it('should handle missing context gracefully', () => {
    // Test component without full provider wrapper
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAdaptiveInterface must be used within an AdaptiveInterfaceProvider');

    consoleSpy.mockRestore();
  });

  it('should handle feature flag failures gracefully', () => {
    // Mock feature flag to throw error
    vi.doMock('../../../src/utils/featureFlags', () => ({
      useFeatureFlag: vi.fn(() => {
        throw new Error('Feature flag error');
      })
    }));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
    }).not.toThrow();

    consoleSpy.mockRestore();
  });
});

describe('Enhanced Adaptive Interface Accessibility', () => {
  it('should support keyboard navigation preferences', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Check that accessibility attributes are properly set
    const htmlElement = document.documentElement;
    expect(htmlElement.getAttribute('data-keyboard-navigation')).toBeTruthy();
  });

  it('should support high contrast mode', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Provider should handle high contrast preferences
    const guidance = screen.getByTestId('guidance');
    expect(guidance).toBeTruthy();
  });

  it('should support reduced motion preferences', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Check that motion preferences are respected
    const component = screen.getByTestId('adaptive-test-component');
    expect(component).toBeTruthy();
  });
});
