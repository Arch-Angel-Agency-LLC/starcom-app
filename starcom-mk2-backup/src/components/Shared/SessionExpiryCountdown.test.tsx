import { render, act } from '@testing-library/react';
import SessionExpiryCountdown from './SessionExpiryCountdown';

describe('SessionExpiryCountdown', () => {
  it('renders and updates countdown, triggers onWarning and onExpire', () => {
    vi.useFakeTimers();
    const expiry = Date.now() + 2000;
    const onWarning = vi.fn();
    const onExpire = vi.fn();
    const { container } = render(
      <SessionExpiryCountdown expiry={expiry} onWarning={onWarning} onExpire={onExpire} warningThreshold={1000} />
    );
    expect(container.querySelector('.session-expiry-countdown')).toBeTruthy();
    // Advance to just before warning
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(onWarning).not.toHaveBeenCalled();
    // Advance into warning threshold
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onWarning).toHaveBeenCalled();
    // Advance to expiry
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpire).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
