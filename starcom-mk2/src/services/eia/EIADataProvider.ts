// EIADataProvider: Implements DataProvider for EIA domain
// Artifacts: data-service-interfaces, data-service-observability, data-service-refactor-plan
import { DataProvider, DataServiceObserver } from '../data-service-interfaces';

export class EIADataProvider implements DataProvider<number> {
  private observer?: DataServiceObserver;

  setObserver(observer: DataServiceObserver) {
    this.observer = observer;
  }

  async fetchData(key: string): Promise<number> {
    this.observer?.onFetchStart?.(key);
    const start = Date.now();
    try {
      // Return a number for known price series keys
      let data: number;
      switch (key) {
        case 'PET.RWTC.W': // Oil price
          data = 80.5;
          break;
        case 'PET.EMM_EPM0_PTE_NUS_DPG.W': // Gasoline price
          data = 3.5;
          break;
        case 'PET.WCRSTUS1.W': // Oil inventory
          data = 1000000;
          break;
        case 'NG.NW2_EPG0_SWO_R48_BCF.W': // Natural gas storage
          data = 2000;
          break;
        default:
          data = 0;
      }
      this.observer?.onFetchEnd?.(key, Date.now() - start);
      return data;
    } catch (error) {
      this.observer?.onError?.(key, error as Error);
      throw error;
    }
  }
}

// AI-NOTE: This is a minimal, artifact-driven implementation. Replace mock logic with real API integration.
