/**
 * Bridge Provider Test - Debug Context Issues
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { GlobalCommandProvider } from '../../../src/context/GlobalCommandContext';
import { EnhancedGlobalCommandProvider } from '../../../src/context/EnhancedGlobalCommandContext';
import { AdaptiveInterfaceProvider } from '../../../src/context/AdaptiveInterfaceContext';
import { AdaptiveGlobalCommandBridgeProvider } from '../../../src/context/AdaptiveGlobalCommandBridge';

// Mock feature flags
vi.mock('../../../src/utils/featureFlags', () => ({
  useFeatureFlag: vi.fn(() => true)
}));

describe('Bridge Provider Tests', () => {
  it('should render GlobalCommandProvider + EnhancedGlobalCommandProvider + AdaptiveInterfaceProvider', () => {
    render(
      <GlobalCommandProvider>
        <EnhancedGlobalCommandProvider>
          <AdaptiveInterfaceProvider>
            <div data-testid="test-content">Test Content</div>
          </AdaptiveInterfaceProvider>
        </EnhancedGlobalCommandProvider>
      </GlobalCommandProvider>
    );

    expect(screen.getByTestId('test-content')).toBeTruthy();
  });

  it('should render with AdaptiveGlobalCommandBridgeProvider', () => {
    render(
      <GlobalCommandProvider>
        <EnhancedGlobalCommandProvider>
          <AdaptiveInterfaceProvider>
            <AdaptiveGlobalCommandBridgeProvider>
              <div data-testid="test-content">Test Content</div>
            </AdaptiveGlobalCommandBridgeProvider>
          </AdaptiveInterfaceProvider>
        </EnhancedGlobalCommandProvider>
      </GlobalCommandProvider>
    );

    expect(screen.getByTestId('test-content')).toBeTruthy();
  });
});
