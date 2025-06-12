// src/api/eia.ts
import axios from 'axios';

const API_BASE_URL = 'https://api.eia.gov/v2';
const API_KEY = process.env.EIA_API_KEY || 'ZJD7rrc41ozM4JikBBOM3Q4CAeEVYhdmxaHemuGo'; 

export const fetchEIAData = async (endpoint: string, params: Record<string, string> = {}) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
            params: {
                api_key: API_KEY,
                ...params,
            },
        });
        return response.data.response?.data || [];
    } catch (error) {
        console.error('EIA API Fetch Error:', error);
        return null;
    }
};