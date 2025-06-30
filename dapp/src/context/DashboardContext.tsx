import React, { createContext, useContext, useEffect, useState } from 'react';
import EIAService from '../services/EIAService';

interface DashboardContextType {
    oilPrice: number | null;
    gasolinePrice: number | null;
    oilInventory: number | null;
    naturalGasStorage: number | null;
    loading: boolean;
    error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [oilPrice, setOilPrice] = useState<number | null>(null);
    const [gasolinePrice, setGasolinePrice] = useState<number | null>(null);
    const [oilInventory, setOilInventory] = useState<number | null>(null);
    const [naturalGasStorage, setNaturalGasStorage] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.allSettled([
                    EIAService.getLatestOilPrice(),
                    EIAService.getLatestGasolinePrice(),
                    EIAService.getLatestOilInventory(),
                    EIAService.getLatestNaturalGasStorage(),
                ]);
                
                // Handle results with fallbacks for rejected promises
                setOilPrice(results[0].status === 'fulfilled' ? results[0].value : null);
                setGasolinePrice(results[1].status === 'fulfilled' ? results[1].value : null);
                setOilInventory(results[2].status === 'fulfilled' ? results[2].value : null);
                setNaturalGasStorage(results[3].status === 'fulfilled' ? results[3].value : null);
                
            } catch (err) {
                console.error('Dashboard data fetch error:', err);
                setError('Failed to fetch data');
                // Set fallback values
                setOilPrice(null);
                setGasolinePrice(null);
                setOilInventory(null);
                setNaturalGasStorage(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <DashboardContext.Provider value={{ oilPrice, gasolinePrice, oilInventory, naturalGasStorage, loading, error }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error('useDashboard must be used within DashboardProvider');
    return context;
};