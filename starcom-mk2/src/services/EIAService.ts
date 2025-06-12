import { EIAData } from '../interfaces/EIAData';
import EIADataCacheService from '../cache/EIADataCacheService';

export class EIAService {
    private static readonly API_KEY = import.meta.env.VITE_EIA_API_KEY;
    private static readonly BASE_URL = 'https://api.eia.gov/v2';
    private static readonly cacheService = new EIADataCacheService();

    private static async fetchEIAData(seriesId: string): Promise<number> {
        const cachedData = this.cacheService.getCache().get(seriesId);
        if (cachedData !== null) {
            return cachedData;
        }

        const url = `${this.BASE_URL}/seriesid/${seriesId}?api_key=${this.API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data: EIAData = await response.json();
            const latestValue = data.response.data[0]?.value;
            if (latestValue === undefined) {
                throw new Error(`No data available for ${seriesId}`);
            }
            this.cacheService.getCache().set(seriesId, latestValue);
            return latestValue;
        } catch (error) {
            console.error(`Error fetching ${seriesId}:`, error);
            throw error;
        }
    }

    public static getLatestOilPrice(): Promise<number> {
        return this.fetchEIAData('PET.RWTC.W'); // Weekly WTI spot price
    }

    public static getLatestGasolinePrice(): Promise<number> {
        return this.fetchEIAData('PET.EMM_EPM0_PTE_NUS_DPG.W'); // Weekly gasoline price
    }

    public static getLatestOilInventory(): Promise<number> {
        return this.fetchEIAData('PET.WCRSTUS1.W'); // Weekly crude oil stocks
    }

    public static getLatestNaturalGasStorage(): Promise<number> {
        return this.fetchEIAData('NG.NW2_EPG0_SWO_R48_BCF.W'); // Weekly natural gas storage
    }
}

export default EIAService;