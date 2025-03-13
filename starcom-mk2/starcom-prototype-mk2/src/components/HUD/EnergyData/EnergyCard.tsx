import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card.tsx';
import { useEIAData } from '../../../hooks/useEIAData';

interface EnergyCardProps {
    title: string;
    endpoint: string;
    params?: Record<string, string>;
}

const EnergyCard: React.FC<EnergyCardProps> = ({ title, endpoint, params = {} }) => {
    const { data, loading, error } = useEIAData(endpoint, params);

    return (
    <Card className="w-full p-4 bg-gray-800 text-white border border-gray-600">
        <CardHeader>
        <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
        {loading ? (
            <p className="text-gray-400">Loading...</p>
        ) : error ? (
            <p className="text-red-400">Error fetching data</p>
        ) : data && data.length > 0 ? (
            <div>
            <p className="text-xl font-bold">🛢️ ${data[0].value} / BBL</p>
            <p className="text-sm text-gray-400">Date: {data[0].period}</p>
            </div>
        ) : (
            <p className="text-gray-400">No data available</p>
        )}
        </CardContent>
    </Card>
    );
};

export default EnergyCard;
