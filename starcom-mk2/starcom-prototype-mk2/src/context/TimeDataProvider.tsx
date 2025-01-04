import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types
interface TimeDataContextProps {
  currentTime: number;
  isLive: boolean;
  setCurrentTime: (time: number) => void;
  toggleLive: () => void;
  fetchDataForTime: (time: number) => Promise<void>;
  error: string | null;
}

interface CacheEntry {
  timestamp: number;
  data: Array<{ lat: number; lng: number; size: number; color: string; timestamp: number }>;
}

// Create Context
const TimeDataContext = createContext<TimeDataContextProps | undefined>(undefined);

export const TimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isLive, setIsLive] = useState<boolean>(true);
  const [dataCache, setDataCache] = useState<Map<number, CacheEntry>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      setCurrentTime(Date.now());
    }
  };

  const fetchDataForTime = async (time: number): Promise<void> => {
    if (dataCache.has(time)) return; // Use cached data if available

    try {
      setError(null);
      const data = await fetchHistoricalData(time);
      setDataCache((prev) => new Map(prev).set(time, { timestamp: Date.now(), data }));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data for the selected time.');
    }
  };

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      fetchDataForTime(now);
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <TimeDataContext.Provider
      value={{
        currentTime,
        isLive,
        setCurrentTime,
        toggleLive,
        fetchDataForTime,
        error,
      }}
    >
      {children}
    </TimeDataContext.Provider>
  );
};

export const useTimeData = () => {
  const context = useContext(TimeDataContext);
  if (!context) {
    throw new Error('useTimeData must be used within a TimeDataProvider');
  }
  return context;
};

// Example API call for historical data
async function fetchHistoricalData(time: number): Promise<CacheEntry['data']> {
  // Replace this with your actual API call
  return Promise.resolve([
    { lat: 40.7128, lng: -74.006, size: 1, color: 'red', timestamp: time },
  ]);
}