import React from 'react';
import { useSpaceWeatherData } from '../../hooks/useSpaceWeatherData';
import { SpaceWeatherAlert } from '../../types';

// AI-NOTE: Demo component for NOAA space weather integration - shows electric field data and alerts
// TODO: Integrate with existing HUD system and globe overlays

interface SpaceWeatherStatusProps {
  className?: string;
}

const SpaceWeatherStatus: React.FC<SpaceWeatherStatusProps> = ({ className = '' }) => {
  const {
    interMagData,
    usCanadaData,
    alerts,
    isLoading,
    error,
    lastUpdated,
    refresh
  } = useSpaceWeatherData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableAlerts: true
  });

  const getSeverityColor = (severity: SpaceWeatherAlert['severity']) => {
    switch (severity) {
      case 'extreme': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'moderate': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const getSeverityBg = (severity: SpaceWeatherAlert['severity']) => {
    switch (severity) {
      case 'extreme': return 'bg-red-500/20 border-red-500';
      case 'high': return 'bg-orange-500/20 border-orange-500';
      case 'moderate': return 'bg-yellow-500/20 border-yellow-500';
      default: return 'bg-green-500/20 border-green-500';
    }
  };

  if (error) {
    return (
      <div className={`space-weather-status bg-gray-900/80 backdrop-blur-sm border border-red-500/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-red-400">Space Weather Status</h3>
          <button 
            onClick={refresh}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Retry
          </button>
        </div>
        <p className="text-xs text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-weather-status bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">Space Weather Status</h3>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full"></div>
          )}
          <button 
            onClick={refresh}
            disabled={isLoading}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-300 mb-2">Active Alerts</h4>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`border rounded px-2 py-1 ${getSeverityBg(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {alert.regions.join(', ')}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">InterMag (Global)</span>
          <div className="flex items-center gap-2">
            {interMagData && (
              <>
                <span className="text-gray-300">
                  {interMagData.statistics.totalPoints} points
                </span>
                <span className={`w-2 h-2 rounded-full ${interMagData.statistics.maxFieldStrength > 10 ? 'bg-orange-400' : 'bg-green-400'}`}></span>
              </>
            )}
            {!interMagData && !isLoading && (
              <span className="text-red-400">No data</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">US-Canada</span>
          <div className="flex items-center gap-2">
            {usCanadaData && (
              <>
                <span className="text-gray-300">
                  {usCanadaData.statistics.totalPoints} points
                </span>
                <span className={`w-2 h-2 rounded-full ${usCanadaData.statistics.maxFieldStrength > 10 ? 'bg-orange-400' : 'bg-green-400'}`}></span>
              </>
            )}
            {!usCanadaData && !isLoading && (
              <span className="text-red-400">No data</span>
            )}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Max Field Strength Indicator */}
      {(interMagData || usCanadaData) && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Max Field Strength</span>
            <span className="text-gray-300">
              {Math.max(
                interMagData?.statistics.maxFieldStrength || 0,
                usCanadaData?.statistics.maxFieldStrength || 0
              ).toFixed(2)} V/m
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceWeatherStatus;
