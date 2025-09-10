import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarketExchangeApplication from '../MarketExchangeApplication';
import { intelReportService } from '../../../services/intel/IntelReportService';

// Mock publishAdapter & packageComposer to avoid heavy work
vi.mock('../../../services/exchange/PackageComposer', () => ({
  packageComposer: {
    composeZip: vi.fn().mockResolvedValue({ manifest: { id: 'm1', assets: [] }, blob: new Blob(['zip']) })
  }
}));
vi.mock('../../../services/exchange/PublishAdapter', () => ({
  publishAdapter: { publish: vi.fn().mockResolvedValue({ id: 'pub1', url: 'ipfs://pub1' }) }
}));

describe('MarketExchange provider integration', () => {
  it('composes using latest intelReportService report when clicking compose button', async () => {
    // Seed two reports
    const r1 = await intelReportService.createReport({
      title: 'ME Draft 1', content: 'Content A', category: 'GENERAL', tags: ['me'], classification: 'UNCLASSIFIED'
    }, 'MarketUser');
    await new Promise(r => setTimeout(r, 5)); // ensure updatedAt ordering difference
    const r2 = await intelReportService.createReport({
      title: 'ME Draft 2', content: 'Content B', category: 'THREAT', tags: ['me','b'], classification: 'UNCLASSIFIED'
    }, 'MarketUser');

    render(<MarketExchangeApplication />);

  // Wait for loading to finish
  await screen.findByText(/Loading Market Data/i);
  // Advance timers if any simulated delay (not using fake timers here; just wait)
  await new Promise(r => setTimeout(r, 1100));
  // Switch to Intelligence Marketplace tab (second tab)
  const marketplaceTab = screen.getByRole('tab', { name: /Intelligence Marketplace/i });
  fireEvent.click(marketplaceTab);
  const btn = await screen.findByRole('button', { name: /Compose & Publish Current Draft/i });
  expect(btn.getAttribute('disabled')).toBe(null);
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/Package published with id/i)).toBeTruthy();
    });
  });
});
