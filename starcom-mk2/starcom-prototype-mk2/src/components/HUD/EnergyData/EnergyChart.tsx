import React from 'react';
import { Line } from 'react-chartjs-2';
import { useEIAData } from '../../../hooks/useEIAData';

interface EnergyChartProps {
  title: string;
  endpoint: string;
  params?: Record<string, string>;
}

const EnergyChart: React.FC<EnergyChartProps> = ({ title, endpoint, params = {} }) => {
  const { data, loading, error } = useEIAData(endpoint, params);

  const chartData = {
    labels: data ? data.map((point) => point.period) : [],
    datasets: [
      {
        label: title,
        data: data ? data.map((point) => parseFloat(point.value)) : [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { grid: { color: 'rgba(255,255,255,0.1)' } },
    },
  };

  return (
    <div className="w-full h-64 p-4 bg-gray-800 text-white border border-gray-600 rounded-lg">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-400">Error fetching data</p>
      ) : data && data.length > 0 ? (
        <Line data={chartData} options={options} />
      ) : (
        <p className="text-gray-400">No data available</p>
      )}
    </div>
  );
};

export default EnergyChart;
