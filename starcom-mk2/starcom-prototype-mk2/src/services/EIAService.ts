import { EIAData } from '../interfaces/EIAData'; // Assuming this exists or we’ll define it

export class EIAService {
  private static readonly API_KEY = import.meta.env.VITE_EIA_API_KEY; // Store in .env
  private static readonly BASE_URL = 'https://api.eia.gov/v2';

  /**
   * Fetches the latest WTI spot price from the EIA API.
   * @returns Promise<number> - Latest price in USD per barrel.
   */
  public static async getLatestOilPrice(): Promise<number> {
    const url = `${this.BASE_URL}/seriesid/PET.RWTC.W?api_key=${this.API_KEY}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: EIAData = await response.json();
      const latestPrice = data.response.data[0]?.value;
      if (latestPrice === undefined) {
        throw new Error('No oil price data available');
      }
      return latestPrice;
    } catch (error) {
      console.error('Error fetching oil price:', error);
      throw error;
    }
  }
}

export default EIAService;