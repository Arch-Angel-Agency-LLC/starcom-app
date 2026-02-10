import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackSupportEvent } from '../../../services/supportFunnelTracking';

describe('support funnel tracking', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs env and session payload data', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    trackSupportEvent({ event: 'funnel_impression', variant: 'test_v', sessionId: 'sess-1', env: 'test', ts: 123 });
    expect(infoSpy).toHaveBeenCalledTimes(2);
    const payload = infoSpy.mock.calls[1][0] as any;
    expect(payload.env).toBe('test');
    expect(payload.sessionId).toBe('sess-1');
    expect(payload.variant).toBe('test_v');
    expect(payload.event).toBe('funnel_impression');
    expect(payload.ts).toBe(123);
  });

  it('falls back to import.meta env when env not provided', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    trackSupportEvent({ event: 'cta_fund_click', variant: null, sessionId: 'sess-2' });
    const payload = infoSpy.mock.calls[1][0] as any;
    expect(payload.env).toBeDefined();
    expect(payload.event).toBe('cta_fund_click');
  });
});
