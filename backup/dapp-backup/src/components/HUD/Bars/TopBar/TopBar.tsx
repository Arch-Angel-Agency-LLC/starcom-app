import React, { useMemo, useState } from 'react';
import { TOPBAR_CATEGORIES } from './topbarCategories';
import { useTopBarPreferences } from './useTopBarPreferences';
import Marquee from './Marquee';
import { useTopBarData } from './useTopBarData';
import WalletStatusMini from '../../../Auth/WalletStatusMini';
import EnhancedSettingsPopup, { type EnhancedSettings, type EnhancedSettingsPopupRef } from './EnhancedSettingsPopup';
import { MarqueeDataPoint } from './interfaces';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
  const { preferences, setCategoryEnabled } = useTopBarPreferences();
  const settingsTabRef = React.useRef<EnhancedSettingsPopupRef>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Enhanced settings popup handlers
  const handleOpenSettings = React.useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleCloseSettings = React.useCallback(() => {
    setSettingsOpen(false);
  }, []);

  // Handle opening settings for a specific data point
  const handleOpenDataPointSettings = React.useCallback((dataPointId?: string) => {
    setSettingsOpen(true);
    // If a specific data point ID is provided, we can navigate to its section
    if (dataPointId && settingsTabRef.current) {
      // Store the target data point for the settings popup
      settingsTabRef.current.navigateToDataPoint(dataPointId);
    }
  }, []);

  const handleCategoryToggle = React.useCallback((categoryId: string, enabled: boolean) => {
    setCategoryEnabled(categoryId, enabled);
  }, [setCategoryEnabled]);

  const handleCategoryReorder = React.useCallback((newOrder: string[]) => {
    // For now, we'll just log the new order
    // In a full implementation, we'd store the order in preferences
    console.log('New category order:', newOrder);
  }, []);

  const handlePreviewSettings = React.useCallback((settings: EnhancedSettings) => {
    // Apply preview settings to marquee temporarily
    console.log('Previewing settings:', settings);
  }, []);

  // Data point click handler for future detailed popup functionality
  const handleDataPointClick = React.useCallback((dataPoint: MarqueeDataPoint) => {
    console.log('Data point clicked:', dataPoint);
    // TODO: Open DetailedDataPopup when implemented
    // setSelectedDataPoint(dataPoint);
    // setDetailPopupOpen(true);
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

  return (
    <>
      <header
        className={styles.topBar}
        role="banner"
        aria-label="Top navigation bar"
        data-testid="topbar-root"
      >
        <div className={styles.marqueeSection} aria-label="News and data marquee">
          <Marquee 
            dataPoints={dataPoints} 
            error={error}
            loadingStates={loadingStates}
            dataAvailability={dataAvailability}
            isDraggable={true}
            onDataPointClick={handleDataPointClick}
            onDataPointHover={handleDataPointHover}
            onOpenSettings={handleOpenDataPointSettings}
          />
        </div>
        <div className={styles.controlSection}>
          <button
            onClick={handleOpenSettings}
            className={styles.settingsButton}
            title="Open Enhanced Settings"
            aria-label="Open enhanced marquee settings"
          >
            ⚙️
          </button>
        </div>
        <div className={styles.walletSection}>
          <WalletStatusMini />
        </div>
      </header>

      {/* Enhanced Settings Popup */}
      <EnhancedSettingsPopup
        ref={settingsTabRef}
        open={settingsOpen}
        enabledCategories={preferences.enabledCategories}
        onCategoryToggle={handleCategoryToggle}
        onClose={handleCloseSettings}
        categories={TOPBAR_CATEGORIES}
        currentDataPoints={dataPoints}
        onReorderCategories={handleCategoryReorder}
        onPreviewSettings={handlePreviewSettings}
      />
    </>
  );
};

export default TopBar;