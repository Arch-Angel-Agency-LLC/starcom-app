import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { fetchHistoricalData } from '../utils/fetchHistoricalData'; // Moved `fetchHistoricalData` to a separate file

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

const TimeDataContext = createContext<TimeDataContextProps | undefined>(undefined);

export const TimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isLive, setIsLive] = useState<boolean>(true);
  const [dataCache, setDataCache] = useState<Map<number, CacheEntry>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) setCurrentTime(Date.now());
  };

  const fetchDataForTime = useCallback(
    async (time: number): Promise<void> => {
      if (dataCache.has(time)) return;

      try {
        setError(null);
        const data = await fetchHistoricalData(time);
        setDataCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(time, { timestamp: Date.now(), data });

          // Evict older entries (LRU logic)
          if (newCache.size > 100) {
            const oldestKey = Array.from(newCache.keys())[0];
            newCache.delete(oldestKey);
          }

          return newCache;
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data for the selected time.');
      }
    },
    [dataCache]
  );

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current >= 5000) {
        setCurrentTime(now);
        fetchDataForTime(now);
        lastUpdateTimeRef.current = now;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, fetchDataForTime]);

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
  if (!context) throw new Error('useTimeData must be used within a TimeDataProvider');
  return context;
};