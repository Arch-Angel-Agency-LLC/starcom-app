import { describe, it, expect, vi } from 'vitest';
import EIAService from '../services/EIAService';
import { EIAData } from '../interfaces/EIAData';

// Mock fetch
global.fetch = vi.fn();

describe('EIAService', () => {
    it('fetches the latest oil price successfully', async () => {
        const mockResponse: EIAData = {
        response: {
            total: '1',
            dateFormat: 'YYYY-MM-DD',
            frequency: 'weekly',
            data: [{ period: '2025-03-07', value: 67.52 }],
        },
        request: { command: '/v2/seriesid/PET.RWTC.W', params: {} },
        apiVersion: '2.1.8',
        };

        (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        });

        await EIAService.getLatestOilPrice();
        expect(fetch).toHaveBeenCalledWith(
        `https://api.eia.gov/v2/seriesid/PET.RWTC.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`
        );
    });

    it('fetches the latest gasoline price successfully', async () => {
        const mockResponse: EIAData = {
        response: {
            total: '1',
            dateFormat: 'YYYY-MM-DD',
            frequency: 'weekly',
            data: [{ period: '2025-03-07', value: 67.52 }],
        },
        request: { command: '/v2/seriesid/PET.EMM_EPM0_PTE_NUS_DPG.W', params: {} },
        apiVersion: '2.1.8',
        };

        (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        });

        await EIAService.getLatestGasolinePrice();
        expect(fetch).toHaveBeenCalledWith(
        `https://api.eia.gov/v2/seriesid/PET.EMM_EPM0_PTE_NUS_DPG.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`
        );
    });

    it('fetches the latest oil inventory successfully', async () => {
        const mockResponse: EIAData = {
        response: {
            total: '1',
            dateFormat: 'YYYY-MM-DD',
            frequency: 'weekly',
            data: [{ period: '2025-03-07', value: 67.52 }],
        },
        request: { command: '/v2/seriesid/PET.WCRSTUS1.W', params: {} },
        apiVersion: '2.1.8',
        };

        (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        });

        await EIAService.getLatestOilInventory();
        expect(fetch).toHaveBeenCalledWith(
        `https://api.eia.gov/v2/seriesid/PET.WCRSTUS1.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`
        );
    });

    it('fetches the latest natural gas storage successfully', async () => {
        const mockResponse: EIAData = {
        response: {
            total: '1',
            dateFormat: 'YYYY-MM-DD',
            frequency: 'weekly',
            data: [{ period: '2025-03-07', value: 67.52 }],
        },
        request: { command: '/v2/seriesid/NG.NW2_EPG0_SWO_R48_BCF.W', params: {} },
        apiVersion: '2.1.8',
        };

        (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        });

        await EIAService.getLatestNaturalGasStorage();
        expect(fetch).toHaveBeenCalledWith(
        `https://api.eia.gov/v2/seriesid/NG.NW2_EPG0_SWO_R48_BCF.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`
        );
    });

    it('handles fetch errors', async () => {
        (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        });

        await expect(EIAService.getLatestOilPrice()).rejects.toThrow('HTTP error! Status: 404');
    });
});