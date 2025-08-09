import React from 'react';
import { useGeoPoliticalSettings } from '../../../../hooks/useGeoPoliticalSettings';

// Placeholder MVP container for Diplomatic Events
// Advanced controls (time scrub, clustering) will be added later

export const DiplomaticEventsSettingsContainer: React.FC = () => {
  const { config, updateDiplomaticEvents } = useGeoPoliticalSettings();
  const de = config.diplomaticEvents;
  return (
    <div className="gp-settings-section">
      <h4 className="gp-settings-title">Diplomatic Events</h4>
      <fieldset className="gp-settings-fieldset">
        <legend>Event Types</legend>
        {Object.entries(de.eventTypes).map(([key, val]) => (
          <label key={key}><input type="checkbox" checked={val} onChange={e=>updateDiplomaticEvents({ eventTypes: { ...de.eventTypes, [key]: e.target.checked } })} /> {key}</label>
        ))}
      </fieldset>
      <label className="gp-settings-label">Time Range {de.timeRange}d
        <input type="range" min={1} max={365} value={de.timeRange} onChange={e=>updateDiplomaticEvents({ timeRange: parseInt(e.target.value,10) })} />
      </label>
      <label className="gp-settings-label">Marker Size {de.markerSize.toFixed(1)}
        <input type="range" min={0.5} max={3} step={0.1} value={de.markerSize} onChange={e=>updateDiplomaticEvents({ markerSize: parseFloat(e.target.value) })} />
      </label>
      <label><input type="checkbox" checked={de.showConnections} onChange={e=>updateDiplomaticEvents({ showConnections: e.target.checked })} /> Connections</label>
      <label><input type="checkbox" checked={de.animateEvents} onChange={e=>updateDiplomaticEvents({ animateEvents: e.target.checked })} /> Animate</label>
      <div className="gp-settings-note">Advanced filters & timeline coming soon.</div>
    </div>
  );
};

export default DiplomaticEventsSettingsContainer;
