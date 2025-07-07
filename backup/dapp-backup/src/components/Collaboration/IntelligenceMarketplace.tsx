/**
 * Intelligence Marketplace Component
 * Web3-based intelligence asset trading and sharing platform
 */

import React, { useState } from 'react';
import RealTimeEventSystem from '../../services/realTimeEventSystem';
import AssetTrading from './AssetTrading';
import AuthGate from '../Auth/AuthGate';
import styles from './IntelligenceMarketplace.module.css';
import { SharedIntelligenceAsset } from '../../types/features/collaboration';

// AI-NOTE: Temporary mock hook until proper marketplace context is implemented
// TODO: Implement end-to-end encryption for all team communications - PRIORITY: HIGH
const useIntelligenceMarketplace = () => ({
  marketplace: {
    assets: [] as SharedIntelligenceAsset[],
    availableAssets: [] as SharedIntelligenceAsset[],
    myAssets: [] as SharedIntelligenceAsset[],
    purchasedAssets: [] as SharedIntelligenceAsset[],
    loading: false,
    error: null
  }
});

const IntelligenceMarketplace: React.FC = () => {
  const { marketplace } = useIntelligenceMarketplace();
  const [activeView, setActiveView] = useState<'browse' | 'my-assets' | 'purchased' | 'trading'>('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const eventSystem = RealTimeEventSystem.getInstance();

  const handleAction = async (action: string) => {
    try {
      eventSystem.emit({
        type: 'UI_SHOW_NOTIFICATION',
        payload: {
          title: `Asset ${action}`,
          message: `Intelligence asset action: ${action}`,
          type: 'success',
          duration: 4000
        },
        source: 'user',
        timestamp: new Date(),
        priority: 'normal'
      });

      if (action === 'Purchased') {
        eventSystem.emit({
          type: 'UI_FLASH_INDICATOR',
          payload: {
            element: 'marketplace-tab',
            color: '#00ff00',
            duration: 2000
          },
          source: 'user',
          timestamp: new Date(),
          priority: 'normal'
        });
      }
    } catch {
      eventSystem.emit({
        type: 'UI_SHOW_NOTIFICATION',
        payload: {
          title: `${action} Failed`,
          message: `Failed to ${action.toLowerCase()} intelligence asset`,
          type: 'error',
          duration: 5000
        },
        source: 'system',
        timestamp: new Date(),
        priority: 'high'
      });
    }
  };

  const getAssetIcon = (category: string) => {
    switch (category) {
      case 'THREAT_ANALYSIS': return '🚨';
      case 'GEOSPATIAL_DATA': return '🌍';
      case 'NETWORK_TOPOLOGY': return '🔗';
      case 'COMMUNICATION_PATTERNS': return '📡';
      case 'BEHAVIORAL_ANALYSIS': return '👥';
      case 'SATELLITE_IMAGERY': return '🛰️';
      case 'CYBER_INDICATORS': return '🔒';
      case 'HUMAN_INTELLIGENCE': return '🕵️';
      default: return '📄';
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'TOP_SECRET': return '#ff3366';
      case 'SECRET': return '#ff9900';
      case 'CONFIDENTIAL': return '#ffcc00';
      case 'UNCLASSIFIED': return '#00ff41';
      default: return '#888';
    }
  };

  const getAssetsForView = () => {
    switch (activeView) {
      case 'my-assets': return marketplace.myAssets;
      case 'purchased': return marketplace.purchasedAssets;
      default: return marketplace.availableAssets;
    }
  };

  const filteredAssets = getAssetsForView().filter(asset => 
    searchTerm === '' || 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.marketplace}>
      {/* Header with view tabs */}
      <div className={styles.marketplaceHeader}>
        <div className={styles.viewTabs}>
          <button
            className={`${styles.viewTab} ${activeView === 'browse' ? styles.activeView : ''}`}
            onClick={() => setActiveView('browse')}
          >
            Browse ({marketplace.availableAssets.length})
          </button>
          <button
            className={`${styles.viewTab} ${activeView === 'my-assets' ? styles.activeView : ''}`}
            onClick={() => setActiveView('my-assets')}
          >
            My Assets ({marketplace.myAssets.length})
          </button>
          <button
            className={`${styles.viewTab} ${activeView === 'purchased' ? styles.activeView : ''}`}
            onClick={() => setActiveView('purchased')}
          >
            Purchased ({marketplace.purchasedAssets.length})
          </button>
          <button
            className={`${styles.viewTab} ${activeView === 'trading' ? styles.activeView : ''}`}
            onClick={() => setActiveView('trading')}
          >
            🔥 Trading Hub
          </button>
        </div>
      </div>

      {/* Search - only show for non-trading views */}
      {activeView !== 'trading' && (
        <div className={styles.searchSection}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assets..."
            className={styles.searchInput}
          />
        </div>
      )}

      {/* Trading Hub View */}
      {activeView === 'trading' && (
        <AuthGate 
          requirement="wallet"
          action="access the trading hub"
          variant="card"
          size="medium"
        >
          <AssetTrading
            assets={marketplace.availableAssets}
            onAssetPurchase={(assetId) => {
              // AI-NOTE: Suppress unused parameter warning until implementation
              void assetId;
              handleAction('Purchased');
            }}
            className={styles.tradingView}
          />
        </AuthGate>
      )}

      {/* Regular Asset Grid View */}
      {activeView !== 'trading' && (
        <>
          <div className={styles.assetGrid}>
            {filteredAssets.map(asset => (
              <div key={asset.id} className={styles.assetCard}>
                <div className={styles.assetHeader}>
                  <span className={styles.assetIcon}>{getAssetIcon(asset.category)}</span>
                  <span className={styles.assetType}>{asset.category}</span>
                  <span 
                    className={styles.classification}
                    style={{ backgroundColor: getClassificationColor(asset.classification) }}
                  >
                    {asset.classification}
                  </span>
                </div>

                <div className={styles.assetTitle}>{asset.name}</div>
                <div className={styles.assetDescription}>{asset.description}</div>

                <div className={styles.assetMeta}>
                  <div className={styles.provider}>
                    <span className={styles.label}>Agency:</span>
                    <span className={styles.value}>{asset.sourceAgency}</span>
                  </div>
                  <div className={styles.timestamp}>
                    <span className={styles.label}>Created:</span>
                    <span className={styles.value}>{asset.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className={styles.assetFooter}>
                  <div className={styles.price}>
                    <span className={styles.priceValue}>
                      {asset.pricing.tokenCost || asset.pricing.fiatCost || 0}
                    </span>
                    <span className={styles.priceCurrency}>
                      {asset.pricing.currency || 'Credits'}
                    </span>
                  </div>

                  <div className={styles.assetActions}>
                    {activeView === 'browse' && (
                      <AuthGate 
                        requirement="wallet"
                        action="purchase intelligence assets"
                        variant="button"
                        size="small"
                      >
                        <button
                          onClick={() => handleAction('Purchased')}
                          className={styles.purchaseButton}
                        >
                          Purchase
                        </button>
                      </AuthGate>
                    )}
                    {activeView === 'my-assets' && (
                      <AuthGate 
                        requirement="wallet"
                        action="share intelligence assets"
                        variant="button"
                        size="small"
                      >
                        <button
                          onClick={() => handleAction('Shared')}
                          className={styles.shareButton}
                        >
                          Share
                        </button>
                      </AuthGate>
                    )}
                    {activeView === 'purchased' && (
                      <button
                        className={styles.downloadButton}
                        onClick={() => handleAction('Downloaded')}
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <div className={styles.noAssets}>
              <div className={styles.noAssetsIcon}>📭</div>
              <div className={styles.noAssetsText}>No assets found</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IntelligenceMarketplace;
