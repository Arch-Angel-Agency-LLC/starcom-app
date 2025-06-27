// src/components/HUD/useTopBarData.ts
import { useState, useEffect } from "react";
import { useEIAData } from '../../../../hooks/useEIAData';

export function useTopBarData() {
  // Commodities (Oil price)
  const { oilPrice } = useEIAData();

  // Indices, Crypto, Forex, Economic (mocked for now, replace with real API calls)
  const [indices, setIndices] = useState<string>('S&P500 +0.5%');
  const [crypto, setCrypto] = useState<string>('BTC $67k');
  const [forex, setForex] = useState<string>('USD/EUR 1.09');
  const [economic, setEconomic] = useState<string>('CPI 3.2%');
  const [news, setNews] = useState<string>('Fed holds rates steady');
  const [stockSentiment, setStockSentiment] = useState<string>('Neutral');
  const [loading, setLoading] = useState<boolean>(true);

  // Example: fetch market data (mocked)
  useEffect(() => {
    // TODO: Replace with real API calls
    setIndices('S&P500 +0.5%');
    setCrypto('BTC $67k');
    setForex('USD/EUR 1.09');
    setEconomic('CPI 3.2%');
    setNews('Fed holds rates steady');
    setLoading(false);
  }, []);

  // Market sentiment (randomized for now)
  useEffect(() => {
    const fetchStockData = async () => {
      const sentiment = ["Bullish", "Bearish", "Neutral"];
      setStockSentiment(sentiment[Math.floor(Math.random() * sentiment.length)]);
    };
    fetchStockData();
    const stockInterval = setInterval(fetchStockData, 60000);
    return () => clearInterval(stockInterval);
  }, []);

  // Commodities string
  const commodities = oilPrice !== null ? `Oil $${oilPrice}` : 'Loading...';

  return {
    commodities,
    indices,
    crypto,
    forex,
    economic,
    news,
    sentiment: stockSentiment,
    loading
  };
}