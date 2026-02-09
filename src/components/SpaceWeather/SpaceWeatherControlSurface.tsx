import React, { useEffect, useRef, useState } from 'react';
import { useSpaceWeatherContext } from '../../context/SpaceWeatherContext';
import { getSpaceWeatherLayer } from './SpaceWeatherLayerRegistry';
import type { SpaceWeatherInteractiveBundle, SpaceWeatherPassiveBundle } from './SpaceWeatherSidebarLayout';
import SpaceWeatherDetailsPopover from '../HUD/Bars/CyberCommandLeftSideBar/SpaceWeatherDetailsPopover';
import { usePopup } from '../Popup/PopupManager';
import { spaceWeatherProviderMeta } from './SpaceWeatherProviderMeta';
import styles from './SpaceWeatherControlSurface.module.css';

type DatasetKey = 'intermag' | 'usCanada' | 'pipeline';

interface SpaceWeatherControlSurfaceProps {
  interactive: SpaceWeatherInteractiveBundle;
  passive: SpaceWeatherPassiveBundle;
}

const defaultDatasets: Record<DatasetKey, boolean> = {
  intermag: true,
  usCanada: true,
  pipeline: false
};

const DatasetControls: React.FC<{
  enabled: Record<DatasetKey, boolean>;
  onToggle: (key: DatasetKey) => void;
}> = ({ enabled, onToggle }) => (
  <div className={styles.datasetButtons}>
    {(['intermag', 'usCanada', 'pipeline'] as DatasetKey[]).map((key) => {
      const label = key === 'usCanada' ? 'US/Canada' : key.charAt(0).toUpperCase() + key.slice(1);
      const active = enabled[key];
      return (
        <button
          key={key}
          type="button"
          className={[styles.datasetButton, active ? styles.datasetButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => onToggle(key)}
          aria-pressed={active}
        >
          <span>{label}</span>
        </button>
      );
    })}
  </div>
);

const ElectricFieldsPanel: React.FC = () => {
  const context = useSpaceWeatherContext();
  if (!context) return null;
  const { settings, updateSettings } = context;
  const enabled = { ...defaultDatasets, ...(settings.enabledDatasets ?? {}) };

  const handleToggle = (key: DatasetKey) => {
    updateSettings({
      enabledDatasets: {
        ...enabled,
        [key]: !enabled[key]
      }
    });
  };

  return (
    <div className={styles.inlineMetrics}>
      <DatasetControls enabled={enabled} onToggle={handleToggle} />
    </div>
  );
};

const GeomagneticPanel: React.FC = () => {
  const context = useSpaceWeatherContext();
  if (!context) return null;
  const { settings, updateSettings } = context;

  return (
    <div className={styles.inlineMetrics}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={[styles.toggleButton, settings.showGeomagneticIndex ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showGeomagneticIndex: !settings.showGeomagneticIndex })}
        >
          <span>Geomagnetic Index</span>
          <span>{settings.showGeomagneticIndex ? 'ON' : 'OFF'}</span>
        </button>
        <button
          type="button"
          className={[styles.toggleButton, settings.showAuroralOval ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showAuroralOval: !settings.showAuroralOval })}
        >
          <span>Auroral Oval</span>
          <span>{settings.showAuroralOval ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};

const SolarWindPanel: React.FC = () => {
  const context = useSpaceWeatherContext();
  if (!context) return null;
  const { settings, updateSettings } = context;

  return (
    <div className={styles.inlineMetrics}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={[styles.toggleButton, settings.showSolarWind ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showSolarWind: !settings.showSolarWind })}
        >
          <span>Solar Wind Layer</span>
          <span>{settings.showSolarWind ? 'ON' : 'OFF'}</span>
        </button>
        <button
          type="button"
          className={[styles.toggleButton, settings.showMagnetopause ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showMagnetopause: !settings.showMagnetopause })}
        >
          <span>Magnetopause</span>
          <span>{settings.showMagnetopause ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};

const FallbackPanel: React.FC<{ layerName: string }> = ({ layerName }) => (
  <div className={styles.fallback}>
    Contextual controls for {layerName} are coming soon. The visualization can still be toggled from the selector rail.
  </div>
);

const MagnetospherePanel: React.FC = () => {
  const context = useSpaceWeatherContext();
  if (!context) return null;
  const { settings, updateSettings } = context;
  return (
    <div className={styles.inlineMetrics}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={[styles.toggleButton, settings.showMagnetopause ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showMagnetopause: !settings.showMagnetopause })}
        >
          <span>Magnetopause</span>
          <span>{settings.showMagnetopause ? 'ON' : 'OFF'}</span>
        </button>
        <button
          type="button"
          className={[styles.toggleButton, settings.enhancedSampling ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ enhancedSampling: !settings.enhancedSampling })}
        >
          <span>Enhanced Sampling</span>
          <span>{settings.enhancedSampling ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};

const AuroraPanel: React.FC = () => {
  const context = useSpaceWeatherContext();
  if (!context) return null;
  const { settings, updateSettings } = context;
  return (
    <div className={styles.inlineMetrics}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={[styles.toggleButton, settings.showAuroralOval ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showAuroralOval: !settings.showAuroralOval })}
        >
          <span>Auroral Oval</span>
          <span>{settings.showAuroralOval ? 'ON' : 'OFF'}</span>
        </button>
        <button
          type="button"
          className={[styles.toggleButton, settings.showGeomagneticIndex ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showGeomagneticIndex: !settings.showGeomagneticIndex })}
        >
          <span>Storm Bands</span>
          <span>{settings.showGeomagneticIndex ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};

const RadiationPanel: React.FC = () => {
  const context = useSpaceWeatherContext();
  if (!context) return null;
  const { settings, updateSettings } = context;
  return (
    <div className={styles.inlineMetrics}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={[styles.toggleButton, settings.showMagneticField ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showMagneticField: !settings.showMagneticField })}
        >
          <span>Radiation Layer</span>
          <span>{settings.showMagneticField ? 'ON' : 'OFF'}</span>
        </button>
        <button
          type="button"
          className={[styles.toggleButton, settings.showRadiation ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showRadiation: !settings.showRadiation })}
        >
          <span>Flux Alerts</span>
          <span>{settings.showRadiation ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};

const SolarActivityPanel: React.FC = () => {
  const context = useSpaceWeatherContext();
  if (!context) return null;
  const { settings, updateSettings } = context;
  return (
    <div className={styles.fallback}>
      Solar active regions + flare alerts will surface here.
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={[styles.toggleButton, settings.showSolarActivity ? styles.toggleButtonActive : ''].filter(Boolean).join(' ')}
          onClick={() => updateSettings({ showSolarActivity: !settings.showSolarActivity })}
        >
          <span>Solar Activity Feed</span>
          <span>{settings.showSolarActivity ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};

const IonospherePanel: React.FC = () => (
  <div className={styles.fallback}>
    TEC and ionospheric density controls are wiring up next. Expect knobs for layer selection and disturbance alerts.
  </div>
);

const CosmicRayPanel: React.FC = () => (
  <div className={styles.fallback}>
    Cosmic ray flux overlays will land here, including cutoff rigidity and satellite-channel toggles.
  </div>
);


const layerPanels: Record<string, React.FC | undefined> = {
  electricFields: ElectricFieldsPanel,
  geomagneticIndex: GeomagneticPanel,
  solarWind: SolarWindPanel,
  magnetosphere: MagnetospherePanel,
  aurora: AuroraPanel,
  radiation: RadiationPanel,
  ionosphere: IonospherePanel,
  solarActivity: SolarActivityPanel,
  cosmicRays: CosmicRayPanel
};

export const SpaceWeatherControlSurface: React.FC<SpaceWeatherControlSurfaceProps> = ({ interactive, passive }) => {
  const context = useSpaceWeatherContext();
  const { showPopup } = usePopup();
  const [isSwitching, setIsSwitching] = useState(false);
  const activeLayerId = interactive.layerId;
  const layer = interactive.layer ?? getSpaceWeatherLayer(activeLayerId);
  const Panel = layerPanels[activeLayerId];
  const previousLayerRef = useRef(activeLayerId);

  useEffect(() => {
    if (previousLayerRef.current === activeLayerId) {
      return;
    }
    previousLayerRef.current = activeLayerId;
    setIsSwitching(true);
    const timeout = window.setTimeout(() => setIsSwitching(false), 220);
    return () => window.clearTimeout(timeout);
  }, [activeLayerId]);

  if (!context || !layer) {
    return null;
  }

  const telemetry = passive.telemetry;
  const { providerStatus } = context;

  const surfaceClassName = [styles.surface, isSwitching ? styles.surfaceSwitching : ''].filter(Boolean).join(' ');

  const openDetails = () => {
    showPopup({
      component: SpaceWeatherDetailsPopover,
      props: {
        providerMeta: spaceWeatherProviderMeta,
        providerStatus,
        telemetry: telemetry ? {
          rawInterMag: telemetry.rawInterMag,
          rawUSCanada: telemetry.rawUSCanada,
          rawPipeline: telemetry.rawPipeline,
          samplingStrategy: telemetry.samplingStrategy
        } : undefined
      }
    });
  };

  return (
    <div className={surfaceClassName}>
      <div className={styles.surfaceHeader}>
        <div className={styles.layerChip}>
          <span>{layer.emoji}</span>
          <span>{layer.label}</span>
        </div>
        <button
          type="button"
          className={styles.infoButton}
          aria-label="Space weather details"
          onClick={openDetails}
        >
          ℹ️
        </button>
      </div>
      {isSwitching && (
        <div className={styles.switchNotice} aria-live="polite">
          Switching to {layer.label}&hellip;
        </div>
      )}
      <div className={styles.contextPanel}>
        <div key={activeLayerId} className={styles.contextPanelBody}>
          {Panel ? <Panel /> : <FallbackPanel layerName={layer.label} />}
        </div>
      </div>
    </div>
  );
};

export default SpaceWeatherControlSurface;
