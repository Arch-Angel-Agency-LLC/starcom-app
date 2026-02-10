import { render, screen } from '@testing-library/react';
import React from 'react';
import SupportFunnelModal from '../SupportFunnelModal';

describe('SupportFunnelModal URL guards', () => {
  const baseProps = {
    isOpen: true,
    headline: 'Test',
    subhead: 'Sub',
    disclosure: 'disc',
    onClose: () => {},
    onSnooze: () => {},
    onDismiss: () => {},
    onOpenNostr: () => {},
    onOpenFund: () => {},
    onLearnMore: () => {},
    onCopyInvite: () => {},
    fallbackLink: null,
    learnMoreOpen: false,
    learnMoreBody: 'body',
    copyToast: false,
    offline: false,
  };

  it('disables fund CTA when missing URL', () => {
    render(<SupportFunnelModal {...baseProps} disableFund />);
    const fundBtn = screen.getByRole('button', { name: /fund the mission/i });
    expect(fundBtn).toBeDisabled();
  });

  it('disables nostr CTA when missing URL', () => {
    render(<SupportFunnelModal {...baseProps} disableNostr />);
    const nostrBtn = screen.getByRole('button', { name: /join the nostr ops/i });
    expect(nostrBtn).toBeDisabled();
  });

  it('shows fallback link when provided', () => {
    render(<SupportFunnelModal {...baseProps} fallbackLink="https://example.com/fallback" />);
    expect(screen.getByText(/pop-up blocked—open link/i)).toBeInTheDocument();
  });
});
