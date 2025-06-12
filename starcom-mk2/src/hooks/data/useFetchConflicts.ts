import { useState, useEffect } from 'react';
//import { fetchGEDData } from '../../services/UCDPDataService';
//import { Conflict, UCDPResponse } from '../../services/UCDPDataService';

export const useFetchConflicts = (filters: Record<string, string | number>, page = 1) => {
  //const [data, setData] = useState<UCDPResponse<Conflict> | null>(null); // Use UCDPResponse type
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        //const result = await fetchGEDData(filters, page);
        //setData(result as UCDPResponse<Conflict>);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, page]);

  //return { data, loading, error };
  return { loading, error };
};
