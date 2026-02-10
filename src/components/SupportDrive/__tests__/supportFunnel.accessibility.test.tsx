import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SupportFunnelModal from '../SupportFunnelModal';

describe('SupportFunnelModal accessibility', () => {
  const baseProps = {
    isOpen: true,
    headline: 'Test',
    subhead: 'Sub',
    disclosure: 'disc',
    onClose: vi.fn(),
    onSnooze: vi.fn(),
    onDismiss: vi.fn(),
    onOpenNostr: vi.fn(),
    onOpenFund: vi.fn(),
    onLearnMore: vi.fn(),
    onCopyInvite: vi.fn(),
    fallbackLink: null,
    learnMoreOpen: false,
    learnMoreBody: 'body',
    copyToast: false,
    offline: false,
  };

  it('focuses first control on open and traps focus with Shift+Tab', () => {
    render(<SupportFunnelModal {...baseProps} />);
    const closeBtn = screen.getByRole('button', { name: /close support modal/i });
    const learnToggle = screen.getByRole('button', { name: /why this matters/i });

    // initial focus set to first focusable
    expect(closeBtn).toHaveFocus();

    // shift+tab from first goes to last
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(learnToggle).toHaveFocus();

    // tab from last loops back to first
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeBtn).toHaveFocus();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<SupportFunnelModal {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('respects reduced-motion flag for tests and sets accessibility labels', () => {
    render(<SupportFunnelModal {...baseProps} forceReducedMotion />);
    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveAttribute('data-reduced-motion', 'true');

    // screen reader labels present
    expect(overlay).toHaveAttribute('aria-modal', 'true');
    expect(overlay).toHaveAttribute('aria-label', baseProps.headline);
    expect(screen.getByRole('button', { name: /close support modal/i })).toBeInTheDocument();
  });
});
