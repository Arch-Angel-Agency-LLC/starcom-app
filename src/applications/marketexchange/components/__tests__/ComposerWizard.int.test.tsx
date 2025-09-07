import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../../services/intel/IntelReportService', () => {
  return {
    intelReportService: {
      getReport: vi.fn(),
      listReports: vi.fn(),
    },
  };
});

vi.mock('../../../../services/exchange/PackageComposer', () => {
  return {
    packageComposer: {
      composeZip: vi.fn(),
    },
  };
});

vi.mock('../../../../services/exchange/PublishAdapter', () => {
  return {
    publishAdapter: {
      publish: vi.fn(),
    },
  };
});

vi.mock('../../../../services/exchange/telemetry', () => {
  return {
    emitComposeEvent: vi.fn(),
  };
});

import { intelReportService } from '../../../../services/intel/IntelReportService';
import { packageComposer } from '../../../../services/exchange/PackageComposer';
import { publishAdapter } from '../../../../services/exchange/PublishAdapter';
import { emitComposeEvent } from '../../../../services/exchange/telemetry';
import { ComposerWizard } from '../ComposerWizard';

describe('ComposerWizard integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage between tests
    localStorage.clear();
  });

  it('publishes from Draft path and calls onPublished with mock id/url', async () => {
    // Mock listReports with a recent DRAFT
    const report = {
      id: 'draft-1',
      title: 'Sample Draft',
      summary: 'S1',
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      updatedAt: new Date(),
    } as any;
    (intelReportService.listReports as any).mockResolvedValue([report]);
    (packageComposer.composeZip as any).mockResolvedValue({
      manifest: { id: 'pkg-123', assets: [] },
      blob: new Blob(['zip']),
    });
    (publishAdapter.publish as any).mockResolvedValue({ id: 'pub-1', url: 'https://example.test/p/pub-1' });

    const onPublished = vi.fn();
    render(<ComposerWizard open onClose={() => {}} onPublished={onPublished} />);

    // Wait for initial draft to load
    await screen.findByText(/Using draft\/report: Sample Draft/i);

    // Walk through steps to Publish
    const user = userEvent.setup();
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /next/i }));
    }

    await user.click(screen.getByRole('button', { name: /publish/i }));

    await waitFor(() => expect(onPublished).toHaveBeenCalledWith({ id: 'pub-1', url: 'https://example.test/p/pub-1' }));

    // Telemetry should be emitted for started/validated/published
    const events = (emitComposeEvent as any).mock.calls.map((c: any[]) => c[0]?.type);
    expect(events).toContain('compose_started');
    expect(events).toContain('compose_validated');
    expect(events).toContain('compose_published');
  });

  it('shows error when Board pins source has no pins', async () => {
    // Switch to boardPins and try publishing
    (packageComposer.composeZip as any).mockResolvedValue({
      manifest: { id: 'pkg-123', assets: [] },
      blob: new Blob(['zip']),
    });
    (publishAdapter.publish as any).mockResolvedValue({ id: 'pub-1' });

    render(<ComposerWizard open onClose={() => {}} />);

    // Change source to Board pins
    const user = userEvent.setup();
    const boardPinsRadio = await screen.findByRole('radio', { name: /use active board pins/i });
    await user.click(boardPinsRadio);

    // Advance to publish
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /next/i }));
    }
    await user.click(screen.getByRole('button', { name: /publish/i }));

    // Expect an error about missing boards or pins
    await screen.findByText(/no boards found|no pinned items/i);
  });
});
