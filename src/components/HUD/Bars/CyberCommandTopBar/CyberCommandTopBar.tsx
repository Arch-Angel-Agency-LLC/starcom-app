import React, { useMemo, useCallback } from 'react';
import { TOPBAR_CATEGORIES } from './topbarCategories';
import { useTopBarPreferences } from './useTopBarPreferences';
import CyberCommandMarquee from './CyberCommandMarquee';
import EnhancedSettingsPopup from './EnhancedSettingsPopup';
import { useTopBarData } from './useTopBarData';
import { MarqueeDataPoint } from './interfaces';
import { usePopup } from '../../../Popup/PopupManager';
import styles from './CyberCommandTopBar.module.css';

const CyberCommandTopBar: React.FC = () => {
  const { preferences } = useTopBarPreferences();
  const { showPopup } = usePopup();

  // Data point click handler for future detailed popup functionality
  const handleDataPointClick = React.useCallback((dataPoint: MarqueeDataPoint) => {
    console.log('Data point clicked:', dataPoint);
    // TODO: Open DetailedDataPopup when implemented
  }, []);

  // Data point hover handler for future hover effects
  const handleDataPointHover = React.useCallback((dataPoint: MarqueeDataPoint) => {
    console.log('Data point hovered:', dataPoint);
    // TODO: Show hover tooltip when implemented
  }, []);
  // Use all real data from useTopBarData - includes comprehensive energy intelligence
  const {
    // Existing categories
    commodities,
    indices,
    crypto,
    forex,
    economic,
    news,
    sentiment,
    
    // New energy intelligence categories
    energySecurity,
    powerGrid,
    renewables,
    marketIntelligence,
    supplyChain,
    strategicFuels,
    tradeBalance,
    baseloadPower,
    
    // State management
    error,
    
    // Enhanced progressive state
    loadingStates,
    dataAvailability
  } = useTopBarData();

  // Compose data points for the marquee with comprehensive energy intelligence and enhanced state handling
  const dataPoints = useMemo(() => {
    // Never return empty array based on loading - always show available data
    try {
      return TOPBAR_CATEGORIES.filter(cat => preferences.enabledCategories[cat.id])
        .map(cat => {
          let value = '';
          let isLoading = loadingStates[cat.id] || false;
          let hasError = false;
          let priority: 'critical' | 'important' | 'standard' = 'standard';
          
          // Determine priority based on category
          if (['energy-security', 'power-grid', 'strategic-fuels'].includes(cat.id)) {
            priority = 'critical';
          } else if (['market-intelligence', 'renewables', 'supply-chain'].includes(cat.id)) {
            priority = 'important';
          }
          
          try {
            switch (cat.id) {
              // Existing categories
              case 'commodities': value = commodities || 'N/A'; break;
              case 'indices': value = indices || 'N/A'; break;
              case 'crypto': value = crypto || 'N/A'; break;
              case 'forex': value = forex || 'N/A'; break;
              case 'economic': value = economic || 'N/A'; break;
              case 'news': value = news || 'N/A'; break;
              case 'sentiment': value = sentiment || 'N/A'; break;
              
              // New energy intelligence categories
              case 'energy-security': value = energySecurity || 'N/A'; break;
              case 'power-grid': value = powerGrid || 'N/A'; break;
              case 'renewables': value = renewables || 'N/A'; break;
              case 'market-intelligence': value = marketIntelligence || 'N/A'; break;
              case 'supply-chain': value = supplyChain || 'N/A'; break;
              case 'strategic-fuels': value = strategicFuels || 'N/A'; break;
              case 'trade-balance': value = tradeBalance || 'N/A'; break;
              case 'baseload-power': value = baseloadPower || 'N/A'; break;
              
              default: 
                console.warn(`Unknown category ID: ${cat.id}`);
                value = 'N/A';
                hasError = true;
            }
          } catch (valueError) {
            console.error(`Error processing category ${cat.id}:`, valueError);
            value = 'Error';
            hasError = true;
          }
          
          // Check if data is actually loading (not just N/A)
          if (value === 'Loading...' || (value === 'N/A' && !dataAvailability[cat.id])) {
            isLoading = true;
          }
          
          return { 
            id: cat.id, 
            label: cat.label, 
            icon: cat.icon, 
            value: value || 'N/A',
            isLoading,
            hasError,
            priority
          };
        });
    } catch (error) {
      console.error('Error composing dataPoints:', error);
      return []; // Return empty array on error to prevent UI crash
    }
  }, [
    preferences.enabledCategories, 
    // Existing categories
    commodities, indices, crypto, forex, economic, news, sentiment, 
    // New energy intelligence categories
    energySecurity, powerGrid, renewables, marketIntelligence, 
    supplyChain, strategicFuels, tradeBalance, baseloadPower, 
    // Enhanced state
    loadingStates, dataAvailability
  ]);

  // Settings popup handler - opens EnhancedSettingsPopup for marquee configuration
  const handleOpenSettings = useCallback((dataPointId?: string) => {
    console.log('Opening settings popup', dataPointId ? `for data point: ${dataPointId}` : '');
    
    showPopup({
      component: ({ onClose }: { onClose: () => void }) => (
        <EnhancedSettingsPopup
          open={true}
          onClose={onClose}
          enabledCategories={preferences.enabledCategories}
          onCategoryToggle={(categoryId: string, enabled: boolean) => {
            console.log(`Toggle category ${categoryId}: ${enabled}`);
            // TODO: Implement category toggle functionality
          }}
          categories={TOPBAR_CATEGORIES}
          currentDataPoints={dataPoints}
          // If a specific data point was clicked, navigate to it
          {...(dataPointId && {
            activeTab: 'data'
          })}
        />
      ),
      backdrop: true,
      zIndex: 4000 // Higher than other popups to ensure it appears on top
    });
  }, [preferences.enabledCategories, showPopup, dataPoints]);

  return (
    <header
      className={styles.topBar}
      role="banner"
      aria-label="Top navigation bar"
      data-testid="topbar-root"
    >
      <div className={styles.marqueeSection} aria-label="News and data marquee">
        <CyberCommandMarquee 
          dataPoints={dataPoints} 
          error={error}
          loadingStates={loadingStates}
          dataAvailability={dataAvailability}
          isDraggable={true}
          onDataPointClick={handleDataPointClick}
          onDataPointHover={handleDataPointHover}
          onOpenSettings={handleOpenSettings}
        />
      </div>
    </header>
  );
};

export default CyberCommandTopBar;