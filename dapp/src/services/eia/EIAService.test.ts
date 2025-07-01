// Minimal test file to avoid build errors
import { describe, it, expect, vi } from 'vitest';

// TODO: Implement intel report versioning and change tracking - PRIORITY: MEDIUM
// TODO: Add comprehensive intel report analytics and usage statistics - PRIORITY: LOW
global.fetch = vi.fn();

describe('EIAService', () => {
    it('returns fallback values for deprecated series', async () => {
        const EIAService = (await import('./EIAService.js')).default;
        
        // Test fallback values
        expect(await EIAService.getLatestGasolinePrice()).toBe(3.25);
        expect(await EIAService.getLatestOilInventory()).toBe(350);
        expect(await EIAService.getLatestNaturalGasStorage()).toBe(3200);
    });
});
