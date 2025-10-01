import React from 'react';
import { useGeoPoliticalSettings, type GeoPoliticalConfig } from '../../../hooks/useGeoPoliticalSettings';

// Tall narrow settings container for National Territories sub-mode
// MVP: reuse existing hook; later can add advanced controls (LOD lock, hysteresis toggle, hash verify)

export const NationalTerritoriesSettingsContainer: React.FC = () => {
  const { config, updateNationalTerritories } = useGeoPoliticalSettings();
  const nt = config.nationalTerritories;
  const lod = nt.lod || { mode: 'auto', lockedLevel: 2, hysteresis: 25 };
  return (
    <div className="gp-settings-section">
      <h4 className="gp-settings-title">National Territories</h4>
      {/* Core visuals */}
      <label className="gp-settings-label">Border Visibility {nt.borderVisibility}%
        <input type="range" min={0} max={100} value={nt.borderVisibility} onChange={e=>updateNationalTerritories({ borderVisibility: parseInt(e.target.value,10) })} />
      </label>
      <label className="gp-settings-label">Border Thickness {nt.borderThickness.toFixed(1)}
        <input type="range" min={0.5} max={5} step={0.1} value={nt.borderThickness} onChange={e=>updateNationalTerritories({ borderThickness: parseFloat(e.target.value) })} />
      </label>
      <label className="gp-settings-label">Territory Opacity {nt.territoryColors.opacity}%
        <input type="range" min={0} max={100} value={nt.territoryColors.opacity} onChange={e=>updateNationalTerritories({ territoryColors: { ...nt.territoryColors, opacity: parseInt(e.target.value,10) } })} />
      </label>
      <label className="gp-settings-label">Color Scheme
        <select value={nt.territoryColors.colorScheme} onChange={e=>{
          const scheme = e.target.value as GeoPoliticalConfig['nationalTerritories']['territoryColors']['colorScheme'];
          updateNationalTerritories({ territoryColors: { ...nt.territoryColors, colorScheme: scheme } });
        }}>
          <option value="default">Default</option>
          <option value="political">Political</option>
          <option value="economic">Economic</option>
          <option value="population">Population</option>
        </select>
      </label>
      <div className="gp-divider" />
      {/* Rendering tuning */}
      <fieldset className="gp-settings-fieldset">
        <legend>Rendering</legend>
  <label className="gp-settings-label">Fill Elevation Epsilon (default ~0.50) {(nt.fillElevationEpsilon ?? 0.5).toFixed(2)}
          <input type="range" min={0} max={1.5} step={0.01} value={nt.fillElevationEpsilon ?? 0.5} onChange={e=>updateNationalTerritories({ fillElevationEpsilon: parseFloat(e.target.value) })} />
        </label>
        <label><input type="checkbox" checked={!!nt.bvhPicking} onChange={e=>updateNationalTerritories({ bvhPicking: e.target.checked })} /> Accelerated Picking (BVH)</label>
      </fieldset>
      <div className="gp-divider" />
      {/* LOD Controls */}
      <fieldset className="gp-settings-fieldset">
        <legend>LOD</legend>
        <label>
          Mode
          <select value={lod.mode} onChange={e=>{
            const mode = e.target.value as NonNullable<GeoPoliticalConfig['nationalTerritories']['lod']>['mode'];
            updateNationalTerritories({ lod: { ...lod, mode } });
          }}>
            <option value="auto">Auto</option>
            <option value="locked">Locked</option>
          </select>
        </label>
        {lod.mode === 'locked' && (
          <label>Locked Level
            <select value={lod.lockedLevel} onChange={e=>{
              const v = parseInt(e.target.value, 10);
              const lockedLevel = (v === 0 ? 0 : v === 1 ? 1 : 2) as 0|1|2;
              updateNationalTerritories({ lod: { ...lod, lockedLevel } });
            }}>
              <option value={0}>LOD0 (far)</option>
              <option value={1}>LOD1 (mid)</option>
              <option value={2}>LOD2 (near)</option>
            </select>
          </label>
        )}
        {lod.mode === 'auto' && (
          <label>Hysteresis {lod.hysteresis}
            <input type="range" min={0} max={100} value={lod.hysteresis} onChange={e=>updateNationalTerritories({ lod: { ...lod, hysteresis: parseInt(e.target.value,10) } })} />
          </label>
        )}
      </fieldset>
      <div className="gp-divider" />
      {/* Toggles */}
      <label><input type="checkbox" checked={nt.showDisputedTerritories} onChange={e=>updateNationalTerritories({ showDisputedTerritories: e.target.checked })} /> Show Disputed</label>
      <label><input type="checkbox" checked={nt.showMaritimeBorders} onChange={e=>updateNationalTerritories({ showMaritimeBorders: e.target.checked })} /> Maritime Borders</label>
      <label><input type="checkbox" checked={nt.highlightOnHover} onChange={e=>updateNationalTerritories({ highlightOnHover: e.target.checked })} /> Highlight Hover</label>
  <label><input type="checkbox" checked={!!nt.reducedMotion} onChange={e=>updateNationalTerritories({ reducedMotion: e.target.checked })} /> Reduced Motion (a11y)</label>
      <div className="gp-divider" />
      {/* Legend (classification colors) */}
      <div className="gp-legend">
        <div className="gp-legend-item"><span className="gp-color international" /> International</div>
        <div className="gp-legend-item"><span className="gp-color disputed" /> Disputed</div>
        <div className="gp-legend-item"><span className="gp-color line_of_control" /> Line of Control</div>
        <div className="gp-legend-item"><span className="gp-color indefinite" /> Indefinite</div>
  <div className="gp-legend-item"><span className="gp-color maritime_eez" /> Maritime EEZ</div>
  <div className="gp-legend-item"><span className="gp-color maritime_overlap" /> Maritime Overlap</div>
      </div>
      {/* Placeholder for future hash verify button */}
      <button className="gp-btn gp-btn-secondary" disabled>Verify Data Integrity (soon)</button>
    </div>
  );
};

export default NationalTerritoriesSettingsContainer;
