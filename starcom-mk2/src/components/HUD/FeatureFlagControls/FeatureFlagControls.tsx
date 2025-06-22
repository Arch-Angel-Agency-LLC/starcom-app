import React, { useState } from 'react';
import { useFeatureFlags, FeatureFlags } from '../../../utils/featureFlags';
import styles from './FeatureFlagControls.module.css';

interface FeatureFlagControlsProps {
  className?: string;
  onDismiss?: () => void;
}

const FeatureFlagControls: React.FC<FeatureFlagControlsProps> = ({ className, onDismiss }) => {
  const { updateFlag, ...flags } = useFeatureFlags();
  const [searchFilter, setSearchFilter] = useState('');
  const [showSection, setShowSection] = useState<{[key: string]: boolean}>({
    core: true,
    ai: false,
    collab: false,
    ux: false,
    dev: false
  });

  const handleToggle = (flagName: keyof FeatureFlags) => {
    updateFlag(flagName, !flags[flagName]);
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Group flags by category for more compact display
  const flagCategories = {
    core: [
      { key: 'enhancedContextEnabled', label: 'Enhanced Context' },
      { key: 'enhancedCenter', label: 'Enhanced Center' },
      { key: 'multiContextEnabled', label: 'Multi-Context' },
      { key: 'splitScreenEnabled', label: 'Split Screen' },
    ],
    ai: [
      { key: 'aiSuggestionsEnabled', label: 'AI Suggestions' },
      { key: 'threatHorizonEnabled', label: 'Threat Horizon' },
    ],
    collab: [
      { key: 'collaborationEnabled', label: 'Collaboration' },
      { key: 'multiAgencyEnabled', label: 'Multi-Agency' },
    ],
    ux: [
      { key: 'adaptiveInterfaceEnabled', label: 'Adaptive Interface' },
      { key: 'rtsEnhancementsEnabled', label: 'RTS Enhancements' },
    ],
    dev: [
      { key: 'uiTestingDiagnosticsEnabled', label: 'UI Testing' },
      { key: 'performanceMonitoringEnabled', label: 'Performance Monitor' },
      { key: 'performanceOptimizerEnabled', label: 'Performance Optimizer' },
      { key: 'securityHardeningEnabled', label: 'Security Hardening' },
    ]
  };

  // Filter flags based on search
  const filteredCategories = Object.fromEntries(
    Object.entries(flagCategories).map(([category, flags]) => [
      category,
      flags.filter(flag => 
        flag.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
        flag.key.toLowerCase().includes(searchFilter.toLowerCase())
      )
    ])
  );

  const toggleSection = (section: string) => {
    setShowSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = Object.keys(flags).length;

  return (
    <div className={`${styles.controls} ${className || ''}`}>
      {/* Compact Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Feature Flags</span>
          <div className={styles.headerActions}>
            <span className={styles.counter}>{enabledCount}/{totalCount}</span>
            {onDismiss && (
              <button 
                className={styles.dismissBtn}
                onClick={onDismiss}
                title="Close Feature Flags"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {/* Search Filter */}
        <input
          type="text"
          placeholder="Filter flags..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Compact Sections */}
      <div className={styles.sections}>
        {Object.entries(filteredCategories).map(([category, categoryFlags]) => {
          if (categoryFlags.length === 0) return null;
          
          const categoryLabels = {
            core: '🏗️ Core',
            ai: '🤖 AI', 
            collab: '👥 Collab',
            ux: '✨ UX',
            dev: '🔧 Dev'
          };

          const enabledInCategory = categoryFlags.filter(flag => flags[flag.key as keyof FeatureFlags]).length;
          
          return (
            <div key={category} className={styles.section}>
              <button 
                className={styles.sectionHeader}
                onClick={() => toggleSection(category)}
              >
                <span className={styles.sectionTitle}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
                <span className={styles.sectionCounter}>
                  {enabledInCategory}/{categoryFlags.length}
                </span>
                <span className={`${styles.sectionToggle} ${showSection[category] ? styles.expanded : ''}`}>
                  ▼
                </span>
              </button>
              
              {showSection[category] && (
                <div className={styles.flagList}>
                  {categoryFlags.map(flag => (
                    <label key={flag.key} className={styles.flag}>
                      <input
                        type="checkbox"
                        checked={flags[flag.key as keyof FeatureFlags]}
                        onChange={() => handleToggle(flag.key as keyof FeatureFlags)}
                        className={styles.checkbox}
                      />
                      <span className={styles.flagLabel}>{flag.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button 
          className={styles.quickBtn}
          onClick={() => Object.keys(flags).forEach(key => updateFlag(key as keyof FeatureFlags, false))}
          title="Disable all feature flags"
        >
          Disable All
        </button>
        <button 
          className={styles.quickBtn}
          onClick={() => {
            const devFlags = flagCategories.dev.map(f => f.key);
            devFlags.forEach(key => updateFlag(key as keyof FeatureFlags, true));
          }}
          title="Enable common dev flags"
        >
          Dev Mode
        </button>
      </div>
    </div>
  );
};

export default FeatureFlagControls;
