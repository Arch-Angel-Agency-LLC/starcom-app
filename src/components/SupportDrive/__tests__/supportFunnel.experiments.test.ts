import { describe, it, expect, beforeEach } from 'vitest';
import { getExperimentContext } from '../../../services/supportFunnelExperiments';

const baseConfig = {
  experimentEnabled: true,
  experimentVariant: null as string | null,
  experimentVariants: ['baseline_v1', 'alt_v1'],
};

describe('support funnel experiments', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('returns null variant when experiment disabled', () => {
    const ctx = getExperimentContext({ ...baseConfig, experimentEnabled: false });
    expect(ctx.variant).toBeNull();
  });

  it('respects forced variant override', () => {
    const ctx = getExperimentContext({ ...baseConfig, experimentVariant: 'forced_v1' });
    expect(ctx.variant).toBe('forced_v1');
  });

  it('stably seeds a variant per session id', () => {
    localStorage.setItem('support_funnel_session_v1', 'fixed-session');
    const first = getExperimentContext(baseConfig);
    const second = getExperimentContext(baseConfig);
    expect(first.sessionId).toBe('fixed-session');
    expect(second.sessionId).toBe('fixed-session');
    expect(first.variant).toBe(second.variant);
    expect(baseConfig.experimentVariants).toContain(first.variant as string);
  });
});
