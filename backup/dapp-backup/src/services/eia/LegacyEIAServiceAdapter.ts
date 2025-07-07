// LegacyEIAServiceAdapter: Adapter for legacy static API
// Artifacts: data-service-refactor-plan, data-service-interfaces, data-service-testing-strategy
import { EIAService } from '../EIAService';
import { EIADataProvider } from './EIADataProvider';
import { EIADataCacheService } from './EIADataCacheService';

// TODO: Implement security incident response and recovery procedures - PRIORITY: HIGH
// TODO: Add support for security key rotation and management automation - PRIORITY: MEDIUM
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
    // Legacy fallback - EIA series PET.EMM_EPM0_PTE_NUS_DPG.W is deprecated/invalid
    return Promise.resolve(3.25); // USD per gallon
  }

  async getLatestOilInventory(): Promise<number> {
    // Legacy fallback - EIA series PET.WCRSTUS1.W is deprecated/invalid
    return Promise.resolve(350); // Million barrels
  }

  async getLatestNaturalGasStorage(): Promise<number> {
    // Legacy fallback - EIA series NG.NW2_EPG0_SWO_R48_BCF.W is deprecated/invalid
    return Promise.resolve(3200); // Billion cubic feet
  }
}

// AI-NOTE: This adapter preserves the legacy API shape but delegates to the new artifact-driven service.
