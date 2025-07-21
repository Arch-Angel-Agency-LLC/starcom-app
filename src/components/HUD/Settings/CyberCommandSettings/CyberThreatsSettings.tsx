/**
 * CyberThreats Settings Component
 * Week 3 Day 2: Settings panel for threat intelligence visualization
 * 
 * Provides controls for:
 * - Threat category filtering
 * - Confidence level thresholds
 * - Geographic regions
 * - Time windows
 * - Visualization options
 * - API configuration for real data sources
 */

import React, { useState } from 'react';
import { useCyberCommandSettings } from '../../../../hooks/useCyberCommandSettings';
import { ApiConfigurationSettings } from './ApiConfigurationSettings';
import { ApiIntegrationService } from '../../../../services/CyberThreats/ApiIntegrationService';
import styles from '../CyberCommandSettings.module.css';

// =============================================================================
// INTERFACES
// =============================================================================

interface CyberThreatsSettingsProps {
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const CyberThreatsSettings: React.FC<CyberThreatsSettingsProps> = ({
  className = ''
}) => {
  const { config, updateCyberThreats } = useCyberCommandSettings();
  const cyberThreatsSettings = config.cyberThreats;
  const [activeTab, setActiveTab] = useState<'filtering' | 'visualization' | 'apis'>('filtering');
  const [apiService] = useState(() => new ApiIntegrationService());

  // Handle category toggle - simplified to match actual interface
  const handleCategoryToggle = (category: string, enabled: boolean) => {
    updateCyberThreats({
      threatFiltering: {
        ...cyberThreatsSettings.threatFiltering,
        [`show${category}`]: enabled
      }
    });
  };

  // Handle confidence threshold change
  const handleConfidenceThresholdChange = (threshold: number) => {
    updateCyberThreats({
      confidenceThreshold: threshold
    });
  };

  // Handle visualization option toggles
  const handleVisualizationToggle = (option: string, value: boolean | number) => {
    updateCyberThreats({
      [option]: value
    });
  };

  return (
    <div className={`${styles.settingsPanel} ${className}`}>
      {/* Basic Threat Intelligence Options */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Threat Intelligence Display</h3>
        <div className={styles.settingGroup}>
          <label className={styles.rangeLabel}>
            Overlay Opacity: {cyberThreatsSettings.overlayOpacity}%
            <input
              type="range"
              min="0"
              max="100"
              value={cyberThreatsSettings.overlayOpacity}
              onChange={(e) => handleVisualizationToggle('overlayOpacity', parseInt(e.target.value))}
              className={styles.rangeInput}
            />
          </label>
        </div>
      </div>

      {/* Confidence Threshold */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Confidence Threshold</h3>
        <div className={styles.settingGroup}>
          <label className={styles.rangeLabel}>
            Minimum Confidence: {Math.round(cyberThreatsSettings.confidenceThreshold * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={cyberThreatsSettings.confidenceThreshold}
              onChange={(e) => handleConfidenceThresholdChange(parseFloat(e.target.value))}
              className={styles.rangeInput}
            />
          </label>
          <p className={styles.settingDescription}>
            Only show threats above this confidence level
          </p>
        </div>
      </div>

      {/* Visualization Options */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Visualization Options</h3>
        <div className={styles.settingGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.showHeatMap}
              onChange={(e) => handleVisualizationToggle('showHeatMap', e.target.checked)}
            />
            <span className={styles.checkboxText}>Threat Density Heat Map</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.showC2Networks}
              onChange={(e) => handleVisualizationToggle('showC2Networks', e.target.checked)}
            />
            <span className={styles.checkboxText}>C2 Network Infrastructure</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.showBotnets}
              onChange={(e) => handleVisualizationToggle('showBotnets', e.target.checked)}
            />
            <span className={styles.checkboxText}>Botnet Activity</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.showAttribution}
              onChange={(e) => handleVisualizationToggle('showAttribution', e.target.checked)}
            />
            <span className={styles.checkboxText}>Threat Actor Attribution</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.campaignGrouping}
              onChange={(e) => handleVisualizationToggle('campaignGrouping', e.target.checked)}
            />
            <span className={styles.checkboxText}>Group by Campaigns</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.showTimelines}
              onChange={(e) => handleVisualizationToggle('showTimelines', e.target.checked)}
            />
            <span className={styles.checkboxText}>Threat Timelines</span>
          </label>
        </div>
      </div>

      {/* Heat Map Intensity */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Heat Map Settings</h3>
        <div className={styles.settingGroup}>
          <label className={styles.rangeLabel}>
            Heat Map Intensity: {cyberThreatsSettings.heatMapIntensity.toFixed(1)}x
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={cyberThreatsSettings.heatMapIntensity}
              onChange={(e) => handleVisualizationToggle('heatMapIntensity', parseFloat(e.target.value))}
              className={styles.rangeInput}
            />
          </label>
        </div>
      </div>

      {/* Attribution Settings */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Attribution Settings</h3>
        <div className={styles.settingGroup}>
          <label className={styles.rangeLabel}>
            Attribution Min Confidence: {Math.round(cyberThreatsSettings.attributionMinConfidence * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={cyberThreatsSettings.attributionMinConfidence}
              onChange={(e) => handleVisualizationToggle('attributionMinConfidence', parseFloat(e.target.value))}
              className={styles.rangeInput}
            />
          </label>
          <p className={styles.settingDescription}>
            Minimum confidence for threat actor attribution
          </p>
        </div>
      </div>

      {/* Threat Filtering */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Threat Data Filtering</h3>
        <div className={styles.settingGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.threatFiltering.showC2Servers}
              onChange={(e) => handleCategoryToggle('C2Servers', e.target.checked)}
            />
            <span className={styles.checkboxText}>C2 Servers</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.threatFiltering.showMalwareFamilies}
              onChange={(e) => handleCategoryToggle('MalwareFamilies', e.target.checked)}
            />
            <span className={styles.checkboxText}>Malware Families</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.threatFiltering.showThreatActors}
              onChange={(e) => handleCategoryToggle('ThreatActors', e.target.checked)}
            />
            <span className={styles.checkboxText}>Threat Actors</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cyberThreatsSettings.threatFiltering.showIOCs}
              onChange={(e) => handleCategoryToggle('IOCs', e.target.checked)}
            />
            <span className={styles.checkboxText}>Indicators of Compromise</span>
          </label>
        </div>
      </div>

      {/* Data Settings */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Data Management</h3>
        <div className={styles.settingGroup}>
          <label className={styles.rangeLabel}>
            Max Threats: {cyberThreatsSettings.maxThreats}
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={cyberThreatsSettings.maxThreats}
              onChange={(e) => handleVisualizationToggle('maxThreats', parseInt(e.target.value))}
              className={styles.rangeInput}
            />
          </label>
          <p className={styles.settingDescription}>
            Maximum number of threats to display simultaneously
          </p>
        </div>
        <div className={styles.settingGroup}>
          <label className={styles.rangeLabel}>
            Refresh Interval: {cyberThreatsSettings.refreshInterval} minutes
            <input
              type="range"
              min="1"
              max="60"
              value={cyberThreatsSettings.refreshInterval}
              onChange={(e) => handleVisualizationToggle('refreshInterval', parseInt(e.target.value))}
              className={styles.rangeInput}
            />
          </label>
          <p className={styles.settingDescription}>
            How often to refresh threat intelligence data
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className={styles.settingsSection}>
        <div className={styles.statusSummary}>
          <p className={styles.settingDescription}>
            🔒 Threat intelligence visualization configured
          </p>
          <p className={styles.settingDescription}>
            📡 Confidence threshold: {Math.round(cyberThreatsSettings.confidenceThreshold * 100)}%
          </p>
          <p className={styles.settingDescription}>
            🎯 Max threats: {cyberThreatsSettings.maxThreats}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CyberThreatsSettings;
