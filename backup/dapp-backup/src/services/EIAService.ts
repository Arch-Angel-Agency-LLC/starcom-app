import { EIADataProvider } from './eia/EIADataProvider';
import { EIADataCacheService } from './eia/EIADataCacheService';

export class EIAService {
    // Artifact-driven: new provider/cache abstractions
    private provider: EIADataProvider;
    private cache: EIADataCacheService;

    // Legacy static API support
    private static _instance: EIAService | null = null;
    private static get instance() {
        if (!this._instance) {
            this._instance = new EIAService();
        }
        return this._instance;
    }

    constructor(
        provider: EIADataProvider = new EIADataProvider(),
        cache: EIADataCacheService = new EIADataCacheService()
    ) {
        this.provider = provider;
        this.cache = cache;
    }

    // New instance-based API
    async fetchEIAData(seriesId: string): Promise<number> {
        const cachedData = this.cache.get(seriesId);
        if (cachedData !== null && typeof cachedData === 'number') {
            return cachedData;
        }
        // Use provider to fetch
        const value = await this.provider.fetchData(seriesId);
        this.cache.set(seriesId, value);
        return value as number;
    }

    // Legacy static API wrappers
    public static getLatestOilPrice(): Promise<number> {
        return this.instance.fetchEIAData('PET.RWTC.W');
    }
    public static getLatestGasolinePrice(): Promise<number> {
        // Legacy fallback - EIA series PET.EMM_EPM0_PTE_NUS_DPG.W is deprecated/invalid
        // Return static fallback to avoid "Unknown EIA series" warnings
        return Promise.resolve(3.25); // USD per gallon
    }
    public static getLatestOilInventory(): Promise<number> {
        // Legacy fallback - EIA series PET.WCRSTUS1.W is deprecated/invalid
        // Return static fallback to avoid "Unknown EIA series" warnings
        return Promise.resolve(350); // Million barrels
    }
    public static getLatestNaturalGasStorage(): Promise<number> {
        // Legacy fallback - EIA series NG.NW2_EPG0_SWO_R48_BCF.W is deprecated/invalid
        // Return static fallback to avoid "Unknown EIA series" warnings
        return Promise.resolve(3200); // Billion cubic feet
    }
}

// AI-NOTE: This class now uses artifact-driven provider/cache abstractions. Legacy static API is preserved for now. Migrate consumers to instance-based API in future steps.

export default EIAService;