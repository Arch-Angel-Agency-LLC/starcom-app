import axios from 'axios';
import { getProxiedUrl } from '../utils/ProxyUtils';

interface MarketData {
  symbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const fetchMarketTrends = async (symbol: string, interval: string = '5min'): Promise<MarketData[]> => {
  try {
    const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
    const response = await axios.get(
      getProxiedUrl(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${apiKey}`)
    );

    const data = response.data;
    if (!data || !data['Time Series (' + interval + ')']) {
      throw new Error('Invalid response format or no data available');
    }

    const timeSeries = data['Time Series (' + interval + ')'];
    return Object.keys(timeSeries).map(timestamp => ({
      symbol,
      timestamp,
      open: parseFloat(timeSeries[timestamp]['1. open']),
      high: parseFloat(timeSeries[timestamp]['2. high']),
      low: parseFloat(timeSeries[timestamp]['3. low']),
      close: parseFloat(timeSeries[timestamp]['4. close']),
      volume: parseInt(timeSeries[timestamp]['5. volume'], 10),
    }));
  } catch (error) {
    console.error('Error fetching market trends:', error);
    throw new Error('Failed to fetch market trends. Please try again later.');
  }
};

export const fetchDailyMarketData = async (symbol: string): Promise<MarketData[]> => {
  try {
    const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
    const response = await axios.get(
      getProxiedUrl(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`)
    );

    const data = response.data;
    if (!data || !data['Time Series (Daily)']) {
      throw new Error('Invalid response format or no data available');
    }

    const timeSeries = data['Time Series (Daily)'];
    return Object.keys(timeSeries).map(timestamp => ({
      symbol,
      timestamp,
      open: parseFloat(timeSeries[timestamp]['1. open']),
      high: parseFloat(timeSeries[timestamp]['2. high']),
      low: parseFloat(timeSeries[timestamp]['3. low']),
      close: parseFloat(timeSeries[timestamp]['4. close']),
      volume: parseInt(timeSeries[timestamp]['5. volume'], 10),
    }));
  } catch (error) {
    console.error('Error fetching daily market data:', error);
    throw new Error('Failed to fetch daily market data. Please try again later.');
  }
};
