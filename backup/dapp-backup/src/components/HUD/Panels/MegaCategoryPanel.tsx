import React, { useState } from 'react';
import { useGlobalCommand } from '../../../hooks/useUnifiedGlobalCommand';
import { OperationMode } from '../../../context/UnifiedGlobalCommandContext';
import styles from './MegaCategoryPanel.module.css';

// Import existing NOAA integration for EcoNatural -> PLANETARY migration
import CompactNOAAControls from '../Bars/LeftSideBar/CompactNOAAControls';

interface MegaCategoryPanelProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface CategoryConfig {
  id: OperationMode;
  label: string;
  icon: string;
  color: string;
  description: string;
  subCategories: SubCategoryConfig[];
}

interface SubCategoryConfig {
  id: string;
  label: string;
  icon: string;
  types: string[];
  isActive: boolean;
}

const MEGA_CATEGORIES: CategoryConfig[] = [
  {
    id: 'PLANETARY',
    label: 'Planetary Ops',
    icon: '🌍',
    color: '#4ade80',
    description: 'Earth-based operations and monitoring',
    subCategories: [
      {
        id: 'weather',
        label: 'Weather Systems',
        icon: '🌩️',
        types: ['EarthWeather', 'SpaceWeather', 'StarWeather', 'ClimateModels'],
        isActive: true
      },
      {
        id: 'transport',
        label: 'Transport Networks',
        icon: '✈️',
        types: ['Aircraft', 'Ships', 'Vehicles', 'Railways'],
        isActive: false
      },
      {
        id: 'infrastructure',
        label: 'Infrastructure',
        icon: '🏗️',
        types: ['PowerGrids', 'Communications', 'Internet', 'Supply'],
        isActive: false
      },
      {
        id: 'ecological',
        label: 'Ecological',
        icon: '🌿',
        types: ['Disasters', 'Seismic', 'Volcanic', 'Biological'],
        isActive: false
      }
    ]
  },
  {
    id: 'SPACE',
    label: 'Space Ops',
    icon: '🛰️',
    color: '#3b82f6',
    description: 'Orbital and space-based operations',
    subCategories: [
      {
        id: 'assets',
        label: 'Space Assets',
        icon: '🛰️',
        types: ['Satellites', 'SpaceStations', 'Spacecraft', 'Debris'],
        isActive: false
      },
      {
        id: 'navigation',
        label: 'Navigation',
        icon: '🧭',
        types: ['GPS', 'GNSS', 'Beacons', 'Orbits'],
        isActive: false
      },
      {
        id: 'communications',
        label: 'Space Comms',
        icon: '📡',
        types: ['Relays', 'DeepSpace', 'Emergency'],
        isActive: false
      },
      {
        id: 'space-weather',
        label: 'Space Weather',
        icon: '☀️',
        types: ['Solar', 'Magnetic', 'Radiation', 'Cosmic'],
        isActive: false
      }
    ]
  },
  {
    id: 'CYBER',
    label: 'Cyber Ops',
    icon: '🔒',
    color: '#8b5cf6',
    description: 'Cyber warfare and intelligence operations',
    subCategories: [
      {
        id: 'intelligence',
        label: 'Intelligence',
        icon: '📋',
        types: ['OSINT', 'HUMINT', 'SIGINT', 'Reports'],
        isActive: true
      },
      {
        id: 'security',
        label: 'Security',
        icon: '🛡️',
        types: ['CrisisZones', 'Threats', 'Vulnerabilities', 'Incidents'],
        isActive: false
      },
      {
        id: 'networks',
        label: 'Networks',
        icon: '🌐',
        types: ['Infrastructure', 'Traffic', 'Topology', 'Performance'],
        isActive: false
      },
      {
        id: 'financial',
        label: 'Financial',
        icon: '💰',
        types: ['Markets', 'Crypto', 'DeFi', 'Trading'],
        isActive: false
      }
    ]
  },
  {
    id: 'STELLAR',
    label: 'Stellar Ops',
    icon: '⭐',
    color: '#f59e0b',
    description: 'Deep space and stellar operations',
    subCategories: [
      {
        id: 'monitoring',
        label: 'Deep Space',
        icon: '🔭',
        types: ['StarWeather', 'SolarEvents', 'GalacticEvents'],
        isActive: false
      },
      {
        id: 'markets',
        label: 'Astro Markets',
        icon: '📈',
        types: ['PlanetaryHarmonics', 'AstroTrading', 'CommodityFlow'],
        isActive: false
      },
      {
        id: 'stellar-navigation',
        label: 'Navigation',
        icon: '🗺️',
        types: ['StellarBeacons', 'GalacticMaps', 'DeepSpaceRoutes'],
        isActive: false
      },
      {
        id: 'stellar-comms',
        label: 'Comms',
        icon: '📡',
        types: ['InterstellarRelay', 'QuantumComm', 'Signals'],
        isActive: false
      }
    ]
  }
];

const MegaCategoryPanel: React.FC<MegaCategoryPanelProps> = ({ 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const { state, setOperationMode } = useGlobalCommand();
  const [expandedCategory, setExpandedCategory] = useState<OperationMode | null>(state.operationMode);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>('weather');

  const handleCategorySelect = (category: OperationMode) => {
    setOperationMode(category);
    setExpandedCategory(category);
    
    // Auto-select first sub-category when switching
    const categoryConfig = MEGA_CATEGORIES.find(c => c.id === category);
    if (categoryConfig && categoryConfig.subCategories && categoryConfig.subCategories.length > 0) {
      setActiveSubCategory(categoryConfig.subCategories[0].id);
    }
  };

  const handleSubCategorySelect = (subCategoryId: string) => {
    setActiveSubCategory(subCategoryId);
  };

  const renderCategoryButton = (category: CategoryConfig) => {
    const isActive = state.operationMode === category.id;
    const isExpanded = expandedCategory === category.id;
    
    return (
      <div key={category.id} className={styles.categorySection}>
        <button
          className={`${styles.categoryButton} ${isActive ? styles.active : ''}`}
          onClick={() => handleCategorySelect(category.id)}
          style={{ '--category-color': category.color } as React.CSSProperties}
          title={category.description}
        >
          <span className={styles.categoryIcon}>{category.icon}</span>
          {!isCollapsed && (
            <>
              <span className={styles.categoryLabel}>{category.label}</span>
              <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                ▶
              </span>
            </>
          )}
        </button>
        
        {!isCollapsed && isExpanded && (
          <div className={styles.subCategoryList}>
            {category.subCategories.map(subCategory => (
              <button
                key={subCategory.id}
                className={`${styles.subCategoryButton} ${
                  activeSubCategory === subCategory.id ? styles.activeSubCategory : ''
                }`}
                onClick={() => handleSubCategorySelect(subCategory.id)}
              >
                <span className={styles.subCategoryIcon}>{subCategory.icon}</span>
                <span className={styles.subCategoryLabel}>{subCategory.label}</span>
                {subCategory.isActive && (
                  <span className={styles.activeIndicator}>●</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderActiveLayersSection = () => {
    if (isCollapsed) return null;
    
    const activeLayers = state.activeLayers.filter(layer => layer.isActive);
    
    return (
      <div className={styles.activeLayersSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📊</span>
          <span className={styles.sectionTitle}>Active Layers</span>
          <span className={styles.layerCount}>{activeLayers.length}</span>
        </div>
        <div className={styles.layerList}>
          {activeLayers.slice(0, 5).map(layer => (
            <div key={layer.id} className={styles.layerItem}>
              <span className={styles.layerDot} style={{ background: '#00ff00' }} />
              <span className={styles.layerName}>{layer.name}</span>
              <span className={styles.layerVisibility}>
                {Math.round(layer.opacity * 100)}%
              </span>
            </div>
          ))}
          {activeLayers.length > 5 && (
            <div className={styles.layerItem}>
              <span className={styles.moreLayersText}>+{activeLayers.length - 5} more</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLegacyIntegration = () => {
    // Temporary: Show existing NOAA controls for PLANETARY operations
    if (!isCollapsed && state.operationMode === 'PLANETARY' && activeSubCategory === 'weather') {
      return (
        <div className={styles.legacyIntegration}>
          <div className={styles.legacyHeader}>Space Weather (NOAA)</div>
          <CompactNOAAControls />
        </div>
      );
    }
    return null;
  };

  const renderQuickActions = () => {
    if (isCollapsed) return null;
    
    return (
      <div className={styles.quickActionsSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>⚡</span>
          <span className={styles.sectionTitle}>Quick Actions</span>
        </div>
        <div className={styles.quickActionGrid}>
          <button className={styles.quickActionButton} title="Emergency Mode">
            <span className={styles.quickActionIcon}>🚨</span>
            Emergency
          </button>
          <button className={styles.quickActionButton} title="Analysis Mode">
            <span className={styles.quickActionIcon}>📊</span>
            Analysis
          </button>
          <button className={styles.quickActionButton} title="Focus Mode">
            <span className={styles.quickActionIcon}>🎯</span>
            Focus
          </button>
          <button className={styles.quickActionButton} title="Record Mission">
            <span className={styles.quickActionIcon}>⏺️</span>
            Record
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.megaCategoryPanel} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.headerContent}>
          <span className={styles.headerIcon}>🎛️</span>
          {!isCollapsed && <span className={styles.headerTitle}>Operations</span>}
        </div>
        <button 
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Category Navigation */}
      <div className={styles.categoryNav}>
        {MEGA_CATEGORIES.map(renderCategoryButton)}
      </div>

      {/* Active Layers Section */}
      {renderActiveLayersSection()}

      {/* Legacy Integration (temporary) */}
      {renderLegacyIntegration()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Footer Status */}
      {!isCollapsed && (
        <div className={styles.panelFooter}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Mode:</span>
            <span className={styles.statusValue}>{state.operationMode}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Priority:</span>
            <span className={`${styles.statusValue} ${styles[`priority${state.missionState.priorityLevel}`]}`}>
              {state.missionState.priorityLevel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MegaCategoryPanel;
