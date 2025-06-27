// Moved from src/__tests__/EIAService.test.ts
// Test for EIAService (artifact-driven, colocated)
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

describe('EIAService', () => {
    let CacheManager: unknown;

    beforeEach(async () => {
        vi.resetModules();
        CacheManager = (await import('../../cache/CacheManager')).default;
        const instance = (CacheManager as { getInstance(): unknown }).getInstance();
        const caches = Reflect.get(instance as object, 'caches');
        if (caches && typeof caches.clear === 'function') {
            caches.clear();
        }
        vi.clearAllMocks();
    });

    afterEach(async () => {
        const CacheManager = (await import('../../cache/CacheManager')).default;
        const instance = (CacheManager as { getInstance(): unknown }).getInstance();
        const caches = Reflect.get(instance as object, 'caches');
        if (caches && typeof caches.clear === 'function') {
            caches.clear();
        }
    });

    it('fetches the latest oil price successfully', async () => {
        const EIAService = (await import('./EIAService.js')).default;
        const mockResponse = {
        response: {
            total: '1',
            dateFormat: 'YYYY-MM-DD',
            frequency: 'weekly',
            data: [{ period: '2025-03-07', value: 67.52 }],
        },
        request: { command: '/v2/seriesid/PET.RWTC.W', params: {} },
        apiVersion: '2.1.8',
        };

        (fetch as unknown as { mockResolvedValueOnce: (value: unknown) => void }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        });

        await EIAService.getLatestOilPrice();
        expect(fetch).toHaveBeenCalledWith(
        `https://api.eia.gov/v2/seriesid/PET.RWTC.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`
        );
    });

    it('fetches the latest gasoline price successfully', async () => {
        const EIAService = (await import('./EIAService.js')).default;
        const mockResponse = {
        response: {
            total: '1',
            dateFormat: 'YYYY-MM-DD',
            frequency: 'weekly',
            data: [{ period: '2025-03-07', value: 67.52 }],
        },
        request: { command: '/v2/seriesid/PET.EMM_EPM0_PTE_NUS_DPG.W', params: {} },
        apiVersion: '2.1.8',
        };

        (fetch as unknown as { mockResolvedValueOnce: (value: unknown) => void }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        });

        await EIAService.getLatestGasolinePrice();
        expect(fetch).toHaveBeenCalledWith(
        `https://api.eia.gov/v2/seriesid/PET.EMM_EPM0_PTE_NUS_DPG.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`
        );
    });

    it('fetches the latest oil inventory successfully', async () => {
        const EIAService = (await import('./EIAService.js')).default;
        const mockResponse = {
        response: {
            total: '1',
            dateFormat: 'YYYY-MM-DD',
            frequency: 'weekly',
            data: [{ period: '2025-03-07', value: 67.52 }],
        },
        request: { command: '/v2/seriesid/PET.WCRSTUS1.W', params: {} },
        apiVersion: '2.1.8',
        };

        (fetch as unknown as { mockResolvedValueOnce: (value: unknown) => void }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        });

        await EIAService.getLatestOilInventory();
        expect(fetch).toHaveBeenCalledWith(
        `https://api.eia.gov/v2/seriesid/PET.WCRSTUS1.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`
        );
    });

    it('handles fetch errors', async () => {
        const EIAService = (await import('./EIAService.js')).default;
        (fetch as unknown as { mockRejectedValueOnce: (value: unknown) => void }).mockRejectedValueOnce(new Error('Network error'));
        await expect(EIAService.getLatestOilPrice()).rejects.toThrow('Network error');
    });
});
