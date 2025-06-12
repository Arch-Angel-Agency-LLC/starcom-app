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
        if (cachedData !== null) {
            return cachedData;
        }
        // Use provider to fetch
        const data = await this.provider.fetchData(seriesId);
        // Assume data.value for compatibility (mock returns {key, data})
        const value = (data && data.value !== undefined) ? data.value : data.data;
        this.cache.set(seriesId, value);
        return value;
    }

    // Legacy static API wrappers
    public static getLatestOilPrice(): Promise<number> {
        return this.instance.fetchEIAData('PET.RWTC.W');
    }
    public static getLatestGasolinePrice(): Promise<number> {
        return this.instance.fetchEIAData('PET.EMM_EPM0_PTE_NUS_DPG.W');
    }
    public static getLatestOilInventory(): Promise<number> {
        return this.instance.fetchEIAData('PET.WCRSTUS1.W');
    }
    public static getLatestNaturalGasStorage(): Promise<number> {
        return this.instance.fetchEIAData('NG.NW2_EPG0_SWO_R48_BCF.W');
    }
}

// AI-NOTE: This class now uses artifact-driven provider/cache abstractions. Legacy static API is preserved for now. Migrate consumers to instance-based API in future steps.

export default EIAService;