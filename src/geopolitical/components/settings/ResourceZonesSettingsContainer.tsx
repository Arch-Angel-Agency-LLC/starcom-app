import React from 'react';
import { useGeoPoliticalSettings } from '../../../../hooks/useGeoPoliticalSettings';

// Placeholder MVP container for Resource Zones

export const ResourceZonesSettingsContainer: React.FC = () => {
  const { config, updateResourceZones } = useGeoPoliticalSettings();
  const rz = config.resourceZones;
  return (
    <div className="gp-settings-section">
      <h4 className="gp-settings-title">Resource Zones</h4>
      <fieldset className="gp-settings-fieldset">
        <legend>Resource Types</legend>
        {Object.entries(rz.resourceTypes).map(([key, val]) => (
          <label key={key}><input type="checkbox" checked={val} onChange={e=>updateResourceZones({ resourceTypes: { ...rz.resourceTypes, [key]: e.target.checked } })} /> {key}</label>
        ))}
      </fieldset>
      <label className="gp-settings-label">Zone Opacity {rz.zoneOpacity}%
        <input type="range" min={0} max={100} value={rz.zoneOpacity} onChange={e=>updateResourceZones({ zoneOpacity: parseInt(e.target.value,10) })} />
      </label>
      <label><input type="checkbox" checked={rz.showProductionRates} onChange={e=>updateResourceZones({ showProductionRates: e.target.checked })} /> Production Rates</label>
      <label><input type="checkbox" checked={rz.showTradeRoutes} onChange={e=>updateResourceZones({ showTradeRoutes: e.target.checked })} /> Trade Routes</label>
      <label><input type="checkbox" checked={rz.conflictZones.show} onChange={e=>updateResourceZones({ conflictZones: { ...rz.conflictZones, show: e.target.checked } })} /> Conflict Zones</label>
      <div className="gp-settings-note">Additional analytics & choropleths coming soon.</div>
    </div>
  );
};

export default ResourceZonesSettingsContainer;
