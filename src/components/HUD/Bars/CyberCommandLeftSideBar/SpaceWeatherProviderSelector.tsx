import React from 'react';
import { useSpaceWeatherContext } from '../../../../context/SpaceWeatherContext';
import styles from './SpaceWeatherProviderSelector.module.css';

const providers = [
  { key: 'legacy', label: 'Legacy', desc: '2 endpoints, basic features', icon: '⚡' },
  { key: 'enterprise', label: 'Enterprise', desc: '20+ endpoints, advanced processing', icon: '🚀' },
  { key: 'enhanced', label: 'Enhanced', desc: 'Full correlation, quality metrics', icon: '✨' }
];

const SpaceWeatherProviderSelector: React.FC = () => {
  const { currentProvider, switchProvider } = useSpaceWeatherContext();

  return (
    <div className={styles.providerSelector}>
      <div className={styles.selectorHeader}>
        <h4>SpaceWeather Provider</h4>
      </div>
      <div className={styles.providerButtons}>
        {providers.map(provider => (
          <button
            key={provider.key}
            className={`${styles.providerButton} ${currentProvider === provider.key ? styles.active : ''}`}
            onClick={() => switchProvider(provider.key as 'legacy' | 'enterprise' | 'enhanced')}
            title={provider.desc}
          >
            <span className={styles.providerIcon}>{provider.icon}</span>
            <span className={styles.providerLabel}>{provider.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpaceWeatherProviderSelector;
