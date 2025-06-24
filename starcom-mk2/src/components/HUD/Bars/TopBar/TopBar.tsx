import React, { useState, useMemo } from 'react';
import { TOPBAR_CATEGORIES } from './topbarCategories';
import { useTopBarPreferences } from './useTopBarPreferences';
import EnhancedSettingsPopup from './EnhancedSettingsPopup';
import Marquee from './Marquee';
import { useTopBarData } from './useTopBarData';
import WalletStatusMini from '../../../Auth/WalletStatusMini';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
  const { preferences, setCategoryEnabled } = useTopBarPreferences();
  const [modalOpen, setModalOpen] = useState(false);
  // Use all real data from useTopBarData
  const {
    commodities,
    indices,
    crypto,
    forex,
    economic,
    news,
    sentiment,
    loading
  } = useTopBarData();

  // Compose data points for the marquee with real data
  const dataPoints = useMemo(() => {
    if (loading) return [];
    return TOPBAR_CATEGORIES.filter(cat => preferences.enabledCategories[cat.id])
      .map(cat => {
        let value = '';
        switch (cat.id) {
          case 'commodities': value = commodities || 'N/A'; break;
          case 'indices': value = indices || 'N/A'; break;
          case 'crypto': value = crypto || 'N/A'; break;
          case 'forex': value = forex || 'N/A'; break;
          case 'economic': value = economic || 'N/A'; break;
          case 'news': value = news || 'N/A'; break;
          case 'sentiment': value = sentiment || 'N/A'; break;
          default: value = 'N/A';
        }
        return { id: cat.id, label: cat.label, icon: cat.icon, value };
      });
  }, [preferences.enabledCategories, commodities, indices, crypto, forex, economic, news, sentiment, loading]);

  return (
    <header
      className={styles.topBar}
      role="banner"
      aria-label="Top navigation bar"
      data-testid="topbar-root"
    >
      <button
        className={styles.settingsButton}
        aria-label="Open settings"
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
        onClick={() => setModalOpen(true)}
        tabIndex={0}
        data-testid="topbar-settings-btn"
      >
        <span role="img" aria-label="Settings">⚙️</span>
      </button>
      <div className={styles.marqueeSection} aria-label="News and data marquee">
        <Marquee dataPoints={dataPoints} />
      </div>
      <div className={styles.walletSection}>
        <WalletStatusMini />
      </div>
      
      <EnhancedSettingsPopup
        open={modalOpen}
        enabledCategories={preferences.enabledCategories}
        onCategoryToggle={setCategoryEnabled}
        onClose={() => setModalOpen(false)}
        categories={TOPBAR_CATEGORIES}
      />
    </header>
  );
};

export default TopBar;