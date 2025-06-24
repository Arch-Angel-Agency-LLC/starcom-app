/**
 * Intelligence Asset Trading Component
 * 
 * Advanced interface for Web3-based intelligence asset transactions,
 * including asset validation, blockchain provenance, and secure trading.
 */

import React, { useState, useCallback } from 'react';
import RealTimeEventSystem from '../../services/realTimeEventSystem';
import type { 
  SharedIntelligenceAsset, 
  IntelligenceCategory, 
  ProvenanceChain
} from '../../types';
import styles from './AssetTrading.module.css';

// ============================================================================
// ASSET DETAIL COMPONENT
// ============================================================================

interface AssetDetailProps {
  asset: SharedIntelligenceAsset;
  onPurchase: (assetId: string) => void;
  onValidate: (assetId: string) => void;
  onClose: () => void;
  isPurchasing: boolean;
}

const AssetDetail: React.FC<AssetDetailProps> = ({ 
  asset, 
  onPurchase, 
  onValidate, 
  onClose, 
  isPurchasing 
}) => {
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return '#4caf50';
      case 'PENDING': return '#ff9800';
      case 'DISPUTED': return '#f44336';
      case 'REJECTED': return '#424242';
      default: return '#757575';
    }
  };

  const getCategoryIcon = (category: IntelligenceCategory) => {
    const icons = {
      'THREAT_ANALYSIS': '🎯',
      'GEOSPATIAL_DATA': '🌍',
      'NETWORK_TOPOLOGY': '🕸️',
      'COMMUNICATION_PATTERNS': '📡',
      'BEHAVIORAL_ANALYSIS': '👥',
      'SATELLITE_IMAGERY': '🛰️',
      'CYBER_INDICATORS': '💻',
      'HUMAN_INTELLIGENCE': '🕵️'
    };
    return icons[category] || '📊';
  };

  const renderTrustScore = (score: number) => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#4caf50';
      if (score >= 60) return '#ff9800';
      return '#f44336';
    };

    const barWidth = (score / 100) * 100;

    return (
      <div className={styles.trustScore}>
        <div className={styles.trustScoreBar}>
          <div 
            className={styles.trustScoreFill}
            style={{ 
              width: `${barWidth}%`,
              backgroundColor: getScoreColor(score)
            }}
          />
        </div>
        <span className={styles.trustScoreValue}>{score}%</span>
      </div>
    );
  };

  const renderProvenance = (provenance: ProvenanceChain[]) => {
    return (
      <div className={styles.provenanceChain}>
        {provenance.slice(0, 3).map((entry) => (
          <div key={entry.transactionId} className={styles.provenanceEntry}>
            <div className={styles.provenanceIcon}>
              {entry.action === 'CREATED' && '🏗️'}
              {entry.action === 'SHARED' && '📤'}
              {entry.action === 'MODIFIED' && '✏️'}
              {entry.action === 'VALIDATED' && '✅'}
              {entry.action === 'ACCESSED' && '👁️'}
            </div>
            <div className={styles.provenanceDetails}>
              <div className={styles.provenanceAction}>{entry.action}</div>
              <div className={styles.provenanceTime}>
                {new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date(entry.timestamp))}
              </div>
            </div>
          </div>
        ))}
        {provenance.length > 3 && (
          <div className={styles.provenanceMore}>
            +{provenance.length - 3} more entries
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.assetDetailOverlay}>
      <div className={styles.assetDetail}>
        <div className={styles.detailHeader}>
          <div className={styles.assetTitle}>
            <span className={styles.categoryIcon}>
              {getCategoryIcon(asset.category)}
            </span>
            <div>
              <h3>{asset.name}</h3>
              <p className={styles.assetCategory}>{asset.category.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.detailContent}>
          <div className={styles.assetMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Source Agency</span>
              <span className={styles.metaValue}>{asset.sourceAgency}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Classification</span>
              <span className={styles.metaValue}>{asset.classification}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>File Size</span>
              <span className={styles.metaValue}>{formatFileSize(asset.metadata.size)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Downloads</span>
              <span className={styles.metaValue}>{asset.downloadCount}</span>
            </div>
          </div>

          <div className={styles.assetDescription}>
            <h4>Description</h4>
            <p>{asset.description}</p>
          </div>

          <div className={styles.trustSection}>
            <h4>Trust & Validation</h4>
            <div className={styles.trustDetails}>
              <div className={styles.trustItem}>
                <span className={styles.trustLabel}>Trust Score</span>
                {renderTrustScore(asset.trustScore)}
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustLabel}>Status</span>
                <span 
                  className={styles.validationStatus}
                  style={{ color: getValidationStatusColor(asset.validationStatus) }}
                >
                  {asset.validationStatus}
                </span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustLabel}>Confidence</span>
                <span className={styles.confidenceScore}>
                  {Math.round(asset.metadata.confidenceScore * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className={styles.provenanceSection}>
            <h4>Blockchain Provenance</h4>
            {renderProvenance(asset.provenance)}
          </div>

          <div className={styles.pricingSection}>
            <h4>Access & Pricing</h4>
            <div className={styles.pricingDetails}>
              {asset.pricing.model === 'FREE' && (
                <div className={styles.priceTag}>
                  <span className={styles.priceLabel}>Free Access</span>
                </div>
              )}
              {asset.pricing.model === 'TOKEN_BASED' && (
                <div className={styles.priceTag}>
                  <span className={styles.priceValue}>{asset.pricing.tokenCost}</span>
                  <span className={styles.priceLabel}>tokens</span>
                </div>
              )}
              {asset.pricing.model === 'SUBSCRIPTION' && (
                <div className={styles.priceTag}>
                  <span className={styles.priceLabel}>Subscription Required</span>
                  <span className={styles.priceTier}>{asset.pricing.subscriptionTier}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.detailActions}>
          {asset.validationStatus !== 'VERIFIED' && (
            <button
              onClick={() => onValidate(asset.id)}
              className={styles.validateButton}
            >
              🔍 Validate Asset
            </button>
          )}
          
          <button
            onClick={() => onPurchase(asset.id)}
            disabled={isPurchasing}
            className={styles.purchaseButton}
          >
            {isPurchasing ? '⏳ Processing...' : '💰 Acquire Asset'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ASSET COMPARISON COMPONENT
// ============================================================================

interface AssetComparisonProps {
  assets: SharedIntelligenceAsset[];
  onSelect: (assetId: string) => void;
  onClose: () => void;
}

const AssetComparison: React.FC<AssetComparisonProps> = ({ assets, onSelect, onClose }) => {
  return (
    <div className={styles.comparisonOverlay}>
      <div className={styles.comparison}>
        <div className={styles.comparisonHeader}>
          <h3>Asset Comparison</h3>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.comparisonTable}>
          <div className={styles.comparisonRow}>
            <div className={styles.comparisonLabel}>Asset</div>
            {assets.map(asset => (
              <div key={asset.id} className={styles.comparisonCell}>
                <div className={styles.assetName}>{asset.name}</div>
                <div className={styles.assetCategory}>{asset.category}</div>
              </div>
            ))}
          </div>

          <div className={styles.comparisonRow}>
            <div className={styles.comparisonLabel}>Trust Score</div>
            {assets.map(asset => (
              <div key={asset.id} className={styles.comparisonCell}>
                <div className={styles.trustValue}>{asset.trustScore}%</div>
              </div>
            ))}
          </div>

          <div className={styles.comparisonRow}>
            <div className={styles.comparisonLabel}>Validation</div>
            {assets.map(asset => (
              <div key={asset.id} className={styles.comparisonCell}>
                <div className={styles.validationValue}>{asset.validationStatus}</div>
              </div>
            ))}
          </div>

          <div className={styles.comparisonRow}>
            <div className={styles.comparisonLabel}>Price</div>
            {assets.map(asset => (
              <div key={asset.id} className={styles.comparisonCell}>
                {asset.pricing.model === 'FREE' && <div>Free</div>}
                {asset.pricing.model === 'TOKEN_BASED' && (
                  <div>{asset.pricing.tokenCost} tokens</div>
                )}
                {asset.pricing.model === 'SUBSCRIPTION' && (
                  <div>{asset.pricing.subscriptionTier}</div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.comparisonRow}>
            <div className={styles.comparisonLabel}>Actions</div>
            {assets.map(asset => (
              <div key={asset.id} className={styles.comparisonCell}>
                <button
                  onClick={() => onSelect(asset.id)}
                  className={styles.selectButton}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN ASSET TRADING COMPONENT
// ============================================================================

interface AssetTradingProps {
  assets: SharedIntelligenceAsset[];
  onAssetPurchase: (assetId: string) => void;
  className?: string;
}

export const AssetTrading: React.FC<AssetTradingProps> = ({ 
  assets, 
  onAssetPurchase, 
  className 
}) => {
  const [selectedAsset, setSelectedAsset] = useState<SharedIntelligenceAsset | null>(null);
  const [comparisonAssets, setComparisonAssets] = useState<SharedIntelligenceAsset[]>([]);
  const [purchasingAsset, setPurchasingAsset] = useState<string | null>(null);
  const eventSystem = RealTimeEventSystem.getInstance();

  const handleAssetSelect = useCallback((asset: SharedIntelligenceAsset) => {
    setSelectedAsset(asset);
  }, []);

  const handleAssetPurchase = useCallback(async (assetId: string) => {
    setPurchasingAsset(assetId);
    
    try {
      await onAssetPurchase(assetId);
      
      // Show success notification
      eventSystem.emit({
        type: 'UI_SHOW_NOTIFICATION',
        payload: {
          title: 'Asset Acquired',
          message: 'Intelligence asset successfully acquired',
          type: 'success',
          duration: 4000
        },
        source: 'user',
        timestamp: new Date(),
        priority: 'normal'
      });

      setSelectedAsset(null);
    } catch (error) {
      console.error('Failed to purchase asset:', error);
      
      eventSystem.emit({
        type: 'UI_SHOW_NOTIFICATION',
        payload: {
          title: 'Purchase Failed',
          message: 'Failed to acquire intelligence asset',
          type: 'error',
          duration: 5000
        },
        source: 'user',
        timestamp: new Date(),
        priority: 'high'
      });
    } finally {
      setPurchasingAsset(null);
    }
  }, [onAssetPurchase, eventSystem]);

  const handleAssetValidate = useCallback((assetId: string) => {
    // Validation logic would be implemented here
    console.log('Validating asset:', assetId);
    eventSystem.emit({
      type: 'UI_SHOW_NOTIFICATION',
      payload: {
        title: 'Validation Requested',
        message: 'Asset validation request submitted for review',
        type: 'info',
        duration: 3000
      },
      source: 'user',
      timestamp: new Date(),
      priority: 'normal'
    });
  }, [eventSystem]);

  const handleCompareAssets = useCallback((assetIds: string[]) => {
    const assetsToCompare = assets.filter(asset => assetIds.includes(asset.id));
    setComparisonAssets(assetsToCompare);
  }, [assets]);

  const topAssets = assets
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 3);

  return (
    <div className={`${styles.assetTrading} ${className || ''}`}>
      <div className={styles.tradingHeader}>
        <h2>Intelligence Asset Trading</h2>
        <p>Secure Web3-based intelligence marketplace with blockchain provenance</p>
      </div>

      <div className={styles.featuredAssets}>
        <h3>🌟 Featured Assets</h3>
        <div className={styles.assetGrid}>
          {topAssets.map(asset => (
            <div 
              key={asset.id} 
              className={styles.featuredAssetCard}
              onClick={() => handleAssetSelect(asset)}
            >
              <div className={styles.assetCardHeader}>
                <span className={styles.categoryIcon}>
                  {asset.category === 'THREAT_ANALYSIS' && '🎯'}
                  {asset.category === 'GEOSPATIAL_DATA' && '🌍'}
                  {asset.category === 'SATELLITE_IMAGERY' && '🛰️'}
                  {/* Add more category icons */}
                </span>
                <div className={styles.trustBadge}>
                  {asset.trustScore}% trust
                </div>
              </div>
              
              <div className={styles.assetCardContent}>
                <h4>{asset.name}</h4>
                <p className={styles.assetPreview}>{asset.description.slice(0, 100)}...</p>
                
                <div className={styles.assetCardMeta}>
                  <span className={styles.sourceAgency}>{asset.sourceAgency}</span>
                  <span className={styles.classification}>{asset.classification}</span>
                </div>
              </div>
              
              <div className={styles.assetCardFooter}>
                <div className={styles.pricing}>
                  {asset.pricing.model === 'FREE' && <span>Free</span>}
                  {asset.pricing.model === 'TOKEN_BASED' && (
                    <span>{asset.pricing.tokenCost} tokens</span>
                  )}
                </div>
                <div className={styles.downloads}>
                  {asset.downloadCount} downloads
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.quickActions}>
        <button 
          className={styles.compareButton}
          onClick={() => {
            const topAssetIds = topAssets.slice(0, 2).map(a => a.id);
            handleCompareAssets(topAssetIds);
          }}
        >
          📊 Compare Assets
        </button>
        
        <button className={styles.filterButton}>
          🔍 Advanced Filters
        </button>
        
        <button className={styles.portfolioButton}>
          💼 My Portfolio
        </button>
      </div>

      {selectedAsset && (
        <AssetDetail
          asset={selectedAsset}
          onPurchase={handleAssetPurchase}
          onValidate={handleAssetValidate}
          onClose={() => setSelectedAsset(null)}
          isPurchasing={purchasingAsset === selectedAsset.id}
        />
      )}

      {comparisonAssets.length > 0 && (
        <AssetComparison
          assets={comparisonAssets}
          onSelect={(assetId) => {
            const asset = assets.find(a => a.id === assetId);
            if (asset) handleAssetSelect(asset);
            setComparisonAssets([]);
          }}
          onClose={() => setComparisonAssets([])}
        />
      )}
    </div>
  );
};

export default AssetTrading;
