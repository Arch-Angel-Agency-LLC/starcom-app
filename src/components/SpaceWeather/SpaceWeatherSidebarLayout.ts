import { useMemo } from 'react';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import { useSpaceWeatherContext, type SpaceWeatherContextType } from '../../context/SpaceWeatherContext';
import { getSpaceWeatherLayer, type SpaceWeatherLayerDefinition } from './SpaceWeatherLayerRegistry';

export type SpaceWeatherDatasetFlags = Record<'intermag' | 'usCanada' | 'pipeline', boolean>;

type ProviderKey = 'legacy' | 'enterprise' | 'enhanced';

interface SpaceWeatherSettingsSummary {
  samplingMode: SpaceWeatherContextType['settings']['samplingMode'];
  legacyCap?: SpaceWeatherContextType['settings']['legacyCap'];
  gridBinSize?: SpaceWeatherContextType['settings']['gridBinSize'];
  magnitudeFloor?: SpaceWeatherContextType['settings']['magnitudeFloor'];
}

interface ProviderStatusEntry {
  key: ProviderKey;
  label: string;
  available: boolean;
  lastTested?: Date;
  error?: string;
}

export interface SpaceWeatherInteractiveBundle {
  layerId: string;
  layer: SpaceWeatherLayerDefinition | null;
  capability: SpaceWeatherLayerDefinition['capability'];
  statusHint?: string;
  datasetFlags: SpaceWeatherDatasetFlags;
  settingsComponent?: string;
}

export interface SpaceWeatherPassiveBundle {
  telemetry: SpaceWeatherContextType['telemetry'];
  telemetryHistory: SpaceWeatherContextType['telemetryHistory'];
  lastLayerTimestamp: number | null;
  lastContextUpdate: number | null;
  gatingReason: SpaceWeatherContextType['telemetry']['gatingReason'];
  alerts: SpaceWeatherContextType['alerts'];
  enhancedAlerts: SpaceWeatherContextType['enhancedAlerts'];
  settingsSummary: SpaceWeatherSettingsSummary;
  providerStatus: ProviderStatusEntry[];
  currentProvider: SpaceWeatherContextType['currentProvider'];
}

export interface SpaceWeatherSidebarLayout {
  isSpaceWeatherActive: boolean;
  layerId: string | null;
  layer: SpaceWeatherLayerDefinition | null;
  interactive: SpaceWeatherInteractiveBundle | null;
  passive: SpaceWeatherPassiveBundle | null;
}

const providerLabels: Record<ProviderKey, string> = {
  legacy: 'Legacy',
  enterprise: 'Enterprise',
  enhanced: 'Enhanced'
};

const resolveLayerTimestamp = (
  layerId: string,
  telemetry: SpaceWeatherContextType['telemetry'],
  lastUpdated: Date | null
): number | null => {
  const { modes } = telemetry;
  switch (layerId) {
    case 'geomagneticIndex':
      return modes.geomagnetic.lastUpdate ?? null;
    case 'solarWind':
      return modes.solarWind.lastUpdate ?? null;
    case 'aurora':
      return modes.auroralOval.lastUpdate ?? null;
    case 'magnetosphere':
      return modes.magnetopause.lastUpdate ?? null;
    case 'radiation':
      return modes.magneticField.lastUpdate ?? null;
    default:
      return lastUpdated ? lastUpdated.getTime() : null;
  }
};

export const useSpaceWeatherSidebarLayout = (): SpaceWeatherSidebarLayout => {
  const { visualizationMode } = useVisualizationMode();
  const context = useSpaceWeatherContext();

  const isSpaceWeatherActive = visualizationMode.mode === 'EcoNatural' && visualizationMode.subMode === 'SpaceWeather';

  const settings = context.settings;
  const activeLayerId = settings.activeLayer;
  const enabledDatasets = settings.enabledDatasets;
  const samplingMode = settings.samplingMode;
  const legacyCap = settings.legacyCap;
  const gridBinSize = settings.gridBinSize;
  const magnitudeFloor = settings.magnitudeFloor;
  const telemetry = context.telemetry;
  const telemetryHistory = context.telemetryHistory;
  const lastContextUpdate = context.lastUpdated ? context.lastUpdated.getTime() : null;
  const providerStatus = context.providerStatus;
  const currentProvider = context.currentProvider;
  const alerts = context.alerts;
  const enhancedAlerts = context.enhancedAlerts;

  return useMemo<SpaceWeatherSidebarLayout>(() => {
    if (!isSpaceWeatherActive) {
      return {
        isSpaceWeatherActive,
        layerId: null,
        layer: null,
        interactive: null,
        passive: null
      };
    }

    const layer = getSpaceWeatherLayer(activeLayerId) ?? null;

    const datasetFlags: SpaceWeatherDatasetFlags = {
      intermag: enabledDatasets.intermag,
      usCanada: enabledDatasets.usCanada,
      pipeline: enabledDatasets.pipeline
    };

    const providerEntries: ProviderStatusEntry[] = (Object.entries(providerStatus) as Array<[
      ProviderKey,
      SpaceWeatherContextType['providerStatus'][ProviderKey]
    ]>).map(([key, status]) => ({
      key,
      label: providerLabels[key],
      available: status.available,
      lastTested: status.lastTested,
      error: status.error
    }));

    const interactive: SpaceWeatherInteractiveBundle = {
      layerId: activeLayerId,
      layer,
      capability: layer?.capability ?? 'planned',
      statusHint: layer?.statusHint,
      datasetFlags,
      settingsComponent: layer?.settingsComponent
    };

    const passive: SpaceWeatherPassiveBundle = {
      telemetry,
      telemetryHistory,
      lastLayerTimestamp: resolveLayerTimestamp(activeLayerId, telemetry, context.lastUpdated ?? null),
      lastContextUpdate,
      gatingReason: telemetry.gatingReason,
      alerts,
      enhancedAlerts,
      settingsSummary: {
        samplingMode,
        legacyCap,
        gridBinSize,
        magnitudeFloor
      },
      providerStatus: providerEntries,
      currentProvider
    };

    return {
      isSpaceWeatherActive,
      layerId: activeLayerId,
      layer,
      interactive,
      passive
    };
  }, [
    isSpaceWeatherActive,
    activeLayerId,
    enabledDatasets.intermag,
    enabledDatasets.usCanada,
    enabledDatasets.pipeline,
    telemetry,
    telemetryHistory,
    providerStatus,
    currentProvider,
    alerts,
    enhancedAlerts,
    samplingMode,
    legacyCap,
    gridBinSize,
    magnitudeFloor,
    context.lastUpdated,
    lastContextUpdate
  ]);
};
