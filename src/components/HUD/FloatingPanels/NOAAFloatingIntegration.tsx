import React, { useEffect } from 'react';
import { useFloatingPanels } from './FloatingPanelContext';
import { useEcoNaturalSettings } from '../../../hooks/useEcoNaturalSettings';
import { useFeatureFlag } from '../../../utils/featureFlags';
import { NOAA_VISUALIZATIONS } from '../Bars/LeftSideBar/NOAAVisualizationConfig';
import AuroraPanel from './panels/AuroraPanel';
import SolarFlarePanel from './panels/SolarFlarePanel';

const NOAAFloatingIntegration: React.FC = () => {
  const { registerPanel, addActiveFeature, removeActiveFeature } = useFloatingPanels();
  const { config } = useEcoNaturalSettings();
  const autoShowSolarFlarePopups = useFeatureFlag('autoShowSolarFlarePopupsEnabled');

  useEffect(() => {
    // Register Aurora panels when aurora visualization is enabled
    const auroraEnabled = NOAA_VISUALIZATIONS
      .find((d) => d.datasetId === 'geomagnetic-kp-index')
      ?.options.find((o) => o.id === 'aurora-oval')?.enabled;

    if (auroraEnabled) {
      addActiveFeature('aurora');
      
      registerPanel({
        id: 'noaa-aurora-panel',
        type: 'stream',
        title: 'Aurora Monitor',
        component: AuroraPanel,
        position: {
          anchorTo: 'geographic',
          lat: 70,
          lng: -100,
          offset: { x: 50, y: -30 }
        },
        priority: 'primary',
        triggers: ['aurora'],
        data: {
          activity: 'Live',
          kpIndex: 4.2,
          visibility: 'High Latitude',
          forecast: 'Increasing'
        }
      });
    } else {
      removeActiveFeature('aurora');
    }

    // Register Solar flare panels when solar visualization is enabled AND feature flag allows auto-popup
    const solarEnabled = NOAA_VISUALIZATIONS
      .find((d) => d.datasetId === 'solar-xray-flux')
      ?.options.find((o) => o.id === 'xray-sun-glow')?.enabled;

    if (solarEnabled && autoShowSolarFlarePopups) {
      addActiveFeature('solar-activity');
      
      registerPanel({
        id: 'noaa-solar-panel',
        type: 'alert',
        title: 'Solar Activity',
        component: SolarFlarePanel,
        position: {
          anchorTo: 'screen',
          x: window.innerWidth - 280, // Account for RightSideBar (120px) + padding
          y: 80, // Below TopBar (assume ~60px + padding)
          offset: { x: 0, y: 0 }
        },
        priority: 'primary',
        triggers: ['solar-flare'],
        data: {
          class: 'Real-time',
          region: 'NOAA Data',
          peak: 'Live',
          impact: 'Monitoring'
        }
      });
    } else {
      removeActiveFeature('solar-activity');
    }
  }, [registerPanel, addActiveFeature, removeActiveFeature, config, autoShowSolarFlarePopups]);

  return null; // This component only manages panels, doesn't render anything
};

export default NOAAFloatingIntegration;
