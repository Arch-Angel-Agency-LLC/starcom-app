// EIADataProvider: Implements DataProvider for EIA domain
// Artifacts: data-service-interfaces, data-service-observability, data-service-refactor-plan
import { DataProvider, DataServiceObserver } from '../data-service-interfaces';
import { fetchEIAData } from '../../api/eia';

export class EIADataProvider implements DataProvider<number> {
  private observer?: DataServiceObserver;

  setObserver(observer: DataServiceObserver) {
    this.observer = observer;
  }

  async fetchData(key: string): Promise<number> {
    this.observer?.onFetchStart?.(key);
    const start = Date.now();
    try {
      // Map key to EIA v2 API endpoint and params
      let endpoint = '';
      const params: Record<string, string> = {};
      switch (key) {
        case 'PET.RWTC.W': // Oil price (WTI)
          endpoint = 'seriesid/PET.RWTC.W';
          break;
        case 'PET.EMM_EPM0_PTE_NUS_DPG.W': // Gasoline price
          endpoint = 'seriesid/PET.EMM_EPM0_PTE_NUS_DPG.W';
          break;
        case 'PET.WCRSTUS1.W': // Oil inventory
          endpoint = 'seriesid/PET.WCRSTUS1.W';
          break;
        case 'NG.NW2_EPG0_SWO_R48_BCF.W': // Natural gas storage
          endpoint = 'seriesid/NG.NW2_EPG0_SWO_R48_BCF.W';
          break;
        default:
          throw new Error('Unknown EIA series key: ' + key);
      }
      const dataArr = await fetchEIAData(endpoint, params);
      if (!dataArr || !Array.isArray(dataArr) || dataArr.length === 0) {
        throw new Error('No EIA data returned for ' + key);
      }
      // EIA API returns array of { period, value }
      const latest = dataArr[0];
      const value = typeof latest.value === 'number' ? latest.value : parseFloat(latest.value);
      if (isNaN(value)) throw new Error('Invalid EIA value for ' + key);
      this.observer?.onFetchEnd?.(key, Date.now() - start);
      return value;
    } catch (error) {
      this.observer?.onError?.(key, error as Error);
      throw error;
    }
  }
}

// AI-NOTE: This is a minimal, artifact-driven implementation. Replace mock logic with real API integration.
