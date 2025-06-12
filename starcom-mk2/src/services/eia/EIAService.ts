// Minimal EIAService implementation for testing
class EIAService {
  static async getLatestOilPrice() {
    const url = `https://api.eia.gov/v2/seriesid/PET.RWTC.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      // Defensive: extract value from EIA API response
      const value = data?.response?.data?.[0]?.value;
      if (typeof value !== 'number') throw new Error('Invalid oil price data');
      return value;
    } catch (err) {
      throw err;
    }
  }

  static async getLatestGasolinePrice() {
    const url = `https://api.eia.gov/v2/seriesid/PET.EMM_EPM0_PTE_NUS_DPG.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const value = data?.response?.data?.[0]?.value;
      if (typeof value !== 'number') throw new Error('Invalid gasoline price data');
      return value;
    } catch (err) {
      throw err;
    }
  }

  static async getLatestOilInventory() {
    const url = `https://api.eia.gov/v2/seriesid/PET.WCRSTUS1.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const value = data?.response?.data?.[0]?.value;
      if (typeof value !== 'number') throw new Error('Invalid oil inventory data');
      return value;
    } catch (err) {
      throw err;
    }
  }

  static async getLatestNaturalGasStorage() {
    const url = `https://api.eia.gov/v2/seriesid/NG.NW2_EPG0_SWO_R48_BCF.W?api_key=${import.meta.env.VITE_EIA_API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const value = data?.response?.data?.[0]?.value;
      if (typeof value !== 'number') throw new Error('Invalid natural gas storage data');
      return value;
    } catch (err) {
      throw err;
    }
  }
}

export default EIAService;
