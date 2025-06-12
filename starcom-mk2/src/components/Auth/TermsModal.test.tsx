// Tests for TermsModal and terms acceptance flows
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TermsModal from './TermsModal';
import { vi } from 'vitest';

describe('TermsModal Flows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows TermsModal if terms not accepted', () => {
    const onAccept = vi.fn();
    render(<TermsModal onAccept={onAccept} />);
    expect(screen.getByText(/Terms & Conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/I Accept/i)).toBeInTheDocument();
  });

  it('accepts terms and calls onAccept', () => {
    const onAccept = vi.fn();
    render(<TermsModal onAccept={onAccept} />);
    fireEvent.click(screen.getByText(/I Accept/i));
    expect(onAccept).toHaveBeenCalled();
    expect(screen.queryByText(/Terms & Conditions/i)).not.toBeInTheDocument();
  });

  it('does not show TermsModal if terms already accepted', () => {
    localStorage.setItem('starcom-terms-accepted', 'true');
    const onAccept = vi.fn();
    render(<TermsModal onAccept={onAccept} />);
    expect(screen.queryByText(/Terms & Conditions/i)).not.toBeInTheDocument();
  });

  it('TermsModal cannot be accepted twice', () => {
    const onAccept = vi.fn();
    render(<TermsModal onAccept={onAccept} />);
    const acceptButton = screen.getByText(/I Accept/i);
    fireEvent.click(acceptButton);
    expect(screen.queryByText(/I Accept/i)).not.toBeInTheDocument();
  });
});
