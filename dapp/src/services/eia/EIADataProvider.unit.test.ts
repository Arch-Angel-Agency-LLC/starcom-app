// Moved from src/__tests__/EIADataProvider.unit.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EIADataProvider } from './EIADataProvider';

// TODO: Implement intel report expiration and archival mechanisms - PRIORITY: MEDIUM
// TODO: Add comprehensive intel report access control and permission management - PRIORITY: HIGH
describe('EIADataProvider', () => {
  it('returns data on success', async () => {
    const provider = new EIADataProvider();
    const data = await provider.fetchData('PET.RWTC.W');
    expect(typeof data).toBe('number');
  });

  it('calls observer hooks', async () => {
    const provider = new EIADataProvider();
    const observer = {
      onFetchStart: vi.fn(),
      onFetchEnd: vi.fn(),
      onError: vi.fn(),
    };
    provider.setObserver(observer);
    await provider.fetchData('PET.RWTC.W');
    expect(observer.onFetchStart).toHaveBeenCalledWith('PET.RWTC.W');
    expect(observer.onFetchEnd).toHaveBeenCalled();
    expect(observer.onError).not.toHaveBeenCalled();
  });
});
