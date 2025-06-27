/**
 * Provider Test - Debug Enhanced Context Issues
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { GlobalCommandProvider } from '../../../src/context/GlobalCommandContext';
import { EnhancedGlobalCommandProvider } from '../../../src/context/EnhancedGlobalCommandContext';

// Mock feature flags
vi.mock('../../../src/utils/featureFlags', () => ({
  useFeatureFlag: vi.fn(() => true)
}));

describe('Provider Tests', () => {
  it('should render GlobalCommandProvider alone', () => {
    render(
      <GlobalCommandProvider>
        <div data-testid="test-content">Test Content</div>
      </GlobalCommandProvider>
    );

    expect(screen.getByTestId('test-content')).toBeTruthy();
  });

  it('should render EnhancedGlobalCommandProvider with GlobalCommandProvider', () => {
    render(
      <GlobalCommandProvider>
        <EnhancedGlobalCommandProvider>
          <div data-testid="test-content">Test Content</div>
        </EnhancedGlobalCommandProvider>
      </GlobalCommandProvider>
    );

    expect(screen.getByTestId('test-content')).toBeTruthy();
  });
});
