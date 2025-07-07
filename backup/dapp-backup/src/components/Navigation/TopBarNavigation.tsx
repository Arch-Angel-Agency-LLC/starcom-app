import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import WalletStatusMini from '../Auth/WalletStatusMini';
import styles from './TopBarNavigation.module.css';

const TopBarNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/teams', label: 'Teams', icon: '👥' },
    { path: '/investigations', label: 'Investigations', icon: '🔍' },
    { path: '/intel', label: 'Intel', icon: '📊' },
    { path: '/', label: 'Globe', icon: '🌐' }
  ];

  return (
    <nav className={styles.topNav}>
      {/* Logo/Brand */}
      <div className={styles.brand}>
        <button 
          onClick={() => navigate('/')}
          className={styles.logoButton}
        >
          <img 
            src="/assets/images/WingCommanderLogo-288x162.gif" 
            alt="Starcom Logo"
            className={styles.logo}
          />
          <span className={styles.brandText}>STARCOM</span>
        </button>
      </div>

      {/* Main Navigation */}
      <div className={styles.navItems}>
        {navigationItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${
              (item.path === '/' && location.pathname === '/') ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
                ? styles.active 
                : ''
            }`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* User Actions */}
      <div className={styles.userActions}>
        <WalletStatusMini />
        <button 
          className={styles.settingsButton}
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </nav>
  );
};

export default TopBarNavigation;
