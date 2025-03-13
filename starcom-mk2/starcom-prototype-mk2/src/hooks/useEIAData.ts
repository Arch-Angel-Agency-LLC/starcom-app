import { useState, useEffect } from 'react';
import EIAService from '../services/EIAService';

export const useEIAData = () => {
  const [oilPrice, setOilPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOilPrice = async () => {
      try {
        const price = await EIAService.getLatestOilPrice();
        setOilPrice(price);
      } catch (err) {
        setError('Failed to fetch oil price');
      } finally {
        setLoading(false);
      }
    };

    fetchOilPrice();
  }, []);

  return { oilPrice, loading, error };
};