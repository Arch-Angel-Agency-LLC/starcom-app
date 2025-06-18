import React from 'react';
import { useGeoPoliticalSettings } from '../../../../hooks/useGeoPoliticalSettings';
import { useSettingsValidation } from '../../../../utils/uiSettingsReflection';
import styles from './GeoPoliticalSettings.module.css';

interface GeoPoliticalSettingsProps {
  subMode: 'NationalTerritories' | 'DiplomaticEvents' | 'ResourceZones';
}

const GeoPoliticalSettings: React.FC<GeoPoliticalSettingsProps> = ({ subMode }) => {
  const { 
    config, 
    updateNationalTerritories, 
    updateDiplomaticEvents, 
    updateResourceZones
  } = useGeoPoliticalSettings();

  // Validate that UI state reflects persistent settings
  useSettingsValidation('GeoPoliticalSettings', config as unknown as Record<string, unknown>, {
    currentSubMode: subMode,
    borderVisibility: config.nationalTerritories.borderVisibility,
    eventTimeRange: config.diplomaticEvents.timeRange,
    zoneOpacity: config.resourceZones.zoneOpacity
  });

  const renderNationalTerritoriesSettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Border Visibility: {config.nationalTerritories.borderVisibility}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.nationalTerritories.borderVisibility}
          onChange={(e) => updateNationalTerritories({ borderVisibility: parseInt(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Border Thickness: {config.nationalTerritories.borderThickness.toFixed(1)}
        </label>
        <input
          type="range"
          min="0.5"
          max="5.0"
          step="0.1"
          value={config.nationalTerritories.borderThickness}
          onChange={(e) => updateNationalTerritories({ borderThickness: parseFloat(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <h5 className={styles.subheading}>Territory Colors</h5>
        <label className={styles.settingLabel}>Color Scheme</label>
        <select
          value={config.nationalTerritories.territoryColors.colorScheme}
          onChange={(e) => updateNationalTerritories({
            territoryColors: {
              ...config.nationalTerritories.territoryColors,
              colorScheme: e.target.value as 'default' | 'political' | 'economic' | 'population'
            }
          })}
          className={styles.select}
        >
          <option value="default">Default</option>
          <option value="political">Political</option>
          <option value="economic">Economic</option>
          <option value="population">Population</option>
        </select>
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Territory Opacity: {config.nationalTerritories.territoryColors.opacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.nationalTerritories.territoryColors.opacity}
          onChange={(e) => updateNationalTerritories({
            territoryColors: {
              ...config.nationalTerritories.territoryColors,
              opacity: parseInt(e.target.value)
            }
          })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.nationalTerritories.showDisputedTerritories}
            onChange={(e) => updateNationalTerritories({ showDisputedTerritories: e.target.checked })}
          />
          Show Disputed Territories
        </label>
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.nationalTerritories.showMaritimeBorders}
            onChange={(e) => updateNationalTerritories({ showMaritimeBorders: e.target.checked })}
          />
          Show Maritime Borders
        </label>
      </div>
    </div>
  );

  const renderDiplomaticEventsSettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.settingGroup}>
        <h5 className={styles.subheading}>Event Types</h5>
        {Object.entries(config.diplomaticEvents.eventTypes).map(([key, enabled]) => (
          <label key={key} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => updateDiplomaticEvents({
                eventTypes: {
                  ...config.diplomaticEvents.eventTypes,
                  [key]: e.target.checked
                }
              })}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Time Range: {config.diplomaticEvents.timeRange} days
        </label>
        <input
          type="range"
          min="1"
          max="365"
          value={config.diplomaticEvents.timeRange}
          onChange={(e) => updateDiplomaticEvents({ timeRange: parseInt(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Marker Size: {config.diplomaticEvents.markerSize.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={config.diplomaticEvents.markerSize}
          onChange={(e) => updateDiplomaticEvents({ markerSize: parseFloat(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.diplomaticEvents.showConnections}
            onChange={(e) => updateDiplomaticEvents({ showConnections: e.target.checked })}
          />
          Show Event Connections
        </label>
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.diplomaticEvents.animateEvents}
            onChange={(e) => updateDiplomaticEvents({ animateEvents: e.target.checked })}
          />
          Animate Events
        </label>
      </div>
    </div>
  );

  const renderResourceZonesSettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.settingGroup}>
        <h5 className={styles.subheading}>Resource Types</h5>
        {Object.entries(config.resourceZones.resourceTypes).map(([key, enabled]) => (
          <label key={key} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => updateResourceZones({
                resourceTypes: {
                  ...config.resourceZones.resourceTypes,
                  [key]: e.target.checked
                }
              })}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Zone Opacity: {config.resourceZones.zoneOpacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.resourceZones.zoneOpacity}
          onChange={(e) => updateResourceZones({ zoneOpacity: parseInt(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.resourceZones.showProductionRates}
            onChange={(e) => updateResourceZones({ showProductionRates: e.target.checked })}
          />
          Show Production Rates
        </label>
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.resourceZones.showTradeRoutes}
            onChange={(e) => updateResourceZones({ showTradeRoutes: e.target.checked })}
          />
          Show Trade Routes
        </label>
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.resourceZones.conflictZones.show}
            onChange={(e) => updateResourceZones({
              conflictZones: {
                ...config.resourceZones.conflictZones,
                show: e.target.checked
              }
            })}
          />
          Show Conflict Zones
        </label>
      </div>
    </div>
  );

  const renderSubModeSettings = () => {
    switch (subMode) {
      case 'NationalTerritories':
        return renderNationalTerritoriesSettings();
      case 'DiplomaticEvents':
        return renderDiplomaticEventsSettings();
      case 'ResourceZones':
        return renderResourceZonesSettings();
      default:
        return renderNationalTerritoriesSettings();
    }
  };

  return (
    <div className={styles.geoPoliticalSettings}>
      <div className={styles.subModeTitle}>{subMode}</div>
      {renderSubModeSettings()}
    </div>
  );
};

export default GeoPoliticalSettings;
