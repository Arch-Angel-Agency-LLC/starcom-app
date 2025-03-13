import React, { createContext, useContext, useEffect, useState } from 'react';
import EIAService from '../services/EIAService';

interface DashboardContextType {
    oilPrice: number | null;
    loading: boolean;
    error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [oilPrice, setOilPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        EIAService.getLatestOilPrice()
        .then(price => setOilPrice(price))
        .catch(() => setError('Failed to fetch oil price'))
        .finally(() => setLoading(false));
    }, []);

    return (
        <DashboardContext.Provider value={{ oilPrice, loading, error }}>
        {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error('useDashboard must be used within DashboardProvider');
    return context;
};