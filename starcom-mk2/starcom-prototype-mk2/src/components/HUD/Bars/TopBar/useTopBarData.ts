// src/components/HUD/useTopBarData.ts
import { useState, useEffect } from "react";
import { useGlobeData } from "../../GlobeViewport/GlobeDataProvider";

export function useTopBarData() {
  const { osintReports, cyberThreats } = useGlobeData();
  const [threatLevel, setThreatLevel] = useState("low");
  const [stockSentiment, setStockSentiment] = useState("Neutral");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Determine threat level dynamically
    if (cyberThreats.length > 5) {
      setThreatLevel("high");
    } else if (cyberThreats.length > 2) {
      setThreatLevel("medium");
    } else {
      setThreatLevel("low");
    }
  }, [cyberThreats]);

  useEffect(() => {
    // Fetch Market Sentiment API (Dummy Data for Now)
    const fetchStockData = async () => {
      const sentiment = ["Bullish", "Bearish", "Neutral"];
      setStockSentiment(sentiment[Math.floor(Math.random() * sentiment.length)]);
    };

    fetchStockData();
    const stockInterval = setInterval(fetchStockData, 60000); // Update every minute
    return () => clearInterval(stockInterval);
  }, []);

  return { threatLevel, osintReports, stockSentiment, cyberThreats, currentTime };
}