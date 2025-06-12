// LegacyEIAServiceAdapter: Adapter for legacy static API
// Artifacts: data-service-refactor-plan, data-service-interfaces, data-service-testing-strategy
import { EIAService } from '../EIAService';
import { EIADataProvider } from './EIADataProvider';
import { EIADataCacheService } from './EIADataCacheService';

export class LegacyEIAServiceAdapter {
  private service: EIAService;

  constructor(
    provider: EIADataProvider = new EIADataProvider(),
    cache: EIADataCacheService = new EIADataCacheService()
  ) {
    this.service = new EIAService(provider, cache);
  }

  async getLatestOilPrice(): Promise<number> {
    return this.service.fetchEIAData('PET.RWTC.W');
  }

  async getLatestGasolinePrice(): Promise<number> {
    return this.service.fetchEIAData('PET.EMM_EPM0_PTE_NUS_DPG.W');
  }

  async getLatestOilInventory(): Promise<number> {
    return this.service.fetchEIAData('PET.WCRSTUS1.W');
  }

  async getLatestNaturalGasStorage(): Promise<number> {
    return this.service.fetchEIAData('NG.NW2_EPG0_SWO_R48_BCF.W');
  }
}

// AI-NOTE: This adapter preserves the legacy API shape but delegates to the new artifact-driven service.
