import React, { useState } from 'react';
import styles from './RightSideBar.module.css';

//import iconAstroMarketTrader01a from 'src/assets/images/icons/x128/starcom_icon-astromarkettrader-01a.jpg';
import iconAstroMarketTrader02a from 'src/assets/images/icons/x128/starcom_icon-astromarkettrader-02a.jpg';
import iconAstroMarketTrader03a from 'src/assets/images/icons/x128/starcom_icon-astromarkettrader-03a.jpg';
//import iconAstroMarketTrader04a from 'src/assets/images/icons/x128/starcom_icon-astromarkettrader-04a.jpg';
//import iconAstroMarketTrader04b from 'src/assets/images/icons/x128/starcom_icon-astromarkettrader-04b.jpg';
import iconAstroMarketSeer from 'src/assets/images/icons/x128/starcom_icon-astromarketseer.jpg';
//import iconAstroMarketSeer01a from 'src/assets/images/icons/x128/starcom_icon-astromarketseer-01a.jpg';
//import iconAstrology01a from 'src/assets/images/icons/x128/starcom_icon-astrology-01a.jpg';
//import iconCryptoSentinel from 'src/assets/images/icons/x128/starcom_icon-cryptosentinel.jpg';
import iconCryptoSentinel01a from 'src/assets/images/icons/x128/starcom_icon-cryptosentinel-01a.jpg';
import iconCryptoWatchdog from 'src/assets/images/icons/x128/starcom_icon-cryptowatchdog.jpg';
//import iconDataFeed from 'src/assets/images/icons/x128/starcom_icon-datafeed.jpg';
//import iconDataFeed01a from 'src/assets/images/icons/x128/starcom_icon-datafeed-01a.jpg';
import iconDataFeed02a from 'src/assets/images/icons/x128/starcom_icon-datafeed-02a.jpg';
//import iconGlobalNetTrader from 'src/assets/images/icons/x128/starcom_icon-globalnettrader.jpg';
//import iconGlobalNetTrader01a from 'src/assets/images/icons/x128/starcom_icon-globalnettrader-01a.jpg';
import iconGlobalNetTrader02a from 'src/assets/images/icons/x128/starcom_icon-globalnettrader-02a.jpg';
import iconGlobalPulse from 'src/assets/images/icons/x128/starcom_icon-globalpulse.jpg';
import iconMarketAstrology01a from 'src/assets/images/icons/x128/starcom_icon-marketastrology-01a.jpg';
//import iconShield01a from 'src/assets/images/icons/x128/starcom_icon-shield-01a.jpg';

const iconMap: Record<string, string> = {
  'Crypto Sentinel': iconCryptoSentinel01a,
  'Gravity Trader': iconAstroMarketTrader03a, // Placeholder, update if correct icon is available
  'Global Pulse': iconGlobalPulse,
  'Data Feed': iconDataFeed02a,
  'Astro Market Trader': iconAstroMarketTrader02a,
  'Crypto Watchdog': iconCryptoWatchdog,
  'Astro Market Seer': iconAstroMarketSeer,
  'Market Astrology': iconMarketAstrology01a, // Placeholder, update if correct icon is available
  'Global Net Trader': iconGlobalNetTrader02a,
};

const buttonData = [
  { url: 'https://cryptosentinel.starcom.app/', label: 'Crypto Sentinel' },
  { url: 'https://gravitytrader.starcom.app/', label: 'Gravity Trader' },
  { url: 'https://globalpulse.starcom.app/', label: 'Global Pulse' },
  { url: 'https://datafeed.starcom.app', label: 'Data Feed' },
  { url: 'https://astromarkettrader.starcom.app/', label: 'Astro Market Trader' },
  { url: 'https://cryptowatchdog.starcom.app/', label: 'Crypto Watchdog' },
  { url: 'https://astromarketseer.starcom.app/', label: 'Astro Market Seer' },
  { url: 'https://marketastrology.starcom.app/', label: 'Market Astrology' },
  { url: 'https://globalnettrader.starcom.app/', label: 'Global Net Trader' },
];

const emojiFallbacks: Record<string, string> = {
  'Crypto Sentinel': '🛡️',
  'Gravity Trader': '🌌',
  'Global Pulse': '🌍',
  'Data Feed': '📊',
  'Astro Market Trader': '🌠',
  'Crypto Watchdog': '🐕',
  'Astro Market Seer': '🔮',
  'Market Astrology': '✨',
  'Global Net Trader': '🌐',
};

const RightSideBar: React.FC = () => {
  // Track which images failed to load
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const handleImgError = (label: string) => {
    setImgError((prev) => ({ ...prev, [label]: true }));
  };

  return (
    <div className={styles.rightSideBar}>
      <div className={styles.scrollContainer}>
        <div className={styles.scrollView}>
          {buttonData.map((button) => (
            <a
              key={button.label}
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.button}
              aria-label={`Open ${button.label}`}
            >
              {!imgError[button.label] && iconMap[button.label] && (
                <img
                  src={iconMap[button.label]}
                  alt=""
                  className={styles.icon}
                  onError={() => handleImgError(button.label)}
                  draggable={false}
                />
              )}
              {(imgError[button.label] || !iconMap[button.label]) && (
                <span className={styles.iconFallback}>{emojiFallbacks[button.label] || '❓'}</span>
              )}
              <span className={styles.label}>{button.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSideBar;