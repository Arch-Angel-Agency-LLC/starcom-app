import React from 'react';
import { Card } from '../../Shared/Card'; // Assuming this is your reusable Card component
import { useDashboard } from '../../../context/DashboardContext';

export const EnergyCard: React.FC = () => {
    const { oilPrice, loading, error } = useDashboard();

    return (
        <Card>
        <h3>Oil Price (WTI)</h3>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {oilPrice !== null && !loading && !error && (
            <p>
            ${oilPrice.toFixed(2)} <span>/ barrel</span>
            </p>
        )}
        </Card>
    );
};