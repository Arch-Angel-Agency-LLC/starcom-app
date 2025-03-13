// src/__tests__/EIAService.test.ts
import { getEIAData } from '../services/EIAService';
import { fetchEIAData } from '../api/eia';

jest.mock('../api/eia', () => ({
    fetchEIAData: jest.fn(),
}));

describe('EIA API Service', () => {
    it('fetches and caches data correctly', async () => {
        const mockData = [{ period: '2025-02-28', value: '69.93', product: 'EPCWTI', series: 'RWTC' }];
        
        (fetchEIAData as jest.Mock).mockResolvedValue(mockData);

        const data = await getEIAData('petroleum/pri/spt/data/', { product: 'EPCWTI', length: '1' });

        expect(data).toEqual(mockData);
        expect(fetchEIAData).toHaveBeenCalledTimes(1);
    });

    it('returns cached data instead of refetching', async () => {
        const mockData = [{ period: '2025-02-28', value: '69.93', product: 'EPCWTI', series: 'RWTC' }];
        
        const data = await getEIAData('petroleum/pri/spt/data/', { product: 'EPCWTI', length: '1' });

        expect(data).toEqual(mockData);
        expect(fetchEIAData).toHaveBeenCalledTimes(1);
    });
});