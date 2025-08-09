import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MarketTable from '../../src/components/Marketplace/MarketTable';
import { MarketplaceContext } from '../../src/context/MarketplaceContextObject';

// Mock runtime config to toggle flag
vi.mock('../../src/config/runtimeConfig', () => ({
  loadRuntimeConfig: async () => ({ features: { marketplaceServerlessMVP: false } })
}));

// Provide minimal marketplace context value
const ctxValue = {
  marketData: [{ id: 'listing-1', name: 'Sample', price: 5, volume: 0 }],
  isLoading: false,
  error: null,
  refreshMarketData: async () => {}
};

describe('Marketplace flag off state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables Buy button when marketplaceServerlessMVP is false', async () => {
    render(
      <MarketplaceContext.Provider value={ctxValue as any}>
        <MarketTable />
      </MarketplaceContext.Provider>
    );
    const btn = await screen.findByText('Buy');
    expect(btn).toBeDisabled();
  });
});
