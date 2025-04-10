import React from 'react';
import styles from './RightSideBar.module.css';

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

const RightSideBar: React.FC = () => {
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
              <img
                src={`https://www.google.com/s2/favicons?sz=64&domain_url=${button.url}`}
                alt=""
                className={styles.icon}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/path/to/default-icon.png'; // Fallback icon
                }}
              />
              <span className={styles.label}>{button.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSideBar;