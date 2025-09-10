import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

// Mock wallet adapter
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: { toString: () => 'test-author' } })
}));

// Mock intelReportService
const listReportsMock = vi.fn().mockResolvedValue([]);
const onChangeMock = vi.fn().mockReturnValue(() => {});
const createReportMock = vi.fn().mockResolvedValue({ id: 'intel-xyz', title: 'x', content: 'y', author: 'test-author', category: 'OSINT', tags: [], createdAt: new Date(), updatedAt: new Date(), classification: 'UNCLASSIFIED', status: 'DRAFT' });

vi.mock('../../../services/intel/IntelReportService', () => ({
  intelReportService: {
    listReports: (...args) => listReportsMock(...args),
    onChange: (...args) => onChangeMock(...args),
    createReport: (...args) => createReportMock(...args)
  }
}));

import IntelDashboardPopup from '../IntelDashboardPopup';

describe('IntelDashboardPopup (service integration)', () => {
  beforeEach(() => {
    listReportsMock.mockClear();
    onChangeMock.mockClear();
    createReportMock.mockClear();
  });

  it('loads via intelReportService and creates a new report through the service', async () => {
    render(<IntelDashboardPopup onClose={() => {}} />);

  // Initial load
  await waitFor(() => expect(listReportsMock).toHaveBeenCalledTimes(1));

  // Wait for dashboard UI to appear
  await screen.findByText('Intelligence Dashboard');

    // Open create form
  const newBtn = await screen.findByRole('button', { name: /\+ New Report/i });
  fireEvent.click(newBtn);

    // Fill out form
    fireEvent.change(screen.getByPlaceholderText('Enter report title...'), { target: { value: 'Service Report' } });
    fireEvent.change(screen.getByPlaceholderText('Enter report content and analysis...'), { target: { value: 'Service-backed content' } });
    fireEvent.change(screen.getByPlaceholderText('threat-intel, malware, campaign...'), { target: { value: 'a,b' } });

    // Submit
  const modal = await screen.findByText('Create Intelligence Report');
  const modalRoot = modal.closest('div') as HTMLElement;
  const createBtn = within(modalRoot.parentElement as HTMLElement).getByRole('button', { name: /Create Report/i });
  fireEvent.click(createBtn);

    await waitFor(() => {
      expect(createReportMock).toHaveBeenCalledTimes(1);
    });

    const [inputArg, authorArg] = createReportMock.mock.calls[0];
    expect(authorArg).toBe('test-author');
    expect(inputArg).toMatchObject({
      title: 'Service Report',
      content: 'Service-backed content',
      category: 'OSINT',
      tags: ['a', 'b'],
      classification: 'UNCLASSIFIED',
      status: 'DRAFT'
    });

    // After create, list should be refreshed
    await waitFor(() => {
      expect(listReportsMock).toHaveBeenCalledTimes(2);
    });

    // Success toast
    await screen.findByText('Intelligence report created successfully!');
  });
});
