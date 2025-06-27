// Moved from src/__tests__/EIADataProvider.observability.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EIADataProvider } from './EIADataProvider';

describe('EIADataProvider observability', () => {
  it('calls observer hooks on fetch success', async () => {
    const provider = new EIADataProvider();
    const observer = {
      onFetchStart: vi.fn(),
      onFetchEnd: vi.fn(),
      onError: vi.fn(),
    };
    provider.setObserver(observer);
    await provider.fetchData('PET.RWTC.W'); // Use a real EIA key
    expect(observer.onFetchStart).toHaveBeenCalledWith('PET.RWTC.W');
    expect(observer.onFetchEnd).toHaveBeenCalled();
    expect(observer.onError).not.toHaveBeenCalled();
  });

  // TODO: Add tests for observer hooks on fetch error
  // TODO: Assert logs/metrics/traces are emitted as expected (see observability artifact)
  // TODO: Test health check endpoint/method
});
