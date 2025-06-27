// src/components/EcoNatural/SpaceWeatherNormalizationPanel.tsx
// AI-NOTE: Advanced normalization control panel for space weather visualization
// Provides user controls and visual feedback for data normalization parameters

import React from 'react';
import { useEcoNaturalSettings } from '../../hooks/useEcoNaturalSettings';

const SpaceWeatherNormalizationPanel: React.FC = () => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const { normalization } = config.spaceWeather;

  const normalizationMethods = [
    { value: 'linear', label: 'Linear', description: 'Simple min-max scaling' },
    { value: 'logarithmic', label: 'Logarithmic', description: 'Good for exponential data' },
    { value: 'percentile', label: 'Percentile', description: 'Robust against outliers' },
    { value: 'statistical', label: 'Statistical', description: 'Z-score with sigmoid' },
    { value: 'adaptive', label: 'Adaptive', description: 'Automatically chooses best method' }
  ] as const;

  const handleMethodChange = (method: typeof normalization.method) => {
    updateSpaceWeather({
      normalization: { ...normalization, method }
    });
  };

  const handleOutlierFactorChange = (value: number) => {
    updateSpaceWeather({
      normalization: { ...normalization, outlierFactor: value }
    });
  };

  const handleSmoothingFactorChange = (value: number) => {
    updateSpaceWeather({
      normalization: { ...normalization, smoothingFactor: value }
    });
  };

  const handlePercentileRangeChange = (index: 0 | 1, value: number) => {
    const newRange: [number, number] = [...normalization.percentileRange];
    newRange[index] = value;
    updateSpaceWeather({
      normalization: { ...normalization, percentileRange: newRange }
    });
  };

  const handleClampMaxChange = (value: number | null) => {
    updateSpaceWeather({
      normalization: { ...normalization, clampMax: value }
    });
  };

  const resetToDefaults = () => {
    updateSpaceWeather({
      normalization: {
        method: 'adaptive',
        outlierFactor: 1.5,
        smoothingFactor: 0.1,
        percentileRange: [10, 90],
        clampMax: null
      }
    });
  };

  return (
    <div className="space-y-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Data Normalization</h3>
        <button
          onClick={resetToDefaults}
          className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Normalization Method */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Normalization Method
        </label>
        <div className="grid grid-cols-1 gap-2">
          {normalizationMethods.map((method) => (
            <div
              key={method.value}
              className={`p-3 rounded border cursor-pointer transition-all ${
                normalization.method === method.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => handleMethodChange(method.value)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={normalization.method === method.value}
                    onChange={() => handleMethodChange(method.value)}
                    className="text-blue-500"
                  />
                  <span className="text-white font-medium">{method.label}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-1">{method.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Outlier Factor */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Outlier Factor: {normalization.outlierFactor.toFixed(1)}
        </label>
        <input
          type="range"
          min="1.0"
          max="3.0"
          step="0.1"
          value={normalization.outlierFactor}
          onChange={(e) => handleOutlierFactorChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Conservative (1.0)</span>
          <span>Aggressive (3.0)</span>
        </div>
      </div>

      {/* Smoothing Factor */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Smoothing: {Math.round(normalization.smoothingFactor * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={normalization.smoothingFactor}
          onChange={(e) => handleSmoothingFactorChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>No Smoothing</span>
          <span>Maximum Smoothing</span>
        </div>
      </div>

      {/* Percentile Range (for percentile method) */}
      {normalization.method === 'percentile' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Percentile Range: {normalization.percentileRange[0]}th - {normalization.percentileRange[1]}th
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Lower</label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={normalization.percentileRange[0]}
                onChange={(e) => handlePercentileRangeChange(0, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Upper</label>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={normalization.percentileRange[1]}
                onChange={(e) => handlePercentileRangeChange(1, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* Clamp Maximum */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Maximum Clamp Value (V/m)
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={normalization.clampMax !== null}
            onChange={(e) => handleClampMaxChange(e.target.checked ? 10 : null)}
            className="text-blue-500"
          />
          <span className="text-sm text-gray-400">Enable clamping</span>
        </div>
        {normalization.clampMax !== null && (
          <input
            type="number"
            min="0.1"
            max="100"
            step="0.1"
            value={normalization.clampMax}
            onChange={(e) => handleClampMaxChange(parseFloat(e.target.value) || null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
            placeholder="Max value (V/m)"
          />
        )}
      </div>

      {/* Information Panel */}
      <div className="p-3 bg-gray-800 rounded border border-gray-600">
        <h4 className="text-sm font-medium text-white mb-2">Current Settings Impact</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>
            • <strong>Method:</strong> {normalizationMethods.find(m => m.value === normalization.method)?.description}
          </p>
          <p>
            • <strong>Outlier Handling:</strong> {normalization.outlierFactor < 1.5 ? 'Conservative' : normalization.outlierFactor > 2.0 ? 'Aggressive' : 'Balanced'}
          </p>
          <p>
            • <strong>Smoothing:</strong> {normalization.smoothingFactor === 0 ? 'Disabled' : normalization.smoothingFactor < 0.2 ? 'Light' : 'Heavy'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpaceWeatherNormalizationPanel;
