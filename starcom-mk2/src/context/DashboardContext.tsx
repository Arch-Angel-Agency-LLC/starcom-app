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
                console.error('Dashboard data fetch error:', err);
                setError('Failed to fetch data');
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