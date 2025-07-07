import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './NewUserHint.module.css';

const NewUserHint: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Hide hint when navigating away from home page
    if (location.pathname !== '/') {
      setIsVisible(false);
      return;
    }

    // Check if this is the user's first time
    const hasSeenHint = localStorage.getItem('starcom-hint-seen');
    const hasVisitedTeams = localStorage.getItem('starcom-visited-teams');
    
    if (!hasSeenHint && !hasVisitedTeams) {
      setIsFirstTime(true);
      setIsVisible(true);
      // Auto-minimize after 5 seconds
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleGetStarted = () => {
    navigate('/teams');
    setIsVisible(false);
    localStorage.setItem('starcom-hint-seen', 'true');
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    localStorage.setItem('starcom-hint-seen', 'true');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('starcom-hint-seen', 'true');
  };

  if (!isVisible && !isFirstTime) return null;

  if (isMinimized) {
    return (
      <div className={styles.minimizedHint}>
        <button 
          className={styles.minimizedButton}
          onClick={() => setIsMinimized(false)}
          title="New to STARCOM? Get help finding your team"
        >
          🎓 New User?
        </button>
      </div>
    );
  }

  return (
    <div className={styles.newUserHint}>
      <div className={styles.hintCard}>
        <div className={styles.hintHeader}>
          <div className={styles.hintTitle}>
            <span className={styles.icon}>🎓</span>
            New to STARCOM?
          </div>
          <div className={styles.hintControls}>
            <button 
              className={styles.minimizeButton}
              onClick={handleMinimize}
              title="Minimize"
            >
              —
            </button>
            <button 
              className={styles.closeButton}
              onClick={handleDismiss}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className={styles.hintContent}>
          <p>Join a cyber investigation team to access group chat and start collaborating.</p>
          
          <div className={styles.quickTips}>
            <div className={styles.tip}>
              <strong>👥 Teams</strong> - Join or create investigation teams
            </div>
            <div className={styles.tip}>
              <strong>Ctrl+K</strong> - Quick access to all features
            </div>
          </div>
          
          <div className={styles.hintActions}>
            <button 
              className={styles.primaryAction}
              onClick={handleGetStarted}
            >
              Find Teams
            </button>
            <button 
              className={styles.secondaryAction}
              onClick={handleMinimize}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewUserHint;
