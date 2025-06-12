import { useState, useEffect } from 'react';
import EIAService from '../services/EIAService';

export const useEIAData = () => {
  const [oilPrice, setOilPrice] = useState<number | null>(null);
  const [gasolinePrice, setGasolinePrice] = useState<number | null>(null);
  const [oilInventory, setOilInventory] = useState<number | null>(null);
  const [naturalGasStorage, setNaturalGasStorage] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [oilPrice, gasolinePrice, oilInventory, naturalGasStorage] = await Promise.all([
          EIAService.getLatestOilPrice(),
          EIAService.getLatestGasolinePrice(),
          EIAService.getLatestOilInventory(),
          EIAService.getLatestNaturalGasStorage(),
        ]);
        setOilPrice(oilPrice);
        setGasolinePrice(gasolinePrice);
        setOilInventory(oilInventory);
        setNaturalGasStorage(naturalGasStorage);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { oilPrice, gasolinePrice, oilInventory, naturalGasStorage, loading, error };
};