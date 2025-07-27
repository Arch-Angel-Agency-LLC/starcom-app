// Phase 1 Test Component - NOAA Systems Foundation Merge Validation
// Tests enterprise provider integration with legacy visualization compatibility

import React, { useState } from 'react';
import { EnhancedSpaceWeatherProvider } from '../../context/EnhancedSpaceWeatherContext';
import { useEnhancedSpaceWeatherContext } from '../../hooks/useEnhancedSpaceWeatherHooks';

const Phase1TestDashboard: React.FC = () => {
  const {
    currentProvider,
    switchProvider,
    providerStatus,
    interMagData,
    usCanadaData,
    alerts,
    isLoading,
    error,
    lastUpdated,
    visualizationVectors,
    refresh
  } = useEnhancedSpaceWeatherContext();

  const [testResults, setTestResults] = useState<{
    legacy: { tested: boolean; success: boolean; error?: string };
    enterprise: { tested: boolean; success: boolean; error?: string };
  }>({
    legacy: { tested: false, success: false },
    enterprise: { tested: false, success: false }
  });

  const testProvider = async (provider: 'legacy' | 'enterprise') => {
    try {
      console.log(`🧪 Testing ${provider} provider...`);
      const originalProvider = currentProvider;
      
      // Switch to test provider
      switchProvider(provider);
      
      // Wait a moment for data fetch
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Trigger refresh
      await refresh();
      
      // Check results
      const hasData = interMagData || usCanadaData;
      const success = hasData && !error;
      
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          tested: true,
          success,
          error: error || undefined
        }
      }));

      // Switch back to original provider
      if (originalProvider !== provider) {
        switchProvider(originalProvider);
      }

      console.log(`${success ? '✅' : '❌'} ${provider} provider test ${success ? 'passed' : 'failed'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          tested: true,
          success: false,
          error: errorMessage
        }
      }));
      console.error(`❌ ${provider} provider test failed:`, err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#0a0a0a', 
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1>🛰️ PHASE 1: NOAA Systems Foundation Merge</h1>
      <p>Testing enterprise NOAADataProvider integration with legacy visualization</p>
      
      {/* Provider Status */}
      <div style={{ border: '1px solid #333', padding: '15px', margin: '10px 0' }}>
        <h2>📡 Provider Status</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <strong>Current Provider:</strong> 
            <span style={{ 
              color: currentProvider === 'legacy' ? '#ffaa00' : '#00aaff',
              marginLeft: '10px'
            }}>
              {currentProvider.toUpperCase()}
            </span>
          </div>
          
          <button 
            onClick={() => switchProvider(currentProvider === 'legacy' ? 'enterprise' : 'legacy')}
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #666',
              padding: '5px 10px',
              cursor: 'pointer'
            }}
          >
            Switch to {currentProvider === 'legacy' ? 'Enterprise' : 'Legacy'}
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <div>Legacy: {providerStatus.legacy.available ? '🟢 Available' : '🔴 Unavailable'}</div>
          <div>Enterprise: {providerStatus.enterprise.available ? '🟢 Available' : '🔴 Unavailable'}</div>
        </div>
      </div>

      {/* Data Status */}
      <div style={{ border: '1px solid #333', padding: '15px', margin: '10px 0' }}>
        <h2>📊 Data Status ({currentProvider})</h2>
        <div>Loading: {isLoading ? '🔄 Yes' : '✅ No'}</div>
        <div>Error: {error ? `❌ ${error}` : '✅ None'}</div>
        <div>Last Updated: {lastUpdated ? lastUpdated.toLocaleString() : '❌ Never'}</div>
        
        <h3>Datasets:</h3>
        <div>InterMag: {interMagData ? `✅ ${interMagData.vectors.length} vectors` : '❌ No data'}</div>
        <div>US-Canada: {usCanadaData ? `✅ ${usCanadaData.vectors.length} vectors` : '❌ No data'}</div>
        <div>Alerts: {alerts.length > 0 ? `⚠️ ${alerts.length} active` : '✅ None'}</div>
        <div>Visualization Vectors: {visualizationVectors.length > 0 ? `📈 ${visualizationVectors.length} processed` : '❌ None'}</div>
      </div>

      {/* Provider Testing */}
      <div style={{ border: '1px solid #333', padding: '15px', margin: '10px 0' }}>
        <h2>🧪 Provider Testing</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button 
            onClick={() => testProvider('legacy')}
            disabled={testResults.legacy.tested && testResults.legacy.success}
            style={{
              backgroundColor: testResults.legacy.tested 
                ? (testResults.legacy.success ? '#006600' : '#660000')
                : '#333',
              color: '#fff',
              border: '1px solid #666',
              padding: '10px 15px',
              cursor: 'pointer'
            }}
          >
            Test Legacy Provider
          </button>
          
          <button 
            onClick={() => testProvider('enterprise')}
            disabled={testResults.enterprise.tested && testResults.enterprise.success}
            style={{
              backgroundColor: testResults.enterprise.tested 
                ? (testResults.enterprise.success ? '#006600' : '#660000')
                : '#333',
              color: '#fff',
              border: '1px solid #666',
              padding: '10px 15px',
              cursor: 'pointer'
            }}
          >
            Test Enterprise Provider
          </button>
        </div>

        <div>
          <h3>Test Results:</h3>
          <div>
            Legacy: {!testResults.legacy.tested ? '⏳ Not tested' : 
                     testResults.legacy.success ? '✅ PASSED' : 
                     `❌ FAILED: ${testResults.legacy.error}`}
          </div>
          <div>
            Enterprise: {!testResults.enterprise.tested ? '⏳ Not tested' : 
                        testResults.enterprise.success ? '✅ PASSED' : 
                        `❌ FAILED: ${testResults.enterprise.error}`}
          </div>
        </div>
      </div>

      {/* Data Details */}
      {(interMagData || usCanadaData) && (
        <div style={{ border: '1px solid #333', padding: '15px', margin: '10px 0' }}>
          <h2>📋 Data Details</h2>
          
          {interMagData && (
            <div style={{ marginBottom: '10px' }}>
              <h3>InterMag Dataset:</h3>
              <div>Source: {interMagData.source}</div>
              <div>Timestamp: {interMagData.timestamp}</div>
              <div>Total Points: {interMagData.statistics.totalPoints}</div>
              <div>High Quality Points: {interMagData.statistics.highQualityPoints}</div>
              <div>Max Field Strength: {interMagData.statistics.maxFieldStrength.toFixed(3)} V/m</div>
              <div>Coverage: {interMagData.coverage.minLat.toFixed(2)}° to {interMagData.coverage.maxLat.toFixed(2)}° lat</div>
            </div>
          )}

          {usCanadaData && (
            <div style={{ marginBottom: '10px' }}>
              <h3>US-Canada Dataset:</h3>
              <div>Source: {usCanadaData.source}</div>
              <div>Timestamp: {usCanadaData.timestamp}</div>
              <div>Total Points: {usCanadaData.statistics.totalPoints}</div>
              <div>High Quality Points: {usCanadaData.statistics.highQualityPoints}</div>
              <div>Max Field Strength: {usCanadaData.statistics.maxFieldStrength.toFixed(3)} V/m</div>
              <div>Coverage: {usCanadaData.coverage.minLat.toFixed(2)}° to {usCanadaData.coverage.maxLat.toFixed(2)}° lat</div>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ border: '1px solid #333', padding: '15px', margin: '10px 0' }}>
          <h2>⚠️ Active Alerts</h2>
          {alerts.slice(0, 5).map((alert, index) => (
            <div key={index} style={{ 
              padding: '5px', 
              margin: '5px 0',
              backgroundColor: alert.severity === 'high' ? '#330000' : '#333300'
            }}>
              <div><strong>{alert.alertType}</strong> - {alert.severity}</div>
              <div>{alert.message}</div>
              <div><small>{new Date(alert.timestamp).toLocaleString()}</small></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Phase 1 Test Component - Foundation Merge validation for NOAA systems consolidation
      </div>
    </div>
  );
};

// Wrapper component with provider
const Phase1TestComponentWithProvider: React.FC = () => {
  return (
    <EnhancedSpaceWeatherProvider>
      <Phase1TestDashboard />
    </EnhancedSpaceWeatherProvider>
  );
};

export default Phase1TestComponentWithProvider;
