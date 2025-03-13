// src/services/EIAService.ts
import { fetchEIAData } from '../api/eia';
import { EIADataPoint } from '../interfaces/EIAData';

const CACHE: Record<string, EIADataPoint[]> = {}; // Simple in-memory cache

export const getEIAData = async (endpoint: string, params: Record<string, string> = {}): Promise<EIADataPoint[] | null> => {
    const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
    
    if (CACHE[cacheKey]) {
        return CACHE[cacheKey]; // Return cached data if available
    }

    const data = await fetchEIAData(endpoint, params);
    
    if (data) {
        CACHE[cacheKey] = data; // Store in cache
    }

    return data;
};