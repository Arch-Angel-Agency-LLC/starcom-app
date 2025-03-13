// src/hooks/useEIAData.ts
import { useEffect, useState } from 'react';
import { getEIAData } from '../services/EIAService';
import { EIADataPoint } from '../interfaces/EIAData';

export const useEIAData = (endpoint: string, params: Record<string, string> = {}) => {
    const [data, setData] = useState<EIADataPoint[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getEIAData(endpoint, params);
            if (result) {
                setData(result);
                setError(null);
            } else {
                setError('Failed to fetch data');
            }
            setLoading(false);
        };

        fetchData();
    }, [endpoint, JSON.stringify(params)]);

    return { data, loading, error };
};