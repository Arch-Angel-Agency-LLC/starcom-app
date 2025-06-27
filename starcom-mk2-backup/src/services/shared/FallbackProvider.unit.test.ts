// Moved from src/__tests__/FallbackProvider.unit.test.ts
// FallbackProvider unit tests (artifact-driven)
// Artifacts: data-service-interfaces, data-service-testing-strategy
import { describe, it, expect, vi } from 'vitest';
import { FallbackProvider } from '../data-service-interfaces';

describe('FallbackProvider', () => {
  it('returns data from the first successful provider', async () => {
    const provider1 = { fetchData: vi.fn().mockRejectedValue(new Error('fail')) };
    const provider2 = { fetchData: vi.fn().mockResolvedValue('ok') };
    const fallback = new FallbackProvider([provider1, provider2]);
    const result = await fallback.fetchData('key');
    expect(result).toBe('ok');
  });

  it('throws if all providers fail', async () => {
    const provider1 = { fetchData: vi.fn().mockRejectedValue(new Error('fail1')) };
    const provider2 = { fetchData: vi.fn().mockRejectedValue(new Error('fail2')) };
    const fallback = new FallbackProvider([provider1, provider2]);
    await expect(fallback.fetchData('key')).rejects.toThrow('All providers failed');
  });

  // TODO: Add tests for observer hooks (see observability artifact)
  // TODO: Add tests for streaming/subscription support (see interfaces artifact)
});
