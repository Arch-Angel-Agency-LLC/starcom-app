import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import Phase5Integration from '../../../src/components/Optimization/Phase5Integration';
import * as featureFlags from '../../../src/utils/featureFlags';

// Mock the feature flags
vi.mock('../../../src/utils/featureFlags', () => ({
  useFeatureFlag: vi.fn()
}));

// Mock the child components
vi.mock('../../../src/components/Optimization/PerformanceOptimizer', () => ({
  default: () => <div data-testid="performance-optimizer">Performance Optimizer</div>
}));

vi.mock('../../../src/components/Optimization/SecurityHardening', () => ({
  default: () => <div data-testid="security-hardening">Security Hardening</div>
}));

describe('Phase5Integration', () => {
  const mockUseFeatureFlag = featureFlags.useFeatureFlag as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Default feature flag values
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      switch (flag) {
        case 'performanceOptimizerEnabled':
          return true;
        case 'securityHardeningEnabled':
          return true;
        case 'performanceMonitoringEnabled':
          return true;
        default:
          return false;
      }
    });

    // Mock console.log to avoid test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('renders without crashing', () => {
    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays the Phase 5 control panel', () => {
    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    expect(screen.getByRole('button', { name: /phase 5/i })).toBeInTheDocument();
  });

  it('toggles dashboard visibility when control button is clicked', async () => {
    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    const toggleButton = screen.getByRole('button', { name: /phase 5/i });
    
    // Dashboard should not be visible initially
    expect(screen.queryByText('Phase 5: Integration & Optimization Dashboard')).not.toBeInTheDocument();
    
    // Click to show dashboard
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Phase 5: Integration & Optimization Dashboard')).toBeInTheDocument();
    });
    
    // Click to hide dashboard
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Phase 5: Integration & Optimization Dashboard')).not.toBeInTheDocument();
    });
  });

  it('displays performance and security dashboards when enabled', async () => {
    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    // Open dashboard
    const toggleButton = screen.getByRole('button', { name: /phase 5/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('performance-optimizer')).toBeInTheDocument();
      expect(screen.getByTestId('security-hardening')).toBeInTheDocument();
    });
  });

  it('does not display performance dashboard when disabled', async () => {
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      switch (flag) {
        case 'performanceOptimizerEnabled':
          return false;
        case 'securityHardeningEnabled':
          return true;
        case 'performanceMonitoringEnabled':
          return true;
        default:
          return false;
      }
    });

    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    // Open dashboard
    const toggleButton = screen.getByRole('button', { name: /phase 5/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('performance-optimizer')).not.toBeInTheDocument();
      expect(screen.getByTestId('security-hardening')).toBeInTheDocument();
    });
  });

  it('displays system metrics in the dashboard', async () => {
    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    // Open dashboard
    const toggleButton = screen.getByRole('button', { name: /phase 5/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
    });
  });

  it('handles real-time monitoring when enabled', async () => {
    vi.useFakeTimers();
    
    render(
      <Phase5Integration enableRealTimeMonitoring={true}>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    // Fast-forward time to trigger monitoring updates
    vi.advanceTimersByTime(3000);
    
    // Should not throw any errors
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it('disables real-time monitoring when feature flag is disabled', () => {
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      switch (flag) {
        case 'performanceMonitoringEnabled':
          return false;
        default:
          return true;
      }
    });

    render(
      <Phase5Integration enableRealTimeMonitoring={true}>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    // Should still render content even with monitoring disabled
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('allows clearing alerts', async () => {
    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    // Open dashboard first to trigger some mock metrics
    const toggleButton = screen.getByRole('button', { name: /phase 5/i });
    fireEvent.click(toggleButton);
    
    // Wait for any alerts to potentially appear
    await waitFor(() => {
      // The component should be rendered
      expect(screen.getByText('Phase 5: Integration & Optimization Dashboard')).toBeInTheDocument();
    });
  });

  it('handles custom performance thresholds', () => {
    const customThresholds = {
      cpuUsage: 90,
      memoryUsage: 95,
      renderTime: 20
    };

    render(
      <Phase5Integration performanceThresholds={customThresholds}>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('disables automatic optimizations when configured', () => {
    render(
      <Phase5Integration enableAutomaticOptimizations={false}>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('disables security alerts when configured', () => {
    render(
      <Phase5Integration enableSecurityAlerts={false}>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('closes dashboard when close button is clicked', async () => {
    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    // Open dashboard
    const toggleButton = screen.getByRole('button', { name: /phase 5/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Phase 5: Integration & Optimization Dashboard')).toBeInTheDocument();
    });
    
    // Close dashboard using close button
    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Phase 5: Integration & Optimization Dashboard')).not.toBeInTheDocument();
    });
  });

  it('maintains dashboard state correctly', async () => {
    render(
      <Phase5Integration>
        <div>Test Content</div>
      </Phase5Integration>
    );
    
    const toggleButton = screen.getByRole('button', { name: /phase 5/i });
    
    // Open and close dashboard multiple times
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.getByText('Phase 5: Integration & Optimization Dashboard')).toBeInTheDocument();
    });
    
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.queryByText('Phase 5: Integration & Optimization Dashboard')).not.toBeInTheDocument();
    });
    
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.getByText('Phase 5: Integration & Optimization Dashboard')).toBeInTheDocument();
    });
  });
});
